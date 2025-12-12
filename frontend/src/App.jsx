import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Terminal, Play, Pause, Rewind, ShoppingBag, Radio, ShieldAlert, Phone, Disc, Cpu, 
  X, Maximize2, Minus, FileText, Film, Mic, MessageSquare, Sparkles, Music, Video, 
  Share2, Heart, MessageCircle, CreditCard, Lock, Truck, CheckCircle, MapPin, 
  Calendar, Ticket, Flame, Search, Database, Globe, Newspaper, ExternalLink, User, 
  Hash, Grid, Headphones, Activity, Zap, Wallet, Power, Sliders, Briefcase, 
  RefreshCw, ToggleLeft, ToggleRight, Filter, Plus, Trash2, Edit2, Upload,
  Camera, TrendingUp, Users, Image as ImageIcon, Link as LinkIcon, Loader2
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot, addDoc, updateDoc, deleteDoc, query, orderBy, serverTimestamp, arrayUnion, where, getDocs } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL, uploadBytes } from 'firebase/storage';

// --- FIREBASE SETUP ---
let app = null;
let auth = null;
let db = null;
let storage = null;

try {
  if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    const firebaseConfig = JSON.parse(__firebase_config);
    if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "demo") {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);
      storage = getStorage(app);
    }
  }
} catch (e) {
  console.error("Firebase initialization failed:", e);
}

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- GEMINI API HELPERS ---
// API key removed - all requests route through Railway backend proxy
const apiKey = ""; 

// ------------------------------------------------------------------
// <<< THIS IS WHERE YOU PLUG IN THE BACKEND URL LOGIC >>>
// ------------------------------------------------------------------
const isLocal = window.location.hostname === 'localhost';
const BACKEND_URL = isLocal
  ? 'http://localhost:3001/api/generate' // Use your local backend URL here
  : 'https://restored-os-whip-montez-production.up.railway.app/api/generate'; // Railway production URL
// ------------------------------------------------------------------

const callGemini = async (prompt, systemInstruction = "", useSearch = false) => {
  // Function to return mock data (fallback only if backend fails after all retries)
  const getMockResponse = () => {
      if (prompt.includes("Album Cover")) {
           // A tiny, transparent mock PNG base64 string
           const mockImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="; 
           return JSON.stringify({ predictions: [{ bytesBase64Encoded: mockImageBase64 }] }); // Mock base64 data for image
      }
      if (systemInstruction.includes("battle rapper")) {
          return "Yo, your rhymes are weak, your style is obsolete / I crash your whole system with one delete / You claiming the throne? You must be joking / My flow is the code that leaves you broken.";
      }
      if (systemInstruction.includes("Viral Video Agent")) {
          return JSON.stringify([
              { concept: "The 360 Spin", visual: "Whip performs a smooth, continuous 360 camera spin, catching three different outfit changes.", trend: "Seamless Transition", shots: ["Wide shot 360 cam", "Close up on transition points"] },
              { concept: "Matrix Glitch", visual: "Whip freezes mid-move, the background glitches into neon data streams, and she 'reboots' to finish the bar.", trend: "Aesthetic Glitchcore", shots: ["High frame rate slow-mo", "Green screen overlay"] },
              { concept: "Phone Booth Cipher", visual: "Whip delivers bars inside an old NYC phone booth while neon rain streams down the glass.", trend: "Cinematic Mood", shots: ["Exterior low light", "Interior close-up on mic"] }
          ]);
      }
      if (systemInstruction.includes("crate digger")) {
          return JSON.stringify([
              { artist: "The Honey Drippers", track: "Impeach the President", year: "1973", desc: "Classic drum break used by everyone." },
              { artist: "Bob James", track: "Nautilus", year: "1974", desc: "Haunting keys, bassline crazy." },
              { artist: "Skull Snaps", track: "It's A New Day", year: "1973", desc: "Hardest drums in the game." }
          ]);
      }
      if (systemInstruction.includes("A&R")) {
          return JSON.stringify({ critique: "The flow is tight but needs more aggression. Hook is catchy, but the delivery needs more energy.", commercial: 8, street: 6 });
      }
      if (systemInstruction.includes("Whip Montez")) {
          return "Yo, I'm from the concrete jungle where dreams are made / But nightmares lurk in the shade / I hustle hard just to get paid / In this game of life, I never fade.\n\nBrooklyn stand up, we in the building / Stacking paper to the ceiling / This is how I'm feeling / Real talk, no concealing.";
      }
      return "DATA CORRUPTION. UNABLE TO PROCESS REQUEST.";
  };

  // Always try backend proxy first (no early simulation mode bailout)
  const delays = [1000, 2000, 4000, 8000, 16000];
  
  // Image generation also routes through backend proxy (was previously direct to Gemini)
  if (prompt.includes("Album Cover")) {
    // Route through backend instead of direct API call
    for (let i = 0; i <= delays.length; i++) {
      try {
        const response = await fetch(BACKEND_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, systemInstruction: "Generate an album cover image description" })
        });

        if (!response.ok) {
          if ((response.status === 429 || response.status >= 500) && i < delays.length) {
            await new Promise(resolve => setTimeout(resolve, delays[i]));
            continue;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return JSON.stringify(data);
      } catch (error) {
        console.error("Album art backend call failed:", error);
        if (i === delays.length) {
          return getMockResponse();
        }
        await new Promise(resolve => setTimeout(resolve, delays[i]));
      }
    }
  }


  // Route text generation through backend proxy (uses server-side API key)
  for (let i = 0; i <= delays.length; i++) {
    try {
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, systemInstruction })
      });

      if (!response.ok) {
        if ((response.status === 429 || response.status >= 500) && i < delays.length) {
          await new Promise(resolve => setTimeout(resolve, delays[i]));
          continue;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const output = data?.output ?? data?.message ?? data;
      return typeof output === "string" ? output : JSON.stringify(output);
    } catch (error) {
      console.error("Backend proxy call failed:", error);
      if (i === delays.length) {
        return getMockResponse();
      }
      await new Promise(resolve => setTimeout(resolve, delays[i]));
    }
  }
};

// Shared free-usage limiter for AI agents (client-side tracking, per browser)
const useFreeLimit = (agentKey, limit = 3) => {
  const [usage, setUsage] = useState(0);

  useEffect(() => {
    try {
      const stored = Number(localStorage.getItem(agentKey));
      if (Number.isFinite(stored)) setUsage(stored);
    } catch (err) {
      console.warn(`Usage load failed for ${agentKey}`, err);
    }
  }, [agentKey]);

  const consume = () => {
    const next = usage + 1;
    setUsage(next);
    try {
      localStorage.setItem(agentKey, String(next));
    } catch (err) {
      console.warn(`Usage persist failed for ${agentKey}`, err);
    }
  };

  const reset = () => {
    setUsage(0);
    try {
      localStorage.removeItem(agentKey);
    } catch (err) {
      console.warn(`Usage reset failed for ${agentKey}`, err);
    }
  };

  return { usage, limit, canUse: usage < limit, consume, reset };
};

// Voice recognition hook for speech-to-text
const useVoiceInput = (onResult) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onResult]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Failed to start recognition:', error);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  return { isListening, isSupported, startListening, stopListening };
};

// Helper function to save generations to Firestore
const saveToLibrary = async (user, type, content, metadata = {}) => {
  if (!user || user.isAnonymous) {
    const shouldSignIn = confirm('Sign in to save your creations to your library. Continue to sign in?');
    if (shouldSignIn) {
      return 'auth_required';
    }
    return null;
  }

  if (!db) {
    alert('Save feature not available in demo mode');
    return null;
  }

  try {
    const docRef = await addDoc(collection(db, 'user_library'), {
      userId: user.uid,
      type: type, // 'album_art', 'video_concept', 'lyrics', 'battle', 'samples', etc.
      content: content,
      metadata: {
        ...metadata,
        userEmail: user.email,
      },
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Save failed:', error);
    throw error;
  }
};

// --- COMPONENTS ---

// 0. REIMAGINED LIVEWIRE LOGO (VECTOR STYLE)
const LivewireLogo = () => (
  <div className="flex flex-col items-end group cursor-pointer select-none pl-4 md:pl-8">
    <div className="relative">
      <div className="absolute -inset-6 md:-inset-10 bg-green-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="relative z-10">
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-black italic tracking-tighter text-white transform -skew-x-12 leading-[0.85] group-hover:text-green-50 transition-colors" 
            style={{ textShadow: '2px 2px 0px #000, 0 0 15px rgba(0,255,65,0.3)' }}>
          LIVEWIRE
        </h1>
      </div>
      <span className="text-[8px] md:text-[10px] font-mono font-bold tracking-[0.25em] md:tracking-[0.35em] text-gray-500 uppercase mt-2 md:mt-4 mr-1 group-hover:text-[#00ff41] transition-colors block text-right z-20">
        ENTERTAINMENT NYC
      </span>
    </div>
  </div>
);

// 1. BOOT SEQUENCE
const BootSequence = ({ onComplete }) => {
  const [lines, setLines] = useState([]);
  
  const bootSequenceData = [
    { text: "MONTEZ SYSTEMS BIOS v2.0 [NYC_CORE]", style: "text-[#00ff41]" },
    { text: "COPYRIGHT (C) 1999-2004 LIVEWIRE ENTERTAINMENT", style: "text-[#00ff41]" },
    { text: "CPU: INTEL PENTIUM 4 3.2GHz [OVERCLOCKED]", style: "text-[#00ff41]" },
    { text: "MEMORY TEST: 1024MB OK", style: "text-[#00ff41]" },
    { text: "DETECTING PRIMARY MASTER ... WDC WD800BB", style: "text-[#00ff41]" },
    { text: "LOADING KERNEL... [OK]", style: "text-[#00ff41]" },
    { text: "MOUNTING VOLUME: 'THE STOOP'...", style: "text-[#00ff41]" },
    { text: "SEARCHING DIRECTORY: /MUSIC/ALBUMS/...", style: "text-[#00ff41]" },
    { text: "ACCESSING: 'FEMALE HUSTLE' MASTER TAPES...", style: "text-yellow-500 animate-pulse" },
    { text: "CRITICAL ERROR: ALBUM 'FEMALE HUSTLE' NOT FOUND.", style: "text-red-600 font-black text-2xl tracking-widest glitch-text" },
    { text: "FILE CORRUPTION DETECTED AT SECTOR 7G.", style: "text-red-500" },
    { text: "INITIATING RECOVERY PROTOCOL...", style: "text-yellow-500" },
    { text: "RESTORING FRAGMENTS FROM CACHE...", style: "text-[#00ff41]" },
    { text: "LOADING USER INTERFACE...", style: "text-[#00ff41]" },
    { text: "SYSTEM READY.", style: "text-[#00ff41] bg-black border border-[#00ff41] inline-block px-2" }
  ];

  useEffect(() => {
    let delay = 0;
    const timeouts = []; // Store timeouts to clear them

    bootSequenceData.forEach((item, index) => {
      const isError = item.text.includes("ERROR");
      const isRecovery = item.text.includes("RECOVERY");
      
      const stepDelay = isError ? 1500 : isRecovery ? 2000 : Math.random() * 300 + 100;
      delay += stepDelay;

      const timeoutId = setTimeout(() => {
        setLines(prev => [...prev, item]);
        const el = document.getElementById('boot-log');
        if(el) el.scrollTop = el.scrollHeight;
        
        if (index === bootSequenceData.length - 1) {
          const finalTimeoutId = setTimeout(onComplete, 1200);
          timeouts.push(finalTimeoutId);
        }
      }, delay);
      
      timeouts.push(timeoutId);
    });

    // Cleanup function to prevent duplication in StrictMode/Remounts
    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, []); // Run only once on mount

  return (
    <div className="h-screen w-full bg-black flex flex-col justify-start p-4 sm:p-6 md:p-10 font-mono text-sm sm:text-base md:text-xl z-50 absolute top-0 left-0 overflow-hidden">
      <div id="boot-log" className="overflow-y-auto h-full space-y-1">
        {lines.map((line, i) => (
          <div key={i} className={`typing-effect ${line.style}`}>
            {`> ${line.text}`}
          </div>
        ))}
        <div className="w-2 h-3 sm:w-3 sm:h-5 bg-[#00ff41] animate-pulse inline-block ml-2"></div>
      </div>
    </div>
  );
};

// Background Carousel Component
const BackgroundCarousel = ({ images }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const defaultImages = [
    'https://images.unsplash.com/photo-1601933470096-0e346346c792?w=1600&h=900&fit=crop&q=80',
    'https://images.unsplash.com/photo-1555353540-64580b51c258?w=1600&h=900&fit=crop&q=80',
  ];

  const displayImages = images && images.length > 0 ? images : defaultImages;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % displayImages.length);
    }, 8000); 

    return () => clearInterval(interval);
  }, [displayImages.length]);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {displayImages.map((img, index) => (
        <img
          key={index}
          src={img}
          alt={`Background ${index + 1}`}
          className={`absolute inset-0 w-full h-full object-cover object-center ken-burns-anim transition-opacity duration-1000 ${
            index === currentImageIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
          } filter grayscale brightness-50 contrast-125 sepia-25`}
        />
      ))}
      <div className="absolute inset-0 bg-black/70 z-20"></div>
    </div>
  );
};

// 2. HOME
const Home = ({ setSection }) => {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [newsIndex, setNewsIndex] = useState(0);
  const headlines = [
    "WHIP MONTEZ SIGNS TO LIVEWIRE",
    "GMAIL LAUNCHES BETA // 1GB FREE",
    "HALO 2 BREAKS SALES RECORDS",
    "NEW MIXTAPE 'RED HOOK DIARIES' LEAKED",
    "JAY-Z RETIRES? BLACK ALBUM FALLOUT"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setNewsIndex(prev => (prev + 1) % headlines.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const homeCarouselImages = [
    'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1600&h=900&fit=crop&q=80',
    'https://images.unsplash.com/photo-1576186726580-a816e8b12896?w=1600&h=900&fit=crop&q=80',
    'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?w=1600&h=900&fit=crop&q=80',
    'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=1600&h=900&fit=crop&q=80'
  ];

  const widgets = [
    {
      id: 'news',
      title: 'THE FEED',
      subtitle: 'DAILY_NEWS_LOG',
      icon: Activity,
      color: 'text-cyan-400',
      borderColor: 'border-cyan-400',
      hoverBg: 'hover:bg-cyan-400/10',
      shadow: 'group-hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]',
      content: headlines[newsIndex],
      action: () => setSection('news')
    },
    {
      id: 'music',
      title: 'THE TAPES',
      subtitle: 'AUDIO_ARCHIVE_V1',
      icon: Radio,
      color: 'text-[#00ff41]',
      borderColor: 'border-[#00ff41]',
      hoverBg: 'hover:bg-[#00ff41]/10',
      shadow: 'group-hover:shadow-[0_0_20px_rgba(0,255,65,0.3)]',
      content: '5 UNRELEASED ALBUMS',
      action: () => setSection('music')
    },
    {
      id: 'style',
      title: 'SUPPLY',
      subtitle: 'MERCH_DROP_04',
      icon: ShoppingBag,
      color: 'text-purple-400',
      borderColor: 'border-purple-400',
      hoverBg: 'hover:bg-purple-400/10',
      shadow: 'group-hover:shadow-[0_0_20px_rgba(192,132,252,0.3)]',
      content: 'LIMITED STOCK: LIVE',
      action: () => setSection('style')
    },
    {
      id: 'studio',
      title: 'THE LAB',
      subtitle: 'PRODUCTION_SUITE',
      icon: Sliders,
      color: 'text-pink-500',
      borderColor: 'border-pink-500',
      hoverBg: 'hover:bg-pink-500/10',
      shadow: 'group-hover:shadow-[0_0_20px_rgba(236,72,153,0.3)]',
      content: 'MAKE BEATS / BATTLE',
      action: () => setSection('studio')
    },
    {
      id: 'tour',
      title: 'WORLD TOUR',
      subtitle: 'LOG_DATES_2004',
      icon: MapPin,
      color: 'text-yellow-400',
      borderColor: 'border-yellow-400',
      hoverBg: 'hover:bg-yellow-400/10',
      shadow: 'group-hover:shadow-[0_0_20px_rgba(250,204,21,0.3)]',
      content: 'EAST COAST LEG',
      action: () => setSection('tour')
    }
  ];

  return (
    <div className="relative h-full w-full overflow-y-auto overflow-x-hidden flex flex-col font-sans" style={{WebkitOverflowScrolling: 'touch'}}>
      <BackgroundCarousel images={homeCarouselImages} />
      
      <div className="relative z-30 flex-1 flex flex-col justify-between p-3 md:p-12 bg-gradient-to-t from-black via-transparent to-black/40 min-h-full">
        
        {/* Top Section: Branding */}
        <div className="flex justify-between items-start w-full mb-4 md:mb-0">
          <div className="animate-fade-in">
            <h1 className="chrome-text text-4xl sm:text-6xl md:text-9xl font-black uppercase tracking-tighter leading-none opacity-90 drop-shadow-2xl">
              Whip<br/>Montez
            </h1>
            <div className="flex items-center gap-2 mt-2 md:mt-4">
              <div className="h-[2px] w-8 md:w-12 bg-[#00ff41]"></div>
              <p className="text-[#00ff41] text-[9px] md:text-xs tracking-[0.2em] md:tracking-[0.3em] font-mono bg-black/50 px-2">RESTORED_SESSION_2004</p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2 md:gap-4">
            <LivewireLogo />

            <div className="hidden md:block text-right">
               <div className="text-white font-mono text-xs opacity-50">SYSTEM_STATUS</div>
               <div className="text-[#00ff41] font-mono text-sm animate-pulse">ONLINE</div>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-[20px]"></div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 w-full pb-4">
          {widgets.map((widget, i) => (
            <div 
              key={widget.id}
              onClick={widget.action}
              onMouseEnter={() => setHoveredItem(widget.title)}
              onMouseLeave={() => setHoveredItem(null)}
              className={`
                group relative h-28 md:h-32 border-t-2 bg-black/80 backdrop-blur-md p-3 md:p-4 cursor-pointer transition-all duration-300
                flex flex-col justify-between overflow-hidden active:scale-95
                ${widget.borderColor} ${widget.hoverBg} ${widget.shadow} hover:-translate-y-2
              `}
            >
              <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.2)_50%)] bg-[length:100%_4px] pointer-events-none opacity-50"></div>
              
              <div className="flex justify-between items-start relative z-10">
                 <widget.icon size={20} className={`md:w-6 md:h-6 ${widget.color} transition-transform group-hover:scale-110 duration-300`} />
                 <span className="text-[9px] md:text-[10px] font-mono text-gray-500 group-hover:text-white transition-colors">{String(i + 1).padStart(2, '0')}</span>
              </div>

              <div className="relative z-10">
                 <h3 className={`text-base md:text-xl font-black uppercase tracking-tight text-white leading-none mb-1 group-hover:tracking-widest transition-all duration-300`}>
                   {widget.title}
                 </h3>
                 <div className={`text-[8px] md:text-[9px] font-mono uppercase tracking-wider ${widget.color} truncate`}>
                   {widget.id === 'news' ? (
                     <span className="animate-pulse">{'>'} {widget.content}</span>
                   ) : (
                     <>{'>'} {widget.subtitle}</>
                   )}
                 </div>
              </div>

              <div className={`absolute -bottom-10 -right-10 w-20 h-20 md:w-24 md:h-24 ${widget.color.replace('text-', 'bg-')}/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

// 4. BIO SECTION
const Bio = ({ setSection }) => {
  const [viewMode, setViewMode] = useState('bio'); // 'bio' or 'memory'
  const [photos, setPhotos] = useState([]);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Load photos from Firebase on mount
  useEffect(() => {
    if (!db) return;
    
    const loadPhotos = async () => {
      try {
        const photosRef = collection(db, 'memoryLane');
        const q = query(photosRef, orderBy('uploadedAt', 'desc'));
        const snapshot = await getDocs(q);
        const photoList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPhotos(photoList);
      } catch (err) {
        console.log('Error loading photos:', err);
      }
    };
    
    loadPhotos();
  }, []);

  // Upload photo to Firebase (admin only)
  const handleUpload = async () => {
    if (!uploadFile || !storage || !db) return;
    
    setUploading(true);
    try {
      // Upload to Firebase Storage
      const storageRef = ref(storage, `memory-lane/${Date.now()}_${uploadFile.name}`);
      await uploadBytes(storageRef, uploadFile);
      const url = await getDownloadURL(storageRef);
      
      // Save metadata to Firestore
      await addDoc(collection(db, 'memoryLane'), {
        url,
        caption: '',
        uploadedAt: new Date().toISOString()
      });
      
      // Reload photos
      const photosRef = collection(db, 'memoryLane');
      const q = query(photosRef, orderBy('uploadedAt', 'desc'));
      const snapshot = await getDocs(q);
      const photoList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPhotos(photoList);
      
      setUploadFile(null);
      alert('Photo uploaded successfully!');
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload failed');
    }
    setUploading(false);
  };

  return (
    <div className="h-full w-full relative overflow-hidden flex items-center justify-center p-2 md:p-4">
      <BackgroundCarousel images={[]} />
      <div className="absolute inset-0 bg-black/60 z-10"></div>
      
      {/* Main Profile Container - 2004 Flash Site Style */}
      <div className="relative z-30 w-full max-w-5xl h-[90vh] md:h-[85vh] bg-[#0f0f0f] border-2 border-[#333] flex flex-col md:flex-row shadow-2xl overflow-hidden">
        
        {/* Left Sidebar: ID Card / Navigation */}
        <div className="w-full md:w-80 bg-[#111] border-b md:border-r md:border-b-0 border-[#333] p-3 md:p-6 flex flex-row md:flex-col gap-3 md:gap-6 overflow-x-auto md:overflow-x-visible shrink-0">
           <div className="w-32 h-32 md:w-full md:aspect-square bg-[#222] border-4 border-[#333] relative overflow-hidden group shrink-0">
             <img 
               src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=800&q=80" 
               className="w-full h-full object-cover grayscale contrast-125 group-hover:scale-110 transition-transform duration-500" 
               alt="Whip Montez"
             />
             <div className="absolute bottom-1 right-1 md:bottom-2 md:right-2 bg-[#00ff41] text-black text-[9px] md:text-xs font-bold px-1 md:px-2 py-0.5 animate-pulse">
                 ONLINE
             </div>
           </div>

           <div className="flex-1 md:flex-none space-y-1">
             <h2 className="text-lg md:text-2xl font-black text-white tracking-tighter uppercase">Whip Montez</h2>
             <p className="text-[#00ff41] font-mono text-[10px] md:text-xs">RED HOOK, BROOKLYN</p>
             <p className="text-gray-500 font-mono text-[10px] md:text-xs">LIVEWIRE RECORDS</p>
           
             <div className="hidden md:block md:flex-1 space-y-2 pt-4">
               <button onClick={() => setSection('music')} className="w-full bg-[#1a1a1a] border border-[#333] text-gray-300 py-3 text-xs font-bold tracking-widest hover:bg-[#00ff41] hover:text-black hover:border-[#00ff41] transition-all flex items-center justify-center gap-2">
                   <Disc size={14}/> DISCOGRAPHY
               </button>
               <button onClick={() => setSection('tour')} className="w-full bg-[#1a1a1a] border border-[#333] text-gray-300 py-3 text-xs font-bold tracking-widest hover:bg-[#00ff41] hover:text-black hover:border-[#00ff41] transition-all flex items-center justify-center gap-2">
                   <Calendar size={14}/> TOUR DATES
               </button>
               <button onClick={() => setSection('news')} className="w-full bg-[#1a1a1a] border border-[#333] text-gray-300 py-3 text-xs font-bold tracking-widest hover:bg-[#00ff41] hover:text-black hover:border-[#00ff41] transition-all flex items-center justify-center gap-2">
                   <Newspaper size={14}/> NEWS
               </button>
               <button onClick={() => window.open('https://www.youtube.com/results?search_query=90s+hip+hop', '_blank')} className="w-full bg-[#1a1a1a] border border-[#333] text-gray-300 py-3 text-xs font-bold tracking-widest hover:bg-[#00ff41] hover:text-black hover:border-[#00ff41] transition-all flex items-center justify-center gap-2">
                   <Video size={14}/> VIDEOS
               </button>
             </div>

             <div className="hidden md:block border-t border-[#333] pt-4 mt-4">
               <p className="text-[10px] text-gray-500 font-mono mb-2">MANAGEMENT:</p>
               <div className="text-xs text-white font-bold">JARI MONTEZ (Brother/Manager)</div>
               <div className="text-xs text-gray-400">jari@livewire-ent.com</div>
             </div>
           </div>
        </div>

        {/* Right Content: Bio Text & Stats */}
        <div className="flex-1 bg-[#0a0a0a] flex flex-col relative overflow-hidden min-h-0">
           {/* Header */}
           <div className="h-10 md:h-16 bg-[#00ff41] text-black px-3 md:p-4 flex justify-between items-center shrink-0">
             <h1 className="text-lg md:text-4xl font-black tracking-tighter">
               {viewMode === 'bio' ? 'OFFICIAL PROFILE' : 'MEMORY LANE'}
             </h1>
             <div className="flex items-center gap-2">
               {/* Toggle Buttons */}
               <button
                 onClick={() => setViewMode('bio')}
                 className={`px-2 md:px-4 py-1 md:py-2 text-[10px] md:text-xs font-bold transition-all ${
                   viewMode === 'bio' ? 'bg-black text-[#00ff41]' : 'bg-black/20 text-black hover:bg-black/40'
                 }`}
               >
                 BIO
               </button>
               <button
                 onClick={() => setViewMode('memory')}
                 className={`px-2 md:px-4 py-1 md:py-2 text-[10px] md:text-xs font-bold transition-all ${
                   viewMode === 'memory' ? 'bg-black text-[#00ff41]' : 'bg-black/20 text-black hover:bg-black/40'
                 }`}
               >
                 <Camera size={12} className="inline mr-1" />
                 MEMORY
               </button>
             </div>
           </div>

           {/* Scrollable Content */}
           <div className="flex-1 overflow-y-auto p-3 md:p-8 overscroll-contain" style={{WebkitOverflowScrolling: 'touch'}}>
             {viewMode === 'bio' ? (
               // BIO CONTENT
               <div className="max-w-2xl mx-auto space-y-4 md:space-y-8">
                 
                 {/* Quote */}
                 <blockquote className="border-l-4 border-[#00ff41] pl-6 py-2">
                   <p className="text-xl md:text-2xl font-bold text-white italic leading-relaxed">
                      "I’ve paid my dues… I’ve developed my skills… I am ready."
                   </p>
                 </blockquote>

                 {/* Stats Grid */}
                 <div className="grid grid-cols-2 gap-3 md:gap-4 border-y border-[#333] py-4 md:py-6 my-4 md:my-6">
                   <div>
                      <div className="text-[9px] md:text-[10px] text-gray-500 font-mono uppercase">Name</div>
                      <div className="text-[#00ff41] font-bold text-xs md:text-base">Wanda Altagracia Almonte</div>
                   </div>
                   <div>
                      <div className="text-[9px] md:text-[10px] text-gray-500 font-mono uppercase">Origin</div>
                      <div className="text-[#00ff41] font-bold text-xs md:text-base">Red Hook, Brooklyn</div>
                   </div>
                   <div>
                      <div className="text-[9px] md:text-[10px] text-gray-500 font-mono uppercase">Key Features</div>
                      <div className="text-[#00ff41] font-bold text-xs md:text-base">Erick Sermon, Talib Kweli</div>
                   </div>
                   <div>
                      <div className="text-[9px] md:text-[10px] text-gray-500 font-mono uppercase">Education</div>
                      <div className="text-[#00ff41] font-bold text-xs md:text-base">LaGuardia HS (Dance)</div>
                   </div>
                 </div>

                 {/* The Story */}
                 <div className="prose prose-invert prose-sm font-mono text-gray-300 leading-relaxed space-y-4 md:space-y-6 text-xs md:text-sm">
                   <p className="first-letter:text-3xl md:first-letter:text-4xl first-letter:text-[#00ff41] first-letter:font-black first-letter:float-left first-letter:mr-2">
                      Introducing… "WHIP MONTEZ" (born Wanda Altagracia Almonte) a Dominican fem-cee reppin’ Brooklyn's Red Hook Housing Projects.
                   </p>
                   
                   <p>
                      Whip is currently recording her first album comprised of a variety of hip-hop tracks. Her highly anticipated debut album tentatively titled <strong className="text-white">“Can’t Nobody Whip Montez”</strong> is due for release in 2006 and contains sure shot hits like "Take it slow" where she advises men not to wreck a potential relationship by moving too fast. On the automatic head-banger "No Matter What You Say," WHIP pulls no punches and goes straight at her critics. WHIP definitely demonstrates her versatility, which distinguishes her from her counter-parts when she penned, "Dear God," an, introspective song that touches upon numerous issues that beset society and tragedies that have impacted us all.
                   </p>

                   <div className="border-l-2 border-[#333] pl-4 italic text-gray-400">
                      2004 was a great year for Whip Montez. She was featured alongside the Green-Eyed Bandit, <strong className="text-white">Erick Sermon</strong> and one of Brooklyn’s finest MC’s <strong className="text-white">Talib Kweli</strong>. The three collaborated on a track called “Chillin” off Sermon’s last album “Chilltown, NY”. It wasn’t long after Montez penned her verse that Sermon called on Talib to complete the track with a verse of his own.
                   </div>

                   <p>
                      “This was a dream come true to be in the booth with a hip-hop legend, and Talib it was truly an educational experience, one that I will cherish for a long time.”
                   </p>

                   <p>
                      With a good number of showcases and college shows, she has opened up for notable artists like 112, Slum Village, and the Infamous Mobb Deep to name a few. This has definitely helped her expand her fan base and create a buzz for her. Last year, WHIP had several overseas performances, in particular, the Dominican Republic, Coral Hamaca Resort, where she blessed over 2,000 screaming fans. "Those shows were crazy, because they really appreciate artist that make trips to their country. In DR, they held me down like I was in BK."
                   </p>

                   <h3 className="text-white text-base md:text-lg font-black uppercase tracking-wider border-b border-[#00ff41] pb-2 mb-4 mt-6">Breaking Barriers: Female Dominance in the Game</h3>
                   
                   <p>
                      In an era dominated by male voices, Whip Montez was carving out her own lane in hip-hop with an unapologetic confidence that couldn't be ignored. At a time when female MCs were expected to choose between being "hard" or "commercial," Whip refused to be boxed in. She brought raw lyricism, street credibility, and genuine storytelling to every track—proving that a woman from Red Hook could hold her own on any stage or cipher.
                   </p>

                   <p>
                      Her lyrical prowess wasn't just about matching the men bar for bar—it was about exceeding expectations and rewriting the rules. Whip's verses cut through the noise with precision, tackling everything from relationship dynamics to street politics, always with that signature Red Hook grit. She wasn't asking for a seat at the table; she was building her own and inviting others to join.
                   </p>

                   <p>
                      The early 2000s hip-hop scene was notoriously challenging for female artists, but Whip Montez thrived in that environment. Her performances alongside industry heavyweights like Mobb Deep and Slum Village weren't novelty acts—she earned those spots through undeniable talent and relentless work ethic. Crowds didn't just tolerate a female opening act; they became fans, recognizing that her energy and skill matched anyone in the game.
                   </p>

                   <h3 className="text-white text-base md:text-lg font-black uppercase tracking-wider border-b border-[#00ff41] pb-2 mb-4 mt-6">The Brother Behind The Vision</h3>
                   
                   <p>
                      Behind every great artist is someone who believed in them first. For Whip Montez, that person was her brother and manager, <strong className="text-white">Jari Montez</strong>. While Whip was perfecting her craft in the booth and on stage, Jari was navigating the complex business of hip-hop—booking shows, negotiating deals, and ensuring his sister's voice would be heard beyond Red Hook.
                   </p>

                   <p>
                      Jari didn't just manage Whip's career; he helped architect her path. He understood that the industry wasn't built for artists like his sister—independent, uncompromising, and fiercely authentic—so he worked tirelessly to create opportunities where none existed. From local showcases to international performances in the Dominican Republic, Jari's strategic vision and unwavering support were instrumental in building the Livewire movement.
                   </p>

                   <p>
                      The brother-sister dynamic brought a unique strength to Whip's operation. There was an inherent trust and loyalty that money couldn't buy. Jari knew Whip's potential before the industry did, and he fought for her with a dedication that only family could provide. He handled the business so Whip could focus on what she did best—making music that mattered. Their partnership was a testament to the power of family, faith, and an unshakeable belief in the dream.
                   </p>

                   <p>
                      Jari's role went beyond typical management—he was a protector, strategist, and believer. In an industry known for exploitation and broken promises, having family in your corner wasn't just an advantage; it was survival. He paved the way, cleared the obstacles, and ensured that every opportunity was maximized. The Livewire legacy wasn't built by one person—it was a family affair, with Jari and Whip moving as one unit toward a shared vision of success.
                   </p>

                   <h3 className="text-white text-base md:text-lg font-black uppercase tracking-wider border-b border-[#00ff41] pb-2 mb-4 mt-8">Memories: The Journey in Pictures</h3>
                   
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 my-6">
                     {[1, 2, 3, 4, 5, 6].map((i) => (
                       <div key={i} className="aspect-square bg-[#1a1a1a] border-2 border-[#333] relative overflow-hidden group hover:border-[#00ff41] transition-all">
                         <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                           <Camera size={32} className="md:w-12 md:h-12 mb-2 opacity-20" />
                           <div className="text-[10px] md:text-xs font-mono">PHOTO {i}</div>
                           <div className="text-[8px] md:text-[10px] font-mono opacity-50">Coming Soon</div>
                         </div>
                         <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                           <div className="text-[#00ff41] text-[9px] md:text-[10px] font-mono">RED HOOK ARCHIVES</div>
                         </div>
                       </div>
                     ))}
                   </div>

                   <p className="text-[10px] md:text-xs text-gray-500 italic text-center border-t border-[#333] pt-4">
                      Photo gallery showcasing studio sessions, live performances, and behind-the-scenes moments from the Livewire era. Check back soon for updates.
                   </p>

                   <p className="mt-8 text-[#00ff41] font-bold border-t border-[#333] pt-4">
                      {'>'} SYSTEM NOTE: Artist Profile Last Updated: DEC 12 2025
                   </p>
                 </div>
               </div>
             ) : (
               // MEMORY LANE GALLERY
               <div className="max-w-5xl mx-auto">
                 <div className="mb-6 md:mb-8 text-center border-b border-[#333] pb-4">
                   <h2 className="text-2xl md:text-3xl font-black text-[#00ff41] mb-2 uppercase">MEMORY LANE</h2>
                   <p className="text-gray-300 text-sm md:text-base font-mono">Studio sessions, shows, and behind-the-scenes moments from the Livewire era</p>
                 </div>

                 {/* Admin Upload (only show if authenticated) */}
                 {user && !user.isAnonymous && (
                   <div className="bg-[#1a1a1a] border-2 border-[#00ff41] p-4 md:p-6 mb-6 md:mb-8">
                     <h3 className="text-[#00ff41] font-bold text-base md:text-lg mb-3 flex items-center gap-2 uppercase">
                       <Upload size={18} />
                       ADMIN: Upload Photo
                     </h3>
                     <div className="flex flex-col md:flex-row gap-2 md:gap-3">
                       <input
                         type="file"
                         accept="image/*"
                         onChange={(e) => setUploadFile(e.target.files[0])}
                         className="flex-1 bg-[#0a0a0a] border border-[#00ff41] text-white px-3 py-2 text-sm font-mono"
                       />
                       <button
                         onClick={handleUpload}
                         disabled={!uploadFile || uploading}
                         className="bg-[#00ff41] text-black px-6 py-2 font-bold text-sm uppercase disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#00cc33] transition-colors"
                       >
                         {uploading ? 'UPLOADING...' : 'UPLOAD'}
                       </button>
                     </div>
                     {uploadFile && (
                       <div className="mt-2 text-xs text-gray-300 font-mono">
                         Selected: {uploadFile.name}
                       </div>
                     )}
                   </div>
                 )}

                 {/* Photo Grid */}
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
                   {photos.length > 0 ? (
                     photos.map((photo) => (
                       <div key={photo.id} className="aspect-square bg-[#1a1a1a] border-2 border-[#333] relative overflow-hidden group hover:border-[#00ff41] transition-all cursor-pointer">
                         <img 
                           src={photo.url} 
                           alt="Memory" 
                           className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                         />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                           <div className="text-[#00ff41] text-xs font-mono font-bold uppercase">
                             {photo.caption || 'RED HOOK ARCHIVES'}
                           </div>
                         </div>
                       </div>
                     ))
                   ) : (
                     // Placeholder grid
                     [...Array(12)].map((_, i) => (
                       <div key={i} className="aspect-square bg-[#1a1a1a] border-2 border-[#333] relative overflow-hidden group hover:border-[#00ff41] transition-all">
                         <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                           <Camera size={40} className="mb-2 opacity-30" />
                           <div className="text-xs font-mono font-bold">PHOTO {i + 1}</div>
                           <div className="text-[10px] font-mono opacity-70 mt-1">Coming Soon</div>
                         </div>
                       </div>
                     ))
                   )}
                 </div>

                 {/* Footer Info */}
                 {photos.length === 0 && (
                   <div className="text-center border-t border-[#333] pt-6">
                     <p className="text-gray-300 text-sm font-mono mb-2">
                       📸 No photos uploaded yet
                     </p>
                     <p className="text-gray-500 text-xs font-mono">
                       {user && !user.isAnonymous 
                         ? 'Use the upload panel above to add memories from the Livewire era' 
                         : 'Check back soon for exclusive behind-the-scenes content'}
                     </p>
                   </div>
                 )}
               </div>
             )}
           </div>
        </div>

      </div>
    </div>
  );
};

// 3. MUSIC PLAYER (Evidence Tapes)
const MusicPlayer = () => {
  const [selectedAlbumId, setSelectedAlbumId] = useState('tape1');
  const [currentTrack, setCurrentTrack] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const audioRef = useRef(null);
  const urlCacheRef = useRef({}); // Cache Firebase Storage URLs
  
  const albums = [
    {
      id: 'tape1',
      title: "LIVEWIRE SESSIONS",
      date: "FEB 14 2004",
      description: "The unreleased debut. Raw, boom-bap, recorded in Erick's basement.",
      color: "text-[#00ff41]", 
      tapeColor: "border-[#00ff41]",
      tracks: [
        { id: 101, title: "Freestyle (Kanye Beat)", duration: "2:15", date: "2004-02-14", video: true, audioUrl: "Whip Montez Kanye beat freestyle 4.mp3" },
        { id: 102, title: "Feat. Ali Vegas (50 Cent Beat)", duration: "3:42", date: "2004-03-01", video: false, audioUrl: "Whip Montez 50 Freestyle Whip_Veg.mp3" },
        { id: 103, title: "Sprung (Remix)", duration: "3:30", date: "2004-04-20", video: true, audioUrl: "Whip Montez SprungRemix_whip.mp3" },
        { id: 104, title: "Push It (Remix)", duration: "3:15", date: "2004-05-10", video: false, audioUrl: "Whip Montez Push it.mp3" },
        { id: 105, title: "Freestyle (Jim Jones Beat)", duration: "2:50", date: "2004-06-05", video: true, audioUrl: "Whip Montez Jim jones freestyle.mp3" }
      ]
    },
    {
      id: 'tape2',
      title: "RED HOOK DIARIES",
      date: "AUG 01 2004",
      description: "Mixtape distributed at block parties. Gritty storytelling.",
      color: "text-red-500",
      tapeColor: "border-red-500",
      tracks: [
        { id: 201, title: "Stand Up", duration: "2:50", date: "2002-09-11", video: true, audioUrl: "02 Stand Up.mp3" },
        { id: 202, title: "Brooklyn Anthem feat. Alfonzo Hunter", duration: "3:15", date: "2002-12-01", video: false, audioUrl: "Brooklyn Anthem feat. Alfonzo Hunter.mp3" },
        { id: 203, title: "Sit Back n Remain (Freestyle)", duration: "2:10", date: "2003-02-14", video: false, audioUrl: "Sit Back n Remain (freesstyle).mp3" },
        { id: 204, title: "YoungStar", duration: "1:20", date: "2003-07-04", video: false, audioUrl: "Whip Montez YoungStar.mp3" },
        { id: 205, title: "No Matter You Say", duration: "4:00", date: "2003-08-14", video: true, audioUrl: "No Matter You Say.mp3" }
      ]
    },
    {
      id: 'tape3',
      title: "THE STOOP",
      date: "JUL 15 2001",
      description: "Chillin on the Blizzy",
      color: "text-cyan-400",
      tapeColor: "border-cyan-400",
      tracks: [
        { id: 301, title: "U Catching Feelings", duration: "3:20", date: "2001-07-15", video: false, audioUrl: "U Catching Feelings.mp3" },
        { id: 302, title: "Only You", duration: "3:45", date: "2001-07-20", video: false, audioUrl: "Only You.mp3" },
        { id: 303, title: "Dear GOD", duration: "4:10", date: "2001-08-01", video: true, audioUrl: "Whip Montez Dear GOD.mp3" },
        { id: 304, title: "I Use to Love feat. Kia", duration: "3:55", date: "2001-08-10", video: false, audioUrl: "Whip Montez Feat. Kia I use to love.mp3" },
        { id: 305, title: "It Gets Hard", duration: "3:30", date: "2001-08-15", video: false, audioUrl: "08 It gets hard.mp3" }
      ]
    }
  ];

  // Load audio when track changes ONLY
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;
    
    const audio = audioRef.current;
    const shouldAutoPlay = isPlaying;
    let canPlayListener = null;
    
    const loadAndPlay = async () => {
      try {
        setAudioLoading(true);
        
        // Get the URL
        let url;
        if (storage && currentTrack.audioUrl) {
          const storageRef = ref(storage, currentTrack.audioUrl);
          url = await getDownloadURL(storageRef);
        } else {
          url = `/${currentTrack.audioUrl}`;
        }
        
        // Set source
        audio.src = url;
        
        // Wait for audio to be ready before playing
        canPlayListener = () => {
          setAudioLoading(false);
          if (shouldAutoPlay) {
            audio.play().catch(err => console.log("Play error:", err));
          }
        };
        
        audio.addEventListener('canplay', canPlayListener, { once: true });
        audio.load();
        
      } catch (err) {
        console.log("Audio load error, trying direct path:", err);
        audio.src = `/${currentTrack.audioUrl}`;
        
        canPlayListener = () => {
          setAudioLoading(false);
          if (shouldAutoPlay) {
            audio.play().catch(err => console.log("Play error:", err));
          }
        };
        
        audio.addEventListener('canplay', canPlayListener, { once: true });
        audio.load();
      }
    };
    
    loadAndPlay();
    
    // Cleanup
    return () => {
      if (canPlayListener) {
        audio.removeEventListener('canplay', canPlayListener);
      }
    };
  }, [currentTrack]);

  // Separate effect for play/pause button (when track doesn't change)
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;
    
    const audio = audioRef.current;
    
    // Control playback whenever isPlaying changes
    if (audio.src) {
      if (isPlaying) {
        // Only play if not already playing
        if (audio.paused) {
          audio.play().catch(err => console.log("Play error:", err));
        }
      } else {
        // Only pause if currently playing
        if (!audio.paused) {
          audio.pause();
        }
      }
    }
  }, [isPlaying]);

  const activeAlbum = albums.find(a => a.id === selectedAlbumId) || albums[0];

  const handleTrackClick = (track) => {
    if (currentTrack?.id === track.id) {
      setIsPlaying(!isPlaying);
    } else {
      // For desktop: preserve user gesture by calling play immediately
      if (audioRef.current) {
        audioRef.current.play().catch(() => {}); // This preserves the gesture
      }
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  };

  // Previous track handler
  const handlePrevious = () => {
    if (!currentTrack) return;
    const currentIndex = activeAlbum.tracks.findIndex(t => t.id === currentTrack.id);
    if (currentIndex > 0) {
      const prevTrack = activeAlbum.tracks[currentIndex - 1];
      setCurrentTrack(prevTrack);
      setIsPlaying(true);
    }
  };

  // Next track handler
  const handleNext = () => {
    if (!currentTrack) return;
    const currentIndex = activeAlbum.tracks.findIndex(t => t.id === currentTrack.id);
    if (currentIndex < activeAlbum.tracks.length - 1) {
      const nextTrack = activeAlbum.tracks[currentIndex + 1];
      setCurrentTrack(nextTrack);
      setIsPlaying(true);
    }
  };

  // Stop handler
  const handleStop = () => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const getLyricsForAlbum = (id) => {
    switch(id) {
      case 'tape1': return [
        { es: "Flow so cold it burns", en: "Reference to the Kanye beat intro", note: "Opening bars." },
        { es: "Ali Vegas on the track", en: "Queens meets Brooklyn", note: "The collaboration." }
      ];
      default: return [
        { es: "Buscando mi dinero", en: "Looking for my money", note: "Hustle culture." },
        { es: "Siempre leal", in: "Always loyal", note: "Livewire code." }
      ];
    }
  };

  const currentLyrics = getLyricsForAlbum(selectedAlbumId);

  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-[#0a0a0a]">
      {/* Header */}
      <div className="h-10 md:h-12 border-b border-[#333] bg-[#111] flex items-center px-2 md:px-4 justify-between shrink-0">
        <div className="flex items-center gap-1 md:gap-2">
          <Disc size={14} className="md:w-[18px] md:h-[18px] text-[#00ff41]" />
          <span className="font-bold tracking-widest text-[10px] md:text-sm text-white">
            <span className="hidden sm:inline">EVIDENCE_LOCKER // </span>AUDIO_ARCHIVE
          </span>
        </div>
        <div className="text-[8px] md:text-[10px] font-mono text-gray-500 hidden sm:block">TOTAL_SIZE: 4.2GB</div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Video Modal */}
        {showVideoModal && (
          <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center p-4 md:p-8 backdrop-blur-sm">
            <div className="w-full max-w-3xl border-2 border-[#00ff41] bg-black shadow-[0_0_50px_rgba(0,255,65,0.2)] flex flex-col">
              <div className="h-7 md:h-8 bg-[#00ff41] flex items-center justify-between px-2">
                <span className="text-black font-bold text-[10px] md:text-xs font-mono">MEDIA_PLAYER_V1.EXE</span>
                <X size={14} className="md:w-4 md:h-4 text-black cursor-pointer hover:bg-white/20" onClick={() => setShowVideoModal(false)} />
              </div>
              <div className="aspect-video bg-[#111] relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                <div className="text-center">
                  <div className="text-[#00ff41] text-3xl md:text-4xl mb-4 animate-pulse"><Play size={48} className="md:w-16 md:h-16"/></div>
                  <p className="text-gray-500 font-mono text-xs md:text-sm">BUFFERING VIDEO FEED...</p>
                  <p className="text-gray-700 text-[10px] md:text-xs mt-2">SOURCE: {currentTrack?.title}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Album List - Hidden on mobile, shown on tablet+ */}
        <div className="hidden md:flex md:w-1/4 md:min-w-[200px] border-r border-[#333] bg-[#050505] flex-col">
          <div className="p-2 border-b border-[#333] bg-[#1a1a1a] text-[10px] text-gray-400 font-mono sticky top-0">DIRECTORY_TREE</div>
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {albums.map(album => (
              <div 
                key={album.id}
                onClick={() => setSelectedAlbumId(album.id)}
                className={`p-3 cursor-pointer border-l-2 transition-all group ${
                  selectedAlbumId === album.id ? `bg-[#111] ${album.color.replace('text-', 'border-')} border-l-4` : 'border-transparent hover:bg-[#111] hover:border-gray-600'
                }`}
              >
                <div className={`font-bold text-xs md:text-sm mb-1 group-hover:text-white ${selectedAlbumId === album.id ? 'text-white' : 'text-gray-400'}`}>{album.title}</div>
                <div className="text-[10px] font-mono text-gray-600 group-hover:text-gray-400">{album.date}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Album Selector - Dropdown on mobile */}
        <div className="md:hidden border-b border-[#333] bg-[#050505] p-2">
          <select 
            value={selectedAlbumId}
            onChange={(e) => setSelectedAlbumId(e.target.value)}
            className="w-full bg-[#111] border border-[#333] text-white p-2 text-sm font-mono focus:border-[#00ff41] focus:outline-none"
          >
            {albums.map(album => (
              <option key={album.id} value={album.id}>{album.title}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 flex flex-col bg-black/80 overflow-hidden">
          <div className="p-3 md:p-4 border-b border-[#333] bg-[#0a0a0a]">
            <h2 className={`text-xl md:text-4xl font-black chrome-text mb-1 md:mb-2`}>{activeAlbum.title}</h2>
            <p className="text-gray-400 font-mono text-[10px] md:text-xs">{activeAlbum.description}</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-0">
            {/* Desktop: Table view */}
            <table className="hidden md:table w-full text-left border-collapse">
              <thead className="bg-[#111] text-[10px] text-gray-500 font-mono sticky top-0">
                <tr>
                  <th className="p-2 border-b border-[#333] w-10">#</th>
                  <th className="p-2 border-b border-[#333]">TITLE</th>
                  <th className="p-2 border-b border-[#333] w-24">CREATED</th>
                  <th className="p-2 border-b border-[#333] text-right w-16">MEDIA</th>
                </tr>
              </thead>
              <tbody>
                {activeAlbum.tracks.map((track, i) => (
                  <tr 
                    key={track.id}
                    className={`group cursor-pointer text-xs md:text-sm font-mono transition-colors ${currentTrack?.id === track.id ? 'bg-[#00ff41]/20 text-[#00ff41]' : 'hover:bg-[#111] text-gray-300'}`}
                  >
                    <td className="p-3 border-b border-[#333]/50 text-gray-600 group-hover:text-white" onClick={() => handleTrackClick(track)}>
                      {currentTrack?.id === track.id && isPlaying ? <div className="animate-pulse text-[#00ff41]">▶</div> : (i + 1).toString().padStart(2, '0')}
                    </td>
                    <td className="p-3 border-b border-[#333]/50 font-bold" onClick={() => handleTrackClick(track)}>{track.title}</td>
                    <td className="p-3 border-b border-[#333]/50 text-gray-600 font-mono text-[10px]">{track.date}</td>
                    <td className="p-3 border-b border-[#333]/50 text-right">
                      {track.video && (
                        <Video 
                          size={14} 
                          className="inline text-gray-500 hover:text-[#00ff41] transition-colors"
                          onClick={(e) => { e.stopPropagation(); setCurrentTrack(track); setShowVideoModal(true); }}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile: Card view */}
            <div className="md:hidden">
              {activeAlbum.tracks.map((track, i) => (
                <div
                  key={track.id}
                  onClick={() => handleTrackClick(track)}
                  className={`p-4 border-b border-[#333]/50 cursor-pointer transition-colors ${
                    currentTrack?.id === track.id ? 'bg-[#00ff41]/20' : 'active:bg-[#111]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`text-sm font-mono ${currentTrack?.id === track.id ? 'text-[#00ff41]' : 'text-gray-600'}`}>
                      {currentTrack?.id === track.id && isPlaying ? (
                        <div className="animate-pulse text-[#00ff41] text-base">▶</div>
                      ) : (
                        (i + 1).toString().padStart(2, '0')
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-bold text-sm truncate ${currentTrack?.id === track.id ? 'text-[#00ff41]' : 'text-gray-300'}`}>
                        {track.title}
                      </div>
                      <div className="text-[10px] font-mono text-gray-600 mt-0.5">{track.date}</div>
                    </div>
                    {track.video && (
                      <Video 
                        size={16} 
                        className="text-gray-500 shrink-0"
                        onClick={(e) => { e.stopPropagation(); setCurrentTrack(track); setShowVideoModal(true); }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-1/3 min-w-[300px] border-l border-[#333] bg-[#080808] flex flex-col hidden md:flex">
          {/* Alpine-style Deck */}
          <div className="p-6 bg-[#111] border-b border-[#333]">
             <div className="bg-[#0f281f] border-2 border-[#333] rounded-sm p-4 shadow-inner relative overflow-hidden h-32 flex flex-col justify-between mb-4">
                {/* Loading Overlay */}
                {audioLoading && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 animate-pulse">
                    <Disc size={32} className="text-emerald-400 animate-spin mb-2" style={{ animationDuration: '1s' }} />
                    <div className="text-emerald-400 text-xs font-mono tracking-wider">LOADING AUDIO...</div>
                    <div className="flex gap-1 mt-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }}></div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.1)_50%,rgba(0,0,0,0)_50%)] bg-[length:100%_4px] pointer-events-none"></div>
                <div className="flex justify-between text-[10px] text-emerald-600/60 font-mono">
                    <span>SRC: TAPE</span>
                    <span>VOL: 24</span>
                </div>
                <div className="font-mono text-emerald-400 text-lg whitespace-nowrap overflow-hidden">
                    <span className={`block ${isPlaying ? 'animate-marquee' : ''}`}>{currentTrack ? `${currentTrack.title} - WHIP MONTEZ` : "INSERT CASSETTE..."}</span>
                </div>
                <div className="w-full flex gap-0.5 items-end justify-center h-10">
                   {[...Array(32)].map((_, i) => (
                     <div 
                        key={i} 
                        className={`w-1.5 bg-emerald-500/80 ${isPlaying ? 'animate-pulse' : ''}`} 
                        style={{ 
                          height: isPlaying ? `${20 + Math.random() * 60}%` : '2px', 
                          opacity: 0.5 + Math.random() * 0.5,
                          animationDuration: `${0.2 + Math.random() * 0.5}s`
                        }} 
                     />
                   ))}
                </div>
             </div>
             
             <div className="grid grid-cols-4 gap-2">
                <button 
                  onClick={handlePrevious}
                  className="bg-[#222] h-10 rounded border-b-2 border-black active:border-b-0 active:translate-y-[2px] flex items-center justify-center text-[#666] hover:text-[#00ff41] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Rewind size={16}/>
                </button>
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`bg-[#222] h-10 rounded border-b-2 border-black active:border-b-0 active:translate-y-[2px] flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    audioLoading ? 'text-emerald-400 cursor-wait' : 'text-[#666] hover:text-[#00ff41]'
                  }`}
                  disabled={audioLoading || !currentTrack}
                >
                  {audioLoading ? <Loader2 size={16} className="animate-spin"/> : isPlaying ? <Pause size={16}/> : <Play size={16}/>}
                </button>
                <button 
                  onClick={handleStop}
                  className="bg-[#222] h-10 rounded border-b-2 border-black active:border-b-0 active:translate-y-[2px] flex items-center justify-center text-[#666] hover:text-[#00ff41] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-3 h-3 bg-current rounded-sm"></div>
                </button>
                <button 
                  onClick={handleNext}
                  className="bg-[#222] h-10 rounded border-b-2 border-black active:border-b-0 active:translate-y-[2px] flex items-center justify-center text-[#666] hover:text-[#00ff41] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex"><Play size={10}/><Play size={10}/></div>
                </button>
             </div>
          </div>

          <div className="flex-1 p-4 bg-black/90 relative overflow-hidden">
            <div className={`absolute top-0 right-0 ${activeAlbum.color.replace('text-', 'bg-')} text-black text-[10px] font-bold px-2 py-1`}>DECODER_V2.0</div>
            <h3 className="text-sm font-bold mb-4 text-gray-300 flex items-center gap-2"><Terminal size={12}/> LYRIC_ANALYSIS</h3>
            <div className="space-y-4">
              {currentLyrics.map((line, i) => (
                <div key={i} className="group cursor-help">
                  <div className="text-white font-mono text-sm border-b border-dashed border-gray-700 pb-1 group-hover:border-[#00ff41] group-hover:text-[#00ff41] transition-colors">"{line.es}"</div>
                  <div className="h-0 group-hover:h-auto overflow-hidden transition-all duration-300">
                    <div className="pt-2 pl-2 border-l-2 border-[#00ff41] mt-1">
                      <div className="text-gray-400 text-xs font-bold">EN: {line.en}</div>
                      <div className="text-gray-600 text-[10px] italic">NOTE: {line.note}</div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="text-center mt-8 text-gray-700 text-[10px]">HOVER TO TRANSLATE</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Hidden audio element for playback */}
      <audio 
        ref={audioRef} 
        onEnded={() => setIsPlaying(false)}
        onError={(e) => console.error("Audio playback error:", e)}
        playsInline
        preload="auto"
      />
    </div>
  );
};

// 5. TOUR ARCHIVE (Restored Ticket Hub)
const TourHistory = () => {
  const dates = [
    { city: "RED HOOK, NY", venue: "THE REC CENTER", date: "AUG 14 2004", status: "SOLD OUT", price: "$15.00", seats: "0", info: "Homecoming Show" },
    { city: "HARLEM, NY", venue: "APOLLO THEATER", date: "SEP 02 2004", status: "COMPLETED", price: "$25.00", seats: "0", info: "Opener for Mobb Deep" },
    { city: "TORONTO, ON", venue: "OPERA HOUSE", date: "OCT 05 2004", status: "SELLING FAST", price: "$22.00 CAD", seats: "42", info: "First Canadian Date" },
    { city: "PHILADELPHIA, PA", venue: "THE TROCADERO", date: "OCT 12 2004", status: "AVAILABLE", price: "$20.00", seats: "150", info: "w/ Beanie Sigel" },
    { city: "BOSTON, MA", venue: "PARADISE ROCK CLUB", date: "OCT 15 2004", status: "AVAILABLE", price: "$18.00", seats: "85", info: "All Ages" }
  ];

  return (
    <div className="h-full w-full relative overflow-hidden flex items-center justify-center p-2 md:p-4">
      <BackgroundCarousel images={[]} />
      <div className="absolute inset-0 bg-black/70 z-10"></div>
      <div className="relative z-30 w-full max-w-5xl h-[85vh] bg-[#111] border border-[#333] shadow-2xl flex flex-col font-sans">
        <div className="bg-[#2d2d2d] text-gray-400 px-2 py-1 flex justify-between items-center border-b border-[#444] shadow-none">
           <div className="flex items-center gap-2">
             <Globe size={14} className="text-[#00ff41]"/>
             <span className="text-[10px] md:text-xs font-bold text-gray-300 font-sans"><span className="hidden sm:inline">TicketHub 2004 - </span>Livewire Events</span>
           </div>
        </div>
        <div className="flex-1 overflow-y-auto bg-[#050505] p-0 text-gray-300">
           <div className="bg-[#111] text-white p-3 md:p-4 border-b-2 border-[#00ff41] flex justify-between items-end">
             <div>
               <h1 className="text-xl sm:text-2xl md:text-4xl font-black tracking-tighter mb-1 italic font-sans text-white">TICKET_HUB <span className="text-[#00ff41]">2004</span></h1>
             </div>
           </div>
           
           {/* Desktop: Table view */}
           <div className="p-4 hidden md:block">
             <table className="w-full text-left border-collapse border border-[#333] bg-[#050505] text-xs md:text-sm shadow-none font-sans">
                <thead className="bg-[#1a1a1a] text-[#00ff41]">
                  <tr>
                    <th className="p-2 border border-[#333] w-16 text-center">DATE</th>
                    <th className="p-2 border border-[#333]">EVENT / VENUE</th>
                    <th className="p-2 border border-[#333] w-24">CITY</th>
                    <th className="p-2 border border-[#333] w-20">PRICE</th>
                    <th className="p-2 border border-[#333] w-24 text-center">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {dates.map((gig, i) => (
                    <tr key={i} className={`border-b border-[#333] ${i % 2 === 0 ? 'bg-[#0a0a0a]' : 'bg-[#0f0f0f]'} hover:bg-[#1a1a1a] transition-colors group`}>
                      <td className="p-2 border-r border-[#333] font-bold text-gray-400 whitespace-nowrap text-center">
                        <div className="flex flex-col items-center leading-tight">
                          <span className="text-[10px] uppercase text-gray-600">{gig.date.split(' ')[0]}</span>
                          <span className="text-lg text-white font-black group-hover:text-[#00ff41] transition-colors">{gig.date.split(' ')[1]}</span>
                          <span className="text-[9px] text-gray-600">{gig.date.split(' ')[2]}</span>
                        </div>
                      </td>
                      <td className="p-2 border-r border-[#333] align-top">
                        <div className="font-bold text-white uppercase underline cursor-pointer hover:text-[#00ff41]">WHIP MONTEZ - LIVE</div>
                        <div className="text-[11px] text-gray-400 font-bold mt-0.5">{gig.venue}</div>
                        <div className="text-[10px] text-gray-600 italic mb-1">{gig.info}</div>
                        <div className="flex gap-3 mt-1 text-[9px] text-blue-400 font-bold">
                           <span className="flex items-center gap-0.5 cursor-pointer hover:text-white"><MapPin size={10}/> VIEW MAP</span>
                           <span className="flex items-center gap-0.5 cursor-pointer hover:text-white"><Grid size={10}/> SEATING CHART</span>
                        </div>
                      </td>
                      <td className="p-2 border-r border-[#333] font-bold text-gray-400 align-middle text-[11px]">{gig.city}</td>
                      <td className="p-2 border-r border-[#333] font-mono text-[#00ff41] font-bold align-middle">{gig.price}</td>
                      <td className="p-2 border-r border-[#333] text-center font-bold align-middle">
                        {gig.status === 'SOLD OUT' ? <span className="text-red-500">0</span> : gig.status === 'CANCELLED' ? <span className="text-gray-600">-</span> : gig.status === 'COMPLETED' ? (
                          <span className="text-gray-500 font-bold text-[10px]">CLOSED</span>
                        ) : (
                          <button className="bg-[#00ff41] text-black border border-[#00ff41] px-3 py-1 text-[10px] font-black hover:bg-white hover:border-white transition-colors flex items-center justify-center gap-1 mx-auto w-full">
                            <Ticket size={10} strokeWidth={3}/> BUY
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
           </div>
           
           {/* Mobile: Card view */}
           <div className="md:hidden p-3 space-y-3">
             {dates.map((gig, i) => (
               <div key={i} className="border border-[#333] bg-[#0a0a0a] p-3">
                 <div className="flex justify-between items-start mb-2">
                   <div>
                     <div className="text-white font-bold text-sm uppercase">WHIP MONTEZ - LIVE</div>
                     <div className="text-[11px] text-gray-400 font-bold">{gig.venue}</div>
                   </div>
                   <div className="text-right">
                     <div className="text-[#00ff41] font-mono font-bold text-sm">{gig.price}</div>
                     <div className="text-[10px] text-gray-600">{gig.date}</div>
                   </div>
                 </div>
                 <div className="text-[10px] text-gray-600 mb-2">{gig.city}</div>
                 <div className="text-[10px] text-gray-500 italic mb-2">{gig.info}</div>
                 <div className="flex justify-between items-center">
                   <div className="text-[10px] text-gray-600 font-bold">
                     {gig.seats} {gig.seats === "0" ? "SOLD OUT" : "seats left"}
                   </div>
                   {gig.status === 'SOLD OUT' ? (
                     <span className="text-red-500 text-xs font-bold">SOLD OUT</span>
                   ) : gig.status === 'COMPLETED' ? (
                     <span className="text-gray-500 text-xs font-bold">CLOSED</span>
                   ) : (
                     <button className="bg-[#00ff41] text-black px-4 py-1.5 text-xs font-black hover:bg-white transition-colors flex items-center gap-1">
                       <Ticket size={12} strokeWidth={3}/> BUY NOW
                     </button>
                   )}
                 </div>
               </div>
             ))}
           </div>
             
           {/* Footer Legal */}
           <div className="p-3 md:p-4">
             <div className="mt-6 border-t border-[#333] pt-2 flex flex-col gap-1">
                <div className="flex flex-wrap gap-2 md:gap-4 text-[9px] md:text-[10px] text-gray-500 font-bold underline">
                   <span className="hover:text-white cursor-pointer">Privacy Policy</span>
                   <span className="hover:text-white cursor-pointer">Terms of Use</span>
                   <span className="hover:text-white cursor-pointer">Purchase Policy</span>
                   <span className="hover:text-white cursor-pointer">Sell Tickets</span>
                </div>
                <div className="text-[8px] md:text-[9px] text-gray-600 font-mono mt-2">
                   * All times are Eastern Standard Time. Prices do not include service fees ($4.50) or facility charges.<br/>
                   * Livewire Entertainment is not responsible for lost or stolen tickets.
                </div>
                <div className="mt-4 flex items-center gap-2 opacity-50">
                   <div className="h-5 md:h-6 w-8 md:w-10 border border-gray-600 bg-black flex items-center justify-center text-[7px] md:text-[8px] font-bold text-gray-400 italic">VISA</div>
                   <div className="h-5 md:h-6 w-8 md:w-10 border border-gray-600 bg-black flex items-center justify-center text-[7px] md:text-[8px] font-bold text-gray-400 italic">MC</div>
                   <div className="h-5 md:h-6 w-8 md:w-10 border border-gray-600 bg-black flex items-center justify-center text-[7px] md:text-[8px] font-bold text-gray-400 italic">AMEX</div>
                </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

// 6. STYLE ARCHIVE (Merch Store)
const StyleArchive = () => {
  // Fallback Data if Firebase Unavailable
  const fallbackItems = [
      { id: 'm1', name: "Livewire Official Tee - Black", category: "Shirts", price: 35, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80", desc: "Classic Logo Black" },
      { id: 'm2', name: "Whip Montez Red Hook Hoodie", category: "Hoodies", price: 85, image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&q=80", desc: "Heavyweight Cotton" },
      { id: 'm3', name: "Livewire Cargo Pants", category: "Pants", price: 95, image: "https://images.unsplash.com/photo-1517445312882-14f275936729?w=500&q=80", desc: "Tactical Pockets" },
      { id: 'm4', name: "Whip Tour Backpack '04", category: "Bags", price: 60, image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80", desc: "Canvas Rucksack" },
      { id: 'm5', name: "Graffiti Logo Joggers", category: "Pants", price: 70, image: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=500&q=80", desc: "All-over Print" },
      { id: 'm6', name: "Whip Montez Bandana Pack", category: "Accessories", price: 20, image: "https://images.unsplash.com/photo-1629316075677-72782e379a41?w=500&q=80", desc: "3 Colors" },
      { id: 'm7', name: "Livewire Velour Track Top", category: "Hoodies", price: 110, image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&q=80", desc: "Navy Blue" },
      { id: 'm8', name: "Whip Montez Snapback Hat", category: "Accessories", price: 30, image: "https://images.unsplash.com/photo-1577771761611-37f37ccb84db?w=500&q=80", desc: "Embroidered Logo" },
      { id: 'm9', name: "Livewire 2004 Album Tee", category: "Shirts", price: 40, image: "https://images.unsplash.com/photo-1571542617696-6136d2c4760d?w=500&q=80", desc: "Album Art Print" },
      { id: 'm10', name: "Red Hook Bomber Jacket", category: "Jackets", price: 150, image: "https://images.unsplash.com/photo-1551028038-0973a0e633d2?w=500&q=80", desc: "Heavy Satin Shell" },
      { id: 'm11', name: "Montez Skull Beanie", category: "Accessories", price: 25, image: "https://images.unsplash.com/photo-1582236528760-496e5797f374?w=500&q=80", desc: "Winter Wear" },
      { id: 'm12', name: "Livewire Utility Vest", category: "Jackets", price: 90, image: "https://images.unsplash.com/photo-1622479532585-cd278cc0486c?w=500&q=80", desc: "Multi-Pocket" },
      { id: 'm13', name: "Whip Cropped Tee", category: "Shirts", price: 30, image: "https://images.unsplash.com/photo-1523359054-933e144a7065?w=500&q=80", desc: "Female Fit" },
      { id: 'm14', name: "Montez Logo Socks", category: "Accessories", price: 15, image: "https://images.unsplash.com/photo-1606277636181-a95786f1f41b?w=500&q=80", desc: "Mid-Calf" },
      { id: 'm15', name: "Digital Camo Hoodie", category: "Hoodies", price: 90, image: "https://images.unsplash.com/photo-1543163534-118e3810145f?w=500&q=80", desc: "Digital Print" },
      { id: 'm16', name: "Signature Wristband Set", category: "Accessories", price: 25, image: "https://images.unsplash.com/photo-1529124430154-15c0e051c04d?w=500&q=80", desc: "Livewire x Montez" },
      { id: 'm17', name: "Whip Montez Denim Jacket", category: "Jackets", price: 140, image: "https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=500&q=80", desc: "Vintage Wash" },
      { id: 'm18', name: "Brooklyn Nights Long Sleeve", category: "Shirts", price: 45, image: "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=500&q=80", desc: "Thermal Cotton" },
      { id: 'm19', name: "Montez Chain Link Bracelet", category: "Accessories", price: 55, image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500&q=80", desc: "Stainless Steel" },
      { id: 'm20', name: "Red Hook Crewneck", category: "Hoodies", price: 75, image: "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=500&q=80", desc: "Embroidered Logo" },
      { id: 'm21', name: "Livewire Track Jacket", category: "Jackets", price: 120, image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&q=80", desc: "Retro Stripes" },
      { id: 'm22', name: "Whip Montez Tank Top", category: "Shirts", price: 28, image: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=500&q=80", desc: "Summer Edition" },
      { id: 'm23', name: "Brooklyn Born Duffle Bag", category: "Bags", price: 85, image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80", desc: "Gym & Travel" },
      { id: 'm24', name: "Montez Logo Bucket Hat", category: "Accessories", price: 35, image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500&q=80", desc: "Reversible" },
      { id: 'm25', name: "Livewire Windbreaker", category: "Jackets", price: 95, image: "https://images.unsplash.com/photo-1548126032-079b4e3df0e2?w=500&q=80", desc: "Water Resistant" },
      { id: 'm26', name: "Red Hook Sweatpants", category: "Pants", price: 65, image: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=500&q=80", desc: "Relaxed Fit" },
      { id: 'm27', name: "Whip Montez Crossbody Bag", category: "Bags", price: 50, image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500&q=80", desc: "Urban Essential" },
      { id: 'm28', name: "Brooklyn Camo Shorts", category: "Pants", price: 55, image: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500&q=80", desc: "Summer Wear" },
      { id: 'm29', name: "Livewire Zip Hoodie", category: "Hoodies", price: 95, image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=500&q=80", desc: "Full Front Zip" },
      { id: 'm30', name: "Montez Era Tour Tee '04", category: "Shirts", price: 50, image: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=500&q=80", desc: "Limited Edition" }
  ];

  const [items, setItems] = useState(fallbackItems);
  const [filteredItems, setFilteredItems] = useState(fallbackItems);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [filters, setFilters] = useState({ category: 'All', sort: 'newest', search: '' });
  const [showSeed, setShowSeed] = useState(false);

  // Firestore Sync with Fallback
  useEffect(() => {
    if (!db) {
        // Run in Offline/Demo Mode
        setItems(fallbackItems);
        return;
    }
    const unsubscribe = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'merch'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Always show fallback items if database is empty
      if (data.length === 0) {
        setItems(fallbackItems);
        setShowSeed(true);
      } else {
        setItems(data);
        setShowSeed(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Filtering Logic
  useEffect(() => {
    let result = [...items];
    
    if (filters.category !== 'All') {
      result = result.filter(item => item.category === filters.category);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(q) || 
        item.category.toLowerCase().includes(q)
      );
    }

    if (filters.sort === 'priceAsc') {
      result.sort((a, b) => a.price - b.price);
    } else if (filters.sort === 'priceDesc') {
      result.sort((a, b) => b.price - a.price);
    }

    setFilteredItems(result);
  }, [items, filters]);

  const seedData = async () => {
    if (!db) return;
    const seedItems = [
      { name: "Livewire Official Tee - Black", category: "Shirts", price: 35, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80", desc: "Classic Logo Black" },
      { name: "Whip Montez Red Hook Hoodie", category: "Hoodies", price: 85, image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&q=80", desc: "Heavyweight Cotton" },
      { name: "Livewire Cargo Pants", category: "Pants", price: 95, image: "https://images.unsplash.com/photo-1517445312882-14f275936729?w=500&q=80", desc: "Tactical Pockets" },
      { name: "Whip Tour Backpack '04", category: "Bags", price: 60, image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80", desc: "Canvas Rucksack" },
      { name: "Graffiti Logo Joggers", category: "Pants", price: 70, image: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=500&q=80", desc: "All-over Print" },
      { name: "Whip Montez Bandana Pack", category: "Accessories", price: 20, image: "https://images.unsplash.com/photo-1629316075677-72782e379a41?w=500&q=80", desc: "3 Colors" },
      { name: "Livewire Velour Track Top", category: "Hoodies", price: 110, image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&q=80", desc: "Navy Blue" },
      { name: "Whip Montez Snapback Hat", category: "Accessories", price: 30, image: "https://images.unsplash.com/photo-1577771761611-37f37ccb84db?w=500&q=80", desc: "Embroidered Logo" },
      { name: "Livewire 2004 Album Tee", category: "Shirts", price: 40, image: "https://images.unsplash.com/photo-1571542617696-6136d2c4760d?w=500&q=80", desc: "Album Art Print" },
      { name: "Red Hook Bomber Jacket", category: "Jackets", price: 150, image: "https://images.unsplash.com/photo-1551028038-0973a0e633d2?w=500&q=80", desc: "Heavy Satin Shell" },
      { name: "Montez Skull Beanie", category: "Accessories", price: 25, image: "https://images.unsplash.com/photo-1582236528760-496e5797f374?w=500&q=80", desc: "Winter Wear" },
      { name: "Livewire Utility Vest", category: "Jackets", price: 90, image: "https://images.unsplash.com/photo-1622479532585-cd278cc0486c?w=500&q=80", desc: "Multi-Pocket" },
      { name: "Whip Cropped Tee", category: "Shirts", price: 30, image: "https://images.unsplash.com/photo-1523359054-933e144a7065?w=500&q=80", desc: "Female Fit" },
      { name: "Montez Logo Socks", category: "Accessories", price: 15, image: "https://images.unsplash.com/photo-1606277636181-a95786f1f41b?w=500&q=80", desc: "Mid-Calf" },
      { name: "Digital Camo Hoodie", category: "Hoodies", price: 90, image: "https://images.unsplash.com/photo-1543163534-118e3810145f?w=500&q=80", desc: "Digital Print" },
      { name: "Signature Wristband Set", category: "Accessories", price: 25, image: "https://images.unsplash.com/photo-1529124430154-15c0e051c04d?w=500&q=80", desc: "Livewire x Montez" }
    ];

    seedItems.forEach(async (item) => {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'merch'), item);
    });
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    const itemData = {
      name: e.target.name.value,
      price: Number(e.target.price.value),
      category: e.target.category.value,
      image: e.target.image.value,
      desc: e.target.desc.value
    };

    if (!db) {
        // Local Update in Demo Mode
        if (editingItem.id) {
            setItems(items.map(i => i.id === editingItem.id ? { ...i, ...itemData } : i));
        } else {
            setItems([...items, { id: Date.now().toString(), ...itemData }]);
        }
        setEditingItem(null);
        return;
    }

    if (editingItem.id) {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'merch', editingItem.id), itemData);
    } else {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'merch'), itemData);
    }
    setEditingItem(null);
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this item?")) {
        if (!db) {
            setItems(items.filter(i => i.id !== id));
            return;
        }
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'merch', id));
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#050505] text-gray-300 relative font-sans overflow-hidden">
      
      {/* HEADER */}
      <div className="h-14 md:h-20 border-b border-[#333] flex items-center justify-between px-3 md:px-6 bg-[#111] z-20 shrink-0">
        <div className="flex flex-col gap-0.5 md:gap-1">
          <h2 className="text-lg md:text-3xl font-black uppercase tracking-tighter text-white flex items-center gap-1 md:gap-2">
             <ShoppingBag size={18} className="md:w-6 md:h-6 text-[#00ff41]"/>
             <span className="hidden sm:inline">STORE_FRONT</span>
             <span className="sm:hidden">STORE</span>
          </h2>
          <div className="text-[8px] md:text-[10px] text-[#00ff41] font-mono tracking-wider md:tracking-widest uppercase">LIVEWIRE x WHIP MONTEZ</div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden md:flex items-center gap-2 bg-[#222] px-3 py-1 rounded-full border border-[#333]">
            <Search size={14} />
            <input 
              className="bg-transparent outline-none text-xs w-32 text-white placeholder-gray-500"
              placeholder="Search styles..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
          </div>
          <div onClick={() => setIsCartOpen(true)} className="relative cursor-pointer hover:text-[#00ff41] transition-colors">
            <ShoppingBag size={20}/>
            {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-[#00ff41] text-black text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{cart.length}</span>}
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* SIDEBAR */}
        <div className="w-56 lg:w-64 bg-[#0a0a0a] border-r border-[#333] p-4 lg:p-6 hidden md:flex flex-col gap-6 lg:gap-8 overflow-y-auto">
          <div>
            <h3 className="text-xs font-bold text-[#00ff41] mb-4 uppercase tracking-widest flex items-center gap-2"><Filter size={12}/> Categories</h3>
            <div className="space-y-2">
              {['All', 'Shirts', 'Pants', 'Hoodies', 'Bags', 'Accessories', 'Jackets'].map(cat => (
                <div 
                  key={cat} 
                  onClick={() => setFilters({...filters, category: cat})}
                  className={`cursor-pointer text-sm hover:text-white transition-colors flex justify-between items-center ${filters.category === cat ? 'text-white font-bold' : 'text-gray-500'}`}
                >
                  {cat}
                  {filters.category === cat && <div className="w-1.5 h-1.5 bg-[#00ff41] rounded-full"></div>}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-[#00ff41] mb-4 uppercase tracking-widest">Sort By</h3>
            <select 
              value={filters.sort}
              onChange={(e) => setFilters({...filters, sort: e.target.value})}
              className="w-full bg-[#111] border border-[#333] text-xs text-white p-2 outline-none focus:border-[#00ff41]"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="priceAsc">Price: Low to High</option>
              <option value="priceDesc">Price: High to Low</option>
            </select>
          </div>

          <div className="mt-auto border-t border-[#333] pt-4">
             <button 
               onClick={() => setIsAdmin(!isAdmin)}
               className={`w-full py-2 text-[10px] font-bold tracking-widest uppercase border ${isAdmin ? 'bg-[#00ff41] text-black border-[#00ff41]' : 'border-[#333] text-gray-600 hover:border-gray-400'}`}
             >
               {isAdmin ? 'ADMIN MODE: ON' : 'STAFF LOGIN'}
             </button>
             
             {isAdmin && showSeed && (
               <button 
                 onClick={seedData} 
                 className="w-full mt-2 py-2 text-[10px] font-bold tracking-widest uppercase bg-blue-600 text-white hover:bg-blue-500"
               >
                 SEED DEFAULT INVENTORY
               </button>
             )}
          </div>
        </div>

        {/* GRID */}
        <div className="flex-1 overflow-y-auto p-3 md:p-6 bg-[#0e0e0e]" style={{WebkitOverflowScrolling: 'touch'}}>
          
          {/* Mobile Filters */}
          <div className="md:hidden mb-4 flex gap-2 overflow-x-auto pb-2" style={{WebkitOverflowScrolling: 'touch'}}>
            {['All', 'Shirts', 'Pants', 'Hoodies', 'Bags', 'Accessories', 'Jackets'].map(cat => (
              <button 
                key={cat} 
                onClick={() => setFilters({...filters, category: cat})}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap border transition-colors ${
                  filters.category === cat 
                    ? 'bg-[#00ff41] text-black border-[#00ff41]' 
                    : 'border-[#333] text-gray-500 active:bg-[#222]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          
          {isAdmin && (
            <div 
              onClick={() => setEditingItem({})}
              className="mb-4 md:mb-6 p-3 md:p-4 border-2 border-dashed border-[#333] flex items-center justify-center gap-2 cursor-pointer hover:border-[#00ff41] hover:text-[#00ff41] transition-all text-gray-500"
            >
              <Plus size={18} className="md:w-5 md:h-5"/> <span className="font-bold text-xs md:text-sm uppercase">Add New Product</span>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
            {filteredItems.map(item => (
              <div key={item.id} className="group relative bg-[#111] border border-[#222] hover:border-[#00ff41]/50 transition-all duration-300 flex flex-col">
                <div className="aspect-[3/4] overflow-hidden relative bg-[#050505]">
                  <img src={item.image} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"/>
                  {/* Watermark */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-white/10 text-2xl md:text-4xl font-black uppercase tracking-widest transform rotate-[-25deg] select-none" style={{textShadow: '0 0 40px rgba(0,0,0,0.5)'}}>
                      WHIP MONTEZ
                    </div>
                  </div>
                  {/* Mobile: Always visible button */}
                  <div className="md:hidden absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent">
                    <button 
                      onClick={() => { setCart([...cart, item]); setIsCartOpen(true); }}
                      className="w-full bg-[#00ff41] text-black font-bold text-[10px] py-2 uppercase tracking-wider hover:bg-white transition-colors shadow-lg"
                    >
                      Add
                    </button>
                  </div>
                  {/* Desktop: Hover to show */}
                  <div className="hidden md:block absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black to-transparent">
                    <button 
                      onClick={() => { setCart([...cart, item]); setIsCartOpen(true); }}
                      className="w-full bg-[#00ff41] text-black font-bold text-xs py-3 uppercase tracking-widest hover:bg-white transition-colors shadow-lg"
                    >
                      Add To Cart
                    </button>
                  </div>
                  {isAdmin && (
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button onClick={() => setEditingItem(item)} className="p-2 bg-blue-600 text-white rounded hover:bg-blue-500"><Edit2 size={12}/></button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 bg-red-600 text-white rounded hover:bg-red-500"><Trash2 size={12}/></button>
                    </div>
                  )}
                </div>
                <div className="p-2 md:p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-[9px] md:text-[10px] text-[#00ff41] font-mono uppercase mb-0.5 md:mb-1">{item.category}</div>
                    <h3 className="text-white font-bold text-xs md:text-sm uppercase leading-tight mb-0.5 md:mb-1">{item.name}</h3>
                    <p className="text-gray-500 text-[10px] md:text-xs hidden sm:block">{item.desc}</p>
                  </div>
                  <div className="mt-2 md:mt-4 font-mono text-white text-base md:text-lg">${item.price}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CART */}
      {isCartOpen && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end" onClick={(e) => e.target === e.currentTarget && setIsCartOpen(false)}>
          <div className="w-full sm:max-w-md bg-[#111] border-l border-[#333] shadow-2xl flex flex-col h-full animate-slide-in-right">
            <div className="h-12 md:h-16 border-b border-[#333] flex items-center justify-between px-3 md:px-6 shrink-0">
              <h2 className="text-base md:text-xl font-black uppercase tracking-tighter text-white">CART ({cart.length})</h2>
              <button onClick={() => setIsCartOpen(false)}><X size={20} className="text-gray-400 hover:text-white"/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-3 md:space-y-4" style={{WebkitOverflowScrolling: 'touch'}}>
              {cart.map((item, i) => (
                <div key={i} className="flex gap-2 md:gap-4 border border-[#333] p-2 bg-[#0a0a0a]">
                  <img src={item.image} className="w-12 h-12 md:w-16 md:h-16 object-cover bg-[#222] shrink-0"/>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-bold text-xs md:text-sm uppercase truncate">{item.name}</div>
                    <div className="text-[#00ff41] font-mono text-[10px] md:text-xs">${item.price}</div>
                  </div>
                  <button onClick={() => setCart(cart.filter((_, idx) => idx !== i))} className="text-gray-500 hover:text-red-500 shrink-0"><X size={14}/></button>
                </div>
              ))}
              {cart.length === 0 && <div className="text-center text-gray-600 mt-10 text-sm">Cart is empty.</div>}
            </div>
            <div className="p-3 md:p-6 border-t border-[#333] shrink-0">
              <div className="flex justify-between items-end mb-3 md:mb-4">
                <span className="text-gray-500 text-[10px] md:text-xs">SUBTOTAL</span>
                <span className="text-white font-bold text-lg md:text-xl">${cart.reduce((a, b) => a + b.price, 0)}</span>
              </div>
              <button className="w-full bg-[#00ff41] text-black py-2.5 md:py-3 font-bold uppercase tracking-wider md:tracking-widest text-[10px] md:text-xs hover:bg-white transition-colors">CHECKOUT</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingItem && (
        <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <form onSubmit={handleSaveItem} className="w-full max-w-lg bg-[#111] border border-[#333] p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6 uppercase border-b border-[#333] pb-2">
              {editingItem.id ? 'Edit Product' : 'Add New Product'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Product Name</label>
                <input name="name" defaultValue={editingItem.name} className="w-full bg-black border border-[#333] text-white p-2 outline-none focus:border-[#00ff41]" required/>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Price ($)</label>
                  <input name="price" type="number" defaultValue={editingItem.price} className="w-full bg-black border border-[#333] text-white p-2 outline-none focus:border-[#00ff41]" required/>
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Category</label>
                  <select name="category" defaultValue={editingItem.category || 'Shirts'} className="w-full bg-black border border-[#333] text-white p-2 outline-none focus:border-[#00ff41]">
                    {['Shirts', 'Pants', 'Hoodies', 'Bags', 'Accessories', 'Jackets'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Image URL</label>
                <input name="image" defaultValue={editingItem.image} className="w-full bg-black border border-[#333] text-white p-2 outline-none focus:border-[#00ff41]" required/>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Description</label>
                <input name="desc" defaultValue={editingItem.desc} className="w-full bg-black border border-[#333] text-white p-2 outline-none focus:border-[#00ff41]"/>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button type="button" onClick={() => setEditingItem(null)} className="flex-1 border border-[#333] text-gray-400 py-2 hover:bg-[#222]">CANCEL</button>
              <button type="submit" className="flex-1 bg-[#00ff41] text-black font-bold py-2 hover:bg-white">SAVE CHANGES</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

// 7. GHOSTWRITER (Lyric Recovery)
const Ghostwriter = () => {
  const [prompt, setPrompt] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [loading, setLoading] = useState(false);
  const lastRequestTime = useRef(0);
  const { usage, limit, canUse, consume } = useFreeLimit('aiAgentUsage_ghostwriter', 3);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    // Cooldown check
    const cooldownTime = 3000; // 3 seconds
    const now = Date.now();
    if (now - lastRequestTime.current < cooldownTime) {
        alert(`COOLDOWN: Please wait ${((cooldownTime - (now - lastRequestTime.current)) / 1000).toFixed(1)} seconds before generating new lyrics.`);
        return;
    }

    if (!canUse) {
      setLyrics(`FREE LIMIT REACHED: ${limit} free Ghostwriter attempts used.`);
      return;
    }
    consume();

    setLoading(true);
    setLyrics("");
    const systemPrompt = "You are Whip Montez, a gritty, lyrical female rapper from Red Hook Brooklyn, circa 2004. Write an 8-bar verse about the user's topic. Use Spanglish, NY slang from the early 2000s (e.g., 'son', 'dun', 'mad', 'deadass'), and keep it confident and raw. Do not use hashtags. Format it as a verse.";
    const result = await callGemini(prompt, systemPrompt);
    lastRequestTime.current = Date.now();
    setLyrics(result);
    setLoading(false);
  };

  return (
    <div className="h-full w-full relative overflow-hidden p-6 flex flex-col items-center justify-center">
      <BackgroundCarousel images={[]} />
      <div className="absolute inset-0 bg-black/80 z-10"></div>
      <div className="relative z-20 w-full max-w-3xl border border-cyan-600 bg-[#050505]/90 p-1 shadow-[0_0_30px_rgba(0,180,255,0.4)]">
        <div className="bg-cyan-600 text-black px-2 py-1 font-bold flex justify-between items-center mb-2">
          <span>LYRIC_RECOVERY_TOOL.EXE</span>
          <div className="flex gap-1"><div className="w-3 h-3 bg-black"></div></div>
        </div>
        <div className="p-4 flex flex-col gap-4">
          <div className="text-cyan-400 font-mono text-sm mb-2">{'>'} SYSTEM ALERT: CORRUPTED LYRIC FILES DETECTED.<br/>{'>'} ENTER KEYWORDS TO ATTEMPT DATA RECOVERY...</div>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={prompt} 
              onChange={(e) => setPrompt(e.target.value)} 
              placeholder="ENTER TOPIC (e.g., 'Summertime in Brooklyn', 'Haters', 'Money')" 
              className="flex-1 bg-black border border-cyan-800 text-white p-2 font-mono outline-none focus:border-cyan-400" 
              onKeyPress={(e) => e.key === 'Enter' && handleGenerate()} 
            />
            <button 
              onClick={handleGenerate} 
              disabled={loading} 
              className="bg-cyan-600 text-black px-4 py-2 font-bold font-mono hover:bg-cyan-400 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? "RECOVERING..." : <span>INITIATE <Sparkles className="inline w-4 h-4"/></span>}
            </button>
          </div>
          <div className="min-h-[200px] border border-cyan-800 bg-[#000000] p-4 font-mono text-sm md:text-base leading-relaxed overflow-y-auto max-h-[400px]">
            {loading && <div className="text-cyan-400 animate-pulse">{'>'} SCANNING SECTORS...<br/>{'>'} DECRYPTING FLOW...<br/>{'>'} ASSEMBLING BARS...</div>}
            {!loading && lyrics && <div className="text-white whitespace-pre-line typing-cursor">{lyrics}</div>}
            {!loading && !lyrics && <div className="text-gray-600 italic">// WAITING FOR INPUT //</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

// 8. COMMUNITY HUB (The Block - RESTORED TO GREEN/BLACK OS STYLE)
const CommunityHub = ({ setSection }) => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [user, setUser] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");

  // Demo Data for Offline Mode
  const demoPosts = [
      { id: '1', user: "User_4821", content: "Just heard the new leaked track... Montez is next up for real.", likes: 12, replies: [], createdAt: { seconds: Date.now() / 1000 } },
      { id: '2', user: "BK_Finest", content: "Anyone going to the show at Rec Center tonight?", likes: 5, replies: [{ user: "User_9921", text: "Already got my tickets", createdAt: Date.now() }], createdAt: { seconds: (Date.now() - 3600000) / 1000 } },
      { id: '3', user: "Livewire_Fan", content: "Red Hook Diaries is a classic. No skips.", likes: 24, replies: [], createdAt: { seconds: (Date.now() - 86400000) / 1000 } }
  ];

  useEffect(() => {
    if (!db || !auth) {
        // Offline Mode Initialization
        setUser({ uid: "demo-user", isAnonymous: true });
        setPosts(demoPosts);
        return;
    }
    const unsubAuth = onAuthStateChanged(auth, setUser);
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'community_posts'), orderBy('createdAt', 'desc'));
    const unsubData = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unsubAuth(); unsubData(); };
  }, []);

  const handlePost = async () => {
    if ((!newPost.trim() && !mediaUrl.trim())) return;
    
    // Determine post type
    let type = 'text';
    if (mediaUrl) {
        if (mediaUrl.match(/\.(jpeg|jpg|gif|png)$/i) != null) type = 'image';
        else if (mediaUrl.match(/\.(mp4|webm)$/i) != null) type = 'video';
        else if (mediaUrl.includes('tiktok.com') || mediaUrl.includes('youtube.com/shorts')) type = 'vertical_video';
        else type = 'link'; 
    }

    const postData = {
      user: user && !user.isAnonymous ? `User_${user.uid.slice(0,4)}` : "Anon_Guest",
      content: newPost,
      mediaUrl: mediaUrl,
      mediaType: type,
      likes: 0,
      replies: [],
      createdAt: serverTimestamp(),
    };

    if (!db) {
        // Offline Post
        setPosts([{ id: Date.now().toString(), ...postData, createdAt: { seconds: Date.now() / 1000 } }, ...posts]);
    } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'community_posts'), postData);
    }

    setNewPost("");
    setMediaUrl("");
    setShowMediaInput(false);
  };

  const handleLike = async (postId, currentLikes) => {
    if (!db) {
        setPosts(posts.map(p => p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p));
        return;
    }
    const postRef = doc(db, 'artifacts', appId, 'public', 'data', 'community_posts', postId);
    await updateDoc(postRef, { likes: (currentLikes || 0) + 1 });
  };

  const handleReply = async (postId) => {
    if (!replyText.trim()) return;
    
    const newComment = {
        user: user && !user.isAnonymous ? `User_${user.uid.slice(0,4)}` : "Anon_Guest",
        text: replyText,
        createdAt: Date.now()
    };

    if (!db) {
         setPosts(posts.map(p => p.id === postId ? { ...p, replies: [...(p.replies || []), newComment] } : p));
    } else {
        const postRef = doc(db, 'artifacts', appId, 'public', 'data', 'community_posts', postId);
        await updateDoc(postRef, { 
            replies: arrayUnion(newComment) 
        });
    }
    setReplyingTo(null);
    setReplyText("");
  };

  return (
    <div className="h-full w-full relative overflow-hidden bg-[#0a0a0a] font-mono flex flex-col">
      <BackgroundCarousel images={[]} />
      <div className="absolute inset-0 bg-black/80 z-0 pointer-events-none"></div>
      
      {/* Header - Terminal Style */}
      <div className="relative z-10 border-b border-[#333] bg-[#111] shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between px-3 md:px-6 py-2 md:py-0 md:h-16 gap-2 md:gap-0">
          <div className="flex items-center gap-2 md:gap-3">
             <Users size={16} className="md:w-5 md:h-5 text-[#00ff41]" />
             <h2 className="text-sm md:text-xl font-bold text-white tracking-wider md:tracking-widest uppercase">THE_BLOCK<span className="text-[#00ff41] animate-pulse">_FEED</span></h2>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex-1 md:flex-initial md:w-64 flex items-center gap-2 bg-[#050505] border border-[#333] px-2 py-1">
              <Search size={12} className="text-[#00ff41] shrink-0"/>
              <input 
                type="text" 
                placeholder="SEARCH POSTS..."
                className="flex-1 bg-transparent text-white text-xs font-mono outline-none placeholder-gray-600 min-w-0"
                onChange={(e) => {
                  const term = e.target.value.toLowerCase();
                  if (term) {
                    const filtered = posts.filter(p => 
                      p.content?.toLowerCase().includes(term) || 
                      p.user?.toLowerCase().includes(term)
                    );
                    setPosts(filtered.length ? filtered : posts);
                  }
                }}
              />
            </div>
            <button 
              onClick={() => setSection('chat')}
              className="bg-[#00ff41]/10 border border-[#00ff41] text-[#00ff41] px-2 md:px-4 py-1 font-bold text-[9px] md:text-xs flex items-center gap-1 md:gap-2 hover:bg-[#00ff41] hover:text-black transition-colors shrink-0"
            >
              <MessageSquare size={12} className="md:w-[14px] md:h-[14px]"/><span className="hidden sm:inline">PRIVATE MSG</span><span className="sm:hidden">MSG</span>
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto p-3 md:p-6 max-w-4xl mx-auto w-full" style={{WebkitOverflowScrolling: 'touch'}}>
        <div className="space-y-3 md:space-y-6">
          
          {/* Input Area - Terminal Style */}
          <div className="border border-[#333] bg-[#050505] p-2 md:p-4 relative">
             <div className="text-[#00ff41] text-[10px] md:text-xs mb-1 md:mb-2">{'>'} INITIATE BROADCAST:</div>
             <textarea 
               value={newPost}
               onChange={(e) => setNewPost(e.target.value)}
               placeholder="Write to the block..." 
               className="w-full bg-[#111] border border-[#333] text-white text-xs md:text-sm p-2 md:p-3 outline-none resize-none h-16 md:h-20 font-mono focus:border-[#00ff41] transition-colors mb-2"
             ></textarea>
             
             {showMediaInput && (
                 <div className="flex items-center gap-2 mb-2 bg-[#111] p-1 border border-[#333]">
                     <LinkIcon size={14} className="text-[#00ff41]"/>
                     <input 
                         type="text" 
                         value={mediaUrl}
                         onChange={(e) => setMediaUrl(e.target.value)}
                         placeholder="MEDIA_URL (IMG/VIDEO)..."
                         className="flex-1 bg-transparent text-white text-xs outline-none font-mono"
                     />
                 </div>
             )}
             
             <div className="flex justify-between items-center">
               <div className="flex gap-2 md:gap-4 text-gray-500">
                 <button onClick={() => setShowMediaInput(!showMediaInput)} className={`hover:text-[#00ff41] transition-colors ${showMediaInput ? 'text-[#00ff41]' : ''}`}><ImageIcon size={14} className="md:w-4 md:h-4"/></button>
                 <button onClick={() => setShowMediaInput(!showMediaInput)} className="hover:text-[#00ff41] transition-colors"><Video size={14} className="md:w-4 md:h-4"/></button>
               </div>
               <button 
                 onClick={handlePost}
                 className="bg-[#00ff41] text-black px-3 md:px-6 py-1 text-[10px] md:text-xs font-black hover:bg-white transition-colors uppercase"
               >
                 TRANSMIT
               </button>
             </div>
          </div>

          {/* Posts Feed - Terminal Style */}
          {posts.map(post => (
            <div key={post.id} className="border border-[#333] bg-[#111] p-2 md:p-4 hover:border-[#00ff41]/50 transition-colors relative group">
              <div className="flex items-start justify-between mb-2 md:mb-3">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-6 h-6 md:w-8 md:h-8 bg-[#222] border border-[#333] flex items-center justify-center shrink-0">
                     <span className="text-[#00ff41] font-bold text-[10px] md:text-xs">{post.user.charAt(0)}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-white font-bold text-[10px] md:text-xs uppercase flex items-center gap-1 md:gap-2 flex-wrap">
                      <span className="truncate">{post.user}</span>
                      <span className="text-[8px] md:text-[9px] bg-[#00ff41]/10 text-[#00ff41] px-1 border border-[#00ff41]/30 shrink-0">CITIZEN</span>
                    </div>
                    <div className="text-gray-600 text-[9px] md:text-[10px] mt-0.5 font-mono">
                      {post.createdAt?.seconds ? new Date(post.createdAt.seconds * 1000).toLocaleString() : 'JUST NOW'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-gray-300 text-xs md:text-sm font-mono leading-relaxed pl-8 md:pl-11 mb-2 md:mb-3">
                {post.content}
              </div>

              {post.mediaUrl && (
                  <div className="pl-11 mb-3">
                      {post.mediaType === 'video' ? (
                          <div className="aspect-video bg-black border border-[#333] rounded-lg overflow-hidden shadow-lg">
                              <video src={post.mediaUrl} controls className="w-full h-full object-cover" />
                          </div>
                      ) : post.mediaType === 'vertical_video' ? (
                          <div className="max-w-[250px] aspect-[9/16] bg-black border-4 border-gray-800 rounded-2xl overflow-hidden shadow-2xl mx-auto relative group-hover:scale-105 transition-transform">
                              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-b-xl z-20"></div>
                              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-10 h-1 bg-white/50 rounded-full z-20"></div>
                              <video src={post.mediaUrl} controls className="w-full h-full object-cover" />
                          </div>
                      ) : (
                          <div className="rounded-lg border border-[#333] overflow-hidden shadow-lg">
                              <img src={post.mediaUrl} alt="Post Attachment" className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                          </div>
                      )}
                  </div>
              )}
              
              {/* Actions Bar */}
              <div className="flex gap-6 text-[10px] text-gray-500 font-mono border-t border-[#333] pt-2 pl-11">
                <button 
                  onClick={() => handleLike(post.id, post.likes)}
                  className="flex items-center gap-1 hover:text-[#00ff41] transition-colors"
                >
                  <Heart size={12}/> 
                  <span>{post.likes || 0} LIKES</span>
                </button>
                <button 
                  onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)}
                  className="flex items-center gap-1 hover:text-[#00ff41] transition-colors"
                >
                  <MessageCircle size={12}/> 
                  <span>REPLY ({post.replies?.length || 0})</span>
                </button>
              </div>

              {/* Replies Section */}
              {(post.replies?.length > 0 || replyingTo === post.id) && (
                <div className="mt-3 pl-11">
                  
                  {/* Reply Input */}
                  {replyingTo === post.id && (
                    <div className="flex gap-2 mb-3">
                      <input 
                        className="flex-1 bg-[#050505] border border-[#333] text-white text-xs p-1 outline-none font-mono focus:border-[#00ff41]"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Reply..."
                        onKeyPress={(e) => e.key === 'Enter' && handleReply(post.id)}
                        autoFocus
                      />
                      <button 
                        onClick={() => handleReply(post.id)}
                        className="bg-[#333] text-white px-3 text-[10px] font-bold hover:bg-[#00ff41] hover:text-black uppercase"
                      >
                        Send
                      </button>
                    </div>
                  )}

                  {/* Reply List */}
                  {post.replies?.length > 0 && (
                    <div className="space-y-1 border-l border-[#333] pl-3">
                      {post.replies.map((reply, idx) => (
                         <div key={idx} className="text-xs font-mono">
                            <span className="text-[#00ff41] font-bold mr-2">{reply.user}:</span>
                            <span className="text-gray-400">{reply.text}</span>
                         </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          ))}
          
          {posts.length === 0 && (
            <div className="text-center py-20 border-2 border-dashed border-[#333] text-gray-600 text-xs font-mono">
              <Activity size={48} className="text-gray-800 mx-auto mb-4"/>
              <div className="text-gray-600 font-mono text-xs tracking-widest">NO SIGNAL DETECTED</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 9. SIDEKICK CHAT
const SidekickChat = () => {
  const [messages, setMessages] = useState([
    { sender: 'whip', text: "Yo, who's this? How'd you tap into my drive?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { canUse, consume, limit } = useFreeLimit('aiAgentUsage_sidekick', 3);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    if (!canUse) {
      setMessages(prev => [...prev, { sender: 'system', text: `FREE LIMIT REACHED: ${limit} free Sidekick replies used.` }]);
      setInput("");
      return;
    }
    const userMsg = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    consume();
    
    const systemPrompt = "You are Whip Montez, a female rapper from 2004. Your hard drive has been found in 2025. You are suspicious. Speak in early 2000s NY slang. Keep responses relatively short, like an Instant Message.";
    const chatHistory = messages.map(m => `${m.sender === 'user' ? 'Stranger' : 'Whip'}: ${m.text}`).join('\n') + `\nStranger: ${input}\nWhip:`;
    
    const responseText = await callGemini(chatHistory, systemPrompt);
    setMessages(prev => [...prev, { sender: 'whip', text: responseText }]);
    setLoading(false);
  };

  return (
    <div className="h-full w-full relative overflow-hidden flex items-center justify-center p-4">
      <BackgroundCarousel images={[]} />
      <div className="absolute inset-0 bg-black/80 z-10"></div>
      <div className="relative z-20 w-full max-w-md bg-[#d4d0c8] border-2 border-white shadow-2xl flex flex-col h-[500px]">
        <div className="bg-gradient-to-r from-[#003399] to-[#0099cc] text-white px-2 py-1 flex justify-between items-center select-none">
           <div className="flex items-center gap-1 text-xs font-bold font-sans">
             <MessageSquare size={12} className="text-yellow-400"/>
             <span>Instant Message - WhipMntz04</span>
           </div>
           <div className="flex gap-1">
             <button className="w-4 h-4 bg-[#d4d0c8] border border-white border-r-gray-500 border-b-gray-500 text-black text-[10px] flex items-center justify-center">_</button>
             <button className="w-4 h-4 bg-[#d4d0c8] border border-white border-r-gray-500 border-b-gray-500 text-black text-[10px] flex items-center justify-center">X</button>
           </div>
        </div>
        <div className="bg-[#d4d0c8] text-black text-[10px] px-2 border-b border-gray-400 flex gap-2 font-sans py-0.5">
           <span className="underline">F</span>ile <span className="underline">E</span>dit <span className="underline">I</span>nsert <span className="underline">P</span>eople
        </div>
        <div className="flex-1 bg-white border-2 border-inset border-gray-400 m-1 p-2 overflow-y-auto font-sans text-sm">
           {messages.map((msg, idx) => (
             <div key={idx} className="mb-1">
                <span className={`font-bold ${msg.sender === 'user' ? 'text-red-600' : 'text-blue-700'}`}>
                  {msg.sender === 'user' ? 'You' : 'WhipMntz04'}:
                </span>
                <span className="ml-1 font-comic">{msg.text}</span>
             </div>
           ))}
           {loading && <div className="text-gray-500 italic text-xs">WhipMntz04 is typing...</div>}
           <div ref={messagesEndRef} />
        </div>
        <div className="h-24 bg-white border-2 border-inset border-gray-400 m-1 mt-0 p-2 font-sans">
           <div className="flex gap-2 mb-1 border-b border-gray-200 pb-1">
             <button className="text-xs font-bold text-blue-600 hover:bg-gray-100 px-1 rounded">A</button>
             <button className="text-xs font-bold text-gray-600 hover:bg-gray-100 px-1 rounded">A</button>
             <button className="text-xs font-bold text-gray-600 hover:bg-gray-100 px-1 rounded">B</button>
             <button className="text-xs font-bold text-gray-600 hover:bg-gray-100 px-1 rounded">I</button>
             <button className="text-xs font-bold text-gray-600 hover:bg-gray-100 px-1 rounded">U</button>
           </div>
           <textarea 
             className="w-full h-12 outline-none resize-none text-sm font-comic"
             value={input}
             onChange={(e) => setInput(e.target.value)}
             onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
             autoFocus
           />
        </div>
        <div className="flex justify-between p-1 bg-[#d4d0c8]">
           <button className="px-3 py-0.5 border border-white border-r-gray-600 border-b-gray-600 text-xs shadow-sm bg-[#d4d0c8] active:border-gray-600 active:border-r-white">Warn</button>
           <button className="px-3 py-0.5 border border-white border-r-gray-600 border-b-gray-600 text-xs shadow-sm bg-[#d4d0c8] active:border-gray-600 active:border-r-white">Block</button>
           <button 
             onClick={handleSend}
             className="px-6 py-0.5 border border-white border-r-gray-600 border-b-gray-600 text-xs font-bold active:border-gray-600 active:border-r-white"
           >
             Send
           </button>
        </div>
      </div>
    </div>
  );
};

// 10. NEWS ARCHIVE
const NewsArchive = () => {
  const [mode, setMode] = useState('historical'); // 'historical' or 'modern'
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { canUse, consume, limit } = useFreeLimit('aiAgentUsage_news', 3);

  const defaultHistorical = [
    { id: 1, date: "DEC 12 2025", time: "11:23 PM EST", source: "LIVEWIRE DAILY", author: "B. Wilson", title: "WHIP MONTEZ CATALOG RESTORED: LOST TAPES DISCOVERED", content: "After 20+ years, the complete unreleased archive of Brooklyn's Whip Montez has been digitally restored and made available online.", tags: ["HIPHOP", "RESTORATION", "NYC"] },
    { id: 2, date: "DEC 10 2025", time: "02:15 PM EST", source: "HIP HOP DX", author: "Staff", title: "RED HOOK DIARIES REACHES CULT CLASSIC STATUS", content: "The 2004 mixtape that never got proper distribution is now considered one of NYC's hidden gems.", tags: ["CLASSIC", "UNDERGROUND"] },
    { id: 3, date: "DEC 08 2025", time: "09:30 AM EST", source: "COMPLEX", author: "K. Rodriguez", title: "ERICK SERMON ON DISCOVERING WHIP MONTEZ", content: "The Def Squad legend recalls finding the Red Hook lyricist in a basement cipher back in 2004.", tags: ["INTERVIEW", "LEGENDS"] },
    { id: 4, date: "DEC 05 2025", time: "04:20 PM EST", source: "BROOKLYN VEGAN", author: "Local", title: "THE STOOP: HOW A 2001 TAPE INFLUENCED NYC RAP", content: "Musicologists trace the DNA of modern Brooklyn hip-hop back to this forgotten project.", tags: ["HISTORY", "BROOKLYN"] },
    { id: 5, date: "DEC 01 2025", time: "12:00 PM EST", source: "PITCHFORK", author: "M. Chen", title: "LIVEWIRE SESSIONS: THE LOST ALBUM THAT TIME FORGOT", content: "A deep dive into the unreleased 2004 debut that features production from legendary NYC beatmakers.", tags: ["REVIEW", "ANALYSIS"] },
    { id: 6, date: "NOV 28 2025", time: "06:45 PM EST", source: "THE FADER", author: "Editorial", title: "WHIP MONTEZ REUNION SHOW SELLS OUT IN MINUTES", content: "Brooklyn fans crash ticket website trying to secure spots for the first live performance in over 20 years.", tags: ["LIVE", "EVENTS"] },
    { id: 7, date: "NOV 25 2025", time: "03:15 PM EST", source: "REVOLT", author: "Video Team", title: "UNRELEASED FREESTYLE FOOTAGE SURFACES ONLINE", content: "Rare clips from 2004 Red Hook ciphers show Whip Montez battling alongside Ali Vegas and other NYC legends.", tags: ["VIDEO", "ARCHIVE"] },
    { id: 8, date: "NOV 20 2025", time: "10:30 AM EST", source: "VIBE", author: "R. Jackson", title: "THE LIVEWIRE MOVEMENT: NYC'S FORGOTTEN LABEL", content: "How Erick Sermon's indie imprint almost changed the game before the digital era hit.", tags: ["LABEL", "INDUSTRY"] },
    { id: 9, date: "NOV 15 2025", time: "08:00 PM EST", source: "MASS APPEAL", author: "Culture Desk", title: "SAMPLE BREAKDOWN: WHIP MONTEZ'S PRODUCTION SECRETS", content: "Producers analyze the dusty breaks and obscure loops that made the Red Hook sound so distinctive.", tags: ["PRODUCTION", "BEATS"] },
    { id: 10, date: "NOV 10 2025", time: "01:45 PM EST", source: "HYPEBEAST", author: "Fashion", title: "WHIP MONTEZ MERCH DROP: VINTAGE 2004 AESTHETIC", content: "Limited edition Livewire gear featuring original album artwork sells out in hours, fueling collector market.", tags: ["FASHION", "MERCH"] }
  ];

  useEffect(() => {
    setNewsItems(defaultHistorical);
  }, []);

  const fetchNews = async (selectedMode) => {
    setLoading(true);
    setMode(selectedMode);
    const era = selectedMode === 'historical' ? "2000-2004" : "2024-2025";
    const useSearch = selectedMode === 'modern';
    let context = selectedMode === 'historical' ? "You are a hip-hop blog editor from 2004." : `You are a Gen Z hip-hop news aggregator from 2024/2025. Search query: ${searchTerm || "Modern Hip Hop News"}.`;
    const systemPrompt = `Generate a JSON array of 10 news objects. Format: [{ "id": 1, "date": "MMM DD YYYY", "source": "SOURCE", "title": "HEADLINE", "content": "Short text", "tags": ["TAG1"] }]. No markdown.`;

    if (!canUse) {
      setNewsItems([{ id: 0, date: "", time: "", source: "SYSTEM", author: "", title: `FREE LIMIT REACHED: ${limit} free news pulls used.`, content: "", tags: ["LIMIT"] }]);
      setLoading(false);
      return;
    }
    consume();

    try {
      const response = await callGemini(`${context} Era: ${era}`, systemPrompt, useSearch);
      const cleanJson = response.replace(/```json/g, '').replace(/```/g, '').trim();
      setNewsItems(JSON.parse(cleanJson));
    } catch (e) {
      if (selectedMode === 'historical') setNewsItems(defaultHistorical);
    }
    setLoading(false);
  };

  return (
    <div className="h-full w-full relative overflow-hidden flex items-center justify-center p-4">
      <BackgroundCarousel images={[]} />
      <div className="absolute inset-0 bg-black/80 z-10"></div>
      <div className={`relative z-30 w-full max-w-5xl h-[85vh] border-2 shadow-[0_0_40px_rgba(0,255,65,0.1)] flex flex-col font-mono text-gray-300 transition-colors duration-500 ${mode === 'historical' ? 'bg-[#0a0a0a] border-[#333]' : 'bg-[#050510] border-cyan-800'}`}>
        <div className={`${mode === 'historical' ? 'bg-[#00ff41] text-black' : 'bg-cyan-500 text-black'} p-4 border-b-4 border-black flex justify-between items-end transition-colors duration-500`}>
           <div>
             <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none flex items-center gap-4">
               <Globe size={48} strokeWidth={2.5}/> {mode === 'historical' ? 'THE_FEED' : 'VIRAL_DASH'}
             </h1>
           </div>
           
           <div className="flex items-center gap-2">
              <div className="mt-4 max-w-md flex items-center gap-2 bg-black/20 p-1 rounded-sm">
                <Search size={16} className="text-black ml-2"/>
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={mode === 'historical' ? "SEARCH ARCHIVES..." : "SEARCH WEB (e.g. 'Drake News')"}
                  className="bg-transparent border-none outline-none text-black font-bold text-xs w-full placeholder-black/50"
                  onKeyPress={(e) => e.key === 'Enter' && fetchNews(mode)}
                />
                {mode === 'modern' && (
                    <button onClick={() => fetchNews(mode)} className="bg-black text-cyan-500 px-3 py-1 text-xs font-bold rounded-sm">GO</button>
                )}
             </div>
             
              <div className="flex items-center gap-2 bg-black/20 p-1 rounded ml-4">
                  <span className={`text-xs font-bold ${mode === 'historical' ? 'text-black opacity-100' : 'text-black opacity-50'}`}>2004</span>
                  <button onClick={() => fetchNews(mode === 'historical' ? 'modern' : 'historical')} disabled={loading} className="focus:outline-none">
                    {mode === 'historical' ? <ToggleLeft size={32} /> : <ToggleRight size={32} />}
                  </button>
                  <span className={`text-xs font-bold ${mode === 'modern' ? 'text-black opacity-100' : 'text-black opacity-50'}`}>2024</span>
               </div>
           </div>
        </div>
        
        <div className="flex-1 flex overflow-hidden relative">
           {loading && <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center"><RefreshCw size={48} className="animate-spin text-[#00ff41]" /></div>}
           <div className="hidden md:block w-64 bg-[#111] border-r border-[#333] p-4 overflow-y-auto shrink-0">
             <h3 className="font-bold text-[#00ff41] border-b border-[#333] pb-1 mb-2 text-sm">TAGS</h3>
             <div className="flex flex-wrap gap-2">{['#HIPHOP', '#TECH', '#NYC'].map(tag => <span key={tag} className="text-xs text-gray-500">{tag}</span>)}</div>
           </div>
           <div className="flex-1 overflow-y-auto bg-[#0a0a0a] p-4 space-y-4">
             {newsItems.map((item) => (
               <div key={item.id} className="border border-[#333] bg-[#111] p-4 hover:border-[#00ff41]">
                   <h2 className="text-xl font-bold text-[#e0e0e0] mb-2">{item.title}</h2>
                   <p className="text-sm text-gray-400">{item.content}</p>
                   <div className="flex gap-4 mt-2 text-xs text-[#00ff41]">{item.source} // {item.date}</div>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
};

// 11. RAP BATTLE
const RapBattle = () => {
  const [history, setHistory] = useState([
    { sender: 'ai', text: "Yo, step up to the mic if you think you're raw / I'll chew you up and spit you out, that's the law." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  const lastRequestTime = useRef(0);
  const { canUse, consume, limit } = useFreeLimit('aiAgentUsage_battle', 3);
  const { isListening, isSupported, startListening } = useVoiceInput((transcript) => {
    setInput(prev => prev ? prev + ' ' + transcript : transcript);
  });


  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const handleBattle = async () => {
    if (!input.trim()) return;

    // Cooldown check
    const cooldownTime = 3000; // 3 seconds
    const now = Date.now();
    if (now - lastRequestTime.current < cooldownTime) {
        alert(`COOLDOWN: Please wait ${((cooldownTime - (now - lastRequestTime.current)) / 1000).toFixed(1)} seconds before spitting another bar.`);
        return;
    }

    if (!canUse) {
      setHistory(prev => [...prev, { sender: 'ai', text: `FREE LIMIT REACHED: ${limit} free Rap Battle turns used.` }]);
      return;
    }
    consume();
    
    const userBar = { sender: 'user', text: input };
    setHistory(prev => [...prev, userBar]);
    setInput("");
    setLoading(true);

    const systemPrompt = "You are a fierce battle rapper from 2004 Brooklyn. The user is your opponent. Respond to their bar with a 2-4 line diss track verse. Be aggressive, witty, use NYC slang, and make it rhyme. Keep it under 200 characters.";
    const responseText = await callGemini(`Opponent says: "${input}". Respond with a diss.`, systemPrompt);
    
    lastRequestTime.current = Date.now();
    setHistory(prev => [...prev, { sender: 'ai', text: responseText }]);
    setLoading(false);
  };

  return (
    <div className="h-full w-full relative overflow-hidden flex items-center justify-center p-2 md:p-4">
      <BackgroundCarousel images={[]} />
      <div className="absolute inset-0 bg-black/80 z-10"></div>
      <div className="relative z-30 w-full max-w-2xl h-[85vh] md:h-[70vh] bg-[#111] border border-red-700 shadow-[0_0_20px_rgba(220,38,38,0.4)] flex flex-col overflow-hidden">
        <div className="bg-red-700 text-white px-3 md:px-4 py-2 flex justify-between items-center font-bold text-xs md:text-sm shrink-0">
           <span className="flex items-center gap-1 md:gap-2"><Flame size={14} className="md:w-[18px] md:h-[18px]"/><span className="hidden sm:inline">CIPHER_DOJO.EXE</span><span className="sm:hidden">BATTLE</span></span>
           <div className="flex gap-1"><div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-black"></div></div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-3 md:space-y-4 bg-black/90" style={{WebkitOverflowScrolling: 'touch'}}>
           {history.map((turn, i) => (
             <div key={i} className={`flex ${turn.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] md:max-w-[70%] p-2 md:p-3 border-l-4 ${turn.sender === 'user' ? 'border-red-500 bg-red-900/20 text-right' : 'border-red-500 bg-red-900/20 text-left'}`}>
                   <div className={`text-[9px] md:text-[10px] font-bold mb-1 ${turn.sender === 'user' ? 'text-red-500' : 'text-red-500'}`}>{turn.sender === 'user' ? 'YOU' : 'RIVAL MC'}</div>
                   <div className="text-white font-mono text-xs md:text-sm whitespace-pre-wrap">{turn.text}</div>
                </div>
             </div>
           ))}
           {loading && <div className="text-red-500 animate-pulse text-[10px] md:text-xs font-mono">Rival is writing a diss...</div>}
           <div ref={endRef}></div>
        </div>
        <div className="p-2 md:p-4 bg-[#1a1a1a] border-t border-[#333] flex gap-2 shrink-0">
           <input 
             type="text" value={input} onChange={(e) => setInput(e.target.value)} 
             placeholder="Spit your bars here..." 
             className="flex-1 bg-black border border-[#333] text-white p-2 font-mono text-xs md:text-sm outline-none focus:border-red-500" 
             onKeyPress={(e) => e.key === 'Enter' && handleBattle()} 
           />
           {isSupported && (
             <button 
                 onClick={startListening} 
                 disabled={loading || isListening}
                 className={`px-2 md:px-3 border border-[#333] ${isListening ? 'bg-red-600 animate-pulse' : 'bg-black hover:bg-red-900'} text-white transition-colors disabled:opacity-50`}
                 title="Voice input"
             >
                 <Mic size={16} className="md:w-5 md:h-5"/>
             </button>
           )}
           <button onClick={handleBattle} disabled={loading} className="bg-red-600 text-white px-4 md:px-6 py-2 font-bold font-mono hover:bg-red-500 transition-colors uppercase disabled:opacity-50">SPIT</button>
        </div>
      </div>
    </div>
  );
};

// 12. CRATE DIGGER
const CrateDigger = () => {
  const [mood, setMood] = useState("");
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(false);
  const lastRequestTime = useRef(0);
  const { canUse, consume, limit } = useFreeLimit('aiAgentUsage_crates', 3);
  const { isListening, isSupported, startListening } = useVoiceInput((transcript) => {
    setMood(prev => prev ? prev + ' ' + transcript : transcript);
  });

  const handleDig = async () => {
    if (!mood.trim()) return;

    // Cooldown check
    const cooldownTime = 3000; // 3 seconds
    const now = Date.now();
    if (now - lastRequestTime.current < cooldownTime) {
        alert(`COOLDOWN: Please wait ${((cooldownTime - (now - lastRequestTime.current)) / 1000).toFixed(1)} seconds before digging again.`);
        return;
    }

    if (!canUse) {
      setSamples([{ artist: 'SYSTEM', track: `FREE LIMIT REACHED`, year: '', desc: `${limit} free digs used.` }]);
      return;
    }
    consume();

    setLoading(true);
    setSamples([]);
    const systemPrompt = "You are a crate digger. Suggest 3 obscure 70s/80s records based on the user's mood. JSON format: [{ \"artist\": \"\", \"track\": \"\", \"year\": \"\", \"desc\": \"\" }]. No markdown.";
    const responseText = await callGemini(mood, systemPrompt);
    try {
      const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      setSamples(JSON.parse(cleanText));
    } catch (e) { console.error("Parse error", e); }
    lastRequestTime.current = Date.now();
    setLoading(false);
  };

  return (
    <div className="h-full w-full relative overflow-hidden flex items-center justify-center p-2 md:p-4">
      <BackgroundCarousel images={[]} />
      <div className="absolute inset-0 bg-black/80 z-10"></div>
      <div className="relative z-30 w-full max-w-3xl h-[85vh] md:h-[80vh] bg-[#111] border border-yellow-600 shadow-[0_0_20px_rgba(250,204,21,0.4)] flex flex-col">
        <div className="bg-yellow-600 text-black px-3 md:px-4 py-2 flex justify-between items-center font-bold text-xs md:text-sm">
           <span className="flex items-center gap-2"><Disc size={16} className="md:w-[18px] md:h-[18px]"/> <span className="hidden sm:inline">CRATE_DIGGER_PRO.EXE</span><span className="sm:hidden">CRATE DIGGER</span></span>
           <div className="flex gap-1"><div className="w-3 h-3 bg-black"></div></div>
        </div>
        <div className="p-3 md:p-6 bg-[#1a1a1a] border-b border-[#333]">
           <h2 className="text-white font-black text-lg md:text-2xl mb-2">FIND THE PERFECT SAMPLE</h2>
           <div className="flex flex-col sm:flex-row gap-2">
             <div className="flex gap-2 flex-1">
               <input type="text" value={mood} onChange={(e) => setMood(e.target.value)} placeholder="Enter a vibe..." className="flex-1 bg-black border border-[#333] text-white p-2 md:p-3 font-mono text-sm md:text-base outline-none focus:border-yellow-600" onKeyPress={(e) => e.key === 'Enter' && handleDig()} />
               {isSupported && (
                 <button 
                     onClick={startListening} 
                     disabled={loading || isListening}
                     className={`px-2 md:px-3 border border-[#333] ${isListening ? 'bg-yellow-600 animate-pulse' : 'bg-black hover:bg-yellow-900'} text-white transition-colors disabled:opacity-50`}
                     title="Voice input"
                 >
                     <Mic size={16} className="md:w-5 md:h-5"/>
                 </button>
               )}
             </div>
             <button onClick={handleDig} disabled={loading} className="bg-yellow-600 text-black px-6 py-2 md:py-3 font-bold hover:bg-yellow-500 text-sm md:text-base whitespace-nowrap">DIG</button>
           </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 md:p-6 bg-[#0a0a0a]">
           {samples.map((sample, i) => (
             <div key={i} className="flex gap-3 md:gap-4 p-3 md:p-4 border border-[#333] bg-[#111] mb-2 hover:border-yellow-600">
                <div className="flex-1">
                   <div className="text-yellow-600 text-[10px] md:text-xs font-bold mb-1">{sample.year} // {sample.artist}</div>
                   <div className="text-white font-black text-base md:text-xl">{sample.track}</div>
                   <div className="text-gray-400 text-xs md:text-sm mt-1">{sample.desc}</div>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

// 13. A&R SUITE
const ARSuite = () => {
  const [demoText, setDemoText] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const lastRequestTime = useRef(0);
  const { canUse, consume, limit } = useFreeLimit('aiAgentUsage_ar', 3);
  const { isListening, isSupported, startListening } = useVoiceInput((transcript) => {
    setDemoText(prev => prev ? prev + '\n' + transcript : transcript);
  });

  const handleReview = async () => {
    if (!demoText.trim()) return;
    
    // Cooldown check
    const cooldownTime = 3000; // 3 seconds
    const now = Date.now();
    if (now - lastRequestTime.current < cooldownTime) {
        alert(`COOLDOWN: Please wait ${((cooldownTime - (now - lastRequestTime.current)) / 1000).toFixed(1)} seconds before submitting again.`);
        return;
    }

    if (!canUse) {
      setFeedback({ critique: `FREE LIMIT REACHED: ${limit} free A&R reviews used.`, commercial: 'N/A', street: 'N/A' });
      return;
    }
    consume();

    setLoading(true);
    setFeedback(null); // Clear previous feedback
    const systemPrompt = "You are an A&R. Critique these lyrics. JSON format: { \"critique\": \"\", \"commercial\": 0-10, \"street\": 0-10 }.";
    
    const responseText = await callGemini(demoText, systemPrompt);
    
    try {
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      setFeedback(JSON.parse(cleanJson));
    } catch (e) { 
        console.error("Failed to parse A&R response:", e);
        setFeedback({ critique: "ERROR: Failed to process analysis data.", commercial: 'N/A', street: 'N/A' });
    }
    lastRequestTime.current = Date.now();
    setLoading(false);
  };

  return (
    <div className="h-full w-full relative overflow-hidden flex flex-col items-center justify-center p-2 md:p-4">
      <BackgroundCarousel images={[]} />
      <div className="absolute inset-0 bg-black/80 z-10"></div>
      <div className="relative z-30 w-full max-w-4xl h-[85vh] bg-[#1a1a1a] border border-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.4)] flex flex-col">
        <div className="bg-blue-600 text-white px-3 md:px-4 py-2 flex justify-between items-center font-bold text-xs md:text-sm">
          <span className="flex items-center gap-2"><Briefcase size={16} className="md:w-[18px] md:h-[18px]"/> <span className="hidden sm:inline">A&R_DASHBOARD.EXE</span><span className="sm:hidden">A&R</span></span>
        </div>
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <div className="w-full md:w-1/2 p-3 md:p-6 border-b md:border-r md:border-b-0 border-[#333] flex flex-col">
             <textarea className="flex-1 bg-black border border-[#333] text-white p-3 md:p-4 font-mono text-xs md:text-sm resize-none focus:border-blue-500 outline-none mb-2" placeholder="Paste lyrics..." value={demoText} onChange={(e) => setDemoText(e.target.value)} />
             <div className="flex gap-2">
               {isSupported && (
                 <button 
                     onClick={startListening} 
                     disabled={loading || isListening}
                     className={`px-3 py-2 border border-[#333] ${isListening ? 'bg-blue-600 animate-pulse' : 'bg-black hover:bg-blue-900'} text-white transition-colors disabled:opacity-50 flex items-center gap-2 text-xs`}
                 >
                     <Mic size={16}/> {isListening ? 'LISTENING...' : 'VOICE'}
                 </button>
               )}
               <button onClick={handleReview} disabled={loading} className="flex-1 bg-blue-600 text-white py-2 md:py-3 font-bold hover:bg-blue-500 uppercase disabled:opacity-50 text-xs md:text-sm">
                  {loading ? "ANALYZING RHYMES..." : "SUBMIT FOR REVIEW"}
               </button>
             </div>
          </div>
          <div className="w-full md:w-1/2 p-3 md:p-6 bg-[#111] overflow-y-auto">
             {loading && (
                 <div className="text-blue-500 animate-pulse text-base md:text-xl font-mono flex flex-col items-center py-10">
                     <RefreshCw size={24} className="md:w-8 md:h-8 mb-4 animate-spin"/>
                     A&R IS PROCESSING...
                 </div>
             )}
             {feedback && (
               <div className="space-y-4 md:space-y-6">
                 <div className="flex gap-3 md:gap-4 text-center">
                   <div className="flex-1 bg-black border border-blue-600 p-3 md:p-4"><div className="text-[10px] md:text-xs text-gray-500">RADIO</div><div className="text-2xl md:text-3xl font-black text-white">{feedback.commercial}/10</div></div>
                   <div className="flex-1 bg-black border border-red-600 p-3 md:p-4"><div className="text-[10px] md:text-xs text-gray-500">STREETS</div><div className="text-2xl md:text-3xl font-black text-white">{feedback.street}/10</div></div>
                 </div>
                 <div className="bg-black/50 p-3 md:p-4 border-l-4 border-blue-600 text-xs md:text-sm text-gray-300">{feedback.critique}</div>
               </div>
             )}
             {feedback && (
               <div className="space-y-4 md:space-y-6">
                 <div className="flex gap-3 md:gap-4 text-center">
                   <div className="flex-1 bg-black border border-blue-600 p-3 md:p-4"><div className="text-[10px] md:text-xs text-gray-500">RADIO</div><div className="text-2xl md:text-3xl font-black text-white">{feedback.commercial}/10</div></div>
                   <div className="flex-1 bg-black border border-red-600 p-3 md:p-4"><div className="text-[10px] md:text-xs text-gray-500">STREETS</div><div className="text-2xl md:text-3xl font-black text-white">{feedback.street}/10</div></div>
                 </div>
                 <div className="bg-black/50 p-3 md:p-4 border-l-4 border-blue-600 text-xs md:text-sm text-gray-300">{feedback.critique}</div>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 15. NEW FEATURE: ALBUM ART GENERATOR (Future Cyber Look)
const AlbumArtGenerator = ({ user, onAuthRequest }) => {
    const [prompt, setPrompt] = useState("A gritty, neon-lit cyberpunk street corner in Red Hook, Brooklyn with a vinyl record.");
    const [imageUrl, setImageUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const lastRequestTime = useRef(0);
  const { canUse, consume, limit } = useFreeLimit('aiAgentUsage_albumart', 3);
    const { isListening, isSupported, startListening } = useVoiceInput((transcript) => {
      setPrompt(prev => prev ? prev + ' ' + transcript : transcript);
    });
    
    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setLoading(true);
        setImageUrl(null);
        
        // Cooldown check
        const cooldownTime = 3000; // 3 seconds
        const now = Date.now();
        if (now - lastRequestTime.current < cooldownTime) {
            alert(`COOLDOWN: Please wait ${((cooldownTime - (now - lastRequestTime.current)) / 1000).toFixed(1)} seconds before generating again.`);
            setLoading(false);
            return;
        }

        if (!canUse) {
          alert(`FREE LIMIT REACHED: ${limit} free Album Art generations used.`);
          setLoading(false);
          return;
        }
        consume();
        
        // Pass "Album Cover" in the prompt to trigger the image generation path in callGemini
        const fullPrompt = "Album Cover: " + prompt; 
        
        const resultString = await callGemini(fullPrompt, "", false);

        try {
            const result = JSON.parse(resultString);
            const base64Data = result.predictions?.[0]?.bytesBase64Encoded;
            
            if (base64Data) {
                const url = `data:image/png;base64,${base64Data}`;
                setImageUrl(url);
            } else {
                 console.error("Image generation failed:", result.error || resultString);
                 // Fallback image using the mock base64 data to avoid crash
                 const mockImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
                 setImageUrl(`data:image/png;base64,${mockImageBase64}`);
            }
        } catch (e) {
            console.error("Failed to parse image response:", e);
            setImageUrl(null);
             // Use fallback image if parsing fails
            const mockImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
            setImageUrl(`data:image/png;base64,${mockImageBase64}`);
        }
        lastRequestTime.current = Date.now();
        setLoading(false);
    };

    const handleSave = async () => {
      if (!imageUrl) return;
      
      setSaving(true);
      try {
        const result = await saveToLibrary(user, 'album_art', imageUrl, { 
          prompt,
          generatedAt: new Date().toISOString()
        });
        
        if (result === 'auth_required') {
          onAuthRequest();
        } else if (result) {
          alert('✓ Saved to your library!');
        }
      } catch (error) {
        alert('Save failed: ' + error.message);
      } finally {
        setSaving(false);
      }
    };

    return (
        <div className="h-full w-full relative overflow-hidden flex flex-col items-center justify-center p-2 md:p-4">
            <BackgroundCarousel images={[]} />
            <div className="absolute inset-0 bg-black/80 z-10"></div>
            <div className="relative z-20 w-full max-w-4xl h-[90vh] md:h-[85vh] bg-[#1a1a1a] border border-pink-500 shadow-[0_0_30px_rgba(236,72,153,0.4)] flex flex-col overflow-hidden">
                <div className="bg-pink-600 text-white px-3 md:px-4 py-2 flex justify-between items-center font-bold shrink-0">
                    <span className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                      <Camera size={14} className="md:w-[18px] md:h-[18px]"/> 
                      <span className="hidden sm:inline">ALBUM_ART_GENERATOR.EXE</span>
                      <span className="sm:hidden">ALBUM_ART_GEN</span>
                    </span>
                </div>
                
                <div className="p-3 md:p-6 bg-[#111] border-b border-[#333] shrink-0">
                    <h2 className="text-white font-black text-sm md:text-xl mb-2">GENERATE COVER ART</h2>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex gap-2 flex-1">
                          <input 
                              type="text" 
                              value={prompt} 
                              onChange={(e) => setPrompt(e.target.value)} 
                              placeholder="Describe your album cover..." 
                              className="flex-1 bg-black border border-[#333] text-white p-2 md:p-3 text-xs md:text-sm font-mono outline-none focus:border-pink-500" 
                              onKeyPress={(e) => e.key === 'Enter' && handleGenerate()} 
                          />
                          {isSupported && (
                            <button 
                                onClick={startListening} 
                                disabled={loading || isListening}
                                className={`px-2 md:px-3 py-2 border border-[#333] ${isListening ? 'bg-pink-600 animate-pulse' : 'bg-black hover:bg-pink-900'} text-white transition-colors disabled:opacity-50`}
                                title="Voice input"
                            >
                                <Mic size={16} className="md:w-5 md:h-5"/>
                            </button>
                          )}
                        </div>
                        <button 
                            onClick={handleGenerate} 
                            disabled={loading} 
                            className="bg-pink-600 text-white px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-bold hover:bg-pink-500 uppercase disabled:opacity-50 active:scale-95 transition-transform"
                        >
                            {loading ? "PROCESSING..." : "GENERATE"}
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 md:p-6 bg-[#0a0a0a] flex items-center justify-center" style={{WebkitOverflowScrolling: 'touch'}}>
                    {loading && (
                        <div className="text-pink-500 animate-pulse text-sm md:text-xl font-mono flex flex-col items-center">
                            <RefreshCw size={24} className="md:w-8 md:h-8 mb-4 animate-spin"/>
                            <span className="text-xs md:text-base">SCANNING THE GRID FOR IMAGES...</span>
                        </div>
                    )}
                    {imageUrl && !loading && (
                        <div className="w-full max-w-[280px] sm:max-w-xs md:max-w-md aspect-square border-2 md:border-4 border-white shadow-[0_0_20px_rgba(236,72,153,0.5)] relative">
                            <img src={imageUrl} alt="Generated Album Art" className="w-full h-full object-cover"/>
                            <div className="absolute top-1 md:top-2 left-1 md:left-2 bg-black/70 text-white text-[9px] md:text-[10px] font-mono px-1 md:px-2 py-0.5 md:py-1">RESULT: {prompt.substring(0, 20)}...</div>
                            <div className="absolute bottom-1 md:bottom-2 right-1 md:right-2 flex gap-1 md:gap-2">
                              <button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-cyan-600 text-white text-[10px] md:text-xs font-bold px-2 md:px-3 py-1 hover:bg-cyan-500 transition-colors active:scale-95 disabled:opacity-50 flex items-center gap-1"
                                title="Save to library"
                              >
                                <Heart size={10} className="md:w-3 md:h-3"/> {saving ? 'SAVING...' : 'SAVE'}
                              </button>
                              <a 
                                href={imageUrl} 
                                download={`album-art-${Date.now()}.png`}
                                className="bg-[#00ff41] text-black text-[10px] md:text-xs font-bold px-2 md:px-3 py-1 hover:bg-white transition-colors active:scale-95 inline-block"
                              >
                                DOWNLOAD
                              </a>
                            </div>
                        </div>
                    )}
                    {!imageUrl && !loading && (
                        <div className="text-gray-600 text-center font-mono text-xs md:text-sm">
                            <Camera size={32} className="md:w-12 md:h-12 mx-auto mb-4 text-gray-700"/>
                            AWAITING ART GENERATION REQUEST.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// 18. NEW FEATURE: SOCIAL MEDIA MUSIC VIDEO AI AGENT
const ViralVideoAgent = ({ user, onAuthRequest }) => {
    const [trackIdea, setTrackIdea] = useState("");
    const [concepts, setConcepts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isWhipMode, setIsWhipMode] = useState(false);
    const lastRequestTime = useRef(0);
  const { canUse, consume, limit } = useFreeLimit('aiAgentUsage_viral', 3);
    const { isListening, isSupported, startListening } = useVoiceInput((transcript) => {
      setTrackIdea(prev => prev ? prev + ' ' + transcript : transcript);
    });

    const handleGenerate = async () => {
        if (!trackIdea.trim()) return;

        // Cooldown check
        const cooldownTime = 3000; // 3 seconds
        const now = Date.now();
        if (now - lastRequestTime.current < cooldownTime) {
            alert(`COOLDOWN: Please wait ${((cooldownTime - (now - lastRequestTime.current)) / 1000).toFixed(1)} seconds before generating new concepts.`);
            return;
        }

        if (!canUse) {
          setConcepts([{ concept: 'FREE LIMIT REACHED', visual: `${limit} free Viral Video runs used.`, trend: 'LIMIT', shots: ['Upgrade required'] }]);
          return;
        }

        consume();

        setLoading(true);
        setConcepts([]);

        let prompt = isWhipMode
            ? `Generate video ideas for a Whip Montez track based on: ${trackIdea}`
            : `Generate general music video ideas based on: ${trackIdea}`;
        
        let systemPrompt = "You are the Viral Video Agent (VVA) for Livewire Entertainment, specializing in short-form social media video trends (TikTok, Reels). Given a track idea, generate a JSON array of 3 distinct music video concepts designed for maximum viral impact. Format: [{ 'concept': 'Short Title', 'visual': 'Brief visual description', 'trend': 'Current Trend Style (e.g., POV, Seamless Transition)', 'shots': ['Shot 1', 'Shot 2'] }]. Do not use markdown backticks or formatting outside the JSON array.";

        if (isWhipMode) {
             systemPrompt = "You are the Viral Video Agent (VVA) for Livewire Entertainment. Generate 3 concepts focused on Whip Montez's 2004 aesthetic (NYC, boom-bap, red hook) but optimized for 2025 social media trends. JSON output only.";
        }

        const responseText = await callGemini(prompt, systemPrompt);

        try {
            const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsedConcepts = JSON.parse(cleanJson);
            setConcepts(parsedConcepts);
        } catch (e) {
            console.error("Failed to parse VVA response:", e);
            setConcepts([{ concept: "ERROR", visual: "Failed to load concepts. Check API status.", trend: "SYSTEM FAIL", shots: ["System Failure"] }]);
        }
        lastRequestTime.current = Date.now();
        setLoading(false);
    };
    
    const handleUpload = (platform) => {
        // Simple simulation of an upload action
        alert(`Simulating upload of current concept to ${platform}...\nStatus: Publishing concept to Livewire servers.`);
    }


    return (
        <div className="h-full w-full relative overflow-hidden flex flex-col items-center justify-center p-2 md:p-4">
            <BackgroundCarousel images={[]} />
            <div className="absolute inset-0 bg-black/80 z-10"></div>
            <div className="relative z-20 w-full max-w-5xl h-[90vh] md:h-[85vh] bg-[#1a1a1a] border border-cyan-500 shadow-[0_0_30px_rgba(0,255,255,0.4)] flex flex-col overflow-hidden">
                <div className="bg-cyan-700 text-white px-3 md:px-4 py-2 flex justify-between items-center font-bold shrink-0">
                    <span className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                      <TrendingUp size={14} className="md:w-[18px] md:h-[18px]"/> 
                      <span className="hidden sm:inline">VIRAL_VIDEO_AGENT.EXE</span>
                      <span className="sm:hidden">VIRAL_VID_AGENT</span>
                    </span>
                </div>
                
                <div className="p-3 md:p-6 bg-[#111] border-b border-[#333] shrink-0">
                    <h2 className="text-white font-black text-sm md:text-xl mb-2 md:mb-3">GENERATE VIRAL CONCEPTS</h2>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 md:mb-4 gap-2">
                        <div className="flex items-center gap-2 text-[10px] md:text-xs font-mono text-gray-400">
                             MODE: 
                             <button onClick={() => setIsWhipMode(!isWhipMode)} className="flex items-center gap-1 border border-cyan-800 px-1.5 md:px-2 py-0.5 bg-black hover:border-cyan-500 transition-colors active:scale-95">
                                {isWhipMode ? <ToggleRight size={14} className="md:w-4 md:h-4 text-cyan-500"/> : <ToggleLeft size={14} className="md:w-4 md:h-4 text-gray-500"/>}
                                <span className="hidden sm:inline">{isWhipMode ? "WHIP MONTEZ SPECIFIC" : "GENERAL TRENDS"}</span>
                                <span className="sm:hidden">{isWhipMode ? "WHIP" : "GENERAL"}</span>
                             </button>
                        </div>
                        <button onClick={() => setConcepts([])} className="text-[10px] md:text-xs text-gray-500 hover:text-red-500 flex items-center gap-1 active:scale-95">
                            <Trash2 size={10} className="md:w-3 md:h-3"/> CLEAR RESULTS
                        </button>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex gap-2 flex-1">
                          <input 
                              type="text" 
                              value={trackIdea} 
                              onChange={(e) => setTrackIdea(e.target.value)} 
                              placeholder={isWhipMode ? "Enter key elements of your new Whip Montez track..." : "Enter track mood or title for general concepts..."} 
                              className="flex-1 bg-black border border-cyan-800 text-white p-2 md:p-3 text-xs md:text-sm font-mono outline-none focus:border-cyan-500" 
                              onKeyPress={(e) => e.key === 'Enter' && handleGenerate()} 
                          />
                          {isSupported && (
                            <button 
                                onClick={startListening} 
                                disabled={loading || isListening}
                                className={`px-2 md:px-3 py-2 border border-cyan-800 ${isListening ? 'bg-cyan-600 animate-pulse' : 'bg-black hover:bg-cyan-900'} text-white transition-colors disabled:opacity-50`}
                                title="Voice input"
                            >
                                <Mic size={16} className="md:w-5 md:h-5"/>
                            </button>
                          )}
                        </div>
                        <button 
                            onClick={handleGenerate} 
                            disabled={loading} 
                            className="bg-cyan-600 text-black px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-bold hover:bg-cyan-500 uppercase disabled:opacity-50 active:scale-95 shrink-0"
                        >
                            {loading ? "ANALYZING..." : "GENERATE CONCEPTS"}
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 md:p-6 bg-[#0a0a0a] space-y-4 md:space-y-6" style={{WebkitOverflowScrolling: 'touch'}}>
                    {loading && (
                        <div className="text-cyan-400 animate-pulse text-sm md:text-xl font-mono flex flex-col items-center py-10">
                            <RefreshCw size={24} className="md:w-8 md:h-8 mb-4 animate-spin"/>
                            <span className="text-xs md:text-base">SCANNING VIRAL TRENDS...</span>
                        </div>
                    )}
                    {concepts.length > 0 && !loading && (
                        <div className="space-y-4 md:space-y-6">
                            <h3 className="text-cyan-400 font-bold text-sm md:text-lg border-b border-cyan-800 pb-2">RECOMMENDED VIRAL CONCEPTS ({concepts.length})</h3>
                            
                            {/* Upload Buttons */}
                            <div className="flex flex-col sm:flex-row gap-2 md:gap-4">
                                <span className="text-[10px] md:text-xs font-mono text-gray-500 sm:pt-3">DISTRIBUTE CONCEPT TO:</span>
                                <div className="flex gap-2 flex-wrap">
                                  <button onClick={() => handleUpload("TikTok")} className="bg-white text-black font-bold text-[10px] md:text-xs px-2 md:px-3 py-1 md:py-1.5 hover:bg-gray-200 active:scale-95">TIKTOK</button>
                                  <button onClick={() => handleUpload("Instagram")} className="bg-white text-black font-bold text-[10px] md:text-xs px-2 md:px-3 py-1 md:py-1.5 hover:bg-gray-200 active:scale-95">INSTAGRAM REELS</button>
                                  <button onClick={() => handleUpload("Facebook")} className="bg-white text-black font-bold text-[10px] md:text-xs px-2 md:px-3 py-1 md:py-1.5 hover:bg-gray-200 active:scale-95">FACEBOOK SHORTS</button>
                                </div>
                            </div>
                            
                            {concepts.map((concept, index) => (
                                <div key={index} className="bg-[#111] border border-cyan-900 p-3 md:p-4 shadow-md">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 md:mb-3 gap-2">
                                        <h4 className="text-white font-black text-sm md:text-xl flex items-center gap-2 flex-wrap">
                                            <span className="break-words">{concept.concept}</span>
                                            <span className="text-[10px] md:text-xs text-black bg-cyan-400 font-bold px-1.5 md:px-2 py-0.5 shrink-0">{concept.trend}</span>
                                        </h4>
                                    </div>
                                    <p className="text-gray-400 text-xs md:text-sm italic mb-2 md:mb-3">{concept.visual}</p>
                                    <div className="mt-2 md:mt-3">
                                        <h5 className="text-cyan-500 text-[10px] md:text-xs font-bold uppercase mb-1">KEY SHOTS:</h5>
                                        <ul className="text-gray-500 text-[10px] md:text-xs space-y-0.5 list-disc list-inside">
                                            {concept.shots.map((shot, i) => <li key={i}>{shot}</li>)}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {!concepts.length && !loading && (
                        <div className="text-gray-600 text-center font-mono text-xs md:text-sm py-10">
                            <TrendingUp size={32} className="md:w-12 md:h-12 mx-auto mb-4 text-gray-700"/>
                            AGENT READY. ENTER A TRACK IDEA ABOVE.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// 16. STUDIO HUB - Cleaned up to reflect remaining features (2025 Future Look)
const StudioHub = ({ setSection }) => {
  return (
    <div className="h-full w-full relative overflow-hidden flex items-center justify-center p-4">
      <BackgroundCarousel images={[]} />
      <div className="absolute inset-0 bg-black/80 z-10"></div>
      <div className="relative z-30 w-full max-w-6xl h-[85vh] flex flex-col justify-center items-center gap-8">
         <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-black chrome-text tracking-tighter mb-2" style={{ textShadow: '2px 2px 0px #000, 0 0 20px rgba(0,180,255,0.4)' }}>THE LAB</h1>
            <p className="text-cyan-400 font-mono tracking-[0.5em] text-sm">LIVEWIRE FUTURE SUITE (2025)</p>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full overflow-y-auto p-4 custom-scrollbar">
            
            {/* CORE AI TOOLS */}
            <div onClick={() => setSection('ar_suite')} className="group bg-[#111] border-2 border-blue-900 p-6 flex flex-col items-center text-center hover:border-blue-500 cursor-pointer h-64 justify-center shadow-lg hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] transition-all">
               <Briefcase size={48} className="text-blue-500 mb-4 group-hover:text-blue-400 transition-colors"/>
               <h2 className="text-xl font-black text-white uppercase">A&R Suite</h2>
               <p className="text-[10px] text-gray-600 mt-2 font-mono">AI LYRIC ANALYSIS</p>
            </div>
            
            <div onClick={() => setSection('battle')} className="group bg-[#111] border-2 border-red-900 p-6 flex flex-col items-center text-center hover:border-red-500 cursor-pointer h-64 justify-center shadow-lg hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] transition-all">
               <Flame size={48} className="text-red-600 mb-4 group-hover:text-red-400 transition-colors"/>
               <h2 className="text-xl font-black text-white uppercase">The Cipher</h2>
               <p className="text-[10px] text-gray-600 mt-2 font-mono">FREESTYLE BATTLE SIM</p>
            </div>

            <div onClick={() => setSection('album_art')} className="group bg-[#111] border-2 border-pink-900 p-6 flex flex-col items-center text-center hover:border-pink-500 cursor-pointer h-64 justify-center shadow-lg hover:shadow-[0_0_30px_rgba(236,72,153,0.6)] transition-all">
               <Camera size={48} className="text-pink-500 mb-4 group-hover:text-pink-400 transition-colors"/>
               <h2 className="text-xl font-black text-white uppercase">Album Art Generator</h2>
               <p className="text-[10px] text-gray-600 mt-2 font-mono">AI IMAGE GENERATION</p>
            </div>
            
            <div onClick={() => setSection('crates')} className="group bg-[#111] border-2 border-yellow-900 p-6 flex flex-col items-center text-center hover:border-yellow-500 cursor-pointer h-64 justify-center shadow-lg hover:shadow-[0_0_30px_rgba(250,204,21,0.6)] transition-all">
               <Disc size={48} className="text-yellow-600 mb-4 group-hover:text-yellow-400 transition-colors"/>
               <h2 className="text-xl font-black text-white uppercase">Crate Digger</h2>
               <p className="text-[10px] text-gray-600 mt-2 font-mono">SAMPLE FINDER</p>
            </div>
            
            <div onClick={() => setSection('ghostwriter')} className="group bg-[#111] border-2 border-cyan-800 p-6 flex flex-col items-center text-center hover:border-cyan-500 cursor-pointer h-64 justify-center shadow-lg hover:shadow-[0_0_30px_rgba(0,180,255,0.6)] transition-all">
               <Mic size={48} className="text-cyan-500 mb-4 group-hover:text-cyan-400 transition-colors"/>
               <h2 className="text-xl font-black text-white uppercase">Ghostwriter</h2>
               <p className="text-[10px] text-gray-600 mt-2 font-mono">LYRIC RECOVERY TOOL</p>
            </div>

            {/* NEW VVA AGENT */}
            <div onClick={() => setSection('viral_video')} className="group bg-[#111] border-2 border-green-700 p-6 flex flex-col items-center text-center hover:border-green-500 cursor-pointer h-64 justify-center shadow-lg hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] transition-all">
               <TrendingUp size={48} className="text-green-500 mb-4 group-hover:text-green-400 transition-colors"/>
               <h2 className="text-xl font-black text-white uppercase">Viral Video Agent</h2>
               <p className="text-[10px] text-gray-600 mt-2 font-mono">SOCIAL MEDIA CONCEPTS</p>
            </div>
         </div>
      </div>
    </div>
  );
};

// AUTH MODAL COMPONENT
const AuthModal = ({ onClose, onAuth }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!auth) {
      setError('Auth not available in demo mode');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onAuth();
      onClose();
    } catch (err) {
      setError(err.message.replace('Firebase: ', '').replace(/\(auth.*?\)/, ''));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (!auth) {
      setError('Auth not available in demo mode');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onAuth();
      onClose();
    } catch (err) {
      setError(err.message.replace('Firebase: ', '').replace(/\(auth.*?\)/, ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 animate-fade-in">
      <div className="w-full max-w-md bg-[#1a1a1a] border-2 border-cyan-500 shadow-[0_0_40px_rgba(0,255,255,0.4)]">
        <div className="bg-cyan-700 text-white px-4 py-2 flex justify-between items-center">
          <span className="font-mono font-bold text-sm flex items-center gap-2">
            <User size={16}/> USER_AUTH.EXE
          </span>
          <button onClick={onClose} className="hover:text-black transition-colors">
            <X size={18}/>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="text-center mb-6">
            <h2 className="text-white font-black text-xl mb-2">
              {isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'}
            </h2>
            <p className="text-gray-400 text-xs font-mono">
              {isSignUp ? 'Sign up to save your creations' : 'Login is optional but enables saving'}
            </p>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-500 text-red-300 p-3 text-xs font-mono">
              ERROR: {error}
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="EMAIL"
              className="w-full bg-black border border-[#333] text-white p-3 text-sm font-mono outline-none focus:border-cyan-500"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="PASSWORD"
              className="w-full bg-black border border-[#333] text-white p-3 text-sm font-mono outline-none focus:border-cyan-500"
              required
              minLength={6}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-600 text-black py-3 font-bold text-sm uppercase hover:bg-cyan-500 transition-colors disabled:opacity-50"
            >
              {loading ? 'PROCESSING...' : (isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN')}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#333]"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#1a1a1a] px-2 text-gray-500 font-mono">OR</span>
            </div>
          </div>

          <button
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full bg-white text-black py-3 font-bold text-sm uppercase hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Globe size={16}/> SIGN IN WITH GOOGLE
          </button>

          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full text-cyan-400 text-xs font-mono hover:text-cyan-300 transition-colors"
          >
            {isSignUp ? 'Already have an account? SIGN IN' : "Don't have an account? CREATE ONE"}
          </button>

          <button
            onClick={onClose}
            className="w-full text-gray-500 text-xs font-mono hover:text-gray-400 transition-colors"
          >
            SKIP (Continue as guest)
          </button>
        </div>
      </div>
    </div>
  );
};

// 17. MAIN OS SHELL
const OSInterface = ({ reboot }) => {
  const [activeSection, setActiveSection] = useState('home');
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    // 1. Start System Clock
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);

    // 2. Initialize Auth
    let unsubscribe = () => {};

    const initAuth = async () => {
      // If no auth instance (Offline/Demo mode)
      if (!auth) {
        console.log("OS running in Offline/Demo Mode");
        setUser({ uid: "guest", isAnonymous: true });
        return;
      }

      // If auth exists, set up listener and sign in
      try {
        unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          if (currentUser) {
            setUser(currentUser);
          } else {
             // Fallback if auth state is null but auth object exists (rare)
             setUser(null); 
          }
        });

        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        // Auth failed (e.g., anonymous auth disabled) - use guest mode
        console.log("Running in guest mode (auth not configured)");
        setUser({ uid: "guest", isAnonymous: true });
      }
    };

    initAuth();
    
    return () => { 
      clearInterval(timer); 
      if (unsubscribe) unsubscribe(); 
    };
  }, []);

  // Centralized rendering logic for the active component
  const renderActiveComponent = () => {
    switch (activeSection) {
      case 'home':
        return <Home setSection={setActiveSection} />;
      case 'bio':
        return <Bio setSection={setActiveSection} />;
      case 'music':
        return <MusicPlayer />;
      case 'tour':
        return <TourHistory />;
      case 'style':
        return <StyleArchive />;
      case 'community':
        return <CommunityHub setSection={setActiveSection} />;
      case 'studio':
        return <StudioHub setSection={setActiveSection} />;
      case 'ghostwriter':
        return <Ghostwriter />;
      case 'chat':
        return <SidekickChat />;
      case 'battle':
        return <RapBattle />;
      case 'crates':
        return <CrateDigger />;
      case 'news':
        return <NewsArchive />;
      case 'ar_suite':
        return <ARSuite />;
      case 'album_art':
        return <AlbumArtGenerator user={user} onAuthRequest={() => setShowAuthModal(true)} />;
      case 'viral_video':
        return <ViralVideoAgent user={user} onAuthRequest={() => setShowAuthModal(true)} />;
      default:
        return <Home setSection={setActiveSection} />;
    }
  };


  return (
    <div className="flex flex-col h-screen w-full relative z-10">
      {/* Top navigation bar - scrollable on mobile */}
      <div className="h-auto md:h-10 bg-[#111] border-b border-[#333] flex flex-col md:flex-row items-start md:items-center justify-between px-2 md:px-4 py-2 md:py-0 select-none overflow-x-auto">
        <div className="flex items-center gap-2 md:gap-4 min-w-max w-full md:w-auto mb-2 md:mb-0">
          <div className="flex items-center gap-1 md:gap-2 text-[#00ff41] font-bold text-xs md:text-sm">
            <Cpu size={14} className="md:w-4 md:h-4" /> 
            <span className="hidden sm:inline">SYSTEM_READY</span>
          </div>
          <div className="h-4 w-[1px] bg-[#333] mx-1"></div>
          {/* Mobile: wrap navigation, Desktop: single row */}
          <nav className="flex gap-1 flex-wrap md:flex-nowrap">
            {['home', 'bio', 'music', 'tour', 'style', 'community', 'news'].map(section => (
              <button 
                key={section} 
                onClick={() => setActiveSection(section)} 
                className={`px-2 md:px-3 py-1.5 md:py-1 text-[10px] md:text-xs font-mono uppercase transition-colors whitespace-nowrap ${
                  activeSection === section ? 'bg-[#00ff41] text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                {section === 'music' ? 'Lost_Tapes' : section === 'style' ? 'Merch' : section === 'community' ? 'The_Block' : section}
              </button>
            ))}
            <div className="hidden md:block h-4 w-[1px] bg-[#333] mx-1"></div>
            <button 
              onClick={() => setActiveSection('studio')} 
              className={`px-2 md:px-3 py-1.5 md:py-1 text-[10px] md:text-xs font-mono uppercase transition-colors flex items-center gap-1 whitespace-nowrap ${
                ['studio', 'battle', 'crates', 'ghostwriter', 'ar_suite', 'album_art', 'viral_video'].includes(activeSection) ? 'bg-yellow-600 text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Grid size={10} /> STUDIO
            </button>
          </nav>
        </div>
        <div className="flex items-center gap-2 md:gap-4 text-[10px] md:text-xs font-mono">
          {/* User Auth Button */}
          {!user || user.isAnonymous ? (
            <button 
              onClick={() => setShowAuthModal(true)}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 px-2 py-1 border border-cyan-800 hover:border-cyan-500 transition-colors"
            >
              <User size={12} className="md:w-3.5 md:h-3.5"/>
              <span className="hidden sm:inline">SIGN IN</span>
            </button>
          ) : (
            <div className="relative">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 px-2 py-1 border border-cyan-800 hover:border-cyan-500 transition-colors"
              >
                <User size={12} className="md:w-3.5 md:h-3.5"/>
                <span className="hidden sm:inline truncate max-w-[100px]">{user.email || user.uid.substring(0, 8)}</span>
              </button>
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-1 bg-[#1a1a1a] border border-cyan-800 shadow-lg z-50 min-w-[150px]">
                  <button
                    onClick={async () => {
                      try {
                        await signOut(auth);
                        setUser(null);
                        setShowUserMenu(false);
                      } catch (error) {
                        console.error('Sign out failed:', error);
                      }
                    }}
                    className="w-full text-left px-4 py-2 text-xs hover:bg-cyan-900 transition-colors text-white"
                  >
                    SIGN OUT
                  </button>
                </div>
              )}
            </div>
          )}
          
          <button onClick={reboot} className="text-red-500 hover:text-red-400 flex items-center gap-1">
            <Power size={12} className="md:w-3.5 md:h-3.5"/>
          </button>
          <span className="text-[#00ff41] whitespace-nowrap">{time}</span>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)} 
          onAuth={() => console.log('User authenticated')}
        />
      )}

      {/* Main content area */}
      <div className="flex-1 relative overflow-hidden bg-black">
        <div className="absolute inset-1 md:inset-2 border border-[#333] flex flex-col bg-[#050505]">
          <div className="h-6 md:h-8 bg-[#1a1a1a] border-b border-[#333] flex items-center justify-between px-2">
            <div className="text-[10px] md:text-xs text-gray-400 font-mono flex items-center gap-2">
              <Terminal size={10} className="md:w-3 md:h-3" /> 
              <span className="truncate">C:\WHIP_MONTEZ\{activeSection.toUpperCase()}.EXE</span>
            </div>
            <div className="flex gap-2">
              <Minus size={10} className="md:w-3 md:h-3 text-gray-500"/>
              <Maximize2 size={10} className="md:w-3 md:h-3 text-gray-500"/>
              <X size={10} className="md:w-3 md:h-3 text-gray-500"/>
            </div>
          </div>
          
          <div className="flex-1 relative overflow-hidden">
            {renderActiveComponent()}
          </div>
        </div>
      </div>

      {/* Bottom marquee - smaller on mobile */}
      <div className="h-5 md:h-6 bg-[#00ff41] text-black text-[10px] md:text-xs font-mono flex items-center overflow-hidden border-t border-[#00ff41]">
         <div className="animate-marquee whitespace-nowrap uppercase font-bold">*** BREAKING: UNRELEASED TRACKS FOUND IN RED HOOK BASEMENT *** TOUR DATES LEAKED FROM 2004 *** WHIP MONTEZ SIGHTING CONFIRMED AT BODEGA *** SYSTEM RESTORATION AT 99% ***</div>
      </div>
    </div>
  );
};

export default function App() {
  const [booted, setBooted] = useState(false);

  return (
    <div className="relative w-full h-screen bg-black text-white selection:bg-[#00ff41] selection:text-black font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Anton&family=Inter:wght@400;800&family=Comic+Neue:wght@700&family=Permanent+Marker&display=swap');
        
        :root { --neon-green: #00ff41; --dark-bg: #050505; --chrome-1: #e0e0e0; --chrome-2: #8a8a8a; --chrome-3: #ffffff; }
        ::-webkit-scrollbar { width: 10px; height: 10px; }
        ::-webkit-scrollbar-track { background: #050505; border-left: 1px solid #333; }
        ::-webkit-scrollbar-thumb { background: #1a1a1a; border: 1px solid #333; border-radius: 0; }
        ::-webkit-scrollbar-thumb:hover { background: #00ff41; border: 1px solid #00ff41; box-shadow: 0 0 10px #00ff41; }
        .crt-overlay { background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06)); background-size: 100% 2px, 3px 100%; pointer-events: none; z-index: 60; }
        .scanline { width: 100%; height: 100px; z-index: 55; background: linear-gradient(0deg, rgba(0,0,0,0) 0%, rgba(0, 255, 65, 0.1) 50%, rgba(0,0,0,0) 100%); opacity: 0.1; position: absolute; bottom: 100%; animation: scanline 10s linear infinite; pointer-events: none; }
        @keyframes scanline { 0% { bottom: 100%; } 100% { bottom: -100px; } }
        .chrome-text { font-family: 'Anton', sans-serif; background: linear-gradient(to bottom, var(--chrome-3) 0%, var(--chrome-1) 50%, var(--chrome-2) 51%, var(--chrome-3) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-shadow: 0px 2px 0px rgba(0,0,0,0.5); -webkit-text-stroke: 1px rgba(255,255,255,0.4); letter-spacing: -0.02em; }
        .ken-burns-anim { animation: kenBurns 20s infinite alternate ease-in-out; }
        @keyframes kenBurns { 0% { transform: scale(1) translate(0, 0); } 100% { transform: scale(1.2) translate(-3%, -2%); } }
        .typing-cursor::after { content: '█'; animation: blink 1s infinite; }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .animate-marquee { animation: marquee 15s linear infinite; }
        .animate-spin-slow { animation: spin 3s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .glitch-text { animation: glitch 0.5s infinite; }
        @keyframes glitch { 0% { transform: translate(0) } 20% { transform: translate(-2px, 2px) } 40% { transform: translate(-2px, -2px) } 60% { transform: translate(2px, 2px) } 80% { transform: translate(2px, -2px) } 100% { transform: translate(0) } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .animate-slide-in-right { animation: slideInRight 0.3s ease-out; }
        .font-handwriting { font-family: 'Permanent Marker', cursive; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>
      <div className="absolute inset-0 z-[100] pointer-events-none overflow-hidden">
        <div className="crt-overlay absolute inset-0"></div>
        <div className="scanline"></div>
        <div className="absolute inset-0 bg-black opacity-10 pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      </div>
      {!booted ? <BootSequence onComplete={() => setBooted(true)} /> : <OSInterface reboot={() => setBooted(false)} />}
    </div>
  );
}
