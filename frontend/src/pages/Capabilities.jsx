import { useState, useEffect, useRef } from 'react'
import { motion, useMotionValue } from 'framer-motion'
import { GeometricShapes, AnimatedGridLines, ConnectionLines, ParticleBackground } from '../components/GeometricBackground'

const Capabilities = () => {
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

  const capabilities = [
    {
      title: '💉 SQL Injection Detection',
      description: 'Detects database manipulation attempts and protects user data, passwords, and credit cards from theft.',
      icon: '🔒',
      attacks: ['SELECT', 'UNION', 'DROP TABLE', '--', ';--'],
      color: 'from-neon-purple to-neon-pink',
    },
    {
      title: '⚡ XSS (Cross-Site Scripting)',
      description: 'Identifies malicious script injections to prevent account hijacking and data theft.',
      icon: '🛡️',
      attacks: ['<script>', 'javascript:', 'onerror=', 'eval('],
      color: 'from-neon-pink to-neon-cyan',
    },
    {
      title: '📂 Directory Traversal',
      description: 'Catches unauthorized file access attempts and blocks access to system files.',
      icon: '🚫',
      attacks: ['../', '..\\', '/etc/passwd', 'C:\\'],
      color: 'from-neon-cyan to-neon-purple',
    },
    {
      title: '💻 Command Injection',
      description: 'Detects attempts to run system commands and prevents server takeover.',
      icon: '⚡',
      attacks: ['; ls', '| cat', '`whoami`', '$(id)'],
      color: 'from-neon-purple to-neon-pink',
    },
    {
      title: '🌐 SSRF (Server-Side Request Forgery)',
      description: 'Identifies server-side request forgery attempts to protect internal network resources.',
      icon: '🔍',
      attacks: ['http://localhost', 'file://', 'gopher://', '127.0.0.1'],
      color: 'from-neon-pink to-neon-cyan',
    },
    {
      title: '📝 RFI/LFI (Remote/Local File Inclusion)',
      description: 'Detects remote/local file inclusion attempts to stop malicious file execution.',
      icon: '📁',
      attacks: ['include=', 'require=', 'php://', 'data://'],
      color: 'from-neon-cyan to-neon-purple',
    },
    {
      title: '🔐 Credential Stuffing',
      description: 'Catches brute-force login attempts to prevent account compromise.',
      icon: '🔑',
      attacks: ['Multiple failed logins', 'Common passwords', 'Dictionary attacks'],
      color: 'from-neon-purple to-neon-pink',
    },
    {
      title: '🔖 XXE Injection',
      description: 'Identifies XML external entity attacks to protect sensitive file disclosure.',
      icon: '📄',
      attacks: ['<!ENTITY', 'SYSTEM', 'file://', 'expect://'],
      color: 'from-neon-pink to-neon-cyan',
    },
    {
      title: '🐚 Webshell Detection',
      description: 'Finds backdoor upload attempts to prevent persistent server access.',
      icon: '🐚',
      attacks: ['eval(', 'base64_decode', 'system(', 'exec('],
      color: 'from-neon-cyan to-neon-purple',
    },
  ]

  const CapabilityCard = ({ cap, index }) => {
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
        whileHover={{ z: 50 }}
      >
        {/* Subtle gradient background effect */}
        <div className={`absolute inset-0 bg-gradient-to-br ${cap.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
        
        {/* Geometric corner accents */}
        <div className="absolute top-0 right-0 w-16 h-16">
          <div className={`absolute top-0 right-0 w-0 h-0 border-t-[16px] border-t-transparent border-r-[16px] border-r-${cap.color.split(' ')[1]}/20 group-hover:border-r-${cap.color.split(' ')[1]}/30 transition-colors duration-300`} />
        </div>
        <div className="absolute bottom-0 left-0 w-16 h-16">
          <div className={`absolute bottom-0 left-0 w-0 h-0 border-b-[16px] border-b-transparent border-l-[16px] border-l-${cap.color.split(' ')[3]}/20 group-hover:border-l-${cap.color.split(' ')[3]}/30 transition-colors duration-300`} />
        </div>
        
        {/* Bottom border animation */}
        <motion.div
          className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${cap.color}`}
          initial={{ width: 0 }}
          whileInView={{ width: '100%' }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 + 0.3, duration: 0.8 }}
        />
        
        {/* Animated icon */}
        <motion.div
          className="text-6xl mb-4 relative z-10"
          animate={{ 
            rotate: [0, 5, -5, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ 
            duration: 6,
            repeat: Infinity,
            delay: index * 0.2,
          }}
        >
          {cap.icon}
        </motion.div>
        
        <h3 className="text-2xl font-semibold font-display text-white mb-4 relative z-10 hologram-text">
          {cap.title}
        </h3>
        <p className="text-white/70 mb-6 leading-relaxed relative z-10">{cap.description}</p>
        
        <div className="mt-6 pt-6 border-t border-neon-purple/20 relative z-10">
          <motion.p
            className="text-xs text-neon-purple mb-3 font-semibold uppercase tracking-wider"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 + 0.3 }}
          >
            Detected Patterns:
          </motion.p>
          <div className="flex flex-wrap gap-2">
            {cap.attacks.slice(0, 3).map((attack, i) => (
              <motion.span
                key={attack}
                className={`bg-gradient-to-r ${cap.color}/20 border border-neon-purple/30 text-neon-purple px-3 py-1.5 rounded-lg text-xs font-mono font-semibold`}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 + 0.4 + i * 0.1 }}
                whileHover={{ scale: 1.1, borderColor: 'rgba(131, 56, 236, 0.6)' }}
              >
                {attack}
              </motion.span>
            ))}
          </div>
        </div>
        
        {/* Animated border */}
        <div className={`absolute inset-0 border-2 border-transparent group-hover:border-gradient-to-r ${cap.color} rounded-2xl transition-all duration-500`} />
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-20 bg-gradient-to-b from-dark via-dark-lighter to-dark relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <motion.div
          className="absolute top-20 left-1/4 w-[400px] h-[400px] rounded-full blur-3xl opacity-10"
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
          className="absolute bottom-20 right-1/4 w-[350px] h-[350px] rounded-full blur-3xl opacity-10"
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
        <AnimatedGridLines />
        <ConnectionLines />
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
            <span className="text-white">Detection </span>
            <span className="gradient-text-purple hologram-text">Capabilities</span>
          </motion.h1>
          <motion.p
            className="text-white/70 text-lg max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            Comprehensive protection against the most common web application vulnerabilities
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {capabilities.map((cap, index) => (
            <CapabilityCard key={cap.title} cap={cap} index={index} />
          ))}
        </div>

        {/* Enhanced Stats Section */}
        <motion.div
          className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
        >
          {[
            { label: 'Attack Types Detected', value: '10+', icon: '🎯', color: 'from-neon-purple to-neon-pink' },
            { label: 'Detection Accuracy', value: '99%', icon: '📊', color: 'from-neon-pink to-neon-cyan' },
            { label: 'Instant Alerts', value: 'Real-time', icon: '⚡', color: 'from-neon-cyan to-neon-purple' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              className="card-matrix card-glow stat-card text-center group relative overflow-hidden"
              initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
              whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.6, ease: "easeOut" }}
              whileHover={{ scale: 1.08, y: -8, rotateY: 5 }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <motion.div
                className="text-6xl mb-4 relative z-10"
                animate={{ 
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{ 
                  duration: 6,
                  repeat: Infinity,
                  delay: index * 0.2,
                }}
              >
                {stat.icon}
              </motion.div>
              <div className={`text-5xl font-bold font-display mb-3 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                {stat.value}
              </div>
              <div className="text-white/70 font-medium">{stat.label}</div>
              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-10 h-10">
                <div className={`absolute top-0 right-0 w-0 h-0 border-t-[10px] border-t-transparent border-r-[10px] border-r-${stat.color.split(' ')[1]}/20`} />
              </div>
              
              {/* Bottom border animation */}
              <motion.div
                className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${stat.color}`}
                initial={{ width: 0 }}
                whileInView={{ width: '100%' }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 + 0.3, duration: 0.8 }}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

export default Capabilities
