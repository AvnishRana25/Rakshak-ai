#!/usr/bin/env python3
"""
Comprehensive Test Suite for Threat Intelligence Page Functionality
Tests Gemini AI analysis, IP reputation, and threat intelligence features
"""
import requests
import json
import time
import sys

class ThreatIntelTester:
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
    
    def test_get_threat_intel(self, ip_address):
        """Test getting threat intelligence for an IP"""
        try:
            response = self.session.get(
                f"{self.base_url}/api/gemini/threat-intel/{ip_address}",
                timeout=60  # Gemini API can be slow
            )
            
            if response.status_code == 200:
                data = response.json()
                reputation = data.get('ip_reputation', 'unknown')
                recommendations = data.get('recommendations', 'N/A')
                self.log_result(
                    "Get Threat Intel", 
                    True, 
                    f"IP: {ip_address}, Reputation: {reputation}, Recommendation: {recommendations[:50]}..."
                )
                return data
            else:
                error = response.json().get('error', 'Unknown error') if response.headers.get('content-type', '').startswith('application/json') else response.text
                self.log_result("Get Threat Intel", False, f"Status {response.status_code}: {error}")
                return None
        except Exception as e:
            self.log_result("Get Threat Intel", False, str(e))
            return None
    
    def test_analyze_alert(self, alert_id=None, ip_address=None):
        """Test analyzing an alert using Gemini"""
        try:
            payload = {}
            if alert_id:
                payload['alert_id'] = alert_id
            if ip_address:
                payload['ip_address'] = ip_address
            
            if not payload:
                self.log_result("Analyze Alert", False, "No alert_id or ip_address provided")
                return None
            
            response = self.session.post(
                f"{self.base_url}/api/gemini/analyze",
                json=payload,
                timeout=60
            )
            
            if response.status_code == 200:
                data = response.json()
                threat_level = data.get('threat_level', 'unknown')
                analysis_id = data.get('analysis_id')
                self.log_result(
                    "Analyze Alert", 
                    True, 
                    f"Threat Level: {threat_level}, Analysis ID: {analysis_id}"
                )
                return data
            else:
                error = response.json().get('error', 'Unknown error') if response.headers.get('content-type', '').startswith('application/json') else response.text
                self.log_result("Analyze Alert", False, f"Status {response.status_code}: {error}")
                return None
        except Exception as e:
            self.log_result("Analyze Alert", False, str(e))
            return None
    
    def test_get_analysis(self, analysis_id):
        """Test getting analysis by ID"""
        try:
            response = self.session.get(
                f"{self.base_url}/api/gemini/analysis/{analysis_id}",
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                threat_level = data.get('threat_level', 'unknown')
                self.log_result(
                    "Get Analysis", 
                    True, 
                    f"Threat Level: {threat_level}"
                )
                return data
            else:
                error = response.json().get('error', 'Unknown error') if response.headers.get('content-type', '').startswith('application/json') else response.text
                self.log_result("Get Analysis", False, f"Status {response.status_code}: {error}")
                return None
        except Exception as e:
            self.log_result("Get Analysis", False, str(e))
            return None
    
    def test_batch_analyze(self, alert_ids):
        """Test batch analysis"""
        try:
            response = self.session.post(
                f"{self.base_url}/api/gemini/batch-analyze",
                json={'alert_ids': alert_ids},
                timeout=120  # Batch can take longer
            )
            
            if response.status_code == 200:
                data = response.json()
                processed = data.get('processed_count', 0)
                self.log_result(
                    "Batch Analyze", 
                    True, 
                    f"Processed {processed} alerts"
                )
                return data
            else:
                error = response.json().get('error', 'Unknown error') if response.headers.get('content-type', '').startswith('application/json') else response.text
                self.log_result("Batch Analyze", False, f"Status {response.status_code}: {error}")
                return None
        except Exception as e:
            self.log_result("Batch Analyze", False, str(e))
            return None
    
    def test_validation_errors(self):
        """Test input validation"""
        try:
            # Test missing IP/alert
            response = self.session.post(
                f"{self.base_url}/api/gemini/analyze",
                json={},
                timeout=10
            )
            if response.status_code == 400:
                self.log_result("Validation: Missing IP/Alert", True, "Correctly rejected")
            else:
                self.log_result("Validation: Missing IP/Alert", False, f"Should be 400, got {response.status_code}")
            
            # Test invalid IP format (if validation exists)
            response = self.session.get(
                f"{self.base_url}/api/gemini/threat-intel/invalid-ip",
                timeout=10
            )
            # This might still work if validation is lenient, so we just check it doesn't crash
            if response.status_code in [200, 400, 404]:
                self.log_result("Validation: Invalid IP Format", True, f"Handled gracefully (status: {response.status_code})")
            else:
                self.log_result("Validation: Invalid IP Format", False, f"Unexpected status: {response.status_code}")
            
            return True
        except Exception as e:
            self.log_result("Validation Tests", False, str(e))
            return False
    
    def test_known_safe_ips(self):
        """Test with known safe IPs"""
        safe_ips = [
            '8.8.8.8',      # Google DNS
            '1.1.1.1',      # Cloudflare DNS
            '208.67.222.222'  # OpenDNS
        ]
        
        for ip in safe_ips:
            result = self.test_get_threat_intel(ip)
            time.sleep(2)  # Rate limiting
    
    def test_known_suspicious_ips(self):
        """Test with potentially suspicious IPs (if any in alerts)"""
        # Get some alerts first
        try:
            response = self.session.get(f"{self.base_url}/api/alerts?limit=5", timeout=10)
            if response.status_code == 200:
                data = response.json()
                # API returns list directly, not wrapped in {'alerts': [...]}
                if isinstance(data, list):
                    alerts = data
                else:
                    alerts = data.get('alerts', [])
                if alerts:
                    # Test with IPs from alerts
                    for alert in alerts[:2]:  # Test first 2
                        if isinstance(alert, dict):
                            ip = alert.get('src_ip')
                        else:
                            ip = None
                        if ip:
                            self.test_get_threat_intel(ip)
                            time.sleep(2)
        except Exception as e:
            self.log_result("Test Suspicious IPs", False, str(e))
    
    def run_all_tests(self):
        """Run all tests"""
        print("\n" + "="*60)
        print("Threat Intelligence Test Suite")
        print("="*60 + "\n")
        
        # Health check first
        if not self.test_health_check():
            print("\n❌ Server is not running. Please start the server first.")
            return False
        
        # Test validation
        self.test_validation_errors()
        time.sleep(1)
        
        # Test with known safe IPs
        print("\n--- Testing Known Safe IPs ---")
        self.test_known_safe_ips()
        time.sleep(2)
        
        # Test direct IP analysis
        print("\n--- Testing Direct IP Analysis ---")
        self.test_analyze_alert(ip_address='8.8.8.8')
        time.sleep(2)
        
        # Test getting analysis (if we have an analysis_id)
        # This would require a successful analysis first
        
        # Test with suspicious IPs from alerts
        print("\n--- Testing IPs from Alerts ---")
        self.test_known_suspicious_ips()
        time.sleep(2)
        
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
    
    parser = argparse.ArgumentParser(description='Test Threat Intelligence functionality')
    parser.add_argument('--url', default='http://localhost:8000', help='Base URL of the application')
    
    args = parser.parse_args()
    
    tester = ThreatIntelTester(base_url=args.url)
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()

