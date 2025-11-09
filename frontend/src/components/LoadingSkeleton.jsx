import { motion } from 'framer-motion';

// Skeleton for table rows
export const TableSkeleton = ({ rows = 5, columns = 9 }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-neon-purple/30 bg-dark-lighter/30">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="text-left py-4 px-6">
                <div className="h-4 bg-gradient-to-r from-neon-purple/20 to-neon-pink/20 rounded w-20 animate-pulse" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <motion.tr
              key={rowIndex}
              className="border-b border-neon-purple/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: rowIndex * 0.05 }}
            >
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="py-4 px-6">
                  <div className="h-4 bg-gradient-to-r from-neon-purple/10 to-neon-pink/10 rounded shimmer" style={{ width: `${60 + Math.random() * 40}%` }} />
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Skeleton for stat cards
export const CardSkeleton = () => {
  return (
    <motion.div
      className="card-matrix stat-card"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 bg-gradient-to-r from-neon-purple/20 to-neon-pink/20 rounded-full mb-4 animate-pulse" />
        <div className="h-8 bg-gradient-to-r from-neon-purple/20 to-neon-pink/20 rounded w-24 mb-2 shimmer" />
        <div className="h-4 bg-gradient-to-r from-neon-purple/10 to-neon-pink/10 rounded w-32 shimmer" />
      </div>
    </motion.div>
  );
};

// Skeleton for content blocks
export const ContentSkeleton = ({ lines = 3 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i} 
          className="h-4 bg-gradient-to-r from-neon-purple/10 to-neon-pink/10 rounded shimmer" 
          style={{ width: `${70 + Math.random() * 30}%` }}
        />
      ))}
    </div>
  );
};

// Skeleton for chart
export const ChartSkeleton = () => {
  return (
    <motion.div
      className="card-matrix"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="h-6 bg-gradient-to-r from-neon-purple/20 to-neon-pink/20 rounded w-48 mb-6 shimmer" />
      <div className="h-[300px] bg-gradient-to-br from-neon-purple/5 to-neon-pink/5 rounded-lg flex items-center justify-center">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="text-6xl"
        >
          📊
        </motion.div>
      </div>
    </motion.div>
  );
};

// Skeleton for list items
export const ListSkeleton = ({ items = 5 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <motion.div
          key={i}
          className="card-matrix p-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-neon-purple/20 to-neon-pink/20 rounded-lg animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gradient-to-r from-neon-purple/20 to-neon-pink/20 rounded w-3/4 shimmer" />
              <div className="h-3 bg-gradient-to-r from-neon-purple/10 to-neon-pink/10 rounded w-1/2 shimmer" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Full page skeleton
export const PageSkeleton = () => {
  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header skeleton */}
        <div className="text-center mb-12">
          <div className="h-12 bg-gradient-to-r from-neon-purple/20 to-neon-pink/20 rounded w-64 mx-auto mb-4 shimmer" />
          <div className="h-6 bg-gradient-to-r from-neon-purple/10 to-neon-pink/10 rounded w-96 mx-auto shimmer" />
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>

        {/* Content skeleton */}
        <div className="card-matrix mb-8">
          <ContentSkeleton lines={5} />
        </div>

        {/* Table skeleton */}
        <div className="card-matrix">
          <TableSkeleton rows={5} columns={6} />
        </div>
      </div>
    </div>
  );
};

export default {
  TableSkeleton,
  CardSkeleton,
  ContentSkeleton,
  ChartSkeleton,
  ListSkeleton,
  PageSkeleton,
};
