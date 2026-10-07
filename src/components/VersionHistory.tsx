import React, { useState, useEffect } from 'react';
import { History, RotateCcw, Clock, Check, FileText } from 'lucide-react';
import { api } from '../services/api';

interface VersionHistoryProps {
  fileId: string;
  fileName: string;
  onRestore: (newContent: string) => void;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({ fileId, fileName, onRestore }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<any | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await api.getFileHistory(fileId);
      setHistory(data);
      if (data.length > 0 && !selectedVersion) {
        setSelectedVersion(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fileId) loadHistory();
  }, [fileId]);

  const handleRestore = async (version: any) => {
    if (!confirm(`Restore ${fileName} to Version ${version.version}?`)) return;
    try {
      setRestoringId(version.id);
      const res = await api.restoreFileVersion(fileId, version.id);
      if (res.success) {
        onRestore(res.file.content);
        await loadHistory();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="flex flex-col h-full text-zinc-300 text-xs">
      <div className="px-3 py-2 border-b border-zinc-800 font-semibold tracking-wider uppercase text-[11px] text-zinc-400 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <History className="w-3.5 h-3.5 text-sky-400" />
          Version History
        </span>
        <button
          onClick={loadHistory}
          className="text-[10px] text-sky-400 hover:underline"
        >
          Refresh
        </button>
      </div>

      <div className="p-2 border-b border-zinc-800/80 bg-zinc-900/40">
        <div className="text-[11px] text-zinc-400 truncate">
          Tracking: <span className="font-mono text-zinc-200">{fileName}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {loading ? (
          <div className="p-4 text-center text-zinc-500">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="p-4 text-center text-zinc-500 italic">No snapshots available.</div>
        ) : (
          history.map((ver) => {
            const isSelected = selectedVersion?.id === ver.id;
            const dateStr = new Date(ver.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            return (
              <div
                key={ver.id}
                onClick={() => setSelectedVersion(ver)}
                className={`p-2.5 rounded-lg border transition cursor-pointer ${
                  isSelected
                    ? 'bg-zinc-800/80 border-sky-500/50 text-zinc-100'
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sky-400 text-xs">
                    Version {ver.version}
                  </span>
                  <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {dateStr}
                  </span>
                </div>

                <div className="text-[11px] text-zinc-400 truncate mb-2">
                  {ver.comment || 'Document update'} • <span className="text-zinc-300">{ver.author}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRestore(ver);
                  }}
                  disabled={restoringId === ver.id}
                  className="w-full flex items-center justify-center gap-1.5 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-[11px] text-zinc-200 transition"
                >
                  <RotateCcw className="w-3 h-3 text-amber-400" />
                  <span>Restore Snapshot</span>
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Snapshot Preview drawer */}
      {selectedVersion && (
        <div className="h-44 border-t border-zinc-800 bg-zinc-950 p-2 flex flex-col">
          <div className="text-[11px] text-zinc-400 font-semibold mb-1 flex items-center justify-between">
            <span>Preview Version {selectedVersion.version}</span>
            <span className="text-[10px] font-mono text-zinc-500">
              {selectedVersion.content.length} chars
            </span>
          </div>
          <pre className="flex-1 bg-zinc-900 p-2 rounded text-[10px] font-mono text-zinc-300 overflow-y-auto whitespace-pre-wrap select-text">
            {selectedVersion.content.slice(0, 300)}
            {selectedVersion.content.length > 300 && '...'}
          </pre>
        </div>
      )}
    </div>
  );
};
