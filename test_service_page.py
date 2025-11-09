#!/usr/bin/env python3
"""
Comprehensive Test Suite for Service Page Functionality
Tests file upload, alert processing, filtering, and export features
"""
import requests
import json
import os
import sys
import time
from pathlib import Path

class ServicePageTester:
    def __init__(self, base_url='http://localhost:8000'):
        self.base_url = base_url
        self.session = requests.Session()
        self.test_results = []
    
    def log_result(self, test_name, passed, message=''):
        """Log test result"""
        status = '✓ PASS' if passed else '✗ FAIL'
        self.test_results.append({
            'test': test_name,
            'passed': passed,
            'message': message
        })
        print(f"{status}: {test_name}")
        if message:
            print(f"    {message}")
    
    def test_health_check(self):
        """Test if server is running"""
        try:
            response = self.session.get(f"{self.base_url}/health", timeout=5)
            if response.status_code == 200:
                self.log_result("Health Check", True, "Server is running")
                return True
            else:
                self.log_result("Health Check", False, f"Unexpected status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Health Check", False, f"Connection error: {str(e)}")
            return False
    
    def test_api_info(self):
        """Test API info endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/api/info", timeout=5)
            if response.status_code == 200:
                data = response.json()
                self.log_result("API Info", True, f"Version: {data.get('version', 'unknown')}")
                return True
            else:
                self.log_result("API Info", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("API Info", False, str(e))
            return False
    
    def test_file_upload(self, file_path):
        """Test file upload functionality"""
        if not os.path.exists(file_path):
            self.log_result("File Upload", False, f"Test file not found: {file_path}")
            return False
        
        try:
            with open(file_path, 'rb') as f:
                files = {'file': (os.path.basename(file_path), f)}
                response = self.session.post(
                    f"{self.base_url}/api/upload",
                    files=files,
                    timeout=300
                )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    alert_count = data.get('alerts_count', 0)
                    self.log_result(
                        "File Upload", 
                        True, 
                        f"Uploaded successfully, found {alert_count} alerts"
                    )
                    return True
                else:
                    self.log_result("File Upload", False, data.get('error', 'Unknown error'))
                    return False
            else:
                error_msg = response.json().get('error', 'Unknown error') if response.headers.get('content-type', '').startswith('application/json') else response.text
                self.log_result("File Upload", False, f"Status {response.status_code}: {error_msg}")
                return False
        except Exception as e:
            self.log_result("File Upload", False, str(e))
            return False
    
    def test_get_alerts(self):
        """Test getting alerts"""
        try:
            # Use longer timeout and don't request geolocation to avoid timeouts
            response = self.session.get(f"{self.base_url}/api/alerts?limit=10", timeout=30)
            if response.status_code == 200:
                data = response.json()
                # API returns list directly, not wrapped in {'alerts': [...]}
                if isinstance(data, list):
                    alerts = data
                else:
                    alerts = data.get('alerts', [])
                self.log_result(
                    "Get Alerts", 
                    True, 
                    f"Retrieved {len(alerts)} alerts"
                )
                return True  # Return True even if no alerts, as long as endpoint works
            else:
                self.log_result("Get Alerts", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Get Alerts", False, str(e))
            return False
    
    def test_alert_filtering(self):
        """Test alert filtering"""
        try:
            # Test various filters with longer timeout
            filters = [
                {'attack': 'SQL Injection', 'limit': 10},  # Use 'attack' not 'attack_type'
                {'status': 'new', 'limit': 10},
                {'min_confidence': 80, 'limit': 10},  # Use 'min_confidence' not 'confidence_min'
                {'limit': 10}
            ]
            
            for filter_params in filters:
                response = self.session.get(
                    f"{self.base_url}/api/alerts",
                    params=filter_params,
                    timeout=30
                )
                if response.status_code == 200:
                    data = response.json()
                    # API returns list directly
                    if isinstance(data, list):
                        alert_count = len(data)
                    else:
                        alert_count = len(data.get('alerts', []))
                    self.log_result(
                        f"Filter: {filter_params}", 
                        True, 
                        f"Found {alert_count} alerts"
                    )
                else:
                    self.log_result(f"Filter: {filter_params}", False, f"Status: {response.status_code}")
            
            return True
        except Exception as e:
            self.log_result("Alert Filtering", False, str(e))
            return False
    
    def test_stats_endpoint(self):
        """Test statistics endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/api/stats", timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.log_result(
                    "Statistics", 
                    True, 
                    f"Total alerts: {data.get('total_alerts', 0)}"
                )
                return True
            else:
                self.log_result("Statistics", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Statistics", False, str(e))
            return False
    
    def test_export_csv(self):
        """Test CSV export"""
        try:
            response = self.session.get(
                f"{self.base_url}/api/export?fmt=csv",
                timeout=60
            )
            if response.status_code == 200:
                content_type = response.headers.get('content-type', '')
                if 'text/csv' in content_type or 'application/csv' in content_type:
                    self.log_result("Export CSV", True, f"Size: {len(response.content)} bytes")
                    return True
                else:
                    self.log_result("Export CSV", False, f"Wrong content type: {content_type}")
                    return False
            else:
                error = response.json().get('error', 'Unknown') if response.headers.get('content-type', '').startswith('application/json') else response.text
                self.log_result("Export CSV", False, f"Status {response.status_code}: {error}")
                return False
        except Exception as e:
            self.log_result("Export CSV", False, str(e))
            return False
    
    def test_export_json(self):
        """Test JSON export"""
        try:
            response = self.session.get(
                f"{self.base_url}/api/export?fmt=json",
                timeout=60
            )
            if response.status_code == 200:
                content_type = response.headers.get('content-type', '')
                if 'application/json' in content_type:
                    data = response.json()
                    self.log_result("Export JSON", True, f"Records: {len(data.get('alerts', []))}")
                    return True
                else:
                    self.log_result("Export JSON", False, f"Wrong content type: {content_type}")
                    return False
            else:
                error = response.json().get('error', 'Unknown') if response.headers.get('content-type', '').startswith('application/json') else response.text
                self.log_result("Export JSON", False, f"Status {response.status_code}: {error}")
                return False
        except Exception as e:
            self.log_result("Export JSON", False, str(e))
            return False
    
    def test_blocklist(self):
        """Test blocklist functionality"""
        try:
            # Get blocklist
            response = self.session.get(f"{self.base_url}/api/blocklist", timeout=10)
            if response.status_code == 200:
                blocklist = response.json()
                self.log_result("Get Blocklist", True, f"Found {len(blocklist)} entries")
            
            # Add to blocklist
            test_ip = "192.168.1.100"
            response = self.session.post(
                f"{self.base_url}/api/blocklist",
                json={'ip': test_ip, 'reason': 'Test block'},
                timeout=10
            )
            if response.status_code == 200:
                self.log_result("Add to Blocklist", True, f"Added {test_ip}")
            else:
                self.log_result("Add to Blocklist", False, f"Status: {response.status_code}")
            
            return True
        except Exception as e:
            self.log_result("Blocklist", False, str(e))
            return False
    
    def test_whitelist(self):
        """Test whitelist functionality"""
        try:
            # Get whitelist
            response = self.session.get(f"{self.base_url}/api/whitelist", timeout=10)
            if response.status_code == 200:
                whitelist = response.json()
                self.log_result("Get Whitelist", True, f"Found {len(whitelist)} entries")
            
            # Add to whitelist
            test_ip = "192.168.1.200"
            response = self.session.post(
                f"{self.base_url}/api/whitelist",
                json={'ip': test_ip, 'reason': 'Test whitelist'},
                timeout=10
            )
            if response.status_code == 200:
                self.log_result("Add to Whitelist", True, f"Added {test_ip}")
            else:
                self.log_result("Add to Whitelist", False, f"Status: {response.status_code}")
            
            return True
        except Exception as e:
            self.log_result("Whitelist", False, str(e))
            return False
    
    def run_all_tests(self, test_file=None):
        """Run all tests"""
        print("\n" + "="*60)
        print("Service Page Test Suite")
        print("="*60 + "\n")
        
        # Health check first
        if not self.test_health_check():
            print("\n❌ Server is not running. Please start the server first.")
            return False
        
        # Run tests
        self.test_api_info()
        time.sleep(1)
        
        # Test file upload if file provided
        if test_file and os.path.exists(test_file):
            self.test_file_upload(test_file)
            time.sleep(2)  # Wait for processing
        
        self.test_get_alerts()
        time.sleep(1)
        
        self.test_alert_filtering()
        time.sleep(1)
        
        self.test_stats_endpoint()
        time.sleep(1)
        
        self.test_export_csv()
        time.sleep(1)
        
        self.test_export_json()
        time.sleep(1)
        
        self.test_blocklist()
        time.sleep(1)
        
        self.test_whitelist()
        
        # Print summary
        print("\n" + "="*60)
        print("Test Summary")
        print("="*60)
        
        passed = sum(1 for r in self.test_results if r['passed'])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total*100):.1f}%")
        print("="*60 + "\n")
        
        return passed == total


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Test Service Page functionality')
    parser.add_argument('--url', default='http://localhost:8000', help='Base URL of the application')
    parser.add_argument('--file', help='Path to test file (e.g., samples/demo_access.log)')
    
    args = parser.parse_args()
    
    tester = ServicePageTester(base_url=args.url)
    
    # Default test file
    test_file = args.file
    if not test_file:
        # Look for sample file
        sample_file = Path(__file__).parent / 'samples' / 'demo_access.log'
        if sample_file.exists():
            test_file = str(sample_file)
            print(f"Using default test file: {test_file}\n")
    
    success = tester.run_all_tests(test_file=test_file)
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()

