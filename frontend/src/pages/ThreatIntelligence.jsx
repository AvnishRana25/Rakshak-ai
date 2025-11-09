import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { geminiService } from '../services/geminiService';
import { useToast } from '../hooks/useToast';
import GeminiAnalysisPanel from '../components/ThreatIntelligence/GeminiAnalysisPanel';
import Toast from '../components/Toast';

const ThreatIntelligence = () => {
  const [ipAddress, setIpAddress] = useState('');
  const [threatIntel, setThreatIntel] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const { toasts, removeToast, error: showError } = useToast();

  // Validate IP address format
  const validateIP = (ip) => {
    // IPv4 regex
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    // IPv6 regex (simplified)
    const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
    
    if (!ip || !ip.trim()) {
      return { valid: false, error: 'Please enter an IP address' };
    }
    
    const trimmedIP = ip.trim();
    
    // Check IPv4
    if (ipv4Regex.test(trimmedIP)) {
      const parts = trimmedIP.split('.');
      for (const part of parts) {
        const num = parseInt(part, 10);
        if (num < 0 || num > 255) {
          return { valid: false, error: 'Invalid IP address format' };
        }
      }
      return { valid: true };
    }
    
    // Check IPv6 (basic validation)
    if (ipv6Regex.test(trimmedIP) || trimmedIP.includes('::')) {
      return { valid: true };
    }
    
    return { valid: false, error: 'Invalid IP address format. Please enter a valid IPv4 or IPv6 address' };
  };

  const handleAnalyze = async () => {
    const validation = validateIP(ipAddress);
    if (!validation.valid) {
      showError('Invalid Input', validation.error);
      return;
    }

    try {
      setLoading(true);
      const data = await geminiService.getThreatIntel(ipAddress.trim());
      setThreatIntel(data);
    } catch (err) {
      showError('Analysis Failed', err.message || 'Failed to analyze IP address. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-neon-cyan mb-2">Threat Intelligence</h1>
          <p className="text-gray-400 mb-8">
            AI-powered threat analysis using Google Gemini
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gray-900 rounded-lg p-6 shadow-lg"
          >
            <h2 className="text-2xl font-bold text-neon-cyan mb-6">IP Threat Analysis</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">IP Address</label>
                <input
                  type="text"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  placeholder="e.g., 192.168.1.1"
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded px-4 py-2 focus:border-neon-cyan focus:outline-none"
                />
              </div>
              
              <button
                onClick={handleAnalyze}
                disabled={loading || !ipAddress.trim()}
                className="w-full bg-neon-cyan hover:bg-neon-purple text-white font-semibold py-3 rounded transition-colors disabled:opacity-50"
              >
                {loading ? 'Analyzing...' : 'Analyze IP'}
              </button>
            </div>

            {threatIntel && (
              <div className="mt-6 space-y-4">
                <div>
                  <span className="text-gray-400">Reputation: </span>
                  <span className="text-neon-cyan font-semibold">
                    {threatIntel.ip_reputation || 'Unknown'}
                  </span>
                </div>
                {threatIntel.recommendations && (
                  <div>
                    <span className="text-gray-400">Recommendation: </span>
                    <span className="text-yellow-400 font-semibold">
                      {threatIntel.recommendations}
                    </span>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {ipAddress && (
              <GeminiAnalysisPanel ipAddress={ipAddress} />
            )}
          </motion.div>
        </div>
      </div>
      
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default ThreatIntelligence;

