import { useState } from 'react';
import { motion } from 'framer-motion';
import { usePcapCapture } from '../../hooks/usePcapCapture';
import { useToast } from '../../hooks/useToast';
import Toast from '../Toast';

const PcapControlPanel = () => {
  const {
    activeCapture,
    interfaces,
    isLoading,
    error,
    startCapture,
    stopCapture,
    refreshCaptures
  } = usePcapCapture();
  
  const { toasts, removeToast, success, error: showError } = useToast();
  
  const [formData, setFormData] = useState({
    interface: 'any',
    filter: '',
    maxPackets: '',
    duration: '',
    filename: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStartCapture = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    if (formData.maxPackets && (isNaN(parseInt(formData.maxPackets)) || parseInt(formData.maxPackets) <= 0)) {
      showError('Validation Error', 'Max Packets must be a positive number');
      return;
    }
    
    if (formData.duration && (isNaN(parseInt(formData.duration)) || parseInt(formData.duration) <= 0)) {
      showError('Validation Error', 'Duration must be a positive number');
      return;
    }
    
    if (formData.duration && parseInt(formData.duration) > 3600) {
      showError('Validation Error', 'Duration cannot exceed 3600 seconds (1 hour)');
      return;
    }
    
    if (formData.filename && !/^[a-zA-Z0-9_-]+$/.test(formData.filename)) {
      showError('Validation Error', 'Filename can only contain letters, numbers, underscores, and hyphens');
      return;
    }
    
    try {
      const config = {
        interface: formData.interface,
        filter: formData.filter.trim() || undefined,
        max_packets: formData.maxPackets ? parseInt(formData.maxPackets) : undefined,
        duration: formData.duration ? parseInt(formData.duration) : undefined,
        filename: formData.filename.trim() || undefined
      };
      
      const result = await startCapture(config);
      success('Capture Started', `Capture ${result.capture_id.substring(0, 8)} started successfully`);
      setFormData({
        interface: 'any',
        filter: '',
        maxPackets: '',
        duration: '',
        filename: ''
      });
    } catch (err) {
      showError('Start Failed', err.message || 'Failed to start capture. Please check your settings and try again.');
    }
  };

  const handleStopCapture = async () => {
    if (!activeCapture) return;
    
    try {
      await stopCapture(activeCapture.capture_id);
      success('Capture Stopped', 'Capture stopped successfully');
      // Force refresh after a short delay to update UI immediately
      setTimeout(() => {
        refreshCaptures();
      }, 500);
    } catch (err) {
      showError('Stop Failed', err.message || 'Failed to stop capture');
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold text-neon-cyan mb-6">PCAP Capture Control</h2>
      
      {error && (
        <div className="bg-red-900/30 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {activeCapture ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-900/30 border border-yellow-500 rounded-lg p-4 mb-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                <p className="text-yellow-200 font-semibold">Capture Active</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-400">ID: </span>
                  <span className="text-gray-300 font-mono">{activeCapture.capture_id.substring(0, 8)}...</span>
                </div>
                <div>
                  <span className="text-gray-400">Interface: </span>
                  <span className="text-gray-300">{activeCapture.interface || 'any'}</span>
                </div>
                {activeCapture.packet_count !== undefined && (
                  <div>
                    <span className="text-gray-400">Packets: </span>
                    <span className="text-gray-300">{activeCapture.packet_count.toLocaleString()}</span>
                  </div>
                )}
                {activeCapture.file_size && (
                  <div>
                    <span className="text-gray-400">Size: </span>
                    <span className="text-gray-300">{(activeCapture.file_size / 1024).toFixed(2)} KB</span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={handleStopCapture}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-4 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Stopping...
                </>
              ) : (
                'Stop Capture'
              )}
            </button>
          </div>
        </motion.div>
      ) : (
        <form onSubmit={handleStartCapture} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2">Network Interface</label>
            <select
              name="interface"
              value={formData.interface}
              onChange={handleInputChange}
              className="w-full bg-gray-800 text-white border border-gray-700 rounded px-4 py-2 focus:border-neon-cyan focus:outline-none"
              required
            >
              {interfaces.map(iface => (
                <option key={iface} value={iface}>{iface}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-300 mb-2">
              BPF Filter (Optional)
              <span className="text-gray-500 text-xs ml-2">(Berkeley Packet Filter syntax)</span>
            </label>
            <input
              type="text"
              name="filter"
              value={formData.filter}
              onChange={handleInputChange}
              placeholder="e.g., tcp port 80, host 192.168.1.1, udp port 53"
              className="w-full bg-gray-800 text-white border border-gray-700 rounded px-4 py-2 focus:border-neon-cyan focus:outline-none"
            />
            <p className="text-gray-500 text-xs mt-1">
              Examples: "tcp port 80", "host 192.168.1.1", "udp port 53", "tcp and port 443"
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 mb-2">
                Max Packets (Optional)
                <span className="text-gray-500 text-xs ml-2">(stops after limit)</span>
              </label>
              <input
                type="number"
                name="maxPackets"
                value={formData.maxPackets}
                onChange={handleInputChange}
                min="1"
                max="1000000"
                placeholder="10000"
                className="w-full bg-gray-800 text-white border border-gray-700 rounded px-4 py-2 focus:border-neon-cyan focus:outline-none"
              />
              <p className="text-gray-500 text-xs mt-1">Recommended: 10,000 - 100,000</p>
            </div>

            <div>
              <label className="block text-gray-300 mb-2">
                Duration (seconds, Optional)
                <span className="text-gray-500 text-xs ml-2">(auto-stops after time)</span>
              </label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                min="1"
                max="3600"
                placeholder="3600"
                className="w-full bg-gray-800 text-white border border-gray-700 rounded px-4 py-2 focus:border-neon-cyan focus:outline-none"
              />
              <p className="text-gray-500 text-xs mt-1">Max: 3600 seconds (1 hour)</p>
            </div>
          </div>

          <div>
            <label className="block text-gray-300 mb-2">
              Filename (Optional)
              <span className="text-gray-500 text-xs ml-2">(.pcap extension added automatically)</span>
            </label>
            <input
              type="text"
              name="filename"
              value={formData.filename}
              onChange={handleInputChange}
              placeholder="my_capture (auto-generated if empty)"
              pattern="[a-zA-Z0-9_-]+"
              className="w-full bg-gray-800 text-white border border-gray-700 rounded px-4 py-2 focus:border-neon-cyan focus:outline-none"
            />
            <p className="text-gray-500 text-xs mt-1">Only letters, numbers, underscores, and hyphens allowed</p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-neon-cyan hover:bg-neon-purple text-white font-semibold py-3 rounded transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Starting...' : 'Start Capture'}
          </button>
        </form>
      )}
      
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default PcapControlPanel;

