"""
Gemini Prompt Builder
Builds structured prompts for Gemini API
"""
from datetime import datetime


def build_threat_analysis_prompt(alert_data):
    """
    Build prompt for threat analysis
    
    Args:
        alert_data: Alert data dictionary
        
    Returns:
        str: Formatted prompt
    """
    prompt = f"""Analyze this cybersecurity threat alert and provide a comprehensive threat intelligence assessment.

ALERT DETAILS:
- Attack Type: {alert_data.get('attack_type', 'Unknown')}
- Source IP: {alert_data.get('src_ip', 'Unknown')}
- Destination IP: {alert_data.get('dst_ip', 'Unknown')}
- URL: {alert_data.get('url', 'N/A')}
- HTTP Method: {alert_data.get('http_method', 'N/A')}
- User Agent: {alert_data.get('user_agent', 'N/A')}
- Confidence Score: {alert_data.get('confidence', 0)}%
- Timestamp: {alert_data.get('timestamp', 'Unknown')}
- Raw Request: {alert_data.get('raw', 'N/A')[:500]}

Please provide:
1. Threat Level Assessment (low/medium/high/critical)
2. Detailed Threat Description
3. Indicators of Compromise (IOCs)
4. Mitigation Recommendations (step-by-step)
5. Related Threat Patterns
6. Risk Assessment Summary
7. Confidence Score (0-100) for your analysis

Format your response as JSON with the following structure:
{{
    "threat_level": "critical|high|medium|low",
    "threat_description": "detailed description",
    "indicators_of_compromise": ["IOC1", "IOC2"],
    "mitigation_steps": ["Step 1", "Step 2"],
    "related_threats": ["threat1", "threat2"],
    "risk_assessment": "risk summary",
    "confidence_score": 85
}}
"""
    return prompt


def build_ip_reputation_prompt(ip_address, context=None):
    """
    Build prompt for IP reputation analysis
    
    Args:
        ip_address: IP address to analyze
        context: Additional context (alerts, history, etc.)
        
    Returns:
        str: Formatted prompt
    """
    context_str = ""
    if context:
        context_str = f"""
CONTEXT:
- Alert Count: {context.get('alert_count', 0)}
- Attack Types: {', '.join(context.get('attack_types', []))}
- First Seen: {context.get('first_seen', 'Unknown')}
- Last Seen: {context.get('last_seen', 'Unknown')}
"""
    
    prompt = f"""Analyze the reputation and threat level of this IP address: {ip_address}
{context_str}

Please provide:
1. Threat Level (low/medium/high/critical)
2. IP Reputation Assessment
3. Known Threat History
4. Geographic Risk Factors
5. Recommended Actions (whitelist/monitor/block)
6. Confidence Score (0-100)

Format your response as JSON:
{{
    "threat_level": "high",
    "reputation": "malicious|suspicious|neutral|trusted",
    "threat_history": "description",
    "geographic_risk": "risk factors",
    "recommended_action": "block|monitor|whitelist",
    "confidence_score": 80
}}
"""
    return prompt


def build_mitigation_prompt(threat_type, severity):
    """
    Build prompt for mitigation recommendations
    
    Args:
        threat_type: Type of threat
        severity: Severity level
        
    Returns:
        str: Formatted prompt
    """
    prompt = f"""Provide detailed mitigation steps for a {severity} severity {threat_type} attack.

Please provide:
1. Immediate Response Steps (first 5 minutes)
2. Short-term Mitigation (next hour)
3. Long-term Prevention (ongoing)
4. Monitoring Recommendations
5. Recovery Steps

Format as JSON:
{{
    "immediate_steps": ["step1", "step2"],
    "short_term_steps": ["step1", "step2"],
    "long_term_steps": ["step1", "step2"],
    "monitoring": ["monitor1", "monitor2"],
    "recovery": ["recovery1", "recovery2"]
}}
"""
    return prompt


def build_traffic_pattern_prompt(traffic_data):
    """
    Build prompt for traffic pattern analysis
    
    Args:
        traffic_data: Traffic data dictionary
        
    Returns:
        str: Formatted prompt
    """
    prompt = f"""Analyze this network traffic pattern for suspicious activity.

TRAFFIC DATA:
- Source IPs: {traffic_data.get('source_ips', [])}
- Destination IPs: {traffic_data.get('dest_ips', [])}
- Ports: {traffic_data.get('ports', [])}
- Protocols: {traffic_data.get('protocols', [])}
- Packet Count: {traffic_data.get('packet_count', 0)}
- Time Window: {traffic_data.get('time_window', 'Unknown')}

Provide analysis of:
1. Suspicious Patterns
2. Anomaly Detection
3. Potential Attack Vectors
4. Recommendations

Format as JSON with structured analysis.
"""
    return prompt

