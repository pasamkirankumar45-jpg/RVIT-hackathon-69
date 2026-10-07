import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal as TerminalIcon,
  FileText,
  AlertCircle,
  FlaskConical,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Palette,
  Check,
  Keyboard,
  CornerDownLeft,
  Trash2,
  StopCircle,
  Type,
  Minus,
  Plus,
  Sliders,
  Sun,
  Moon,
  CheckSquare,
  FileCode,
  Search,
  ExternalLink,
  AlertTriangle,
  ChevronRight,
  Layers,
  WrapText,
} from 'lucide-react';
import {
  ExecutionJobResult,
  FileItem,
  User,
  PythonTestSuiteResult,
  PythonTestCaseResult,
} from '../types';
import { runAllTests, TestResult } from '../tests/crdtTests';
import { api } from '../services/api';

export type TerminalPresetId =
  | 'vscode-dark'
  | 'monokai'
  | 'solarized-dark'
  | 'gruvbox'
  | 'dracula'
  | 'solarized-light'
  | 'github-light';

export interface TerminalThemeConfig {
  id: TerminalPresetId;
  name: string;
  isDark: boolean;
  swatch: [string, string, string]; // [bg, prompt, accent]
  bg: string;
  headerBg: string;
  border: string;
  text: string;
  mutedText: string;
  prompt: string;
  commandText: string;
  accent: string;
  cardBg: string;
  cardBorder: string;
  stderrText: string;
  stderrBg: string;
  inputText: string;
  inputPlaceholder: string;
  stdoutText?: string;
}

export const TERMINAL_THEMES: Record<TerminalPresetId, TerminalThemeConfig> = {
  'vscode-dark': {
    id: 'vscode-dark',
    name: 'VS Code Dark',
    isDark: true,
    swatch: ['#09090b', '#34d399', '#38bdf8'],
    bg: '#09090b',
    headerBg: '#18181b',
    border: '#27272a',
    text: '#e4e4e7',
    mutedText: '#71717a',
    prompt: '#34d399',
    commandText: '#f4f4f5',
    accent: '#38bdf8',
    cardBg: '#18181b',
    cardBorder: '#27272a',
    stderrText: '#f87171',
    stderrBg: 'rgba(239, 68, 68, 0.1)',
    inputText: '#fafafa',
    inputPlaceholder: '#52525b',
  },
  'monokai': {
    id: 'monokai',
    name: 'Monokai Pro',
    isDark: true,
    swatch: ['#272822', '#a6e22e', '#f92672'],
    bg: '#272822',
    headerBg: '#1e1f1c',
    border: '#3e3d32',
    text: '#f8f8f2',
    mutedText: '#75715e',
    prompt: '#a6e22e',
    commandText: '#fd971f',
    accent: '#f92672',
    cardBg: '#1e1f1c',
    cardBorder: '#3e3d32',
    stderrText: '#f92672',
    stderrBg: 'rgba(249, 38, 114, 0.12)',
    inputText: '#f8f8f2',
    inputPlaceholder: '#75715e',
  },
  'solarized-dark': {
    id: 'solarized-dark',
    name: 'Solarized Dark',
    isDark: true,
    swatch: ['#002b36', '#2aa198', '#268bd2'],
    bg: '#002b36',
    headerBg: '#073642',
    border: '#0d4a58',
    text: '#93a1a1',
    mutedText: '#586e75',
    prompt: '#2aa198',
    commandText: '#859900',
    accent: '#268bd2',
    cardBg: '#073642',
    cardBorder: '#0d4a58',
    stderrText: '#dc322f',
    stderrBg: 'rgba(220, 50, 47, 0.15)',
    inputText: '#93a1a1',
    inputPlaceholder: '#586e75',
  },
  'gruvbox': {
    id: 'gruvbox',
    name: 'Gruvbox Dark',
    isDark: true,
    swatch: ['#282828', '#b8bb26', '#fabd2f'],
    bg: '#282828',
    headerBg: '#1d2021',
    border: '#3c3836',
    text: '#ebdbb2',
    mutedText: '#928374',
    prompt: '#b8bb26',
    commandText: '#fabd2f',
    accent: '#fe8019',
    cardBg: '#1d2021',
    cardBorder: '#3c3836',
    stderrText: '#fb4934',
    stderrBg: 'rgba(251, 73, 52, 0.12)',
    inputText: '#ebdbb2',
    inputPlaceholder: '#928374',
  },
  'dracula': {
    id: 'dracula',
    name: 'Dracula',
    isDark: true,
    swatch: ['#282a36', '#50fa7b', '#bd93f9'],
    bg: '#282a36',
    headerBg: '#1e1f29',
    border: '#44475a',
    text: '#f8f8f2',
    mutedText: '#6272a4',
    prompt: '#50fa7b',
    commandText: '#ff79c6',
    accent: '#bd93f9',
    cardBg: '#1e1f29',
    cardBorder: '#44475a',
    stderrText: '#ff5555',
    stderrBg: 'rgba(255, 85, 85, 0.15)',
    inputText: '#f8f8f2',
    inputPlaceholder: '#6272a4',
  },
  'solarized-light': {
    id: 'solarized-light',
    name: 'Solarized Light',
    isDark: false,
    swatch: ['#fdf6e3', '#859900', '#268bd2'],
    bg: '#fdf6e3',
    headerBg: '#eee8d5',
    border: '#d5cdb8',
    text: '#586e75',
    mutedText: '#93a1a1',
    prompt: '#859900',
    commandText: '#2aa198',
    accent: '#268bd2',
    cardBg: '#ffffff',
    cardBorder: '#e0d8c3',
    stderrText: '#dc322f',
    stderrBg: '#fbe9e7',
    inputText: '#073642',
    inputPlaceholder: '#93a1a1',
  },
  'github-light': {
    id: 'github-light',
    name: 'GitHub Light',
    isDark: false,
    swatch: ['#ffffff', '#1a7f37', '#0969da'],
    bg: '#ffffff',
    headerBg: '#f6f8fa',
    border: '#d0d7de',
    text: '#1f2328',
    mutedText: '#656d76',
    prompt: '#1a7f37',
    commandText: '#0969da',
    accent: '#0969da',
    cardBg: '#f6f8fa',
    cardBorder: '#d0d7de',
    stderrText: '#cf222e',
    stderrBg: '#ffebe9',
    inputText: '#1f2328',
    inputPlaceholder: '#8c959f',
  },
};

interface BottomPanelProps {
  executionResult: ExecutionJobResult | null;
  isRunningCode: boolean;
  onClearOutput: () => void;
  terminalLogs: string[];
  activeFileContent: string;
  onTerminateCode?: () => void;
  onRunCode?: () => void;
  workspaceFiles?: FileItem[];
  activeFileName?: string;
  currentUser?: User;
  onOpenFile?: (file: FileItem) => void;
  onCreateFile?: (name: string, isDirectory?: boolean, parentId?: string | null, content?: string) => Promise<any>;
}

export const BottomPanel: React.FC<BottomPanelProps> = ({
  executionResult,
  isRunningCode,
  onClearOutput,
  terminalLogs,
  activeFileContent,
  onTerminateCode,
  onRunCode,
  workspaceFiles = [],
  activeFileName = 'main.py',
  currentUser,
  onOpenFile,
  onCreateFile,
}) => {
  const [activeTab, setActiveTab] = useState<'terminal' | 'output' | 'problems' | 'unittests' | 'tests'>('output');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [shortcutToast, setShortcutToast] = useState<string | null>(null);

  // Python Unittest State
  const unittestFiles = workspaceFiles.filter(
    (f) =>
      !f.isDirectory &&
      f.name.endsWith('.py') &&
      (f.name.startsWith('test_') ||
        f.name.endsWith('_test.py') ||
        f.content.includes('unittest.TestCase') ||
        f.content.includes('def test_'))
  );

  const [selectedTestFileId, setSelectedTestFileId] = useState<string>(() => {
    return unittestFiles[0]?.id || '';
  });

  // Sync selected test file if files change
  useEffect(() => {
    if (unittestFiles.length > 0 && (!selectedTestFileId || !unittestFiles.some((f) => f.id === selectedTestFileId))) {
      setSelectedTestFileId(unittestFiles[0].id);
    }
  }, [workspaceFiles, selectedTestFileId]);

  const [unittestSuite, setUnittestSuite] = useState<PythonTestSuiteResult | null>(null);
  const [isRunningUnittests, setIsRunningUnittests] = useState(false);
  const [unittestFilter, setUnittestFilter] = useState<'ALL' | 'PASSED' | 'FAILED'>('ALL');
  const [unittestSearch, setUnittestSearch] = useState('');
  const [expandedTestIds, setExpandedTestIds] = useState<Set<string>>(new Set());
  const [showRawOutput, setShowRawOutput] = useState(false);

  // Interactive Terminal State
  const [commandInput, setCommandInput] = useState('');
  const [customTerminalLogs, setCustomTerminalLogs] = useState<string[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([
    'python main.py',
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const panelRef = useRef<HTMLDivElement>(null);
  const terminalInputRef = useRef<HTMLInputElement>(null);
  const terminalScrollRef = useRef<HTMLDivElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const fontSettingsRef = useRef<HTMLDivElement>(null);

  // Terminal Font Size State (persisted to localStorage)
  const [fontSize, setFontSize] = useState<number>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('codesync_terminal_font_size');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 10 && parsed <= 24) return parsed;
      }
    }
    return 12;
  });
  const [showFontSettings, setShowFontSettings] = useState(false);

  const updateFontSize = (newSize: number) => {
    const clamped = Math.max(10, Math.min(24, Math.round(newSize)));
    setFontSize(clamped);
    try {
      localStorage.setItem('codesync_terminal_font_size', String(clamped));
    } catch {}
    triggerShortcutToast(`Font size: ${clamped}px`);
  };

  // Preset Color Theme State (persisted to localStorage)
  const [currentThemeId, setCurrentThemeId] = useState<TerminalPresetId>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('codesync_terminal_preset_theme') as TerminalPresetId;
      if (saved && TERMINAL_THEMES[saved]) return saved;
      // Check legacy dark/light key
      const legacy = localStorage.getItem('codesync_terminal_theme');
      if (legacy === 'light') return 'solarized-light';
    }
    return 'vscode-dark';
  });

  const activeTheme = TERMINAL_THEMES[currentThemeId] || TERMINAL_THEMES['vscode-dark'];

  const selectTheme = (themeId: TerminalPresetId) => {
    setCurrentThemeId(themeId);
    setShowThemePicker(false);
    try {
      localStorage.setItem('codesync_terminal_preset_theme', themeId);
      localStorage.setItem('codesync_terminal_theme', TERMINAL_THEMES[themeId].isDark ? 'dark' : 'light');
    } catch {}
    triggerShortcutToast(`Applied ${TERMINAL_THEMES[themeId].name}`);
  };

  // Toggle specifically between Dark and Light mode
  const toggleDarkLightTheme = () => {
    if (activeTheme.isDark) {
      selectTheme('solarized-light');
      triggerShortcutToast('Terminal switched to Light Mode');
    } else {
      selectTheme('vscode-dark');
      triggerShortcutToast('Terminal switched to Dark Mode');
    }
  };

  // Word Wrap State (persisted to localStorage)
  const [isWordWrap, setIsWordWrap] = useState<boolean>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('codesync_terminal_word_wrap');
      if (saved !== null) return saved === 'true';
    }
    return true; // Default to word wrap enabled
  });

  const toggleWordWrap = () => {
    setIsWordWrap((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('codesync_terminal_word_wrap', String(next));
      } catch {}
      triggerShortcutToast(next ? 'Word wrap: Enabled' : 'Word wrap: Disabled');
      return next;
    });
  };

  // Close dropdown menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setShowThemePicker(false);
      }
      if (fontSettingsRef.current && !fontSettingsRef.current.contains(e.target as Node)) {
        setShowFontSettings(false);
      }
    };
    if (showThemePicker || showFontSettings) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showThemePicker, showFontSettings]);

  // Helper to show brief feedback toast when a keyboard shortcut triggers
  const triggerShortcutToast = (message: string) => {
    setShortcutToast(message);
    setTimeout(() => {
      setShortcutToast(null);
    }, 2200);
  };

  // Clear all output and logs (Ctrl+K or Ctrl+L)
  const handleClearAll = () => {
    onClearOutput();
    setCustomTerminalLogs([]);
    triggerShortcutToast('Terminal & Output cleared (Ctrl+K)');
  };

  // Terminate execution or interrupt current line (Ctrl+C)
  const handleInterruptOrTerminate = () => {
    if (isRunningCode) {
      if (onTerminateCode) {
        onTerminateCode();
      }
      triggerShortcutToast('Execution terminated (Ctrl+C / SIGINT)');
    } else {
      setCustomTerminalLogs((prev) => [
        ...prev,
        `codesync@sandbox:~$ ${commandInput}^C`,
      ]);
      setCommandInput('');
      setHistoryIndex(-1);
      triggerShortcutToast('Line interrupted (^C)');
    }
  };

  // Run Python Unittest suite for selected file
  const handleRunUnittest = async (targetFileId?: string) => {
    const fileToRunId = targetFileId || selectedTestFileId;
    let file = workspaceFiles.find((f) => f.id === fileToRunId);
    if (!file && unittestFiles.length > 0) file = unittestFiles[0];
    if (!file) {
      triggerShortcutToast('No test file available to run');
      return;
    }

    setIsRunningUnittests(true);
    triggerShortcutToast(`Running ${file.name}...`);
    try {
      const content = file.name === activeFileName ? activeFileContent : file.content;
      const suiteResult = await api.runPythonUnittests(file.name, content, workspaceFiles, 8000);
      setUnittestSuite(suiteResult);
      const failedIds = new Set(
        suiteResult.results
          .filter((r) => r.status === 'FAILED' || r.status === 'ERROR')
          .map((r) => r.id)
      );
      setExpandedTestIds(failedIds);
      triggerShortcutToast(
        `${suiteResult.passed}/${suiteResult.total} passed in ${suiteResult.durationMs}ms`
      );
    } catch (err: any) {
      console.error('[Unittest Runner Error]:', err);
      triggerShortcutToast(`Unittest error: ${err.message}`);
    } finally {
      setIsRunningUnittests(false);
    }
  };

  // Run all workspace unittest files sequentially
  const handleRunAllWorkspaceTests = async () => {
    if (unittestFiles.length === 0) {
      triggerShortcutToast('No Python unittest files found');
      return;
    }

    setIsRunningUnittests(true);
    triggerShortcutToast(`Running all ${unittestFiles.length} test files...`);
    try {
      const allResults: PythonTestCaseResult[] = [];
      let totalPassed = 0;
      let totalFailed = 0;
      let totalErrors = 0;
      let totalDuration = 0;

      for (const tf of unittestFiles) {
        const content = tf.name === activeFileName ? activeFileContent : tf.content;
        const res = await api.runPythonUnittests(tf.name, content, workspaceFiles, 8000);
        allResults.push(...res.results);
        totalPassed += res.passed;
        totalFailed += res.failed;
        totalErrors += res.errors;
        totalDuration += res.durationMs;
      }

      const combined: PythonTestSuiteResult = {
        testFile: `All Workspace Tests (${unittestFiles.length} files)`,
        total: allResults.length,
        passed: totalPassed,
        failed: totalFailed,
        errors: totalErrors,
        durationMs: totalDuration,
        timestamp: Date.now(),
        results: allResults,
      };

      setUnittestSuite(combined);
      const failedIds = new Set(
        allResults
          .filter((r) => r.status === 'FAILED' || r.status === 'ERROR')
          .map((r) => r.id)
      );
      setExpandedTestIds(failedIds);
      triggerShortcutToast(`Completed: ${totalPassed}/${allResults.length} passed`);
    } catch (err: any) {
      triggerShortcutToast(`Run all tests failed: ${err.message}`);
    } finally {
      setIsRunningUnittests(false);
    }
  };

  // Quick helper to create sample test file
  const handleCreateSampleTestFile = async () => {
    const sampleContent = `import unittest

class TestWorkspaceModules(unittest.TestCase):
    """Sample unit test suite for workspace verification."""

    def test_basic_arithmetic(self):
        """Validates baseline arithmetic operations."""
        self.assertEqual(2 + 2, 4)

    def test_string_formatting(self):
        """Validates string representation."""
        greeting = f"Hello, {'CodeSync'}!"
        self.assertEqual(greeting, "Hello, CodeSync!")

    def test_list_manipulation(self):
        """Validates list ordering."""
        items = [3, 1, 2]
        items.sort()
        self.assertEqual(items, [1, 2, 3])

if __name__ == '__main__':
    unittest.main()
`;
    if (onCreateFile) {
      await onCreateFile('test_sample.py', false, null, sampleContent);
      triggerShortcutToast('Created test_sample.py');
    } else {
      triggerShortcutToast('File creation handler not provided');
    }
  };

  const toggleTestExpanded = (id: string) => {
    setExpandedTestIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleExpandAll = () => {
    if (!unittestSuite) return;
    if (expandedTestIds.size > 0) {
      setExpandedTestIds(new Set());
    } else {
      setExpandedTestIds(new Set(unittestSuite.results.map((r) => r.id)));
    }
  };

  const filteredUnittests = (unittestSuite?.results || []).filter((test) => {
    if (unittestFilter === 'PASSED' && test.status !== 'PASSED') return false;
    if (unittestFilter === 'FAILED' && test.status === 'PASSED') return false;
    if (unittestSearch.trim()) {
      const query = unittestSearch.toLowerCase();
      const matchName = test.name.toLowerCase().includes(query);
      const matchClass = test.className.toLowerCase().includes(query);
      const matchDesc = test.description?.toLowerCase().includes(query);
      if (!matchName && !matchClass && !matchDesc) return false;
    }
    return true;
  });

  // Keyboard shortcut listener for the bottom panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInsidePanel = panelRef.current && panelRef.current.contains(document.activeElement);
      if (!isInsidePanel && !isRunningCode) return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // 1. Ctrl+K -> Clear Screen
      if (cmdOrCtrl && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleClearAll();
        return;
      }

      // 2. Ctrl+L -> Clear Screen (POSIX standard)
      if (cmdOrCtrl && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        handleClearAll();
        return;
      }

      // 3. Ctrl+C -> Terminate running process (SIGINT) or interrupt input
      if (e.ctrlKey && e.key.toLowerCase() === 'c') {
        const hasSelection = window.getSelection()?.toString();
        if (isRunningCode || !hasSelection) {
          e.preventDefault();
          handleInterruptOrTerminate();
          return;
        }
      }

      // 4. Ctrl+U -> Erase line from cursor to beginning (readline)
      if (cmdOrCtrl && e.key.toLowerCase() === 'u') {
        if (document.activeElement === terminalInputRef.current) {
          e.preventDefault();
          setCommandInput('');
          triggerShortcutToast('Line erased (Ctrl+U)');
          return;
        }
      }

      // 5. Alt+Z / Option+Z -> Toggle Word Wrap
      if (e.altKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        toggleWordWrap();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunningCode, commandInput]);

  // Auto-scroll terminal when logs change
  useEffect(() => {
    if (activeTab === 'terminal' && terminalScrollRef.current) {
      terminalScrollRef.current.scrollTop = terminalScrollRef.current.scrollHeight;
    }
  }, [terminalLogs, customTerminalLogs, activeTab]);

  // Execute typed terminal command
  const handleExecuteCommand = (cmdText: string) => {
    const trimmed = cmdText.trim();
    if (!trimmed) {
      setCustomTerminalLogs((prev) => [...prev, 'codesync@sandbox:~$']);
      return;
    }

    setCommandHistory((prev) => [trimmed, ...prev.filter((c) => c !== trimmed)].slice(0, 50));
    setHistoryIndex(-1);

    const promptLine = `codesync@sandbox:~$ ${trimmed}`;
    const parts = trimmed.split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
      case 'clear':
      case 'cls':
        handleClearAll();
        break;

      case 'theme':
        if (args[0] === 'light') {
          selectTheme('solarized-light');
          setCustomTerminalLogs((prev) => [...prev, promptLine, 'Switched terminal to Light Mode (Solarized Light)']);
        } else if (args[0] === 'dark') {
          selectTheme('vscode-dark');
          setCustomTerminalLogs((prev) => [...prev, promptLine, 'Switched terminal to Dark Mode (VS Code Dark)']);
        } else if (args[0] && TERMINAL_THEMES[args[0] as TerminalPresetId]) {
          selectTheme(args[0] as TerminalPresetId);
          setCustomTerminalLogs((prev) => [...prev, promptLine, `Switched theme to ${TERMINAL_THEMES[args[0] as TerminalPresetId].name}`]);
        } else {
          setCustomTerminalLogs((prev) => [
            ...prev,
            promptLine,
            'Available preset themes:',
            ...Object.values(TERMINAL_THEMES).map((t) => `  ${t.id.padEnd(16)} - ${t.name} (${t.isDark ? 'Dark' : 'Light'})`),
            'Usage: theme <preset_id|light|dark>  (e.g. theme monokai, theme gruvbox, theme light, theme dark)',
          ]);
        }
        break;

      case 'python':
      case 'python3':
      case 'run':
        setCustomTerminalLogs((prev) => [...prev, promptLine]);
        if (onRunCode) {
          onRunCode();
          setActiveTab('output');
        } else {
          setCustomTerminalLogs((prev) => [
            ...prev,
            `Executing ${args[0] || activeFileName}...`,
          ]);
        }
        break;

      case 'test':
      case 'tests':
      case 'unittest':
      case 'unittests':
      case 'pytest':
        setCustomTerminalLogs((prev) => [...prev, promptLine, 'Running Python workspace unittests...']);
        setActiveTab('unittests');
        if (args[0]) {
          const match = workspaceFiles.find((f) => f.name.toLowerCase() === args[0].toLowerCase());
          if (match) handleRunUnittest(match.id);
          else handleRunUnittest();
        } else {
          handleRunUnittest();
        }
        break;

      case 'wrap':
      case 'wordwrap':
        if (args[0] === 'on' || args[0] === 'true' || args[0] === '1') {
          setIsWordWrap(true);
          try { localStorage.setItem('codesync_terminal_word_wrap', 'true'); } catch {}
          setCustomTerminalLogs((prev) => [...prev, promptLine, 'Word wrap enabled for terminal output.']);
        } else if (args[0] === 'off' || args[0] === 'false' || args[0] === '0') {
          setIsWordWrap(false);
          try { localStorage.setItem('codesync_terminal_word_wrap', 'false'); } catch {}
          setCustomTerminalLogs((prev) => [...prev, promptLine, 'Word wrap disabled (scroll mode).']);
        } else {
          const next = !isWordWrap;
          setIsWordWrap(next);
          try { localStorage.setItem('codesync_terminal_word_wrap', String(next)); } catch {}
          setCustomTerminalLogs((prev) => [
            ...prev,
            promptLine,
            `Word wrap toggled: ${next ? 'ENABLED' : 'DISABLED'}. (Usage: wrap on | wrap off)`,
          ]);
        }
        break;

      case 'help':
        setCustomTerminalLogs((prev) => [
          ...prev,
          promptLine,
          'CodeSync Built-in Terminal Commands:',
          '  python <file.py>    Execute Python script in sandboxed environment',
          '  run                 Quickly execute active file',
          '  theme <name>        Switch terminal theme (monokai, gruvbox, solarized-dark...)',
          '  wrap [on|off]       Toggle or set long line word wrapping',
          '  clear               Clear terminal output (Ctrl+K or Ctrl+L)',
          '  ls                  List files in current workspace',
          '  cat <file>          Print contents of a file',
          '  whoami              Print active user profile',
          '  date                Show current system time',
          '  python --version    Display Python runtime version',
          '  help                Show this list of commands',
          '',
          'Keyboard Productivity Shortcuts:',
          '  Ctrl+K / Cmd+K      Clear terminal and output screen',
          '  Ctrl+C              Send SIGINT / terminate executing process',
          '  Alt+Z               Toggle Word Wrap (enable / disable)',
          '  Ctrl+L              Clear terminal screen (bash POSIX standard)',
          '  Ctrl+U              Erase current command line',
          '  Up / Down Arrow     Navigate through command history',
        ]);
        break;

      case 'ls':
        const fileNames = workspaceFiles.length > 0
          ? workspaceFiles.map((f) => (f.isDirectory ? `${f.name}/` : f.name)).join('  ')
          : 'main.py  src/  tests/  README.md';
        setCustomTerminalLogs((prev) => [...prev, promptLine, fileNames]);
        break;

      case 'cat':
        if (!args[0]) {
          setCustomTerminalLogs((prev) => [...prev, promptLine, 'cat: missing file operand']);
        } else {
          const found = workspaceFiles.find((f) => f.name === args[0]);
          if (found) {
            setCustomTerminalLogs((prev) => [...prev, promptLine, found.content || '(empty file)']);
          } else if (args[0] === activeFileName) {
            setCustomTerminalLogs((prev) => [...prev, promptLine, activeFileContent || '(empty file)']);
          } else {
            setCustomTerminalLogs((prev) => [...prev, promptLine, `cat: ${args[0]}: No such file or directory`]);
          }
        }
        break;

      case 'whoami':
        setCustomTerminalLogs((prev) => [
          ...prev,
          promptLine,
          currentUser?.username || 'manikanta (CRDT Replica Owner)',
        ]);
        break;

      case 'echo':
        setCustomTerminalLogs((prev) => [...prev, promptLine, args.join(' ')]);
        break;

      case 'date':
        setCustomTerminalLogs((prev) => [...prev, promptLine, new Date().toISOString()]);
        break;

      default:
        if (cmd === 'python' && (args.includes('--version') || args.includes('-v') || args.includes('-V'))) {
          setCustomTerminalLogs((prev) => [...prev, promptLine, 'Python 3.12.2 (Sandboxed Runner)']);
        } else {
          setCustomTerminalLogs((prev) => [
            ...prev,
            promptLine,
            `bash: ${cmd}: command not found. Type 'help' for available commands.`,
          ]);
        }
        break;
    }

    setCommandInput('');
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleExecuteCommand(commandInput);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const nextIdx = Math.min(historyIndex + 1, commandHistory.length - 1);
        setHistoryIndex(nextIdx);
        setCommandInput(commandHistory[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setCommandInput(commandHistory[nextIdx]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommandInput('');
      }
    }
  };

  // Compute problems/lint diagnostics from code
  const getProblems = () => {
    const problems: { line: number; message: string; severity: 'error' | 'warning' }[] = [];
    const lines = activeFileContent.split('\n');
    lines.forEach((line, idx) => {
      if (line.includes('os.system(') || line.includes('subprocess.')) {
        problems.push({
          line: idx + 1,
          message: 'Security warning: Subprocess or raw system call invocation is restricted by sandbox policy.',
          severity: 'warning',
        });
      }
      if (line.trim().endsWith(':') === false && /^\s*(def |class |if |for |while |elif |else)/.test(line) && !line.includes('#')) {
        problems.push({
          line: idx + 1,
          message: 'Syntax warning: Compound statement missing trailing colon.',
          severity: 'error',
        });
      }
    });
    return problems;
  };

  const problems = getProblems();

  const handleRunTests = async () => {
    setIsRunningTests(true);
    try {
      const results = await runAllTests();
      setTestResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunningTests(false);
    }
  };

  if (isCollapsed) {
    return (
      <div className="h-7 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between px-3 text-xs text-zinc-400 select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsCollapsed(false);
              setActiveTab('output');
            }}
            className="flex items-center gap-1.5 hover:text-zinc-200"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Output</span>
          </button>
          <button
            onClick={() => {
              setIsCollapsed(false);
              setActiveTab('terminal');
            }}
            className="flex items-center gap-1.5 hover:text-zinc-200"
          >
            <TerminalIcon className="w-3.5 h-3.5" />
            <span>Terminal</span>
          </button>
          <button
            onClick={() => {
              setIsCollapsed(false);
              setActiveTab('unittests');
            }}
            className="flex items-center gap-1.5 hover:text-emerald-400"
          >
            <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>Unittests</span>
          </button>
          <button
            onClick={() => {
              setIsCollapsed(false);
              setActiveTab('tests');
            }}
            className="flex items-center gap-1.5 hover:text-sky-400"
          >
            <FlaskConical className="w-3.5 h-3.5 text-sky-400" />
            <span>Tests</span>
          </button>
        </div>
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-1 hover:text-zinc-200"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      tabIndex={0}
      style={{
        backgroundColor: activeTheme.bg,
        borderColor: activeTheme.border,
        color: activeTheme.text,
      }}
      className="h-56 border-t flex flex-col text-xs transition-colors duration-150 relative outline-none"
    >
      {/* Shortcut Toast Notification */}
      {shortcutToast && (
        <div
          style={{
            backgroundColor: activeTheme.cardBg,
            borderColor: activeTheme.border,
            color: activeTheme.prompt,
          }}
          className="absolute top-10 right-4 z-40 px-2.5 py-1 rounded shadow-lg text-[11px] font-mono flex items-center gap-1.5 border animate-in fade-in zoom-in-95 duration-150"
        >
          <CheckCircle2 className="w-3 h-3" />
          <span>{shortcutToast}</span>
        </div>
      )}

      {/* Tabs Header */}
      <div
        style={{
          backgroundColor: activeTheme.headerBg,
          borderColor: activeTheme.border,
        }}
        className="h-8 border-b flex items-center justify-between px-3 select-none transition-colors duration-150"
      >
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('output')}
            style={{
              borderColor: activeTab === 'output' ? activeTheme.accent : 'transparent',
              color: activeTab === 'output' ? (activeTheme.isDark ? '#ffffff' : activeTheme.accent) : activeTheme.mutedText,
            }}
            className="px-3 py-1.5 font-medium flex items-center gap-1.5 border-b-2 transition"
          >
            <FileText className="w-3.5 h-3.5" />
            OUTPUT
          </button>

          <button
            onClick={() => {
              setActiveTab('terminal');
              setTimeout(() => terminalInputRef.current?.focus(), 50);
            }}
            style={{
              borderColor: activeTab === 'terminal' ? activeTheme.accent : 'transparent',
              color: activeTab === 'terminal' ? (activeTheme.isDark ? '#ffffff' : activeTheme.accent) : activeTheme.mutedText,
            }}
            className="px-3 py-1.5 font-medium flex items-center gap-1.5 border-b-2 transition"
          >
            <TerminalIcon className="w-3.5 h-3.5" />
            TERMINAL
          </button>

          <button
            onClick={() => {
              setActiveTab('unittests');
              if (!unittestSuite && !isRunningUnittests && unittestFiles.length > 0) {
                handleRunUnittest();
              }
            }}
            style={{
              borderColor: activeTab === 'unittests' ? activeTheme.accent : 'transparent',
              color: activeTab === 'unittests' ? (activeTheme.isDark ? '#ffffff' : activeTheme.accent) : activeTheme.mutedText,
            }}
            className="px-3 py-1.5 font-medium flex items-center gap-1.5 border-b-2 transition"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            UNITTESTS
            {unittestSuite && (
              <span
                style={{
                  backgroundColor:
                    unittestSuite.failed + unittestSuite.errors > 0
                      ? 'rgba(239, 68, 68, 0.2)'
                      : 'rgba(16, 185, 129, 0.2)',
                  color:
                    unittestSuite.failed + unittestSuite.errors > 0 ? '#ef4444' : '#10b981',
                }}
                className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-semibold"
              >
                {unittestSuite.passed}/{unittestSuite.total}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('problems')}
            style={{
              borderColor: activeTab === 'problems' ? activeTheme.accent : 'transparent',
              color: activeTab === 'problems' ? (activeTheme.isDark ? '#ffffff' : activeTheme.accent) : activeTheme.mutedText,
            }}
            className="px-3 py-1.5 font-medium flex items-center gap-1.5 border-b-2 transition"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            PROBLEMS
            {problems.length > 0 && (
              <span
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.2)',
                  color: '#f59e0b',
                }}
                className="px-1.5 py-0.2 rounded-full text-[10px]"
              >
                {problems.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('tests');
              if (testResults.length === 0) handleRunTests();
            }}
            style={{
              borderColor: activeTab === 'tests' ? activeTheme.prompt : 'transparent',
              color: activeTab === 'tests' ? activeTheme.prompt : activeTheme.mutedText,
            }}
            className="px-3 py-1.5 font-medium flex items-center gap-1.5 border-b-2 transition"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            TEST SUITE
          </button>
        </div>

        {/* Panel controls */}
        <div className="flex items-center gap-2">
          {/* Active Process Interruption indicator / button */}
          {isRunningCode && (
            <button
              onClick={handleInterruptOrTerminate}
              title="Terminate running process (Ctrl+C)"
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-red-600 hover:bg-red-500 text-white shadow-xs transition animate-pulse"
            >
              <StopCircle className="w-3 h-3" />
              <span>Kill (Ctrl+C)</span>
            </button>
          )}

          {/* Dark / Light Mode Toggle Specifically for Terminal Panel */}
          <button
            onClick={toggleDarkLightTheme}
            title={activeTheme.isDark ? 'Switch terminal output panel to Light Mode' : 'Switch terminal output panel to Dark Mode'}
            style={{
              backgroundColor: activeTheme.cardBg,
              borderColor: activeTheme.border,
              color: activeTheme.text,
            }}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border transition hover:opacity-90 select-none shadow-2xs"
          >
            {activeTheme.isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Dark</span>
              </>
            )}
          </button>

          {/* Preset Theme Dropdown Selector */}
          <div className="relative" ref={themeMenuRef}>
            <button
              onClick={() => setShowThemePicker(!showThemePicker)}
              title="Select Terminal Theme Preset"
              style={{
                backgroundColor: activeTheme.cardBg,
                borderColor: activeTheme.border,
                color: activeTheme.text,
              }}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border transition hover:opacity-90 select-none shadow-2xs"
            >
              {/* Theme Color Swatches */}
              <span className="flex items-center -space-x-1 shrink-0">
                <span
                  className="w-2.5 h-2.5 rounded-full border border-black/20"
                  style={{ backgroundColor: activeTheme.swatch[0] }}
                />
                <span
                  className="w-2.5 h-2.5 rounded-full border border-black/20"
                  style={{ backgroundColor: activeTheme.swatch[1] }}
                />
                <span
                  className="w-2.5 h-2.5 rounded-full border border-black/20"
                  style={{ backgroundColor: activeTheme.swatch[2] }}
                />
              </span>
              <span className="max-w-[100px] truncate">{activeTheme.name}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {/* Themes Dropdown Menu */}
            {showThemePicker && (
              <div
                style={{
                  backgroundColor: activeTheme.headerBg,
                  borderColor: activeTheme.border,
                  color: activeTheme.text,
                }}
                className="absolute right-0 mt-1.5 w-60 p-1.5 rounded-lg shadow-2xl z-50 text-xs border max-h-72 overflow-y-auto"
              >
                <div
                  style={{ color: activeTheme.mutedText }}
                  className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider"
                >
                  Terminal Color Themes
                </div>
                <div className="space-y-0.5">
                  {Object.values(TERMINAL_THEMES).map((theme) => {
                    const isSelected = theme.id === currentThemeId;
                    return (
                      <button
                        key={theme.id}
                        onClick={() => selectTheme(theme.id)}
                        style={{
                          backgroundColor: isSelected ? activeTheme.cardBg : 'transparent',
                          color: isSelected ? activeTheme.accent : activeTheme.text,
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between hover:opacity-80 transition text-[11px]"
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex items-center -space-x-1 shrink-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-black/30"
                              style={{ backgroundColor: theme.swatch[0] }}
                            />
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-black/30"
                              style={{ backgroundColor: theme.swatch[1] }}
                            />
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-black/30"
                              style={{ backgroundColor: theme.swatch[2] }}
                            />
                          </span>
                          <span className="font-medium">{theme.name}</span>
                          <span className="text-[9px] opacity-60 ml-auto mr-1">
                            {theme.isDark ? 'Dark' : 'Light'}
                          </span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                <div
                  style={{
                    borderColor: activeTheme.border,
                    color: activeTheme.mutedText,
                  }}
                  className="mt-1 pt-1.5 border-t px-2 text-[10px]"
                >
                  Tip: Type <code className="font-mono">theme monokai</code> or <code className="font-mono">theme light</code> in terminal.
                </div>
              </div>
            )}
          </div>

          {/* Font Size Configuration Slider Popover */}
          <div className="relative" ref={fontSettingsRef}>
            <button
              onClick={() => setShowFontSettings(!showFontSettings)}
              title="Scale Terminal Font Size"
              style={{
                backgroundColor: activeTheme.cardBg,
                borderColor: activeTheme.border,
                color: activeTheme.text,
              }}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono border transition hover:opacity-90 select-none shadow-2xs"
            >
              <Type className="w-3 h-3" style={{ color: activeTheme.accent }} />
              <span>{fontSize}px</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {showFontSettings && (
              <div
                style={{
                  backgroundColor: activeTheme.headerBg,
                  borderColor: activeTheme.border,
                  color: activeTheme.text,
                }}
                className="absolute right-0 mt-1.5 w-60 p-3 rounded-lg shadow-2xl z-50 text-xs border"
              >
                <div
                  style={{ borderColor: activeTheme.border }}
                  className="flex items-center justify-between pb-1.5 border-b mb-2.5 font-semibold text-[11px]"
                >
                  <span className="flex items-center gap-1.5" style={{ color: activeTheme.accent }}>
                    <Sliders className="w-3.5 h-3.5" />
                    Terminal Font Size
                  </span>
                  <span className="font-mono text-[11px]" style={{ color: activeTheme.prompt }}>
                    {fontSize}px
                  </span>
                </div>

                {/* Slider */}
                <div className="space-y-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateFontSize(fontSize - 1)}
                      disabled={fontSize <= 10}
                      style={{ backgroundColor: activeTheme.cardBg, borderColor: activeTheme.border }}
                      className="p-1 rounded border hover:opacity-80 disabled:opacity-30 transition"
                      title="Decrease font size"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="range"
                      min="10"
                      max="22"
                      step="1"
                      value={fontSize}
                      onChange={(e) => updateFontSize(Number(e.target.value))}
                      className="flex-1 accent-sky-400 h-1.5 bg-zinc-700 rounded-lg cursor-pointer"
                    />
                    <button
                      onClick={() => updateFontSize(fontSize + 1)}
                      disabled={fontSize >= 22}
                      style={{ backgroundColor: activeTheme.cardBg, borderColor: activeTheme.border }}
                      className="p-1 rounded border hover:opacity-80 disabled:opacity-30 transition"
                      title="Increase font size"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex justify-between text-[9px] font-mono" style={{ color: activeTheme.mutedText }}>
                    <span>10px</span>
                    <span>12px</span>
                    <span>16px</span>
                    <span>22px</span>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="grid grid-cols-4 gap-1 pt-1.5 border-t" style={{ borderColor: activeTheme.border }}>
                  {[
                    { label: '11px', size: 11 },
                    { label: '12px', size: 12 },
                    { label: '14px', size: 14 },
                    { label: '16px', size: 16 },
                  ].map((preset) => (
                    <button
                      key={preset.size}
                      onClick={() => updateFontSize(preset.size)}
                      style={{
                        backgroundColor: fontSize === preset.size ? activeTheme.cardBg : 'transparent',
                        borderColor: fontSize === preset.size ? activeTheme.accent : activeTheme.border,
                        color: fontSize === preset.size ? activeTheme.accent : activeTheme.mutedText,
                      }}
                      className="py-1 px-1 rounded text-[10px] border text-center font-medium transition hover:opacity-90"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Word Wrap Toggle Button */}
          <button
            onClick={toggleWordWrap}
            title={
              isWordWrap
                ? 'Word Wrap: ON (Alt+Z) — Click to disable line wrapping'
                : 'Word Wrap: OFF (Alt+Z) — Click to enable line wrapping'
            }
            style={{
              backgroundColor: isWordWrap
                ? (activeTheme.isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(9, 105, 218, 0.1)')
                : activeTheme.cardBg,
              borderColor: isWordWrap ? activeTheme.accent : activeTheme.border,
              color: isWordWrap ? activeTheme.accent : activeTheme.mutedText,
            }}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border transition hover:opacity-90 select-none shadow-2xs"
          >
            <WrapText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Wrap</span>
            <span
              style={{
                backgroundColor: isWordWrap
                  ? (activeTheme.isDark ? '#34d399' : '#10b981')
                  : activeTheme.mutedText,
              }}
              className="w-1.5 h-1.5 rounded-full shrink-0"
              title={isWordWrap ? 'Word wrap is enabled' : 'Word wrap is disabled'}
            />
          </button>

          {/* Quick Keyboard Shortcuts Reference Button */}
          <div className="relative">
            <button
              onClick={() => setShowShortcutsHelp(!showShortcutsHelp)}
              title="View Terminal Keyboard Shortcuts"
              style={{
                backgroundColor: activeTheme.cardBg,
                borderColor: activeTheme.border,
                color: activeTheme.mutedText,
              }}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono border transition hover:opacity-90"
            >
              <Keyboard className="w-3 h-3" style={{ color: activeTheme.accent }} />
              <span className="hidden md:inline">Ctrl+K / Ctrl+C</span>
            </button>

            {/* Shortcuts Help Tooltip Menu */}
            {showShortcutsHelp && (
              <div
                style={{
                  backgroundColor: activeTheme.cardBg,
                  borderColor: activeTheme.border,
                  color: activeTheme.text,
                }}
                className="absolute right-0 mt-1.5 w-64 p-3 rounded-lg shadow-2xl z-50 text-xs border"
              >
                <div
                  style={{ borderColor: activeTheme.border }}
                  className="flex items-center justify-between font-semibold pb-1.5 border-b mb-2"
                >
                  <span className="flex items-center gap-1.5" style={{ color: activeTheme.accent }}>
                    <Keyboard className="w-3.5 h-3.5" />
                    Terminal Shortcuts
                  </span>
                  <button onClick={() => setShowShortcutsHelp(false)} className="opacity-70 hover:opacity-100">
                    ✕
                  </button>
                </div>
                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex items-center justify-between">
                    <span style={{ color: activeTheme.prompt }}>Ctrl+K / Cmd+K</span>
                    <span style={{ color: activeTheme.mutedText }}>Clear Screen</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: activeTheme.stderrText }}>Ctrl+C</span>
                    <span style={{ color: activeTheme.mutedText }}>Interrupt / Kill</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: activeTheme.accent }}>Alt+Z</span>
                    <span style={{ color: activeTheme.mutedText }}>Toggle Word Wrap</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: activeTheme.accent }}>Ctrl+L</span>
                    <span style={{ color: activeTheme.mutedText }}>POSIX Clear</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: activeTheme.commandText }}>Ctrl+U</span>
                    <span style={{ color: activeTheme.mutedText }}>Erase Line</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: activeTheme.accent }}>↑ / ↓</span>
                    <span style={{ color: activeTheme.mutedText }}>History</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Clear button */}
          {(activeTab === 'output' || activeTab === 'terminal') && (
            <button
              onClick={handleClearAll}
              title="Clear Terminal / Output (Ctrl+K)"
              style={{
                color: activeTheme.mutedText,
              }}
              className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded transition hover:opacity-100"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}

          {activeTab === 'tests' && (
            <button
              onClick={handleRunTests}
              disabled={isRunningTests}
              style={{
                backgroundColor: activeTheme.prompt,
                color: '#ffffff',
              }}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition shadow-xs hover:opacity-90"
            >
              <Play className="w-3 h-3 fill-current" />
              {isRunningTests ? 'Running...' : 'Run All Tests'}
            </button>
          )}

          {/* Unittest tab header controls */}
          {activeTab === 'unittests' && (
            <div className="flex items-center gap-1.5">
              {unittestFiles.length > 0 ? (
                <>
                  <select
                    value={selectedTestFileId}
                    onChange={(e) => setSelectedTestFileId(e.target.value)}
                    style={{
                      backgroundColor: activeTheme.cardBg,
                      borderColor: activeTheme.border,
                      color: activeTheme.text,
                    }}
                    className="text-[11px] px-2 py-0.5 rounded border outline-none font-mono max-w-[140px] truncate"
                    title="Select Python unittest file"
                  >
                    {unittestFiles.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => handleRunUnittest()}
                    disabled={isRunningUnittests}
                    style={{
                      backgroundColor: activeTheme.prompt,
                      color: '#ffffff',
                    }}
                    className="flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-medium transition shadow-xs hover:opacity-90 disabled:opacity-50"
                    title="Execute test suite for selected file"
                  >
                    {isRunningUnittests ? (
                      <Clock className="w-3 h-3 animate-spin" />
                    ) : (
                      <Play className="w-3 h-3 fill-current" />
                    )}
                    <span>{isRunningUnittests ? 'Running...' : 'Run Selected'}</span>
                  </button>

                  {unittestFiles.length > 1 && (
                    <button
                      onClick={handleRunAllWorkspaceTests}
                      disabled={isRunningUnittests}
                      style={{
                        backgroundColor: activeTheme.cardBg,
                        borderColor: activeTheme.border,
                        color: activeTheme.text,
                      }}
                      className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition border hover:opacity-90 disabled:opacity-50"
                      title="Run all test files in workspace"
                    >
                      <Layers className="w-3 h-3" />
                      <span>Run All</span>
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={handleCreateSampleTestFile}
                  style={{
                    backgroundColor: activeTheme.accent,
                    color: '#ffffff',
                  }}
                  className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition shadow-xs hover:opacity-90"
                  title="Create test_sample.py starter test"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ test_sample.py</span>
                </button>
              )}
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(true)}
            style={{ color: activeTheme.mutedText }}
            className="p-1 transition hover:opacity-100"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div
        style={{
          backgroundColor: activeTheme.bg,
          color: activeTheme.text,
          fontSize: `${fontSize}px`,
        }}
        className={`flex-1 overflow-y-auto p-3 font-mono transition-colors duration-150 ${
          isWordWrap ? 'overflow-x-hidden' : 'overflow-x-auto'
        }`}
      >
        {/* Output Tab */}
        {activeTab === 'output' && (
          <div>
            {isRunningCode ? (
              <div
                style={{
                  backgroundColor: activeTheme.cardBg,
                  borderColor: activeTheme.accent,
                  color: activeTheme.accent,
                }}
                className="flex items-center justify-between p-2 rounded border mb-2"
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Executing Python script in isolated sandbox...</span>
                </div>
                <button
                  onClick={handleInterruptOrTerminate}
                  className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-medium"
                >
                  Terminate (Ctrl+C)
                </button>
              </div>
            ) : executionResult ? (
              <div className="space-y-2">
                <div
                  style={{
                    borderColor: activeTheme.border,
                    color: activeTheme.mutedText,
                  }}
                  className="flex items-center justify-between pb-1 border-b text-[11px]"
                >
                  <div className="flex items-center gap-3">
                    <span
                      style={{
                        color: executionResult.status === 'completed' ? activeTheme.prompt : activeTheme.stderrText,
                      }}
                      className="font-semibold"
                    >
                      [{executionResult.status.toUpperCase()}]
                    </span>
                    <span>Exit Code: {executionResult.exitCode}</span>
                    <span>Duration: {executionResult.executionTimeMs}ms</span>
                  </div>
                  <span className="text-[10px] opacity-75">Ctrl+K to clear</span>
                </div>

                {executionResult.stdout && (
                  <pre
                    style={{ color: activeTheme.stdoutText || activeTheme.text, fontSize: `${fontSize}px` }}
                    className={`${
                      isWordWrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre overflow-x-auto'
                    } select-text leading-relaxed`}
                  >
                    {executionResult.stdout}
                  </pre>
                )}

                {executionResult.stderr && (
                  <pre
                    style={{
                      color: activeTheme.stderrText,
                      backgroundColor: activeTheme.stderrBg,
                      borderColor: activeTheme.stderrText,
                      fontSize: `${fontSize}px`,
                    }}
                    className={`${
                      isWordWrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre overflow-x-auto'
                    } select-text p-2 rounded leading-relaxed border border-opacity-30`}
                  >
                    {executionResult.stderr}
                  </pre>
                )}
              </div>
            ) : (
              <div
                style={{ color: activeTheme.mutedText }}
                className="italic py-4 text-center text-[11px]"
              >
                No execution output yet. Click <span className="font-semibold" style={{ color: activeTheme.prompt }}>RUN ▶</span> or type <code style={{ backgroundColor: activeTheme.cardBg, color: activeTheme.commandText }} className="px-1 py-0.5 rounded">python main.py</code> in Terminal.
              </div>
            )}
          </div>
        )}

        {/* Interactive Terminal Tab */}
        {activeTab === 'terminal' && (
          <div
            ref={terminalScrollRef}
            onClick={() => terminalInputRef.current?.focus()}
            className="space-y-1.5 leading-relaxed cursor-text min-h-full flex flex-col justify-between"
          >
            <div>
              <div
                style={{
                  borderColor: activeTheme.border,
                  color: activeTheme.mutedText,
                }}
                className="text-[10px] font-semibold tracking-wide uppercase pb-1 flex items-center justify-between border-b"
              >
                <span>CodeSync Virtual Terminal (Python 3.12 Sandboxed)</span>
                <span className="text-[9px] font-mono opacity-80">Preset: {activeTheme.name} • Wrap: {isWordWrap ? 'ON' : 'OFF'} • Ctrl+K: Clear</span>
              </div>

              {/* Combined logs */}
              {terminalLogs.map((log, i) => (
                <div
                  key={`app_log_${i}`}
                  style={{ color: activeTheme.text, fontSize: `${fontSize}px` }}
                  className={isWordWrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre overflow-x-auto'}
                >
                  {log}
                </div>
              ))}

              {customTerminalLogs.map((log, i) => (
                <div
                  key={`custom_log_${i}`}
                  style={{ color: activeTheme.text, fontSize: `${fontSize}px` }}
                  className={isWordWrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre overflow-x-auto'}
                >
                  {log}
                </div>
              ))}
            </div>

            {/* Interactive Prompt Command Line */}
            <div
              style={{
                borderColor: activeTheme.border,
              }}
              className="flex items-center gap-2 pt-2 pb-1 border-t"
            >
              <span
                style={{ color: activeTheme.prompt, fontSize: `${fontSize}px` }}
                className="font-semibold shrink-0 select-none"
              >
                codesync@sandbox:~$
              </span>
              <input
                ref={terminalInputRef}
                type="text"
                autoFocus
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="type 'help', 'theme monokai', 'theme light', 'python main.py'..."
                style={{
                  color: activeTheme.inputText,
                  fontSize: `${fontSize}px`,
                }}
                className="flex-1 bg-transparent border-none outline-none font-mono p-0 m-0"
              />
              <span style={{ color: activeTheme.mutedText }} className="text-[10px] opacity-60 shrink-0 select-none">
                <CornerDownLeft className="w-3 h-3 inline mr-0.5" />
                Enter
              </span>
            </div>
          </div>
        )}

        {/* Problems Tab */}
        {activeTab === 'problems' && (
          <div className="space-y-1.5">
            {problems.length === 0 ? (
              <div
                style={{ color: activeTheme.prompt }}
                className="flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>No problems detected in current file.</span>
              </div>
            ) : (
              problems.map((p, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: activeTheme.cardBg,
                    borderColor: activeTheme.cardBorder,
                    color: activeTheme.text,
                  }}
                  className="flex items-start gap-2 p-2 rounded border shadow-2xs"
                >
                  <AlertCircle
                    className="w-4 h-4 shrink-0"
                    style={{
                      color: p.severity === 'error' ? activeTheme.stderrText : '#f59e0b',
                    }}
                  />
                  <div>
                    <span style={{ color: activeTheme.mutedText }}>Line {p.line}:</span>{' '}
                    <span className="font-medium">{p.message}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Python Unittests Tab */}
        {activeTab === 'unittests' && (
          <div className="space-y-3">
            {/* Control & Summary Toolbar */}
            <div
              style={{
                backgroundColor: activeTheme.cardBg,
                borderColor: activeTheme.cardBorder,
              }}
              className="p-2.5 rounded border shadow-2xs flex flex-wrap items-center justify-between gap-2.5"
            >
              {/* Left: Suite Metrics & Status */}
              <div className="flex flex-wrap items-center gap-2">
                {unittestSuite ? (
                  <>
                    <span
                      style={{
                        backgroundColor:
                          unittestSuite.failed + unittestSuite.errors === 0
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(239, 68, 68, 0.15)',
                        color:
                          unittestSuite.failed + unittestSuite.errors === 0
                            ? '#10b981'
                            : '#ef4444',
                        borderColor:
                          unittestSuite.failed + unittestSuite.errors === 0
                            ? 'rgba(16, 185, 129, 0.3)'
                            : 'rgba(239, 68, 68, 0.3)',
                      }}
                      className="px-2 py-0.5 rounded border text-[11px] font-semibold flex items-center gap-1.5"
                    >
                      {unittestSuite.failed + unittestSuite.errors === 0 ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>ALL PASSED</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          <span>TESTS FAILED</span>
                        </>
                      )}
                    </span>

                    <span style={{ color: activeTheme.mutedText }} className="text-[11px] font-mono">
                      File:{' '}
                      <strong style={{ color: activeTheme.text }}>
                        {unittestSuite.testFile}
                      </strong>
                    </span>

                    <span style={{ color: activeTheme.mutedText }} className="text-[11px] font-mono">
                      • {unittestSuite.passed}/{unittestSuite.total} passed
                      {unittestSuite.failed > 0 && ` (${unittestSuite.failed} failed)`}
                      {unittestSuite.errors > 0 && ` (${unittestSuite.errors} errors)`}
                      • {unittestSuite.durationMs}ms
                    </span>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-[11px]" style={{ color: activeTheme.mutedText }}>
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Python unittest test runner (Isolated Docker/Subprocess Sandbox)</span>
                  </div>
                )}
              </div>

              {/* Right: Filters, Search, Expand All */}
              {unittestSuite && (
                <div className="flex flex-wrap items-center gap-2">
                  {/* Status Filter Buttons */}
                  <div
                    style={{ borderColor: activeTheme.border }}
                    className="flex items-center rounded border p-0.5 text-[10px]"
                  >
                    <button
                      onClick={() => setUnittestFilter('ALL')}
                      style={{
                        backgroundColor:
                          unittestFilter === 'ALL'
                            ? activeTheme.border
                            : 'transparent',
                        color:
                          unittestFilter === 'ALL'
                            ? activeTheme.text
                            : activeTheme.mutedText,
                      }}
                      className="px-2 py-0.5 rounded transition font-medium"
                    >
                      All ({unittestSuite.total})
                    </button>
                    <button
                      onClick={() => setUnittestFilter('PASSED')}
                      style={{
                        backgroundColor:
                          unittestFilter === 'PASSED'
                            ? 'rgba(16, 185, 129, 0.2)'
                            : 'transparent',
                        color:
                          unittestFilter === 'PASSED'
                            ? '#10b981'
                            : activeTheme.mutedText,
                      }}
                      className="px-2 py-0.5 rounded transition font-medium"
                    >
                      Passed ({unittestSuite.passed})
                    </button>
                    <button
                      onClick={() => setUnittestFilter('FAILED')}
                      style={{
                        backgroundColor:
                          unittestFilter === 'FAILED'
                            ? 'rgba(239, 68, 68, 0.2)'
                            : 'transparent',
                        color:
                          unittestFilter === 'FAILED'
                            ? '#ef4444'
                            : activeTheme.mutedText,
                      }}
                      className="px-2 py-0.5 rounded transition font-medium"
                    >
                      Failed ({unittestSuite.failed + unittestSuite.errors})
                    </button>
                  </div>

                  {/* Search filter input */}
                  <div className="relative">
                    <Search
                      className="w-3 h-3 absolute left-2 top-1.5 pointer-events-none"
                      style={{ color: activeTheme.mutedText }}
                    />
                    <input
                      type="text"
                      value={unittestSearch}
                      onChange={(e) => setUnittestSearch(e.target.value)}
                      placeholder="Filter test cases..."
                      style={{
                        backgroundColor: activeTheme.bg,
                        borderColor: activeTheme.border,
                        color: activeTheme.text,
                      }}
                      className="pl-6 pr-2 py-0.5 rounded border text-[10px] outline-none w-32 focus:w-40 transition-all font-sans"
                    />
                  </div>

                  {/* Expand / Collapse All */}
                  <button
                    onClick={toggleExpandAll}
                    style={{ color: activeTheme.mutedText }}
                    className="text-[10px] hover:underline px-1 py-0.5"
                    title="Toggle expand/collapse all traces"
                  >
                    {expandedTestIds.size > 0 ? 'Collapse All' : 'Expand All'}
                  </button>
                </div>
              )}
            </div>

            {/* Loading Indicator */}
            {isRunningUnittests && (
              <div
                style={{
                  backgroundColor: activeTheme.cardBg,
                  borderColor: activeTheme.accent,
                  color: activeTheme.accent,
                }}
                className="flex items-center justify-between p-3 rounded border text-[11px]"
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>
                    Executing Python unittest runner in isolated sandbox for{' '}
                    <strong>
                      {workspaceFiles.find((f) => f.id === selectedTestFileId)?.name || 'test suite'}
                    </strong>
                    ...
                  </span>
                </div>
                <button
                  onClick={handleInterruptOrTerminate}
                  className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-medium"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Empty State when no suite has been executed yet */}
            {!unittestSuite && !isRunningUnittests && (
              <div
                style={{
                  backgroundColor: activeTheme.cardBg,
                  borderColor: activeTheme.cardBorder,
                }}
                className="p-6 rounded border text-center space-y-3"
              >
                <div
                  style={{
                    backgroundColor: `${activeTheme.prompt}20`,
                    color: activeTheme.prompt,
                  }}
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
                >
                  <CheckSquare className="w-6 h-6" />
                </div>

                <div>
                  <h4 className="font-semibold text-sm" style={{ color: activeTheme.text }}>
                    Python Unittest Runner
                  </h4>
                  <p
                    className="text-[11px] max-w-md mx-auto mt-1"
                    style={{ color: activeTheme.mutedText }}
                  >
                    Execute structured test suites using Python&apos;s standard{' '}
                    <code
                      style={{
                        backgroundColor: activeTheme.bg,
                        color: activeTheme.accent,
                      }}
                      className="px-1 py-0.5 rounded font-mono"
                    >
                      unittest
                    </code>{' '}
                    framework with real-time pass/fail inspection and error tracebacks.
                  </p>
                </div>

                {unittestFiles.length > 0 ? (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleRunUnittest()}
                        style={{
                          backgroundColor: activeTheme.prompt,
                          color: '#ffffff',
                        }}
                        className="px-4 py-1.5 rounded font-medium text-xs flex items-center gap-2 shadow-sm hover:opacity-90 transition"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>
                          Run {unittestFiles[0]?.name || 'Tests'}
                        </span>
                      </button>

                      {unittestFiles.length > 1 && (
                        <button
                          onClick={handleRunAllWorkspaceTests}
                          style={{
                            backgroundColor: activeTheme.cardBg,
                            borderColor: activeTheme.border,
                            color: activeTheme.text,
                          }}
                          className="px-3 py-1.5 rounded font-medium text-xs border hover:opacity-90 transition flex items-center gap-1.5"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>Run All ({unittestFiles.length} files)</span>
                        </button>
                      )}
                    </div>

                    <div className="text-[10px]" style={{ color: activeTheme.mutedText }}>
                      Detected {unittestFiles.length} test file(s):{' '}
                      {unittestFiles.map((f, i) => (
                        <span
                          key={f.id}
                          onClick={() => {
                            setSelectedTestFileId(f.id);
                            if (onOpenFile) onOpenFile(f);
                          }}
                          className="underline cursor-pointer mx-1 font-mono hover:text-white"
                        >
                          {f.name}
                          {i < unittestFiles.length - 1 ? ',' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pt-2">
                    <p className="text-[11px] text-amber-400">
                      No test files detected (e.g. test_*.py, *_test.py or files importing unittest).
                    </p>
                    <button
                      onClick={handleCreateSampleTestFile}
                      style={{
                        backgroundColor: activeTheme.accent,
                        color: '#ffffff',
                      }}
                      className="px-4 py-1.5 rounded font-medium text-xs inline-flex items-center gap-2 shadow-sm hover:opacity-90 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Starter test_sample.py</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Test Results Structured List */}
            {unittestSuite && (
              <div className="space-y-1.5">
                {filteredUnittests.length === 0 ? (
                  <div
                    style={{
                      backgroundColor: activeTheme.cardBg,
                      color: activeTheme.mutedText,
                    }}
                    className="p-4 rounded border text-center text-[11px] italic"
                  >
                    No test cases match filter &quot;{unittestFilter}&quot;
                    {unittestSearch ? ` and query "${unittestSearch}"` : ''}.
                  </div>
                ) : (
                  filteredUnittests.map((test) => {
                    const isExpanded = expandedTestIds.has(test.id);
                    const isPass = test.status === 'PASSED';
                    const isFail = test.status === 'FAILED';
                    const isErr = test.status === 'ERROR';

                    return (
                      <div
                        key={test.id}
                        style={{
                          backgroundColor: activeTheme.cardBg,
                          borderColor: isPass
                            ? activeTheme.cardBorder
                            : isFail
                            ? 'rgba(239, 68, 68, 0.4)'
                            : 'rgba(245, 158, 11, 0.4)',
                        }}
                        className={`rounded border transition shadow-2xs overflow-hidden ${
                          !isPass ? 'border-l-4' : ''
                        }`}
                      >
                        {/* Row Header */}
                        <div
                          onClick={() => (!isPass || test.error) && toggleTestExpanded(test.id)}
                          className={`p-2 flex items-center justify-between gap-3 ${
                            !isPass || test.error ? 'cursor-pointer select-none' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Status Icon */}
                            {isPass && (
                              <CheckCircle2
                                className="w-4 h-4 shrink-0"
                                style={{ color: activeTheme.prompt }}
                              />
                            )}
                            {isFail && (
                              <XCircle
                                className="w-4 h-4 shrink-0"
                                style={{ color: activeTheme.stderrText }}
                              />
                            )}
                            {isErr && (
                              <AlertTriangle
                                className="w-4 h-4 shrink-0 text-amber-500"
                              />
                            )}

                            {/* Test Info */}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className="font-mono font-semibold text-[11px]"
                                  style={{ color: activeTheme.text }}
                                >
                                  {test.name}
                                </span>

                                <span
                                  style={{
                                    backgroundColor: activeTheme.bg,
                                    borderColor: activeTheme.border,
                                    color: activeTheme.mutedText,
                                  }}
                                  className="px-1.5 py-0.2 rounded border text-[9px] font-mono"
                                >
                                  {test.className}
                                </span>
                              </div>

                              {test.description && (
                                <div
                                  style={{ color: activeTheme.mutedText }}
                                  className="text-[10px] truncate max-w-lg mt-0.5"
                                >
                                  {test.description}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right Meta & Badges */}
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              style={{
                                backgroundColor: isPass
                                  ? 'rgba(16, 185, 129, 0.15)'
                                  : isFail
                                  ? 'rgba(239, 68, 68, 0.15)'
                                  : 'rgba(245, 158, 11, 0.15)',
                                color: isPass
                                  ? '#10b981'
                                  : isFail
                                  ? '#ef4444'
                                  : '#f59e0b',
                              }}
                              className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold"
                            >
                              {test.status}
                            </span>

                            <span
                              style={{ color: activeTheme.mutedText }}
                              className="text-[10px] font-mono"
                            >
                              {test.durationMs}ms
                            </span>

                            {(!isPass || test.error) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleTestExpanded(test.id);
                                }}
                                style={{ color: activeTheme.mutedText }}
                                className="p-0.5 hover:text-white"
                                title={isExpanded ? 'Hide Traceback' : 'Show Traceback'}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Expandable Traceback Box */}
                        {isExpanded && test.error && (
                          <div
                            style={{
                              backgroundColor: activeTheme.bg,
                              borderColor: activeTheme.border,
                            }}
                            className="p-2.5 border-t font-mono text-[11px] space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-[10px] pb-1 border-b border-zinc-800">
                              <span style={{ color: activeTheme.stderrText }} className="font-semibold">
                                Failure & Assertion Traceback:
                              </span>
                              <button
                                onClick={() => {
                                  if (test.error) {
                                    navigator.clipboard?.writeText(test.error);
                                    triggerShortcutToast('Copied traceback');
                                  }
                                }}
                                style={{ color: activeTheme.mutedText }}
                                className="hover:underline text-[10px]"
                              >
                                Copy Trace
                              </button>
                            </div>
                            <pre
                              style={{
                                color: activeTheme.stderrText,
                                backgroundColor: activeTheme.stderrBg,
                              }}
                              className="p-2 rounded overflow-x-auto whitespace-pre-wrap select-text leading-relaxed border border-red-500/20"
                            >
                              {test.error}
                            </pre>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                {/* Raw Python unittest output toggle */}
                {(unittestSuite.rawStdout || unittestSuite.rawStderr) && (
                  <div
                    style={{
                      backgroundColor: activeTheme.cardBg,
                      borderColor: activeTheme.border,
                    }}
                    className="p-2 rounded border mt-3"
                  >
                    <button
                      onClick={() => setShowRawOutput(!showRawOutput)}
                      style={{ color: activeTheme.mutedText }}
                      className="w-full flex items-center justify-between text-[10px] font-mono hover:text-white"
                    >
                      <span className="flex items-center gap-1.5">
                        <FileCode className="w-3.5 h-3.5" />
                        <span>Raw Runner Output (stdout & stderr)</span>
                      </span>
                      <span>{showRawOutput ? '▲ Hide' : '▼ Show'}</span>
                    </button>

                    {showRawOutput && (
                      <div className="mt-2 space-y-1 pt-2 border-t border-zinc-800">
                        {unittestSuite.rawStdout && (
                          <pre
                            style={{ color: activeTheme.text }}
                            className="whitespace-pre-wrap p-2 rounded bg-black/40 text-[10px]"
                          >
                            {unittestSuite.rawStdout}
                          </pre>
                        )}
                        {unittestSuite.rawStderr && (
                          <pre
                            style={{ color: activeTheme.stderrText }}
                            className="whitespace-pre-wrap p-2 rounded bg-red-950/20 text-[10px] border border-red-900/30"
                          >
                            {unittestSuite.rawStderr}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Test Suite Tab */}
        {activeTab === 'tests' && (
          <div className="space-y-2">
            {testResults.length === 0 ? (
              <div style={{ color: activeTheme.mutedText }} className="italic">
                Click &quot;Run All Tests&quot; to execute the test suite.
              </div>
            ) : (
              testResults.map((t, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: activeTheme.cardBg,
                    borderColor: activeTheme.cardBorder,
                    color: activeTheme.text,
                  }}
                  className="p-2 rounded border flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    {t.passed ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: activeTheme.prompt }} />
                    ) : (
                      <XCircle className="w-4 h-4 shrink-0" style={{ color: activeTheme.stderrText }} />
                    )}
                    <div>
                      <div className="font-semibold">
                        {t.name}{' '}
                        <span style={{ color: activeTheme.mutedText }} className="text-[10px] font-normal">
                          [{t.category}]
                        </span>
                      </div>
                      <div style={{ color: activeTheme.mutedText }} className="text-[10px]">
                        {t.details}
                      </div>
                      {t.error && (
                        <div style={{ color: activeTheme.stderrText }} className="text-[10px]">
                          {t.error}
                        </div>
                      )}
                    </div>
                  </div>
                  <span style={{ color: activeTheme.mutedText }} className="text-[10px] font-mono">
                    {t.durationMs}ms
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
