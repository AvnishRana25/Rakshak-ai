import { useState, useEffect, useCallback } from 'react';
import { pcapService } from '../services/pcapService';

/**
 * Custom hook for PCAP capture management
 */
export const usePcapCapture = () => {
  const [captures, setCaptures] = useState([]);
  const [activeCapture, setActiveCapture] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [interfaces, setInterfaces] = useState([]);
  const [error, setError] = useState(null);

  /**
   * Load available network interfaces
   */
  const loadInterfaces = useCallback(async () => {
    try {
      const data = await pcapService.getInterfaces();
      setInterfaces(data.interfaces || []);
    } catch (err) {
      console.error('Error loading interfaces:', err);
      setInterfaces(['any', 'eth0', 'wlan0']); // Fallback
    }
  }, []);

  /**
   * Refresh capture list
   */
  const refreshCaptures = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await pcapService.getCaptureStatus();
      const capturesList = data.captures || [];
      setCaptures(capturesList);
      
      // Find active capture
      const active = capturesList.find(c => c.status === 'running');
      setActiveCapture(active || null);
    } catch (err) {
      console.error('Error refreshing captures:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to load captures';
      setError(errorMsg);
      // Still set empty array so UI doesn't show loading forever
      setCaptures([]);
      setActiveCapture(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Start a new capture
   */
  const startCapture = useCallback(async (config) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await pcapService.startCapture(config);
      await refreshCaptures();
      return result;
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to start capture';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [refreshCaptures]);

  /**
   * Stop a capture
   */
  const stopCapture = useCallback(async (captureId) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await pcapService.stopCapture(captureId);
      await refreshCaptures();
      return result;
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to stop capture';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [refreshCaptures]);

  /**
   * Delete a capture
   */
  const deleteCapture = useCallback(async (captureId) => {
    try {
      setIsLoading(true);
      setError(null);
      await pcapService.deleteCapture(captureId);
      await refreshCaptures();
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to delete capture';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [refreshCaptures]);

  /**
   * Download a capture file
   */
  const downloadCapture = useCallback(async (captureId, filePath) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const blob = await pcapService.downloadCapture(captureId);
      
      // Extract filename from file_path or use capture_id
      let filename = `capture_${captureId.substring(0, 8)}.pcap`;
      if (filePath) {
        const pathParts = filePath.split('/');
        const extractedFilename = pathParts[pathParts.length - 1];
        if (extractedFilename && extractedFilename.endsWith('.pcap')) {
          filename = extractedFilename;
        }
      }
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to download capture';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);

  // Load interfaces on mount
  useEffect(() => {
    loadInterfaces();
  }, [loadInterfaces]);

  // Auto-refresh captures periodically to catch async updates
  useEffect(() => {
    refreshCaptures();
    const interval = setInterval(() => {
      // Always refresh to catch async packet count updates, not just for active captures
      // This ensures we see packet counts after captures stop
      refreshCaptures();
    }, 3000); // Refresh every 3 seconds to catch async updates

    return () => clearInterval(interval);
  }, [refreshCaptures]); // Removed activeCapture dependency to always refresh

  return {
    captures,
    activeCapture,
    isLoading,
    interfaces,
    error,
    startCapture,
    stopCapture,
    deleteCapture,
    downloadCapture,
    refreshCaptures,
    loadInterfaces
  };
};

