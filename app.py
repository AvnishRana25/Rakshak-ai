import os
import re
from datetime import datetime, timedelta
from collections import Counter
import io

# Import eventlet early if using eventlet async mode
if os.environ.get('SOCKETIO_ASYNC_MODE', 'threading') == 'eventlet':
    import eventlet
    eventlet.monkey_patch()

from flask import Flask, request, send_file, jsonify, send_from_directory, Response
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from flask_pymongo import PyMongo
from werkzeug.utils import secure_filename
from bson import ObjectId
from dotenv import load_dotenv
import pandas as pd

# Import custom modules
from parser import parse_pcap, parse_access_log
from detectors import run_all
from ip_services import get_ip_geolocation, get_ip_reputation, get_ip_history, check_ip_in_cidr
from report_generator import generate_pdf_report
from models_mongodb import AlertDocument, BlocklistDocument, WhitelistDocument

# Import PCAP routes
from routes.pcap_routes import pcap_bp
from services.pcap_service import PcapCaptureService

# Import Gemini routes
from routes.gemini_routes import gemini_bp
from services.gemini_service import GeminiThreatIntelligence

# Load environment variables
load_dotenv()

# Validate critical environment variables
MONGO_URI = os.environ.get("MONGO_URI")
SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-production")

if not MONGO_URI:
    raise RuntimeError("FATAL: MONGO_URI must be set in environment")

# Validate MONGO_URI format
if not (MONGO_URI.startswith("mongodb://") or MONGO_URI.startswith("mongodb+srv://")):
    raise RuntimeError(f"FATAL: Invalid MONGO_URI format. Must start with 'mongodb://' or 'mongodb+srv://'. Got: {MONGO_URI[:20]}...")

# Flask app initialization
app = Flask(__name__, static_folder='static', static_url_path='')
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.config["MONGO_URI"] = MONGO_URI
app.config["SECRET_KEY"] = SECRET_KEY
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size

# CORS setup
CORS(app)

# Initialize MongoDB with error handling
try:
    mongo = PyMongo(app)
    # Test connection immediately
    mongo.db.command('ping')
    print("✓ MongoDB connection successful")
    # Make mongo accessible to other modules
    app.mongo = mongo
except Exception as e:
    error_msg = str(e)
    error_type = type(e).__name__
    
    # Extract cluster name from error if possible
    cluster_name = None
    if "DNS query name does not exist" in error_msg:
        match = re.search(r'_mongodb\._tcp\.([^.]+)', error_msg)
        if match:
            cluster_name = match.group(1)
    
    if "DNS query name does not exist" in error_msg or "ConfigurationError" in error_type:
        print(f"\n{'='*70}")
        print("❌ ERROR: MongoDB Connection Failed - DNS Resolution Error")
        print(f"{'='*70}")
        if cluster_name:
            print(f"Cluster name from error: {cluster_name}")
        print(f"MONGO_URI (first 60 chars): {MONGO_URI[:60]}...")
        print("\n🔍 Possible causes:")
        print("  1. MongoDB Atlas cluster was deleted or doesn't exist")
        print("  2. Incorrect MONGO_URI connection string")
        print("  3. Network/DNS issues in Docker container")
        print("  4. MongoDB Atlas cluster name changed")
        print("\n💡 Solutions:")
        print("  • Verify your cluster exists at: https://cloud.mongodb.com/")
        print("  • Get a new connection string from MongoDB Atlas")
        print("  • Check MONGODB_SETUP.md for detailed instructions")
        print(f"\n📋 Error details: {error_msg}")
        print(f"{'='*70}\n")
        raise RuntimeError(
            f"MongoDB connection failed: {error_msg}\n"
            f"Please check your MONGO_URI environment variable.\n"
            f"See MONGODB_SETUP.md for troubleshooting steps."
        ) from e
    else:
        print(f"\n{'='*70}")
        print(f"⚠ MongoDB connection error: {error_type}")
        print(f"{'='*70}")
        print(f"Error: {error_msg}")
        print(f"{'='*70}\n")
        raise

# Database collections
alerts_collection = mongo.db.alerts
ip_geolocation_collection = mongo.db.ip_geolocation
ip_reputation_collection = mongo.db.ip_reputation
blocklist_collection = mongo.db.blocklist
whitelist_collection = mongo.db.whitelist
pcap_captures_collection = mongo.db.pcap_captures

# Initialize PCAP service
pcap_service = PcapCaptureService(mongo.db)
app.pcap_service = pcap_service  # Make available to routes

# Initialize Gemini service
gemini_service = GeminiThreatIntelligence(mongo.db)
app.gemini_service = gemini_service  # Make available to routes

# Initialize SocketIO
async_mode = os.environ.get('SOCKETIO_ASYNC_MODE', 'threading')
socketio = SocketIO(app, cors_allowed_origins="*", async_mode=async_mode, logger=False, engineio_logger=False)

# Upload folder
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Auto-block configuration
AUTO_BLOCK_THRESHOLD = int(os.getenv("AUTO_BLOCK_THRESHOLD", "5"))
AUTO_BLOCK_WINDOW_HOURS = int(os.getenv("AUTO_BLOCK_WINDOW_HOURS", "1"))


# ============================================
# DATABASE INDEXES
# ============================================

def create_indexes():
    """Create MongoDB indexes for optimal performance"""
    try:
        # Alerts indexes
        alerts_collection.create_index([("timestamp", -1)], name="timestamp_desc")
        alerts_collection.create_index("src_ip", name="src_ip_index")
        alerts_collection.create_index("attack_type", name="attack_type_index")
        alerts_collection.create_index("confidence", name="confidence_index")
        alerts_collection.create_index("status", name="status_index")
        alerts_collection.create_index([("src_ip", 1), ("timestamp", -1)], name="ip_time_compound")
        
        # Unique indexes for IP collections
        blocklist_collection.create_index("ip", unique=True, sparse=True, name="blocklist_ip")
        whitelist_collection.create_index("ip", unique=True, sparse=True, name="whitelist_ip")
        ip_geolocation_collection.create_index("ip", unique=True, sparse=True, name="geo_ip")
        ip_reputation_collection.create_index("ip", unique=True, sparse=True, name="rep_ip")
        
        # PCAP captures indexes
        pcap_captures_collection.create_index("capture_id", unique=True, name="capture_id_unique")
        pcap_captures_collection.create_index([("status", 1), ("start_time", -1)], name="status_time")
        pcap_captures_collection.create_index("created_at", name="created_at_index")
        
        # Gemini threat intel indexes
        gemini_threat_intel_collection = mongo.db.gemini_threat_intel
        gemini_threat_intel_collection.create_index("analysis_id", unique=True, name="analysis_id_unique")
        gemini_threat_intel_collection.create_index("alert_id", name="alert_id_index")
        gemini_threat_intel_collection.create_index("ip_address", name="ip_address_index")
        gemini_threat_intel_collection.create_index("created_at", name="gemini_created_at_index")
        
        print("✓ MongoDB indexes created successfully")
    except Exception as e:
        import sys
        import traceback
        sys.stderr.write(f"⚠ Index creation warning: {e}\n{traceback.format_exc()}\n")


# ============================================
# SECURITY HEADERS
# ============================================

@app.after_request
def set_security_headers(response):
    """Add security headers to all responses"""
    try:
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        
        if os.environ.get('FLASK_ENV') == 'production':
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
            response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' ws: wss:;"
            response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
            response.headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
    except Exception as e:
        import sys
        sys.stderr.write(f"Error setting security headers: {e}\n")
    
    return response


# ============================================
# ERROR HANDLERS
# ============================================

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({'error': 'Not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    import sys
    sys.stderr.write(f"Internal server error: {error}\n")
    return jsonify({'error': 'Internal server error'}), 500


@app.errorhandler(Exception)
def handle_exception(e):
    """Handle all unhandled exceptions"""
    import sys
    import traceback
    try:
        error_trace = traceback.format_exc()
        sys.stderr.write(f"Unhandled exception: {e}\n{error_trace}\n")
        return jsonify({'error': 'An error occurred', 'message': str(e)}), 500
    except Exception as handler_error:
        sys.stderr.write(f"Error handler itself failed: {handler_error}\n")
        return Response('Internal Server Error', status=500, mimetype='text/plain')


# ============================================
# UTILITY FUNCTIONS
# ============================================

def check_ip_blocked(ip):
    """Check if IP is in blocklist"""
    if not ip:
        return False
    blocked = blocklist_collection.find_one({"ip": ip, "is_active": True})
    return blocked is not None


def check_ip_whitelisted(ip):
    """Check if IP is whitelisted"""
    if not ip:
        return False
    whitelisted = whitelist_collection.find_one({"ip": ip, "is_active": True})
    return whitelisted is not None


def should_auto_block(ip):
    """Check if IP should be auto-blocked"""
    if not ip or check_ip_whitelisted(ip):
        return False
    
    # Count attacks in the last window
    cutoff = datetime.utcnow() - timedelta(hours=AUTO_BLOCK_WINDOW_HOURS)
    attack_count = alerts_collection.count_documents({
        "src_ip": ip,
        "timestamp": {"$gte": cutoff}
    })
    
    if attack_count >= AUTO_BLOCK_THRESHOLD:
        # Check if already blocked
        existing = blocklist_collection.find_one({"ip": ip})
        if not existing:
            # Auto-block
            block_doc = BlocklistDocument.create(
                ip=ip,
                reason=f'Auto-blocked after {attack_count} attacks in {AUTO_BLOCK_WINDOW_HOURS} hour(s)',
                auto_blocked=True,
                attack_count=attack_count
            )
            
            try:
                blocklist_collection.insert_one(block_doc)
                block_doc['id'] = str(block_doc['_id'])
                block_doc.pop('_id')
                # Emit to all connected clients (broadcast is default in python-socketio 5.x)
                try:
                    # Try emitting without namespace first
                    socketio.emit('ip_blocked', block_doc)
                except (TypeError, AttributeError) as emit_error:
                    # If that fails, try with namespace
                    try:
                        socketio.emit('ip_blocked', block_doc, namespace='/')
                    except Exception:
                        # If all else fails, just log the error but don't fail the operation
                        import sys
                        sys.stderr.write(f"⚠ SocketIO emit error (non-critical): {emit_error}\n")
                print(f"✓ Auto-blocked IP: {ip} ({attack_count} attacks)")
                return True
            except Exception as e:
                import sys
                import traceback
                sys.stderr.write(f"⚠ Auto-block failed for {ip}: {e}\n{traceback.format_exc()}\n")
        elif not existing.get('is_active', True):
            # Reactivate block
            blocklist_collection.update_one(
                {"ip": ip},
                {"$set": {"is_active": True, "attack_count": attack_count}}
            )
            return True
    
    return False


def get_priority(confidence):
    """Calculate priority based on confidence score"""
    if confidence >= 90:
        return "critical"
    elif confidence >= 75:
        return "high"
    elif confidence >= 60:
        return "medium"
    else:
        return "low"


# ============================================
# API ROUTES
# ============================================

@app.route("/api")
@app.route("/api/info")
def api_info():
    """API information endpoint"""
    return jsonify({
        "name": "Rakshak.ai API",
        "version": "2.0-MongoDB",
        "status": "Running",
        "message": "Cybersecurity monitoring system powered by MongoDB Atlas"
    })


@app.route("/health")
def health_check():
    """Health check endpoint"""
    try:
        mongo.db.command('ping')
        db_status = "healthy"
        status_code = 200
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
        status_code = 503
    
    return jsonify({
        "status": "Running",
        "database": db_status,
        "timestamp": datetime.utcnow().isoformat()
    }), status_code


@app.route('/uploads/<filename>')
def media(filename):
    """Serve uploaded files"""
    try:
        return send_from_directory(UPLOAD_FOLDER, filename)
    except Exception as e:
        import sys
        sys.stderr.write(f"Error serving media file {filename}: {e}\n")
        return jsonify({'error': 'File not found'}), 404


@app.route('/api/upload', methods=['POST'])
def upload():
    """Upload and analyze PCAP or log files"""
    # Validate request
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    f = request.files.get('file')
    if not f or not f.filename:
        return jsonify({'error': 'No file provided'}), 400
    
    # Validate file size
    if hasattr(f, 'content_length') and f.content_length:
        max_size = app.config['MAX_CONTENT_LENGTH']
        if f.content_length > max_size:
            return jsonify({'error': f'File size exceeds {max_size // 1024 // 1024}MB'}), 400
    
    # Save file
    try:
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        fname = os.path.join(UPLOAD_FOLDER, secure_filename(f.filename))
        f.save(fname)
    except Exception as e:
        import sys
        import traceback
        sys.stderr.write(f"Error saving file: {e}\n{traceback.format_exc()}\n")
        return jsonify({'error': f'Cannot save file: {str(e)}'}), 500
    
    # Validate file extension
    ext = f.filename.lower().split('.')[-1]
    valid_extensions = ['pcap', 'pcapng', 'log', 'txt']
    
    if ext not in valid_extensions:
        try:
            os.remove(fname)
        except:
            pass
        return jsonify({'error': f'Invalid file type. Allowed: {", ".join(valid_extensions)}'}), 400
    
    # Parse file
    records = []
    try:
        if ext in ['pcap', 'pcapng']:
            records = parse_pcap(fname)
        else:
            records = parse_access_log(fname)
    except Exception as e:
        import traceback
        import sys
        error_trace = traceback.format_exc()
        sys.stderr.write(f"Error parsing file: {e}\n{error_trace}\n")
        return jsonify({'error': f'Error parsing file: {str(e)}'}), 500
    
    if not records:
        return jsonify({'error': 'No records found in file'}), 400
    
    # Process records
    recent_login_attempts = []
    new_alerts = []
    
    try:
        for r in records:
            src_ip = r.get('src_ip', '')
            
            # Skip if whitelisted or blocked
            if check_ip_whitelisted(src_ip) or check_ip_blocked(src_ip):
                continue
            
            # Run detectors
            alerts = run_all(r, recent_login_attempts=recent_login_attempts)
            
            for note, conf in alerts:
                priority = get_priority(conf)
                alert_doc = AlertDocument.create(
                    attack_type=note,
                    url=r.get('url', ''),
                    src_ip=src_ip,
                    confidence=conf,
                    raw=r.get('raw', ''),
                    dst_ip=r.get('dst_ip', ''),
                    http_method=r.get('method', ''),
                    params=str(r.get('params', '')),
                    user_agent=r.get('user_agent', ''),
                    priority=priority
                )
                
                result = alerts_collection.insert_one(alert_doc)
                new_alerts.append({
                    'id': str(result.inserted_id),
                    'attack': note,
                    'confidence': conf,
                    'priority': priority,
                    'src_ip': src_ip
                })
                
                # Check for auto-block
                should_auto_block(src_ip)
        
        # Emit WebSocket notifications for high confidence alerts
        for alert in new_alerts:
            if alert['confidence'] >= 80:
                try:
                    # Try emitting without namespace first (python-socketio 5.x default)
                    socketio.emit('new_alert', alert)
                except (TypeError, AttributeError) as emit_error:
                    # If that fails, try with namespace or just skip (non-critical)
                    try:
                        socketio.emit('new_alert', alert, namespace='/')
                    except Exception:
                        # Log but don't fail the upload - WebSocket is optional
                        import sys
                        sys.stderr.write(f"⚠ SocketIO emit error (non-critical): {emit_error}\n")
        
        return jsonify({
            'success': True,
            'message': 'File processed successfully',
            'alerts_count': len(new_alerts)
        })
    
    except Exception as e:
        import traceback
        import sys
        error_trace = traceback.format_exc()
        sys.stderr.write(f"Upload error: {e}\nTraceback: {error_trace}\n")
        return jsonify({'error': f'Error processing file: {str(e)}'}), 500


@app.route('/api/alerts')
def alerts_api():
    """Get alerts with advanced filtering"""
    # Parse query parameters
    attack_types = request.args.getlist('attack_types')
    attack = request.args.get('attack')
    status = request.args.get('status')
    priority = request.args.get('priority')
    min_confidence = request.args.get('min_confidence', type=int)
    max_confidence = request.args.get('max_confidence', type=int)
    ip_filter = request.args.get('ip')
    url_filter = request.args.get('url')
    cidr_filter = request.args.get('cidr')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    limit = min(request.args.get('limit', type=int, default=100), 1000)
    
    # Build MongoDB query
    query = {}
    
    # Date range
    if start_date or end_date:
        query['timestamp'] = {}
        if start_date:
            try:
                query['timestamp']['$gte'] = datetime.fromisoformat(start_date.replace('Z', ''))
            except:
                pass
        if end_date:
            try:
                query['timestamp']['$lte'] = datetime.fromisoformat(end_date.replace('Z', ''))
            except:
                pass
    
    # Attack types
    if attack_types:
        query['attack_type'] = {"$in": attack_types}
    elif attack:
        query['attack_type'] = attack
    
    # Status
    if status:
        query['status'] = status
    
    # Priority
    if priority:
        query['priority'] = priority
    
    # Confidence range
    if min_confidence is not None or max_confidence is not None:
        query['confidence'] = {}
        if min_confidence is not None:
            query['confidence']['$gte'] = min_confidence
        if max_confidence is not None:
            query['confidence']['$lte'] = max_confidence
    
    # IP filter
    if ip_filter:
        query['src_ip'] = ip_filter
    
    # URL filter (partial match)
    if url_filter:
        query['url'] = {"$regex": url_filter, "$options": "i"}
    
    # Execute query
    try:
        alerts = list(alerts_collection.find(query).sort("timestamp", -1).limit(limit))
        
        out = []
        # Get geolocation only if requested (to avoid timeouts)
        include_geo = request.args.get('include_geo', 'false').lower() == 'true'
        
        for r in alerts:
            # Apply CIDR filter if specified (do this first to avoid unnecessary processing)
            if cidr_filter and r.get('src_ip'):
                if not check_ip_in_cidr(r['src_ip'], cidr_filter):
                    continue
            
            # Get geolocation only if requested (to avoid timeouts on large result sets)
            geo = None
            if include_geo and r.get('src_ip'):
                try:
                    geo = get_ip_geolocation(r['src_ip'])
                except Exception as geo_error:
                    import sys
                    sys.stderr.write(f"Geolocation error for {r.get('src_ip')}: {geo_error}\n")
                    geo = None
            
            alert_data = {
                'id': str(r['_id']),
                'timestamp': r['timestamp'].isoformat() if isinstance(r['timestamp'], datetime) else str(r['timestamp']),
                'src_ip': r.get('src_ip', ''),
                'dst_ip': r.get('dst_ip', ''),
                'method': r.get('http_method', ''),
                'url': r.get('url', ''),
                'attack': r.get('attack_type', ''),
                'confidence': r.get('confidence', 0),
                'raw': r.get('raw', ''),
                'status': r.get('status', 'new'),
                'priority': r.get('priority', 'medium'),
                'notes': r.get('notes', ''),
                'geolocation': geo
            }
            
            out.append(alert_data)
        
        return jsonify(out)
    
    except Exception as e:
        import sys
        import traceback
        # FIXED: Better error logging with full traceback
        error_trace = traceback.format_exc()
        sys.stderr.write(f"Alerts API error: {type(e).__name__}: {e}\n{error_trace}\n")
        return jsonify({'error': f'{type(e).__name__}: {str(e)}'}), 500


@app.route('/api/alerts/<alert_id>', methods=['GET', 'PATCH', 'DELETE'])
def alert_detail(alert_id):
    """Get, update, or delete a specific alert"""
    try:
        obj_id = ObjectId(alert_id)
    except:
        return jsonify({'error': 'Invalid alert ID'}), 400
    
    alert = alerts_collection.find_one({"_id": obj_id})
    if not alert:
        return jsonify({'error': 'Alert not found'}), 404
    
    if request.method == 'GET':
        # FIXED: Better error handling for IP services
        geo = None
        rep = None
        if alert.get('src_ip'):
            try:
                geo = get_ip_geolocation(alert.get('src_ip'))
            except Exception as geo_error:
                import sys
                sys.stderr.write(f"Geolocation error: {geo_error}\n")
            
            try:
                rep = get_ip_reputation(alert.get('src_ip'))
            except Exception as rep_error:
                import sys
                sys.stderr.write(f"Reputation error: {rep_error}\n")
        
        return jsonify({
            'id': str(alert['_id']),
            'timestamp': alert['timestamp'].isoformat() if isinstance(alert['timestamp'], datetime) else str(alert['timestamp']),
            'src_ip': alert.get('src_ip', ''),
            'dst_ip': alert.get('dst_ip', ''),
            'method': alert.get('http_method', ''),
            'url': alert.get('url', ''),
            'attack': alert.get('attack_type', ''),
            'confidence': alert.get('confidence', 0),
            'raw': alert.get('raw', ''),
            'status': alert.get('status', 'new'),
            'priority': alert.get('priority', 'medium'),
            'notes': alert.get('notes', ''),
            'geolocation': geo,
            'reputation': rep
        })
    
    elif request.method == 'PATCH':
        data = request.get_json()
        update_doc = {"$set": {"updated_at": datetime.utcnow()}}
        
        for field in ['status', 'priority', 'notes']:
            if field in data:
                update_doc['$set'][field] = data[field]
        
        alerts_collection.update_one({"_id": obj_id}, update_doc)
        return jsonify({'success': True})
    
    elif request.method == 'DELETE':
        alerts_collection.delete_one({"_id": obj_id})
        return jsonify({'success': True})


@app.route('/api/alerts/bulk', methods=['PATCH'])
def bulk_update_alerts():
    """Bulk update alerts"""
    data = request.get_json()
    alert_ids = data.get('alert_ids', [])
    updates = data.get('updates', {})
    
    try:
        obj_ids = [ObjectId(aid) for aid in alert_ids]
    except:
        return jsonify({'error': 'Invalid alert ID format'}), 400
    
    update_doc = {"$set": {"updated_at": datetime.utcnow()}}
    for field in ['status', 'priority']:
        if field in updates:
            update_doc['$set'][field] = updates[field]
    
    result = alerts_collection.update_many({"_id": {"$in": obj_ids}}, update_doc)
    return jsonify({'success': True, 'updated': result.modified_count})


@app.route('/api/stats')
def stats_api():
    """Get dashboard statistics"""
    try:
        from bson.son import SON
        
        # Total alerts
        total_alerts = alerts_collection.count_documents({})
        
        # High confidence alerts
        high_conf = alerts_collection.count_documents({"confidence": {"$gte": 80}})
        
        # Recent activity (last 24 hours)
        cutoff = datetime.utcnow() - timedelta(hours=24)
        recent = alerts_collection.count_documents({"timestamp": {"$gte": cutoff}})
        
        # Attack type distribution
        attack_dist_pipeline = [
            {"$group": {"_id": "$attack_type", "count": {"$sum": 1}}},
            {"$sort": SON([("count", -1)])}
        ]
        attack_types = list(alerts_collection.aggregate(attack_dist_pipeline))
        attack_dist = {item['_id']: item['count'] for item in attack_types}
        
        # Status distribution
        status_dist_pipeline = [
            {"$group": {"_id": "$status", "count": {"$sum": 1}}}
        ]
        status_types = list(alerts_collection.aggregate(status_dist_pipeline))
        status_counts = {item['_id']: item['count'] for item in status_types}
        
        # Priority distribution
        priority_dist_pipeline = [
            {"$group": {"_id": "$priority", "count": {"$sum": 1}}}
        ]
        priority_types = list(alerts_collection.aggregate(priority_dist_pipeline))
        priority_counts = {item['_id']: item['count'] for item in priority_types}
        
        # Top attacking IPs
        top_ips_pipeline = [
            {"$match": {"src_ip": {"$ne": None, "$ne": ""}}},
            {"$group": {"_id": "$src_ip", "count": {"$sum": 1}}},
            {"$sort": SON([("count", -1)])},
            {"$limit": 10}
        ]
        top_ips = list(alerts_collection.aggregate(top_ips_pipeline))
        ip_stats = []
        for item in top_ips:
            # FIXED: Better error handling for geolocation
            try:
                geo = get_ip_geolocation(item['_id'])
                country = geo.get('country', 'Unknown') if geo else 'Unknown'
            except Exception as geo_error:
                import sys
                sys.stderr.write(f"Geolocation error for {item['_id']}: {geo_error}\n")
                country = 'Unknown'
            
            ip_stats.append({
                'ip': item['_id'],
                'count': item['count'],
                'country': country
            })
        
        return jsonify({
            'total_alerts': total_alerts,
            'high_confidence_alerts': high_conf,
            'recent_24h': recent,
            'attack_distribution': attack_dist,
            'status_distribution': status_counts,
            'priority_distribution': priority_counts,
            'top_ips': ip_stats
        })
    
    except Exception as e:
        import sys
        import traceback
        # FIXED: Better error logging with full traceback
        error_trace = traceback.format_exc()
        sys.stderr.write(f"Stats API error: {type(e).__name__}: {e}\n{error_trace}\n")
        return jsonify({'error': f'{type(e).__name__}: {str(e)}'}), 500


@app.route('/api/ip/<ip>')
def ip_info(ip):
    """Get IP information"""
    # FIXED: Better error handling
    geo = None
    rep = None
    history = None
    
    try:
        geo = get_ip_geolocation(ip)
    except Exception as e:
        import sys
        sys.stderr.write(f"Geolocation error for {ip}: {e}\n")
    
    try:
        rep = get_ip_reputation(ip)
    except Exception as e:
        import sys
        sys.stderr.write(f"Reputation error for {ip}: {e}\n")
    
    try:
        history = get_ip_history(ip)
    except Exception as e:
        import sys
        sys.stderr.write(f"History error for {ip}: {e}\n")
    
    is_blocked = check_ip_blocked(ip)
    is_whitelisted = check_ip_whitelisted(ip)
    
    return jsonify({
        'ip': ip,
        'geolocation': geo,
        'reputation': rep,
        'history': history,
        'is_blocked': is_blocked,
        'is_whitelisted': is_whitelisted
    })


@app.route('/api/blocklist', methods=['GET', 'POST'])
def blocklist_api():
    """Get or add to blocklist"""
    if request.method == 'GET':
        blocks = list(blocklist_collection.find({"is_active": True}))
        return jsonify([{
            'id': str(b['_id']),
            'ip': b['ip'],
            'reason': b.get('reason', ''),
            'auto_blocked': b.get('auto_blocked', False),
            'attack_count': b.get('attack_count', 0),
            'created_at': b['created_at'].isoformat() if 'created_at' in b else ''
        } for b in blocks])
    
    elif request.method == 'POST':
        data = request.get_json()
        ip = data.get('ip')
        reason = data.get('reason', 'Manually blocked')
        
        existing = blocklist_collection.find_one({"ip": ip})
        if existing:
            blocklist_collection.update_one(
                {"ip": ip},
                {"$set": {"is_active": True, "reason": reason}}
            )
        else:
            block_doc = BlocklistDocument.create(
                ip=ip,
                reason=reason,
                auto_blocked=False
            )
            blocklist_collection.insert_one(block_doc)
        
        return jsonify({'success': True})


@app.route('/api/blocklist/<block_id>', methods=['DELETE'])
def unblock_ip(block_id):
    """Remove from blocklist"""
    try:
        obj_id = ObjectId(block_id)
    except:
        return jsonify({'error': 'Invalid ID'}), 400
    
    result = blocklist_collection.update_one(
        {"_id": obj_id},
        {"$set": {"is_active": False}}
    )
    
    if result.matched_count == 0:
        return jsonify({'error': 'Not found'}), 404
    
    return jsonify({'success': True})


@app.route('/api/whitelist', methods=['GET', 'POST'])
def whitelist_api():
    """Get or add to whitelist"""
    if request.method == 'GET':
        whitelist = list(whitelist_collection.find({"is_active": True}))
        return jsonify([{
            'id': str(w['_id']),
            'ip': w['ip'],
            'reason': w.get('reason', ''),
            'created_at': w['created_at'].isoformat() if 'created_at' in w else ''
        } for w in whitelist])
    
    elif request.method == 'POST':
        data = request.get_json()
        ip = data.get('ip')
        reason = data.get('reason', 'Manually whitelisted')
        
        existing = whitelist_collection.find_one({"ip": ip})
        if existing:
            whitelist_collection.update_one(
                {"ip": ip},
                {"$set": {"is_active": True, "reason": reason}}
            )
        else:
            whitelist_doc = WhitelistDocument.create(
                ip=ip,
                reason=reason
            )
            whitelist_collection.insert_one(whitelist_doc)
        
        return jsonify({'success': True})


@app.route('/api/whitelist/<whitelist_id>', methods=['DELETE'])
def remove_whitelist(whitelist_id):
    """Remove from whitelist"""
    try:
        obj_id = ObjectId(whitelist_id)
    except:
        return jsonify({'error': 'Invalid ID'}), 400
    
    result = whitelist_collection.update_one(
        {"_id": obj_id},
        {"$set": {"is_active": False}}
    )
    
    if result.matched_count == 0:
        return jsonify({'error': 'Not found'}), 404
    
    return jsonify({'success': True})


@app.route('/api/export')
def export():
    """Export alerts"""
    fmt = request.args.get('fmt', 'csv')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    # Build query
    query = {}
    if start_date or end_date:
        query['timestamp'] = {}
        if start_date:
            try:
                query['timestamp']['$gte'] = datetime.fromisoformat(start_date.replace('Z', ''))
            except:
                pass
        if end_date:
            try:
                query['timestamp']['$lte'] = datetime.fromisoformat(end_date.replace('Z', ''))
            except:
                pass
    
    try:
        alerts = list(alerts_collection.find(query))
        
        data = []
        for r in alerts:
            data.append({
                'id': str(r['_id']),
                'timestamp': r['timestamp'].isoformat() if isinstance(r['timestamp'], datetime) else str(r['timestamp']),
                'src_ip': r.get('src_ip', ''),
                'url': r.get('url', ''),
                'attack': r.get('attack_type', ''),
                'confidence': r.get('confidence', 0),
                'status': r.get('status', 'new'),
                'priority': r.get('priority', 'medium')
            })
        
        if not data:
            return jsonify({'error': 'No data to export'}), 404
        
        df = pd.DataFrame(data)
        buf = io.BytesIO()
        
        if fmt == 'csv':
            df.to_csv(buf, index=False)
            buf.seek(0)
            return send_file(buf, mimetype='text/csv', as_attachment=True, download_name='alerts.csv')
        
        elif fmt == 'pdf':
            # Use your existing PDF generator
            pdf_buffer = generate_pdf_report(data, [], None)
            filename = f'alerts_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf'
            return send_file(pdf_buffer, mimetype='application/pdf', as_attachment=True, download_name=filename)
        
        else:
            return jsonify({'data': data})
    
    except Exception as e:
        import sys
        import traceback
        sys.stderr.write(f"Export error: {e}\n{traceback.format_exc()}\n")
        return jsonify({'error': str(e)}), 500


# ============================================
# SOCKETIO EVENTS
# ============================================

@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    emit('connected', {'data': 'Connected to real-time alerts'})
    print(f"✓ Client connected: {request.sid}")


@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    print(f"✗ Client disconnected: {request.sid}")


# ============================================
# REGISTER BLUEPRINTS
# ============================================

app.register_blueprint(pcap_bp)
app.register_blueprint(gemini_bp)


# ============================================
# REACT FRONTEND ROUTES (CATCH-ALL)
# ============================================

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    """Serve React static files"""
    static_path = app.static_folder or 'static'
    
    # Serve specific file if it exists
    if path != '' and os.path.exists(os.path.join(static_path, path)):
        try:
            return send_from_directory(static_path, path)
        except Exception as e:
            import sys
            sys.stderr.write(f"Error serving static file {path}: {e}\n")
            return jsonify({'error': 'File not found'}), 404
    
    # Serve React app for client-side routing
    index_path = os.path.join(static_path, 'index.html')
    if os.path.exists(index_path):
        try:
            return send_from_directory(static_path, 'index.html')
        except Exception as e:
            import sys
            sys.stderr.write(f"Error serving index.html: {e}\n")
            return jsonify({'error': 'Frontend not built'}), 404
    else:
        return jsonify({'error': 'Frontend not built. Please build the React app first.'}), 404


# ============================================
# APPLICATION STARTUP
# ============================================

with app.app_context():
    create_indexes()

if __name__ == '__main__':
    debug_mode = os.environ.get('FLASK_DEBUG', '0') == '1' or os.environ.get('FLASK_ENV') == 'development'
    port = int(os.environ.get('PORT', 8000))
    
    if debug_mode:
        print("⚠ WARNING: Running in DEBUG mode - NOT for production!")
    else:
        print("✓ Running in PRODUCTION mode")
    
    print(f"✓ Server starting on port {port}")
    
    socketio.run(app, debug=debug_mode, host='0.0.0.0', port=port, allow_unsafe_werkzeug=True)
