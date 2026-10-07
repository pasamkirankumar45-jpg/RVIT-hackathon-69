import React, { useState } from 'react';
import {
  Play,
  Share2,
  ShieldCheck,
  Sparkles,
  Wifi,
  WifiOff,
  RefreshCw,
  Lock,
  Users,
  ChevronDown,
  Plus,
  Terminal,
  Activity,
  User as UserIcon,
  LogOut,
  Sliders,
} from 'lucide-react';
import { Project, ConnectionStatus, User } from '../types';

interface HeaderProps {
  currentProject: Project | null;
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onCreateProjectClick: () => void;
  connectionStatus: ConnectionStatus;
  isSimulatedOffline: boolean;
  onToggleSimulatedOffline: () => void;
  pendingSyncCount: number;
  e2eEnabled: boolean;
  onToggleE2E: () => void;
  activeUsersCount: number;
  onRunCode: () => void;
  isRunningCode: boolean;
  onToggleAi: () => void;
  isAiOpen: boolean;
  onOpenSecurity: () => void;
  onOpenShare: () => void;
  onOpenSimulator: () => void;
  currentUser: User;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentProject,
  projects,
  onSelectProject,
  onCreateProjectClick,
  connectionStatus,
  isSimulatedOffline,
  onToggleSimulatedOffline,
  pendingSyncCount,
  e2eEnabled,
  onToggleE2E,
  activeUsersCount,
  onRunCode,
  isRunningCode,
  onToggleAi,
  isAiOpen,
  onOpenSecurity,
  onOpenShare,
  onOpenSimulator,
  currentUser,
  onOpenAuth,
}) => {
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Connected
          </span>
        );
      case 'synchronizing':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Synchronizing ({pendingSyncCount})
          </span>
        );
      case 'offline':
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            Offline {pendingSyncCount > 0 && `(${pendingSyncCount} queued)`}
          </span>
        );
    }
  };

  return (
    <header className="h-14 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-3 text-zinc-200 select-none z-30">
      {/* Left: Branding & Project selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 pr-2 border-r border-zinc-800">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-sky-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 font-mono font-bold text-white text-base">
            CS
          </div>
          <div>
            <div className="font-bold text-sm leading-tight tracking-wide flex items-center gap-1.5 text-zinc-100">
              CodeSync
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                CRDT
              </span>
            </div>
            <div className="text-[10px] text-zinc-500 leading-tight">Collaborative Python IDE</div>
          </div>
        </div>

        {/* Project Selector */}
        <div className="relative">
          <button
            onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md transition text-zinc-200"
          >
            <span className="max-w-[160px] truncate font-medium">
              {currentProject?.name || 'Select Project'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          {projectDropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-64 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl py-1 z-50">
              <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Workspaces
              </div>
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onSelectProject(p);
                    setProjectDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-zinc-800 transition ${
                    p.id === currentProject?.id ? 'bg-zinc-800/60 text-sky-400 font-medium' : 'text-zinc-300'
                  }`}
                >
                  <span className="truncate">{p.name}</span>
                  {p.e2eEncrypted && <Lock className="w-3 h-3 text-emerald-400 shrink-0 ml-1" />}
                </button>
              ))}
              <div className="border-t border-zinc-800 mt-1 pt-1">
                <button
                  onClick={() => {
                    setProjectDropdownOpen(false);
                    onCreateProjectClick();
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-sky-400 hover:bg-zinc-800 flex items-center gap-2 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create New Workspace
                </button>
              </div>
            </div>
          )}
        </div>

        {/* E2EE Toggle & Status */}
        <button
          onClick={onToggleE2E}
          title={e2eEnabled ? 'E2E Encryption Active (AES-GCM-256)' : 'Enable E2E Encryption'}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border transition ${
            e2eEnabled
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Lock className="w-3 h-3" />
          <span>{e2eEnabled ? 'E2EE (AES-256)' : 'Plaintext'}</span>
        </button>
      </div>

      {/* Middle: Connection Status & Simulation controls */}
      <div className="flex items-center gap-2">
        {getStatusBadge()}

        {/* Toggle offline mode for testing offline CRDT queue */}
        <button
          onClick={onToggleSimulatedOffline}
          title={isSimulatedOffline ? 'Restore WebSocket Connection' : 'Simulate Offline Disconnection'}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border transition ${
            isSimulatedOffline
              ? 'bg-red-950/40 border-red-500/40 text-red-300'
              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {isSimulatedOffline ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
          <span>{isSimulatedOffline ? 'Resume Online' : 'Simulate Offline'}</span>
        </button>

        {/* Multi-User Concurrent Simulation */}
        <button
          onClick={onOpenSimulator}
          title="Simulate concurrent editing from multiple collaborators (Rahul & Sai)"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md text-amber-300 transition"
        >
          <Users className="w-3 h-3" />
          <span>Simulate Peers ({activeUsersCount})</span>
        </button>
      </div>

      {/* Right: Run Code, AI Assistant, Security, Share & User */}
      <div className="flex items-center gap-2">
        {/* Run Button */}
        <button
          onClick={onRunCode}
          disabled={isRunningCode}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition shadow-md shadow-emerald-900/40 active:scale-95 disabled:opacity-50"
        >
          {isRunningCode ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              RUN ▶
            </>
          )}
        </button>

        {/* AI Coding Assistant Toggle */}
        <button
          onClick={onToggleAi}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md border transition ${
            isAiOpen
              ? 'bg-purple-900/40 border-purple-500/40 text-purple-300 shadow-sm shadow-purple-500/20'
              : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-purple-300 hover:border-purple-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>AI Assistant</span>
        </button>

        {/* Security & Byzantine Inspector */}
        <button
          onClick={onOpenSecurity}
          title="Security, Byzantine Threat Model & Audit Logs"
          className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md text-zinc-400 hover:text-emerald-400 transition"
        >
          <ShieldCheck className="w-4 h-4" />
        </button>

        {/* Share Project */}
        <button
          onClick={onOpenShare}
          title="Share Project & Permissions"
          className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md text-zinc-400 hover:text-sky-400 transition"
        >
          <Share2 className="w-4 h-4" />
        </button>

        {/* User profile button */}
        <div className="relative border-l border-zinc-800 pl-2 ml-1">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-md hover:bg-zinc-800 transition"
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
              style={{ backgroundColor: currentUser.avatarColor }}
            >
              {currentUser.username[0]?.toUpperCase()}
            </div>
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl py-1 z-50">
              <div className="px-3 py-2 border-b border-zinc-800">
                <div className="text-xs font-medium text-zinc-100">{currentUser.username}</div>
                <div className="text-[11px] text-zinc-400 truncate">{currentUser.email}</div>
              </div>
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  onOpenAuth();
                }}
                className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 flex items-center gap-2"
              >
                <UserIcon className="w-3.5 h-3.5" />
                Switch User / Login
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
