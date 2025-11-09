import { motion } from 'framer-motion'

// Geometric Shapes Component
export const GeometricShapes = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-15">
      {/* Animated Triangles */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={`triangle-${i}`}
          className="absolute"
          style={{
            left: `${15 + i * 20}%`,
            top: `${20 + (i % 2) * 40}%`,
            width: '50px',
            height: '50px',
            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
            background: i % 2 === 0 
              ? 'linear-gradient(135deg, rgba(131, 56, 236, 0.2), rgba(255, 0, 110, 0.2))'
              : 'linear-gradient(135deg, rgba(0, 245, 255, 0.2), rgba(131, 56, 236, 0.2))',
          }}
          animate={{
            rotate: [0, 360],
            scale: [1, 1.1, 1],
            opacity: [0.15, 0.3, 0.15],
          }}
          transition={{
            duration: 10 + i * 2,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeInOut",
          }}
        />
      ))}
      
      {/* Animated Hexagons */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={`hex-${i}`}
          className="absolute"
          style={{
            right: `${10 + i * 25}%`,
            bottom: `${15 + (i % 2) * 30}%`,
            width: '60px',
            height: '60px',
            clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
            border: '2px solid rgba(131, 56, 236, 0.3)',
            background: 'transparent',
          }}
          animate={{
            rotate: [0, -360],
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 15 + i * 3,
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
export const AnimatedGridLines = () => {
  return (
    <div className="absolute inset-0 opacity-8 pointer-events-none">
      <svg className="w-full h-full">
        <defs>
          <pattern id="animated-grid" width="100" height="100" patternUnits="userSpaceOnUse">
            <path
              d="M 100 0 L 0 0 0 100"
              fill="none"
              stroke="rgba(131, 56, 236, 0.3)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#animated-grid)" />
      </svg>
    </div>
  )
}

// Connection Lines
export const ConnectionLines = () => {
  const lines = [
    { from: { x: '10%', y: '20%' }, to: { x: '30%', y: '40%' } },
    { from: { x: '70%', y: '30%' }, to: { x: '90%', y: '50%' } },
    { from: { x: '20%', y: '70%' }, to: { x: '40%', y: '90%' } },
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
            stroke="rgba(131, 56, 236, 0.1)"
            strokeWidth="1.5"
            strokeDasharray="5,5"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: [0, 1, 0],
              opacity: [0, 0.2, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              delay: i * 1,
              ease: "easeInOut",
            }}
          />
        ))}
      </svg>
    </div>
  )
}

// Subtle Particle Background
export const ParticleBackground = ({ count = 30 }) => {
  const particles = Array.from({ length: count })

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
              ? 'rgba(131, 56, 236, 0.3)' 
              : i % 3 === 1 
              ? 'rgba(255, 0, 110, 0.3)' 
              : 'rgba(0, 245, 255, 0.3)',
          }}
          animate={{
            y: [0, -60, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.1, 0.4, 0.1],
            scale: [0.8, 1.1, 0.8],
          }}
          transition={{
            duration: 6 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}

