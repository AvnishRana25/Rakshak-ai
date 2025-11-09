import { useState, useEffect, useRef } from 'react'
import { motion, useMotionValue } from 'framer-motion'
import { Link } from 'react-router-dom'
import { GeometricShapes, AnimatedGridLines, ConnectionLines, ParticleBackground } from '../components/GeometricBackground'

const Showcase = () => {
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

  const features = [
    {
      title: 'Real-time Detection',
      description: 'Instantly identify threats as they occur in your network traffic',
      highlight: 'Zero-delay alerts',
      icon: '⚡',
      color: 'from-neon-purple to-neon-pink',
    },
    {
      title: 'Multiple File Formats',
      description: 'Support for PCAP files and access logs from Apache, Nginx, and more',
      highlight: 'Universal compatibility',
      icon: '📄',
      color: 'from-neon-pink to-neon-cyan',
    },
    {
      title: 'Confidence Scoring',
      description: 'Each alert includes a confidence level to help prioritize responses',
      highlight: 'Smart filtering',
      icon: '🎯',
      color: 'from-neon-cyan to-neon-purple',
    },
    {
      title: 'Export & Integration',
      description: 'Export alerts as CSV or JSON for SIEM tools and compliance reporting',
      highlight: 'Enterprise ready',
      icon: '📊',
      color: 'from-neon-purple to-neon-pink',
    },
    {
      title: 'Beautiful Dashboard',
      description: 'Modern, responsive interface with dark theme and smooth animations',
      highlight: 'User-friendly',
      icon: '✨',
      color: 'from-neon-pink to-neon-cyan',
    },
    {
      title: 'Docker Support',
      description: 'Easy deployment with Docker - no complex setup required',
      highlight: 'One-command deploy',
      icon: '🐳',
      color: 'from-neon-cyan to-neon-purple',
    },
  ]

  const FeatureCard = ({ feature, index }) => {
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
        <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
        
        {/* Geometric corner accents */}
        <div className="absolute top-0 right-0 w-16 h-16">
          <div className={`absolute top-0 right-0 w-0 h-0 border-t-[16px] border-t-transparent border-r-[16px] border-r-${feature.color.split(' ')[1]}/20 group-hover:border-r-${feature.color.split(' ')[1]}/30 transition-colors duration-300`} />
        </div>
        
        {/* Bottom border animation */}
        <motion.div
          className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${feature.color}`}
          initial={{ width: 0 }}
          whileInView={{ width: '100%' }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 + 0.3, duration: 0.8 }}
        />
        
        <div className="mb-6 flex items-center justify-between relative z-10">
          <motion.div
            className="text-5xl"
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              delay: index * 0.2,
            }}
          >
            {feature.icon}
          </motion.div>
          <motion.span
            className={`bg-gradient-to-r ${feature.color}/20 border border-neon-purple/30 text-neon-purple px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider`}
            whileHover={{ scale: 1.1, borderColor: 'rgba(131, 56, 236, 0.6)' }}
          >
            {feature.highlight}
          </motion.span>
        </div>
        <h3 className="text-2xl font-semibold font-display text-white mb-3 relative z-10 hologram-text">{feature.title}</h3>
        <p className="text-white/70 leading-relaxed relative z-10">{feature.description}</p>
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
            <span className="gradient-text-purple hologram-text">Showcase</span>
          </motion.h1>
          <motion.p
            className="text-white/70 text-lg max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            See what makes our attack detection system special
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-32">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>

        {/* Enhanced Use Cases */}
        <motion.div
          className="card-matrix card-glow mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <motion.h2
            className="text-4xl font-semibold font-display text-white mb-10 hologram-text"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Use Cases
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: 'Web Application Security',
                desc: 'Monitor and protect your web applications from malicious requests',
                icon: '🌐',
                color: 'from-neon-purple to-neon-pink',
              },
              {
                title: 'Network Traffic Analysis',
                desc: 'Analyze PCAP files to identify attacks in captured network traffic',
                icon: '📡',
                color: 'from-neon-pink to-neon-cyan',
              },
              {
                title: 'Compliance & Reporting',
                desc: 'Generate reports for security audits and compliance requirements',
                icon: '📋',
                color: 'from-neon-cyan to-neon-purple',
              },
              {
                title: 'SIEM Integration',
                desc: 'Export alerts for integration with Security Information and Event Management systems',
                icon: '🔗',
                color: 'from-neon-purple to-neon-pink',
              },
            ].map((useCase, index) => (
              <motion.div
                key={useCase.title}
                className={`border-l-4 bg-gradient-to-r ${useCase.color}/5 pl-6 py-6 rounded-r-xl group hover:from-${useCase.color.split(' ')[1]}/10 hover:to-${useCase.color.split(' ')[3]}/10 transition-all duration-300 relative overflow-hidden`}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${useCase.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
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
                  {useCase.icon}
                </motion.div>
                <h3 className="text-xl font-semibold font-display text-white mb-2 hologram-text">{useCase.title}</h3>
                <p className="text-white/70">{useCase.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Enhanced CTA */}
        <motion.div
          className="card-matrix card-glow text-center max-w-4xl mx-auto relative overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/5 to-neon-pink/5 opacity-50" />
          
          {/* Corner accents */}
          <div className="absolute top-0 right-0 w-20 h-20">
            <div className="absolute top-0 right-0 w-0 h-0 border-t-[20px] border-t-transparent border-r-[20px] border-r-neon-purple/20" />
          </div>
          <div className="absolute bottom-0 left-0 w-20 h-20">
            <div className="absolute bottom-0 left-0 w-0 h-0 border-b-[20px] border-b-transparent border-l-[20px] border-l-neon-pink/20" />
          </div>
          
          <motion.h2
            className="text-5xl font-bold font-display text-white mb-6 relative z-10 hologram-text"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Ready to Get Started?
          </motion.h2>
          <motion.p
            className="text-white/70 mb-10 text-lg leading-relaxed relative z-10"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            Start protecting your web applications today with our powerful threat detection system
          </motion.p>
          <motion.div
            className="relative z-10"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to="/service" className="btn-primary inline-block text-lg px-12 py-6 relative overflow-hidden group">
              <span className="relative z-10">Try It Now</span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-neon-purple to-neon-pink"
                initial={{ x: '-100%' }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
              />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default Showcase
