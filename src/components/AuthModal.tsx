import React, { useState } from 'react';
import { User, LogIn, UserPlus, Key, Shield } from 'lucide-react';
import { api } from '../services/api';
import { User as UserType } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserType, token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isRegister) {
        const res = await api.register(username, email, password);
        onLoginSuccess(res.user, res.token);
      } else {
        const res = await api.login(email, password);
        onLoginSuccess(res.user, res.token);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const quickSwitch = (u: { username: string; email: string; color: string; id: string }) => {
    const mockUser: UserType = {
      id: u.id,
      username: u.username,
      email: u.email,
      avatarColor: u.color,
    };
    onLoginSuccess(mockUser, `jwt_access_${u.id}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-md shadow-2xl text-zinc-200 p-6">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Key className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-zinc-100">
              {isRegister ? 'Create CodeSync Account' : 'Sign In to CodeSync'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded text-zinc-400">
            ✕
          </button>
        </div>

        {/* Quick Switch Profiles */}
        <div className="my-3 p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg">
          <div className="text-[11px] font-semibold text-zinc-400 mb-2">
            Fast Profile Switch (Test Multi-User CRDT)
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() =>
                quickSwitch({
                  username: 'Manikanta',
                  email: 'manikanta@codesync.dev',
                  color: '#10b981',
                  id: 'usr_manikanta_101',
                })
              }
              className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded flex flex-col items-center gap-1 text-[11px] transition"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-500 font-bold text-white text-[10px] flex items-center justify-center">
                M
              </div>
              <span>Manikanta</span>
            </button>
            <button
              onClick={() =>
                quickSwitch({
                  username: 'Rahul',
                  email: 'rahul@codesync.dev',
                  color: '#3b82f6',
                  id: 'usr_rahul_102',
                })
              }
              className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded flex flex-col items-center gap-1 text-[11px] transition"
            >
              <div className="w-5 h-5 rounded-full bg-blue-500 font-bold text-white text-[10px] flex items-center justify-center">
                R
              </div>
              <span>Rahul</span>
            </button>
            <button
              onClick={() =>
                quickSwitch({
                  username: 'Sai',
                  email: 'sai@codesync.dev',
                  color: '#f59e0b',
                  id: 'usr_sai_103',
                })
              }
              className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded flex flex-col items-center gap-1 text-[11px] transition"
            >
              <div className="w-5 h-5 rounded-full bg-amber-500 font-bold text-white text-[10px] flex items-center justify-center">
                S
              </div>
              <span>Sai</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-2.5 mb-3 bg-red-950/40 border border-red-500/40 rounded text-red-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {isRegister && (
            <div>
              <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="developer_1"
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-200 outline-none focus:border-sky-500"
              />
            </div>
          )}

          <div>
            <label className="text-[11px] font-medium text-zinc-400 block mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-200 outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-zinc-400 block mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-200 outline-none focus:border-sky-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold transition mt-2 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : isRegister ? 'Register Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-zinc-800 text-center text-xs text-zinc-400">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-sky-400 hover:underline"
          >
            {isRegister
              ? 'Already have an account? Sign in'
              : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
};
