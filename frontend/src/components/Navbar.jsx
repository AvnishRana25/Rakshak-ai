import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/service', label: 'Service' },
    { path: '/pcap-capture', label: 'PCAP Capture' },
    { path: '/threat-intelligence', label: 'Threat Intel' },
    { path: '/capabilities', label: 'Capabilities' },
    { path: '/architecture', label: 'Architecture' },
    { path: '/showcase', label: 'Showcase' },
    { path: '/team', label: 'Team' },
  ]

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-dark/80 backdrop-blur-xl border-b border-neon-purple/30 shadow-luxury-lg'
          : 'bg-dark/40 backdrop-blur-md border-b border-neon-purple/10'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center space-x-3 group">
            <motion.div
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              {logoError ? (
                <span className="text-white text-2xl sm:text-3xl">🛡️</span>
              ) : (
                <div className="logo-container">
                  <motion.img 
                    src="/Logo.png" 
                    alt="URL Attack Detector Logo" 
                    className="h-10 w-10 sm:h-12 sm:w-12 object-contain"
                    onError={() => setLogoError(true)}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
              )}
              <span className="gradient-text-purple hologram-text text-xl sm:text-2xl font-bold font-display tracking-tight">
                URL ATTACK DETECTOR
              </span>
            </motion.div>
          </Link>

          <div className="hidden md:flex items-center space-x-8 lg:space-x-10">
            {navLinks.map((link, index) => (
              <motion.div
                key={link.path}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
              >
                <Link
                  to={link.path}
                  className={`nav-link text-sm font-medium ${
                    location.pathname === link.path ? 'active' : ''
                  }`}
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              to="/service"
              className="btn-primary text-sm px-6 py-3 hidden md:block"
            >
              Get Started
            </Link>
          </motion.div>

          {/* Mobile menu button */}
          <button className="md:hidden text-white hover:text-neon-purple transition-colors">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </motion.nav>
  )
}

export default Navbar
