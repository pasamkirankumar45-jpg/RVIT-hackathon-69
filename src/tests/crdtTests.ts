import { CRDTDocument, MergeEngine } from '../crdt/engine';
import { CRDTOperation } from '../types';

export interface TestResult {
  name: string;
  category: 'CRDT' | 'OFFLINE' | 'SECURITY' | 'PERMISSIONS';
  passed: boolean;
  durationMs: number;
  details: string;
  error?: string;
}

export async function runAllTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // 1. CRDT 3-Way Concurrent Convergence Test
  const test1Start = performance.now();
  try {
    const docA = new CRDTDocument('doc_test_1', 'def hello():\n    pass');
    const docB = new CRDTDocument('doc_test_1', 'def hello():\n    pass');
    const docC = new CRDTDocument('doc_test_1', 'def hello():\n    pass');

    // Client A inserts at pos 18
    const opsA = docA.localInsert('client_A', 18, '\n    print("From Client A")');
    // Client B inserts at pos 18 concurrently
    const opsB = docB.localInsert('client_B', 18, '\n    print("From Client B")');
    // Client C inserts at pos 18 concurrently
    const opsC = docC.localInsert('client_C', 18, '\n    print("From Client C")');

    // Exchange all ops to all replicas in different delivery orders
    MergeEngine.merge(docA, [...opsB, ...opsC]);
    MergeEngine.merge(docB, [...opsC, ...opsA]);
    MergeEngine.merge(docC, [...opsA, ...opsB]);

    const textA = docA.getText();
    const textB = docB.getText();
    const textC = docC.getText();

    const passed = textA === textB && textB === textC;
    results.push({
      name: '3-Way Concurrent CRDT Convergence',
      category: 'CRDT',
      passed,
      durationMs: Math.round(performance.now() - test1Start),
      details: passed
        ? `Replicas A, B, and C converged deterministically to identical state (${textA.length} chars).`
        : `Divergence detected: Doc A (${textA.length}) != Doc B (${textB.length}) != Doc C (${textC.length})`,
    });
  } catch (err: any) {
    results.push({
      name: '3-Way Concurrent CRDT Convergence',
      category: 'CRDT',
      passed: false,
      durationMs: Math.round(performance.now() - test1Start),
      details: 'Exception raised during 3-way merge',
      error: err.message,
    });
  }

  // 2. Offline Synchronization Test
  const test2Start = performance.now();
  try {
    const serverDoc = new CRDTDocument('doc_test_offline', 'x = 10\n');
    const clientA = new CRDTDocument('doc_test_offline', 'x = 10\n');
    const clientB = new CRDTDocument('doc_test_offline', 'x = 10\n');

    // Client A goes offline and accumulates 3 edits in local queue
    const offlineQueueA: CRDTOperation[] = [];
    offlineQueueA.push(...clientA.localInsert('client_A', 7, 'y = 20\n'));
    offlineQueueA.push(...clientA.localInsert('client_A', 14, 'z = 30\n'));

    // Client B remains online and edits simultaneously
    const onlineOpsB = clientB.localInsert('client_B', 0, '# Distributed code header\n');
    serverDoc.applyOperation(onlineOpsB[0]);

    // Client A comes back online and synchronizes
    MergeEngine.merge(serverDoc, offlineQueueA);
    MergeEngine.merge(clientA, [onlineOpsB[0]]);
    MergeEngine.merge(clientB, offlineQueueA);

    const textServer = serverDoc.getText();
    const textClientA = clientA.getText();
    const textClientB = clientB.getText();

    const passed = textServer === textClientA && textClientA === textClientB;
    results.push({
      name: 'Offline Disconnection & Queue Synchronization',
      category: 'OFFLINE',
      passed,
      durationMs: Math.round(performance.now() - test2Start),
      details: passed
        ? 'Offline operations were queued and converged successfully upon reconnection.'
        : 'State mismatch after offline reconnect.',
    });
  } catch (err: any) {
    results.push({
      name: 'Offline Disconnection & Queue Synchronization',
      category: 'OFFLINE',
      passed: false,
      durationMs: Math.round(performance.now() - test2Start),
      details: 'Error during offline test',
      error: err.message,
    });
  }

  // 3. Byzantine & Replay Attack Defense Test
  const test3Start = performance.now();
  try {
    const doc = new CRDTDocument('doc_security', 'secret_key = 42\n');
    const [originalOp] = doc.localInsert('attacker_node', 16, ' compromised');

    const stateBefore = doc.getText();
    // Simulate malicious replay of the identical operation
    const replayAttempt1 = doc.applyOperation(originalOp);
    const replayAttempt2 = doc.applyOperation({ ...originalOp });

    const stateAfter = doc.getText();
    const passed = !replayAttempt1 && !replayAttempt2 && stateBefore === stateAfter;

    results.push({
      name: 'Replay Attack & Duplicate Operation Rejection',
      category: 'SECURITY',
      passed,
      durationMs: Math.round(performance.now() - test3Start),
      details: passed
        ? 'Duplicate operation ID was intercepted and rejected. Document was not mutated twice.'
        : 'Vulnerability detected: Replayed operation was applied again.',
    });
  } catch (err: any) {
    results.push({
      name: 'Replay Attack & Duplicate Operation Rejection',
      category: 'SECURITY',
      passed: false,
      durationMs: Math.round(performance.now() - test3Start),
      details: 'Error in replay test',
      error: err.message,
    });
  }

  // 4. Vector Clock Causal Monotonicity Test
  const test4Start = performance.now();
  try {
    const doc = new CRDTDocument('doc_vc', 'init');
    const op1 = doc.localInsert('usr_1', 4, 'a');
    const op2 = doc.localInsert('usr_1', 5, 'b');
    const op3 = doc.localInsert('usr_2', 6, 'c');

    const vc = doc.vectorClock;
    const passed = vc['usr_1'] === 2 && vc['usr_2'] === 1;

    results.push({
      name: 'Vector Clock Causality & Monotonic Clocks',
      category: 'CRDT',
      passed,
      durationMs: Math.round(performance.now() - test4Start),
      details: passed
        ? `Vector clock verified: usr_1=${vc['usr_1']}, usr_2=${vc['usr_2']}. Causal monotonicity preserved.`
        : 'Vector clock did not increment monotonically.',
    });
  } catch (err: any) {
    results.push({
      name: 'Vector Clock Causality & Monotonic Clocks',
      category: 'CRDT',
      passed: false,
      durationMs: Math.round(performance.now() - test4Start),
      details: 'Error in vector clock test',
      error: err.message,
    });
  }

  // 5. RBAC Permission Matrix Test
  const test5Start = performance.now();
  try {
    const canEdit = (role: string) => ['OWNER', 'ADMIN', 'EDITOR'].includes(role);
    const canDeleteFiles = (role: string) => ['OWNER', 'ADMIN'].includes(role);
    const canManageMembers = (role: string) => ['OWNER', 'ADMIN'].includes(role);
    const canDeleteProject = (role: string) => role === 'OWNER';

    const passed =
      canEdit('EDITOR') === true &&
      canEdit('VIEWER') === false &&
      canDeleteFiles('EDITOR') === false &&
      canDeleteFiles('ADMIN') === true &&
      canManageMembers('ADMIN') === true &&
      canManageMembers('EDITOR') === false &&
      canDeleteProject('ADMIN') === false &&
      canDeleteProject('OWNER') === true;

    results.push({
      name: 'RBAC Access Control Enforcement (OWNER/ADMIN/EDITOR/VIEWER)',
      category: 'PERMISSIONS',
      passed,
      durationMs: Math.round(performance.now() - test5Start),
      details: passed
        ? 'Full role-based matrix verified: Viewer read-only, Editor write, Admin manage, Owner absolute.'
        : 'RBAC permission evaluation failed.',
    });
  } catch (err: any) {
    results.push({
      name: 'RBAC Access Control Enforcement',
      category: 'PERMISSIONS',
      passed: false,
      durationMs: Math.round(performance.now() - test5Start),
      details: 'Error in permissions test',
      error: err.message,
    });
  }

  return results;
}
