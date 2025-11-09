import { useState, useCallback } from 'react'

let toastId = 0

export const useToast = () => {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const addToast = useCallback((toast) => {
    const id = ++toastId
    const newToast = { id, ...toast }
    setToasts((prev) => [...prev, newToast])
    
    // Auto remove after duration
    setTimeout(() => {
      removeToast(id)
    }, toast.duration || 5000)
  }, [removeToast])

  const success = useCallback((title, message, duration) => {
    addToast({ type: 'success', title, message, duration })
  }, [addToast])

  const error = useCallback((title, message, duration) => {
    addToast({ type: 'error', title, message, duration: duration || 7000 })
  }, [addToast])

  const warning = useCallback((title, message, duration) => {
    addToast({ type: 'warning', title, message, duration })
  }, [addToast])

  const info = useCallback((title, message, duration) => {
    addToast({ type: 'info', title, message, duration })
  }, [addToast])

  return { toasts, addToast, removeToast, success, error, warning, info }
}


