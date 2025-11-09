import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion'
import { Link } from 'react-router-dom'

// Animated Counter Component
const AnimatedCounter = ({ value, duration = 2000, suffix = '' }) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime = null
    const endValue = parseFloat(value) || 0

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      setCount(Math.floor(easeOutQuart * endValue))

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setCount(endValue)
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration])

  return <span>{count}{suffix}</span>
}

// Geometric Shapes Component
const GeometricShapes = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
      {/* Animated Triangles */}
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
      
      {/* Animated Hexagons */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={`hex-${i}`}
          className="absolute"
          style={{
            right: `${10 + i * 20}%`,
            bottom: `${15 + (i % 2) * 25}%`,
            width: '80px',
            height: '80px',
            clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
            border: '2px solid rgba(131, 56, 236, 0.4)',
            background: 'transparent',
          }}
          animate={{
            rotate: [0, -360],
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 12 + i * 3,
            repeat: Infinity,
            delay: i * 1,
            ease: "linear",
          }}
        />
      ))}
    </div>
  )
}

// Animated Grid Lines
const AnimatedGridLines = () => {
  return (
    <div className="absolute inset-0 opacity-10 pointer-events-none">
      <svg className="w-full h-full">
        <defs>
          <pattern id="animated-grid" width="100" height="100" patternUnits="userSpaceOnUse">
            <path
              d="M 100 0 L 0 0 0 100"
              fill="none"
              stroke="rgba(131, 56, 236, 0.5)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#animated-grid)" />
        {/* Animated lines */}
        <motion.line
          x1="0"
          y1="0"
          x2="100%"
          y2="100%"
          stroke="rgba(131, 56, 236, 0.2)"
          strokeWidth="1"
          animate={{
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
          }}
        />
        <motion.line
          x1="100%"
          y1="0"
          x2="0"
          y2="100%"
          stroke="rgba(255, 0, 110, 0.2)"
          strokeWidth="1"
          animate={{
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: 1,
          }}
        />
      </svg>
    </div>
  )
}

// Floating Connection Lines
const ConnectionLines = () => {
  const lines = [
    { from: { x: '10%', y: '20%' }, to: { x: '30%', y: '40%' } },
    { from: { x: '70%', y: '30%' }, to: { x: '90%', y: '50%' } },
    { from: { x: '20%', y: '70%' }, to: { x: '40%', y: '90%' } },
    { from: { x: '60%', y: '80%' }, to: { x: '80%', y: '60%' } },
  ]

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg className="w-full h-full">
        {lines.map((line, i) => (
          <motion.line
            key={i}
            x1={line.from.x}
            y1={line.from.y}
            x2={line.to.x}
            y2={line.to.y}
            stroke="rgba(131, 56, 236, 0.15)"
            strokeWidth="2"
            strokeDasharray="5,5"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: [0, 1, 0],
              opacity: [0, 0.3, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: i * 0.8,
              ease: "easeInOut",
            }}
          />
        ))}
      </svg>
    </div>
  )
}

// Subtle Particle Background
const ParticleBackground = () => {
  const particles = Array.from({ length: 40 })

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

// Floating Logo with Subtle Effects
const FloatingLogo = ({ mouseX, mouseY }) => {
  const logoRef = useRef(null)
  
  const rotateX = useSpring(useTransform(mouseY, [0, window.innerHeight], [8, -8]), {
    stiffness: 150,
    damping: 15
  })
  const rotateY = useSpring(useTransform(mouseX, [0, window.innerWidth], [-8, 8]), {
    stiffness: 150,
    damping: 15
  })

  return (
    <motion.div
      ref={logoRef}
      className="relative"
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      animate={{
        y: [0, -15, 0],
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {/* Subtle border rings */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-neon-purple/20"
        style={{ width: '140px', height: '140px', top: '-10px', left: '-10px' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      <motion.img
        src="/Logo.png"
        alt="URL Attack Detector Logo"
        className="h-32 w-32 sm:h-40 sm:w-40 object-contain relative z-10"
        whileHover={{ scale: 1.1 }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  )
}

// Feature Card with Creative Design
const FeatureCard = ({ feature, index, mousePosition }) => {
  const cardRef = useRef(null)
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!cardRef.current) return
      const rect = cardRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      
      const rotateX = (y - centerY) / 20
      const rotateY = (centerX - x) / 20
      
      cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`
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
      className="card-matrix group relative overflow-hidden"
      initial={{ opacity: 0, y: 50, rotateX: -10 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ delay: index * 0.15, duration: 0.8, ease: "easeOut" }}
      style={{ transformStyle: "preserve-3d" }}
    >
      {/* Geometric corner accent */}
      <div className="absolute top-0 right-0 w-20 h-20">
        <div className="absolute top-0 right-0 w-0 h-0 border-t-[20px] border-t-transparent border-r-[20px] border-r-neon-purple/20 group-hover:border-r-neon-purple/40 transition-colors duration-300" />
      </div>
      <div className="absolute bottom-0 left-0 w-20 h-20">
        <div className="absolute bottom-0 left-0 w-0 h-0 border-b-[20px] border-b-transparent border-l-[20px] border-l-neon-pink/20 group-hover:border-l-neon-pink/40 transition-colors duration-300" />
      </div>
      
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/5 via-transparent to-neon-pink/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <motion.div
        className="text-6xl mb-6 relative z-10"
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
        {feature.icon}
      </motion.div>
      
      <h3 className="text-2xl font-semibold font-display text-white mb-4 relative z-10">
        {feature.title}
      </h3>
      <p className="text-white/70 leading-relaxed relative z-10">{feature.desc}</p>
      
      {/* Animated bottom border */}
      <motion.div
        className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan"
        initial={{ width: 0 }}
        whileInView={{ width: '100%' }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.15 + 0.5, duration: 0.8 }}
      />
    </motion.div>
  )
}

const Landing = () => {
  const { scrollY } = useScroll()
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const containerRef = useRef(null)
  
  const opacity = useTransform(scrollY, [0, 400], [1, 0])
  const scale = useTransform(scrollY, [0, 400], [1, 0.9])
  const y = useTransform(scrollY, [0, 400], [0, 100])

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

  const features = [
    {
      title: '💉 SQL Injection Detection',
      desc: 'Protects your database from malicious queries with advanced pattern recognition',
      icon: '🔒',
    },
    {
      title: '⚡ XSS Protection',
      desc: 'Identifies cross-site scripting attacks in real-time with zero false positives',
      icon: '🛡️',
    },
    {
      title: '📂 Directory Traversal',
      desc: 'Blocks unauthorized file access attempts with intelligent path analysis',
      icon: '🚫',
    },
    {
      title: '💻 Command Injection',
      desc: 'Detects system command execution attempts before they execute',
      icon: '⚡',
    },
    {
      title: '🌐 SSRF Detection',
      desc: 'Prevents server-side request forgery with comprehensive URL validation',
      icon: '🔍',
    },
    {
      title: '📡 Real-time Alerts',
      desc: 'Instant notifications for detected threats with confidence scoring',
      icon: '📊',
    },
  ]

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-hidden">
      {/* Creative Background */}
      <div className="fixed inset-0 z-0">
        {/* Subtle gradient orbs */}
        <motion.div
          className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-3xl opacity-15"
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
          className="absolute bottom-20 right-20 w-[400px] h-[400px] rounded-full blur-3xl opacity-15"
          style={{
            background: 'radial-gradient(circle, rgba(255, 0, 110, 0.3) 0%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 30, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Geometric Shapes */}
        <GeometricShapes />
        
        {/* Animated Grid */}
        <AnimatedGridLines />
        
        {/* Connection Lines */}
        <ConnectionLines />
        
        {/* Particles */}
        <ParticleBackground />
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-dark/85 via-dark/90 to-dark" />
      </div>

      {/* Hero Content */}
      <motion.div
        className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-32"
        style={{ opacity, scale, y }}
      >
        <motion.div
          className="text-center max-w-7xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          {/* Logo Section */}
          <motion.div
            className="flex justify-center mb-12"
            initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1.2, ease: "easeOut", type: "spring" }}
          >
            <FloatingLogo mouseX={mouseX} mouseY={mouseY} />
          </motion.div>

          {/* Top Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full glass border border-neon-purple/30 mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <motion.span
              className="w-2 h-2 rounded-full bg-green-500"
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-xs uppercase tracking-wider text-white/80 font-semibold">
              PREMIUM CYBERSECURITY SOLUTION
            </span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            className="text-6xl sm:text-8xl lg:text-9xl font-bold mb-8 leading-tight font-display"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
          >
            <motion.span
              className="text-white block mb-4"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
            >
              URL ATTACK
            </motion.span>
            <motion.span
              className="gradient-text-purple block text-7xl sm:text-8xl lg:text-9xl"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9, duration: 0.8 }}
            >
              DETECTOR
            </motion.span>
          </motion.h1>

          {/* Animated Slogan */}
          <motion.div
            className="mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.8 }}
          >
            <div className="flex flex-wrap justify-center gap-4 text-xl sm:text-2xl uppercase tracking-[0.2em] font-medium">
              {['DETECT', 'ANALYZE', 'PROTECT', 'SECURE'].map((word, i) => (
                <motion.span
                  key={word}
                  className="text-white/90 relative"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 + i * 0.1, duration: 0.5 }}
                  whileHover={{ scale: 1.1, color: '#8338ec' }}
                >
                  {word}
                  {i < 3 && (
                    <span className="mx-2 text-neon-purple/50">•</span>
                  )}
                </motion.span>
              ))}
            </div>
          </motion.div>

          {/* Description */}
          <motion.p
            className="text-lg sm:text-xl text-white/70 mb-12 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.8 }}
          >
            Enterprise-grade threat detection powered by advanced AI algorithms.{' '}
            <span className="text-neon-purple">Real-time monitoring</span>,{' '}
            <span className="text-neon-pink">instant alerts</span>, and{' '}
            <span className="text-neon-cyan">comprehensive protection</span> for your web applications.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8, duration: 0.8 }}
          >
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/service" className="btn-primary text-lg px-12 py-6 flex items-center gap-3 relative overflow-hidden group">
                <span className="relative z-10">Get Started</span>
                <motion.svg
                  className="w-6 h-6 relative z-10"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </motion.svg>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-neon-purple to-neon-pink"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/capabilities" className="btn-outline text-lg px-12 py-6 flex items-center gap-3">
                <span>Learn More</span>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </Link>
            </motion.div>
          </motion.div>

          {/* Stats Section */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2, duration: 0.8 }}
          >
            {[
              { label: 'Attack Types', value: '10', suffix: '+' },
              { label: 'Detection Rate', value: '99', suffix: '%' },
              { label: 'Real-time', value: '100', suffix: '%' },
              { label: 'Export Formats', value: '3', suffix: '+' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                className="card-matrix stat-card text-center group relative overflow-hidden"
                initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ delay: 2.2 + index * 0.15, duration: 0.6, ease: "easeOut" }}
                whileHover={{ scale: 1.05, y: -5 }}
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Corner accent */}
                <div className="absolute top-0 right-0 w-12 h-12">
                  <div className="absolute top-0 right-0 w-0 h-0 border-t-[12px] border-t-transparent border-r-[12px] border-r-neon-purple/20" />
                </div>
                
                <div className="stat-card-number text-5xl sm:text-6xl font-bold font-display mb-4">
                  {stat.suffix ? (
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  ) : (
                    stat.value
                  )}
                </div>
                <div className="text-sm sm:text-base text-white/70 uppercase tracking-wider font-medium">
                  {stat.label}
                </div>
                
                {/* Bottom border animation */}
                <motion.div
                  className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan"
                  initial={{ width: 0 }}
                  whileInView={{ width: '100%' }}
                  viewport={{ once: true }}
                  transition={{ delay: 2.2 + index * 0.15 + 0.3, duration: 0.8 }}
                />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Features Section */}
      <section className="relative z-10 py-32 bg-dark/60 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
          >
            <motion.h2
              className="text-5xl md:text-7xl font-bold mb-6 font-display"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-white">Key </span>
              <span className="gradient-text-purple">Features</span>
            </motion.h2>
            <motion.p
              className="text-white/60 text-lg max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              Comprehensive security monitoring with advanced detection capabilities
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                feature={feature}
                index={index}
                mousePosition={{ x: mouseX, y: mouseY }}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Landing
