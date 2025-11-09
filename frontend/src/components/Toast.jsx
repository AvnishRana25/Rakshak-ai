import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'

const Toast = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-24 right-4 z-[100] flex flex-col gap-3 max-w-md">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`glass rounded-xl p-4 shadow-luxury-lg border ${
              toast.type === 'success'
                ? 'border-green-500/50 bg-green-500/10'
                : toast.type === 'error'
                ? 'border-red-500/50 bg-red-500/10'
                : toast.type === 'warning'
                ? 'border-yellow-500/50 bg-yellow-500/10'
                : 'border-neon-purple/50 bg-neon-purple/10'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {toast.type === 'success' && (
                  <span className="text-2xl">✅</span>
                )}
                {toast.type === 'error' && (
                  <span className="text-2xl">❌</span>
                )}
                {toast.type === 'warning' && (
                  <span className="text-2xl">⚠️</span>
                )}
                {toast.type === 'info' && (
                  <span className="text-2xl">ℹ️</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">{toast.title}</p>
                {toast.message && (
                  <p className="text-white/70 text-xs mt-1">{toast.message}</p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 text-white/60 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default Toast


