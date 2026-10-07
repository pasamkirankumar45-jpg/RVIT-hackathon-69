import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Cpu,
  Key,
  FileCheck,
  AlertTriangle,
  RefreshCw,
  Terminal,
  Activity,
} from 'lucide-react';
import { api } from '../services/api';
import { AuditLogEntry } from '../types';

interface SecurityInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  e2eEnabled: boolean;
}

export const SecurityInspector: React.FC<SecurityInspectorProps> = ({
  isOpen,
  onClose,
  e2eEnabled,
}) => {
  const [activeTab, setActiveTab] = useState<'threat_model' | 'guarantees' | 'audit_log'>('threat_model');
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl text-zinc-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">
                Security Architecture & Byzantine Threat Model
              </h2>
              <p className="text-xs text-zinc-400">
                Formal security boundaries, cryptographic protocols, and audit logs
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-zinc-200 transition"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800 px-6 gap-6 bg-zinc-900/50 text-xs font-medium">
          <button
            onClick={() => setActiveTab('threat_model')}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'threat_model'
                ? 'border-sky-500 text-sky-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Threat Model Analysis
          </button>
          <button
            onClick={() => setActiveTab('guarantees')}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'guarantees'
                ? 'border-sky-500 text-sky-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            Guarantees vs Byzantine Limits
          </button>
          <button
            onClick={() => setActiveTab('audit_log')}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'audit_log'
                ? 'border-sky-500 text-sky-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Live Audit Trail ({logs.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 text-xs leading-relaxed space-y-4">
          {activeTab === 'threat_model' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-zinc-900/80 border border-zinc-800">
                  <div className="flex items-center gap-2 font-semibold text-zinc-100 mb-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    1. Replay & Duplicate Operation Mitigation
                  </div>
                  <p className="text-zinc-400">
                    Every edit generates an immutable cryptographic UUID <code className="text-sky-300">operation_id</code>.
                    Replicas and the server maintain a deduplication set. Replayed operations are discarded immediately without mutating RGA atom states.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-zinc-900/80 border border-zinc-800">
                  <div className="flex items-center gap-2 font-semibold text-zinc-100 mb-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    2. Causal Ordering & Logical Clocks
                  </div>
                  <p className="text-zinc-400">
                    Vector Clocks <code className="text-sky-300">[userId: logical_clock]</code> maintain strict causal dependency.
                    Out-of-order packets from asynchronous network hops are buffered until preceding causal states arrive.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-zinc-900/80 border border-zinc-800">
                  <div className="flex items-center gap-2 font-semibold text-zinc-100 mb-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    3. End-to-End Encryption (E2EE)
                  </div>
                  <p className="text-zinc-400">
                    When active, document deltas are encrypted on the browser using <code className="text-sky-300">AES-GCM (256-bit)</code> via Web Crypto API.
                    The intermediate WebSocket and database relays cannot inspect plaintext content.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-zinc-900/80 border border-zinc-800">
                  <div className="flex items-center gap-2 font-semibold text-zinc-100 mb-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    4. Sandboxed Code Execution
                  </div>
                  <p className="text-zinc-400">
                    Execution runs in isolated subprocesses with restricted environment variables, execution timeouts (5s), and pre-execution AST static checks for dangerous syscalls (<code className="text-red-400">os.system, subprocess</code>).
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800">
                <h4 className="font-semibold text-zinc-200 mb-2">Role-Based Access Control (RBAC) Matrix</h4>
                <div className="grid grid-cols-4 gap-2 font-mono text-[11px] text-center">
                  <div className="p-2 bg-zinc-950 rounded border border-zinc-800">
                    <div className="font-bold text-sky-400">OWNER</div>
                    <div className="text-zinc-400 text-[10px] mt-1">Full Control, Delete Workspace, Manage Roles</div>
                  </div>
                  <div className="p-2 bg-zinc-950 rounded border border-zinc-800">
                    <div className="font-bold text-emerald-400">ADMIN</div>
                    <div className="text-zinc-400 text-[10px] mt-1">Add Members, Create/Delete Files, Full Edit</div>
                  </div>
                  <div className="p-2 bg-zinc-950 rounded border border-zinc-800">
                    <div className="font-bold text-amber-400">EDITOR</div>
                    <div className="text-zinc-400 text-[10px] mt-1">CRDT Real-Time Edit, Run Python Code</div>
                  </div>
                  <div className="p-2 bg-zinc-950 rounded border border-zinc-800">
                    <div className="font-bold text-zinc-400">VIEWER</div>
                    <div className="text-zinc-400 text-[10px] mt-1">Read-Only View, Live Presence, Execution Inspection</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'guarantees' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
                <div className="flex items-center gap-2 font-semibold mb-1">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Engineering Transparency: Byzantine Resilience vs Formal BFT
                </div>
                <p className="text-zinc-300 text-xs">
                  In production engineering, we do not fake mathematical guarantees. Below is the explicit distinction between what CodeSync proves vs known theoretical limits.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
                  <h4 className="font-semibold text-emerald-400 mb-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    What CodeSync Guarantees (SEC)
                  </h4>
                  <ul className="list-disc list-inside space-y-1.5 text-zinc-400">
                    <li><strong className="text-zinc-200">Strong Eventual Consistency (SEC):</strong> RGA atom commutativity ensures any two replicas that receive the same operations converge to identical content.</li>
                    <li><strong className="text-zinc-200">Replay Protection:</strong> Duplicate operations with identical IDs are rejected deterministically.</li>
                    <li><strong className="text-zinc-200">Monotonic Clocks:</strong> Clock rollbacks by compromised clients do not corrupt historical atom chains.</li>
                    <li><strong className="text-zinc-200">Safe Offline Queuing:</strong> Client queues edits offline and converges cleanly upon reconnecting.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
                  <h4 className="font-semibold text-amber-400 mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    Boundaries & Limitations (Byzantine Faults)
                  </h4>
                  <ul className="list-disc list-inside space-y-1.5 text-zinc-400">
                    <li><strong className="text-zinc-200">Malicious Content:</strong> A peer with legitimate EDITOR rights can insert spam/garbage text; CRDT will consistently replicate the garbage across all replicas without corrupting structural state.</li>
                    <li><strong className="text-zinc-200">Equivocation Attacks:</strong> Without formal quorum consensus (e.g. PBFT <code className="text-sky-300">n ≥ 3f + 1</code>), a Byzantine client sending differing clocks to different peers requires server reconciliation.</li>
                    <li><strong className="text-zinc-200">MicroVM Isolation:</strong> For multi-tenant hostile code execution at cloud scale, Docker/subprocess should be backed by Firecracker MicroVMs or gVisor.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'audit_log' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 text-xs">Security Event Stream</span>
                <button
                  onClick={fetchLogs}
                  className="flex items-center gap-1 px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-sky-400 text-xs"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              <div className="border border-zinc-800 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400">
                      <th className="p-2.5">Time</th>
                      <th className="p-2.5">User</th>
                      <th className="p-2.5">Action</th>
                      <th className="p-2.5">Details</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-mono">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-900/40">
                        <td className="p-2.5 text-zinc-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="p-2.5 text-zinc-300 font-semibold">{log.username}</td>
                        <td className="p-2.5 text-sky-400">{log.action}</td>
                        <td className="p-2.5 text-zinc-400 max-w-xs truncate">{log.details}</td>
                        <td className="p-2.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              log.status === 'SUCCESS'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : log.status === 'REJECTED'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
