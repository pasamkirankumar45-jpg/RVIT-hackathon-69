import sys
import subprocess
import time

def main():
    if len(sys.argv) < 2:
        print("Usage: runner.py <script_file>", file=sys.stderr)
        sys.exit(1)

    script_path = sys.argv[1]
    start = time.time()
    try:
        proc = subprocess.run(
            ["python3", "-u", script_path],
            capture_output=True,
            text=True,
            timeout=5
        )
        duration = int((time.time() - start) * 1000)
        sys.stdout.write(proc.stdout)
        sys.stderr.write(proc.stderr)
        print(f"\n[Execution finished with code {proc.returncode} in {duration}ms]")
        sys.exit(proc.returncode)
    except subprocess.TimeoutExpired:
        print("\n[Execution Timeout: exceeded 5000ms limit]", file=sys.stderr)
        sys.exit(124)

if __name__ == "__main__":
    main()
