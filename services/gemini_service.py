"""
Gemini Threat Intelligence Service
Integrates Google Gemini API for threat analysis
"""
import json
import time
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import requests

from config.gemini_config import (
    GEMINI_API_KEY, GEMINI_MODEL, MAX_TOKENS, TEMPERATURE,
    CACHE_TTL, RATE_LIMIT_PER_MINUTE, MAX_RETRIES, RETRY_DELAY
)
from utils.gemini_prompt_builder import (
    build_threat_analysis_prompt, build_ip_reputation_prompt,
    build_mitigation_prompt, build_traffic_pattern_prompt
)


class GeminiThreatIntelligence:
    """Service for Gemini API threat intelligence"""
    
    def __init__(self, mongo_db, api_key=None):
        """
        Initialize Gemini service
        
        Args:
            mongo_db: MongoDB database instance
            api_key: Gemini API key (optional, uses config if not provided)
        """
        self.db = mongo_db
        self.threat_intel_collection = mongo_db.gemini_threat_intel
        self.api_key = api_key or GEMINI_API_KEY
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"
        self.last_request_time = 0
        self.request_count = 0
        self.request_window_start = time.time()
        
        if not self.api_key:
            sys.stderr.write("⚠ Warning: GEMINI_API_KEY not set. Gemini features will be disabled.\n")
    
    def _check_rate_limit(self):
        """Check and enforce rate limiting"""
        current_time = time.time()
        
        # Reset counter if window expired
        if current_time - self.request_window_start >= 60:
            self.request_count = 0
            self.request_window_start = current_time
        
        if self.request_count >= RATE_LIMIT_PER_MINUTE:
            sleep_time = 60 - (current_time - self.request_window_start)
            if sleep_time > 0:
                time.sleep(sleep_time)
                self.request_count = 0
                self.request_window_start = time.time()
        
        self.request_count += 1
    
    def _call_gemini_api(self, prompt, retry_count=0):
        """
        Call Gemini API with retry logic
        
        Args:
            prompt: Prompt text
            retry_count: Current retry attempt
            
        Returns:
            dict: API response
        """
        if not self.api_key:
            raise RuntimeError("Gemini API key not configured")
        
        self._check_rate_limit()
        
        url = f"{self.base_url}/models/{GEMINI_MODEL}:generateContent"
        headers = {
            "Content-Type": "application/json"
        }
        data = {
            "contents": [{
                "parts": [{
                    "text": prompt
                }]
            }],
            "generationConfig": {
                "temperature": TEMPERATURE,
                "maxOutputTokens": MAX_TOKENS
            }
        }
        
        try:
            response = requests.post(
                f"{url}?key={self.api_key}",
                headers=headers,
                json=data,
                timeout=30
            )
            response.raise_for_status()
            
            result = response.json()
            
            # Extract text from response
            if 'candidates' in result and len(result['candidates']) > 0:
                content = result['candidates'][0].get('content', {})
                parts = content.get('parts', [])
                if parts and 'text' in parts[0]:
                    return parts[0]['text']
            
            raise ValueError("Unexpected API response format")
        
        except requests.exceptions.RequestException as e:
            if retry_count < MAX_RETRIES:
                time.sleep(RETRY_DELAY * (2 ** retry_count))  # Exponential backoff
                return self._call_gemini_api(prompt, retry_count + 1)
            raise RuntimeError(f"Gemini API call failed after {MAX_RETRIES} retries: {str(e)}") from e
    
    def _parse_json_response(self, text_response):
        """Parse JSON from Gemini response"""
        try:
            # Try to extract JSON from response
            text = text_response.strip()
            
            # Find JSON object
            start_idx = text.find('{')
            end_idx = text.rfind('}') + 1
            
            if start_idx >= 0 and end_idx > start_idx:
                json_str = text[start_idx:end_idx]
                return json.loads(json_str)
            
            # If no JSON found, return as text
            return {"raw_response": text_response}
        
        except json.JSONDecodeError:
            # Return as text if JSON parsing fails
            return {"raw_response": text_response}
    
    def _get_cached_analysis(self, cache_key):
        """Get cached analysis if available"""
        cutoff = datetime.utcnow() - timedelta(seconds=CACHE_TTL)
        
        cached = self.threat_intel_collection.find_one({
            "cache_key": cache_key,
            "created_at": {"$gte": cutoff}
        })
        
        return cached
    
    def analyze_threat(self, alert_data):
        """
        Analyze threat using Gemini
        
        Args:
            alert_data: Alert data dictionary
            
        Returns:
            dict: Analysis results
        """
        import uuid
        
        # Check cache
        cache_key = f"alert_{alert_data.get('id') or alert_data.get('src_ip')}"
        cached = self._get_cached_analysis(cache_key)
        if cached:
            return cached.get('gemini_response', {})
        
        try:
            prompt = build_threat_analysis_prompt(alert_data)
            response_text = self._call_gemini_api(prompt)
            analysis = self._parse_json_response(response_text)
            
            # Determine threat level
            threat_level = analysis.get('threat_level', 'medium').lower()
            confidence = analysis.get('confidence_score', 50)
            
            # Create analysis document
            analysis_id = str(uuid.uuid4())
            from models_mongodb import GeminiThreatIntelDocument
            
            analysis_doc = GeminiThreatIntelDocument.create(
                analysis_id=analysis_id,
                alert_id=alert_data.get('id'),
                ip_address=alert_data.get('src_ip'),
                threat_level=threat_level,
                threat_type=alert_data.get('attack_type', ''),
                confidence_score=confidence,
                gemini_response=analysis,
                recommendations=analysis.get('mitigation_steps', [])
            )
            analysis_doc['cache_key'] = cache_key
            
            # Store in database
            self.threat_intel_collection.insert_one(analysis_doc)
            
            return analysis
        
        except Exception as e:
            sys.stderr.write(f"Error in Gemini threat analysis: {e}\n")
            # Return fallback response
            return {
                "threat_level": "medium",
                "threat_description": "Analysis unavailable",
                "error": str(e)
            }
    
    def enrich_ip_reputation(self, ip_address, context=None):
        """
        Get IP reputation from Gemini
        
        Args:
            ip_address: IP address
            context: Additional context
            
        Returns:
            dict: IP reputation analysis
        """
        # Check cache
        cache_key = f"ip_{ip_address}"
        cached = self._get_cached_analysis(cache_key)
        if cached:
            return cached.get('gemini_response', {})
        
        try:
            prompt = build_ip_reputation_prompt(ip_address, context)
            response_text = self._call_gemini_api(prompt)
            analysis = self._parse_json_response(response_text)
            
            # Store in database
            import uuid
            from models_mongodb import GeminiThreatIntelDocument
            
            analysis_id = str(uuid.uuid4())
            analysis_doc = GeminiThreatIntelDocument.create(
                analysis_id=analysis_id,
                ip_address=ip_address,
                threat_level=analysis.get('threat_level', 'medium'),
                confidence_score=analysis.get('confidence_score', 50),
                gemini_response=analysis,
                recommendations=[analysis.get('recommended_action', 'monitor')]
            )
            analysis_doc['cache_key'] = cache_key
            
            self.threat_intel_collection.insert_one(analysis_doc)
            
            return analysis
        
        except Exception as e:
            sys.stderr.write(f"Error in Gemini IP reputation: {e}\n")
            return {
                "threat_level": "medium",
                "reputation": "unknown",
                "error": str(e)
            }
    
    def analyze_traffic_pattern(self, traffic_data):
        """
        Analyze traffic patterns
        
        Args:
            traffic_data: Traffic data dictionary
            
        Returns:
            dict: Pattern analysis
        """
        try:
            prompt = build_traffic_pattern_prompt(traffic_data)
            response_text = self._call_gemini_api(prompt)
            return self._parse_json_response(response_text)
        
        except Exception as e:
            sys.stderr.write(f"Error in Gemini traffic analysis: {e}\n")
            return {"error": str(e)}
    
    def generate_mitigation_recommendations(self, threat_type, severity):
        """
        Generate mitigation recommendations
        
        Args:
            threat_type: Type of threat
            severity: Severity level
            
        Returns:
            dict: Mitigation steps
        """
        try:
            prompt = build_mitigation_prompt(threat_type, severity)
            response_text = self._call_gemini_api(prompt)
            return self._parse_json_response(response_text)
        
        except Exception as e:
            sys.stderr.write(f"Error in Gemini mitigation: {e}\n")
            return {"error": str(e)}
    
    def batch_analyze_alerts(self, alert_list):
        """
        Analyze multiple alerts in batch
        
        Args:
            alert_list: List of alert dictionaries
            
        Returns:
            list: List of analysis results
        """
        results = []
        for alert in alert_list:
            try:
                analysis = self.analyze_threat(alert)
                results.append({
                    "alert_id": alert.get('id'),
                    "analysis": analysis
                })
            except Exception as e:
                results.append({
                    "alert_id": alert.get('id'),
                    "error": str(e)
                })
        
        return results

