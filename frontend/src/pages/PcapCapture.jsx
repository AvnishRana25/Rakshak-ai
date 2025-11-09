import { motion } from 'framer-motion';
import PcapControlPanel from '../components/PcapCapture/PcapControlPanel';
import PcapCaptureList from '../components/PcapCapture/PcapCaptureList';

const PcapCapture = () => {
  return (
    <div className="min-h-screen bg-dark py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-neon-cyan mb-2">PCAP Capture</h1>
          <p className="text-gray-400 mb-8">
            Capture and analyze network traffic in real-time
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <PcapControlPanel />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <PcapCaptureList />
        </motion.div>
      </div>
    </div>
  );
};

export default PcapCapture;

