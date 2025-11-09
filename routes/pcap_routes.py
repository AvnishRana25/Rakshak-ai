"""
PCAP Capture Routes
Flask Blueprint for PCAP capture endpoints
"""
from flask import Blueprint, request, jsonify, send_file
from bson import ObjectId
import os
import sys
import re

from services.pcap_service import PcapCaptureService
from utils.pcap_utils import get_available_interfaces
from config.pcap_config import PCAP_STORAGE_PATH

# Create blueprint
pcap_bp = Blueprint('pcap', __name__, url_prefix='/api/pcap')


def get_pcap_service():
    """Get PCAP service instance (injected from app)"""
    from flask import current_app
    return current_app.pcap_service


@pcap_bp.route('/start', methods=['POST'])
def start_capture():
    """Start a new PCAP capture"""
    try:
        data = request.get_json() or {}
        
        interface = data.get('interface', 'any')
        filter_rules = data.get('filter', '')
        max_packets = data.get('max_packets')
        duration = data.get('duration')
        filename = data.get('filename')
        created_by = data.get('created_by', 'system')
        
        # Validate max_packets
        if max_packets is not None:
            try:
                max_packets = int(max_packets)
                if max_packets <= 0:
                    return jsonify({'error': 'max_packets must be positive'}), 400
                if max_packets > 1000000:  # Reasonable upper limit
                    return jsonify({'error': 'max_packets cannot exceed 1,000,000'}), 400
            except (ValueError, TypeError):
                return jsonify({'error': 'Invalid max_packets value'}), 400
        
        # Validate duration
        if duration is not None:
            try:
                duration = int(duration)
                if duration <= 0:
                    return jsonify({'error': 'duration must be positive'}), 400
                if duration > 3600:  # 1 hour max
                    return jsonify({'error': 'duration cannot exceed 3600 seconds (1 hour)'}), 400
            except (ValueError, TypeError):
                return jsonify({'error': 'Invalid duration value'}), 400
        
        # Validate filename if provided
        if filename:
            from werkzeug.utils import secure_filename
            # Check if filename contains only safe characters
            if not re.match(r'^[a-zA-Z0-9_-]+$', filename):
                return jsonify({'error': 'Filename can only contain letters, numbers, underscores, and hyphens'}), 400
            if len(filename) > 100:
                return jsonify({'error': 'Filename too long (max 100 characters)'}), 400
        
        # Get service and start capture
        service = get_pcap_service()
        result = service.start_capture(
            interface=interface,
            filter_rules=filter_rules,
            max_packets=max_packets,
            duration=duration,
            filename=filename,
            created_by=created_by
        )
        
        return jsonify(result), 201
    
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except RuntimeError as e:
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        sys.stderr.write(f"Error starting capture: {e}\n")
        return jsonify({'error': 'Internal server error'}), 500


@pcap_bp.route('/stop/<capture_id>', methods=['POST'])
def stop_capture(capture_id):
    """Stop a running capture"""
    try:
        service = get_pcap_service()
        result = service.stop_capture(capture_id)
        return jsonify(result), 200
    
    except ValueError as e:
        return jsonify({'error': str(e)}), 404
    except RuntimeError as e:
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        sys.stderr.write(f"Error stopping capture: {e}\n")
        return jsonify({'error': 'Internal server error'}), 500


@pcap_bp.route('/status', methods=['GET'])
@pcap_bp.route('/status/<capture_id>', methods=['GET'])
def get_capture_status(capture_id=None):
    """Get capture status"""
    try:
        service = get_pcap_service()
        result = service.get_capture_status(capture_id)
        return jsonify(result), 200
    
    except ValueError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        sys.stderr.write(f"Error getting capture status: {e}\n")
        return jsonify({'error': 'Internal server error'}), 500


@pcap_bp.route('/download/<capture_id>', methods=['GET'])
def download_capture(capture_id):
    """Download PCAP file"""
    try:
        service = get_pcap_service()
        capture = service.get_capture_status(capture_id)
        
        file_path = capture.get('file_path')
        if not file_path:
            return jsonify({'error': 'PCAP file path not found'}), 404
        
        # Sanitize and validate path to prevent directory traversal
        from utils.pcap_utils import sanitize_file_path
        try:
            # Ensure the file path is within the storage directory
            sanitized_path = sanitize_file_path(file_path, PCAP_STORAGE_PATH)
        except ValueError as e:
            return jsonify({'error': 'Invalid file path'}), 400
        
        # Check if file exists
        if not os.path.exists(sanitized_path):
            return jsonify({'error': 'PCAP file not found on disk'}), 404
        
        # Get filename for download (use original filename or generate from capture_id)
        filename = os.path.basename(sanitized_path)
        if not filename or filename == '.' or filename == '..':
            # Fallback to capture_id-based filename
            filename = f"capture_{capture_id[:8]}.pcap"
        
        return send_file(
            sanitized_path,
            mimetype='application/vnd.tcpdump.pcap',
            as_attachment=True,
            download_name=filename
        )
    
    except ValueError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        sys.stderr.write(f"Error downloading capture: {e}\n")
        return jsonify({'error': 'Internal server error'}), 500


@pcap_bp.route('/delete/<capture_id>', methods=['DELETE'])
def delete_capture(capture_id):
    """Delete a capture and its file"""
    try:
        service = get_pcap_service()
        
        # Get capture info
        capture = service.get_capture_status(capture_id)
        
        # Stop if running
        if capture.get('status') == 'running':
            try:
                service.stop_capture(capture_id)
            except Exception:
                pass  # Continue with deletion even if stop fails
        
        # Delete file
        file_path = capture.get('file_path')
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                sys.stderr.write(f"Error deleting file {file_path}: {e}\n")
        
        # Delete database record
        service.db.pcap_captures.delete_one({"capture_id": capture_id})
        
        return jsonify({
            'success': True,
            'message': 'Capture deleted successfully'
        }), 200
    
    except ValueError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        sys.stderr.write(f"Error deleting capture: {e}\n")
        return jsonify({'error': 'Internal server error'}), 500


@pcap_bp.route('/interfaces', methods=['GET'])
def get_interfaces():
    """Get available network interfaces"""
    try:
        interfaces = get_available_interfaces()
        return jsonify({'interfaces': interfaces}), 200
    except Exception as e:
        sys.stderr.write(f"Error getting interfaces: {e}\n")
        return jsonify({'error': 'Internal server error'}), 500

