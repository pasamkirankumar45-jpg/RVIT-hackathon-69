import {
  Project,
  FileItem,
  ProjectMember,
  ExecutionJobResult,
  AuditLogEntry,
  User,
  PythonTestSuiteResult,
} from '../types';

const BASE_URL = '';

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }
    return res.json();
  },

  async register(username: string, email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Registration failed');
    }
    return res.json();
  },

  async getMe(token: string): Promise<{ user: User }> {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  // Projects
  async getProjects(): Promise<Project[]> {
    const res = await fetch(`${BASE_URL}/api/projects`);
    return res.json();
  },

  async createProject(name: string, description: string, ownerId: string, e2eEncrypted: boolean): Promise<Project> {
    const res = await fetch(`${BASE_URL}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, ownerId, e2eEncrypted }),
    });
    return res.json();
  },

  async deleteProject(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${BASE_URL}/api/projects/${id}`, { method: 'DELETE' });
    return res.json();
  },

  async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    const res = await fetch(`${BASE_URL}/api/projects/${projectId}/members`);
    return res.json();
  },

  async addProjectMember(projectId: string, email: string, role: string): Promise<ProjectMember[]> {
    const res = await fetch(`${BASE_URL}/api/projects/${projectId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    });
    return res.json();
  },

  // Files
  async getProjectFiles(projectId: string): Promise<FileItem[]> {
    const res = await fetch(`${BASE_URL}/api/projects/${projectId}/files`);
    return res.json();
  },

  async createFile(
    projectId: string,
    name: string,
    isDirectory: boolean = false,
    parentId: string | null = null,
    content: string = ''
  ): Promise<FileItem> {
    const res = await fetch(`${BASE_URL}/api/projects/${projectId}/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, isDirectory, parentId, content }),
    });
    return res.json();
  },

  async updateFile(fileId: string, content?: string, name?: string, versionComment?: string): Promise<FileItem> {
    const res = await fetch(`${BASE_URL}/api/files/${fileId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, name, versionComment }),
    });
    return res.json();
  },

  async deleteFile(fileId: string): Promise<{ success: boolean }> {
    const res = await fetch(`${BASE_URL}/api/files/${fileId}`, { method: 'DELETE' });
    return res.json();
  },

  async getFileHistory(fileId: string): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/api/files/${fileId}/history`);
    return res.json();
  },

  async restoreFileVersion(fileId: string, versionId: string): Promise<{ success: boolean; file: FileItem }> {
    const res = await fetch(`${BASE_URL}/api/files/${fileId}/history/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ versionId }),
    });
    return res.json();
  },

  // Execution
  async runPythonCode(code: string, timeoutMs: number = 5000): Promise<ExecutionJobResult> {
    const res = await fetch(`${BASE_URL}/api/execution/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, timeoutMs }),
    });
    return res.json();
  },

  async runPythonUnittests(
    testFileName: string,
    testCode: string,
    workspaceFiles: FileItem[] = [],
    timeoutMs: number = 8000
  ): Promise<PythonTestSuiteResult> {
    console.log(`[CodeSync Runner] Executing unittest for '${testFileName}' (${workspaceFiles.length} workspace files)...`);
    const res = await fetch(`${BASE_URL}/api/execution/unittest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testFileName, testCode, workspaceFiles, timeoutMs }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `Server returned HTTP ${res.status}` }));
      throw new Error(err.details || err.error || `Unittest runner failed with status ${res.status}`);
    }
    const data = await res.json();
    console.log(`[CodeSync Runner] Unittest finished for '${testFileName}': ${data.passed}/${data.total} passed`);
    return data;
  },

  // Gemini AI Assistant
  async queryAiAssistant(
    action: string,
    code: string,
    instruction?: string,
    filename?: string,
    signal?: AbortSignal
  ): Promise<{
    action: string;
    explanation: string;
    suggestedCode: string | null;
    model?: string;
    durationMs?: number;
    isFallback?: boolean;
    notice?: string;
  }> {
    try {
      console.log(`[CodeSync AI Client] Sending '${action}' request for ${filename || 'file'} (code length: ${code.length} chars)...`);
      const res = await fetch(`${BASE_URL}/api/gemini/assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, code, instruction, filename }),
        signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `Server returned HTTP ${res.status}` }));
        const errorMessage = err.details || err.error || err.suggestion || `AI Assistant request failed with status ${res.status}`;
        console.error(`[CodeSync AI Client] Server error (${res.status}):`, errorMessage);
        throw new Error(errorMessage);
      }

      const data = await res.json();
      console.log(`[CodeSync AI Client] Received response for '${action}' (model: ${data.model || 'default'}, isFallback: ${data.isFallback})`);
      return data;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.warn('[CodeSync AI Client] Request was cancelled by the user.');
        throw new Error('AI analysis was cancelled.');
      }
      if (err instanceof TypeError && err.message.includes('fetch')) {
        console.error('[CodeSync AI Client] Network error connecting to AI service:', err);
        throw new Error('Unable to connect to the CodeSync backend service. Please check your network connection.');
      }
      throw err;
    }
  },

  // Audit Logs
  async getAuditLogs(): Promise<AuditLogEntry[]> {
    const res = await fetch(`${BASE_URL}/api/audit`);
    return res.json();
  },
};
