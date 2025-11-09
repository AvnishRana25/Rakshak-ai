import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ChatbotWidget from "./components/ChatbotWidget";
import Landing from "./pages/Landing";
import Service from "./pages/Service";
import Team from "./pages/Team";
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
        console.log(`Page loaded in ${pageLoadTime}ms`);
      });
    }
  }, []);

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-dark">
        <Navbar />
        <motion.main
          className="flex-grow"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/service" element={<Service />} />
            <Route path="/team" element={<Team />} />
            <Route path="/capabilities" element={<Capabilities />} />
            <Route path="/architecture" element={<Architecture />} />
            <Route path="/showcase" element={<Showcase />} />
            <Route path="/pcap-capture" element={<PcapCapture />} />
            <Route path="/threat-intelligence" element={<ThreatIntelligence />} />
          </Routes>
        </motion.main>
        <Footer />
        <ChatbotWidget />
      </div>
    </Router>
  );
}

export default App;
