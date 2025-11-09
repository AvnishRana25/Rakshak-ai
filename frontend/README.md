# URL Attack Detector - Frontend

React + Tailwind CSS frontend for the URL Attack Detector application.

## Development

### Prerequisites
- Node.js 18+ and npm

### Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:3000` with proxy to backend API at `http://localhost:5000`.

## Building for Production

```bash
npm run build
```

This will create a `dist` folder with the production build. The Docker build process will automatically copy this to the Flask static folder.

## Features

- **React Router** for navigation
- **Tailwind CSS** for styling (HackCBS-inspired dark theme)
- **Framer Motion** for smooth animations
- **Axios** for API calls
- **Responsive design** for mobile and desktop
- **SEO optimized** with meta tags
- **Accessible** with high contrast colors


