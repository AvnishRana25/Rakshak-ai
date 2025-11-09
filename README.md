# Rakshak.ai - AI-Powered Network Security Platform

Rakshak.ai is a comprehensive network security monitoring and threat intelligence platform that combines packet capture, AI-powered analysis, and real-time threat detection.

## Features

- **Real-time Packet Capture**: Capture and analyze network traffic with customizable filters
- **AI-Powered Threat Intelligence**: Leverage Google Gemini AI for advanced threat analysis
- **Attack Detection**: Detect SQL injection, XSS, DDoS, and other attack patterns
- **Interactive Dashboard**: Modern web interface with real-time updates
- **Blocklist/Whitelist Management**: Automated IP blocking and whitelisting
- **Export Capabilities**: Export data in CSV, JSON, and PDF formats

## Tech Stack

**Backend:**
- Python 3.11+ (Flask)
- MongoDB (database)
- TShark/TCPDump (packet capture)
- Google Gemini AI

**Frontend:**
- React + Vite
- TailwindCSS
- Socket.IO (real-time updates)

## Quick Start with Docker

### Prerequisites
- Docker & Docker Compose
- MongoDB Atlas account (or local MongoDB)
- Google API key for Gemini (optional)

### Environment Setup

Create a `.env` file in the project root:

```bash
# MongoDB Configuration
MONGO_URI=your_mongodb_connection_string

# Security
SECRET_KEY=your_secret_key_here

# Google Gemini API (Optional)
GOOGLE_API_KEY=your_google_api_key

# Optional Configuration
AUTO_BLOCK_THRESHOLD=5
AUTO_BLOCK_WINDOW_HOURS=1
MAX_CAPTURE_DURATION=3600
```

### Run the Application

```bash
# Build and start
docker-compose up --build -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f web
```

Access the application at: **http://localhost:8000**

### Stop the Application

```bash
docker-compose down
```

## Project Structure

```
Rakshak.ai/
├── app.py                 # Main Flask application
├── models_mongodb.py      # MongoDB models
├── parser.py              # Log parser
├── detectors.py           # Attack detection logic
├── ip_services.py         # IP intelligence services
├── report_generator.py    # Report generation
├── gunicorn_config.py     # Production server config
├── config/                # Configuration modules
│   ├── gemini_config.py
│   └── pcap_config.py
├── services/              # Business logic
│   ├── gemini_service.py
│   └── pcap_service.py
├── routes/                # API routes
│   ├── gemini_routes.py
│   └── pcap_routes.py
├── utils/                 # Utility functions
│   ├── gemini_prompt_builder.py
│   └── pcap_utils.py
├── frontend/              # React frontend
│   └── src/
├── tests/                 # Test files
│   ├── test_service_page.py
│   ├── test_pcap_capture.py
│   ├── test_threat_intel.py
│   └── run_tests.py
├── samples/               # Sample data
├── uploads/               # Uploaded files
├── pcap_captures/         # Captured packets
└── static/                # Static files (built frontend)
```

## Testing

Run comprehensive test suite:

```bash
# Ensure the application is running first
python run_tests.py

# Or test individual components
python test_service_page.py
python test_pcap_capture.py
python test_threat_intel.py
```

## API Endpoints

### Service & Alerts
- `GET /health` - Health check
- `GET /api` - API information
- `POST /api/upload` - Upload log/PCAP files
- `GET /api/alerts` - Get alerts
- `GET /api/stats` - Get statistics
- `POST /api/blocklist` - Manage blocklist
- `POST /api/whitelist` - Manage whitelist

### PCAP Capture
- `GET /api/pcap/interfaces` - List network interfaces
- `POST /api/pcap/start` - Start packet capture
- `POST /api/pcap/stop/<id>` - Stop capture
- `GET /api/pcap/status` - Get capture status
- `GET /api/pcap/download/<id>` - Download PCAP file
- `DELETE /api/pcap/delete/<id>` - Delete capture

### Threat Intelligence
- `POST /api/gemini/analyze` - Analyze alert with AI
- `GET /api/gemini/analysis/<id>` - Get analysis result
- `GET /api/threat-intel/<ip>` - Get IP threat intelligence

## Security Features

- **Auto-blocking**: Automatically blocks IPs based on attack patterns
- **Rate limiting**: Prevents abuse
- **Input validation**: Sanitizes all user inputs
- **Secure packet capture**: Runs with minimal privileges
- **MongoDB Atlas**: Secure cloud database

## Performance

- Handles 10,000+ packets/second
- Real-time updates via WebSocket
- Optimized MongoDB queries with indexes
- Efficient packet capture with buffering controls

## License

Proprietary - All rights reserved

## Support

For issues and questions, please contact the development team.

