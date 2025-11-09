import { motion, AnimatePresence } from 'framer-motion';

const ConfirmDialog = ({
  isOpen = false,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger', // 'danger', 'warning', 'info', 'success'
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          gradient: 'from-red-500 to-rose-600',
          glow: 'shadow-[0_0_30px_rgba(239,68,68,0.5)]',
          icon: '⚠️',
        };
      case 'warning':
        return {
          gradient: 'from-yellow-500 to-amber-600',
          glow: 'shadow-[0_0_30px_rgba(245,158,11,0.5)]',
          icon: '⚡',
        };
      case 'success':
        return {
          gradient: 'from-green-500 to-emerald-600',
          glow: 'shadow-[0_0_30px_rgba(34,197,94,0.5)]',
          icon: '✓',
        };
      default:
        return {
          gradient: 'from-neon-purple to-neon-pink',
          glow: 'shadow-[0_0_30px_rgba(131,56,236,0.5)]',
          icon: 'ℹ️',
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-dark/90 backdrop-blur-md z-[9998] flex items-center justify-center p-4"
          >
            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className={`relative glass border border-neon-purple/40 rounded-2xl shadow-luxury max-w-md w-full overflow-hidden ${styles.glow}`}
            >
              {/* Top accent bar */}
              <div className={`h-1 bg-gradient-to-r ${styles.gradient}`} />

              {/* Content */}
              <div className="p-6 sm:p-8">
                {/* Icon & Title */}
                <div className="flex items-center gap-4 mb-6">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="text-4xl"
                  >
                    {styles.icon}
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white font-display">
                    {title}
                  </h3>
                </div>

                {/* Message */}
                <p className="text-white/80 text-base leading-relaxed mb-8">
                  {message}
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <motion.button
                    onClick={onClose}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-6 py-3 rounded-xl font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50"
                  >
                    {cancelText}
                  </motion.button>
                  <motion.button
                    onClick={handleConfirm}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex-1 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r ${styles.gradient} shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50`}
                  >
                    {confirmText}
                  </motion.button>
                </div>
              </div>

              {/* Animated glow effect */}
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${styles.gradient} opacity-0 pointer-events-none`}
                animate={{
                  opacity: [0, 0.05, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;
