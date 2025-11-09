import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm HackCBS Assistant 🤖 How can I help you with URL Attack Detection today?",
      sender: 'bot',
      timestamp: new Date(),
    }
  ])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const quickReplies = [
    { text: "How does it work?", emoji: "🔍" },
    { text: "Upload a file", emoji: "📁" },
    { text: "View capabilities", emoji: "🛡️" },
    { text: "See statistics", emoji: "📊" },
  ]

  const botResponses = {
    "how does it work": "HackCBS URL Attack Detector analyzes network traffic (PCAP files) and server logs to detect 9 types of cyber attacks including SQL Injection, XSS, SSRF, and more. Upload a file to get started! 🚀",
    "upload a file": "To upload a file, go to the Service page and click 'Upload & Analyze'. We support PCAP files (.pcap, .pcapng) and access logs (.log, .txt). Maximum file size is 100MB. 📤",
    "view capabilities": "We detect 9 attack types:\n💉 SQL Injection\n⚡ XSS\n📂 Directory Traversal\n💻 Command Injection\n🌐 SSRF\n📝 RFI/LFI\n🔐 Credential Stuffing\n🔖 XXE\n🐚 Webshell\n\nVisit the Capabilities page for more details!",
    "see statistics": "The Service page shows real-time statistics including:\n- Total alerts detected\n- Attack type distribution\n- Top attacking IPs with geolocation\n- Confidence scores\n- Export options (CSV, JSON, PDF) 📊",
    "help": "I can help you with:\n• Understanding how the detector works\n• Uploading and analyzing files\n• Viewing detected attacks\n• Exporting reports\n• Learning about attack types\n\nWhat would you like to know? 💡",
    "sih": "This project was built for Smart India Hackathon 2025! 🏆 We're addressing the critical need for automated cybersecurity solutions to protect modern web applications from evolving threats.",
    "github": "View our source code on GitHub: https://github.com/KshitizSadh/Url-Attack-Detector\n\nFeel free to star ⭐ the repository and contribute!",
    "team": "We're Team HackCBS - passionate developers committed to making the internet safer! Visit the Team page to learn more about us. 👥",
  }

  const getBotResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase().trim()
    
    // Check for greetings
    if (/^(hi|hello|hey|greetings|sup)/i.test(lowerMessage)) {
      return "Hello! 👋 I'm here to help you with HackCBS URL Attack Detector. What would you like to know?"
    }
    
    // Check for thanks
    if (/thank|thanks|thx/i.test(lowerMessage)) {
      return "You're welcome! Feel free to ask if you have more questions. 😊"
    }
    
    // Check for specific keywords
    for (const [key, response] of Object.entries(botResponses)) {
      if (lowerMessage.includes(key)) {
        return response
      }
    }
    
    // Default response
    return "I'm not sure about that, but I can help you with:\n• How the detector works 🔍\n• Uploading files 📁\n• Viewing capabilities 🛡️\n• Checking statistics 📊\n• Team & SIH info 🏆\n\nWhat would you like to know?"
  }

  const handleSend = () => {
    if (!inputText.trim()) return

    const userMessage = {
      id: messages.length + 1,
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsTyping(true)

    // Simulate bot thinking
    setTimeout(() => {
      const botMessage = {
        id: messages.length + 2,
        text: getBotResponse(inputText),
        sender: 'bot',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, botMessage])
      setIsTyping(false)
    }, 1000 + Math.random() * 1000)
  }

  const handleQuickReply = (text) => {
    setInputText(text)
    setTimeout(handleSend, 100)
  }

  return (
    <>
      {/* Chatbot Toggle Button */}
      <motion.button
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full glass border-2 border-neon-purple/30 flex items-center justify-center text-3xl shadow-lg hover:border-neon-purple/60 transition-all duration-300"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        animate={{
          boxShadow: isOpen 
            ? "0 0 20px rgba(131, 56, 236, 0.4)"
            : "0 0 20px rgba(131, 56, 236, 0.2)",
        }}
      >
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {isOpen ? '✕' : '💬'}
        </motion.span>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-24 right-6 z-50 w-96 h-[600px] card-matrix shadow-2xl flex flex-col overflow-hidden"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-neon-purple to-neon-pink p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">
                🤖
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white">HackCBS Assistant</h3>
                <p className="text-xs text-white/80">Online • Smart India Hackathon 2025</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-dark/40">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-neon-purple to-neon-pink text-white rounded-br-sm'
                        : 'glass text-white/90 rounded-bl-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line">{message.text}</p>
                    <p className="text-xs opacity-60 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div
                  className="flex justify-start"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="glass p-3 rounded-2xl rounded-bl-sm">
                    <div className="flex gap-1">
                      <motion.span
                        className="w-2 h-2 bg-neon-purple rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                      />
                      <motion.span
                        className="w-2 h-2 bg-neon-purple rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                      />
                      <motion.span
                        className="w-2 h-2 bg-neon-purple rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            {messages.length === 1 && (
              <div className="p-4 bg-dark/60 border-t border-neon-purple/20">
                <p className="text-xs text-white/60 mb-2">Quick actions:</p>
                <div className="grid grid-cols-2 gap-2">
                  {quickReplies.map((reply, index) => (
                    <motion.button
                      key={index}
                      className="p-2 text-sm glass rounded-lg hover:border-neon-purple/60 transition-all duration-300 flex items-center gap-2 justify-center"
                      onClick={() => handleQuickReply(reply.text)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span>{reply.emoji}</span>
                      <span className="text-xs">{reply.text}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 bg-dark/60 border-t border-neon-purple/20">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type your message..."
                  className="flex-1 p-3 rounded-lg glass border border-neon-purple/20 focus:border-neon-purple/60 outline-none text-white placeholder-white/40 text-sm"
                />
                <motion.button
                  onClick={handleSend}
                  className="px-4 py-3 rounded-lg bg-gradient-to-r from-neon-purple to-neon-pink text-white font-semibold hover:shadow-lg transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={!inputText.trim()}
                >
                  ➤
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default ChatbotWidget
