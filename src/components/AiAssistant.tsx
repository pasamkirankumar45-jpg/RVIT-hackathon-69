import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  HelpCircle,
  Bug,
  Zap,
  FlaskConical,
  Send,
  Check,
  AlertTriangle,
  RotateCcw,
  Copy,
  Cpu,
  StopCircle,
  Clock,
  RefreshCw,
  Code2,
} from 'lucide-react';
import { api } from '../services/api';

interface AiAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  activeCode: string;
  activeFileName: string;
  onApplyCode: (newCode: string) => void;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({
  isOpen,
  onClose,
  activeCode,
  activeFileName,
  onApplyCode,
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingSeconds, setLoadingSeconds] = useState(0);
  const [customPrompt, setCustomPrompt] = useState('');
  const [lastAction, setLastAction] = useState<{ action: string; customText?: string } | null>(null);
  const [response, setResponse] = useState<{
    action: string;
    explanation: string;
    suggestedCode: string | null;
    model?: string;
    durationMs?: number;
    isFallback?: boolean;
    notice?: string;
  } | null>(null);
  const [applied, setApplied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [emptyCodeNotice, setEmptyCodeNotice] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<any>(null);

  // Timer for loading state
  useEffect(() => {
    if (loading) {
      setLoadingSeconds(0);
      timerRef.current = setInterval(() => {
        setLoadingSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading]);

  if (!isOpen) return null;

  const handleAction = async (action: string, customText?: string) => {
    // If attempting code-specific action on an empty file, gently warn the user
    if (['explain', 'find_bugs', 'improve', 'generate_tests'].includes(action) && !activeCode.trim()) {
      setEmptyCodeNotice(true);
      return;
    }
    setEmptyCodeNotice(false);

    // Cancel any existing in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setResponse(null);
    setApplied(false);
    setErrorMsg(null);
    setLastAction({ action, customText });

    try {
      const res = await api.queryAiAssistant(
        action,
        activeCode,
        customText,
        activeFileName,
        controller.signal
      );
      setResponse(res);
    } catch (err: any) {
      console.error('[AiAssistant] Error handled:', err);
      setErrorMsg(err.message || 'Failed to communicate with AI service.');
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
    setErrorMsg('Request cancelled by user.');
  };

  const handleRetry = () => {
    if (lastAction) {
      handleAction(lastAction.action, lastAction.customText);
    } else {
      handleAction('explain');
    }
  };

  const handleApply = () => {
    if (response?.suggestedCode) {
      onApplyCode(response.suggestedCode);
      setApplied(true);
      setTimeout(() => setApplied(false), 3000);
    }
  };

  const handleCopyCode = () => {
    if (response?.suggestedCode) {
      navigator.clipboard.writeText(response.suggestedCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleReset = () => {
    if (loading && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setLoading(false);
    setResponse(null);
    setErrorMsg(null);
    setEmptyCodeNotice(false);
    setCustomPrompt('');
  };

  return (
    <aside className="w-80 h-full bg-zinc-950 border-l border-zinc-800 flex flex-col text-zinc-300 text-xs shadow-xl select-none">
      {/* Header */}
      <div className="h-10 px-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
        <div className="flex items-center gap-2 font-semibold text-purple-300">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>AI Coding Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          {(response || errorMsg) && (
            <button
              onClick={handleReset}
              title="Reset conversation"
              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Preset Action Buttons */}
      <div className="p-3 border-b border-zinc-800 space-y-1.5 bg-zinc-900/20">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-2 flex items-center justify-between">
          <span>Assistance for <span className="font-mono text-zinc-200">{activeFileName || 'workspace'}</span></span>
          {activeCode.trim() ? (
            <span className="text-[9px] text-emerald-400 flex items-center gap-1">
              <Code2 className="w-3 h-3" />
              {activeCode.split('\n').length} lines
            </span>
          ) : (
            <span className="text-[9px] text-zinc-500 italic">Empty file</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => handleAction('explain')}
            disabled={loading}
            className="flex items-center gap-1.5 p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-left transition text-zinc-300 hover:text-purple-300 disabled:opacity-50"
          >
            <HelpCircle className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="truncate">Explain Code</span>
          </button>

          <button
            onClick={() => handleAction('find_bugs')}
            disabled={loading}
            className="flex items-center gap-1.5 p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-left transition text-zinc-300 hover:text-purple-300 disabled:opacity-50"
          >
            <Bug className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span className="truncate">Find Bugs</span>
          </button>

          <button
            onClick={() => handleAction('improve')}
            disabled={loading}
            className="flex items-center gap-1.5 p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-left transition text-zinc-300 hover:text-purple-300 disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">Refactor / Improve</span>
          </button>

          <button
            onClick={() => handleAction('generate_tests')}
            disabled={loading}
            className="flex items-center gap-1.5 p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-left transition text-zinc-300 hover:text-purple-300 disabled:opacity-50"
          >
            <FlaskConical className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">Generate Tests</span>
          </button>
        </div>
      </div>

      {/* Empty Code Notice */}
      {emptyCodeNotice && (
        <div className="mx-3 mt-3 p-2.5 bg-amber-950/40 border border-amber-500/30 rounded-lg text-amber-300 text-xs space-y-1.5">
          <div className="flex items-center justify-between font-semibold">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              File is empty
            </span>
            <button
              onClick={() => setEmptyCodeNotice(false)}
              className="text-zinc-400 hover:text-zinc-200"
            >
              ✕
            </button>
          </div>
          <p className="text-[11px] text-zinc-400">
            The active file has no code to analyze. Select or type Python code in the editor, or click below to generate a starter template.
          </p>
          <button
            onClick={() => {
              setEmptyCodeNotice(false);
              handleAction('improve', 'Provide a standard Python 3.12 script with functions, type hints, and main entry point.');
            }}
            className="w-full py-1 bg-amber-900/60 hover:bg-amber-800/60 border border-amber-600/40 rounded text-center text-amber-200 text-[11px] font-medium transition"
          >
            Generate Python Starter Code
          </button>
        </div>
      )}

      {/* Response Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 select-text">
        {/* Loading Spinner with Progress and Cancel option */}
        {loading && (
          <div className="p-6 text-center text-zinc-400 space-y-3 bg-zinc-900/30 border border-zinc-800/60 rounded-xl">
            <div className="relative w-10 h-10 mx-auto flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-200">Analyzing code with Gemini AI...</p>
              <p className="text-[11px] text-zinc-500 mt-0.5 flex items-center justify-center gap-1 font-mono">
                <Clock className="w-3 h-3 text-purple-400" />
                Elapsed: {loadingSeconds}s
              </p>
            </div>
            <p className="text-[10px] text-zinc-500 leading-tight">
              {loadingSeconds < 4
                ? 'Processing AST and semantic context...'
                : loadingSeconds < 8
                ? 'Generating recommendations...'
                : 'Finalizing response formatting...'}
            </p>
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 px-3 py-1 mx-auto bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-[11px] text-zinc-300 hover:text-red-300 transition"
            >
              <StopCircle className="w-3.5 h-3.5 text-red-400" />
              <span>Cancel Request</span>
            </button>
          </div>
        )}

        {/* Error Feedback State */}
        {errorMsg && !loading && (
          <div className="p-3.5 bg-red-950/40 border border-red-500/40 rounded-xl text-red-300 text-xs space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-red-500/20">
              <span className="font-semibold flex items-center gap-1.5 text-red-200">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                AI Service Unreachable
              </span>
              <button
                onClick={() => setErrorMsg(null)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                ✕
              </button>
            </div>
            <p className="text-[11px] text-zinc-300 leading-relaxed font-mono bg-black/40 p-2 rounded border border-red-900/30">
              {errorMsg}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleRetry}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-800/60 hover:bg-red-700/60 text-white rounded font-medium text-xs transition"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry Analysis</span>
              </button>
              <button
                onClick={() => {
                  setErrorMsg(null);
                  handleAction('custom', 'Hello, how can I write a Python CRDT?');
                }}
                className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded text-xs transition"
              >
                Try Sample Question
              </button>
            </div>
          </div>
        )}

        {/* Successful Response View */}
        {response && !loading && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[10px] text-zinc-500 px-1 border-b border-zinc-800/80 pb-1.5">
              <div className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-purple-400" />
                <span className="font-mono text-zinc-300">
                  {response.model === 'gemini-3.8-flash'
                    ? 'Gemini 3.8 Flash'
                    : response.model === 'codesync-fallback-engine'
                    ? 'CodeSync Local Engine'
                    : response.model || 'AI Engine'}
                </span>
                {response.isFallback && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-zinc-800 text-purple-300 border border-zinc-700">
                    Offline / Resilient
                  </span>
                )}
              </div>
              {response.durationMs && (
                <span className="text-zinc-500 font-mono">
                  {(response.durationMs / 1000).toFixed(1)}s
                </span>
              )}
            </div>

            <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-lg whitespace-pre-wrap leading-relaxed text-zinc-200 text-xs">
              {response.explanation}
            </div>

            {/* Proposed code replacement with explicit user confirmation */}
            {response.suggestedCode && (
              <div className="space-y-2">
                <div className="p-2.5 bg-zinc-900 border border-purple-500/40 rounded-lg">
                  <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800 mb-2">
                    <span className="text-[11px] font-semibold text-purple-300 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-purple-400" />
                      Suggested Code Replacement
                    </span>
                    <button
                      onClick={handleCopyCode}
                      className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-200 transition"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedCode ? 'Copied' : 'Copy'}
                    </button>
                  </div>

                  <pre className="text-[10px] font-mono bg-zinc-950 p-2 rounded text-zinc-300 overflow-x-auto max-h-56 whitespace-pre">
                    {response.suggestedCode}
                  </pre>

                  {/* Confirmation Button */}
                  <div className="mt-3">
                    <button
                      onClick={handleApply}
                      disabled={applied}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-semibold transition shadow-md shadow-purple-900/20"
                    >
                      {applied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          Applied to File!
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          Confirm & Apply to File
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-zinc-500 mt-1 text-center">
                      AI never silently modifies your file.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty Default State */}
        {!response && !loading && !errorMsg && !emptyCodeNotice && (
          <div className="text-zinc-400 text-center p-6 space-y-2">
            <Sparkles className="w-7 h-7 mx-auto text-purple-400/60 mb-2" />
            <p className="font-medium text-zinc-200 text-xs">AI Assistant Ready</p>
            <p className="text-[11px] leading-relaxed text-zinc-400">
              Select one of the action buttons above to analyze <span className="font-mono text-zinc-300">{activeFileName}</span>, or type a custom query below.
            </p>
          </div>
        )}
      </div>

      {/* Custom prompt input */}
      <div className="p-2.5 border-t border-zinc-800 bg-zinc-900/60">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (customPrompt.trim()) {
              handleAction('custom', customPrompt.trim());
              setCustomPrompt('');
            }
          }}
          className="flex items-center gap-1.5"
        >
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            disabled={loading}
            placeholder={loading ? 'Waiting for response...' : 'Ask AI about this code...'}
            className="flex-1 bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-200 outline-none focus:border-purple-500 transition disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !customPrompt.trim()}
            className="p-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded transition disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </aside>
  );
};
