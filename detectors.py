import re
from urllib.parse import unquote, urlparse, parse_qs

# Normalize helpers
def norm(s):
    if not s:
        return ''
    try:
        s2 = unquote(s)
    except Exception:
        s2 = s
    return s2

# Detection functions: return (bool, confidence, note)
def detect_sqli(params, raw):
    payload = norm(raw)
    tokens = ["'", '"', '--', ';', '/*', '*/', 'UNION', 'SELECT', 'DROP', 'OR 1=1']
    score = 0
    for t in tokens:
        if t.lower() in payload.lower():
            score += 10
    if '%27' in raw.lower() or '%22' in raw.lower():
        score += 10
    return (score>=20, min(90, score), 'SQLi-like' if score>=20 else '')

def detect_xss(params, raw):
    s = norm(raw)
    score = 0
    if re.search(r"<[^>]+>", s):
        score += 40
    if re.search(r'on\w+\s*=\s*"', s, re.I):
        score += 20
    if '<script' in s.lower() or 'javascript:' in s.lower():
        score += 30
    return (score>=30, min(95, score), 'XSS' if score>=30 else '')

def detect_dir_traversal(params, raw):
    s = raw.lower()
    score = 0
    if '../' in s or '%2e%2e' in s:
        score += 50
    if '/etc/passwd' in s or 'boot.ini' in s:
        score += 40
    return (score>=40, min(95, score), 'Directory Traversal' if score>=40 else '')

def detect_cmd_injection(params, raw):
    s = raw
    score = 0
    if re.search(r'[;|&`$<>]', s):
        score += 30
    if re.search(r'\b(exec|system|popen|shell|bash|cmd)\b', s, re.I):
        score += 30
    return (score>=40, min(95, score), 'Command Injection' if score>=40 else '')

def detect_ssrf(params, raw):
    s = norm(raw)
    score = 0
    urls = re.findall(r'(https?://[\w\-.:@/%&?=~+#]+)', s)
    for u in urls:
        p = urlparse(u)
        host = p.hostname
        if not host:
            continue
        if host.startswith('127.') or host.startswith('10.') or host.startswith('192.168') or host.startswith('169.254'):
            score += 50
    if 'file://' in s or 'gopher://' in s:
        score += 40
    return (score>=40, min(95, score), 'SSRF' if score>=40 else '')

def detect_rfi_lfi(params, raw):
    s = raw.lower()
    score = 0
    if re.search(r'http[s]?://', s):
        score += 40
    if '../' in s or '%2e%2e' in s:
        score += 30
    return (score>=40, min(95, score), 'RFI/LFI' if score>=40 else '')

def detect_hpp(params, raw):
    for k,v in params.items():
        if isinstance(v, list) and len(v)>1:
            return True, 60, 'HTTP Parameter Pollution'
    return False, 0, ''

def detect_xxe(body):
    if not body:
        return False, 0, ''
    if '<!ENTITY' in body.upper() or '<!DOCTYPE' in body.upper():
        return True, 80, 'XXE'
    return False, 0, ''

def detect_webshell(filename, body):
    suspicious_names = ['cmd.jsp', 'shell.asp', 'backdoor.php', 'webshell.php']
    for n in suspicious_names:
        if n in (filename or '').lower():
            return True, 90, 'Webshell filename'
    if body and re.search(r'\b(eval|exec|system|passthru|shell_exec|popen)\b', body, re.I):
        return True, 85, 'Webshell-like code'
    return False, 0, ''

def detect_credential_stuffing(recent_login_attempts):
    from collections import Counter
    ips = [ip for ip, succ in recent_login_attempts if not succ]
    c = Counter(ips)
    for ip, cnt in c.items():
        if cnt >= 10:
            return True, 80, 'Credential stuffing / brute force'
    return False, 0, ''

def run_all(record, recent_login_attempts=None):
    alerts = []
    raw = record.get('raw','')
    params = record.get('params', {})
    body = record.get('body','')
    filename = record.get('filename','')

    funcs = [detect_sqli, detect_xss, detect_dir_traversal, detect_cmd_injection,
            detect_ssrf, detect_rfi_lfi]
    for f in funcs:
        try:
            hit, conf, note = f(params, raw)
            if hit:
                alerts.append((note, conf))
        except Exception:
            pass

    hit, conf, note = detect_hpp(params, raw)
    if hit:
        alerts.append((note, conf))

    hit, conf, note = detect_xxe(body)
    if hit:
        alerts.append((note, conf))

    hit, conf, note = detect_webshell(filename, body)
    if hit:
        alerts.append((note, conf))

    if recent_login_attempts:
        hit, conf, note = detect_credential_stuffing(recent_login_attempts)
        if hit:
            alerts.append((note, conf))

    return alerts
