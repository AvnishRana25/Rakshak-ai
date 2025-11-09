import { motion } from 'framer-motion'

const LoadingSkeleton = ({ lines = 5, className = '' }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div
          key={i}
          className="h-4 bg-dark-lighter/50 rounded-lg"
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.1,
            ease: 'easeInOut'
          }}
        />
      ))}
    </div>
  )
}

export const TableSkeleton = ({ rows = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <motion.div
          key={i}
          className="flex gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
        >
          <div className="h-12 flex-1 bg-dark-lighter/50 rounded-lg animate-pulse" />
          <div className="h-12 w-32 bg-dark-lighter/50 rounded-lg animate-pulse" />
          <div className="h-12 w-40 bg-dark-lighter/50 rounded-lg animate-pulse" />
          <div className="h-12 w-24 bg-dark-lighter/50 rounded-lg animate-pulse" />
        </motion.div>
      ))}
    </div>
  )
}

export const CardSkeleton = () => {
  return (
    <div className="card-matrix">
      <div className="space-y-4">
        <div className="h-6 bg-dark-lighter/50 rounded-lg w-3/4 animate-pulse" />
        <div className="h-4 bg-dark-lighter/50 rounded-lg w-full animate-pulse" />
        <div className="h-4 bg-dark-lighter/50 rounded-lg w-5/6 animate-pulse" />
      </div>
    </div>
  )
}

export default LoadingSkeleton


