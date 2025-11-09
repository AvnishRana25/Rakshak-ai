import pyshark
import re
import os
from urllib.parse import urlparse, parse_qs

def parse_pcap(pcap_path):
    records = []
    try:
        cap = pyshark.FileCapture(pcap_path, display_filter='http.request')
        for pkt in cap:
            try:
                http = pkt.http
                method = getattr(http, 'request_method', '')
                host = getattr(http, 'host', '')
                uri = getattr(http, 'request_uri', '')
                full = ''
                if host and uri:
                    full = f'http://{host}{uri}'
                elif hasattr(http, 'request_full_uri'):
                    full = getattr(http, 'request_full_uri')
                user_agent = getattr(http, 'user_agent', '')
                params = {}
                if '?' in uri:
                    path, q = uri.split('?',1)
                    params = parse_qs(q, keep_blank_values=True)
                body = getattr(http, 'file_data', '') or ''
                rec = {'src_ip': pkt.ip.src if hasattr(pkt, 'ip') else '',
                       'dst_ip': pkt.ip.dst if hasattr(pkt, 'ip') else '',
                       'method': method,
                       'url': full,
                       'params': params,
                       'user_agent': user_agent,
                       'body': body,
                       'raw': full + ' ' + str(params) + ' ' + (body or '')}
                records.append(rec)
            except Exception:
                continue
        cap.close()
    except Exception as e:
        import sys
        sys.stderr.write(f'pyshark parse error: {e}\n')
    return records

def parse_access_log(log_path):
    """Parse Apache/Nginx access log file"""
    if not os.path.exists(log_path):
        raise FileNotFoundError(f"Log file not found: {log_path}")
    
    pattern = re.compile(r'(?P<ip>\S+) \S+ \S+ \[(?P<time>[^\]]+)\] "(?P<method>\S+) (?P<path>\S+) HTTP/[^"]+" (?P<status>\d+) (?P<size>\S+) "(?P<ref>[^"]*)" "(?P<ua>[^"]*)"')
    records = []
    line_count = 0
    matched_count = 0
    
    try:
        with open(log_path, 'r', errors='ignore', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                
                line_count += 1
                m = pattern.match(line)
                if not m:
                    # Try to log first few unmatched lines for debugging (to stderr for WSGI safety)
                    if line_count <= 5:
                        import sys
                        sys.stderr.write(f"Warning: Line {line_num} doesn't match pattern: {line[:100]}\n")
                    continue
                
                matched_count += 1
                try:
                    ip = m.group('ip')
                    method = m.group('method')
                    path = m.group('path')
                    ua = m.group('ua')
                    params = {}
                    if '?' in path:
                        p, q = path.split('?',1)
                        params = parse_qs(q, keep_blank_values=True)
                    rec = {'src_ip': ip, 'dst_ip': '', 'method': method, 'url': path, 'params': params, 'user_agent': ua, 'body':'', 'raw': path}
                    records.append(rec)
                except Exception as e:
                    import sys
                    sys.stderr.write(f"Error processing line {line_num}: {e}\n")
                    continue
        
        import sys
        sys.stderr.write(f"Parsed {matched_count} records from {line_count} lines in {log_path}\n")
        return records
    except Exception as e:
        import sys
        sys.stderr.write(f"Error reading log file {log_path}: {e}\n")
        raise
