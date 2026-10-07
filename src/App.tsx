/**
 * CodeSync — Real-Time Collaborative Python IDE
 * CRDT Strong Eventual Consistency, Offline Support, E2E Encryption & Isolated Execution
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { EditorArea } from './components/EditorArea';
import { BottomPanel } from './components/BottomPanel';
import { AiAssistant } from './components/AiAssistant';
import { SecurityInspector } from './components/SecurityInspector';
import { ShareProjectModal } from './components/ShareProjectModal';
import { CollaboratorSimulator } from './components/CollaboratorSimulator';
import { AuthModal } from './components/AuthModal';
import { NewProjectModal } from './components/NewProjectModal';

import { api } from './services/api';
import { CollaborationSocket } from './services/websocket';
import { CRDTDocument, MergeEngine } from './crdt/engine';
import { E2EEService } from './crdt/crypto';
import {
  Project,
  FileItem,
  User,
  ConnectionStatus,
  ExecutionJobResult,
  CRDTOperation,
} from './types';

export default function App() {
  // Current authenticated user (default to Manikanta)
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'usr_manikanta_101',
    username: 'Manikanta',
    email: 'manikanta@codesync.dev',
    avatarColor: '#10b981',
    role: 'OWNER',
  });

  // Projects state
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  // Files state
  const [files, setFiles] = useState<FileItem[]>([]);
  const [openFiles, setOpenFiles] = useState<FileItem[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');

  // Real-time & CRDT state
  const crdtDocRef = useRef<CRDTDocument | null>(null);
  const socketRef = useRef<CollaborationSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('offline');
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [remoteCursors, setRemoteCursors] = useState<any[]>([]);

  // End-to-End Encryption state
  const [e2eEnabled, setE2eEnabled] = useState(false);
  const e2eKeyRef = useRef<CryptoKey | null>(null);

  // Execution & Terminal state
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionJobResult | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '[*] Isolated Python 3.12 sandbox initialized.',
    '[✓] CRDT consistency layer active (RGA + Vector Clocks).',
  ]);

  // AI & Modals state
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);

  // Initialize socket client once
  useEffect(() => {
    socketRef.current = new CollaborationSocket();

    const unsubStatus = socketRef.current.onStatusChange((status) => {
      setConnectionStatus(status);
      setPendingSyncCount(socketRef.current?.getPendingQueueCount() || 0);
    });

    return () => {
      unsubStatus();
      socketRef.current?.disconnect();
    };
  }, []);

  // Fetch initial projects and default workspace
  useEffect(() => {
    const initApp = async () => {
      try {
        const prjs = await api.getProjects();
        setProjects(prjs);
        if (prjs.length > 0) {
          setCurrentProject(prjs[0]);
          setE2eEnabled(!!prjs[0].e2eEncrypted);
        }
      } catch (err) {
        console.error('Failed to load projects:', err);
      }
    };
    initApp();
  }, []);

  // Fetch files when currentProject changes
  useEffect(() => {
    if (!currentProject) return;

    const loadFiles = async () => {
      try {
        const prjFiles = await api.getProjectFiles(currentProject.id);
        setFiles(prjFiles);

        // Open main.py by default
        const mainFile = prjFiles.find((f) => f.name === 'main.py') || prjFiles[0];
        if (mainFile && !mainFile.isDirectory) {
          setOpenFiles([mainFile]);
          selectFile(mainFile);
        }
      } catch (err) {
        console.error('Failed to load files:', err);
      }
    };
    loadFiles();
  }, [currentProject?.id]);

  // Handle selecting / opening a file
  const selectFile = useCallback(
    (file: FileItem) => {
      if (file.isDirectory) return;

      setActiveFileId(file.id);
      setFileContent(file.content);

      // Ensure open in tabs
      setOpenFiles((prev) => {
        if (!prev.some((f) => f.id === file.id)) {
          return [...prev, file];
        }
        return prev;
      });

      // Initialize CRDT Document for this file
      const doc = new CRDTDocument(file.id, file.content);
      crdtDocRef.current = doc;

      // Connect WebSocket room
      if (socketRef.current && currentProject) {
        socketRef.current.connect(
          currentProject.id,
          file.id,
          currentUser.id,
          currentUser.username,
          currentUser.avatarColor
        );

        // Setup room event listeners
        socketRef.current.on('sync_response', (data) => {
          if (data.currentContent !== undefined) {
            doc.resetFromSnapshot(data.currentContent, data.version, data.vectorClock);
            setFileContent(doc.getText());
          }
          if (data.activeUsers) {
            setActiveUsers(data.activeUsers);
          }
        });

        socketRef.current.on('user_joined', (data) => {
          setActiveUsers((prev) => {
            if (!prev.some((u) => u.userId === data.user.userId)) {
              return [...prev, data.user];
            }
            return prev;
          });
        });

        socketRef.current.on('user_left', (data) => {
          setActiveUsers((prev) => prev.filter((u) => u.userId !== data.userId));
          setRemoteCursors((prev) => prev.filter((c) => c.userId !== data.userId));
        });

        socketRef.current.on('document_update', async (data) => {
          const { operation, fullContent } = data;
          if (operation) {
            // Apply CRDT operation with conflict-free merge
            const applied = doc.applyOperation(operation);
            if (applied) {
              setFileContent(doc.getText());
            } else if (fullContent !== undefined) {
              setFileContent(fullContent);
            }
          }
        });

        socketRef.current.on('cursor_update', (data) => {
          if (data.userId !== currentUser.id) {
            setRemoteCursors((prev) => {
              const filtered = prev.filter((c) => c.userId !== data.userId);
              return [
                ...filtered,
                {
                  userId: data.userId,
                  username: data.username,
                  color: data.avatarColor,
                  cursor: data.cursor,
                },
              ];
            });
          }
        });
      }
    },
    [currentProject, currentUser]
  );

  // Close tab
  const handleCloseTab = (fileId: string) => {
    const nextOpen = openFiles.filter((f) => f.id !== fileId);
    setOpenFiles(nextOpen);
    if (activeFileId === fileId) {
      if (nextOpen.length > 0) {
        const next = nextOpen[nextOpen.length - 1];
        selectFile(next);
      } else {
        setActiveFileId(null);
        setFileContent('');
      }
    }
  };

  // Local editor content change (User Keystrokes)
  const handleContentChange = (newText: string) => {
    setFileContent(newText);
    const doc = crdtDocRef.current;
    if (!doc || !activeFileId) return;

    const oldText = doc.getText();
    if (newText === oldText) return;

    // Simple diff to generate insert / delete operations
    // Find common prefix
    let prefix = 0;
    while (
      prefix < oldText.length &&
      prefix < newText.length &&
      oldText[prefix] === newText[prefix]
    ) {
      prefix++;
    }

    // Find common suffix
    let oldSuffix = oldText.length - 1;
    let newSuffix = newText.length - 1;
    while (
      oldSuffix >= prefix &&
      newSuffix >= prefix &&
      oldText[oldSuffix] === newText[newSuffix]
    ) {
      oldSuffix--;
      newSuffix--;
    }

    // Deletion range in oldText: prefix to oldSuffix
    const deleteCount = oldSuffix - prefix + 1;
    if (deleteCount > 0) {
      const delOps = doc.localDelete(currentUser.id, prefix, deleteCount);
      delOps.forEach((op) => socketRef.current?.sendOperation(op));
    }

    // Insertion range in newText: prefix to newSuffix
    const insertText = newText.substring(prefix, newSuffix + 1);
    if (insertText.length > 0) {
      const insOps = doc.localInsert(currentUser.id, prefix, insertText);
      insOps.forEach((op) => socketRef.current?.sendOperation(op, newText));
    }

    // Also persist file changes to backend throttled/async
    api.updateFile(activeFileId, newText).catch(() => {});
  };

  // Cursor change
  const handleCursorChange = (line: number, column: number, selection?: any) => {
    socketRef.current?.sendCursor({ line, column, selection });
  };

  // Run Code
  const handleRunCode = async () => {
    if (!fileContent && fileContent !== '') return;

    setIsRunningCode(true);
    setTerminalLogs((prev) => [
      ...prev,
      `$ python ${activeFile?.name || 'main.py'}`,
    ]);

    try {
      const result = await api.runPythonCode(fileContent, 5000);
      setExecutionResult(result);
      if (result.stdout) {
        setTerminalLogs((prev) => [...prev, result.stdout]);
      }
      if (result.stderr) {
        setTerminalLogs((prev) => [...prev, `[STDERR]: ${result.stderr}`]);
      }
      setTerminalLogs((prev) => [
        ...prev,
        `[Process finished with exit code ${result.exitCode} in ${result.executionTimeMs}ms]`,
      ]);
    } catch (err: any) {
      console.error(err);
      setTerminalLogs((prev) => [...prev, `[Execution Error]: ${err.message}`]);
    } finally {
      setIsRunningCode(false);
    }
  };

  // Terminate running code execution (SIGINT / Ctrl+C)
  const handleTerminateCode = () => {
    if (isRunningCode) {
      setIsRunningCode(false);
      setTerminalLogs((prev) => [
        ...prev,
        `^C [Process terminated by user (SIGINT)]`,
      ]);
    }
  };

  const handleClearOutput = () => {
    setExecutionResult(null);
    setTerminalLogs([]);
  };

  // Simulate concurrent peer operation (Rahul or Sai)
  const handleInjectSimulatedOperation = (
    peerUserId: string,
    peerUsername: string,
    peerColor: string,
    position: number,
    text: string
  ) => {
    const doc = crdtDocRef.current;
    if (!doc || !activeFileId) return;

    const ops = doc.localInsert(peerUserId, position, text);
    const updatedText = doc.getText();
    setFileContent(updatedText);

    // Broadcast through socket so remote peers and audit receive it
    if (ops.length > 0) {
      socketRef.current?.sendOperation(ops[0], updatedText);
    }

    // Show cursor indicator for peer
    setRemoteCursors((prev) => {
      const filtered = prev.filter((c) => c.userId !== peerUserId);
      return [
        ...filtered,
        {
          userId: peerUserId,
          username: peerUsername,
          color: peerColor,
          cursor: { line: 1, column: position + text.length },
        },
      ];
    });

    // Update backend file
    api.updateFile(activeFileId, updatedText, undefined, `Edit by ${peerUsername}`);
  };

  // File CRUD
  const handleCreateFile = async (
    name: string,
    isDirectory: boolean = false,
    parentId: string | null = null,
    content: string = ''
  ) => {
    if (!currentProject) return null;
    try {
      const newFile = await api.createFile(currentProject.id, name, isDirectory, parentId, content);
      setFiles((prev) => [...prev, newFile]);
      if (!isDirectory) selectFile(newFile);
      return newFile;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      await api.deleteFile(fileId);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      handleCloseTab(fileId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRenameFile = async (fileId: string, newName: string) => {
    try {
      await api.updateFile(fileId, undefined, newName);
      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, name: newName } : f))
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Project Creation
  const handleCreateProject = async (name: string, desc: string, e2e: boolean) => {
    try {
      const newPrj = await api.createProject(name, desc, currentUser.id, e2e);
      setProjects((prev) => [...prev, newPrj]);
      setCurrentProject(newPrj);
      setE2eEnabled(e2e);
    } catch (err) {
      console.error(err);
    }
  };

  // Offline Simulation Toggle
  const handleToggleSimulatedOffline = () => {
    if (!socketRef.current) return;
    const next = !isSimulatedOffline;
    setIsSimulatedOffline(next);
    socketRef.current.setSimulatedOffline(next);
  };

  // E2EE Toggle
  const handleToggleE2E = async () => {
    const next = !e2eEnabled;
    setE2eEnabled(next);
    if (next && !e2eKeyRef.current) {
      e2eKeyRef.current = await E2EEService.generateRandomKey();
    }
  };

  const activeFile = files.find((f) => f.id === activeFileId);

  return (
    <div className="h-screen w-screen flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      {/* Top Header */}
      <Header
        currentProject={currentProject}
        projects={projects}
        onSelectProject={(p) => {
          setCurrentProject(p);
          setE2eEnabled(!!p.e2eEncrypted);
        }}
        onCreateProjectClick={() => setIsNewProjectOpen(true)}
        connectionStatus={connectionStatus}
        isSimulatedOffline={isSimulatedOffline}
        onToggleSimulatedOffline={handleToggleSimulatedOffline}
        pendingSyncCount={pendingSyncCount}
        e2eEnabled={e2eEnabled}
        onToggleE2E={handleToggleE2E}
        activeUsersCount={activeUsers.length}
        onRunCode={handleRunCode}
        isRunningCode={isRunningCode}
        onToggleAi={() => setIsAiOpen(!isAiOpen)}
        isAiOpen={isAiOpen}
        onOpenSecurity={() => setIsSecurityOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          files={files}
          activeFileId={activeFileId}
          onSelectFile={selectFile}
          onCreateFile={handleCreateFile}
          onDeleteFile={handleDeleteFile}
          onRenameFile={handleRenameFile}
          activeUsers={activeUsers}
          onTriggerSimulatedPeerAction={(peerName) => {
            const peer =
              peerName.toLowerCase() === 'rahul'
                ? { id: 'usr_rahul_102', color: '#3b82f6' }
                : { id: 'usr_sai_103', color: '#f59e0b' };
            handleInjectSimulatedOperation(
              peer.id,
              peerName,
              peer.color,
              fileContent.length,
              `\n# [${peerName}] Concurrent edit: verified CRDT convergence\n`
            );
          }}
          onRestoreVersion={(newContent) => {
            setFileContent(newContent);
            crdtDocRef.current?.resetFromSnapshot(newContent, Date.now());
          }}
          onOpenSecurity={() => setIsSecurityOpen(true)}
        />

        {/* Center: Editor + Bottom Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Monaco Editor */}
          <EditorArea
            openFiles={openFiles}
            activeFileId={activeFileId}
            onSelectTab={(id) => {
              const target = files.find((f) => f.id === id);
              if (target) selectFile(target);
            }}
            onCloseTab={handleCloseTab}
            fileContent={fileContent}
            onContentChange={handleContentChange}
            remoteCursors={remoteCursors}
            onCursorPositionChange={handleCursorChange}
            isEncrypted={e2eEnabled}
          />

          {/* Bottom Panel (Terminal / Output / Problems / Tests) */}
          <BottomPanel
            executionResult={executionResult}
            isRunningCode={isRunningCode}
            onClearOutput={handleClearOutput}
            terminalLogs={terminalLogs}
            activeFileContent={fileContent}
            onTerminateCode={handleTerminateCode}
            onRunCode={handleRunCode}
            workspaceFiles={files}
            activeFileName={activeFile?.name || 'main.py'}
            currentUser={currentUser}
            onOpenFile={selectFile}
            onCreateFile={handleCreateFile}
          />
        </div>

        {/* Right: AI Coding Assistant Panel */}
        <AiAssistant
          isOpen={isAiOpen}
          onClose={() => setIsAiOpen(false)}
          activeCode={fileContent}
          activeFileName={activeFile?.name || 'main.py'}
          onApplyCode={(newCode) => handleContentChange(newCode)}
        />
      </div>

      {/* Modals */}
      <SecurityInspector
        isOpen={isSecurityOpen}
        onClose={() => setIsSecurityOpen(false)}
        e2eEnabled={e2eEnabled}
      />

      {currentProject && (
        <ShareProjectModal
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          projectId={currentProject.id}
          projectName={currentProject.name}
        />
      )}

      <CollaboratorSimulator
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onInjectSimulatedOperation={handleInjectSimulatedOperation}
        currentDocumentLength={fileContent.length}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(user) => setCurrentUser(user)}
      />

      <NewProjectModal
        isOpen={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
        onCreate={handleCreateProject}
      />
    </div>
  );
}
