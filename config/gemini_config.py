"""
Gemini API Configuration
"""
import os

# Gemini API Configuration - Support both GOOGLE_API_KEY and GEMINI_API_KEY
GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY") or ""
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-pro")
MAX_TOKENS = int(os.getenv("GEMINI_MAX_TOKENS", "2048"))
TEMPERATURE = float(os.getenv("GEMINI_TEMPERATURE", "0.3"))

# Caching Configuration
CACHE_TTL = int(os.getenv("GEMINI_CACHE_TTL", "3600"))  # 1 hour in seconds

# Rate Limiting
RATE_LIMIT_PER_MINUTE = int(os.getenv("GEMINI_RATE_LIMIT_PER_MINUTE", "60"))

# Retry Configuration
MAX_RETRIES = int(os.getenv("GEMINI_MAX_RETRIES", "3"))
RETRY_DELAY = float(os.getenv("GEMINI_RETRY_DELAY", "1.0"))  # seconds

