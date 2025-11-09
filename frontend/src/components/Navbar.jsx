import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)

      // Scroll spy - detect active section
      if (location.pathname === '/') {
        const sections = ['home', 'services', 'capabilities', 'pcap-capture', 'threat-intelligence']
        const scrollPosition = window.scrollY + 100

        for (const section of sections) {
          const element = document.getElementById(section)
          if (element) {
            const { offsetTop, offsetHeight } = element
            if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
              setActiveSection(section)
              break
            }
          }
        }
      }
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [location.pathname])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  const handleSmoothScroll = (e, targetId) => {
    e.preventDefault()
    setMobileMenuOpen(false)
    const element = document.getElementById(targetId)
    if (element) {
      const offsetTop = element.offsetTop - 80 // Account for navbar height
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      })
    }
  }

  const navLinks = [
    { path: '/', label: 'Home', section: 'home' },
    { path: '#services', label: 'Services', section: 'services' },
    { path: '#capabilities', label: 'Capabilities', section: 'capabilities' },
    { path: '/pcap-capture', label: 'PCAP', section: null },
    { path: '/threat-intelligence', label: 'Threat Intel', section: null },
    { path: '/architecture', label: 'Architecture', section: null },
    { path: '/showcase', label: 'Showcase', section: null },
  ]

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-dark/95 backdrop-blur-xl border-b border-neon-purple/30 shadow-luxury-lg'
          : 'bg-dark/40 backdrop-blur-md border-b border-neon-purple/10'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group z-50" aria-label="Rakshak.ai Home">
            <motion.div
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              {logoError ? (
                <span className="text-white text-2xl sm:text-3xl" role="img" aria-label="Shield">🛡️</span>
              ) : (
                <div className="logo-container">
                  <motion.img 
                    src="/Logo.png" 
                    alt="Rakshak.ai Logo" 
                    className="h-10 w-10 sm:h-12 sm:w-12 object-contain"
                    onError={() => setLogoError(true)}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
              )}
              <span className="gradient-text-purple hologram-text text-xl sm:text-2xl font-bold font-display tracking-tight">
                RAKSHAK.AI
              </span>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8 xl:space-x-10">
            {navLinks.map((link, index) => (
              <motion.div
                key={link.path}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
              >
                {link.section && location.pathname === '/' ? (
                  <a
                    href={link.path}
                    onClick={(e) => handleSmoothScroll(e, link.section)}
                    className={`nav-link text-sm font-medium ${
                      activeSection === link.section ? 'active' : ''
                    }`}
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    to={link.path}
                    className={`nav-link text-sm font-medium ${
                      location.pathname === link.path ? 'active' : ''
                    }`}
                  >
                    {link.label}
                  </Link>
                )}
              </motion.div>
            ))}
          </div>

          {/* CTA Button - Desktop */}
          <motion.div
            className="hidden lg:block"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {location.pathname === '/' ? (
              <a
                href="#services"
                onClick={(e) => handleSmoothScroll(e, 'services')}
                className="btn-primary text-sm px-6 py-3"
              >
                Get Started
              </a>
            ) : (
              <Link
                to="/"
                className="btn-primary text-sm px-6 py-3"
              >
                Get Started
              </Link>
            )}
          </motion.div>

          {/* Mobile menu button */}
          <button 
            className="lg:hidden text-white hover:text-neon-purple transition-colors z-50 p-2 focus:outline-none focus:ring-2 focus:ring-neon-purple rounded-lg"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            <motion.div
              animate={mobileMenuOpen ? 'open' : 'closed'}
              className="w-6 h-6 flex flex-col justify-center items-center"
            >
              <motion.span
                variants={{
                  closed: { rotate: 0, y: 0 },
                  open: { rotate: 45, y: 6 }
                }}
                className="w-6 h-0.5 bg-current block mb-1.5 transition-all"
              />
              <motion.span
                variants={{
                  closed: { opacity: 1 },
                  open: { opacity: 0 }
                }}
                className="w-6 h-0.5 bg-current block mb-1.5 transition-all"
              />
              <motion.span
                variants={{
                  closed: { rotate: 0, y: 0 },
                  open: { rotate: -45, y: -6 }
                }}
                className="w-6 h-0.5 bg-current block transition-all"
              />
            </motion.div>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-dark/95 backdrop-blur-xl z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* Menu Content */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-20 right-0 bottom-0 w-full sm:w-80 bg-dark-lighter/98 backdrop-blur-xl border-l border-neon-purple/30 z-40 lg:hidden overflow-y-auto"
            >
              <div className="flex flex-col p-6 space-y-2">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.path}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                  >
                    {link.section && location.pathname === '/' ? (
                      <a
                        href={link.path}
                        onClick={(e) => handleSmoothScroll(e, link.section)}
                        className={`block px-4 py-3 rounded-xl text-white hover:bg-gradient-to-r hover:from-neon-purple/20 hover:to-neon-pink/20 transition-all ${
                          activeSection === link.section ? 'bg-gradient-to-r from-neon-purple/30 to-neon-pink/30' : ''
                        }`}
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.path}
                        className={`block px-4 py-3 rounded-xl text-white hover:bg-gradient-to-r hover:from-neon-purple/20 hover:to-neon-pink/20 transition-all ${
                          location.pathname === link.path ? 'bg-gradient-to-r from-neon-purple/30 to-neon-pink/30' : ''
                        }`}
                      >
                        {link.label}
                      </Link>
                    )}
                  </motion.div>
                ))}

                {/* Mobile CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: navLinks.length * 0.05 + 0.1, duration: 0.3 }}
                  className="pt-4"
                >
                  {location.pathname === '/' ? (
                    <a
                      href="#services"
                      onClick={(e) => handleSmoothScroll(e, 'services')}
                      className="btn-primary w-full text-center block"
                    >
                      Get Started
                    </a>
                  ) : (
                    <Link
                      to="/"
                      className="btn-primary w-full text-center block"
                    >
                      Get Started
                    </Link>
                  )}
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

export default Navbar
