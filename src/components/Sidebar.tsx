import React, { useState } from 'react';
import {
  Files,
  Users,
  History,
  ShieldCheck,
  FlaskConical,
  Settings,
} from 'lucide-react';
import { FileTree } from './FileTree';
import { PresenceList } from './PresenceList';
import { VersionHistory } from './VersionHistory';
import { FileItem } from '../types';

interface SidebarProps {
  files: FileItem[];
  activeFileId: string | null;
  onSelectFile: (file: FileItem) => void;
  onCreateFile: (name: string, isDirectory: boolean) => void;
  onDeleteFile: (fileId: string) => void;
  onRenameFile: (fileId: string, newName: string) => void;
  activeUsers: any[];
  onTriggerSimulatedPeerAction: (peerName: string) => void;
  onRestoreVersion: (newContent: string) => void;
  onOpenSecurity: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  files,
  activeFileId,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  onRenameFile,
  activeUsers,
  onTriggerSimulatedPeerAction,
  onRestoreVersion,
  onOpenSecurity,
}) => {
  const [activeTab, setActiveTab] = useState<'files' | 'presence' | 'history'>('files');

  const activeFile = files.find((f) => f.id === activeFileId);
  const filesMap: Record<string, string> = {};
  files.forEach((f) => {
    filesMap[f.id] = f.name;
  });

  return (
    <div className="w-64 h-full bg-zinc-950 border-r border-zinc-800 flex flex-col select-none">
      {/* View Switcher Bar */}
      <div className="h-9 border-b border-zinc-800 flex items-center px-2 gap-1 bg-zinc-900/40">
        <button
          onClick={() => setActiveTab('files')}
          title="Explorer"
          className={`p-1.5 rounded transition ${
            activeTab === 'files'
              ? 'bg-zinc-800 text-sky-400'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
          }`}
        >
          <Files className="w-4 h-4" />
        </button>

        <button
          onClick={() => setActiveTab('presence')}
          title="Collaborators Presence"
          className={`p-1.5 rounded transition ${
            activeTab === 'presence'
              ? 'bg-zinc-800 text-emerald-400'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
          }`}
        >
          <Users className="w-4 h-4" />
        </button>

        <button
          onClick={() => setActiveTab('history')}
          title="Version History"
          className={`p-1.5 rounded transition ${
            activeTab === 'history'
              ? 'bg-zinc-800 text-purple-400'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
          }`}
        >
          <History className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenSecurity}
          title="Security & Byzantine Threat Model"
          className="p-1.5 rounded text-zinc-400 hover:text-emerald-400 hover:bg-zinc-850 ml-auto transition"
        >
          <ShieldCheck className="w-4 h-4" />
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'files' && (
          <FileTree
            files={files}
            activeFileId={activeFileId}
            onSelectFile={onSelectFile}
            onCreateFile={onCreateFile}
            onDeleteFile={onDeleteFile}
            onRenameFile={onRenameFile}
          />
        )}

        {activeTab === 'presence' && (
          <PresenceList
            activeUsers={activeUsers}
            currentFileId={activeFileId || ''}
            filesMap={filesMap}
            onTriggerSimulatedPeerAction={onTriggerSimulatedPeerAction}
          />
        )}

        {activeTab === 'history' && activeFile && (
          <VersionHistory
            fileId={activeFile.id}
            fileName={activeFile.name}
            onRestore={onRestoreVersion}
          />
        )}

        {activeTab === 'history' && !activeFile && (
          <div className="p-4 text-center text-zinc-500 text-xs italic">
            Select a file to view version snapshots.
          </div>
        )}
      </div>
    </div>
  );
};
