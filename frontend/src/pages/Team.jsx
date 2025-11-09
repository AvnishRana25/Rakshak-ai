import { useState, useEffect, useRef } from 'react'
import { motion, useMotionValue } from 'framer-motion'
import { GeometricShapes, AnimatedGridLines, ConnectionLines, ParticleBackground } from '../components/GeometricBackground'

const Team = () => {
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

  const team = [
    {
      name: 'Development Team',
      role: 'Full Stack Developers',
      description: 'Building the core detection engine and user interface',
      members: ['Lead Developer', 'Backend Engineer', 'Frontend Engineer'],
      icon: '💻',
      color: 'from-neon-purple to-neon-pink',
    },
    {
      name: 'Security Team',
      role: 'Security Researchers',
      description: 'Developing and maintaining detection algorithms',
      members: ['Security Analyst', 'Threat Researcher', 'Pattern Expert'],
      icon: '🔐',
      color: 'from-neon-pink to-neon-cyan',
    },
    {
      name: 'Operations Team',
      role: 'DevOps Engineers',
      description: 'Ensuring smooth deployment and infrastructure',
      members: ['DevOps Lead', 'System Administrator'],
      icon: '⚙️',
      color: 'from-neon-cyan to-neon-purple',
    },
  ]

  const TeamCard = ({ group, index }) => {
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
        transition={{ delay: index * 0.15, duration: 0.8, ease: "easeOut" }}
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${group.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
        
        {/* Geometric corner accents */}
        <div className="absolute top-0 right-0 w-16 h-16">
          <div className={`absolute top-0 right-0 w-0 h-0 border-t-[16px] border-t-transparent border-r-[16px] border-r-${group.color.split(' ')[1]}/20 group-hover:border-r-${group.color.split(' ')[1]}/30 transition-colors duration-300`} />
        </div>
        
        {/* Bottom border animation */}
        <motion.div
          className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${group.color}`}
          initial={{ width: 0 }}
          whileInView={{ width: '100%' }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.15 + 0.3, duration: 0.8 }}
        />
        
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
          {group.icon}
        </motion.div>
        
        <h3 className="text-2xl font-semibold font-display text-white mb-2 relative z-10 hologram-text">{group.name}</h3>
        <p className={`text-transparent bg-gradient-to-r ${group.color} bg-clip-text mb-4 font-medium relative z-10`}>{group.role}</p>
        <p className="text-white/70 mb-6 leading-relaxed relative z-10">{group.description}</p>
        
        <div className="space-y-3 relative z-10">
          {group.members.map((member, memberIndex) => (
            <motion.div
              key={member}
              className="flex items-center gap-4 text-white group/item"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 + memberIndex * 0.1 }}
              whileHover={{ x: 5 }}
            >
              <motion.div
                className={`w-14 h-14 rounded-full bg-gradient-to-br ${group.color}/30 border-2 border-neon-purple flex items-center justify-center text-white font-bold font-display text-xl shadow-glow-purple`}
                whileHover={{ scale: 1.2, rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                {member.charAt(0)}
              </motion.div>
              <span className="font-medium text-white/90 group-hover/item:text-white transition-colors">{member}</span>
            </motion.div>
          ))}
        </div>
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
            <span className="text-white">Our </span>
            <span className="gradient-text-purple hologram-text">Team</span>
          </motion.h1>
          <motion.p
            className="text-white/70 text-lg max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            Dedicated professionals working to make the internet a safer place
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {team.map((group, index) => (
            <TeamCard key={group.name} group={group} index={index} />
          ))}
        </div>

        {/* Enhanced Acknowledgments */}
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
            className="text-4xl font-semibold font-display text-white mb-10 relative z-10 hologram-text"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Acknowledgments
          </motion.h2>
          
          <div className="space-y-6 text-white/70 relative z-10">
            <motion.p
              className="text-lg"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              Built for{' '}
              <span className="text-transparent bg-gradient-to-r from-neon-purple to-neon-pink bg-clip-text font-semibold font-display text-xl">
                Smart India Hackathon (SIH)
              </span>
            </motion.p>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              Powered by{' '}
              <span className="text-neon-purple font-semibold">Flask</span>,{' '}
              <span className="text-neon-pink font-semibold">PyShark</span>, and{' '}
              <span className="text-neon-cyan font-semibold">SQLAlchemy</span>
            </motion.p>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
            >
              Detection algorithms based on{' '}
              <span className="text-transparent bg-gradient-to-r from-neon-purple to-neon-pink bg-clip-text font-semibold font-display">
                OWASP Top 10
              </span>{' '}
              security risks
            </motion.p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Team
