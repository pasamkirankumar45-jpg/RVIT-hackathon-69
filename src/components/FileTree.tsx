import React, { useState } from 'react';
import {
  FileCode,
  Folder,
  FolderOpen,
  Plus,
  Trash2,
  Edit2,
  FileText,
  FilePlus,
  FolderPlus,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { FileItem } from '../types';

interface FileTreeProps {
  files: FileItem[];
  activeFileId: string | null;
  onSelectFile: (file: FileItem) => void;
  onCreateFile: (name: string, isDirectory: boolean) => void;
  onDeleteFile: (fileId: string) => void;
  onRenameFile: (fileId: string, newName: string) => void;
}

export const FileTree: React.FC<FileTreeProps> = ({
  files,
  activeFileId,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  onRenameFile,
}) => {
  const [newFileInputOpen, setNewFileInputOpen] = useState(false);
  const [newDirInputOpen, setNewDirInputOpen] = useState(false);
  const [newEntryName, setNewEntryName] = useState('');
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleCreateSubmit = (isDirectory: boolean) => {
    if (!newEntryName.trim()) return;
    onCreateFile(newEntryName.trim(), isDirectory);
    setNewEntryName('');
    setNewFileInputOpen(false);
    setNewDirInputOpen(false);
  };

  const handleRenameSubmit = (fileId: string) => {
    if (!editingName.trim()) return;
    onRenameFile(fileId, editingName.trim());
    setEditingFileId(null);
    setEditingName('');
  };

  const getFileIcon = (file: FileItem) => {
    if (file.isDirectory) return <Folder className="w-4 h-4 text-amber-400 shrink-0" />;
    if (file.name.endsWith('.py')) return <FileCode className="w-4 h-4 text-sky-400 shrink-0" />;
    if (file.name.endsWith('.md')) return <FileText className="w-4 h-4 text-emerald-400 shrink-0" />;
    return <FileCode className="w-4 h-4 text-zinc-400 shrink-0" />;
  };

  return (
    <div className="flex flex-col h-full text-zinc-300 text-xs">
      {/* Explorer Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800/80 font-semibold tracking-wider uppercase text-[11px] text-zinc-400">
        <span>Files</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setNewFileInputOpen(true);
              setNewDirInputOpen(false);
              setNewEntryName('');
            }}
            title="New File"
            className="p-1 hover:bg-zinc-800 rounded transition text-zinc-400 hover:text-zinc-200"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setNewDirInputOpen(true);
              setNewFileInputOpen(false);
              setNewEntryName('');
            }}
            title="New Folder"
            className="p-1 hover:bg-zinc-800 rounded transition text-zinc-400 hover:text-zinc-200"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* New File / Folder inline creation input */}
      {(newFileInputOpen || newDirInputOpen) && (
        <div className="px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 flex items-center gap-1.5">
          {newDirInputOpen ? (
            <Folder className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <FileCode className="w-3.5 h-3.5 text-sky-400" />
          )}
          <input
            type="text"
            autoFocus
            value={newEntryName}
            onChange={(e) => setNewEntryName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateSubmit(newDirInputOpen);
              if (e.key === 'Escape') {
                setNewFileInputOpen(false);
                setNewDirInputOpen(false);
              }
            }}
            placeholder={newDirInputOpen ? 'folder_name' : 'filename.py'}
            className="bg-zinc-950 border border-zinc-700 rounded px-1.5 py-0.5 text-xs text-zinc-200 outline-none w-full"
          />
        </div>
      )}

      {/* Files List */}
      <div className="flex-1 overflow-y-auto py-1">
        {files.length === 0 ? (
          <div className="p-3 text-zinc-500 text-center italic">No files in project</div>
        ) : (
          files.map((file) => {
            const isActive = file.id === activeFileId;
            const isEditing = editingFileId === file.id;

            return (
              <div
                key={file.id}
                onClick={() => {
                  if (!file.isDirectory) onSelectFile(file);
                }}
                className={`group flex items-center justify-between px-3 py-1.5 cursor-pointer transition select-none ${
                  isActive
                    ? 'bg-zinc-800 text-sky-300 font-medium'
                    : 'hover:bg-zinc-900 text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2 truncate flex-1 mr-2">
                  {getFileIcon(file)}

                  {isEditing ? (
                    <input
                      type="text"
                      autoFocus
                      value={editingName}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameSubmit(file.id);
                        if (e.key === 'Escape') setEditingFileId(null);
                      }}
                      onBlur={() => handleRenameSubmit(file.id)}
                      className="bg-zinc-950 border border-zinc-700 rounded px-1 text-xs text-zinc-200 outline-none w-full"
                    />
                  ) : (
                    <span className="truncate">{file.name}</span>
                  )}
                </div>

                {/* File actions */}
                <div className="hidden group-hover:flex items-center gap-1 opacity-80">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingFileId(file.id);
                      setEditingName(file.name);
                    }}
                    title="Rename"
                    className="p-1 hover:bg-zinc-700/60 rounded text-zinc-400 hover:text-zinc-200"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete ${file.name}?`)) {
                        onDeleteFile(file.id);
                      }
                    }}
                    title="Delete"
                    className="p-1 hover:bg-zinc-700/60 rounded text-zinc-400 hover:text-red-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
