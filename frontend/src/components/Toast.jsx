import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Toast = ({ toasts = [], removeToast }) => {
  useEffect(() => {
    const timers = toasts.map((toast) => {
      if (toast.duration !== Infinity) {
        return setTimeout(() => {
          removeToast(toast.id);
        }, toast.duration || 5000);
      }
      return null;
    });

    return () => {
      timers.forEach((timer) => timer && clearTimeout(timer));
    };
  }, [toasts, removeToast]);

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getColors = (type) => {
    switch (type) {
      case 'success':
        return {
          bg: 'from-green-500/20 to-emerald-500/20',
          border: 'border-green-500/40',
          progress: 'bg-green-500',
        };
      case 'error':
        return {
          bg: 'from-red-500/20 to-rose-500/20',
          border: 'border-red-500/40',
          progress: 'bg-red-500',
        };
      case 'warning':
        return {
          bg: 'from-yellow-500/20 to-amber-500/20',
          border: 'border-yellow-500/40',
          progress: 'bg-yellow-500',
        };
      case 'info':
        return {
          bg: 'from-blue-500/20 to-cyan-500/20',
          border: 'border-blue-500/40',
          progress: 'bg-blue-500',
        };
      default:
        return {
          bg: 'from-neon-purple/20 to-neon-pink/20',
          border: 'border-neon-purple/40',
          progress: 'bg-neon-purple',
        };
    }
  };

  return (
    <div className="fixed top-24 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const colors = getColors(toast.type);
          const duration = toast.duration || 5000;

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`relative glass backdrop-blur-xl border ${colors.border} rounded-2xl shadow-luxury overflow-hidden pointer-events-auto`}
            >
              {/* Background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-50`} />

              {/* Content */}
              <div className="relative p-4 flex items-start gap-3">
                {/* Icon */}
                <div className="flex-shrink-0">
                  {getIcon(toast.type)}
                </div>

                {/* Message */}
                <div className="flex-1 min-w-0">
                  {toast.title && (
                    <h4 className="text-white font-semibold text-sm mb-1 truncate">
                      {toast.title}
                    </h4>
                  )}
                  {toast.message && (
                    <p className="text-white/80 text-sm leading-relaxed">
                      {toast.message}
                    </p>
                  )}
                </div>

                {/* Close button */}
                <button
                  onClick={() => removeToast(toast.id)}
                  className="flex-shrink-0 text-white/60 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg p-1"
                  aria-label="Close notification"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Progress bar */}
              {duration !== Infinity && (
                <motion.div
                  className={`absolute bottom-0 left-0 h-1 ${colors.progress}`}
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: duration / 1000, ease: 'linear' }}
                />
              )}

              {/* Glow effect */}
              <motion.div
                className={`absolute inset-0 ${colors.progress} opacity-0 blur-xl`}
                animate={{
                  opacity: [0, 0.2, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default Toast;
