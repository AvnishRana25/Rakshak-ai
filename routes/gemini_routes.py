"""
Gemini Threat Intelligence Routes
Flask Blueprint for Gemini API endpoints
"""
from flask import Blueprint, request, jsonify
from bson import ObjectId
import sys

from services.gemini_service import GeminiThreatIntelligence
from models_mongodb import GeminiThreatIntelDocument

# Create blueprint
gemini_bp = Blueprint('gemini', __name__, url_prefix='/api/gemini')


def get_gemini_service():
    """Get Gemini service instance (injected from app)"""
    from flask import current_app
    return current_app.gemini_service


@gemini_bp.route('/analyze', methods=['POST'])
def analyze_threat():
    """Analyze threat using Gemini"""
    try:
        data = request.get_json() or {}
        
        alert_id = data.get('alert_id')
        ip_address = data.get('ip_address')
        threat_data = data.get('threat_data', {})
        
        if not alert_id and not ip_address:
            return jsonify({'error': 'Either alert_id or ip_address required'}), 400
        
        service = get_gemini_service()
        
        # If alert_id provided, fetch alert first
        if alert_id:
            from flask import current_app
            alert = current_app.mongo.db.alerts.find_one({"_id": ObjectId(alert_id)})
            if not alert:
                return jsonify({'error': 'Alert not found'}), 404
            
            # Convert to dict format
            alert_data = {
                'id': str(alert['_id']),
                'attack_type': alert.get('attack_type', ''),
                'src_ip': alert.get('src_ip', ''),
                'dst_ip': alert.get('dst_ip', ''),
                'url': alert.get('url', ''),
                'http_method': alert.get('http_method', ''),
                'user_agent': alert.get('user_agent', ''),
                'confidence': alert.get('confidence', 0),
                'timestamp': alert.get('timestamp', ''),
                'raw': alert.get('raw', '')
            }
            
            analysis = service.analyze_threat(alert_data)
        else:
            # Analyze IP directly
            analysis = service.enrich_ip_reputation(ip_address, threat_data)
        
        # Get analysis document
        analysis_doc = service.db.gemini_threat_intel.find_one({
            "$or": [
                {"alert_id": alert_id} if alert_id else {"ip_address": ip_address}
            ]
        })
        
        if analysis_doc:
            analysis_id = analysis_doc.get('analysis_id')
            result = GeminiThreatIntelDocument.to_dict(analysis_doc)
        else:
            analysis_id = None
            result = {
                "analysis_id": None,
                "threat_level": analysis.get('threat_level', 'medium'),
                "recommendations": analysis.get('mitigation_steps', []),
                "gemini_response": analysis
            }
        
        return jsonify({
            "analysis_id": analysis_id,
            "threat_level": result.get('threat_level', 'medium'),
            "recommendations": result.get('recommendations', []),
            "analysis": result.get('gemini_response', analysis)
        }), 200
    
    except Exception as e:
        sys.stderr.write(f"Error in Gemini analysis: {e}\n")
        return jsonify({'error': 'Internal server error'}), 500


@gemini_bp.route('/analysis/<analysis_id>', methods=['GET'])
def get_analysis(analysis_id):
    """Get full Gemini analysis by ID"""
    try:
        service = get_gemini_service()
        
        analysis = service.db.gemini_threat_intel.find_one({"analysis_id": analysis_id})
        if not analysis:
            return jsonify({'error': 'Analysis not found'}), 404
        
        result = GeminiThreatIntelDocument.to_dict(analysis)
        return jsonify(result), 200
    
    except Exception as e:
        sys.stderr.write(f"Error getting analysis: {e}\n")
        return jsonify({'error': 'Internal server error'}), 500


@gemini_bp.route('/threat-intel/<ip_address>', methods=['GET'])
def get_threat_intel(ip_address):
    """Get threat intelligence for IP address"""
    try:
        service = get_gemini_service()
        
        # Get context from alerts
        from flask import current_app
        alerts = list(current_app.mongo.db.alerts.find({"src_ip": ip_address}).limit(10))
        
        context = {
            "alert_count": len(alerts),
            "attack_types": list(set([a.get('attack_type') for a in alerts if a.get('attack_type')])),
            "first_seen": str(alerts[0].get('timestamp')) if alerts else None,
            "last_seen": str(alerts[-1].get('timestamp')) if alerts else None
        }
        
        analysis = service.enrich_ip_reputation(ip_address, context)
        
        # Get stored analysis
        stored = service.db.gemini_threat_intel.find_one({"ip_address": ip_address})
        
        return jsonify({
            "ip_address": ip_address,
            "ip_reputation": analysis.get('reputation', 'unknown'),
            "threat_history": analysis.get('threat_history', ''),
            "recommendations": analysis.get('recommended_action', 'monitor'),
            "analysis": analysis,
            "stored_analysis": GeminiThreatIntelDocument.to_dict(stored) if stored else None
        }), 200
    
    except Exception as e:
        sys.stderr.write(f"Error getting threat intel: {e}\n")
        return jsonify({'error': 'Internal server error'}), 500


@gemini_bp.route('/batch-analyze', methods=['POST'])
def batch_analyze():
    """Batch analyze multiple alerts"""
    try:
        data = request.get_json() or {}
        alert_ids = data.get('alert_ids', [])
        
        if not alert_ids or not isinstance(alert_ids, list):
            return jsonify({'error': 'alert_ids must be a non-empty list'}), 400
        
        service = get_gemini_service()
        
        # Fetch alerts
        from flask import current_app
        from bson import ObjectId
        
        alerts = []
        for alert_id in alert_ids:
            try:
                alert = current_app.mongo.db.alerts.find_one({"_id": ObjectId(alert_id)})
                if alert:
                    alerts.append({
                        'id': str(alert['_id']),
                        'attack_type': alert.get('attack_type', ''),
                        'src_ip': alert.get('src_ip', ''),
                        'dst_ip': alert.get('dst_ip', ''),
                        'url': alert.get('url', ''),
                        'http_method': alert.get('http_method', ''),
                        'user_agent': alert.get('user_agent', ''),
                        'confidence': alert.get('confidence', 0),
                        'timestamp': str(alert.get('timestamp', '')),
                        'raw': alert.get('raw', '')
                    })
            except Exception:
                continue
        
        # Batch analyze
        results = service.batch_analyze_alerts(alerts)
        
        return jsonify({
            "processed_count": len(results),
            "analyses": results
        }), 200
    
    except Exception as e:
        sys.stderr.write(f"Error in batch analysis: {e}\n")
        return jsonify({'error': 'Internal server error'}), 500

