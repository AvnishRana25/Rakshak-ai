"""
PCAP Utility Functions - Cross-platform compatible
"""
import os
import sys
import subprocess
import re
import platform
from pathlib import Path
from werkzeug.utils import secure_filename
from datetime import datetime


def _is_windows():
    """Check if running on Windows"""
    return platform.system() == 'Windows'


def _is_macos():
    """Check if running on macOS"""
    return platform.system() == 'Darwin'


def _is_linux():
    """Check if running on Linux"""
    return platform.system() == 'Linux'


def validate_interface(interface_name):
    """
    Check if network interface exists (cross-platform)
    
    Args:
        interface_name: Name of the network interface
        
    Returns:
        bool: True if interface exists, False otherwise
    """
    if not interface_name or not isinstance(interface_name, str):
        return False
    
    # Sanitize interface name
    if not re.match(r'^[a-zA-Z0-9_-]+$', interface_name):
        return False
    
    # Check against allowed interfaces first
    from config.pcap_config import ALLOWED_INTERFACES
    # Normalize interface name for comparison (strip whitespace, case-insensitive for common interfaces)
    normalized_name = interface_name.strip().lower()
    if interface_name in ALLOWED_INTERFACES or normalized_name in [iface.lower() for iface in ALLOWED_INTERFACES]:
        return True
    
    # Always allow common loopback interfaces
    common_loopback = ['lo', 'lo0', 'any']
    if normalized_name in [iface.lower() for iface in common_loopback]:
        return True
    
    try:
        if _is_linux():
            # Linux: use ip command
            result = subprocess.run(
                ['ip', 'link', 'show', interface_name],
                capture_output=True,
                timeout=5,
                check=False
            )
            if result.returncode == 0:
                return True
        
        elif _is_macos():
            # macOS: use ifconfig or networksetup
            result = subprocess.run(
                ['ifconfig', interface_name],
                capture_output=True,
                timeout=5,
                check=False
            )
            if result.returncode == 0:
                return True
        
        elif _is_windows():
            # Windows: use netsh or Get-NetAdapter (PowerShell)
            try:
                result = subprocess.run(
                    ['netsh', 'interface', 'show', 'interface', f'name="{interface_name}"'],
                    capture_output=True,
                    timeout=5,
                    check=False
                )
                if result.returncode == 0 and interface_name.encode() in result.stdout:
                    return True
            except Exception:
                pass
        
        # Fallback: check against allowed list
        return interface_name in ALLOWED_INTERFACES
    
    except (subprocess.TimeoutExpired, FileNotFoundError, Exception):
        # If commands don't exist, check against allowed list
        return interface_name in ALLOWED_INTERFACES


def validate_filter(filter_string):
    """
    Basic validation of BPF filter syntax
    
    Args:
        filter_string: BPF filter string
        
    Returns:
        tuple: (is_valid: bool, error_message: str)
    """
    if not filter_string:
        return True, None
    
    if not isinstance(filter_string, str):
        return False, "Filter must be a string"
    
    # Basic sanity checks
    if len(filter_string) > 1000:
        return False, "Filter string too long (max 1000 characters)"
    
    # Check for command injection attempts (but allow valid BPF syntax)
    # BPF allows: &&, ||, !, parentheses, but we need to block shell injection
    dangerous_patterns = [
        ';',  # Command separator
        '`',  # Backtick command substitution
        '$(',  # Command substitution
        '|',  # Pipe (but allow || for OR in BPF, so check carefully)
        '>',  # Output redirection
        '<',  # Input redirection
        '&',  # Background process (but allow && for AND in BPF)
    ]
    
    # Check for dangerous patterns, but be careful with BPF operators
    # Allow && and || as they're valid BPF operators
    for pattern in dangerous_patterns:
        if pattern == '&' and '&&' in filter_string:
            # Allow && but check for single & (background process)
            # Replace && temporarily to check for single &
            temp = filter_string.replace('&&', '')
            if '&' in temp:
                return False, "Invalid character '&' in filter (use '&&' for AND operator)"
        elif pattern == '|' and '||' in filter_string:
            # Allow || but check for single | (pipe)
            temp = filter_string.replace('||', '')
            if '|' in temp:
                return False, "Invalid character '|' in filter (use '||' for OR operator)"
        elif pattern in filter_string:
            return False, f"Potentially dangerous pattern in filter: {pattern}"
    
    return True, None


def _is_valid_bpf_char(char, filter_string):
    """Check if character is part of valid BPF syntax"""
    # This is a simplified check - in production, use a proper BPF parser
    # For now, allow parentheses and basic operators
    if char in ['(', ')']:
        return True
    return False


def get_available_interfaces():
    """
    Get list of available network interfaces (cross-platform)
    
    Returns:
        list: List of interface names
    """
    interfaces = []
    
    try:
        if _is_linux():
            # Linux: use ip command
            result = subprocess.run(
                ['ip', 'link', 'show'],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                for line in result.stdout.split('\n'):
                    if ': ' in line:
                        parts = line.split(': ')
                        if len(parts) >= 2:
                            interface = parts[1].split('@')[0].strip()
                            if interface and interface not in interfaces:
                                interfaces.append(interface)
        
        elif _is_macos():
            # macOS: use ifconfig
            result = subprocess.run(
                ['ifconfig', '-l'],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                interfaces = [iface.strip() for iface in result.stdout.split() if iface.strip()]
        
        elif _is_windows():
            # Windows: use netsh or PowerShell
            try:
                result = subprocess.run(
                    ['netsh', 'interface', 'show', 'interface'],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                if result.returncode == 0:
                    for line in result.stdout.split('\n')[3:]:  # Skip header
                        parts = line.split()
                        if len(parts) >= 4:
                            interface = parts[-1].strip('"')
                            if interface and interface not in interfaces:
                                interfaces.append(interface)
            except Exception:
                pass
    
    except (subprocess.TimeoutExpired, FileNotFoundError, Exception):
        pass
    
    # Fallback to allowed interfaces if detection fails
    if not interfaces:
        from config.pcap_config import ALLOWED_INTERFACES
        interfaces = list(ALLOWED_INTERFACES)
    
    # Always include common fallback interfaces
    for iface in ['any', 'lo', 'lo0']:
        if iface not in interfaces:
            interfaces.insert(0, iface)
    
    return interfaces


def calculate_file_size(filepath):
    """
    Get PCAP file size in bytes
    
    Args:
        filepath: Path to PCAP file
        
    Returns:
        int: File size in bytes, 0 if file doesn't exist
    """
    try:
        if os.path.exists(filepath):
            return os.path.getsize(filepath)
        return 0
    except Exception:
        return 0


def count_packets_in_pcap(filepath):
    """
    Count packets in PCAP file using tshark or tcpdump
    
    Args:
        filepath: Path to PCAP file
        
    Returns:
        int: Number of packets, 0 if error
    """
    if not os.path.exists(filepath):
        return 0
    
    # Check file size first - if too small, likely no packets
    try:
        file_size = os.path.getsize(filepath)
        # PCAP file header is 24 bytes, so if file is <= 24 bytes, no packets
        if file_size <= 24:
            return 0
    except Exception:
        return 0
    
    try:
        from config.pcap_config import TSHARK_PATH, TCPDUMP_PATH
        
        # Try tshark first (more reliable) - use count option
        try:
            result = subprocess.run(
                [TSHARK_PATH, '-r', filepath, '-T', 'fields', '-e', 'frame.number'],
                capture_output=True,
                text=True,
                timeout=30,
                check=False,
                stderr=subprocess.DEVNULL  # Suppress stderr
            )
            if result.returncode == 0 and result.stdout:
                lines = [l.strip() for l in result.stdout.strip().split('\n') if l.strip()]
                if lines:
                    return len(lines)
        except (FileNotFoundError, subprocess.TimeoutExpired, Exception):
            pass
        
        # Alternative: Use tshark with -c option to count
        try:
            result = subprocess.run(
                [TSHARK_PATH, '-r', filepath, '-c', '999999999'],  # Large number to count all
                capture_output=True,
                text=True,
                timeout=30,
                check=False,
                stderr=subprocess.DEVNULL
            )
            # tshark -c outputs packets and exits, so we can count stderr/stdout
            if result.returncode == 0:
                # Count lines in output
                output = result.stdout + result.stderr if result.stderr else result.stdout
                if output:
                    lines = [l for l in output.strip().split('\n') if l.strip() and not l.startswith('Capturing')]
                    return len(lines)
        except (FileNotFoundError, subprocess.TimeoutExpired, Exception):
            pass
        
        # Fallback to tcpdump - count lines
        try:
            result = subprocess.run(
                [TCPDUMP_PATH, '-r', filepath, '-n', '-c', '999999'],
                capture_output=True,
                text=True,
                timeout=30,
                check=False,
                stderr=subprocess.DEVNULL
            )
            if result.returncode == 0 and result.stdout:
                lines = [l.strip() for l in result.stdout.strip().split('\n') if l.strip() and not l.startswith('tcpdump')]
                if lines:
                    return len(lines)
        except (FileNotFoundError, subprocess.TimeoutExpired, Exception):
            pass
        
        # Last resort: Estimate from file size (this should always work if file has data)
        # This is a reliable fallback when tools fail
        try:
            remaining_size = file_size - 24
            if remaining_size > 0:
                # Estimate: at least 1 packet per 64 bytes (minimum Ethernet frame)
                # More accurate: average packet is ~1500 bytes (MTU), but can be smaller
                # Use 128 bytes as average for better estimation
                estimated = max(1, remaining_size // 128)
                # But don't overestimate - cap at reasonable number
                estimated_count = min(estimated, 1000000)
                import sys
                sys.stderr.write(f"Using file size estimation: {estimated_count} packets (file size: {file_size} bytes, remaining: {remaining_size} bytes)\n")
                return estimated_count
        except Exception as e:
            import sys
            sys.stderr.write(f"Error in file size estimation: {e}\n")
        
        return 0
    except Exception as e:
        import sys
        sys.stderr.write(f"Error counting packets in {filepath}: {e}\n")
        return 0


def secure_filename_generator(prefix="capture"):
    """
    Generate a secure filename for PCAP file
    
    Args:
        prefix: Filename prefix
        
    Returns:
        str: Secure filename with timestamp
    """
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    safe_prefix = secure_filename(prefix)
    filename = f"{safe_prefix}_{timestamp}.pcap"
    return filename


def sanitize_file_path(filepath, base_path):
    """
    Sanitize file path to prevent directory traversal (cross-platform)
    
    Args:
        filepath: File path to sanitize
        base_path: Base directory path
        
    Returns:
        str: Sanitized absolute path
    """
    # Use pathlib for cross-platform path handling
    base_path_obj = Path(base_path).resolve()
    filepath_obj = Path(filepath)
    
    # Resolve to absolute path
    if filepath_obj.is_absolute():
        full_path = filepath_obj.resolve()
    else:
        full_path = (base_path_obj / filepath_obj).resolve()
    
    # Ensure path is within base directory (cross-platform check)
    try:
        full_path.relative_to(base_path_obj)
    except ValueError:
        raise ValueError("Invalid file path: directory traversal detected")
    
    return str(full_path)

