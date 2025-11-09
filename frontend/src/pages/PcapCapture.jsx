import { motion } from 'framer-motion';
import PcapControlPanel from '../components/PcapCapture/PcapControlPanel';
import PcapCaptureList from '../components/PcapCapture/PcapCaptureList';

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

const PcapCapture = () => {
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
                rotate: [0, 360],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <span className="text-6xl">📡</span>
            </motion.div>
          </motion.div>
          
          <motion.h1 
            className="text-5xl md:text-7xl font-bold mb-6 font-display"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <span className="text-white">PCAP </span>
            <span className="gradient-text-purple">Network Capture</span>
          </motion.h1>
          
          <motion.p 
            className="text-white/70 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            Capture and analyze network traffic in real-time with{' '}
            <span className="text-neon-purple">advanced threat detection</span> and{' '}
            <span className="text-neon-cyan">comprehensive insights</span>
          </motion.p>

          {/* Status Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full glass border border-neon-cyan/30 mt-6"
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
              REAL-TIME PACKET ANALYSIS
            </span>
          </motion.div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <PcapControlPanel />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <PcapCaptureList />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PcapCapture;

