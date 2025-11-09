import api from '../utils/axios';

export const pcapService = {
  /**
   * Start a new PCAP capture
   * @param {Object} config - Capture configuration
   * @returns {Promise} API response
   */
  startCapture: async (config) => {
    const response = await api.post('/api/pcap/start', config);
    return response.data;
  },

  /**
   * Stop a running capture
   * @param {string} captureId - Capture ID
   * @returns {Promise} API response
   */
  stopCapture: async (captureId) => {
    const response = await api.post(`/api/pcap/stop/${captureId}`);
    return response.data;
  },

  /**
   * Get capture status
   * @param {string|null} captureId - Capture ID (null for all)
   * @returns {Promise} API response
   */
  getCaptureStatus: async (captureId = null) => {
    const url = captureId 
      ? `/api/pcap/status/${captureId}`
      : '/api/pcap/status';
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Download PCAP file
   * @param {string} captureId - Capture ID
   * @returns {Promise} Blob response
   */
  downloadCapture: async (captureId) => {
    const response = await api.get(`/api/pcap/download/${captureId}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Delete a capture
   * @param {string} captureId - Capture ID
   * @returns {Promise} API response
   */
  deleteCapture: async (captureId) => {
    const response = await api.delete(`/api/pcap/delete/${captureId}`);
    return response.data;
  },

  /**
   * Get available network interfaces
   * @returns {Promise} API response
   */
  getInterfaces: async () => {
    const response = await api.get('/api/pcap/interfaces');
    return response.data;
  }
};

