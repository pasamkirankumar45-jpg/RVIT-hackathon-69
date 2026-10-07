"""
Isolated Python Code Execution Sandbox
Applies CPU limits, memory limits, and static AST security checks.
"""

import ast
import subprocess
import tempfile
import time
import os
import resource
from typing import Dict, Any

class SecurityViolationError(Exception):
    pass

class ASTSecurityChecker(ast.NodeVisitor):
    BANNED_MODULES = {'subprocess', 'shutil', 'socket', 'posix', 'pty', 'signal'}
    BANNED_BUILTINS = {'compile', 'eval', 'exec', '__import__'}

    def visit_Import(self, node):
        for alias in node.names:
            if alias.name.split('.')[0] in self.BANNED_MODULES:
                raise SecurityViolationError(f"Import of '{alias.name}' is prohibited by CodeSync sandbox policy.")
        self.generic_visit(node)

    def visit_ImportFrom(self, node):
        if node.module and node.module.split('.')[0] in self.BANNED_MODULES:
            raise SecurityViolationError(f"Import from '{node.module}' is prohibited by CodeSync sandbox policy.")
        self.generic_visit(node)

    def visit_Call(self, node):
        # Prevent direct calls to dangerous builtins or os.system
        if isinstance(node.func, ast.Name) and node.func.id in self.BANNED_BUILTINS:
            raise SecurityViolationError(f"Direct invocation of '{node.func.id}()' is prohibited.")
        if isinstance(node.func, ast.Attribute) and node.func.attr == 'system':
            raise SecurityViolationError("Invocation of 'os.system()' is prohibited.")
        self.generic_visit(node)

def run_sandboxed_code(code: str, timeout_sec: int = 5) -> Dict[str, Any]:
    """
    Executes Python code in an isolated temporary subprocess with resource limits.
    """
    # 1. Static AST Analysis
    try:
        tree = ast.parse(code)
        checker = ASTSecurityChecker()
        checker.visit(tree)
    except SecurityViolationError as sve:
        return {
            'status': 'failed',
            'stdout': '',
            'stderr': f"SecurityError: {str(sve)}",
            'exit_code': 1,
            'execution_time_ms': 2,
        }
    except SyntaxError as se:
        return {
            'status': 'failed',
            'stdout': '',
            'stderr': f"SyntaxError: {str(se)}",
            'exit_code': 1,
            'execution_time_ms': 1,
        }

    # 2. Write code to temporary directory
    with tempfile.TemporaryDirectory() as tmpdir:
        script_path = os.path.join(tmpdir, "script.py")
        with open(script_path, "w", encoding="utf-8") as f:
            f.write(code)

        start_time = time.time()
        try:
            # Set memory and process limits for child
            def set_limits():
                # Limit memory to 256MB
                resource.setrlimit(resource.RLIMIT_AS, (256 * 1024 * 1024, 256 * 1024 * 1024))
                # Limit CPU time to timeout + 1
                resource.setrlimit(resource.RLIMIT_CPU, (timeout_sec + 1, timeout_sec + 1))

            proc = subprocess.run(
                ["python3", "-u", script_path],
                capture_output=True,
                text=True,
                timeout=timeout_sec,
                cwd=tmpdir,
                preexec_fn=set_limits,
                env={"PYTHONUNBUFFERED": "1", "PYTHONDONTWRITEBYTECODE": "1", "PATH": os.environ.get("PATH", "")}
            )

            duration_ms = int((time.time() - start_time) * 1000)
            return {
                'status': 'completed' if proc.returncode == 0 else 'failed',
                'stdout': proc.stdout,
                'stderr': proc.stderr,
                'exit_code': proc.returncode,
                'execution_time_ms': duration_ms,
            }

        except subprocess.TimeoutExpired:
            return {
                'status': 'timeout',
                'stdout': '',
                'stderr': f"ExecutionTimeout: Process exceeded {timeout_sec}s execution window.",
                'exit_code': 124,
                'execution_time_ms': timeout_sec * 1000,
            }
        except Exception as exc:
            return {
                'status': 'failed',
                'stdout': '',
                'stderr': f"RuntimeError: {str(exc)}",
                'exit_code': 1,
                'execution_time_ms': int((time.time() - start_time) * 1000),
            }
