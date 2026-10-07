import React, { useState } from 'react';
import { Users, Play, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { CRDTOperation } from '../types';

interface CollaboratorSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  onInjectSimulatedOperation: (
    userId: string,
    username: string,
    avatarColor: string,
    position: number,
    text: string
  ) => void;
  currentDocumentLength: number;
}

export const CollaboratorSimulator: React.FC<CollaboratorSimulatorProps> = ({
  isOpen,
  onClose,
  onInjectSimulatedOperation,
  currentDocumentLength,
}) => {
  const [runningScenario, setRunningScenario] = useState<string | null>(null);

  if (!isOpen) return null;

  const runConcurrentEditScenario = () => {
    setRunningScenario('concurrent');

    // Simulate Client A (Rahul) typing at end of document
    setTimeout(() => {
      onInjectSimulatedOperation(
        'usr_rahul_102',
        'Rahul',
        '#3b82f6',
        currentDocumentLength,
        '\n# [Rahul]: Added concurrent metric calculation\ndef rahul_metric():\n    return 42\n'
      );
    }, 200);

    // Simulate Client B (Sai) typing simultaneously at the same moment
    setTimeout(() => {
      onInjectSimulatedOperation(
        'usr_sai_103',
        'Sai',
        '#f59e0b',
        currentDocumentLength,
        '\n# [Sai]: Concurrent CRDT vector assertion\ndef sai_validator():\n    assert True\n'
      );
      setRunningScenario(null);
    }, 450);
  };

  const runSingleEdit = (peer: 'rahul' | 'sai') => {
    if (peer === 'rahul') {
      onInjectSimulatedOperation(
        'usr_rahul_102',
        'Rahul',
        '#3b82f6',
        0,
        '# [Rahul] Live edit header\n'
      );
    } else {
      onInjectSimulatedOperation(
        'usr_sai_103',
        'Sai',
        '#f59e0b',
        currentDocumentLength,
        '\nprint("[Sai]: Validated live CRDT convergence.")\n'
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-lg shadow-2xl text-zinc-200 p-6">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">
                Multi-User CRDT Concurrency Simulator
              </h3>
              <p className="text-xs text-zinc-400">
                Simulate simultaneous keystrokes from remote peers without needing 3 browsers
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded text-zinc-400">
            ✕
          </button>
        </div>

        <div className="py-4 space-y-3 text-xs leading-relaxed">
          <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
            <h4 className="font-semibold text-zinc-200 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Scenario: Simultaneous Conflicting Edits
            </h4>
            <p className="text-zinc-400 mb-3">
              Trigger Rahul and Sai typing into the same file within milliseconds. Watch the CRDT RGA engine sort operations causally by (logical_clock, client_id) and converge deterministically.
            </p>
            <button
              onClick={runConcurrentEditScenario}
              disabled={runningScenario !== null}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded-md font-semibold transition"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Run Concurrent Conflict Merge
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => runSingleEdit('rahul')}
              className="p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-left transition flex flex-col gap-1"
            >
              <div className="flex items-center gap-2 font-medium text-blue-400">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                Rahul: Insert Header
              </div>
              <span className="text-[11px] text-zinc-400">Inserts code at top of document</span>
            </button>

            <button
              onClick={() => runSingleEdit('sai')}
              className="p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-left transition flex flex-col gap-1"
            >
              <div className="flex items-center gap-2 font-medium text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Sai: Append Footer
              </div>
              <span className="text-[11px] text-zinc-400">Appends print statement at end</span>
            </button>
          </div>
        </div>

        <div className="pt-3 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
