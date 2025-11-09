import api from '../utils/axios';

export const geminiService = {
  /**
   * Analyze alert using Gemini
   * @param {string} alertId - Alert ID
   * @param {string} ipAddress - Optional IP address
   * @param {Object} threatData - Optional threat data
   * @returns {Promise} API response
   */
  analyzeAlert: async (alertId, ipAddress = null, threatData = {}) => {
    const response = await api.post('/api/gemini/analyze', {
      alert_id: alertId,
      ip_address: ipAddress,
      threat_data: threatData
    });
    return response.data;
  },

  /**
   * Get analysis by ID
   * @param {string} analysisId - Analysis ID
   * @returns {Promise} API response
   */
  getAnalysis: async (analysisId) => {
    const response = await api.get(`/api/gemini/analysis/${analysisId}`);
    return response.data;
  },

  /**
   * Get threat intelligence for IP
   * @param {string} ipAddress - IP address
   * @returns {Promise} API response
   */
  getThreatIntel: async (ipAddress) => {
    const response = await api.get(`/api/gemini/threat-intel/${ipAddress}`);
    return response.data;
  },

  /**
   * Batch analyze multiple alerts
   * @param {Array<string>} alertIds - Array of alert IDs
   * @returns {Promise} API response
   */
  batchAnalyze: async (alertIds) => {
    const response = await api.post('/api/gemini/batch-analyze', {
      alert_ids: alertIds
    });
    return response.data;
  }
};

