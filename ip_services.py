import requests
import time
from datetime import datetime, timedelta
import ipaddress
import os

# Cache duration (in days)
GEO_CACHE_DAYS = 7
REP_CACHE_DAYS = 1


def is_valid_ip(ip):
    """Check if IP address is valid"""
    if not ip or ip == '':
        return False
    try:
        ipaddress.ip_address(ip)
        return True
    except ValueError:
        return False


def get_ip_geolocation(ip, mongo_db=None):
    """
    Get geolocation for an IP address (with MongoDB caching)
    
    Args:
        ip: IP address to lookup
        mongo_db: MongoDB database instance (optional, uses global mongo if not provided)
    
    Returns:
        Dictionary with country, city, latitude, longitude, country_code
    """
    if not is_valid_ip(ip):
        return None
    
    # Use global mongo if not provided
    if mongo_db is None:
        try:
            from flask import current_app
            # Access mongo.db directly (Flask-PyMongo pattern)
            mongo_db = current_app.mongo.db
        except (RuntimeError, AttributeError) as e:
            import sys
            sys.stderr.write(f"⚠ Cannot access MongoDB in get_ip_geolocation: {e}\n")
            return None
    
    try:
        # Check cache first
        cached = mongo_db.ip_geolocation.find_one({"ip": ip})
        
        if cached:
            # Check if cache is still valid
            cache_age = datetime.utcnow() - cached.get('last_updated', datetime.utcnow())
            if cache_age.days < GEO_CACHE_DAYS:
                return {
                    'country': cached.get('country', 'Unknown'),
                    'city': cached.get('city', 'Unknown'),
                    'latitude': cached.get('latitude'),
                    'longitude': cached.get('longitude'),
                    'country_code': cached.get('country_code', '')
                }
        
        # Fetch from API (using free ipapi.co)
        try:
            # Free tier: 1000 requests/day
            response = requests.get(
                f'https://ipapi.co/{ip}/json/',
                timeout=5,
                verify=True
            )
            
            if response.status_code == 200:
                data = response.json()
                geo_data = {
                    'country': data.get('country_name', 'Unknown'),
                    'city': data.get('city', 'Unknown'),
                    'latitude': data.get('latitude'),
                    'longitude': data.get('longitude'),
                    'country_code': data.get('country_code', '')
                }
                
                # Update or create cache in MongoDB
                cache_doc = {
                    'ip': ip,
                    'country': geo_data['country'],
                    'city': geo_data['city'],
                    'latitude': geo_data['latitude'],
                    'longitude': geo_data['longitude'],
                    'country_code': geo_data['country_code'],
                    'last_updated': datetime.utcnow()
                }
                
                # Upsert (update if exists, insert if not)
                mongo_db.ip_geolocation.update_one(
                    {"ip": ip},
                    {"$set": cache_doc},
                    upsert=True
                )
                
                return geo_data
            
            elif response.status_code == 429:
                # Rate limit exceeded - return cached data even if expired
                import sys
                sys.stderr.write(f"⚠ Geolocation API rate limit exceeded for {ip}\n")
                if cached:
                    return {
                        'country': cached.get('country', 'Unknown'),
                        'city': cached.get('city', 'Unknown'),
                        'latitude': cached.get('latitude'),
                        'longitude': cached.get('longitude'),
                        'country_code': cached.get('country_code', '')
                    }
        
        except requests.exceptions.Timeout:
            import sys
            sys.stderr.write(f"⚠ Geolocation API timeout for {ip}\n")
            # Return cached data even if expired
            if cached:
                return {
                    'country': cached.get('country', 'Unknown'),
                    'city': cached.get('city', 'Unknown'),
                    'latitude': cached.get('latitude'),
                    'longitude': cached.get('longitude'),
                    'country_code': cached.get('country_code', '')
                }
        
        except Exception as e:
            import sys
            import traceback
            sys.stderr.write(f"⚠ Geolocation API error for {ip}: {e}\n{traceback.format_exc()}\n")
            # Return cached data even if expired
            if cached:
                return {
                    'country': cached.get('country', 'Unknown'),
                    'city': cached.get('city', 'Unknown'),
                    'latitude': cached.get('latitude'),
                    'longitude': cached.get('longitude'),
                    'country_code': cached.get('country_code', '')
                }
        
        return None
    
    except Exception as e:
        import sys
        import traceback
        sys.stderr.write(f"⚠ MongoDB geolocation cache error for {ip}: {e}\n{traceback.format_exc()}\n")
        return None


def get_ip_reputation(ip, mongo_db=None):
    """
    Get reputation for an IP address (with MongoDB caching)
    
    Args:
        ip: IP address to check
        mongo_db: MongoDB database instance (optional)
    
    Returns:
        Dictionary with abuse_score, is_public, usage_type
    """
    if not is_valid_ip(ip):
        return None
    
    # Use global mongo if not provided
    if mongo_db is None:
        try:
            from flask import current_app
            # Access mongo.db directly (Flask-PyMongo pattern)
            mongo_db = current_app.mongo.db
        except (RuntimeError, AttributeError) as e:
            import sys
            sys.stderr.write(f"⚠ Cannot access MongoDB in get_ip_reputation: {e}\n")
            return None
    
    try:
        # Check cache first
        cached = mongo_db.ip_reputation.find_one({"ip": ip})
        
        if cached:
            # Check if cache is still valid
            cache_age = datetime.utcnow() - cached.get('last_checked', datetime.utcnow())
            if cache_age.days < REP_CACHE_DAYS:
                return {
                    'abuse_score': cached.get('abuse_score', 0),
                    'is_public': cached.get('is_public', True),
                    'usage_type': cached.get('usage_type', 'unknown')
                }
        
        # Calculate reputation score
        abuse_score = 0
        usage_type = 'unknown'
        try:
            ip_obj = ipaddress.ip_address(ip)
            # Check if it's a private/internal IP
            is_public = ip_obj.is_global
            
            # Simple heuristic: known bad ranges or suspicious patterns
            if not is_public:
                usage_type = 'private'
            elif ip.startswith('192.168.') or ip.startswith('10.') or ip.startswith('172.'):
                usage_type = 'private'
                is_public = False
            else:
                usage_type = 'public'
            
            # Optional: Integrate with AbuseIPDB if you have an API key
            abuseipdb_key = os.getenv('ABUSEIPDB_API_KEY')
            if abuseipdb_key and is_public:
                try:
                    response = requests.get(
                        'https://api.abuseipdb.com/api/v2/check',
                        params={'ipAddress': ip, 'maxAgeInDays': 90},
                        headers={'Key': abuseipdb_key, 'Accept': 'application/json'},
                        timeout=5
                    )
                    
                    if response.status_code == 200:
                        data = response.json().get('data', {})
                        abuse_score = data.get('abuseConfidenceScore', 0)
                        usage_type = data.get('usageType', 'public')
                
                except Exception as api_error:
                    import sys
                    sys.stderr.write(f"⚠ AbuseIPDB API error for {ip}: {api_error}\n")
        
        except Exception as e:
            import sys
            import traceback
            sys.stderr.write(f"⚠ Reputation check error for {ip}: {e}\n{traceback.format_exc()}\n")
            is_public = True
            usage_type = 'unknown'
        
        rep_data = {
            'abuse_score': abuse_score,
            'is_public': is_public,
            'usage_type': usage_type
        }
        
        # Update or create cache in MongoDB
        cache_doc = {
            'ip': ip,
            'abuse_score': abuse_score,
            'is_public': is_public,
            'usage_type': usage_type,
            'last_checked': datetime.utcnow()
        }
        
        # Upsert
        mongo_db.ip_reputation.update_one(
            {"ip": ip},
            {"$set": cache_doc},
            upsert=True
        )
        
        return rep_data
    
    except Exception as e:
        import sys
        import traceback
        sys.stderr.write(f"⚠ MongoDB reputation cache error for {ip}: {e}\n{traceback.format_exc()}\n")
        return None


def get_ip_history(ip, mongo_db=None):
    """
    Get attack history for an IP from MongoDB alerts collection
    
    Args:
        ip: IP address to lookup
        mongo_db: MongoDB database instance (optional)
    
    Returns:
        List of alert dictionaries
    """
    if not is_valid_ip(ip):
        return []
    
    # Use global mongo if not provided
    if mongo_db is None:
        try:
            from flask import current_app
            # Access mongo.db directly (Flask-PyMongo pattern)
            mongo_db = current_app.mongo.db
        except (RuntimeError, AttributeError) as e:
            import sys
            sys.stderr.write(f"⚠ Cannot access MongoDB in get_ip_history: {e}\n")
            return []
    
    try:
        # Query MongoDB alerts collection
        alerts = list(mongo_db.alerts.find(
            {"src_ip": ip}
        ).sort("timestamp", -1).limit(50))
        
        history = []
        for alert in alerts:
            history.append({
                'id': str(alert['_id']),
                'timestamp': alert['timestamp'].isoformat() if isinstance(alert['timestamp'], datetime) else str(alert['timestamp']),
                'attack_type': alert.get('attack_type', 'Unknown'),
                'confidence': alert.get('confidence', 0),
                'url': alert.get('url', ''),
                'status': alert.get('status', 'new')
            })
        
        return history
    
    except Exception as e:
        import sys
        import traceback
        sys.stderr.write(f"⚠ Error fetching IP history for {ip}: {e}\n{traceback.format_exc()}\n")
        return []


def check_ip_in_cidr(ip, cidr):
    """
    Check if IP is in CIDR range
    
    Args:
        ip: IP address to check
        cidr: CIDR range (e.g., '192.168.1.0/24')
    
    Returns:
        Boolean
    """
    try:
        ip_obj = ipaddress.ip_address(ip)
        network = ipaddress.ip_network(cidr, strict=False)
        return ip_obj in network
    except Exception as e:
        import sys
        sys.stderr.write(f"⚠ CIDR check error for {ip} in {cidr}: {e}\n")
        return False


def bulk_geolocate_ips(ip_list, mongo_db=None):
    """
    Bulk geolocation lookup with caching optimization
    
    Args:
        ip_list: List of IP addresses
        mongo_db: MongoDB database instance (optional)
    
    Returns:
        Dictionary mapping IPs to geolocation data
    """
    if not ip_list:
        return {}
    
    # Use global mongo if not provided
    if mongo_db is None:
        try:
            from flask import current_app
            # Access mongo.db directly (Flask-PyMongo pattern)
            mongo_db = current_app.mongo.db
        except (RuntimeError, AttributeError) as e:
            import sys
            sys.stderr.write(f"⚠ Cannot access MongoDB in bulk_geolocate_ips: {e}\n")
            return {}
    
    results = {}
    
    # Filter valid IPs
    valid_ips = [ip for ip in ip_list if is_valid_ip(ip)]
    if not valid_ips:
        return {}
    
    try:
        # Bulk fetch from cache
        cached_docs = mongo_db.ip_geolocation.find({"ip": {"$in": valid_ips}})
        cached_map = {doc['ip']: doc for doc in cached_docs}
        
        # Identify IPs that need fresh lookup
        uncached_ips = [ip for ip in valid_ips if ip not in cached_map]
        
        # Return cached results
        for ip, doc in cached_map.items():
            cache_age = datetime.utcnow() - doc.get('last_updated', datetime.utcnow())
            if cache_age.days < GEO_CACHE_DAYS:
                results[ip] = {
                    'country': doc.get('country', 'Unknown'),
                    'city': doc.get('city', 'Unknown'),
                    'latitude': doc.get('latitude'),
                    'longitude': doc.get('longitude'),
                    'country_code': doc.get('country_code', '')
                }
            else:
                uncached_ips.append(ip)
        
        # Fetch uncached IPs (rate limit aware)
        for ip in uncached_ips[:10]:  # Limit to 10 per bulk request
            geo = get_ip_geolocation(ip, mongo_db)
            if geo:
                results[ip] = geo
            time.sleep(0.1)  # Rate limit protection
        
        return results
    
    except Exception as e:
        import sys
        import traceback
        sys.stderr.write(f"⚠ Bulk geolocation error: {e}\n{traceback.format_exc()}\n")
        return {}


def clear_expired_cache(mongo_db=None):
    """
    Clean up expired cache entries from MongoDB
    
    Args:
        mongo_db: MongoDB database instance (optional)
    
    Returns:
        Number of deleted entries
    """
    if mongo_db is None:
        try:
            from flask import current_app
            # Access mongo.db directly (Flask-PyMongo pattern)
            mongo_db = current_app.mongo.db
        except (RuntimeError, AttributeError) as e:
            import sys
            sys.stderr.write(f"⚠ Cannot access MongoDB in clear_expired_cache: {e}\n")
            return 0
    
    try:
        # Calculate cutoff dates
        geo_cutoff = datetime.utcnow() - timedelta(days=GEO_CACHE_DAYS * 2)
        rep_cutoff = datetime.utcnow() - timedelta(days=REP_CACHE_DAYS * 2)
        
        # Delete expired geolocation cache
        geo_result = mongo_db.ip_geolocation.delete_many({
            "last_updated": {"$lt": geo_cutoff}
        })
        
        # Delete expired reputation cache
        rep_result = mongo_db.ip_reputation.delete_many({
            "last_checked": {"$lt": rep_cutoff}
        })
        
        total_deleted = geo_result.deleted_count + rep_result.deleted_count
        
        if total_deleted > 0:
            print(f"✓ Cleared {total_deleted} expired cache entries")
        
        return total_deleted
    
    except Exception as e:
        import sys
        import traceback
        sys.stderr.write(f"⚠ Cache cleanup error: {e}\n{traceback.format_exc()}\n")
        return 0
