import axios from 'axios'

// Configure axios base URL
// In production, Flask serves the React app, so relative URLs work
// In development, Vite proxy handles /api requests
const api = axios.create({
  baseURL: import.meta.env.PROD ? '' : '',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 second default timeout
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle network errors
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        error.message = 'Request timeout. Please try again.'
      } else if (error.request) {
        error.message = 'Network error. Please check your connection.'
      } else {
        error.message = 'An unexpected error occurred.'
      }
    } else {
      // Handle HTTP errors
      const status = error.response.status
      const data = error.response.data
      
      switch (status) {
        case 400:
          error.message = data?.error || data?.message || 'Invalid request. Please check your input.'
          break
        case 401:
          error.message = 'Unauthorized. Please log in.'
          break
        case 403:
          error.message = 'Forbidden. You do not have permission.'
          break
        case 404:
          error.message = data?.error || 'Resource not found.'
          break
        case 500:
          error.message = data?.error || 'Server error. Please try again later.'
          break
        case 503:
          error.message = 'Service unavailable. Please try again later.'
          break
        default:
          error.message = data?.error || data?.message || `Error ${status}: ${error.message}`
      }
    }
    
    return Promise.reject(error)
  }
)

export default api


