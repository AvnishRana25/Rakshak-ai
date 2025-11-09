import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'danger' }) => {
  if (!isOpen) return null

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative glass rounded-2xl p-6 max-w-md w-full border border-neon-purple/30 shadow-luxury-lg"
        >
          <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
          <p className="text-white/70 mb-6">{message}</p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="btn-outline px-6 py-2 text-sm"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm()
                onClose()
              }}
              className={`px-6 py-2 text-sm rounded-xl font-semibold transition-all ${
                type === 'danger'
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700'
                  : 'bg-gradient-to-r from-neon-purple to-neon-pink text-white hover:opacity-90'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}

export default ConfirmDialog


