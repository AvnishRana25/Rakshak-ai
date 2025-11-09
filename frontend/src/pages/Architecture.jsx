import { useState, useEffect, useRef } from 'react'
import { motion, useMotionValue } from 'framer-motion'
import { GeometricShapes, ParticleBackground } from '../components/GeometricBackground'

const Architecture = () => {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

  const components = [
    {
      title: 'File Upload & Parser',
      description: 'Accepts PCAP files and access logs, then parses them to extract HTTP requests and network traffic data.',
      icon: '📤',
      color: 'from-neon-purple to-neon-pink',
    },
    {
      title: 'Detection Engine',
      description: 'Multiple specialized detectors analyze each request for known attack patterns and signatures.',
      icon: '🔍',
      color: 'from-neon-pink to-neon-cyan',
    },
    {
      title: 'Confidence Scoring',
      description: 'Each detection is assigned a confidence score (0-100%) based on pattern matching and heuristics.',
      icon: '📊',
      color: 'from-neon-cyan to-neon-purple',
    },
    {
      title: 'Alert Database',
      description: 'SQLite database stores all detected threats with metadata for historical analysis.',
      icon: '💾',
      color: 'from-neon-purple to-neon-pink',
    },
    {
      title: 'Real-time Dashboard',
      description: 'React-based interface displays alerts with filtering, search, and export capabilities.',
      icon: '🖥️',
      color: 'from-neon-pink to-neon-cyan',
    },
    {
      title: 'Export System',
      description: 'Generate CSV or JSON reports for integration with SIEM tools and compliance documentation.',
      icon: '📥',
      color: 'from-neon-cyan to-neon-purple',
    },
  ]

  const flow = [
    { step: 1, title: 'Upload File', desc: 'User uploads PCAP or log file', icon: '📤' },
    { step: 2, title: 'Parse Data', desc: 'Extract HTTP requests and metadata', icon: '🔧' },
    { step: 3, title: 'Run Detectors', desc: 'Analyze each request for threats', icon: '🔍' },
    { step: 4, title: 'Store Alerts', desc: 'Save detections to database', icon: '💾' },
    { step: 5, title: 'Display Results', desc: 'Show alerts in dashboard', icon: '📊' },
  ]

  const ComponentCard = ({ comp, index }) => {
    const cardRef = useRef(null)

    useEffect(() => {
      const handleMouseMove = (e) => {
        if (!cardRef.current) return
        const rect = cardRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        
        const centerX = rect.width / 2
        const centerY = rect.height / 2
        
        const rotateX = (y - centerY) / 15
        const rotateY = (centerX - x) / 15
        
        cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`
      }
      
      const card = cardRef.current
      if (card) {
        card.addEventListener('mousemove', handleMouseMove)
        card.addEventListener('mouseleave', () => {
          card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)'
        })
      }
      
      return () => {
        if (card) {
          card.removeEventListener('mousemove', handleMouseMove)
        }
      }
    }, [])

    return (
      <motion.div
        ref={cardRef}
        className="card-matrix card-glow group relative overflow-hidden"
        initial={{ opacity: 0, y: 50, rotateX: -15 }}
        whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ delay: index * 0.1, duration: 0.8, ease: "easeOut" }}
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${comp.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
        
        {/* Geometric corner accents */}
        <div className="absolute top-0 right-0 w-16 h-16">
          <div className={`absolute top-0 right-0 w-0 h-0 border-t-[16px] border-t-transparent border-r-[16px] border-r-${comp.color.split(' ')[1]}/20 group-hover:border-r-${comp.color.split(' ')[1]}/30 transition-colors duration-300`} />
        </div>
        
        {/* Bottom border animation */}
        <motion.div
          className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${comp.color}`}
          initial={{ width: 0 }}
          whileInView={{ width: '100%' }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 + 0.3, duration: 0.8 }}
        />
        
        <div className="text-6xl mb-6 relative z-10">
          {comp.icon}
        </div>
        <h3 className="text-2xl font-semibold font-display text-white mb-4 relative z-10 hologram-text">{comp.title}</h3>
        <p className="text-white/70 leading-relaxed relative z-10">{comp.description}</p>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-20 bg-gradient-to-b from-dark via-dark-lighter to-dark relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <motion.div
          className="absolute top-20 right-1/4 w-[400px] h-[400px] rounded-full blur-3xl opacity-10"
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
          className="absolute bottom-20 left-1/4 w-[350px] h-[350px] rounded-full blur-3xl opacity-10"
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
        <ParticleBackground count={25} />
        <div className="absolute inset-0 bg-gradient-to-b from-dark/90 via-dark/95 to-dark" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="flex items-center justify-center gap-4 mb-8"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="logo-container">
              <motion.img
                src="/Logo.png"
                alt="URL Attack Detector Logo"
                className="h-16 w-16 sm:h-20 sm:w-20 object-contain"
                whileHover={{ scale: 1.1, rotate: 360 }}
                transition={{ duration: 0.6 }}
              />
            </div>
            <div className="h-20 w-px bg-gradient-to-b from-transparent via-neon-purple to-transparent opacity-50"></div>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl font-bold mb-6 text-center font-display"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <span className="text-white">System </span>
            <span className="gradient-text-purple hologram-text">Architecture</span>
          </motion.h1>
          <motion.p
            className="text-white/70 text-lg max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            Understanding how our detection system works under the hood
          </motion.p>
        </motion.div>

        {/* Components */}
        <div className="mb-32">
          <motion.h2
            className="text-4xl font-semibold font-display text-white mb-16 text-center hologram-text"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            Core Components
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {components.map((comp, index) => (
              <ComponentCard key={comp.title} comp={comp} index={index} />
            ))}
          </div>
        </div>

        {/* Enhanced Flow */}
        <div className="mb-32">
          <motion.h2
            className="text-4xl font-semibold font-display text-white mb-16 text-center hologram-text"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            Processing Flow
          </motion.h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 flex-wrap">
            {flow.map((item, index) => (
              <div key={item.step} className="flex items-center">
                <motion.div
                  className="card-matrix card-glow text-center min-w-[220px] group relative overflow-hidden"
                  initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
                  whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2, duration: 0.6, ease: "easeOut" }}
                  whileHover={{ scale: 1.08, y: -8 }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/10 to-neon-pink/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <motion.div
                    className="w-20 h-20 bg-gradient-to-br from-neon-purple/20 to-neon-pink/20 border-2 border-neon-purple/40 rounded-full flex items-center justify-center text-white font-bold font-display text-3xl mb-4 mx-auto relative z-10"
                    animate={{ 
                      rotate: [0, 360],
                    }}
                    transition={{ 
                      rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                    }}
                  >
                    {item.step}
                  </motion.div>
                  
                  <div className="text-6xl mb-4 relative z-10">
                    {item.icon}
                  </div>
                  
                  <h3 className="text-xl font-semibold font-display text-white mb-2 relative z-10 hologram-text">{item.title}</h3>
                  <p className="text-sm text-white/70 relative z-10">{item.desc}</p>
                </motion.div>
                {index < flow.length - 1 && (
                  <motion.div
                    className="hidden md:block text-neon-purple text-4xl mx-6"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    animate={{ x: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                  >
                    →
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Tech Stack */}
        <motion.div
          className="card-matrix card-glow"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <motion.h2
            className="text-4xl font-semibold font-display text-white mb-10 text-center hologram-text"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Technology Stack
          </motion.h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'Python', color: 'from-yellow-500 to-orange-500' },
              { name: 'Flask', color: 'from-gray-300 to-gray-500' },
              { name: 'React', color: 'from-cyan-400 to-blue-500' },
              { name: 'Tailwind CSS', color: 'from-teal-400 to-cyan-500' },
              { name: 'SQLAlchemy', color: 'from-gray-600 to-gray-800' },
              { name: 'PyShark', color: 'from-blue-500 to-indigo-600' },
              { name: 'Docker', color: 'from-blue-400 to-cyan-500' },
              { name: 'Vite', color: 'from-purple-500 to-pink-500' },
            ].map((tech, index) => (
              <motion.div
                key={tech.name}
                className={`bg-gradient-to-r ${tech.color}/15 border border-neon-purple/20 text-white px-6 py-5 rounded-xl text-center font-semibold font-display hover:border-neon-purple/40 transition-all duration-300 relative overflow-hidden group`}
                initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
                whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5, ease: "easeOut" }}
                whileHover={{ scale: 1.1, y: -5, rotateY: 5 }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${tech.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                
                {/* Corner accent */}
                <div className="absolute top-0 right-0 w-8 h-8">
                  <div className={`absolute top-0 right-0 w-0 h-0 border-t-[8px] border-t-transparent border-r-[8px] border-r-${tech.color.split(' ')[1]}/20`} />
                </div>
                <span className="relative z-10">{tech.name}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Architecture
