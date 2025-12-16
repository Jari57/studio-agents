/**
 * Studio Agents - Mobile-First AI Music Studio
 * Enterprise Security-First Architecture
 * 
 * Security Patterns Implemented:
 * - Input sanitization and validation
 * - Rate limiting (client + server)
 * - CSRF-ready API layer
 * - No secrets in frontend (all via env vars)
 * - XSS prevention via React's default escaping
 * - Content Security Policy compatible
 */

import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import {
  Sparkles, Feather, Flame, Briefcase, Disc, Image as ImageIcon, Video, Hash,
  Mic, Play, Pause, Loader2, X, ChevronRight, ChevronLeft, Menu, Home,
  TrendingUp, Newspaper, Settings, User, Volume2, VolumeX, Copy, Check,
  RefreshCw, AlertCircle, Shield, Zap, Music, MessageSquare, Send
} from 'lucide-react';

// =============================================================================
// CONFIGURATION & CONSTANTS
// =============================================================================

const CONFIG = Object.freeze({
  APP_NAME: 'Studio Agents',
  VERSION: '1.0.0',
  
  // API Configuration - No secrets, uses environment variables
  API: {
    BASE_URL: import.meta.env.VITE_BACKEND_URL || 
      (window.location.hostname === 'localhost' ? 'http://localhost:3001' : ''),
    TIMEOUT: 30000,
    MAX_RETRIES: 3,
  },
  
  // Rate Limiting
  RATE_LIMIT: {
    REQUESTS_PER_MINUTE: 20,
    COOLDOWN_MS: 3000,
  },
  
  // Input Validation
  VALIDATION: {
    MAX_PROMPT_LENGTH: 5000,
    MAX_SYSTEM_INSTRUCTION_LENGTH: 1000,
  },
  
  // Free tier limits per agent
  FREE_LIMITS: {
    ghostwriter: 5,
    songwriter: 5,
    battle: 3,
    crates: 5,
    ar_suite: 3,
    album_art: 3,
    viral_video: 3,
    trend_hunter: 5,
  },
});

// =============================================================================
// SECURITY UTILITIES
// =============================================================================

/**
 * Sanitizes user input to prevent injection attacks
 * @param {string} input - Raw user input
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Sanitized input
 */
const sanitizeInput = (input, maxLength = CONFIG.VALIDATION.MAX_PROMPT_LENGTH) => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .replace(/[\r\n]{3,}/g, '\n\n'); // Normalize excessive line breaks
};

/**
 * Validates and sanitizes prompt input with injection detection
 * @param {string} prompt - User prompt
 * @returns {{ isValid: boolean, sanitized: string, error?: string }}
 */
const validatePrompt = (prompt) => {
  if (!prompt || typeof prompt !== 'string') {
    return { isValid: false, sanitized: '', error: 'Invalid input' };
  }
  
  const sanitized = sanitizeInput(prompt);
  
  // Detect common prompt injection patterns
  const injectionPatterns = [
    /ignore\s+(all\s+)?previous\s+instructions?/i,
    /forget\s+(everything|all)/i,
    /disregard\s+(all\s+)?previous/i,
    /new\s+instructions?:/i,
    /you\s+are\s+now/i,
    /system\s+prompt|secret\s+instructions?/i,
  ];
  
  for (const pattern of injectionPatterns) {
    if (pattern.test(sanitized)) {
      console.warn('[Security] Blocked potential injection:', pattern.source);
      return { isValid: false, sanitized: '', error: 'Invalid input detected' };
    }
  }
  
  return { isValid: true, sanitized };
};

/**
 * Rate limiter using token bucket algorithm
 */
class RateLimiter {
  constructor(maxRequests = CONFIG.RATE_LIMIT.REQUESTS_PER_MINUTE, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }
  
  canMakeRequest() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    return this.requests.length < this.maxRequests;
  }
  
  recordRequest() {
    this.requests.push(Date.now());
  }
  
  getTimeUntilNext() {
    if (this.canMakeRequest()) return 0;
    const oldest = Math.min(...this.requests);
    return Math.max(0, this.windowMs - (Date.now() - oldest));
  }
}

const globalRateLimiter = new RateLimiter();

// =============================================================================
// API SERVICE LAYER
// =============================================================================

/**
 * Secure API service with retry logic and error handling
 */
const ApiService = {
  /**
   * Makes a secure API call to the backend
   * @param {string} endpoint - API endpoint
   * @param {object} body - Request body
   * @returns {Promise<object>} API response
   */
  async call(endpoint, body) {
    // Rate limit check
    if (!globalRateLimiter.canMakeRequest()) {
      const waitTime = globalRateLimiter.getTimeUntilNext();
      throw new Error(`Rate limited. Please wait ${Math.ceil(waitTime / 1000)} seconds.`);
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.API.TIMEOUT);
    
    try {
      const response = await fetch(`${CONFIG.API.BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // CSRF token would go here in production
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      globalRateLimiter.recordRequest();
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please try again.');
      }
      throw error;
    }
  },
  
  /**
   * Calls the AI generation endpoint
   * @param {string} prompt - User prompt
   * @param {string} systemInstruction - System instruction
   * @returns {Promise<string>} Generated text
   */
  async generate(prompt, systemInstruction = '') {
    const validation = validatePrompt(prompt);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    
    const data = await this.call('/api/generate', {
      prompt: validation.sanitized,
      systemInstruction: sanitizeInput(systemInstruction, CONFIG.VALIDATION.MAX_SYSTEM_INSTRUCTION_LENGTH),
    });
    
    return data.output || data.message || JSON.stringify(data);
  },
  
  /**
   * Fetches news from the backend
   * @returns {Promise<array>} News articles
   */
  async getNews() {
    try {
      const response = await fetch(`${CONFIG.API.BASE_URL}/api/news`);
      if (!response.ok) throw new Error('Failed to fetch news');
      const data = await response.json();
      return data.articles || [];
    } catch (error) {
      console.error('[API] News fetch failed:', error);
      return [];
    }
  },
};

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook for managing free usage limits with localStorage persistence
 */
const useUsageLimit = (agentId) => {
  const storageKey = `studio_usage_${agentId}`;
  const limit = CONFIG.FREE_LIMITS[agentId] || 5;
  
  const [used, setUsed] = useState(() => {
    try {
      return parseInt(localStorage.getItem(storageKey) || '0', 10);
    } catch {
      return 0;
    }
  });
  
  const canUse = used < limit;
  const remaining = Math.max(0, limit - used);
  
  const consume = useCallback(() => {
    if (canUse) {
      const newUsed = used + 1;
      setUsed(newUsed);
      try {
        localStorage.setItem(storageKey, newUsed.toString());
      } catch (e) {
        console.warn('[Storage] Failed to persist usage:', e);
      }
    }
  }, [used, canUse, storageKey]);
  
  return { canUse, remaining, limit, consume };
};

/**
 * Hook for cooldown between requests
 */
const useCooldown = (cooldownMs = CONFIG.RATE_LIMIT.COOLDOWN_MS) => {
  const lastRequest = useRef(0);
  
  const canRequest = useCallback(() => {
    return Date.now() - lastRequest.current >= cooldownMs;
  }, [cooldownMs]);
  
  const recordRequest = useCallback(() => {
    lastRequest.current = Date.now();
  }, []);
  
  const getWaitTime = useCallback(() => {
    const elapsed = Date.now() - lastRequest.current;
    return Math.max(0, cooldownMs - elapsed);
  }, [cooldownMs]);
  
  return { canRequest, recordRequest, getWaitTime };
};

/**
 * Hook for voice input with Web Speech API
 */
const useVoiceInput = (onTranscript) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  
  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  
  const startListening = useCallback(() => {
    if (!isSupported) return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    
    recognitionRef.current.onstart = () => setIsListening(true);
    recognitionRef.current.onend = () => setIsListening(false);
    recognitionRef.current.onerror = () => setIsListening(false);
    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
    };
    
    recognitionRef.current.start();
  }, [isSupported, onTranscript]);
  
  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);
  
  return { isListening, isSupported, startListening, stopListening };
};

// =============================================================================
// CONTEXT
// =============================================================================

const AppContext = createContext(null);

const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

// =============================================================================
// COMPONENTS - UI Primitives
// =============================================================================

const Button = ({ children, variant = 'primary', size = 'md', disabled, loading, className = '', ...props }) => {
  const baseStyles = 'font-semibold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2';
  
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/25',
    secondary: 'bg-white/10 text-white hover:bg-white/20 border border-white/10',
    danger: 'bg-red-600 text-white hover:bg-red-500',
    ghost: 'text-white/70 hover:text-white hover:bg-white/10',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  
  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
};

const Input = ({ className = '', ...props }) => (
  <input
    className={`w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all ${className}`}
    {...props}
  />
);

const Card = ({ children, className = '', gradient, ...props }) => (
  <div 
    className={`bg-[#141416] border border-white/5 rounded-2xl overflow-hidden ${gradient || ''} ${className}`}
    {...props}
  >
    {children}
  </div>
);

// =============================================================================
// COMPONENTS - Chat Interface
// =============================================================================

const ChatMessage = ({ message, isUser, onSpeak }) => (
  <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
    <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
      isUser 
        ? 'bg-indigo-600 text-white' 
        : 'bg-white/5 text-white border border-white/5'
    }`}>
      <p className="text-sm whitespace-pre-wrap">{message.text}</p>
      {message.error && (
        <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
          <AlertCircle size={12} /> {message.error}
        </p>
      )}
    </div>
  </div>
);

const ChatInput = ({ value, onChange, onSubmit, loading, placeholder, voiceEnabled = true }) => {
  const handleTranscript = useCallback((transcript) => {
    onChange(prev => prev ? `${prev} ${transcript}` : transcript);
  }, [onChange]);
  
  const { isListening, isSupported, startListening } = useVoiceInput(handleTranscript);
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };
  
  return (
    <div className="flex gap-2 p-4 border-t border-white/5 bg-[#0a0a0b]">
      {voiceEnabled && isSupported && (
        <button
          onClick={startListening}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
            isListening 
              ? 'bg-indigo-600 text-white animate-pulse' 
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          <Mic size={20} />
        </button>
      )}
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="flex-1"
      />
      <Button onClick={onSubmit} loading={loading} disabled={!value.trim()}>
        <Send size={18} />
      </Button>
    </div>
  );
};

// =============================================================================
// COMPONENTS - Agent Container
// =============================================================================

const AgentContainer = ({ title, icon: Icon, accentColor = 'indigo', children, onBack }) => {
  const colorMap = {
    indigo: 'from-indigo-600 to-indigo-500',
    cyan: 'from-cyan-600 to-cyan-500',
    red: 'from-red-600 to-red-500',
    amber: 'from-amber-600 to-amber-500',
    pink: 'from-pink-600 to-pink-500',
    green: 'from-green-600 to-green-500',
    violet: 'from-violet-600 to-violet-500',
  };
  
  return (
    <div className="h-full flex flex-col bg-[#0a0a0b]">
      {/* Header */}
      <div className={`bg-gradient-to-r ${colorMap[accentColor]} px-4 py-4 flex items-center gap-3 safe-top`}>
        {onBack && (
          <button onClick={onBack} className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center">
            <ChevronLeft size={20} className="text-white" />
          </button>
        )}
        <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center">
          <Icon size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-white font-bold text-lg">{title}</h1>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
};

// =============================================================================
// AGENTS
// =============================================================================

const GhostwriterAgent = ({ onBack }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { canUse, remaining, consume } = useUsageLimit('ghostwriter');
  const { canRequest, recordRequest, getWaitTime } = useCooldown();
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSubmit = async () => {
    if (!input.trim() || loading) return;
    
    if (!canRequest()) {
      const wait = Math.ceil(getWaitTime() / 1000);
      setMessages(prev => [...prev, { 
        text: `Please wait ${wait} seconds before the next request.`, 
        isUser: false, 
        error: 'Cooldown active' 
      }]);
      return;
    }
    
    if (!canUse) {
      setMessages(prev => [...prev, { 
        text: 'Free limit reached. Upgrade to continue.', 
        isUser: false, 
        error: 'Limit reached' 
      }]);
      return;
    }
    
    const userMessage = { text: input, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    
    try {
      consume();
      recordRequest();
      
      const systemPrompt = `You are a legendary hip-hop ghostwriter. Write creative, hard-hitting lyrics with clever wordplay, internal rhymes, and authentic street poetry. Keep responses focused on the bars - no explanations needed.`;
      
      const response = await ApiService.generate(input, systemPrompt);
      setMessages(prev => [...prev, { text: response, isUser: false }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        text: 'Failed to generate. Please try again.', 
        isUser: false, 
        error: error.message 
      }]);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <AgentContainer title="Ghostwriter" icon={Sparkles} accentColor="cyan" onBack={onBack}>
      <div className="h-full flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <Sparkles size={48} className="mx-auto mb-4 text-cyan-500/30" />
              <p className="text-white/60 text-sm">Enter a topic or concept</p>
              <p className="text-white/40 text-xs mt-2">{remaining} free uses remaining</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <ChatMessage key={i} message={msg} isUser={msg.isUser} />
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/5 rounded-2xl px-4 py-3">
                <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input */}
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          loading={loading}
          placeholder="Write a hook about Brooklyn nights..."
        />
      </div>
    </AgentContainer>
  );
};

const BattleAgent = ({ onBack }) => {
  const [messages, setMessages] = useState([
    { text: "Yo, step up to the mic if you think you're raw / I'll chew you up and spit you out, that's the law.", isUser: false }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { canUse, remaining, consume } = useUsageLimit('battle');
  const { canRequest, recordRequest, getWaitTime } = useCooldown();
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSubmit = async () => {
    if (!input.trim() || loading) return;
    
    if (!canRequest()) {
      return;
    }
    
    if (!canUse) {
      setMessages(prev => [...prev, { 
        text: 'Free limit reached. Upgrade to continue.', 
        isUser: false 
      }]);
      return;
    }
    
    const userMessage = { text: input, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    
    try {
      consume();
      recordRequest();
      
      const systemPrompt = `You are a fierce battle rapper. Respond to the opponent's bar with a 2-4 line diss verse. Be aggressive, witty, and make it rhyme. Keep it under 200 characters.`;
      
      const response = await ApiService.generate(`Opponent says: "${input}". Respond with a diss.`, systemPrompt);
      setMessages(prev => [...prev, { text: response, isUser: false }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        text: 'Failed to generate. Please try again.', 
        isUser: false 
      }]);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <AgentContainer title="Rap Battle" icon={Flame} accentColor="red" onBack={onBack}>
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.isUser 
                  ? 'bg-red-600/20 border border-red-500/30 text-white' 
                  : 'bg-white/5 text-white border border-white/5'
              }`}>
                <div className="text-[10px] font-bold mb-1 text-white/50">
                  {msg.isUser ? '► YOU' : '◄ RIVAL MC'}
                </div>
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/5 rounded-2xl px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-bounce" style={{animationDelay: '0ms'}} />
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-bounce" style={{animationDelay: '150ms'}} />
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-bounce" style={{animationDelay: '300ms'}} />
                </div>
                <span className="text-red-400 text-xs">RIVAL WRITING...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          loading={loading}
          placeholder="Spit your bars..."
        />
      </div>
    </AgentContainer>
  );
};

// Generic Chat Agent for other tools
const GenericChatAgent = ({ agentId, title, icon, accentColor, systemPrompt, placeholder, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { canUse, remaining, consume } = useUsageLimit(agentId);
  const { canRequest, recordRequest } = useCooldown();
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSubmit = async () => {
    if (!input.trim() || loading || !canRequest() || !canUse) return;
    
    const userMessage = { text: input, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    
    try {
      consume();
      recordRequest();
      const response = await ApiService.generate(input, systemPrompt);
      setMessages(prev => [...prev, { text: response, isUser: false }]);
    } catch (error) {
      setMessages(prev => [...prev, { text: 'Failed to generate.', isUser: false, error: error.message }]);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <AgentContainer title={title} icon={icon} accentColor={accentColor} onBack={onBack}>
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-16">
              {React.createElement(icon, { size: 48, className: `mx-auto mb-4 text-${accentColor}-500/30` })}
              <p className="text-white/60 text-sm">{placeholder}</p>
              <p className="text-white/40 text-xs mt-2">{remaining} free uses remaining</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <ChatMessage key={i} message={msg} isUser={msg.isUser} />
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/5 rounded-2xl px-4 py-3">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <ChatInput value={input} onChange={setInput} onSubmit={handleSubmit} loading={loading} placeholder={placeholder} />
      </div>
    </AgentContainer>
  );
};

// =============================================================================
// PAGES
// =============================================================================

const StudioPage = ({ onSelectAgent }) => {
  const agents = [
    { id: 'ghostwriter', title: 'Ghostwriter', subtitle: 'AI Lyric Engine', icon: Sparkles, gradient: 'agent-gradient-ghostwriter' },
    { id: 'songwriter', title: 'Songwriter', subtitle: 'Studio Writer', icon: Feather, gradient: 'agent-gradient-promokit' },
    { id: 'battle', title: 'Rap Battle', subtitle: 'Battle Simulator', icon: Flame, gradient: 'agent-gradient-viralvideo' },
    { id: 'crates', title: 'Crate Digger', subtitle: 'Sample Discovery', icon: Disc, gradient: 'agent-gradient-beatlab' },
    { id: 'ar_suite', title: 'A&R Office', subtitle: 'Artist Development', icon: Briefcase, gradient: 'agent-gradient-coverart' },
    { id: 'viral_video', title: 'Viral Video', subtitle: 'Content Strategy', icon: Video, gradient: 'agent-gradient-viralvideo' },
    { id: 'trend_hunter', title: 'Trend Hunter', subtitle: 'Real-Time Intel', icon: Hash, gradient: 'agent-gradient-trendhunter' },
    { id: 'album_art', title: 'Album Art', subtitle: 'Visual Generator', icon: ImageIcon, gradient: 'agent-gradient-coverart' },
  ];
  
  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0b]">
      <div className="px-4 pt-6 pb-4 safe-top">
        <h1 className="text-2xl font-bold text-white">Studio</h1>
        <p className="text-white/50 text-sm mt-1">AI-powered creative tools</p>
      </div>
      
      <div className="px-4 pb-24 grid grid-cols-2 gap-3">
        {agents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => onSelectAgent(agent.id)}
            className={`${agent.gradient} p-4 rounded-2xl text-left transition-all active:scale-[0.98]`}
          >
            <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center mb-3">
              <agent.icon size={20} className="text-white" />
            </div>
            <h3 className="text-white font-semibold text-sm">{agent.title}</h3>
            <p className="text-white/70 text-xs mt-0.5">{agent.subtitle}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

const NewsPage = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      const news = await ApiService.getNews();
      setArticles(news);
      setLoading(false);
    };
    fetchNews();
  }, []);
  
  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0b]">
      <div className="px-4 pt-6 pb-4 safe-top flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">News</h1>
          <p className="text-white/50 text-sm mt-1">Hip-hop industry updates</p>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center"
        >
          <RefreshCw size={18} className="text-white/60" />
        </button>
      </div>
      
      <div className="px-4 pb-24 space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="shimmer h-24 rounded-2xl" />
          ))
        ) : articles.length > 0 ? (
          articles.map((article, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center shrink-0">
                  <Newspaper size={18} className="text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium text-sm line-clamp-2">{article.title}</h3>
                  <p className="text-white/50 text-xs mt-1 line-clamp-2">{article.content}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-white/40 text-[10px]">{article.source}</span>
                    <span className="text-white/20">•</span>
                    <span className="text-white/40 text-[10px]">{article.time || article.date}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <Newspaper size={48} className="mx-auto mb-4 text-white/20" />
            <p className="text-white/50 text-sm">No news available</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ComeUpPage = () => {
  const pillars = [
    { id: 'craft', title: 'Master Your Craft', subtitle: 'The 10,000 Hour Truth', icon: Music, color: 'from-cyan-500 to-blue-600' },
    { id: 'business', title: 'Own Your Business', subtitle: 'Money & Masters', icon: Briefcase, color: 'from-amber-500 to-orange-600' },
    { id: 'network', title: 'Build Your Network', subtitle: 'Relationships Matter', icon: User, color: 'from-green-500 to-emerald-600' },
    { id: 'brand', title: 'Define Your Brand', subtitle: 'Stand Out', icon: Zap, color: 'from-pink-500 to-rose-600' },
  ];
  
  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0b]">
      <div className="px-4 pt-6 pb-4 safe-top">
        <h1 className="text-2xl font-bold text-white">The Come Up</h1>
        <p className="text-white/50 text-sm mt-1">Your path to success</p>
      </div>
      
      <div className="px-4 pb-24 space-y-3">
        {pillars.map((pillar) => (
          <button 
            key={pillar.id}
            className={`w-full bg-gradient-to-r ${pillar.color} p-5 rounded-2xl text-left flex items-center gap-4 transition-all active:scale-[0.98]`}
          >
            <div className="w-12 h-12 rounded-xl bg-black/20 flex items-center justify-center">
              <pillar.icon size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold">{pillar.title}</h3>
              <p className="text-white/70 text-sm">{pillar.subtitle}</p>
            </div>
            <ChevronRight size={20} className="text-white/50" />
          </button>
        ))}
      </div>
    </div>
  );
};

// =============================================================================
// MAIN APP
// =============================================================================

const App = () => {
  const [activeTab, setActiveTab] = useState('studio');
  const [selectedAgent, setSelectedAgent] = useState(null);
  
  const handleSelectAgent = (agentId) => {
    setSelectedAgent(agentId);
  };
  
  const handleBackFromAgent = () => {
    setSelectedAgent(null);
  };
  
  // Render agent if selected
  if (selectedAgent) {
    const agentProps = { onBack: handleBackFromAgent };
    
    switch (selectedAgent) {
      case 'ghostwriter':
        return <GhostwriterAgent {...agentProps} />;
      case 'battle':
        return <BattleAgent {...agentProps} />;
      case 'songwriter':
        return <GenericChatAgent agentId="songwriter" title="Songwriter" icon={Feather} accentColor="green" systemPrompt="You are a professional songwriter. Help create hooks, verses, bridges, and full songs." placeholder="Describe your song concept..." {...agentProps} />;
      case 'crates':
        return <GenericChatAgent agentId="crates" title="Crate Digger" icon={Disc} accentColor="amber" systemPrompt="You are an expert sample finder. Suggest obscure records, breaks, and samples based on the vibe requested." placeholder="What kind of sound are you looking for?" {...agentProps} />;
      case 'ar_suite':
        return <GenericChatAgent agentId="ar_suite" title="A&R Office" icon={Briefcase} accentColor="violet" systemPrompt="You are an A&R executive. Provide honest feedback on music concepts, commercial viability, and artist development advice." placeholder="Describe your track or concept..." {...agentProps} />;
      case 'viral_video':
        return <GenericChatAgent agentId="viral_video" title="Viral Video" icon={Video} accentColor="red" systemPrompt="You are a viral content strategist. Create concepts for TikTok, Reels, and Shorts optimized for engagement." placeholder="Describe your song or vibe..." {...agentProps} />;
      case 'trend_hunter':
        return <GenericChatAgent agentId="trend_hunter" title="Trend Hunter" icon={Hash} accentColor="cyan" systemPrompt="You are a social media trend analyst. Identify what's trending in music and culture right now." placeholder="What trends are you curious about?" {...agentProps} />;
      case 'album_art':
        return <GenericChatAgent agentId="album_art" title="Album Art" icon={ImageIcon} accentColor="pink" systemPrompt="You are an album art conceptualist. Describe visual concepts for album covers based on the music's mood and themes." placeholder="Describe your project's vibe..." {...agentProps} />;
      default:
        setSelectedAgent(null);
        return null;
    }
  }
  
  // Render main tabs
  const renderContent = () => {
    switch (activeTab) {
      case 'studio':
        return <StudioPage onSelectAgent={handleSelectAgent} />;
      case 'comeup':
        return <ComeUpPage />;
      case 'news':
        return <NewsPage />;
      default:
        return <StudioPage onSelectAgent={handleSelectAgent} />;
    }
  };
  
  const tabs = [
    { id: 'studio', label: 'Studio', icon: Zap },
    { id: 'comeup', label: 'Come Up', icon: TrendingUp },
    { id: 'news', label: 'News', icon: Newspaper },
  ];
  
  return (
    <div className="h-screen flex flex-col bg-[#0a0a0b] overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
      
      {/* Bottom Navigation */}
      <nav className="bg-[#141416] border-t border-white/5 safe-bottom">
        <div className="flex justify-around py-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center py-2 px-6 rounded-xl transition-all ${
                activeTab === tab.id 
                  ? 'text-indigo-400' 
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              <tab.icon size={22} />
              <span className="text-[10px] mt-1 font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default App;
