import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { usePcapCapture } from '../../hooks/usePcapCapture';
import { useToast } from '../../hooks/useToast';
import ConfirmDialog from '../ConfirmDialog';
import Toast from '../Toast';

const PcapCaptureList = () => {
  const {
    captures,
    isLoading,
    deleteCapture,
    downloadCapture,
    refreshCaptures
  } = usePcapCapture();
  
  const { toasts, removeToast, success, error: showError } = useToast();
  
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState('start_time');
  const [sortOrder, setSortOrder] = useState('desc');
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });

  const filteredAndSorted = useMemo(() => {
    let filtered = captures.filter(c => {
      const searchTerm = filter.toLowerCase();
      return (
        c.capture_id?.toLowerCase().includes(searchTerm) ||
        c.interface?.toLowerCase().includes(searchTerm) ||
        c.status?.toLowerCase().includes(searchTerm)
      );
    });

    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (sortBy === 'start_time' || sortBy === 'created_at') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [captures, filter, sortBy, sortOrder]);

  const handleDelete = (capture) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Capture',
      message: `Are you sure you want to delete capture ${capture.capture_id.substring(0, 8)}?`,
      onConfirm: async () => {
        try {
          await deleteCapture(capture.capture_id);
          success('Deleted', 'Capture deleted successfully');
        } catch (err) {
          showError('Delete Failed', err.message);
        }
        setConfirmDialog({ isOpen: false });
      },
      onCancel: () => setConfirmDialog({ isOpen: false })
    });
  };

  const handleDownload = async (capture) => {
    try {
      await downloadCapture(capture.capture_id, capture.file_path);
      success('Download Complete', `PCAP file "${capture.file_path?.split('/').pop() || 'capture.pcap'}" downloaded successfully`);
    } catch (err) {
      showError('Download Failed', err.message || 'Failed to download PCAP file. Please try again.');
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running':
        return 'bg-green-500';
      case 'stopped':
        return 'bg-gray-500';
      case 'completed':
        return 'bg-blue-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6 shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-neon-cyan">PCAP Captures</h2>
        <button
          onClick={refreshCaptures}
          className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="mb-4 flex gap-4">
        <input
          type="text"
          placeholder="Search captures..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1 bg-gray-800 text-white border border-gray-700 rounded px-4 py-2 focus:border-neon-cyan focus:outline-none"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-gray-800 text-white border border-gray-700 rounded px-4 py-2 focus:border-neon-cyan focus:outline-none"
        >
          <option value="start_time">Start Time</option>
          <option value="status">Status</option>
          <option value="packet_count">Packets</option>
          <option value="file_size">File Size</option>
        </select>
        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
        >
          {sortOrder === 'asc' ? '↑' : '↓'}
        </button>
      </div>

      {isLoading && captures.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <svg className="animate-spin h-8 w-8 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading captures...
        </div>
      ) : filteredAndSorted.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p className="mb-2">No captures found</p>
          <p className="text-sm text-gray-500">Start a new capture using the control panel above</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="pb-3 text-gray-300">ID</th>
                <th className="pb-3 text-gray-300">Interface</th>
                <th className="pb-3 text-gray-300">Start Time</th>
                <th className="pb-3 text-gray-300">Status</th>
                <th className="pb-3 text-gray-300">Packets</th>
                <th className="pb-3 text-gray-300">Size</th>
                <th className="pb-3 text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSorted.map((capture) => (
                <motion.tr
                  key={capture.capture_id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-gray-800 hover:bg-gray-800/50"
                >
                  <td className="py-3 text-gray-400 font-mono text-sm">
                    {capture.capture_id.substring(0, 8)}...
                  </td>
                  <td className="py-3 text-gray-300">{capture.interface}</td>
                  <td className="py-3 text-gray-400 text-sm">
                    {formatDate(capture.start_time)}
                  </td>
                  <td className="py-3">
                    <span className={`inline-block w-3 h-3 rounded-full ${getStatusColor(capture.status)} mr-2`}></span>
                    {capture.status}
                  </td>
                  <td className="py-3 text-gray-300">{capture.packet_count || 0}</td>
                  <td className="py-3 text-gray-300">{formatBytes(capture.file_size)}</td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      {(capture.status === 'stopped' || capture.status === 'completed') && capture.file_path && (
                        <button
                          onClick={() => handleDownload(capture)}
                          disabled={isLoading}
                          className="text-neon-cyan hover:text-neon-purple transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          title={`Download ${formatBytes(capture.file_size)} PCAP file`}
                        >
                          {isLoading ? (
                            <>
                              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Downloading...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              Download
                            </>
                          )}
                        </button>
                      )}
                      {capture.status === 'running' && (
                        <span className="text-gray-500 text-sm">Running...</span>
                      )}
                      {(!capture.file_path || capture.status === 'failed') && (
                        <span className="text-gray-500 text-sm">N/A</span>
                      )}
                      <button
                        onClick={() => handleDelete(capture)}
                        disabled={isLoading}
                        className="text-red-500 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete this capture"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog {...confirmDialog} />
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default PcapCaptureList;

