import React, { useState, useEffect } from 'react';
import { Share2, Users, Shield, Plus, Trash2, Check, UserPlus } from 'lucide-react';
import { api } from '../services/api';
import { ProjectMember, UserRole } from '../types';

interface ShareProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

export const ShareProjectModal: React.FC<ShareProjectModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
}) => {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('EDITOR');
  const [loading, setLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchMembers = async () => {
    try {
      const data = await api.getProjectMembers(projectId);
      setMembers(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isOpen) fetchMembers();
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const updated = await api.addProjectMember(projectId, email.trim(), role);
      setMembers(updated);
      setEmail('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-lg shadow-2xl text-zinc-200 p-6">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">Share Workspace</h3>
              <p className="text-xs text-zinc-400">{projectName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded text-zinc-400">
            ✕
          </button>
        </div>

        <div className="py-4 space-y-4 text-xs">
          {/* Quick link copy */}
          <div className="flex items-center gap-2 p-2 bg-zinc-900 border border-zinc-800 rounded-lg">
            <input
              type="text"
              readOnly
              value={window.location.href}
              className="bg-transparent text-zinc-400 flex-1 outline-none text-[11px] truncate"
            />
            <button
              onClick={copyShareLink}
              className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded font-medium text-[11px] transition shrink-0"
            >
              {copiedLink ? 'Copied!' : 'Copy Link'}
            </button>
          </div>

          {/* Add member form */}
          <form onSubmit={handleAddMember} className="space-y-2">
            <label className="text-[11px] font-semibold text-zinc-300">Invite Collaborator</label>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="developer@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-200 outline-none focus:border-sky-500"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-200 outline-none"
              >
                <option value="ADMIN">ADMIN</option>
                <option value="EDITOR">EDITOR</option>
                <option value="VIEWER">VIEWER</option>
              </select>
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition disabled:opacity-50 flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Invite
              </button>
            </div>
          </form>

          {/* Members List */}
          <div className="space-y-2 pt-2">
            <div className="text-[11px] font-semibold text-zinc-400">Current Members ({members.length})</div>
            <div className="max-h-48 overflow-y-auto space-y-1.5 divide-y divide-zinc-800/60">
              {members.map((m) => (
                <div key={m.id} className="pt-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-[10px] text-zinc-200">
                      {m.username[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-zinc-200">{m.username}</div>
                      <div className="text-[10px] text-zinc-500">{m.email}</div>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      m.role === 'OWNER'
                        ? 'bg-purple-500/20 text-purple-400'
                        : m.role === 'ADMIN'
                        ? 'bg-sky-500/20 text-sky-400'
                        : m.role === 'EDITOR'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
