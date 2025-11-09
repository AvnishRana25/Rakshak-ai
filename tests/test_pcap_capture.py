#!/usr/bin/env python3
"""
Comprehensive Test Suite for PCAP Capture Functionality
Tests capture start/stop, status, download, and interface listing
"""
import requests
import json
import time
import sys
from pathlib import Path

class PcapCaptureTester:
    def __init__(self, base_url='http://localhost:8000'):
        self.base_url = base_url
        self.session = requests.Session()
        self.test_results = []
        self.capture_ids = []
    
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
    
    def test_get_interfaces(self):
        """Test getting available network interfaces"""
        try:
            response = self.session.get(f"{self.base_url}/api/pcap/interfaces", timeout=10)
            if response.status_code == 200:
                data = response.json()
                interfaces = data.get('interfaces', [])
                self.log_result(
                    "Get Interfaces", 
                    True, 
                    f"Found {len(interfaces)} interfaces: {', '.join(interfaces[:5])}"
                )
                return interfaces
            else:
                self.log_result("Get Interfaces", False, f"Status: {response.status_code}")
                return []
        except Exception as e:
            self.log_result("Get Interfaces", False, str(e))
            return []
    
    def test_start_capture(self, interface='any', max_packets=100, duration=30):
        """Test starting a capture"""
        try:
            payload = {
                'interface': interface,
                'max_packets': max_packets,
                'duration': duration
            }
            
            response = self.session.post(
                f"{self.base_url}/api/pcap/start",
                json=payload,
                timeout=10
            )
            
            if response.status_code == 201:
                data = response.json()
                capture_id = data.get('capture_id')
                if capture_id:
                    self.capture_ids.append(capture_id)
                    self.log_result(
                        "Start Capture", 
                        True, 
                        f"Capture ID: {capture_id[:8]}..."
                    )
                    return capture_id
                else:
                    self.log_result("Start Capture", False, "No capture_id in response")
                    return None
            else:
                error = response.json().get('error', 'Unknown error') if response.headers.get('content-type', '').startswith('application/json') else response.text
                self.log_result("Start Capture", False, f"Status {response.status_code}: {error}")
                return None
        except Exception as e:
            self.log_result("Start Capture", False, str(e))
            return None
    
    def test_start_capture_with_filter(self, interface='any', filter_rules='tcp port 80'):
        """Test starting a capture with BPF filter"""
        try:
            payload = {
                'interface': interface,
                'filter': filter_rules,
                'max_packets': 50
            }
            
            response = self.session.post(
                f"{self.base_url}/api/pcap/start",
                json=payload,
                timeout=10
            )
            
            if response.status_code == 201:
                data = response.json()
                capture_id = data.get('capture_id')
                if capture_id:
                    self.capture_ids.append(capture_id)
                    self.log_result(
                        "Start Capture with Filter", 
                        True, 
                        f"Capture ID: {capture_id[:8]}... (filter: {filter_rules})"
                    )
                    return capture_id
                else:
                    self.log_result("Start Capture with Filter", False, "No capture_id in response")
                    return None
            else:
                error = response.json().get('error', 'Unknown error') if response.headers.get('content-type', '').startswith('application/json') else response.text
                self.log_result("Start Capture with Filter", False, f"Status {response.status_code}: {error}")
                return None
        except Exception as e:
            self.log_result("Start Capture with Filter", False, str(e))
            return None
    
    def test_get_capture_status(self, capture_id=None):
        """Test getting capture status"""
        try:
            if capture_id:
                url = f"{self.base_url}/api/pcap/status/{capture_id}"
            else:
                url = f"{self.base_url}/api/pcap/status"
            
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if capture_id:
                    status = data.get('status', 'unknown')
                    self.log_result(
                        "Get Capture Status", 
                        True, 
                        f"Status: {status}"
                    )
                else:
                    captures = data.get('captures', [])
                    active = data.get('active_count', 0)
                    self.log_result(
                        "Get All Captures", 
                        True, 
                        f"Total: {len(captures)}, Active: {active}"
                    )
                return data
            else:
                error = response.json().get('error', 'Unknown error') if response.headers.get('content-type', '').startswith('application/json') else response.text
                self.log_result("Get Capture Status", False, f"Status {response.status_code}: {error}")
                return None
        except Exception as e:
            self.log_result("Get Capture Status", False, str(e))
            return None
    
    def test_stop_capture(self, capture_id):
        """Test stopping a capture"""
        try:
            response = self.session.post(
                f"{self.base_url}/api/pcap/stop/{capture_id}",
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                status = data.get('status', 'unknown')
                packet_count = data.get('packet_count', 0)
                self.log_result(
                    "Stop Capture", 
                    True, 
                    f"Status: {status}, Packets: {packet_count}"
                )
                return True
            else:
                error = response.json().get('error', 'Unknown error') if response.headers.get('content-type', '').startswith('application/json') else response.text
                self.log_result("Stop Capture", False, f"Status {response.status_code}: {error}")
                return False
        except Exception as e:
            self.log_result("Stop Capture", False, str(e))
            return False
    
    def test_download_capture(self, capture_id):
        """Test downloading a capture file"""
        try:
            response = self.session.get(
                f"{self.base_url}/api/pcap/download/{capture_id}",
                timeout=60,
                stream=True
            )
            
            if response.status_code == 200:
                content_length = response.headers.get('content-length', 0)
                content_type = response.headers.get('content-type', '')
                
                # Read a small chunk to verify it's a valid file
                chunk = next(response.iter_content(chunk_size=1024), None)
                if chunk:
                    self.log_result(
                        "Download Capture", 
                        True, 
                        f"Size: {content_length} bytes, Type: {content_type}"
                    )
                    return True
                else:
                    self.log_result("Download Capture", False, "Empty file")
                    return False
            else:
                error = response.json().get('error', 'Unknown error') if response.headers.get('content-type', '').startswith('application/json') else response.text
                self.log_result("Download Capture", False, f"Status {response.status_code}: {error}")
                return False
        except Exception as e:
            self.log_result("Download Capture", False, str(e))
            return False
    
    def test_delete_capture(self, capture_id):
        """Test deleting a capture"""
        try:
            response = self.session.delete(
                f"{self.base_url}/api/pcap/delete/{capture_id}",
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.log_result("Delete Capture", True, "Capture deleted successfully")
                    return True
                else:
                    self.log_result("Delete Capture", False, "Delete not successful")
                    return False
            else:
                error = response.json().get('error', 'Unknown error') if response.headers.get('content-type', '').startswith('application/json') else response.text
                self.log_result("Delete Capture", False, f"Status {response.status_code}: {error}")
                return False
        except Exception as e:
            self.log_result("Delete Capture", False, str(e))
            return False
    
    def test_validation_errors(self):
        """Test input validation"""
        try:
            # Test invalid max_packets
            response = self.session.post(
                f"{self.base_url}/api/pcap/start",
                json={'interface': 'any', 'max_packets': -1},
                timeout=10
            )
            if response.status_code == 400:
                self.log_result("Validation: Negative max_packets", True, "Correctly rejected")
            else:
                self.log_result("Validation: Negative max_packets", False, f"Should be 400, got {response.status_code}")
            
            # Test invalid duration
            response = self.session.post(
                f"{self.base_url}/api/pcap/start",
                json={'interface': 'any', 'duration': 99999},
                timeout=10
            )
            if response.status_code == 400:
                self.log_result("Validation: Excessive duration", True, "Correctly rejected")
            else:
                self.log_result("Validation: Excessive duration", False, f"Should be 400, got {response.status_code}")
            
            return True
        except Exception as e:
            self.log_result("Validation Tests", False, str(e))
            return False
    
    def run_all_tests(self):
        """Run all tests"""
        print("\n" + "="*60)
        print("PCAP Capture Test Suite")
        print("="*60 + "\n")
        
        # Health check first
        if not self.test_health_check():
            print("\n❌ Server is not running. Please start the server first.")
            return False
        
        # Get interfaces
        interfaces = self.test_get_interfaces()
        # Prefer 'any' interface for Docker compatibility, fallback to first available
        if 'any' in interfaces:
            test_interface = 'any'
        elif interfaces:
            test_interface = interfaces[0]
        else:
            test_interface = 'any'
        time.sleep(1)
        
        # Test validation
        self.test_validation_errors()
        time.sleep(1)
        
        # Test starting a capture
        capture_id = self.test_start_capture(
            interface=test_interface,
            max_packets=100,
            duration=30
        )
        time.sleep(2)
        
        if capture_id:
            # Test getting status while running
            self.test_get_capture_status(capture_id)
            time.sleep(1)
            
            # Test stopping capture
            self.test_stop_capture(capture_id)
            time.sleep(2)
            
            # Test getting status after stop
            self.test_get_capture_status(capture_id)
            time.sleep(1)
            
            # Test download
            self.test_download_capture(capture_id)
            time.sleep(1)
            
            # Test delete
            self.test_delete_capture(capture_id)
            time.sleep(1)
        
        # Test capture with filter
        filter_capture_id = self.test_start_capture_with_filter(
            interface=test_interface,
            filter_rules='tcp port 80'
        )
        time.sleep(2)
        
        if filter_capture_id:
            self.test_stop_capture(filter_capture_id)
            time.sleep(1)
            self.test_delete_capture(filter_capture_id)
        
        # Test getting all captures
        self.test_get_capture_status()
        
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
    
    parser = argparse.ArgumentParser(description='Test PCAP Capture functionality')
    parser.add_argument('--url', default='http://localhost:8000', help='Base URL of the application')
    
    args = parser.parse_args()
    
    tester = PcapCaptureTester(base_url=args.url)
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()

