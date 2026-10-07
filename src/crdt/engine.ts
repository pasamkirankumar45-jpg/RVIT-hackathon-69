import { CRDTOperation, VectorClock } from '../types';

export interface CharAtom {
  id: string;          // format: `${clock}@${client}` or 'ROOT'
  originId: string;    // predecessor char id at the time of insertion
  value: string;       // character content
  clock: number;       // logical clock
  client: string;      // client id
  deleted: boolean;    // tombstone flag
}

export class CRDTDocument {
  public documentId: string;
  public atoms: CharAtom[] = [];
  public vectorClock: VectorClock = {};
  public seenOperations: Set<string> = new Set();
  public operationsLog: CRDTOperation[] = [];
  public currentVersion: number = 0;

  constructor(documentId: string, initialContent: string = '') {
    this.documentId = documentId;
    // Initialize root atom
    this.atoms = [
      {
        id: 'ROOT',
        originId: '',
        value: '',
        clock: 0,
        client: 'SYSTEM',
        deleted: true,
      },
    ];

    if (initialContent) {
      let prevId = 'ROOT';
      for (let i = 0; i < initialContent.length; i++) {
        const atom: CharAtom = {
          id: `0:${i}@INIT`,
          originId: prevId,
          value: initialContent[i],
          clock: 0,
          client: 'INIT',
          deleted: false,
        };
        this.atoms.push(atom);
        prevId = atom.id;
      }
    }
  }

  /**
   * Returns current visible plain text content of the document.
   */
  public getText(): string {
    let result = '';
    for (let i = 1; i < this.atoms.length; i++) {
      if (!this.atoms[i].deleted) {
        result += this.atoms[i].value;
      }
    }
    return result;
  }

  /**
   * Maps a visible string index to the corresponding atom index in this.atoms.
   */
  public findAtomIndexByVisiblePos(visiblePos: number): number {
    if (visiblePos <= 0) return 0; // ROOT
    let count = 0;
    for (let i = 1; i < this.atoms.length; i++) {
      if (!this.atoms[i].deleted) {
        count++;
        if (count === visiblePos) {
          return i;
        }
      }
    }
    return this.atoms.length - 1;
  }

  /**
   * Generates a local insert operation at visible position.
   */
  public localInsert(
    userId: string,
    position: number,
    text: string
  ): CRDTOperation[] {
    const ops: CRDTOperation[] = [];
    const clientClock = (this.vectorClock[userId] || 0) + 1;
    this.vectorClock[userId] = clientClock;

    const op: CRDTOperation = {
      operation_id: `op_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      user_id: userId,
      document_id: this.documentId,
      timestamp: Date.now(),
      logical_clock: clientClock,
      operation_type: 'insert',
      position,
      content: text,
      parent_version: this.currentVersion,
      vector_clock: { ...this.vectorClock },
    };

    this.applyOperation(op);
    ops.push(op);
    return ops;
  }

  /**
   * Generates a local delete operation at visible position.
   */
  public localDelete(
    userId: string,
    position: number,
    length: number
  ): CRDTOperation[] {
    const ops: CRDTOperation[] = [];
    const clientClock = (this.vectorClock[userId] || 0) + 1;
    this.vectorClock[userId] = clientClock;

    const op: CRDTOperation = {
      operation_id: `op_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      user_id: userId,
      document_id: this.documentId,
      timestamp: Date.now(),
      logical_clock: clientClock,
      operation_type: 'delete',
      position,
      content: '',
      length,
      parent_version: this.currentVersion,
      vector_clock: { ...this.vectorClock },
    };

    this.applyOperation(op);
    ops.push(op);
    return ops;
  }

  /**
   * Applies any CRDTOperation (local or remote) with duplicate detection and conflict-free merge.
   */
  public applyOperation(op: CRDTOperation): boolean {
    // 1. Duplicate detection (Byzantine/replay protection)
    if (this.seenOperations.has(op.operation_id)) {
      return false; // Already processed
    }
    this.seenOperations.add(op.operation_id);
    this.operationsLog.push(op);

    // 2. Update Vector Clock
    const prevClock = this.vectorClock[op.user_id] || 0;
    this.vectorClock[op.user_id] = Math.max(prevClock, op.logical_clock);
    this.currentVersion++;

    // 3. Process operation type
    if (op.operation_type === 'insert') {
      this.executeRGAInsert(op);
    } else if (op.operation_type === 'delete') {
      this.executeRGADelete(op);
    } else if (op.operation_type === 'replace') {
      // Replace is compound: delete then insert
      this.executeRGAReplace(op);
    }

    return true;
  }

  private executeRGAInsert(op: CRDTOperation) {
    const text = op.content;
    if (!text || text.length === 0) return;

    // Find predecessor atom
    const predAtomIndex = this.findAtomIndexByVisiblePos(op.position);
    let insertAfterIndex = predAtomIndex;
    const originId = this.atoms[predAtomIndex] ? this.atoms[predAtomIndex].id : 'ROOT';

    for (let charIdx = 0; charIdx < text.length; charIdx++) {
      const char = text[charIdx];
      const newAtom: CharAtom = {
        id: `${op.logical_clock}:${charIdx}@${op.user_id}`,
        originId,
        value: char,
        clock: op.logical_clock,
        client: op.user_id,
        deleted: false,
      };

      // Conflict-free insertion: find exact deterministic insertion index
      // RGA rule: insert after predecessor, but if siblings exist (atoms inserted after same origin),
      // order by descending clock, then descending client ID.
      let targetIdx = insertAfterIndex + 1;
      while (targetIdx < this.atoms.length) {
        const nextAtom = this.atoms[targetIdx];
        if (nextAtom.originId !== originId) {
          break; // past the sibling cluster
        }
        // Deterministic total order tie-breaker
        if (
          newAtom.clock < nextAtom.clock ||
          (newAtom.clock === nextAtom.clock && newAtom.client < nextAtom.client)
        ) {
          targetIdx++;
        } else {
          break;
        }
      }

      this.atoms.splice(targetIdx, 0, newAtom);
      insertAfterIndex = targetIdx;
    }
  }

  private executeRGADelete(op: CRDTOperation) {
    const length = op.length || 1;
    let visibleCount = 0;
    let deletedCount = 0;

    // Iterate through atoms and tombstone the range
    for (let i = 1; i < this.atoms.length && deletedCount < length; i++) {
      if (!this.atoms[i].deleted) {
        if (visibleCount >= op.position) {
          this.atoms[i].deleted = true;
          deletedCount++;
        }
        visibleCount++;
      }
    }
  }

  private executeRGAReplace(op: CRDTOperation) {
    if (op.length && op.length > 0) {
      this.executeRGADelete(op);
    }
    this.executeRGAInsert(op);
  }

  /**
   * Reset / sync with a full snapshot if necessary.
   */
  public resetFromSnapshot(content: string, version: number, vectorClock: VectorClock = {}) {
    this.atoms = [
      {
        id: 'ROOT',
        originId: '',
        value: '',
        clock: 0,
        client: 'SYSTEM',
        deleted: true,
      },
    ];

    let prevId = 'ROOT';
    for (let i = 0; i < content.length; i++) {
      const atom: CharAtom = {
        id: `0:${i}@INIT`,
        originId: prevId,
        value: content[i],
        clock: 0,
        client: 'INIT',
        deleted: false,
      };
      this.atoms.push(atom);
      prevId = atom.id;
    }

    this.currentVersion = version;
    this.vectorClock = { ...vectorClock };
  }
}

/**
 * MergeEngine coordinates multiple CRDTOperation sequences and computes
 * conflict-free convergence.
 */
export class MergeEngine {
  public static merge(doc: CRDTDocument, remoteOps: CRDTOperation[]): boolean {
    let anyApplied = false;
    // Sort operations causally by logical_clock then timestamp
    const sortedOps = [...remoteOps].sort((a, b) => {
      if (a.logical_clock !== b.logical_clock) {
        return a.logical_clock - b.logical_clock;
      }
      return a.timestamp - b.timestamp;
    });

    for (const op of sortedOps) {
      const applied = doc.applyOperation(op);
      if (applied) {
        anyApplied = true;
      }
    }
    return anyApplied;
  }
}
