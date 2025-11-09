import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import io from "socket.io-client";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useToast } from "../hooks/useToast";
import Toast from "../components/Toast";
import ConfirmDialog from "../components/ConfirmDialog";
import { TableSkeleton, CardSkeleton } from "../components/LoadingSkeleton";

const Service = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState({
    csv: false,
    json: false,
    pdf: false,
  });
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState("");
  const [selectedAttackTypes, setSelectedAttackTypes] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [minConfidence, setMinConfidence] = useState(0);
  const [maxConfidence, setMaxConfidence] = useState(100);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [cidrFilter, setCidrFilter] = useState("");
  const [urlFilter, setUrlFilter] = useState("");
  const [urlAnalysisInput, setUrlAnalysisInput] = useState("");
  const [urlReport, setUrlReport] = useState(null);
  const [loadingUrlReport, setLoadingUrlReport] = useState(false);
  const [inputMode, setInputMode] = useState("url"); // "url" or "file"
  const [showStats, setShowStats] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [blocklist, setBlocklist] = useState([]);
  const [whitelist, setWhitelist] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
  const [socketConnected, setSocketConnected] = useState(false);
  const fileInputRef = useRef(null);
  const socketRef = useRef(null);
  const { toasts, removeToast, success, error, warning, info } = useToast();

  // Initialize WebSocket connection
  useEffect(() => {
    socketRef.current = io(window.location.origin, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current.on("connect", () => {
      setSocketConnected(true);
      info("WebSocket Connected", "Real-time alerts enabled");
    });

    socketRef.current.on("disconnect", () => {
      setSocketConnected(false);
      warning("WebSocket Disconnected", "Reconnecting...");
    });

    socketRef.current.on("new_alert", (alert) => {
      success(
        "New High-Confidence Alert",
        `${alert.attack} from ${alert.src_ip} (${alert.confidence}% confidence)`
      );

      // Show browser notification
      if (Notification.permission === "granted") {
        new Notification("New High-Confidence Alert", {
          body: `${alert.attack} from ${alert.src_ip} (${alert.confidence}% confidence)`,
          icon: "/Logo.png",
          badge: "/Logo.png",
        });
      }

      // Reload alerts
      loadAlerts();
      loadStats();
    });

    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          info(
            "Notifications Enabled",
            "You will receive alerts for high-confidence threats"
          );
        }
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          loadAlerts(),
          loadStats(),
          loadBlocklist(),
          loadWhitelist(),
        ]);
      } catch (err) {
        error("Failed to Load Data", "Please refresh the page");
      } finally {
        setLoading(false);
      }
    };

    loadData();

    const interval = setInterval(() => {
      loadAlerts();
      loadStats();
    }, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [
    selectedAttackTypes,
    statusFilter,
    priorityFilter,
    minConfidence,
    maxConfidence,
    startDate,
    endDate,
    cidrFilter,
    urlFilter,
  ]);

  const loadAlerts = async () => {
    try {
      const params = {};
      if (selectedAttackTypes.length > 0) {
        params.attack_types = selectedAttackTypes;
      }
      if (statusFilter) {
        params.status = statusFilter;
      }
      if (priorityFilter) {
        params.priority = priorityFilter;
      }
      if (minConfidence > 0) {
        params.min_confidence = minConfidence;
      }
      if (maxConfidence < 100) {
        params.max_confidence = maxConfidence;
      }
      if (startDate) {
        params.start_date = startDate.toISOString();
      }
      if (endDate) {
        params.end_date = endDate.toISOString();
      }
      if (cidrFilter) {
        params.cidr = cidrFilter;
      }
      if (urlFilter) {
        params.url = urlFilter;
      }

      const response = await axios.get("/api/alerts", { params });
      setAlerts(response.data || []);
    } catch (err) {
      console.error("Error loading alerts:", err);
      if (!loading) {
        error(
          "Failed to Load Alerts",
          err.response?.data?.error || "Please try again"
        );
      }
    }
  };

  const loadStats = async () => {
    try {
      const response = await axios.get("/api/stats");
      setStats(response.data);
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  };

  const loadBlocklist = async () => {
    try {
      const response = await axios.get("/api/blocklist");
      setBlocklist(response.data || []);
    } catch (err) {
      console.error("Error loading blocklist:", err);
    }
  };

  const loadWhitelist = async () => {
    try {
      const response = await axios.get("/api/whitelist");
      setWhitelist(response.data || []);
    } catch (err) {
      console.error("Error loading whitelist:", err);
    }
  };

  const validateFile = (file) => {
    if (!file) {
      return { valid: false, error: "Please select a file" };
    }

    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return { valid: false, error: "File size exceeds 100MB limit" };
    }

    const validExtensions = [".pcap", ".pcapng", ".log", ".txt"];
    const fileExt = "." + file.name.split(".").pop().toLowerCase();
    if (!validExtensions.includes(fileExt)) {
      return {
        valid: false,
        error:
          "Invalid file type. Please upload .pcap, .pcapng, .log, or .txt files",
      };
    }

    return { valid: true };
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const validation = validateFile(selectedFile);
      if (validation.valid) {
        setFile(selectedFile);
        info("File Selected", selectedFile.name);
      } else {
        error("Invalid File", validation.error);
        e.target.value = "";
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      warning("No File Selected", "Please select a file first");
      return;
    }

    const validation = validateFile(file);
    if (!validation.valid) {
      error("Invalid File", validation.error);
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 300000, // 5 minutes timeout
      });

      if (response.data.success) {
        const alertCount = response.data.alerts_count || 0;
        success(
          "File Processed Successfully",
          `Found ${alertCount} alert${alertCount !== 1 ? "s" : ""}`
        );
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setTimeout(() => {
          loadAlerts();
          loadStats();
        }, 500);
      } else {
        throw new Error(response.data.error || "Upload failed");
      }
    } catch (err) {
      console.error("Upload error:", err);
      let errorMessage = "Error uploading file. Please try again.";

      if (err.response) {
        errorMessage =
          err.response.data?.error ||
          err.response.data?.message ||
          errorMessage;
        if (err.response.data?.details) {
          errorMessage += `: ${err.response.data.details}`;
        }
      } else if (err.request) {
        errorMessage = "No response from server. Please check your connection.";
      } else if (err.code === "ECONNABORTED") {
        errorMessage =
          "Upload timeout. File may be too large or server is busy.";
      } else {
        errorMessage = err.message || errorMessage;
      }

      error("Upload Failed", errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleExport = async (format) => {
    if (filteredAlerts.length === 0) {
      warning("No Data to Export", "Please upload a file or adjust filters");
      return;
    }

    setExporting((prev) => ({ ...prev, [format]: true }));

    try {
      const params = {};
      if (startDate) {
        params.start_date = startDate.toISOString();
      }
      if (endDate) {
        params.end_date = endDate.toISOString();
      }

      const response = await axios.get(`/api/export?fmt=${format}`, {
        params,
        responseType: "blob",
        timeout: 60000, // 1 minute timeout
      });

      const contentType = response.headers["content-type"] || "";

      if (
        contentType.includes("application/pdf") ||
        contentType.includes("text/csv") ||
        response.data instanceof Blob
      ) {
        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement("a");
        link.href = url;

        let filename = `alerts.${format}`;
        const contentDisposition = response.headers["content-disposition"];
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(
            /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
          );
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, "");
          }
        }

        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        success("Export Successful", `File downloaded as ${filename}`);
      } else if (contentType.includes("application/json")) {
        const text = await response.data.text();
        try {
          const errorData = JSON.parse(text);
          error("Export Failed", errorData.error || "Unknown error");
        } catch {
          error("Export Failed", "Invalid response from server");
        }
      } else {
        error("Export Failed", "Unexpected response from server");
      }
    } catch (err) {
      console.error("Export error:", err);
      let errorMessage = "Error exporting file. Please try again.";

      if (err.response) {
        const contentType = err.response.headers?.["content-type"] || "";
        if (
          err.response.data instanceof Blob &&
          contentType.includes("application/json")
        ) {
          try {
            const text = await err.response.data.text();
            const errorData = JSON.parse(text);
            errorMessage = errorData.error || errorMessage;
            if (errorData.details) {
              errorMessage += `: ${errorData.details}`;
            }
          } catch {
            // If parsing fails, use default message
          }
        } else if (typeof err.response.data === "object") {
          errorMessage =
            err.response.data?.error ||
            err.response.data?.message ||
            errorMessage;
          if (err.response.data?.details) {
            errorMessage += `: ${err.response.data.details}`;
          }
        }
      } else if (err.request) {
        errorMessage = "No response from server. Please check your connection.";
      } else if (err.code === "ECONNABORTED") {
        errorMessage = "Export timeout. Please try again.";
      } else {
        errorMessage = err.message || errorMessage;
      }

      error("Export Failed", errorMessage);
    } finally {
      setExporting((prev) => ({ ...prev, [format]: false }));
    }
  };

  const handleAlertStatusUpdate = async (alertId, status) => {
    try {
      await axios.patch(`/api/alerts/${alertId}`, { status });
      success("Status Updated", "Alert status has been updated");
      loadAlerts();
    } catch (err) {
      error(
        "Update Failed",
        err.response?.data?.error || "Failed to update alert status"
      );
    }
  };

  const handleBlockIP = async (ip, reason) => {
    if (blocklist.some((b) => b.ip === ip && b.is_active)) {
      warning("IP Already Blocked", `${ip} is already in the blocklist`);
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: "Block IP Address",
      message: `Are you sure you want to block ${ip}? This will prevent future alerts from this IP.`,
      onConfirm: async () => {
        try {
          await axios.post("/api/blocklist", {
            ip,
            reason: reason || `Manually blocked from alert`,
          });
          success("IP Blocked", `${ip} has been added to the blocklist`);
          loadBlocklist();
          loadAlerts();
        } catch (err) {
          error(
            "Block Failed",
            err.response?.data?.error || "Failed to block IP"
          );
        }
      },
    });
  };

  const handleWhitelistIP = async (ip, reason) => {
    if (whitelist.some((w) => w.ip === ip && w.is_active)) {
      warning("IP Already Whitelisted", `${ip} is already in the whitelist`);
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: "Whitelist IP Address",
      message: `Are you sure you want to whitelist ${ip}? This will exclude it from future detections.`,
      onConfirm: async () => {
        try {
          await axios.post("/api/whitelist", {
            ip,
            reason: reason || `Manually whitelisted`,
          });
          success("IP Whitelisted", `${ip} has been added to the whitelist`);
          loadWhitelist();
          loadAlerts();
        } catch (err) {
          error(
            "Whitelist Failed",
            err.response?.data?.error || "Failed to whitelist IP"
          );
        }
      },
    });
  };

  const handleViewIPDetails = async (ip) => {
    try {
      const response = await axios.get(`/api/ip/${ip}`);
      const data = response.data;
      const geo = data.geolocation || {};
      const rep = data.reputation || {};
      const history = data.history || [];

      const details = [
        `IP: ${ip}`,
        `Country: ${geo.country || "Unknown"}`,
        `City: ${geo.city || "Unknown"}`,
        `Attacks: ${history.length}`,
        `Reputation: ${rep.abuse_score || 0}/100`,
        `Type: ${rep.usage_type || "Unknown"}`,
        `Blocked: ${data.is_blocked ? "Yes" : "No"}`,
        `Whitelisted: ${data.is_whitelisted ? "Yes" : "No"}`,
      ].join("\n");

      info("IP Details", details);
    } catch (err) {
      error(
        "Failed to Load IP Details",
        err.response?.data?.error || "Please try again"
      );
    }
  };

  const validateCIDR = (cidr) => {
    if (!cidr) return { valid: true };
    const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
    if (!cidrRegex.test(cidr)) {
      return {
        valid: false,
        error: "Invalid CIDR format. Use format: 192.168.1.0/24",
      };
    }
    return { valid: true };
  };

  const handleCIDRChange = (e) => {
    const value = e.target.value;
    setCidrFilter(value);
    if (value) {
      const validation = validateCIDR(value);
      if (!validation.valid) {
        warning("Invalid CIDR", validation.error);
      }
    }
  };

  const loadUrlReport = async () => {
    if (!urlAnalysisInput.trim()) {
      warning("URL Required", "Please enter a URL to analyze");
      return;
    }

    setLoadingUrlReport(true);
    try {
      const response = await axios.get("/api/url-report", {
        params: { url: urlAnalysisInput.trim() },
      });
      setUrlReport(response.data);
      if (response.data.total_attacks === 0) {
        info(
          "No Attacks Found",
          `No attacks detected for URL containing "${urlAnalysisInput}"`
        );
      } else {
        success(
          "Report Generated",
          `Found ${response.data.total_attacks} attack(s) from ${response.data.unique_ips} unique IP(s)`
        );
      }
    } catch (err) {
      console.error("Error loading URL report:", err);
      error(
        "Failed to Load Report",
        err.response?.data?.error || "Please try again"
      );
      setUrlReport(null);
    } finally {
      setLoadingUrlReport(false);
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (filter) {
      const searchTerm = filter.toLowerCase();
      return (
        alert.src_ip?.toLowerCase().includes(searchTerm) ||
        alert.url?.toLowerCase().includes(searchTerm) ||
        alert.attack?.toLowerCase().includes(searchTerm) ||
        alert.status?.toLowerCase().includes(searchTerm) ||
        alert.priority?.toLowerCase().includes(searchTerm)
      );
    }
    return true;
  });

  const attackTypes = [...new Set(alerts.map((a) => a.attack))].filter(Boolean);
  const COLORS = [
    "#9333EA",
    "#EC4899",
    "#8B5CF6",
    "#A855F7",
    "#C084FC",
    "#DDD6FE",
  ];

  // Prepare chart data
  const attackDistributionData = stats?.attack_distribution
    ? Object.entries(stats.attack_distribution).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  const statusDistributionData = stats?.status_distribution
    ? Object.entries(stats.status_distribution).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  // Particle effect component
  const ParticleBackground = () => {
    const particles = Array.from({ length: 20 }, (_, i) => i);
    return (
      <div className="particle-container">
        {particles.map((i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 20}s`,
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen pt-24 pb-20 bg-gradient-to-b from-dark via-dark-lighter to-dark relative overflow-hidden">
      <ParticleBackground />
      <Toast toasts={toasts} removeToast={removeToast} />
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false })}
        onConfirm={confirmDialog.onConfirm || (() => {})}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        type={confirmDialog.type}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header with Logo */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="flex items-center justify-center gap-4 mb-6"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="logo-container">
              <motion.img
                src="/Logo.png"
                alt="URL Attack Detector Logo"
                className="h-16 w-16 sm:h-20 sm:w-20 object-contain"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="h-20 w-px bg-gradient-to-b from-transparent via-neon-purple to-transparent opacity-50"></div>
            <h1 className="text-4xl md:text-6xl font-bold text-center font-display">
              <span className="text-white">Attack Detection </span>
              <span className="gradient-text-purple">Service</span>
            </h1>
          </motion.div>
          <motion.p
            className="text-white/70 text-lg max-w-2xl mx-auto flex items-center justify-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <span className="inline-block">⚡</span>
            Analyze URLs or upload files to detect and investigate cyber threats
            in real-time
            <motion.span
              className="inline-flex items-center gap-1"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  socketConnected ? "bg-green-500" : "bg-red-500"
                }`}
                style={{
                  boxShadow: socketConnected
                    ? "0 0 10px rgba(34, 197, 94, 0.8)"
                    : "0 0 10px rgba(239, 68, 68, 0.8)",
                }}
              />
              <span className="text-xs">
                {socketConnected ? "LIVE" : "OFFLINE"}
              </span>
            </motion.span>
          </motion.p>
        </motion.div>

        {/* Unified Input Section */}
        <motion.div
          className="card-matrix card-glow mb-10 max-w-5xl mx-auto p-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
        >
          {/* Toggle Buttons */}
          <div className="flex items-center justify-center mb-8">
            <div className="inline-flex bg-dark-lighter/50 rounded-xl p-1.5 border border-neon-purple/20">
              <motion.button
                onClick={() => {
                  setInputMode("url");
                  setUrlReport(null);
                }}
                className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center gap-2 ${
                  inputMode === "url"
                    ? "bg-gradient-to-r from-neon-purple to-neon-pink text-white shadow-lg"
                    : "text-white/60 hover:text-white/80"
                }`}
                whileHover={{ scale: inputMode === "url" ? 1 : 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                Analyze URL
              </motion.button>
              <motion.button
                onClick={() => {
                  setInputMode("file");
                  setUrlReport(null);
                }}
                className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center gap-2 ${
                  inputMode === "file"
                    ? "bg-gradient-to-r from-neon-purple to-neon-pink text-white shadow-lg"
                    : "text-white/60 hover:text-white/80"
                }`}
                whileHover={{ scale: inputMode === "file" ? 1 : 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                Upload File
              </motion.button>
            </div>
          </div>

          {/* URL Input Mode */}
          <AnimatePresence mode="wait">
            {inputMode === "url" && (
              <motion.div
                key="url-mode"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                    <span className="text-2xl">🔍</span>
                    URL Attack Analysis
                  </h3>
                  <p className="text-white/60 text-sm">
                    Analyze all attacks detected on a specific URL endpoint.
                    Enter a full URL (e.g.,
                    https://api.rakshak.ai/v1/auth/login) or just the path
                    (e.g., /api/login). Get comprehensive insights including
                    source IPs, geolocations, and attack patterns.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative group">
                    <input
                      type="text"
                      placeholder="Enter full URL or path (e.g., https://api.rakshak.ai/v1/auth/login or /api/login)..."
                      value={urlAnalysisInput}
                      onChange={(e) => setUrlAnalysisInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && urlAnalysisInput.trim()) {
                          loadUrlReport();
                        }
                      }}
                      className="w-full glass rounded-xl px-6 py-4 pl-14 pr-12 text-white placeholder-white/40 focus:outline-none focus:border-neon-purple focus:ring-2 focus:ring-neon-purple/50 border border-neon-purple/20 bg-dark-lighter/50 transition-all duration-300 group-hover:border-neon-purple/40"
                    />
                    <span className="absolute left-5 top-1/2 transform -translate-y-1/2 text-white/50 text-xl transition-transform duration-300 group-hover:scale-110">
                      🔗
                    </span>
                    {urlAnalysisInput && (
                      <button
                        onClick={() => {
                          setUrlAnalysisInput("");
                          setUrlReport(null);
                        }}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                        title="Clear"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                  <motion.button
                    onClick={loadUrlReport}
                    disabled={loadingUrlReport || !urlAnalysisInput.trim()}
                    className="btn-primary px-8 py-4 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[180px]"
                    whileHover={{ scale: loadingUrlReport ? 1 : 1.05 }}
                    whileTap={{ scale: loadingUrlReport ? 1 : 0.95 }}
                  >
                    {loadingUrlReport ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                        <span>Generate Report</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* File Upload Mode */}
          <AnimatePresence mode="wait">
            {inputMode === "file" && (
              <motion.div
                key="file-mode"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                    <span className="text-2xl">📤</span>
                    Upload File for Analysis
                  </h3>
                  <p className="text-white/60 text-sm">
                    Upload PCAP files or access logs (.pcap, .pcapng, .log,
                    .txt) to analyze and detect cyber threats. Maximum file
                    size: 100MB.
                  </p>
                </div>
                <div className="space-y-4">
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pcap,.pcapng,.log,.txt"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-white/80 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-neon-purple file:to-neon-pink file:text-white hover:file:opacity-90 cursor-pointer bg-dark-lighter/50 border border-neon-purple/20 rounded-xl p-3 transition-all focus:border-neon-purple focus:ring-2 focus:ring-neon-purple/50"
                    />
                  </div>
                  {file && (
                    <motion.div
                      className="flex items-center justify-between p-4 glass rounded-xl border border-green-500/30"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">✓</span>
                        <div>
                          <p className="text-white font-medium">{file.name}</p>
                          <p className="text-white/60 text-sm">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setFile(null);
                          if (fileInputRef.current)
                            fileInputRef.current.value = "";
                        }}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </motion.div>
                  )}
                  <motion.button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    whileHover={{ scale: uploading ? 1 : 1.02 }}
                    whileTap={{ scale: uploading ? 1 : 0.98 }}
                  >
                    {uploading ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        <span>Upload & Analyze</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* URL Report Display */}
          {urlReport && inputMode === "url" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 pt-8 border-t border-neon-purple/20 space-y-6"
            >
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <motion.div
                  className="card-matrix text-center group cursor-default"
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.div
                    className="text-6xl mb-4 relative z-10"
                    animate={{
                      rotate: [0, 5, -5, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      delay: 0.1,
                    }}
                  >
                    🎯
                  </motion.div>
                  <div className="text-3xl font-bold text-white mb-1">
                    {urlReport.total_attacks || 0}
                  </div>
                  <div className="text-white/60 text-sm font-medium">
                    Total Attacks
                  </div>
                </motion.div>
                <motion.div
                  className="card-matrix text-center group cursor-default"
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.div
                    className="text-6xl mb-4 relative z-10"
                    animate={{
                      rotate: [0, 5, -5, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      delay: 0.2,
                    }}
                  >
                    🌐
                  </motion.div>
                  <div className="text-3xl font-bold text-white mb-1">
                    {urlReport.unique_ips || 0}
                  </div>
                  <div className="text-white/60 text-sm font-medium">
                    Unique IPs
                  </div>
                </motion.div>
                <motion.div
                  className="card-matrix text-center group cursor-default"
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.div
                    className="text-6xl mb-4 relative z-10"
                    animate={{
                      rotate: [0, 5, -5, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      delay: 0.3,
                    }}
                  >
                    📊
                  </motion.div>
                  <div className="text-3xl font-bold text-white mb-1">
                    {urlReport.avg_confidence?.toFixed(0) || 0}%
                  </div>
                  <div className="text-white/60 text-sm font-medium">
                    Avg Confidence
                  </div>
                </motion.div>
                <motion.div
                  className="card-matrix text-center group cursor-default"
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.div
                    className="text-6xl mb-4 relative z-10"
                    animate={{
                      rotate: [0, 5, -5, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      delay: 0.4,
                    }}
                  >
                    📅
                  </motion.div>
                  <div className="text-lg font-bold text-white mb-1">
                    {urlReport.first_attack
                      ? new Date(urlReport.first_attack).toLocaleDateString()
                      : "N/A"}
                  </div>
                  <div className="text-white/60 text-xs font-medium">
                    First Attack
                  </div>
                </motion.div>
              </div>

              {/* Attack Type Distribution */}
              {urlReport.attack_types_distribution &&
                Object.keys(urlReport.attack_types_distribution).length > 0 && (
                  <div className="card-matrix">
                    <h3 className="text-xl font-semibold text-white mb-4">
                      Attack Type Distribution
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(urlReport.attack_types_distribution).map(
                        ([type, count]) => (
                          <div
                            key={type}
                            className="flex items-center justify-between"
                          >
                            <span className="text-white/80">{type}</span>
                            <div className="flex items-center gap-3">
                              <div className="w-32 h-2 bg-dark-lighter rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full bg-gradient-to-r from-neon-purple to-neon-pink"
                                  initial={{ width: 0 }}
                                  animate={{
                                    width: `${
                                      (count / urlReport.total_attacks) * 100
                                    }%`,
                                  }}
                                  transition={{ duration: 0.5 }}
                                />
                              </div>
                              <span className="text-white/70 text-sm font-medium w-12 text-right">
                                {count}
                              </span>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Top Attacking IPs */}
              {urlReport.top_ips && urlReport.top_ips.length > 0 && (
                <div className="card-matrix">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Top Attacking IP Addresses
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-neon-purple/30">
                          <th className="text-left py-3 px-4 text-neon-purple font-semibold">
                            IP Address
                          </th>
                          <th className="text-left py-3 px-4 text-neon-purple font-semibold">
                            Location
                          </th>
                          <th className="text-left py-3 px-4 text-neon-purple font-semibold">
                            Attacks
                          </th>
                          <th className="text-left py-3 px-4 text-neon-purple font-semibold">
                            Attack Types
                          </th>
                          <th className="text-left py-3 px-4 text-neon-purple font-semibold">
                            First Seen
                          </th>
                          <th className="text-left py-3 px-4 text-neon-purple font-semibold">
                            Last Seen
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {urlReport.top_ips.map((ipData, index) => (
                          <tr
                            key={ipData.ip}
                            className="border-b border-neon-purple/20 hover:bg-gradient-to-r hover:from-neon-purple/10 hover:to-neon-pink/10"
                          >
                            <td className="py-3 px-4 text-white font-mono text-sm">
                              {ipData.ip}
                            </td>
                            <td className="py-3 px-4 text-white/70 text-sm">
                              {ipData.geolocation ? (
                                <span
                                  title={`${
                                    ipData.geolocation.city || "Unknown"
                                  }, ${
                                    ipData.geolocation.country || "Unknown"
                                  }`}
                                >
                                  {ipData.geolocation.country_code || "🌐"}{" "}
                                  {ipData.geolocation.city || "Unknown"}
                                </span>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="py-3 px-4 text-white font-semibold">
                              {ipData.attack_count}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-1">
                                {ipData.attack_types.map((type) => (
                                  <span
                                    key={type}
                                    className="bg-neon-purple/20 text-neon-purple px-2 py-0.5 rounded text-xs"
                                  >
                                    {type}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-white/70 text-sm">
                              {new Date(ipData.first_seen).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-white/70 text-sm">
                              {new Date(ipData.last_seen).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Detailed Alerts List */}
              {urlReport.alerts && urlReport.alerts.length > 0 ? (
                <div className="card-matrix">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-white">
                      All Attack Details ({urlReport.alerts.length})
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      <span>Sorted by latest first</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-dark-lighter">
                        <tr className="border-b border-neon-purple/30">
                          <th className="text-left py-3 px-4 text-neon-purple font-semibold text-sm">
                            ID
                          </th>
                          <th className="text-left py-3 px-4 text-neon-purple font-semibold text-sm flex items-center gap-2">
                            <span>Timestamp</span>
                            <span className="text-xs text-neon-purple/60">
                              ↓ Latest
                            </span>
                          </th>
                          <th className="text-left py-3 px-4 text-neon-purple font-semibold text-sm">
                            Source IP
                          </th>
                          <th className="text-left py-3 px-4 text-neon-purple font-semibold text-sm">
                            Location
                          </th>
                          <th className="text-left py-3 px-4 text-neon-purple font-semibold text-sm">
                            Attack Type
                          </th>
                          <th className="text-left py-3 px-4 text-neon-purple font-semibold text-sm">
                            Confidence
                          </th>
                          <th className="text-left py-3 px-4 text-neon-purple font-semibold text-sm">
                            Method
                          </th>
                          <th className="text-left py-3 px-4 text-neon-purple font-semibold text-sm">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {urlReport.alerts
                          .sort(
                            (a, b) =>
                              new Date(b.timestamp) - new Date(a.timestamp)
                          )
                          .map((alert, index) => (
                            <tr
                              key={alert.id}
                              className="border-b border-neon-purple/20 hover:bg-gradient-to-r hover:from-neon-purple/10"
                            >
                              <td className="py-2 px-4 text-white font-mono text-xs">
                                {alert.id}
                              </td>
                              <td className="py-2 px-4 text-white/70 text-xs">
                                {new Date(alert.timestamp).toLocaleString()}
                              </td>
                              <td className="py-2 px-4 text-white font-mono text-xs">
                                {alert.src_ip || "-"}
                              </td>
                              <td className="py-2 px-4 text-white/70 text-xs">
                                {alert.geolocation ? (
                                  <span
                                    title={`${
                                      alert.geolocation.city || "Unknown"
                                    }, ${
                                      alert.geolocation.country || "Unknown"
                                    }`}
                                  >
                                    {alert.geolocation.country_code || "🌐"}
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="py-2 px-4">
                                <span className="bg-neon-purple/20 text-neon-purple px-2 py-0.5 rounded text-xs">
                                  {alert.attack_type}
                                </span>
                              </td>
                              <td className="py-2 px-4">
                                <span className="text-white/70 text-xs">
                                  {alert.confidence}%
                                </span>
                              </td>
                              <td className="py-2 px-4 text-white/70 text-xs">
                                {alert.method || "-"}
                              </td>
                              <td className="py-2 px-4">
                                <span
                                  className={`px-2 py-0.5 rounded text-xs ${
                                    alert.status === "resolved"
                                      ? "bg-green-500/20 text-green-400"
                                      : alert.status === "false_positive"
                                      ? "bg-yellow-500/20 text-yellow-400"
                                      : "bg-neon-purple/20 text-neon-purple"
                                  }`}
                                >
                                  {alert.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : urlReport.total_attacks === 0 ? (
                <motion.div
                  className="card-matrix py-12"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="text-center mb-6">
                    <div className="text-7xl mb-4">🔍</div>
                    <h3 className="text-2xl font-semibold text-white mb-2">
                      No Attacks Found
                    </h3>
                    <p className="text-white/60 text-base max-w-md mx-auto mb-4">
                      {urlReport.message ||
                        `No security threats found for URL containing "${urlAnalysisInput}".`}
                    </p>
                  </div>

                  {urlReport.debug_info && (
                    <div className="mt-6 p-4 bg-dark-lighter/50 rounded-lg border border-neon-purple/20">
                      <h4 className="text-white/80 font-semibold mb-3 text-sm">
                        Debug Information:
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="text-white/60">
                          <span className="text-white/80">Searched URL:</span>{" "}
                          {urlReport.debug_info.searched_url}
                        </div>
                        {urlReport.debug_info.extracted_path && (
                          <div className="text-white/60">
                            <span className="text-white/80">
                              Extracted Path:
                            </span>{" "}
                            {urlReport.debug_info.extracted_path}
                          </div>
                        )}
                        {urlReport.debug_info.extracted_domain && (
                          <div className="text-white/60">
                            <span className="text-white/80">
                              Extracted Domain:
                            </span>{" "}
                            {urlReport.debug_info.extracted_domain}
                          </div>
                        )}
                        {urlReport.debug_info.sample_urls_in_db &&
                          urlReport.debug_info.sample_urls_in_db.length > 0 && (
                            <div className="mt-4">
                              <div className="text-white/80 font-medium mb-2">
                                Sample URLs in Database:
                              </div>
                              <div className="space-y-1">
                                {urlReport.debug_info.sample_urls_in_db.map(
                                  (url, idx) => (
                                    <div
                                      key={idx}
                                      className="text-white/60 text-xs font-mono bg-dark-lighter/30 p-2 rounded cursor-pointer hover:bg-dark-lighter/50 transition-colors"
                                      onClick={() => {
                                        setUrlAnalysisInput(url);
                                        setTimeout(() => loadUrlReport(), 100);
                                      }}
                                      title="Click to search this URL"
                                    >
                                      {url}
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  )}

                  <div className="mt-6 text-center">
                    <p className="text-white/40 text-sm mb-4">
                      Try searching for a different URL or upload a file to
                      analyze
                    </p>
                    <motion.button
                      onClick={() => {
                        setUrlAnalysisInput("");
                        setUrlReport(null);
                      }}
                      className="btn-outline text-sm px-4 py-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Clear & Try Again
                    </motion.button>
                  </div>
                </motion.div>
              ) : null}
            </motion.div>
          )}
        </motion.div>

        {/* Statistics Dashboard */}
        {showStats && !urlReport && (
          <>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {loading && !stats ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))
              ) : stats ? (
                <>
                  <motion.div
                    className="card-matrix card-glow stat-card"
                    whileHover={{ scale: 1.05, y: -5 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.2 }}
                  >
                    <motion.div
                      className="text-6xl mb-4 relative z-10"
                      animate={{
                        rotate: [0, 5, -5, 0],
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 6,
                        repeat: Infinity,
                        delay: 0.1,
                      }}
                    >
                      📊
                    </motion.div>
                    <div className="stat-card-number text-3xl font-bold mb-2">
                      {stats.total_alerts || 0}
                    </div>
                    <div className="text-white/70 font-medium">
                      Total Alerts
                    </div>
                  </motion.div>
                  <motion.div
                    className="card-matrix card-glow stat-card"
                    whileHover={{ scale: 1.05, y: -5 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.2 }}
                  >
                    <motion.div
                      className="text-6xl mb-4 relative z-10"
                      animate={{
                        rotate: [0, 5, -5, 0],
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 6,
                        repeat: Infinity,
                        delay: 0.2,
                      }}
                    >
                      🔴
                    </motion.div>
                    <div className="stat-card-number text-3xl font-bold mb-2">
                      {stats.high_confidence_alerts || 0}
                    </div>
                    <div className="text-white/70 font-medium">
                      High Confidence
                    </div>
                  </motion.div>
                  <motion.div
                    className="card-matrix card-glow stat-card"
                    whileHover={{ scale: 1.05, y: -5 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.2 }}
                  >
                    <motion.div
                      className="text-6xl mb-4 relative z-10"
                      animate={{
                        rotate: [0, 5, -5, 0],
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 6,
                        repeat: Infinity,
                        delay: 0.3,
                      }}
                    >
                      ⏰
                    </motion.div>
                    <div className="stat-card-number text-3xl font-bold mb-2">
                      {stats.recent_24h || 0}
                    </div>
                    <div className="text-white/70 font-medium">
                      Last 24 Hours
                    </div>
                  </motion.div>
                  <motion.div
                    className="card-matrix card-glow stat-card"
                    whileHover={{ scale: 1.05, y: -5 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.2 }}
                  >
                    <motion.div
                      className="text-6xl mb-4 relative z-10"
                      animate={{
                        rotate: [0, 5, -5, 0],
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 6,
                        repeat: Infinity,
                        delay: 0.4,
                      }}
                    >
                      🌐
                    </motion.div>
                    <div className="stat-card-number text-3xl font-bold mb-2">
                      {stats.top_ips?.length || 0}
                    </div>
                    <div className="text-white/70 font-medium">
                      Top Attackers
                    </div>
                  </motion.div>
                </>
              ) : null}
            </motion.div>

            {/* Charts */}
            {stats && attackDistributionData.length > 0 && (
              <motion.div
                className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <motion.div
                  className="card-matrix graph-container"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  <h3 className="text-xl font-bold text-white mb-4">
                    <span className="drop-shadow-[0_0_8px_rgba(131,56,236,0.5)]">
                      Attack Type Distribution
                    </span>
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <defs>
                        <filter id="glow">
                          <feGaussianBlur
                            stdDeviation="3"
                            result="coloredBlur"
                          />
                          <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>
                      <Pie
                        data={attackDistributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={1000}
                      >
                        {attackDistributionData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                            style={{ filter: "url(#glow)" }}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(10, 10, 15, 0.98)",
                          border: "1px solid rgba(131, 56, 236, 0.6)",
                          borderRadius: "8px",
                          color: "#ffffff",
                          boxShadow: "0 0 20px rgba(131, 56, 236, 0.5)",
                          padding: "12px",
                          fontSize: "14px",
                          fontWeight: "500",
                        }}
                        itemStyle={{
                          color: "#ffffff",
                          fontSize: "14px",
                          fontWeight: "500",
                        }}
                        labelStyle={{
                          color: "#ffffff",
                          fontSize: "14px",
                          fontWeight: "600",
                          marginBottom: "4px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </motion.div>
                <motion.div
                  className="card-matrix graph-container"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                >
                  <h3 className="text-xl font-bold text-white mb-4 drop-shadow-[0_0_8px_rgba(131,56,236,0.5)]">
                    Status Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={statusDistributionData}>
                      <defs>
                        <linearGradient
                          id="barGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#8338ec"
                            stopOpacity={1}
                          />
                          <stop
                            offset="100%"
                            stopColor="#ff006e"
                            stopOpacity={1}
                          />
                        </linearGradient>
                        <filter id="barGlow">
                          <feGaussianBlur
                            stdDeviation="2"
                            result="coloredBlur"
                          />
                          <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#9333EA"
                        opacity={0.3}
                      />
                      <XAxis
                        dataKey="name"
                        stroke="#EC4899"
                        style={{ fontSize: "12px" }}
                      />
                      <YAxis stroke="#EC4899" style={{ fontSize: "12px" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(10, 10, 15, 0.98)",
                          border: "1px solid rgba(131, 56, 236, 0.6)",
                          borderRadius: "8px",
                          color: "#ffffff",
                          boxShadow: "0 0 20px rgba(131, 56, 236, 0.5)",
                          padding: "12px",
                          fontSize: "14px",
                          fontWeight: "500",
                        }}
                        itemStyle={{
                          color: "#ffffff",
                          fontSize: "14px",
                          fontWeight: "500",
                        }}
                        labelStyle={{
                          color: "#ffffff",
                          fontSize: "14px",
                          fontWeight: "600",
                          marginBottom: "4px",
                        }}
                        cursor={{ fill: "rgba(131, 56, 236, 0.1)" }}
                      />
                      <Bar
                        dataKey="value"
                        fill="url(#barGradient)"
                        radius={[8, 8, 0, 0]}
                        animationDuration={1000}
                        style={{ filter: "url(#barGlow)" }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              </motion.div>
            )}
          </>
        )}

        {/* Advanced Filters */}
        <motion.div
          className="card-matrix mb-8 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-neon-purple/20">
            <h2 className="text-2xl font-semibold font-display text-white flex items-center gap-3">
              <motion.span
                className="text-xl"
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
              >
                🔍
              </motion.span>
              <span className="gradient-text-purple">Advanced Filters</span>
            </h2>
            <motion.button
              onClick={() => setShowStats(!showStats)}
              className="btn-outline text-sm px-4 py-2 flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    showStats
                      ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      : "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  }
                />
              </svg>
              {showStats ? "Hide" : "Show"} Statistics
            </motion.button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="block text-white/80 mb-2 text-sm font-medium">
                Attack Types
              </label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {attackTypes.length > 0 ? (
                  attackTypes.map((type) => (
                    <motion.button
                      key={type}
                      onClick={() => {
                        if (selectedAttackTypes.includes(type)) {
                          setSelectedAttackTypes(
                            selectedAttackTypes.filter((t) => t !== type)
                          );
                        } else {
                          setSelectedAttackTypes([
                            ...selectedAttackTypes,
                            type,
                          ]);
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-sm transition-all ${
                        selectedAttackTypes.includes(type)
                          ? "bg-gradient-to-r from-neon-purple to-neon-pink text-white shadow-lg"
                          : "bg-dark-lighter/50 text-white/60 border border-neon-purple/20 hover:border-neon-purple/40"
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {type}
                    </motion.button>
                  ))
                ) : (
                  <p className="text-white/40 text-sm">
                    No attack types available
                  </p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-white/80 mb-2 text-sm font-medium">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full glass rounded-xl px-4 py-2 text-white focus:outline-none focus:border-neon-purple focus:ring-2 focus:ring-neon-purple/50 border border-neon-purple/20 bg-dark-lighter/50"
              >
                <option value="">All Status</option>
                <option value="new">New</option>
                <option value="reviewed">Reviewed</option>
                <option value="resolved">Resolved</option>
                <option value="false_positive">False Positive</option>
              </select>
            </div>
            <div>
              <label className="block text-white/80 mb-2 text-sm font-medium">
                Priority
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full glass rounded-xl px-4 py-2 text-white focus:outline-none focus:border-neon-purple focus:ring-2 focus:ring-neon-purple/50 border border-neon-purple/20 bg-dark-lighter/50"
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-white/80 mb-2 text-sm font-medium">
                Confidence Range
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={minConfidence}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setMinConfidence(Math.max(0, Math.min(100, val)));
                    if (val > maxConfidence) {
                      setMaxConfidence(val);
                    }
                  }}
                  className="w-full glass rounded-xl px-4 py-2 text-white focus:outline-none focus:border-neon-purple focus:ring-2 focus:ring-neon-purple/50 border border-neon-purple/20 bg-dark-lighter/50"
                  placeholder="Min"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={maxConfidence}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 100;
                    setMaxConfidence(Math.max(0, Math.min(100, val)));
                    if (val < minConfidence) {
                      setMinConfidence(val);
                    }
                  }}
                  className="w-full glass rounded-xl px-4 py-2 text-white focus:outline-none focus:border-neon-purple focus:ring-2 focus:ring-neon-purple/50 border border-neon-purple/20 bg-dark-lighter/50"
                  placeholder="Max"
                />
              </div>
            </div>
            <div>
              <label className="block text-white/80 mb-2 text-sm font-medium">
                Start Date
              </label>
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                className="w-full glass rounded-xl px-4 py-2 text-white focus:outline-none focus:border-neon-purple focus:ring-2 focus:ring-neon-purple/50 border border-neon-purple/20 bg-dark-lighter/50"
                dateFormat="yyyy-MM-dd"
                placeholderText="Select start date"
              />
            </div>
            <div>
              <label className="block text-white/80 mb-2 text-sm font-medium">
                End Date
              </label>
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate}
                className="w-full glass rounded-xl px-4 py-2 text-white focus:outline-none focus:border-neon-purple focus:ring-2 focus:ring-neon-purple/50 border border-neon-purple/20 bg-dark-lighter/50"
                dateFormat="yyyy-MM-dd"
                placeholderText="Select end date"
              />
            </div>
            <div>
              <label className="block text-white/80 mb-2 text-sm font-medium">
                CIDR Range
              </label>
              <input
                type="text"
                value={cidrFilter}
                onChange={handleCIDRChange}
                placeholder="192.168.1.0/24"
                className="w-full glass rounded-xl px-4 py-2 text-white focus:outline-none focus:border-neon-purple focus:ring-2 focus:ring-neon-purple/50 border border-neon-purple/20 bg-dark-lighter/50"
              />
            </div>
            <div>
              <label className="block text-white/80 mb-2 text-sm font-medium">
                Filter by URL
              </label>
              <input
                type="text"
                value={urlFilter}
                onChange={(e) => setUrlFilter(e.target.value)}
                placeholder="Filter alerts by URL..."
                className="w-full glass rounded-xl px-4 py-2 text-white focus:outline-none focus:border-neon-purple focus:ring-2 focus:ring-neon-purple/50 border border-neon-purple/20 bg-dark-lighter/50"
              />
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <motion.button
              onClick={() => {
                setSelectedAttackTypes([]);
                setStatusFilter("");
                setPriorityFilter("");
                setMinConfidence(0);
                setMaxConfidence(100);
                setStartDate(null);
                setEndDate(null);
                setCidrFilter("");
                setUrlFilter("");
                setFilter("");
                success("Filters Cleared", "All filters have been reset");
              }}
              className="btn-outline text-sm px-5 py-2.5 flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Clear All Filters
            </motion.button>
          </div>
        </motion.div>

        {/* Search and Export */}
        <motion.div
          className="card-matrix mb-8 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="flex-1 relative group">
              <input
                type="text"
                placeholder="Search alerts by IP, URL, attack type, status, or priority..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full glass rounded-xl px-6 py-3.5 pl-12 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-neon-purple focus:ring-2 focus:ring-neon-purple/50 border border-neon-purple/20 bg-dark-lighter/50 transition-all duration-300 group-hover:border-neon-purple/40"
              />
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 text-xl transition-transform duration-300 group-hover:scale-110">
                🔍
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              <motion.button
                onClick={() => handleExport("csv")}
                disabled={exporting.csv || filteredAlerts.length === 0}
                className="btn-outline text-sm px-5 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[100px] justify-center"
                whileHover={{ scale: exporting.csv ? 1 : 1.05 }}
                whileTap={{ scale: exporting.csv ? 1 : 0.95 }}
              >
                {exporting.csv ? (
                  <svg
                    className="animate-spin h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                )}
                CSV
              </motion.button>
              <motion.button
                onClick={() => handleExport("json")}
                disabled={exporting.json || filteredAlerts.length === 0}
                className="btn-outline text-sm px-5 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[100px] justify-center"
                whileHover={{ scale: exporting.json ? 1 : 1.05 }}
                whileTap={{ scale: exporting.json ? 1 : 0.95 }}
              >
                {exporting.json ? (
                  <svg
                    className="animate-spin h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                )}
                JSON
              </motion.button>
              <motion.button
                onClick={() => handleExport("pdf")}
                disabled={exporting.pdf || filteredAlerts.length === 0}
                className="btn-outline text-sm px-5 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[100px] justify-center"
                whileHover={{ scale: exporting.pdf ? 1 : 1.05 }}
                whileTap={{ scale: exporting.pdf ? 1 : 0.95 }}
              >
                {exporting.pdf ? (
                  <svg
                    className="animate-spin h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                )}
                PDF
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Alerts Table */}
        <motion.div
          className="card-matrix overflow-hidden p-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-neon-purple/20">
            <h2 className="text-2xl font-semibold font-display text-white flex items-center gap-3">
              <motion.span
                className="text-2xl"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🛡️
              </motion.span>
              <span className="gradient-text-purple">Detected Threats</span>
              {filteredAlerts.length > 0 && (
                <motion.span
                  className="text-lg font-normal text-white/60 alert-badge px-3 py-1 rounded-full bg-neon-purple/20"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  ({filteredAlerts.length})
                </motion.span>
              )}
            </h2>
            {filteredAlerts.length > 0 && alerts.length > 0 && (
              <div className="text-white/60 text-sm bg-dark-lighter/50 px-3 py-1.5 rounded-lg border border-neon-purple/20">
                Showing {filteredAlerts.length} of {alerts.length} alerts
              </div>
            )}
          </div>

          {loading && alerts.length === 0 ? (
            <TableSkeleton rows={5} />
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className="text-7xl mb-2">🔍</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {alerts.length === 0
                    ? "No Alerts Found"
                    : "No Matching Alerts"}
                </h3>
                <p className="text-base text-white/60 max-w-md">
                  {alerts.length === 0
                    ? "Upload a file or analyze a URL to start detecting threats and generating security alerts."
                    : "No alerts match your current filters. Try adjusting your search criteria or clearing filters."}
                </p>
                {alerts.length === 0 && (
                  <motion.button
                    onClick={() => setInputMode("file")}
                    className="btn-primary mt-4 px-6 py-3"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Get Started
                  </motion.button>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neon-purple/30 bg-dark-lighter/30">
                    <th className="text-left py-4 px-6 text-neon-purple font-semibold font-display text-sm">
                      ID
                    </th>
                    <th className="text-left py-4 px-6 text-neon-purple font-semibold font-display text-sm">
                      Timestamp
                    </th>
                    <th className="text-left py-4 px-6 text-neon-purple font-semibold font-display text-sm">
                      Source IP
                    </th>
                    <th className="text-left py-4 px-6 text-neon-purple font-semibold font-display text-sm">
                      Location
                    </th>
                    <th className="text-left py-4 px-6 text-neon-purple font-semibold font-display text-sm">
                      URL
                    </th>
                    <th className="text-left py-4 px-6 text-neon-purple font-semibold font-display text-sm">
                      Attack Type
                    </th>
                    <th className="text-left py-4 px-6 text-neon-purple font-semibold font-display text-sm">
                      Confidence
                    </th>
                    <th className="text-left py-4 px-6 text-neon-purple font-semibold font-display text-sm">
                      Status
                    </th>
                    <th className="text-left py-4 px-6 text-neon-purple font-semibold font-display text-sm">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAlerts.map((alert, index) => (
                    <motion.tr
                      key={alert.id}
                      className="attack-feed-item border-b border-neon-purple/10 hover:bg-gradient-to-r hover:from-neon-purple/10 hover:to-neon-pink/10 transition-all duration-300"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.01 }}
                    >
                      <td className="py-4 px-6 text-white font-mono text-sm">
                        {alert.id}
                      </td>
                      <td className="py-4 px-6 text-white/70 text-sm whitespace-nowrap">
                        {new Date(alert.timestamp).toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-white font-mono text-sm">
                        {alert.src_ip}
                      </td>
                      <td className="py-4 px-6 text-white/70 text-sm">
                        {alert.geolocation ? (
                          <span
                            title={`${alert.geolocation.city || "Unknown"}, ${
                              alert.geolocation.country || "Unknown"
                            }`}
                            className="cursor-help hover:text-white transition-colors"
                          >
                            {alert.geolocation.country_code || "🌐"}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td
                        className="py-4 px-6 text-white text-sm truncate max-w-xs"
                        title={alert.url}
                      >
                        {alert.url || "-"}
                      </td>
                      <td className="py-4 px-6">
                        <motion.span
                          className="alert-badge bg-gradient-to-r from-neon-purple/30 to-neon-pink/30 border border-neon-purple/50 text-neon-purple px-3 py-1 rounded-full text-xs font-semibold inline-block"
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.2 }}
                        >
                          {alert.attack}
                        </motion.span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3 min-w-[120px]">
                          <div className="w-24 h-2 bg-dark-lighter rounded-full overflow-hidden border border-neon-purple/20">
                            <motion.div
                              className="h-full bg-gradient-to-r from-neon-purple to-neon-pink"
                              initial={{ width: 0 }}
                              animate={{ width: `${alert.confidence}%` }}
                              transition={{
                                duration: 0.5,
                                delay: index * 0.05,
                              }}
                            />
                          </div>
                          <span className="text-white/70 text-xs font-medium min-w-[3rem]">
                            {alert.confidence}%
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <select
                          value={alert.status || "new"}
                          onChange={(e) =>
                            handleAlertStatusUpdate(alert.id, e.target.value)
                          }
                          className="bg-dark-lighter/50 border border-neon-purple/20 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-neon-purple focus:ring-2 focus:ring-neon-purple/50 transition-all"
                        >
                          <option value="new">New</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="resolved">Resolved</option>
                          <option value="false_positive">False Positive</option>
                        </select>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex gap-2">
                          <motion.button
                            onClick={() => handleViewIPDetails(alert.src_ip)}
                            className="text-neon-purple hover:text-neon-pink transition-colors p-1.5 rounded-lg hover:bg-neon-purple/10"
                            title="View IP Details"
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                              />
                            </svg>
                          </motion.button>
                          <motion.button
                            onClick={() =>
                              handleBlockIP(
                                alert.src_ip,
                                `Blocked from alert ${alert.id}`
                              )
                            }
                            className="text-red-400 hover:text-red-300 transition-colors p-1.5 rounded-lg hover:bg-red-500/10"
                            title="Block IP"
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                              />
                            </svg>
                          </motion.button>
                          <motion.button
                            onClick={() =>
                              handleWhitelistIP(
                                alert.src_ip,
                                `Whitelisted from alert ${alert.id}`
                              )
                            }
                            className="text-green-400 hover:text-green-300 transition-colors p-1.5 rounded-lg hover:bg-green-500/10"
                            title="Whitelist IP"
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Service;
