import { CRDTOperation, ConnectionStatus, CursorPosition } from '../types';

type MessageHandler = (data: any) => void;

export class CollaborationSocket {
  private ws: WebSocket | null = null;
  private projectId: string = '';
  private fileId: string = '';
  private userId: string = '';
  private username: string = '';
  private avatarColor: string = '';
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();

  private status: ConnectionStatus = 'offline';
  private simulatedOffline: boolean = false;
  private pendingOperationsQueue: CRDTOperation[] = [];
  private reconnectTimer: any = null;
  private pingInterval: any = null;

  constructor() {
    // Listen to browser network changes
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));

      // Restore stored queue if exists
      try {
        const saved = localStorage.getItem('codesync_offline_queue');
        if (saved) {
          this.pendingOperationsQueue = JSON.parse(saved);
        }
      } catch {
        // Ignore storage error
      }
    }
  }

  public connect(
    projectId: string,
    fileId: string,
    userId: string,
    username: string,
    avatarColor: string
  ) {
    this.projectId = projectId;
    this.fileId = fileId;
    this.userId = userId;
    this.username = username;
    this.avatarColor = avatarColor;

    if (this.simulatedOffline || !navigator.onLine) {
      this.setStatus('offline');
      return;
    }

    this.initSocket();
  }

  private initSocket() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/projects/${this.projectId}/files/${this.fileId}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.setStatus('synchronizing');

        // Send join_room
        this.sendRaw({
          type: 'join_room',
          projectId: this.projectId,
          fileId: this.fileId,
          userId: this.userId,
          username: this.username,
          avatarColor: this.avatarColor,
        });

        // Flush offline queue if any
        this.flushPendingQueue();

        // Start ping heartbeat
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.sendRaw({ type: 'ping' });
          }
        }, 15000);

        this.setStatus('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const listeners = this.handlers.get(data.type);
          if (listeners) {
            listeners.forEach((handler) => handler(data));
          }
        } catch (err) {
          console.error('WS parse error:', err);
        }
      };

      this.ws.onclose = () => {
        if (!this.simulatedOffline) {
          this.setStatus('offline');
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = () => {
        this.setStatus('offline');
      };
    } catch (err) {
      this.setStatus('offline');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      if (!this.simulatedOffline && navigator.onLine && (!this.ws || this.ws.readyState !== WebSocket.OPEN)) {
        this.initSocket();
      }
    }, 3000);
  }

  public setSimulatedOffline(offline: boolean) {
    this.simulatedOffline = offline;
    if (offline) {
      if (this.ws) {
        try {
          this.ws.close();
        } catch {}
        this.ws = null;
      }
      this.setStatus('offline');
    } else {
      if (navigator.onLine) {
        this.initSocket();
      }
    }
  }

  public isSimulatedOffline(): boolean {
    return this.simulatedOffline;
  }

  private handleNetworkChange(isOnline: boolean) {
    if (!isOnline || this.simulatedOffline) {
      this.setStatus('offline');
      if (this.ws) {
        try {
          this.ws.close();
        } catch {}
        this.ws = null;
      }
    } else {
      this.initSocket();
    }
  }

  public sendOperation(operation: CRDTOperation, fullContent?: string) {
    if (this.status !== 'connected' || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      // Buffer operation for offline synchronization
      this.pendingOperationsQueue.push(operation);
      this.persistQueue();
      return;
    }

    this.sendRaw({
      type: 'document_update',
      operation,
      fullContent,
    });
  }

  public sendCursor(cursor: { line: number; column: number; selection?: any }) {
    if (this.status === 'connected' && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendRaw({
        type: 'cursor_update',
        cursor,
      });
    }
  }

  public requestSync() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendRaw({ type: 'sync_request' });
    }
  }

  private flushPendingQueue() {
    if (this.pendingOperationsQueue.length === 0) return;

    this.setStatus('synchronizing');
    const ops = [...this.pendingOperationsQueue];
    this.pendingOperationsQueue = [];
    this.persistQueue();

    // Send operations sequentially
    for (const op of ops) {
      this.sendRaw({
        type: 'document_update',
        operation: op,
      });
    }

    setTimeout(() => {
      this.setStatus('connected');
    }, 500);
  }

  private persistQueue() {
    try {
      localStorage.setItem('codesync_offline_queue', JSON.stringify(this.pendingOperationsQueue));
    } catch {}
  }

  public getPendingQueueCount(): number {
    return this.pendingOperationsQueue.length;
  }

  private sendRaw(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  public on(event: string, handler: MessageHandler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  public off(event: string, handler: MessageHandler) {
    const set = this.handlers.get(event);
    if (set) set.delete(handler);
  }

  public onStatusChange(listener: (status: ConnectionStatus) => void) {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  private setStatus(newStatus: ConnectionStatus) {
    this.status = newStatus;
    this.statusListeners.forEach((l) => l(newStatus));
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public disconnect() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
    this.setStatus('offline');
  }
}
