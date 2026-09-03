from pathlib import Path
import subprocess, sys

SCRIPT_DIR = Path(__file__).parent
inference_py = SCRIPT_DIR / "inference.py"
test_audio = sys.argv[1] if len(sys.argv) > 1 else None

if not test_audio:
    print(f"Usage: python run_test.py <path_to_audio_file>")
    sys.exit(1)

result = subprocess.run(
    [
        sys.executable,
        str(inference_py),
        str(test_audio),
        str(SCRIPT_DIR),
    ],
    capture_output=True,
    text=True,
)

print("STDOUT:", result.stdout)
print("STDERR:", result.stderr)
print("CODE:", result.returncode)
