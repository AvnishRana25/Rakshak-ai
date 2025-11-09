import { motion, AnimatePresence } from 'framer-motion';

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
  );
};

const ParticleBackground = ({ count = 40 }) => {
  const particles = Array.from({ length: count });

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
  );
};

// Floating orbs in the background
const FloatingOrbs = () => {
  return (
    <>
      <motion.div
        className="absolute top-20 left-1/4 w-[500px] h-[500px] rounded-full blur-3xl opacity-15"
        style={{
          background: 'radial-gradient(circle, rgba(131, 56, 236, 0.3) 0%, transparent 70%)',
        }}
        animate={{
          scale: [1, 1.15, 1],
          x: [0, 30, 0],
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
          y: [0, -30, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 w-[350px] h-[350px] rounded-full blur-3xl opacity-10"
        style={{
          background: 'radial-gradient(circle, rgba(0, 245, 255, 0.3) 0%, transparent 70%)',
          transform: 'translate(-50%, -50%)',
        }}
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </>
  );
};

// Grid pattern overlay
const GridPattern = () => {
  return (
    <div className="absolute inset-0 pointer-events-none opacity-[0.02]">
      <svg width="100%" height="100%">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" className="text-neon-purple"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
};

// Scanline effect
const Scanlines = () => {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(131, 56, 236, 0.03) 2px, rgba(131, 56, 236, 0.03) 4px)',
      }}
      animate={{
        opacity: [0.3, 0.5, 0.3],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
};

// Matrix rain effect (lightweight version)
const MatrixRain = () => {
  const columns = 10;
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
      {Array.from({ length: columns }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute top-0 w-px bg-gradient-to-b from-neon-cyan via-neon-purple to-transparent"
          style={{
            left: `${(i / columns) * 100}%`,
            height: '100px',
          }}
          animate={{
            y: ['0vh', '100vh'],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};

// Complete background component
export const BackgroundEffects = ({ 
  includeGeometric = true,
  includeParticles = true,
  includeOrbs = true,
  includeGrid = false,
  includeScanlines = false,
  includeMatrix = false,
  particleCount = 40,
}) => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      {includeOrbs && <FloatingOrbs />}
      {includeGeometric && <GeometricShapes />}
      {includeParticles && <ParticleBackground count={particleCount} />}
      {includeGrid && <GridPattern />}
      {includeScanlines && <Scanlines />}
      {includeMatrix && <MatrixRain />}
      <div className="absolute inset-0 bg-gradient-to-b from-dark/85 via-dark/90 to-dark" />
    </div>
  );
};

export { GeometricShapes, ParticleBackground, FloatingOrbs, GridPattern, Scanlines, MatrixRain };
export default BackgroundEffects;
