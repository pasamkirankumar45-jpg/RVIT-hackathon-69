import React from 'react';
import { User, CursorPosition } from '../types';
import { Circle, UserCheck, Eye, Edit3, Clock } from 'lucide-react';

interface PresenceListProps {
  activeUsers: {
    userId: string;
    username: string;
    avatarColor: string;
    fileId: string;
    cursor?: any;
    lastActive: number;
  }[];
  currentFileId: string;
  filesMap: Record<string, string>;
  onTriggerSimulatedPeerAction: (peerName: string) => void;
}

export const PresenceList: React.FC<PresenceListProps> = ({
  activeUsers,
  currentFileId,
  filesMap,
  onTriggerSimulatedPeerAction,
}) => {
  return (
    <div className="flex flex-col h-full text-zinc-300 text-xs">
      <div className="px-3 py-2 border-b border-zinc-800 font-semibold tracking-wider uppercase text-[11px] text-zinc-400 flex items-center justify-between">
        <span>Active Collaborators</span>
        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[10px]">
          {activeUsers.length} ONLINE
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {activeUsers.map((user) => {
          const isSameFile = user.fileId === currentFileId;
          const fileName = filesMap[user.fileId] || 'Workspace';

          return (
            <div
              key={user.userId}
              className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800/80 flex flex-col gap-1.5 hover:border-zinc-700 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow"
                    style={{ backgroundColor: user.avatarColor }}
                  >
                    {user.username[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-zinc-200 flex items-center gap-1.5">
                      {user.username}
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    </div>
                  </div>
                </div>

                {user.username !== 'Manikanta' && (
                  <button
                    onClick={() => onTriggerSimulatedPeerAction(user.username)}
                    className="px-2 py-0.5 text-[10px] bg-zinc-800 hover:bg-zinc-700 rounded text-sky-400 border border-zinc-700 transition"
                  >
                    Simulate Edit
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-0.5">
                {isSameFile ? (
                  <Edit3 className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Eye className="w-3 h-3 text-zinc-500" />
                )}
                <span>
                  {isSameFile ? 'Editing' : 'Viewing'}{' '}
                  <span className="font-mono text-zinc-300">{fileName}</span>
                </span>
              </div>

              {user.cursor && isSameFile && (
                <div className="text-[10px] text-zinc-500 font-mono">
                  Cursor: Line {user.cursor.line || 1}, Col {user.cursor.column || 1}
                </div>
              )}
            </div>
          );
        })}

        {/* Demo instructions */}
        <div className="mt-4 p-2.5 rounded bg-zinc-900/60 border border-zinc-800/60 text-zinc-400 text-[11px] leading-relaxed">
          <p className="font-semibold text-zinc-300 mb-1">Multi-User Replication</p>
          Each user runs an independent CRDT replica. Open this URL in an incognito window or click &quot;Simulate Edit&quot; to test concurrent merges with zero loss.
        </div>
      </div>
    </div>
  );
};
