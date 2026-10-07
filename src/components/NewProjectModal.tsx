import React, { useState } from 'react';
import { FolderPlus, Lock, Shield } from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string, e2eEncrypted: boolean) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [e2eEncrypted, setE2eEncrypted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim(), description.trim(), e2eEncrypted);
    setName('');
    setDescription('');
    setE2eEncrypted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-md shadow-2xl text-zinc-200 p-6">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
              <FolderPlus className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-zinc-100">Create New Project</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded text-zinc-400">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs mt-4">
          <div>
            <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
              Project Name *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. distributed-crdt-service"
              className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-200 outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Real-time collaborative Python workspace..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-200 outline-none focus:border-sky-500 resize-none"
            />
          </div>

          <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg flex items-start gap-2.5">
            <input
              type="checkbox"
              id="e2e-check"
              checked={e2eEncrypted}
              onChange={(e) => setE2eEncrypted(e.target.checked)}
              className="mt-0.5 rounded border-zinc-700 bg-zinc-950 text-emerald-500 focus:ring-0"
            />
            <label htmlFor="e2e-check" className="cursor-pointer">
              <div className="font-semibold text-zinc-200 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                Enable Client-Side End-to-End Encryption
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Encrypts all CRDT operations with AES-GCM 256 before transmission. Server relays ciphertext only.
              </p>
            </label>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition disabled:opacity-50"
            >
              Create Workspace
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
