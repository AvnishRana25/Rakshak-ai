"""
PCAP Capture Configuration - Cross-platform compatible
"""
import os
import platform
import shutil
from pathlib import Path

# Storage configuration - use pathlib for cross-platform paths
PCAP_STORAGE_PATH = os.getenv("PCAP_STORAGE_PATH", "./pcap_captures/")
Path(PCAP_STORAGE_PATH).mkdir(parents=True, exist_ok=True)

# Capture limits
MAX_CAPTURE_DURATION = int(os.getenv("MAX_CAPTURE_DURATION", "3600"))  # 1 hour in seconds
MAX_CONCURRENT_CAPTURES = int(os.getenv("MAX_CONCURRENT_CAPTURES", "5"))
MAX_PACKETS_DEFAULT = int(os.getenv("MAX_PACKETS_DEFAULT", "10000"))

# Network interface configuration - cross-platform defaults
if platform.system() == 'Windows':
    DEFAULT_INTERFACES = "any,lo,lo0"
elif platform.system() == 'Darwin':  # macOS
    DEFAULT_INTERFACES = "any,lo0,en0,en1"
else:  # Linux
    DEFAULT_INTERFACES = "eth0,wlan0,any,lo"

ALLOWED_INTERFACES = [iface.strip() for iface in os.getenv("ALLOWED_INTERFACES", DEFAULT_INTERFACES).split(",") if iface.strip()]

# Cleanup configuration
CLEANUP_INTERVAL_DAYS = int(os.getenv("CLEANUP_INTERVAL_DAYS", "7"))

# Tool paths - cross-platform detection
def _find_tool(tool_name, default_paths):
    """Find tool in system PATH or default paths"""
    # First check if tool is in PATH (most reliable)
    tool_path = shutil.which(tool_name)
    if tool_path:
        return tool_path
    
    # Check default paths
    for path in default_paths:
        if os.path.exists(path):
            return path
    
    # If not found, return the tool name and let subprocess handle it
    # This allows the system to find it in PATH at runtime
    return tool_name

if platform.system() == 'Windows':
    TCPDUMP_DEFAULT_PATHS = [
        r"C:\Program Files\Wireshark\tcpdump.exe",
        r"C:\Program Files (x86)\Wireshark\tcpdump.exe",
        "tcpdump.exe"
    ]
    TSHARK_DEFAULT_PATHS = [
        r"C:\Program Files\Wireshark\tshark.exe",
        r"C:\Program Files (x86)\Wireshark\tshark.exe",
        "tshark.exe"
    ]
elif platform.system() == 'Darwin':  # macOS
    TCPDUMP_DEFAULT_PATHS = ["/usr/sbin/tcpdump", "/usr/local/bin/tcpdump", "tcpdump"]
    TSHARK_DEFAULT_PATHS = ["/usr/local/bin/tshark", "/opt/homebrew/bin/tshark", "tshark"]
else:  # Linux (including Docker containers)
    # In Docker containers, tcpdump is usually in /usr/bin, not /usr/sbin
    TCPDUMP_DEFAULT_PATHS = ["/usr/bin/tcpdump", "/usr/sbin/tcpdump", "tcpdump"]
    TSHARK_DEFAULT_PATHS = ["/usr/bin/tshark", "/usr/local/bin/tshark", "tshark"]

# Allow environment variable override, but prefer auto-detection
# If env var is set, use it; otherwise auto-detect
env_tcpdump = os.getenv("TCPDUMP_PATH")
env_tshark = os.getenv("TSHARK_PATH")

if env_tcpdump:
    TCPDUMP_PATH = env_tcpdump
else:
    TCPDUMP_PATH = _find_tool("tcpdump", TCPDUMP_DEFAULT_PATHS)

if env_tshark:
    TSHARK_PATH = env_tshark
else:
    TSHARK_PATH = _find_tool("tshark", TSHARK_DEFAULT_PATHS)

# File size limits (bytes)
MAX_PCAP_FILE_SIZE = int(os.getenv("MAX_PCAP_FILE_SIZE", "1073741824"))  # 1GB default

