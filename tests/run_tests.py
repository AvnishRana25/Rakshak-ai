#!/usr/bin/env python3
"""
Rakshak.ai - Comprehensive Test Runner
Runs all test suites and provides detailed reporting
"""
import sys
import subprocess
import time
import json
from pathlib import Path
from datetime import datetime


class TestRunner:
    """Orchestrates all test execution and reporting"""
    
    def __init__(self, base_url='http://localhost:8000'):
        self.base_url = base_url
        self.results = {}
        self.start_time = None
        self.end_time = None
        
    def print_header(self):
        """Print test runner header"""
        print("\n" + "="*80)
        print("RAKSHAK.AI - COMPREHENSIVE TEST SUITE")
        print("="*80)
        print(f"Base URL: {self.base_url}")
        print(f"Start Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*80 + "\n")
        
    def print_section(self, title):
        """Print section header"""
        print("\n" + "-"*80)
        print(f"  {title}")
        print("-"*80 + "\n")
        
    def run_test_suite(self, script_name, description):
        """Run a single test suite"""
        self.print_section(f"Running: {description}")
        
        script_path = Path(__file__).parent / script_name
        
        if not script_path.exists():
            print(f"❌ Test script not found: {script_name}")
            return False, 0, 0, 0
        
        try:
            result = subprocess.run(
                [sys.executable, str(script_path), '--url', self.base_url],
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout per suite
            )
            
            # Parse output to extract test counts
            output = result.stdout
            print(output)
            
            # Extract test statistics
            passed = 0
            failed = 0
            total = 0
            
            for line in output.split('\n'):
                if 'Total Tests:' in line:
                    try:
                        total = int(line.split(':')[1].strip())
                    except:
                        pass
                elif 'Passed:' in line:
                    try:
                        passed = int(line.split(':')[1].strip())
                    except:
                        pass
                elif 'Failed:' in line:
                    try:
                        failed = int(line.split(':')[1].strip())
                    except:
                        pass
            
            success = result.returncode == 0
            return success, total, passed, failed
            
        except subprocess.TimeoutExpired:
            print(f"❌ Test suite timed out after 5 minutes")
            return False, 0, 0, 0
        except Exception as e:
            print(f"❌ Error running {script_name}: {e}")
            return False, 0, 0, 0
    
    def run_all_tests(self):
        """Run all test suites"""
        self.start_time = datetime.now()
        self.print_header()
        
        # Check server health first
        self.print_section("Pre-flight Check: Server Health")
        health_check = self._check_server_health()
        if not health_check:
            print("❌ Server is not running or not responding")
            print(f"   Please ensure the server is running at {self.base_url}")
            return False
        print("✅ Server is healthy and ready for testing\n")
        time.sleep(1)
        
        # Define test suites
        test_suites = [
            ('test_service_page.py', 'Service Page Functionality'),
            ('test_pcap_capture.py', 'PCAP Capture Functionality'),
            ('test_threat_intel.py', 'Threat Intelligence Functionality')
        ]
        
        # Run each test suite
        for script_name, description in test_suites:
            success, total, passed, failed = self.run_test_suite(script_name, description)
            self.results[description] = {
                'success': success,
                'total': total,
                'passed': passed,
                'failed': failed
            }
            time.sleep(2)  # Brief pause between suites
        
        self.end_time = datetime.now()
        
        # Print final summary
        self._print_summary()
        
        # Return overall success
        return all(r['success'] for r in self.results.values())
    
    def _check_server_health(self):
        """Check if server is responding"""
        try:
            import requests
            response = requests.get(f"{self.base_url}/health", timeout=5)
            return response.status_code == 200
        except Exception:
            return False
    
    def _print_summary(self):
        """Print comprehensive test summary"""
        print("\n" + "="*80)
        print("TEST EXECUTION SUMMARY")
        print("="*80)
        
        # Calculate totals
        total_tests = sum(r['total'] for r in self.results.values())
        total_passed = sum(r['passed'] for r in self.results.values())
        total_failed = sum(r['failed'] for r in self.results.values())
        total_suites = len(self.results)
        passed_suites = sum(1 for r in self.results.values() if r['success'])
        
        # Print suite results
        print("\nTest Suite Results:")
        print("-" * 80)
        for suite_name, result in self.results.items():
            status = "✅ PASS" if result['success'] else "❌ FAIL"
            print(f"{status}  {suite_name}")
            if result['total'] > 0:
                print(f"        Tests: {result['passed']}/{result['total']} passed")
        
        print("\n" + "-"*80)
        print(f"Test Suites:    {passed_suites}/{total_suites} passed")
        print(f"Total Tests:    {total_passed}/{total_tests} passed")
        print(f"Success Rate:   {(total_passed/total_tests*100):.1f}%" if total_tests > 0 else "Success Rate:   N/A")
        
        # Execution time
        if self.start_time and self.end_time:
            duration = (self.end_time - self.start_time).total_seconds()
            print(f"Execution Time: {duration:.1f} seconds")
        
        print("="*80)
        
        # Final verdict
        if passed_suites == total_suites and total_passed == total_tests:
            print("\n🎉 ALL TESTS PASSED! Application is production-ready.")
        elif (total_passed / total_tests * 100) >= 90 if total_tests > 0 else False:
            print(f"\n⚠️  {total_failed} test(s) failed, but 90%+ pass rate achieved.")
        else:
            print(f"\n❌ {total_failed} test(s) failed. Please review the output above.")
        
        print("="*80 + "\n")
        
        # Save results to JSON
        self._save_results()
    
    def _save_results(self):
        """Save test results to JSON file"""
        try:
            results_data = {
                'timestamp': datetime.now().isoformat(),
                'base_url': self.base_url,
                'execution_time': (self.end_time - self.start_time).total_seconds() if self.start_time and self.end_time else 0,
                'suites': self.results
            }
            
            results_file = Path(__file__).parent / 'test_results.json'
            with open(results_file, 'w') as f:
                json.dump(results_data, f, indent=2)
            
            print(f"📄 Detailed results saved to: {results_file}")
        except Exception as e:
            print(f"⚠️  Could not save results: {e}")


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Run comprehensive test suite for Rakshak.ai',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python run_tests.py                           # Test against default (http://localhost:8000)
  python run_tests.py --url http://localhost:5000  # Test against custom URL
        """
    )
    parser.add_argument(
        '--url', 
        default='http://localhost:8000',
        help='Base URL of the application (default: http://localhost:8000)'
    )
    
    args = parser.parse_args()
    
    # Create and run test runner
    runner = TestRunner(base_url=args.url)
    success = runner.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Test execution cancelled by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

