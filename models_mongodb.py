"""
MongoDB Document Models for Rakshak.ai
"""

from datetime import datetime
from bson import ObjectId


class AlertDocument:
    """Alert document structure and helper methods"""

    @staticmethod
    def create(attack_type, url, src_ip, confidence, raw,
               dst_ip="", http_method="", params="", user_agent="",
               timestamp=None, status="new", priority=None, notes=""):
        """Create a new alert document"""

        # Auto-assign priority based on confidence
        if priority is None:
            if confidence >= 90:
                priority = "critical"
            elif confidence >= 75:
                priority = "high"
            elif confidence >= 60:
                priority = "medium"
            else:
                priority = "low"

        return {
            "attack_type": attack_type,
            "url": url,
            "src_ip": src_ip,
            "dst_ip": dst_ip,
            "http_method": http_method,
            "params": params,
            "user_agent": user_agent,
            "confidence": confidence,
            "raw": raw,
            "timestamp": timestamp or datetime.utcnow(),
            "status": status,
            "priority": priority,
            "notes": notes,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

    @staticmethod
    def to_dict(doc):
        """Convert MongoDB document to API response dictionary"""
        if doc is None:
            return None

        # Convert ObjectId to string
        doc['id'] = str(doc['_id'])
        doc.pop('_id', None)

        # Convert datetime objects to ISO format strings
        for field in ['timestamp', 'created_at', 'updated_at']:
            if field in doc and isinstance(doc[field], datetime):
                doc[field] = doc[field].isoformat()

        return doc


class IPGeolocationDocument:
    """IP geolocation cache document"""
    
    @staticmethod
    def create(ip, country, city, latitude=None, longitude=None, country_code=''):
        return {
            "ip": ip,
            "country": country,
            "city": city,
            "latitude": latitude,
            "longitude": longitude,
            "country_code": country_code,
            "last_updated": datetime.utcnow()
        }


class IPReputationDocument:
    """IP reputation cache document"""
    
    @staticmethod
    def create(ip, abuse_score=0, is_public=True, usage_type="unknown"):
        return {
            "ip": ip,
            "abuse_score": abuse_score,
            "is_public": is_public,
            "usage_type": usage_type,
            "last_checked": datetime.utcnow()
        }


class BlocklistDocument:
    """Blocked IP document"""

    @staticmethod
    def create(ip, reason="Manual block", auto_blocked=False, attack_count=0):
        return {
            "ip": ip,
            "reason": reason,
            "auto_blocked": auto_blocked,
            "attack_count": attack_count,
            "is_active": True,
            "created_at": datetime.utcnow()
        }

    @staticmethod
    def to_dict(doc):
        if doc is None:
            return None

        doc['id'] = str(doc['_id'])
        doc.pop('_id', None)

        if 'created_at' in doc and isinstance(doc['created_at'], datetime):
            doc['created_at'] = doc['created_at'].isoformat()

        return doc


class WhitelistDocument:
    """Whitelisted IP document"""

    @staticmethod
    def create(ip, reason="Trusted IP"):
        return {
            "ip": ip,
            "reason": reason,
            "is_active": True,
            "created_at": datetime.utcnow()
        }

    @staticmethod
    def to_dict(doc):
        if doc is None:
            return None

        doc['id'] = str(doc['_id'])
        doc.pop('_id', None)

        if 'created_at' in doc and isinstance(doc['created_at'], datetime):
            doc['created_at'] = doc['created_at'].isoformat()

        return doc


class PcapCaptureDocument:
    """PCAP capture document structure"""

    @staticmethod
    def create(capture_id, interface, filter_rules="", max_packets=None, 
               duration=None, filename="", created_by="system"):
        """Create a new PCAP capture document"""
        return {
            "capture_id": capture_id,
            "start_time": datetime.utcnow(),
            "end_time": None,
            "status": "running",
            "interface": interface,
            "filter_rules": filter_rules,
            "max_packets": max_packets,
            "duration": duration,
            "file_path": filename,
            "file_size": 0,
            "packet_count": 0,
            "process_id": None,
            "created_by": created_by,
            "metadata": {},
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

    @staticmethod
    def to_dict(doc):
        """Convert MongoDB document to API response dictionary"""
        if doc is None:
            return None

        doc['id'] = str(doc['_id'])
        doc.pop('_id', None)

        # Convert datetime objects to ISO format strings
        for field in ['start_time', 'end_time', 'created_at', 'updated_at']:
            if field in doc and doc[field] is not None and isinstance(doc[field], datetime):
                doc[field] = doc[field].isoformat()

        return doc


class GeminiThreatIntelDocument:
    """Gemini threat intelligence analysis document"""

    @staticmethod
    def create(analysis_id, alert_id=None, ip_address=None, threat_level="medium",
               threat_type="", confidence_score=0.0, gemini_response=None,
               recommendations=None):
        """Create a new Gemini threat intelligence document"""
        return {
            "analysis_id": analysis_id,
            "alert_id": alert_id,
            "ip_address": ip_address,
            "threat_level": threat_level,
            "threat_type": threat_type,
            "confidence_score": confidence_score,
            "analysis_timestamp": datetime.utcnow(),
            "gemini_response": gemini_response or {},
            "recommendations": recommendations or [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

    @staticmethod
    def to_dict(doc):
        """Convert MongoDB document to API response dictionary"""
        if doc is None:
            return None

        doc['id'] = str(doc['_id'])
        doc.pop('_id', None)

        # Convert datetime objects to ISO format strings
        for field in ['analysis_timestamp', 'created_at', 'updated_at']:
            if field in doc and doc[field] is not None and isinstance(doc[field], datetime):
                doc[field] = doc[field].isoformat()

        return doc
