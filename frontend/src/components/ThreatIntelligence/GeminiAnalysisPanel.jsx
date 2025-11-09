import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { geminiService } from '../../services/geminiService';
import { useToast } from '../../hooks/useToast';
import Toast from '../Toast';

const GeminiAnalysisPanel = ({ alertId, ipAddress }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState({
    iocs: false,
    mitigation: false,
    related: false
  });
  
  const { toasts, removeToast, success, error: showError } = useToast();

  useEffect(() => {
    if (alertId || ipAddress) {
      loadAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alertId, ipAddress]);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      let data;
      
      // Use appropriate service method based on what's available
      if (alertId) {
        data = await geminiService.analyzeAlert(alertId, ipAddress);
        setAnalysis(data.analysis || data);
      } else if (ipAddress) {
        // For IP-only analysis, use getThreatIntel
        data = await geminiService.getThreatIntel(ipAddress);
        // Transform the response to match expected format
        if (data.analysis) {
          setAnalysis(data.analysis);
        } else {
          // Map threat-intel response to analysis format
          setAnalysis({
            threat_level: data.threat_level || 'medium',
            threat_description: data.threat_history || data.analysis?.threat_description,
            recommendations: data.recommendations || data.analysis?.recommendations,
            mitigation_steps: Array.isArray(data.recommendations) 
              ? data.recommendations 
              : (data.analysis?.mitigation_steps || []),
            ip_reputation: data.ip_reputation,
            ...data.analysis
          });
        }
      } else {
        throw new Error('Either alertId or ipAddress is required');
      }
    } catch (err) {
      showError('Analysis Failed', err.message || 'Failed to load threat analysis');
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  const getThreatLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'critical':
        return 'bg-red-600';
      case 'high':
        return 'bg-orange-600';
      case 'medium':
        return 'bg-yellow-600';
      case 'low':
        return 'bg-green-600';
      default:
        return 'bg-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg p-6">
        <div className="text-center py-8 text-gray-400">Analyzing threat...</div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-gray-900 rounded-lg p-6">
        <p className="text-gray-400">No analysis available</p>
        <button
          onClick={loadAnalysis}
          className="mt-4 bg-neon-cyan hover:bg-neon-purple text-white px-4 py-2 rounded transition-colors"
        >
          Analyze Threat
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6 shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-neon-cyan">AI Threat Analysis</h2>
        <button
          onClick={loadAnalysis}
          className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors"
        >
          Re-analyze
        </button>
      </div>

      <div className="space-y-4">
        {/* Threat Level */}
        <div className="flex items-center gap-4">
          <span className="text-gray-400">Threat Level:</span>
          <span className={`${getThreatLevelColor(analysis.threat_level)} text-white px-3 py-1 rounded font-semibold`}>
            {analysis.threat_level?.toUpperCase() || 'UNKNOWN'}
          </span>
          {analysis.confidence_score && (
            <span className="text-gray-400">
              Confidence: {analysis.confidence_score}%
            </span>
          )}
        </div>

        {/* Threat Description */}
        {analysis.threat_description && (
          <div>
            <h3 className="text-lg font-semibold text-gray-300 mb-2">Threat Description</h3>
            <p className="text-gray-400">{analysis.threat_description}</p>
          </div>
        )}

        {/* Indicators of Compromise */}
        {analysis.indicators_of_compromise && analysis.indicators_of_compromise.length > 0 && (
          <div>
            <button
              onClick={() => setExpanded(prev => ({ ...prev, iocs: !prev.iocs }))}
              className="w-full flex justify-between items-center text-lg font-semibold text-gray-300 mb-2 hover:text-neon-cyan transition-colors"
            >
              <span>Indicators of Compromise</span>
              <span>{expanded.iocs ? '−' : '+'}</span>
            </button>
            {expanded.iocs && (
              <motion.ul
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="list-disc list-inside text-gray-400 space-y-1 ml-4"
              >
                {analysis.indicators_of_compromise.map((ioc, idx) => (
                  <li key={idx}>{ioc}</li>
                ))}
              </motion.ul>
            )}
          </div>
        )}

        {/* Mitigation Steps */}
        {analysis.mitigation_steps && analysis.mitigation_steps.length > 0 && (
          <div>
            <button
              onClick={() => setExpanded(prev => ({ ...prev, mitigation: !prev.mitigation }))}
              className="w-full flex justify-between items-center text-lg font-semibold text-gray-300 mb-2 hover:text-neon-cyan transition-colors"
            >
              <span>Mitigation Recommendations</span>
              <span>{expanded.mitigation ? '−' : '+'}</span>
            </button>
            {expanded.mitigation && (
              <motion.ol
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="list-decimal list-inside text-gray-400 space-y-2 ml-4"
              >
                {analysis.mitigation_steps.map((step, idx) => (
                  <li key={idx} className="mb-2">{step}</li>
                ))}
              </motion.ol>
            )}
          </div>
        )}

        {/* Related Threats */}
        {analysis.related_threats && analysis.related_threats.length > 0 && (
          <div>
            <button
              onClick={() => setExpanded(prev => ({ ...prev, related: !prev.related }))}
              className="w-full flex justify-between items-center text-lg font-semibold text-gray-300 mb-2 hover:text-neon-cyan transition-colors"
            >
              <span>Related Threats</span>
              <span>{expanded.related ? '−' : '+'}</span>
            </button>
            {expanded.related && (
              <motion.ul
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="list-disc list-inside text-gray-400 space-y-1 ml-4"
              >
                {analysis.related_threats.map((threat, idx) => (
                  <li key={idx}>{threat}</li>
                ))}
              </motion.ul>
            )}
          </div>
        )}

        {/* Risk Assessment */}
        {analysis.risk_assessment && (
          <div>
            <h3 className="text-lg font-semibold text-gray-300 mb-2">Risk Assessment</h3>
            <p className="text-gray-400">{analysis.risk_assessment}</p>
          </div>
        )}
      </div>

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default GeminiAnalysisPanel;

