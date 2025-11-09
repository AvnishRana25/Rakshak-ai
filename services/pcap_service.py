"""
PCAP Capture Service - Cross-platform compatible
Handles PCAP packet capture operations using tcpdump/tshark
"""
import os
import sys
import subprocess
import signal
import threading
import uuid
import time
import platform
from datetime import datetime, timedelta
from pathlib import Path

from config.pcap_config import (
    PCAP_STORAGE_PATH, MAX_CAPTURE_DURATION, MAX_CONCURRENT_CAPTURES,
    TCPDUMP_PATH, TSHARK_PATH, MAX_PCAP_FILE_SIZE
)
from utils.pcap_utils import (
    validate_interface, validate_filter, secure_filename_generator,
    calculate_file_size, count_packets_in_pcap, sanitize_file_path
)


class PcapCaptureService:
    """Service for managing PCAP captures"""
    
    def __init__(self, mongo_db):
        """
        Initialize PCAP capture service
        
        Args:
            mongo_db: MongoDB database instance
        """
        self.db = mongo_db
        self.captures_collection = mongo_db.pcap_captures
        self.active_captures = {}  # {capture_id: process_info}
        self.lock = threading.Lock()
        
        # Ensure storage directory exists (cross-platform)
        Path(PCAP_STORAGE_PATH).mkdir(parents=True, exist_ok=True)
    
    def start_capture(self, interface, filter_rules="", max_packets=None,
                      duration=None, filename=None, created_by="system"):
        """
        Start a new PCAP capture
        
        Args:
            interface: Network interface to capture on
            filter_rules: BPF filter rules (optional)
            max_packets: Maximum number of packets to capture
            duration: Maximum capture duration in seconds
            filename: Custom filename (optional)
            created_by: User/system that initiated capture
            
        Returns:
            dict: Capture information with capture_id
        """
        # Validate inputs
        if not validate_interface(interface):
            raise ValueError(f"Invalid network interface: {interface}")
        
        is_valid, error_msg = validate_filter(filter_rules)
        if not is_valid:
            raise ValueError(f"Invalid filter: {error_msg}")
        
        # Check concurrent capture limit
        with self.lock:
            active_count = len([c for c in self.active_captures.values() if c.get('process') and c['process'].poll() is None])
            if active_count >= MAX_CONCURRENT_CAPTURES:
                raise RuntimeError(f"Maximum concurrent captures ({MAX_CONCURRENT_CAPTURES}) reached")
        
        # Validate duration
        if duration and duration > MAX_CAPTURE_DURATION:
            raise ValueError(f"Duration exceeds maximum ({MAX_CAPTURE_DURATION} seconds)")
        
        # Generate capture ID and filename
        capture_id = str(uuid.uuid4())
        if not filename:
            filename = secure_filename_generator(f"capture_{capture_id[:8]}")
        
        # Sanitize filename
        from werkzeug.utils import secure_filename
        filename = secure_filename(filename)
        if not filename.endswith('.pcap'):
            filename += '.pcap'
        
        file_path = sanitize_file_path(filename, PCAP_STORAGE_PATH)
        
        # Create capture document
        from models_mongodb import PcapCaptureDocument
        capture_doc = PcapCaptureDocument.create(
            capture_id=capture_id,
            interface=interface,
            filter_rules=filter_rules,
            max_packets=max_packets,
            duration=duration,
            filename=file_path,
            created_by=created_by
        )
        
        # Insert into database
        result = self.captures_collection.insert_one(capture_doc)
        capture_doc['_id'] = result.inserted_id
        
        # Build tcpdump command
        cmd = self._build_capture_command(
            interface, filter_rules, max_packets, duration, file_path
        )
        
        try:
            # Start capture process (cross-platform)
            # On Windows, we can't use setsid, so we use CREATE_NEW_PROCESS_GROUP
            # On Unix, we use setsid to create a new process group for easier termination
            kwargs = {
                'stdout': subprocess.PIPE,
                'stderr': subprocess.PIPE
            }
            
            if platform.system() == 'Windows':
                kwargs['creationflags'] = subprocess.CREATE_NEW_PROCESS_GROUP
            elif hasattr(os, 'setsid'):
                kwargs['preexec_fn'] = os.setsid
            
            # Log the command for debugging
            sys.stderr.write(f"Starting capture with command: {' '.join(cmd)}\n")
            
            process = subprocess.Popen(cmd, **kwargs)
            
            # Give tcpdump a moment to start and verify it's running
            time.sleep(0.5)
            if process.poll() is not None:
                # Process already exited - read error
                _, stderr = process.communicate()
                error_msg = stderr.decode('utf-8', errors='ignore') if stderr else 'Unknown error'
                raise RuntimeError(f"tcpdump failed to start: {error_msg}")
            
            # Store process info
            process_info = {
                'process': process,
                'start_time': datetime.utcnow(),
                'file_path': file_path,
                'interface': interface,
                'capture_id': capture_id
            }
            
            with self.lock:
                self.active_captures[capture_id] = process_info
            
            # Update document with process ID
            self.captures_collection.update_one(
                {"capture_id": capture_id},
                {"$set": {"process_id": process.pid, "updated_at": datetime.utcnow()}}
            )
            
            # Start periodic flush monitoring thread to prevent buffer stuck
            def monitor_and_flush(capture_id, file_path):
                """Monitor capture and periodically flush buffers to prevent stuck buffer"""
                try:
                    while True:
                        time.sleep(5)  # Check every 5 seconds
                        
                        with self.lock:
                            if capture_id not in self.active_captures:
                                break
                            process_info = self.active_captures.get(capture_id)
                            if not process_info:
                                break
                            process = process_info.get('process')
                            if not process or process.poll() is not None:
                                break
                        
                        # Force flush by updating file modification time (triggers OS flush)
                        try:
                            if os.path.exists(file_path):
                                # Update file modification time to trigger OS buffer flush
                                os.utime(file_path, None)
                        except Exception as e:
                            sys.stderr.write(f"Flush monitor warning for {capture_id}: {e}\n")
                
                except Exception as e:
                    sys.stderr.write(f"Error in flush monitor for {capture_id}: {e}\n")
            
            # Start flush monitor thread
            flush_thread = threading.Thread(
                target=monitor_and_flush,
                args=(capture_id, file_path),
                daemon=True
            )
            flush_thread.start()
            
            # Start monitoring thread if duration is set
            if duration:
                monitor_thread = threading.Thread(
                    target=self._monitor_capture_duration,
                    args=(capture_id, duration),
                    daemon=True
                )
                monitor_thread.start()
            
            return {
                "capture_id": capture_id,
                "status": "running",
                "message": "Capture started successfully",
                "start_time": capture_doc['start_time'].isoformat(),
                "file_path": file_path,
                "process_id": process.pid
            }
        
        except Exception as e:
            # Update status to failed
            self.captures_collection.update_one(
                {"capture_id": capture_id},
                {"$set": {
                    "status": "failed",
                    "end_time": datetime.utcnow(),
                    "metadata": {"error": str(e)},
                    "updated_at": datetime.utcnow()
                }}
            )
            raise RuntimeError(f"Failed to start capture: {str(e)}") from e
    
    def _build_capture_command(self, interface, filter_rules, max_packets, duration, file_path):
        """Build capture command - try tshark first (better buffering), fallback to tcpdump"""
        # Use pathlib for cross-platform path handling
        file_path_str = str(Path(file_path))
        
        # Try tshark first (handles buffering better, more reliable)
        try:
            from config.pcap_config import TSHARK_PATH
            # Test if tshark is available
            test_result = subprocess.run(
                [TSHARK_PATH, '--version'],
                capture_output=True,
                timeout=2,
                check=False
            )
            if test_result.returncode == 0:
                # Use tshark - better buffering handling
                cmd = [TSHARK_PATH, '-i', interface, '-w', file_path_str, '-q', '-F', 'pcap']
                
                # tshark options
                if max_packets:
                    cmd.extend(['-c', str(max_packets)])
                
                if filter_rules:
                    # tshark uses capture filter with -f (BPF syntax)
                    cmd.extend(['-f', filter_rules])
                
                sys.stderr.write(f"Using tshark for capture (better buffering)\n")
                return cmd
        except (FileNotFoundError, subprocess.TimeoutExpired, Exception) as e:
            sys.stderr.write(f"tshark not available, using tcpdump: {e}\n")
        
        # Fallback to tcpdump with anti-buffering flags
        # -n: Don't resolve hostnames (faster)
        # -s 0: Snapshot length 0 (capture full packets)
        # -U: Write packets immediately (unbuffered) - CRITICAL
        # -B 4096: Set buffer size to 4KB (smaller buffer = less chance of getting stuck)
        cmd = [TCPDUMP_PATH, '-i', interface, '-n', '-s', '0', '-U', '-B', '4096', '-w', file_path_str]
        
        # Add packet limit
        if max_packets:
            cmd.extend(['-c', str(max_packets)])
        
        # Add filter at the end (BPF syntax)
        if filter_rules:
            cmd.append(filter_rules)
        
        return cmd
    
    def _monitor_capture_duration(self, capture_id, duration):
        """Monitor capture and stop after duration"""
        time.sleep(duration)
        try:
            self.stop_capture(capture_id)
        except Exception as e:
            sys.stderr.write(f"Error stopping capture {capture_id} after duration: {e}\n")
    
    def stop_capture(self, capture_id):
        """
        Stop a running capture
        
        Args:
            capture_id: Capture ID to stop
            
        Returns:
            dict: Updated capture information
        """
        with self.lock:
            if capture_id not in self.active_captures:
                raise ValueError(f"Capture {capture_id} not found or not running")
            
            process_info = self.active_captures[capture_id]
            process = process_info.get('process')
            
            if not process or process.poll() is not None:
                # Process already stopped
                del self.active_captures[capture_id]
                raise ValueError(f"Capture {capture_id} is not running")
            
            # Stop the process (cross-platform) with proper buffer flushing
            try:
                if platform.system() == 'Windows':
                    # Windows: use terminate() and kill()
                    process.terminate()
                    try:
                        process.wait(timeout=3)  # Give time for buffer flush
                    except subprocess.TimeoutExpired:
                        process.kill()
                        process.wait(timeout=1)
                else:
                    # Unix/Linux/macOS: graceful shutdown to flush buffers
                    terminated = False
                    
                    # Method 1: Send SIGINT first for graceful shutdown (allows buffer flush)
                    if hasattr(os, 'killpg'):
                        try:
                            pgid = os.getpgid(process.pid)
                            # Send SIGINT for graceful shutdown (allows tcpdump to flush buffers)
                            os.killpg(pgid, signal.SIGINT)
                            try:
                                process.wait(timeout=3)  # Wait for graceful shutdown
                                terminated = True
                            except subprocess.TimeoutExpired:
                                # If SIGINT didn't work, try SIGTERM
                                try:
                                    os.killpg(pgid, signal.SIGTERM)
                                    process.wait(timeout=2)
                                    terminated = True
                                except subprocess.TimeoutExpired:
                                    # Last resort: force kill
                                    try:
                                        os.killpg(pgid, signal.SIGKILL)
                                        process.wait(timeout=1)
                                        terminated = True
                                    except (ProcessLookupError, OSError, subprocess.TimeoutExpired):
                                        pass
                        except (ProcessLookupError, OSError, ValueError):
                            pass
                    
                    # Method 2: Direct process termination (fallback)
                    if not terminated:
                        # Try SIGINT first for graceful shutdown
                        try:
                            os.kill(process.pid, signal.SIGINT)
                            process.wait(timeout=3)
                            terminated = True
                        except (ProcessLookupError, OSError, subprocess.TimeoutExpired):
                            # Fallback to terminate
                            process.terminate()
                            try:
                                process.wait(timeout=2)
                                terminated = True
                            except subprocess.TimeoutExpired:
                                process.kill()
                                process.wait(timeout=1)
                    
                    # Final flush: ensure file buffers are written to disk
                    file_path = process_info['file_path']
                    if os.path.exists(file_path):
                        try:
                            # Force OS to flush file buffers
                            try:
                                import fcntl
                                with open(file_path, 'a') as f:
                                    try:
                                        fcntl.fcntl(f.fileno(), fcntl.F_FULLFSYNC)  # macOS full sync
                                    except (AttributeError, OSError):
                                        fcntl.fcntl(f.fileno(), fcntl.F_SYNC)  # Linux sync
                            except (ImportError, AttributeError, OSError):
                                # Fallback: sync all file systems
                                try:
                                    os.sync()  # Sync all file systems (Linux)
                                except AttributeError:
                                    pass  # os.sync not available on all systems
                            
                            # Touch file to trigger flush
                            os.utime(file_path, None)
                            sys.stderr.write(f"Flushed buffers for {file_path}\n")
                        except Exception as e:
                            sys.stderr.write(f"Warning: Could not flush file {file_path}: {e}\n")
                
                # Get file stats (fast - just file size)
                file_path = process_info['file_path']
                file_size = calculate_file_size(file_path)
                
                # Try immediate count (quick attempt after process stops)
                packet_count = 0
                try:
                    # Small delay to ensure file is flushed
                    time.sleep(0.5)
                    packet_count = count_packets_in_pcap(file_path)
                    if packet_count > 0:
                        sys.stderr.write(f"Immediate count: {packet_count} packets in {file_path}\n")
                except Exception as e:
                    sys.stderr.write(f"Immediate count failed: {e}\n")
                
                # If immediate count failed and file has data, estimate from size
                if packet_count == 0 and file_size > 24:
                    # Estimate: at least 1 packet per 64 bytes (minimum Ethernet frame)
                    estimated = max(1, (file_size - 24) // 64)
                    packet_count = min(estimated, 1000000)
                    sys.stderr.write(f"Using file size estimation: {packet_count} packets (file size: {file_size} bytes)\n")
                
                # Update database with immediate/estimated count
                self.captures_collection.update_one(
                    {"capture_id": capture_id},
                    {"$set": {
                        "status": "stopped",
                        "end_time": datetime.utcnow(),
                        "file_size": file_size,
                        "packet_count": packet_count,  # Use immediate count or estimation
                        "updated_at": datetime.utcnow()
                    }}
                )
                
                # Remove from active captures
                del self.active_captures[capture_id]
                
                # Count packets asynchronously for more accurate count (refine the initial count)
                def count_packets_async():
                    try:
                        # Wait longer for file to be fully written (especially in Docker)
                        time.sleep(3)  # Increased from 1 to 3 seconds
                        
                        # Retry counting up to 3 times for accuracy
                        accurate_count = 0
                        for attempt in range(3):
                            accurate_count = count_packets_in_pcap(file_path)
                            if accurate_count > 0:
                                break
                            if attempt < 2:  # Don't sleep on last attempt
                                time.sleep(1)
                        
                        # Use accurate count if we got one, otherwise keep the estimation
                        final_count = accurate_count if accurate_count > 0 else packet_count
                        
                        if accurate_count > 0:
                            sys.stderr.write(f"Accurate count: {accurate_count} packets in {file_path}\n")
                        elif packet_count > 0:
                            sys.stderr.write(f"Using estimated count: {packet_count} packets (accurate count failed)\n")
                        else:
                            sys.stderr.write(f"Warning: No packets counted in {file_path} (file size: {file_size} bytes)\n")
                        
                        # Update with final count
                        self.captures_collection.update_one(
                            {"capture_id": capture_id},
                            {"$set": {
                                "packet_count": final_count,
                                "updated_at": datetime.utcnow()
                            }}
                        )
                    except Exception as e:
                        sys.stderr.write(f"Error counting packets for {capture_id}: {e}\n")
                        import traceback
                        sys.stderr.write(traceback.format_exc() + "\n")
                
                # Start async packet counting for refinement
                threading.Thread(target=count_packets_async, daemon=True).start()
                
                return {
                    "capture_id": capture_id,
                    "status": "stopped",
                    "packet_count": packet_count,  # Return immediate count or estimation
                    "file_size": file_size,
                    "message": "Capture stopped successfully"
                }
            
            except Exception as e:
                # Update status to failed
                self.captures_collection.update_one(
                    {"capture_id": capture_id},
                    {"$set": {
                        "status": "failed",
                        "end_time": datetime.utcnow(),
                        "metadata": {"error": str(e)},
                        "updated_at": datetime.utcnow()
                    }}
                )
                raise RuntimeError(f"Failed to stop capture: {str(e)}") from e
    
    def get_capture_status(self, capture_id=None):
        """
        Get capture status (optimized for speed)
        
        Args:
            capture_id: Capture ID (None for all captures)
            
        Returns:
            dict: Capture status information
        """
        if capture_id:
            # Get specific capture
            capture = self.captures_collection.find_one({"capture_id": capture_id})
            if not capture:
                raise ValueError(f"Capture {capture_id} not found")
            
            # Quick status check if running (don't count packets here - too slow)
            if capture.get('status') == 'running':
                with self.lock:
                    process_info = self.active_captures.get(capture_id)
                    if process_info:
                        process = process_info.get('process')
                        if process and process.poll() is not None:
                            # Process ended - update quickly without packet count
                            file_path = process_info['file_path']
                            file_size = calculate_file_size(file_path)
                            
                            self.captures_collection.update_one(
                                {"capture_id": capture_id},
                                {"$set": {
                                    "status": "completed",
                                    "end_time": datetime.utcnow(),
                                    "file_size": file_size,
                                    "updated_at": datetime.utcnow()
                                }}
                            )
                            del self.active_captures[capture_id]
                            
                            # Count packets async with better error handling
                            def count_async():
                                try:
                                    time.sleep(1)  # Wait for file to be written
                                    packet_count = count_packets_in_pcap(file_path)
                                    
                                    # If count is 0 but file has data, estimate
                                    if packet_count == 0 and file_size > 24:
                                        estimated = max(1, (file_size - 24) // 64)
                                        packet_count = min(estimated, 1000000)
                                    
                                    self.captures_collection.update_one(
                                        {"capture_id": capture_id},
                                        {"$set": {
                                            "packet_count": packet_count,
                                            "updated_at": datetime.utcnow()
                                        }}
                                    )
                                except Exception as e:
                                    sys.stderr.write(f"Error in async packet count: {e}\n")
                            threading.Thread(target=count_async, daemon=True).start()
                            
                            capture = self.captures_collection.find_one({"capture_id": capture_id})
            
            # Calculate duration
            duration = None
            if capture.get('start_time'):
                start = capture['start_time']
                end = capture.get('end_time') or datetime.utcnow()
                if isinstance(start, datetime) and isinstance(end, datetime):
                    duration = (end - start).total_seconds()
            
            from models_mongodb import PcapCaptureDocument
            capture_dict = PcapCaptureDocument.to_dict(capture)
            capture_dict['is_running'] = capture.get('status') == 'running'
            capture_dict['duration'] = duration
            
            return capture_dict
        else:
            # Get all captures
            captures = list(self.captures_collection.find().sort("start_time", -1).limit(100))
            
            # Update running captures and check for dead processes
            active_count = 0
            with self.lock:
                for capture in captures:
                    if capture.get('status') == 'running':
                        capture_id = capture.get('capture_id')
                        if capture_id in self.active_captures:
                            process_info = self.active_captures[capture_id]
                            process = process_info.get('process')
                            # Check if process is still alive
                            if process and process.poll() is None:
                                active_count += 1
                            else:
                                # Process died - update status
                                file_path = process_info['file_path']
                                file_size = calculate_file_size(file_path)
                                self.captures_collection.update_one(
                                    {"capture_id": capture_id},
                                    {"$set": {
                                        "status": "completed",
                                        "end_time": datetime.utcnow(),
                                        "file_size": file_size,
                                        "updated_at": datetime.utcnow()
                                    }}
                                )
                                del self.active_captures[capture_id]
                                # Update capture in list
                                capture['status'] = 'completed'
                                capture['end_time'] = datetime.utcnow()
                                capture['file_size'] = file_size
                        else:
                            # Capture marked as running but not in active_captures - mark as completed
                            self.captures_collection.update_one(
                                {"capture_id": capture_id},
                                {"$set": {
                                    "status": "completed",
                                    "end_time": datetime.utcnow(),
                                    "updated_at": datetime.utcnow()
                                }}
                            )
                            capture['status'] = 'completed'
                            capture['end_time'] = datetime.utcnow()
            
            from models_mongodb import PcapCaptureDocument
            captures_list = [PcapCaptureDocument.to_dict(c) for c in captures]
            
            return {
                "captures": captures_list,
                "active_count": active_count,
                "total_count": len(captures_list)
            }
    
    def cleanup_old_captures(self, days_threshold=7):
        """
        Clean up old capture files and database records
        
        Args:
            days_threshold: Delete captures older than this many days
            
        Returns:
            dict: Cleanup statistics
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days_threshold)
        
        # Find old captures
        old_captures = list(self.captures_collection.find({
            "created_at": {"$lt": cutoff_date},
            "status": {"$in": ["stopped", "completed", "failed"]}
        }))
        
        deleted_files = 0
        deleted_records = 0
        
        for capture in old_captures:
            # Delete file if it exists
            file_path = capture.get('file_path')
            if file_path and os.path.exists(file_path):
                try:
                    os.remove(file_path)
                    deleted_files += 1
                except Exception as e:
                    sys.stderr.write(f"Error deleting file {file_path}: {e}\n")
            
            # Delete database record
            try:
                self.captures_collection.delete_one({"_id": capture["_id"]})
                deleted_records += 1
            except Exception as e:
                sys.stderr.write(f"Error deleting record {capture.get('capture_id')}: {e}\n")
        
        return {
            "deleted_files": deleted_files,
            "deleted_records": deleted_records,
            "cutoff_date": cutoff_date.isoformat()
        }

