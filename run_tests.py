#!/usr/bin/env python3
"""
Rakshak.ai - Master Test Runner
Entry point for running all comprehensive tests
"""
import sys
import subprocess
from pathlib import Path

if __name__ == '__main__':
    # Run the test suite from tests directory
    test_runner = Path(__file__).parent / 'tests' / 'run_tests.py'
    
    if not test_runner.exists():
        print(f"❌ Test runner not found at: {test_runner}")
        sys.exit(1)
    
    # Forward all arguments to the actual test runner
    result = subprocess.run(
        [sys.executable, str(test_runner)] + sys.argv[1:],
        cwd=Path(__file__).parent
    )
    
    sys.exit(result.returncode)

