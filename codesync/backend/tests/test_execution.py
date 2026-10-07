import pytest
from execution.sandbox import run_sandboxed_code

def test_safe_execution_success():
    code = "a = 10\nb = 20\nprint(a + b)"
    res = run_sandboxed_code(code)
    assert res['status'] == 'completed'
    assert res['exit_code'] == 0
    assert '30' in res['stdout']

def test_dangerous_syscall_blocked():
    code = "import os\nos.system('echo compromised')"
    res = run_sandboxed_code(code)
    assert res['status'] == 'failed'
    assert 'SecurityError' in res['stderr']

def test_timeout_enforced():
    code = "import time\ntime.sleep(10)"
    res = run_sandboxed_code(code, timeout_sec=1)
    assert res['status'] == 'timeout'
    assert res['exit_code'] == 124
