import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ChatbotWidget from "./components/ChatbotWidget";
import ErrorBoundary from "./components/ErrorBoundary";
import Landing from "./pages/Landing";
import Service from "./pages/Service";
import Capabilities from "./pages/Capabilities";
import Architecture from "./pages/Architecture";
import Showcase from "./pages/Showcase";
import PcapCapture from "./pages/PcapCapture";
import ThreatIntelligence from "./pages/ThreatIntelligence";

function App() {
  // Add performance monitoring
  useEffect(() => {
    // Log page load performance
    if ("performance" in window && "timing" in window.performance) {
      window.addEventListener("load", () => {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        if (process.env.NODE_ENV === 'development') {
          console.log(`⚡ Page loaded in ${pageLoadTime}ms`);
        }
      });
    }

    // Detect reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      document.documentElement.classList.add('reduce-motion');
    }

    // Clean up on unmount
    return () => {
      // Cleanup if needed
    };
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen flex flex-col bg-dark">
          <Navbar />
          <motion.main
            className="flex-grow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/service" element={<Service />} />
                <Route path="/capabilities" element={<Capabilities />} />
                <Route path="/architecture" element={<Architecture />} />
                <Route path="/showcase" element={<Showcase />} />
                <Route path="/pcap-capture" element={<PcapCapture />} />
                <Route path="/threat-intelligence" element={<ThreatIntelligence />} />
                {/* 404 catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ErrorBoundary>
          </motion.main>
          <Footer />
          <ChatbotWidget />
        </div>
      </Router>
    </ErrorBoundary>
  );
}

// 404 Not Found Page
const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-dark via-dark-lighter to-dark flex items-center justify-center p-4 pt-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl w-full text-center"
      >
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="text-9xl mb-6"
        >
          🔍
        </motion.div>

        <h1 className="text-6xl font-bold text-white mb-4 font-display">
          404
        </h1>
        
        <h2 className="text-3xl font-semibold gradient-text-purple mb-6">
          Page Not Found
        </h2>

        <p className="text-white/70 text-lg mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <motion.a
            href="/"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="btn-primary py-3 px-8 inline-flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Go Home</span>
          </motion.a>
          
          <motion.button
            onClick={() => window.history.back()}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="btn-outline py-3 px-8 inline-flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Go Back</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default App;
