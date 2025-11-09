import os

# Server socket
bind = f"0.0.0.0:{os.getenv('PORT', 8000)}"
backlog = 2048

# Worker processes
workers = int(os.getenv('GUNICORN_WORKERS', 4))
worker_class = 'eventlet'  # Required for SocketIO
worker_connections = 1000
timeout = 30
keepalive = 2

# Logging
accesslog = '-'  # Log to stdout
errorlog = '-'   # Log to stderr
loglevel = 'info'

# Process naming
proc_name = 'rakshak-ai'

# Server mechanics
daemon = False
pidfile = None