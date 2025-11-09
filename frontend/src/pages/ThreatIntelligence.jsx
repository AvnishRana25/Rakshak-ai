import { useState } from 'react';
import { motion } from 'framer-motion';
import { geminiService } from '../services/geminiService';
import { useToast } from '../hooks/useToast';
import GeminiAnalysisPanel from '../components/ThreatIntelligence/GeminiAnalysisPanel';
import Toast from '../components/Toast';

const GeometricShapes = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`triangle-${i}`}
          className="absolute"
          style={{
            left: `${15 + i * 15}%`,
            top: `${20 + (i % 3) * 30}%`,
            width: '60px',
            height: '60px',
            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
            background: i % 2 === 0 
              ? 'linear-gradient(135deg, rgba(131, 56, 236, 0.3), rgba(255, 0, 110, 0.3))'
              : 'linear-gradient(135deg, rgba(0, 245, 255, 0.3), rgba(131, 56, 236, 0.3))',
          }}
          animate={{
            rotate: [0, 360],
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}

const ParticleBackground = () => {
  const particles = Array.from({ length: 30 })
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: i % 3 === 0 
              ? 'rgba(131, 56, 236, 0.4)' 
              : i % 3 === 1 
              ? 'rgba(255, 0, 110, 0.4)' 
              : 'rgba(0, 245, 255, 0.4)',
          }}
          animate={{
            y: [0, -80, 0],
            x: [0, Math.random() * 30 - 15, 0],
            opacity: [0.1, 0.5, 0.1],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 5 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}

const ThreatIntelligence = () => {
  const [ipAddress, setIpAddress] = useState('');
  const [threatIntel, setThreatIntel] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const { toasts, removeToast, error: showError } = useToast();

  // Validate IP address format
  const validateIP = (ip) => {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
    
    if (!ip || !ip.trim()) {
      return { valid: false, error: 'Please enter an IP address' };
    }
    
    const trimmedIP = ip.trim();
    
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
    <div className="min-h-screen relative overflow-hidden pt-24 pb-20">
      {/* Enhanced Background Effects */}
      <div className="fixed inset-0 z-0">
        <motion.div
          className="absolute top-20 left-1/4 w-[500px] h-[500px] rounded-full blur-3xl opacity-15"
          style={{
            background: 'radial-gradient(circle, rgba(131, 56, 236, 0.3) 0%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-1/4 w-[400px] h-[400px] rounded-full blur-3xl opacity-15"
          style={{
            background: 'radial-gradient(circle, rgba(255, 0, 110, 0.3) 0%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <GeometricShapes />
        <ParticleBackground />
        <div className="absolute inset-0 bg-gradient-to-b from-dark/85 via-dark/90 to-dark" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            className="flex items-center justify-center gap-4 mb-6"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <span className="text-6xl">🤖</span>
            </motion.div>
          </motion.div>
          
          <motion.h1 
            className="text-5xl md:text-7xl font-bold mb-6 font-display"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <span className="text-white">Threat </span>
            <span className="gradient-text-purple">Intelligence</span>
          </motion.h1>
          
          <motion.p 
            className="text-white/70 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            AI-powered threat analysis with{' '}
            <span className="text-neon-purple">Google Gemini</span> for{' '}
            <span className="text-neon-cyan">advanced security insights</span> and real-time IP reputation scoring
          </motion.p>

          {/* Status Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full glass border border-neon-purple/30 mt-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            <motion.span
              className="w-2 h-2 rounded-full bg-green-500"
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-xs uppercase tracking-wider text-white/80 font-semibold">
              AI-POWERED ANALYSIS
            </span>
          </motion.div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="card-matrix"
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">🔍</span>
              <h2 className="text-3xl font-bold font-display text-white">IP Threat Analysis</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-white/80 mb-3 font-medium">IP Address</label>
                <input
                  type="text"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
                  placeholder="e.g., 192.168.1.1 or 2001:0db8::1"
                  className="w-full glass text-white border border-neon-purple/30 rounded-xl px-6 py-4 focus:border-neon-purple focus:outline-none transition-all duration-300 placeholder:text-white/40"
                />
              </div>
              
              <motion.button
                onClick={handleAnalyze}
                disabled={loading || !ipAddress.trim()}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full btn-primary py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <motion.div
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>Analyze IP Address</span>
                  </>
                )}
              </motion.button>
            </div>

            {threatIntel && (
              <motion.div 
                className="mt-8 space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="glass border border-neon-cyan/30 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">🛡️</span>
                    <span className="text-white/70 font-medium">Reputation Score</span>
                  </div>
                  <span className="text-2xl font-bold gradient-text-purple">
                    {threatIntel.ip_reputation || 'Unknown'}
                  </span>
                </div>
                {threatIntel.recommendations && (
                  <div className="glass border border-neon-pink/30 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">💡</span>
                      <span className="text-white/70 font-medium">Recommendation</span>
                    </div>
                    <span className="text-white font-semibold">
                      {threatIntel.recommendations}
                    </span>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            {ipAddress ? (
              <GeminiAnalysisPanel ipAddress={ipAddress} />
            ) : (
              <div className="card-matrix h-full flex flex-col items-center justify-center text-center">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="text-7xl mb-6"
                >
                  🔮
                </motion.div>
                <h3 className="text-2xl font-bold text-white mb-4 font-display">Enter an IP Address</h3>
                <p className="text-white/60 max-w-md">
                  Enter an IP address to get comprehensive threat intelligence analysis powered by Google Gemini AI
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
      
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default ThreatIntelligence;

