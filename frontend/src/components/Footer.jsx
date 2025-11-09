import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useState } from 'react'

const Footer = () => {
  const [logoError, setLogoError] = useState(false)
  const socialLinks = [
    { name: 'GitHub', icon: '📱', url: 'https://github.com/KshitizSadh/Url-Attack-Detector' },
    { name: 'LinkedIn', icon: '💼', url: '#' },
    { name: 'Twitter', icon: '🐦', url: '#' },
  ]

  return (
    <motion.footer
      className="relative bg-dark/60 backdrop-blur-xl border-t border-gradient-to-r from-neon-purple/30 via-neon-pink/30 to-neon-purple/30 text-white/70 py-16 mt-20"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      {/* Gradient Top Border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-purple to-transparent opacity-50" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold font-display mb-4 flex items-center gap-3">
              {logoError ? (
                <span className="text-white text-2xl">🛡️</span>
              ) : (
                <img 
                  src="/Logo.png" 
                  alt="HackCBS URL Attack Detector Logo" 
                  className="h-8 w-8 object-contain"
                  onError={() => setLogoError(true)}
                />
              )}
              <span className="gradient-text-purple">HACKCBS URL ATTACK DETECTOR</span>
            </h3>
            <p className="text-white/60 text-sm leading-relaxed max-w-md mb-4">
              Real-time cyber threat detection for web applications and network traffic. 
              Enterprise-grade security solutions powered by advanced AI algorithms.
            </p>
            <p className="text-neon-purple font-semibold text-sm">
              🏆 Built for HACKCBS 2025
            </p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="text-neon-purple text-sm font-semibold font-display uppercase tracking-wider mb-6">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {[
                { path: '/service', label: 'Service' },
                { path: '/capabilities', label: 'Capabilities' },
                { path: '/architecture', label: 'Architecture' },
                { path: '/showcase', label: 'Showcase' },
                { path: '/team', label: 'Team' },
              ].map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-white/60 hover:text-neon-purple transition-colors duration-300 text-sm flex items-center gap-2 group"
                  >
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Social Links & GitHub */}
          <div>
            <h4 className="text-neon-purple text-sm font-semibold font-display uppercase tracking-wider mb-6">
              Connect
            </h4>
            <div className="flex gap-4 mb-6">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.name}
                  href={social.url}
                  target={social.name === 'GitHub' ? '_blank' : '_self'}
                  rel={social.name === 'GitHub' ? 'noopener noreferrer' : ''}
                  className="w-12 h-12 rounded-xl glass border border-neon-purple/20 flex items-center justify-center text-xl hover:border-neon-purple/60 hover:text-neon-purple transition-all duration-300"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  title={social.name}
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
            {/* GitHub Button */}
            <motion.a
              href="https://github.com/KshitizSadh/Url-Attack-Detector"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg glass border border-neon-purple/30 hover:border-neon-purple/60 text-sm font-semibold transition-all duration-300"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span>View on GitHub</span>
            </motion.a>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-neon-purple/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/50 text-sm text-center md:text-left">
              © 2025 HackCBS • Made with <span className="text-neon-pink">❤️</span> for a safer internet
            </p>
           
          </div>
          <div className="mt-4 text-center">
            <p className="text-white/40 text-xs">
              Powered by AI-driven threat detection • Securing the digital future
            </p>
          </div>
        </div>
      </div>

      {/* Chatbot Widget Placeholder */}
      <div id="chatbot-widget-container"></div>
    </motion.footer>
  )
}

export default Footer
