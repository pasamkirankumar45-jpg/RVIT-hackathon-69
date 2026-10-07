import React, { useRef, useEffect } from 'react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import { X, FileCode, FileText, Lock, Users } from 'lucide-react';
import { FileItem, CursorPosition } from '../types';

interface EditorAreaProps {
  openFiles: FileItem[];
  activeFileId: string | null;
  onSelectTab: (fileId: string) => void;
  onCloseTab: (fileId: string) => void;
  fileContent: string;
  onContentChange: (newContent: string) => void;
  remoteCursors: {
    userId: string;
    username: string;
    color: string;
    cursor?: any;
  }[];
  onCursorPositionChange: (line: number, column: number, selection?: any) => void;
  isEncrypted: boolean;
  readOnly?: boolean;
}

export const EditorArea: React.FC<EditorAreaProps> = ({
  openFiles,
  activeFileId,
  onSelectTab,
  onCloseTab,
  fileContent,
  onContentChange,
  remoteCursors,
  onCursorPositionChange,
  isEncrypted,
  readOnly = false,
}) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);

  const activeFile = openFiles.find((f) => f.id === activeFileId);

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Track local cursor movements
    editor.onDidChangeCursorPosition((e) => {
      onCursorPositionChange(e.position.lineNumber, e.position.column);
    });

    editor.onDidChangeCursorSelection((e) => {
      onCursorPositionChange(
        e.selection.startLineNumber,
        e.selection.startColumn,
        {
          startLineNumber: e.selection.startLineNumber,
          startColumn: e.selection.startColumn,
          endLineNumber: e.selection.endLineNumber,
          endColumn: e.selection.endColumn,
        }
      );
    });
  };

  // Update Monaco decorations for remote collaborators' cursors
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const editor = editorRef.current;
    const monaco = monacoRef.current;

    const newDecorations: any[] = [];

    remoteCursors.forEach((peer) => {
      if (peer.cursor && peer.cursor.line) {
        const line = peer.cursor.line;
        const col = peer.cursor.column || 1;

        newDecorations.push({
          range: new monaco.Range(line, col, line, col + 1),
          options: {
            className: 'remote-cursor',
            hoverMessage: { value: `Collaborator: ${peer.username}` },
            before: {
              content: `|`,
              inlineClassName: `remote-caret-${peer.userId}`,
            },
          },
        });
      }
    });

    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      newDecorations
    );
  }, [remoteCursors]);

  const getLanguage = (file?: FileItem) => {
    if (!file) return 'python';
    if (file.name.endsWith('.py')) return 'python';
    if (file.name.endsWith('.md')) return 'markdown';
    if (file.name.endsWith('.json')) return 'json';
    if (file.name.endsWith('.js') || file.name.endsWith('.ts')) return 'typescript';
    return 'plaintext';
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1e1e1e] overflow-hidden">
      {/* Tabs Header */}
      <div className="h-9 bg-zinc-950 border-b border-zinc-800 flex items-center px-1 overflow-x-auto select-none no-scrollbar">
        {openFiles.length === 0 ? (
          <div className="text-zinc-500 text-xs px-3 italic">No file open</div>
        ) : (
          openFiles.map((file) => {
            const isActive = file.id === activeFileId;
            return (
              <div
                key={file.id}
                onClick={() => onSelectTab(file.id)}
                className={`group flex items-center gap-2 px-3 py-1.5 text-xs border-r border-zinc-800 cursor-pointer transition select-none ${
                  isActive
                    ? 'bg-[#1e1e1e] text-zinc-100 border-t-2 border-t-sky-500 font-medium'
                    : 'bg-zinc-950 hover:bg-zinc-900 text-zinc-400'
                }`}
              >
                {file.name.endsWith('.py') ? (
                  <FileCode className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                )}
                <span className="truncate max-w-[120px]">{file.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(file.id);
                  }}
                  className="p-0.5 rounded hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })
        )}

        {/* E2EE and Active Peers badge */}
        <div className="ml-auto flex items-center gap-2 pr-2 text-[11px] text-zinc-400">
          {isEncrypted && (
            <span className="flex items-center gap-1 text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
              <Lock className="w-3 h-3" />
              E2EE Secure
            </span>
          )}
          {remoteCursors.length > 0 && (
            <span className="flex items-center gap-1 text-sky-400 bg-sky-950/40 px-2 py-0.5 rounded border border-sky-500/30">
              <Users className="w-3 h-3" />
              {remoteCursors.length} Peers Editing
            </span>
          )}
        </div>
      </div>

      {/* Monaco Editor Container */}
      <div className="flex-1 relative">
        {activeFile ? (
          <Editor
            height="100%"
            language={getLanguage(activeFile)}
            theme="vs-dark"
            value={fileContent}
            onChange={(val) => onContentChange(val || '')}
            onMount={handleEditorMount}
            options={{
              fontSize: 13,
              fontFamily: "'Fira Code', 'JetBrains Mono', Consolas, monospace",
              fontLigatures: true,
              minimap: { enabled: true, maxColumn: 80 },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 4,
              insertSpaces: true,
              readOnly,
              wordWrap: 'on',
              lineNumbers: 'on',
              renderWhitespace: 'selection',
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              smoothScrolling: true,
            }}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-xs space-y-2">
            <FileCode className="w-8 h-8 opacity-30 text-zinc-400" />
            <p>Select a file from the explorer to begin collaborative editing.</p>
          </div>
        )}
      </div>
    </div>
  );
};
