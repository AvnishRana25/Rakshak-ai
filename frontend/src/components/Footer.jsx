import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useState } from "react";

const Footer = () => {
  const [logoError, setLogoError] = useState(false);
  
  const socialLinks = [
    {
      name: "GitHub",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
        </svg>
      ),
      url: "https://github.com/KshitizSadh/Url-Attack-Detector",
    },
    {
      name: "LinkedIn",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
      url: "#",
    },
    {
      name: "Twitter",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
        </svg>
      ),
      url: "#",
    },
  ];

  const quickLinks = [
    { path: "/service", label: "Detection Service" },
    { path: "/pcap-capture", label: "PCAP Capture" },
    { path: "/threat-intelligence", label: "Threat Intel" },
    { path: "/capabilities", label: "Capabilities" },
    { path: "/architecture", label: "Architecture" },
  ];

  return (
    <motion.footer
      className="relative bg-dark/60 backdrop-blur-xl border-t border-gradient-to-r from-neon-purple/30 via-neon-pink/30 to-neon-purple/30 text-white/70 py-16 mt-20 overflow-hidden"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      {/* Gradient Top Border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-purple to-transparent opacity-50" />

      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-5"
          style={{
            background: 'radial-gradient(circle, rgba(131, 56, 236, 0.4) 0%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 30, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-1 lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              {logoError ? (
                <span className="text-white text-2xl" role="img" aria-label="Shield">🛡️</span>
              ) : (
                <motion.img
                  src="/Logo.png"
                  alt="Rakshak.ai Logo"
                  className="h-8 w-8 object-contain"
                  onError={() => setLogoError(true)}
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                />
              )}
              <h3 className="text-2xl font-bold font-display gradient-text-purple">
                RAKSHAK.AI
              </h3>
            </div>
            <p className="text-white/60 text-sm leading-relaxed max-w-md mb-6">
              Enterprise-grade threat detection for web applications and network
              traffic. Real-time monitoring, AI-powered analysis, and comprehensive 
              security solutions for the modern digital landscape.
            </p>
            <div className="flex items-center gap-2 bg-neon-purple/10 border border-neon-purple/30 rounded-lg px-4 py-2 w-fit">
              <span className="text-neon-purple text-lg" role="img" aria-label="Trophy">🏆</span>
              <span className="text-neon-purple font-semibold text-sm">Built for HackCBS 2025</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white text-base font-semibold font-display uppercase tracking-wider mb-6 flex items-center gap-2">
              <span className="w-1 h-4 bg-gradient-to-b from-neon-purple to-neon-pink rounded-full"></span>
              Quick Links
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link, index) => (
                <motion.li
                  key={link.path}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={link.path}
                    className="text-white/60 hover:text-neon-purple transition-all duration-300 text-sm flex items-center gap-2 group"
                  >
                    <motion.span
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-neon-purple"
                      initial={false}
                    >
                      →
                    </motion.span>
                    <span className="group-hover:translate-x-1 transition-transform duration-300">
                      {link.label}
                    </span>
                  </Link>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-white text-base font-semibold font-display uppercase tracking-wider mb-6 flex items-center gap-2">
              <span className="w-1 h-4 bg-gradient-to-b from-neon-pink to-neon-cyan rounded-full"></span>
              Connect
            </h4>
            <div className="flex gap-3 mb-6">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={social.name}
                  href={social.url}
                  target={social.name === "GitHub" ? "_blank" : "_self"}
                  rel={social.name === "GitHub" ? "noopener noreferrer" : ""}
                  className="w-11 h-11 rounded-xl glass border border-neon-purple/20 flex items-center justify-center text-white/70 hover:text-neon-purple hover:border-neon-purple/60 transition-all duration-300 group"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  aria-label={social.name}
                  title={social.name}
                >
                  <div className="group-hover:scale-110 transition-transform duration-300">
                    {social.icon}
                  </div>
                </motion.a>
              ))}
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-white/50">
                <span className="font-medium text-white/70">Status:</span>{" "}
                <span className="text-green-400">● Online</span>
              </p>
              <p className="text-white/50">
                <span className="font-medium text-white/70">Version:</span> 2.0.0
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-neon-purple/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/50 text-sm text-center md:text-left">
              © {new Date().getFullYear()} Rakshak.ai • Engineered with{" "}
              <motion.span 
                className="text-neon-pink inline-block"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
              >
                ❤️
              </motion.span>{" "}
              for a safer internet
            </p>
            <div className="flex items-center gap-6 text-xs text-white/40">
              <Link to="/" className="hover:text-white/70 transition-colors">
                Privacy Policy
              </Link>
              <Link to="/" className="hover:text-white/70 transition-colors">
                Terms of Service
              </Link>
              <Link to="/" className="hover:text-white/70 transition-colors">
                Documentation
              </Link>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-white/40 text-xs flex items-center justify-center gap-2 flex-wrap">
              <span>Powered by AI-driven threat detection</span>
              <span className="text-white/20">•</span>
              <span>Securing the digital future</span>
              <span className="text-white/20">•</span>
              <span className="text-neon-cyan">Real-time monitoring</span>
            </p>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
