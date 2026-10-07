export type UserRole = 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER';

export interface User {
  id: string;
  username: string;
  email: string;
  role?: UserRole;
  avatarColor: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  e2eEncrypted?: boolean;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  username: string;
  email: string;
  role: UserRole;
  joinedAt: string;
}

export interface FileItem {
  id: string;
  projectId: string;
  name: string;
  path: string;
  parentId: string | null;
  isDirectory: boolean;
  content: string;
  version: number;
  updatedAt: string;
  language: string;
}

export type OperationType = 'insert' | 'delete' | 'replace';

export interface VectorClock {
  [userId: string]: number;
}

export interface CRDTOperation {
  operation_id: string;
  user_id: string;
  document_id: string;
  timestamp: number;
  logical_clock: number;
  operation_type: OperationType;
  position: number;
  content: string;
  length?: number;
  parent_version: number;
  vector_clock?: VectorClock;
  encrypted?: boolean;
  ciphertext?: string;
  iv?: string;
  signature?: string;
}

export interface DocumentSnapshot {
  id: string;
  document_id: string;
  version: number;
  content: string;
  author: string;
  timestamp: number;
  comment?: string;
}

export interface CursorPosition {
  userId: string;
  username: string;
  color: string;
  fileId: string;
  lineNumber: number;
  column: number;
  selection?: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
  lastActive: number;
}

export interface ExecutionJobResult {
  id: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'timeout';
  code: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
  memoryKb?: number;
  timestamp: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  username: string;
  action: string;
  details: string;
  ipAddress?: string;
  status: 'SUCCESS' | 'WARNING' | 'REJECTED';
}

export type ConnectionStatus = 'connected' | 'synchronizing' | 'offline';

export type UnitTestStatus = 'PASSED' | 'FAILED' | 'ERROR';

export interface PythonTestCaseResult {
  id: string;
  name: string;
  className: string;
  description?: string;
  status: UnitTestStatus;
  durationMs: number;
  error?: string | null;
}

export interface PythonTestSuiteResult {
  testFile: string;
  total: number;
  passed: number;
  failed: number;
  errors: number;
  durationMs: number;
  timestamp: number;
  results: PythonTestCaseResult[];
  rawStdout?: string;
  rawStderr?: string;
}
