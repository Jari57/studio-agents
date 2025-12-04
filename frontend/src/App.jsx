import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, Play, Pause, Rewind, ShoppingBag, Radio, ShieldAlert, Phone, Disc, Cpu, X, Maximize2, Minus, FileText, Film, Mic, MessageSquare, Sparkles, Music, Video, Share2, Heart, MessageCircle, CreditCard, Lock, Truck, CheckCircle, MapPin, Calendar, Ticket, Flame, Search, Database, Globe, Newspaper, ExternalLink, User, Hash, Grid, Headphones, Activity, Zap, Mic2, Music4, Upload, Wand2, Sliders, Briefcase, Award, BookOpen, ArrowRightLeft, LogIn, LogOut, AlertTriangle
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithPopup, 
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';

// ==========================================
// 🟢 CONFIGURATION (YOUR KEYS)
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyCbRHu9a4N_i2WEFC8nVvR9GFFAxtB4EMk",
  authDomain: "restored-os-whip-montez.firebaseapp.com",
  projectId: "restored-os-whip-montez",
  storageBucket: "restored-os-whip-montez.firebasestorage.app",
  messagingSenderId: "214496108632",
  appId: "1:214496108632:web:1f85337eea3a73a4266a2d",
  measurementId: "G-B7RW2FK096"
};

// Initialize Firebase with Error Handling
let app, auth, db, googleProvider;
let initError = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
  console.log("🟢 Firebase Initialized Successfully");
} catch (e) {
  console.error("🔴 Firebase Init Error:", e);
  initError = e.message;
}

// --- GEMINI WRAPPER (LOCAL MODE) ---
// Defaulting to local backend to avoid build target issues
const BACKEND_URL = "http://localhost:3001/api/generate"; 

const callGemini = async (prompt, systemInstruction = "") => {
  try {
    console.log("Attempting to contact backend at:", BACKEND_URL);
    const backendResponse = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, systemInstruction })
    });
    
    if (backendResponse.ok) {
        const data = await backendResponse.json();
        return data.output;
    } else {
        return "ERROR: BACKEND OFFLINE OR MISCONFIGURED. ENSURE SERVER.JS IS RUNNING.";
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "CONNECTION ERROR: BACKEND UNREACHABLE.";
  }
};

// --- COMPONENTS ---

// 0. INIT ERROR SCREEN
const InitErrorScreen = ({ error }) => (
  <div className="h-screen w-full bg-black text-red-500 font-mono flex flex-col items-center justify-center p-8 text-center">
    <ShieldAlert size={64} className="mb-6 animate-pulse" />
    <h1 className="text-2xl font-bold mb-4">SYSTEM HALTED</h1>
    <div className="max-w-lg text-sm border border-red-900 bg-red-900/10 p-6 rounded text-left">
      <code className="block bg-black p-4 border border-red-900/50 text-red-300 break-words mb-4">
        {error}
      </code>
    </div>
  </div>
);

// 1. BOOT SEQUENCE
const BootSequence = ({ onComplete }) => {
  const [lines, setLines] = useState([]);
  
  const bootSequenceData = [
    { text: "MONTEZ SYSTEMS BIOS v2.0 [NYC_CORE]", style: "text-[#00ff41]" },
    { text: "COPYRIGHT (C) 1999-2004 LIVEWIRE ENTERTAINMENT", style: "text-[#00ff41]" },
    { text: "DETECTING HARDWARE... OK", style: "text-[#00ff41]" },
    { text: "MOUNTING VOLUME: 'THE STOOP'...", style: "text-[#00ff41]" },
    { text: "CONNECTING TO SECURE DATABASE...", style: "text-[#00ff41]" },
    { text: "ESTABLISHING UPLINK TO LOCALHOST:3001...", style: "text-[#00ff41]" },
    { text: "LOADING USER INTERFACE...", style: "text-[#00ff41]" },
    { text: "SYSTEM READY.", style: "text-[#00ff41] bg-black border border-[#00ff41] inline-block px-2" }
  ];

  useEffect(() => {
    let delay = 0;
    bootSequenceData.forEach((item, index) => {
      delay += 400; // Fast boot for dev
      setTimeout(() => {
        setLines(prev => [...prev, item]);
        if (index === bootSequenceData.length - 1) {
          setTimeout(onComplete, 500);
        }
      }, delay);
    });
  }, []);

  return (
    <div className="h-screen w-full bg-black flex flex-col justify-start p-10 font-mono text-lg z-50 absolute top-0 left-0 overflow-hidden">
      <div className="overflow-y-auto h-full space-y-1">
        {lines.map((line, i) => (
          <div key={i} className={`${line.style}`}>{`> ${line.text}`}</div>
        ))}
      </div>
    </div>
  );
};

// 2. LOGIN SCREEN
const LoginScreen = ({ onLoginGuest, onLoginGoogle, error }) => {
  return (
    <div className="h-screen w-full bg-black flex flex-col items-center justify-center font-mono relative overflow-hidden z-40">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      <div className="z-10 text-center space-y-6 max-w-md w-full p-8 border border-[#333] bg-black/90 backdrop-blur-md shadow-[0_0_50px_rgba(0,255,65,0.1)]">
        <div className="flex flex-col items-center gap-4 mb-8">
           <Zap size={48} className="text-[#00ff41] animate-pulse"/>
           <div>
             <h1 className="text-4xl font-black text-white tracking-tighter chrome-text">ACCESS CONTROL</h1>
             <p className="text-gray-500 text-xs tracking-widest mt-2">RESTRICTED AREA // AUTHORIZED PERSONNEL ONLY</p>
           </div>
        </div>
        <div className="space-y-3">
          <button onClick={onLoginGoogle} className="w-full flex items-center justify-center gap-3 bg-white text-black py-3 font-bold hover:bg-gray-200 transition-colors tracking-wide text-sm group">
            <LogIn size={16}/> CONNECT WITH GOOGLE
          </button>
          <button onClick={onLoginGuest} className="w-full flex items-center justify-center gap-3 border border-[#333] text-gray-400 py-3 font-mono text-xs hover:text-[#00ff41] hover:border-[#00ff41] transition-colors group">
            CONTINUE AS GUEST
          </button>
        </div>
        {error && (
            <div className="flex gap-3 items-start text-left bg-red-900/10 border border-red-500/50 p-4 text-red-400 text-[10px] font-mono mt-4">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <div className="break-words">{error}</div>
            </div>
        )}
      </div>
    </div>
  );
};

// 3. BACKGROUND CAROUSEL
const BackgroundCarousel = () => {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <img src="https://images.unsplash.com/photo-1601933470096-0e346346c792?w=1600&h=900&fit=crop&q=80" className="absolute inset-0 w-full h-full object-cover opacity-30 filter grayscale contrast-125" />
      <div className="absolute inset-0 bg-black/70 z-20"></div>
    </div>
  );
};

// 4. HOME (LAUNCHPAD)
const Home = ({ setSection }) => (
  <div className="relative h-full w-full overflow-hidden flex flex-col items-center justify-center p-4">
     <BackgroundCarousel />
     <div className="relative z-30 text-center">
        <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter chrome-text mb-8">WHIP<br/>MONTEZ</h1>
        <div className="grid grid-cols-4 gap-4 w-full max-w-5xl">
            {/* Apps */}
            <button onClick={() => setSection('ghostwriter')} className="h-24 border border-[#333] hover:border-[#00ff41] bg-black/80 backdrop-blur flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-white transition-all group">
               <FileText size={20} className="group-hover:text-[#00ff41]"/> <span className="font-mono text-[10px] font-bold">GHOSTWRITER</span>
            </button>
            <button onClick={() => setSection('pressing_plant')} className="h-24 border border-[#333] hover:border-indigo-500 bg-black/80 backdrop-blur flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-white transition-all group">
               <Hexagon size={20} className="group-hover:text-indigo-500"/> <span className="font-mono text-[10px] font-bold">PRESSING PLANT</span>
            </button>
            <button onClick={() => setSection('ar_office')} className="h-24 border border-[#333] hover:border-yellow-500 bg-black/80 backdrop-blur flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-white transition-all group">
               <Briefcase size={20} className="group-hover:text-yellow-500"/> <span className="font-mono text-[10px] font-bold">A&R OFFICE</span>
            </button>
            <button onClick={() => setSection('studio')} className="h-24 border border-[#333] hover:border-red-500 bg-black/80 backdrop-blur flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-white transition-all group">
               <Grid size={20} className="group-hover:text-red-500"/> <span className="font-mono text-[10px] font-bold">STUDIO HUB</span>
            </button>
            
            {/* Pages */}
            <button onClick={() => setSection('bio')} className="h-16 border border-[#333] hover:border-white bg-black/80 text-gray-500 hover:text-white text-xs font-bold tracking-widest">BIO</button>
            <button onClick={() => setSection('tour')} className="h-16 border border-[#333] hover:border-white bg-black/80 text-gray-500 hover:text-white text-xs font-bold tracking-widest">TOUR</button>
            <button onClick={() => setSection('news')} className="h-16 border border-[#333] hover:border-white bg-black/80 text-gray-500 hover:text-white text-xs font-bold tracking-widest">NEWS</button>
            <button onClick={() => setSection('shop')} className="h-16 border border-[#333] hover:border-white bg-black/80 text-gray-500 hover:text-white text-xs font-bold tracking-widest">SHOP</button>
        </div>
     </div>
  </div>
);

// 5. GHOSTWRITER
const Ghostwriter = () => {
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if(!prompt) return;
    setIsGenerating(true);
    const result = await callGemini(prompt, "You are a legendary hip-hop ghostwriter. Provide raw, lyrical, and complex bars.");
    setOutput(result);
    setIsGenerating(false);
  }

  return (
    <div className="h-full w-full bg-[#050505] flex flex-col p-6 font-mono text-green-500">
      <div className="flex items-center justify-between mb-6 border-b border-green-900 pb-2">
        <h2 className="text-2xl font-bold flex items-center gap-2"><FileText /> GHOSTWRITER_V2</h2>
      </div>
      <div className="flex gap-4 h-full">
        <div className="w-1/3 flex flex-col gap-4">
          <textarea className="w-full h-full bg-[#111] border border-green-900 p-4 text-white focus:outline-none text-xs" placeholder="ENTER CONCEPTS..." value={prompt} onChange={(e) => setPrompt(e.target.value)}/>
          <button onClick={handleGenerate} disabled={isGenerating} className="bg-green-900 hover:bg-green-700 text-white p-4 font-bold tracking-widest flex items-center justify-center gap-2">{isGenerating ? "GENERATING..." : "GENERATE BARS"}</button>
        </div>
        <div className="w-2/3 bg-black border border-green-900 p-6 overflow-y-auto">
          {output ? <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-gray-300">{output}</pre> : <div className="h-full flex items-center justify-center text-green-900 italic">WAITING FOR INPUT...</div>}
        </div>
      </div>
    </div>
  );
};

// 6. PRESSING PLANT
const PressingPlant = ({ user }) => {
  const [wallet, setWallet] = useState(null);
  const [step, setStep] = useState('connect');
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [status, setStatus] = useState("");

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWallet(accounts[0]);
        setStep('select');
      } catch (error) { setStatus("CONNECTION REJECTED"); }
    } else { setStatus("METAMASK NOT DETECTED"); }
  };

  const handleMint = async () => {
    setStep('minting');
    setStatus("UPLOADING TO IPFS...");
    setTimeout(() => { setStatus("TRANSACTION CONFIRMED"); setStep('success'); }, 2000);
  };

  return (
    <div className="h-full w-full bg-[#0d0d0d] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full border border-indigo-500/30 bg-[#111] p-8 text-center">
        <div className="mb-8 flex justify-center"><Hexagon size={48} className="text-indigo-500"/></div>
        {step === 'connect' && (
            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white">PRESSING PLANT</h2>
                <p className="text-gray-400 text-sm">Tokenize your masters.</p>
                <button onClick={connectWallet} className="bg-indigo-600 px-6 py-2 text-white font-bold">CONNECT WALLET</button>
                <p className="text-red-500 text-xs">{status}</p>
            </div>
        )}
        {step === 'select' && (
            <div className="space-y-4">
                <h2 className="text-xl text-white">SELECT ARTIFACT</h2>
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setSelectedArtifact('audio')} className="p-4 border border-[#333] text-white hover:border-indigo-500">AUDIO MASTER</button>
                    <button onClick={() => setSelectedArtifact('lyric')} className="p-4 border border-[#333] text-white hover:border-indigo-500">LYRIC SHEET</button>
                </div>
                {selectedArtifact && <button onClick={handleMint} className="w-full bg-indigo-600 py-2 text-white font-bold">MINT NOW</button>}
            </div>
        )}
        {step === 'minting' && (
            <div className="space-y-4">
                <h2 className="text-xl text-white animate-pulse">MINTING...</h2>
                <p className="text-indigo-400 text-xs">{status}</p>
            </div>
        )}
        {step === 'success' && (
            <div className="space-y-4">
                <CheckCircle size={48} className="text-green-500 mx-auto"/>
                <h2 className="text-xl text-white">SUCCESS</h2>
                <button onClick={() => setStep('select')} className="text-indigo-400 underline">Mint Another</button>
            </div>
        )}
      </div>
    </div>
  );
};

// 7. STUDIO HUB
const StudioHub = ({ setSection }) => (
  <div className="h-full w-full bg-[#1a0505] flex items-center justify-center relative overflow-hidden">
    <div className="text-center space-y-4 z-10">
      <Music size={64} className="mx-auto text-red-500 animate-pulse"/>
      <h2 className="text-2xl font-bold text-white">STUDIO HUB ACTIVE</h2>
      <p className="text-red-400 font-mono">TRACKING: MASTER_TAPE_04.wav</p>
      
      {/* Navigation to sub-tools */}
      <div className="flex gap-4 justify-center mt-8">
         <button onClick={() => setSection('battle')} className="border border-red-500 text-red-500 px-4 py-2 hover:bg-red-500 hover:text-black">CIPHER</button>
         <button onClick={() => setSection('crates')} className="border border-yellow-500 text-yellow-500 px-4 py-2 hover:bg-yellow-500 hover:text-black">CRATES</button>
         <button onClick={() => setSection('mix_master')} className="border border-[#00ff41] text-[#00ff41] px-4 py-2 hover:bg-[#00ff41] hover:text-black">MIX MASTER</button>
      </div>

      <div className="flex gap-1 justify-center h-16 items-end mt-8">
         {[...Array(10)].map((_,i) => <div key={i} className="w-2 bg-red-600 animate-bounce" style={{height: `${Math.random()*100}%`, animationDelay: `${i*0.1}s`}}></div>)}
      </div>
    </div>
  </div>
);

// 8. AR OFFICE
const AROffice = () => (
  <div className="h-full w-full bg-[#0a0a00] p-8 font-mono text-yellow-500">
     <h2 className="text-2xl font-bold mb-6 border-b border-yellow-900 pb-2">A&R DASHBOARD</h2>
     <div className="grid grid-cols-2 gap-6">
        <div className="border border-yellow-900/50 bg-black p-6">
           <h3 className="text-xs text-gray-500 mb-2">ROYALTY BALANCE</h3>
           <div className="text-4xl font-bold text-white">$14,203.42</div>
        </div>
        <div className="border border-yellow-900/50 bg-black p-6">
           <h3 className="text-xs text-gray-500 mb-2">STREAMS (MTD)</h3>
           <div className="text-4xl font-bold text-white">1.2M</div>
        </div>
     </div>
  </div>
);

// 9. CONTENT PAGES (Bio, Tour, News, Shop)
const Bio = () => (
  <div className="h-full bg-[#0a0a0a] p-8 font-mono text-gray-300 overflow-y-auto">
    <h1 className="text-4xl font-black text-white mb-4">THE ORIGIN</h1>
    <p className="max-w-2xl leading-relaxed">Born from the static of the underground and raised on the algorithms of the future, Whip Montez represents the collision of analog soul and digital precision.</p>
  </div>
);

const Tour = () => (
  <div className="h-full bg-[#050505] p-8 font-mono overflow-y-auto">
    <h2 className="text-3xl font-black text-white mb-8">TOUR DATES</h2>
    <div className="space-y-4 max-w-2xl">
      {[{d:"DEC 12",c:"NYC"},{d:"DEC 15",c:"LDN"},{d:"DEC 18",c:"BER"}].map((t,i) => (
        <div key={i} className="flex justify-between border-b border-[#333] pb-2 text-gray-400">
            <span><span className="text-[#00ff41]">{t.d}</span> - {t.c}</span>
            <button className="text-white hover:text-[#00ff41]">TICKETS</button>
        </div>
      ))}
    </div>
  </div>
);

const News = () => (
  <div className="h-full bg-[#0a0a0a] p-8 font-mono overflow-y-auto">
    <h2 className="text-3xl font-black text-white mb-8">TRANSMISSIONS</h2>
    <div className="space-y-6 max-w-2xl">
        <div className="border-l-2 border-[#00ff41] pl-4">
            <h3 className="text-xl text-white font-bold">NEW DROP INCOMING</h3>
            <p className="text-gray-500 text-sm">Masters sent to Pressing Plant.</p>
        </div>
    </div>
  </div>
);

// 10. SHOP (MERCH) - FIXED & COMPLETED
const Shop = () => {
  const [cart, setCart] = useState([]);
  
  const merchItems = [
    { id: 1, name: "LIVEWIRE FITTED", price: 45, image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500&q=80' },
    { id: 2, name: "VELOUR TRACK JKT", price: 120, image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&q=80' },
    { id: 3, name: "WHIP JERSEY 04", price: 85, image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500&q=80' },
    { id: 4, name: "TOUR BANDANA", price: 20, image: 'https://images.unsplash.com/photo-1629316075677-72782e379a41?w=500&q=80' }
  ];

  return (
    <div className="h-full flex flex-col bg-[#111] text-[#ccc] relative">
      <div className="min-h-[80px] border-b border-[#333] flex flex-col md:flex-row md:items-center justify-between px-6 py-4 bg-[#0a0a0a]">
        <h2 className="text-4xl font-black uppercase tracking-tighter text-white leading-none mb-4 md:mb-0">Y2K<br/>SEASON</h2>
        <div className="flex items-center gap-2 font-bold text-xs border border-[#333] px-4 py-2 hover:bg-[#00ff41] hover:text-black hover:border-[#00ff41] transition-all cursor-pointer uppercase tracking-widest">
          <ShoppingBag size={14}/> <span>CART ({cart.length})</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[1px] bg-[#333]">
          {merchItems.map(item => (
            <div key={item.id} className="group relative bg-[#0a0a0a] aspect-[3/4] flex flex-col cursor-pointer overflow-hidden">
              <div className="absolute inset-0">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover filter grayscale contrast-125 brightness-75 group-hover:scale-105 group-hover:brightness-100 transition-all duration-700" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none mix-blend-overlay opacity-80">
                  <div className="transform -rotate-6">
                    <h1 className="font-black text-4xl text-white tracking-tighter opacity-90 leading-none">WHIP<br/>MNTZ</h1>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 w-full p-6 z-10 bg-gradient-to-t from-black via-black/80 to-transparent pt-12">
                <div className="flex justify-between items-end border-b border-white/20 pb-2 mb-2">
                  <div>
                    <h3 className="font-bold text-white text-lg uppercase leading-none tracking-tight">{item.name}</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-mono font-bold text-xl">${item.price}</div>
                  </div>
                </div>
                
                <button 
                  onClick={() => setCart([...cart, item])}
                  className="w-full text-xs font-bold uppercase tracking-[0.2em] py-3 hover:bg-[#00ff41] hover:text-black transition-colors text-gray-400 border border-transparent hover:border-[#00ff41] flex justify-between px-2 items-center"
                >
                  <span>ADD TO CART</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 11. EXTRA TOOLS (Stubbed for stability)
const SidekickChat = () => <div className="h-full bg-black flex items-center justify-center text-[#00ff41]">SIDEKICK_CHAT.EXE LOADING...</div>;
const RapBattle = () => <div className="h-full bg-black flex items-center justify-center text-red-500">CIPHER_DOJO.EXE LOADING...</div>;
const CrateDigger = () => <div className="h-full bg-black flex items-center justify-center text-yellow-500">CRATE_DIGGER.EXE LOADING...</div>;
const MixMaster = () => <div className="h-full bg-black flex items-center justify-center text-purple-500">MIX_MASTER_SUITE.EXE LOADING...</div>;

// 12. OS INTERFACE
const OSInterface = ({ user, logout }) => {
  const [activeSection, setActiveSection] = useState('home');
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col h-screen w-full relative z-10 bg-[#050505] text-white">
      <div className="h-10 bg-[#111] border-b border-[#333] flex items-center justify-between px-4 select-none">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[#00ff41] font-bold">
            <Cpu size={16} /> <span className="hidden md:inline">SYSTEM_READY</span>
          </div>
          <button onClick={() => setActiveSection('home')} className="hover:text-[#00ff41] text-xs font-mono">HOME</button>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
           <span className="text-gray-500 hidden md:inline">USER: {user?.isAnonymous ? "GUEST" : user?.email || user?.uid.slice(0,6)}</span>
           <button onClick={logout} className="flex items-center gap-1 hover:text-red-500 transition-colors"><LogOut size={12}/> LOGOUT</button>
           <span className="text-[#00ff41]">{time}</span>
        </div>
      </div>
      <div className="flex-1 relative overflow-hidden bg-black p-2">
        <div className="w-full h-full border border-[#333] bg-[#0a0a0a] relative overflow-hidden">
           {activeSection === 'home' && <Home setSection={setActiveSection} />}
           {activeSection === 'ghostwriter' && <Ghostwriter />}
           {activeSection === 'pressing_plant' && <PressingPlant user={user} />}
           {activeSection === 'ar_office' && <AROffice />}
           {activeSection === 'studio' && <StudioHub setSection={setActiveSection} />}
           {activeSection === 'bio' && <Bio />}
           {activeSection === 'tour' && <Tour />}
           {activeSection === 'news' && <News />}
           {activeSection === 'shop' && <Shop />}
           
           {/* Sub-Apps */}
           {activeSection === 'chat' && <SidekickChat />}
           {activeSection === 'battle' && <RapBattle />}
           {activeSection === 'crates' && <CrateDigger />}
           {activeSection === 'mix_master' && <MixMaster />}
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---
export default function App() {
  const [bootComplete, setBootComplete] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (!auth) { setLoading(false); return; }
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loginGuest = async () => {
    setAuthError(null);
    if (!auth) return;
    try { 
      await signInAnonymously(auth); 
    } catch (e) {
      if (e.code === 'auth/admin-restricted-operation') {
        setAuthError("GUEST LOGIN DISABLED: Enable 'Anonymous' in Firebase Console.");
      } else if (e.code === 'auth/unauthorized-domain') {
        setAuthError("DOMAIN UNAUTHORIZED: Add 'localhost' to Firebase Authorized Domains.");
      } else {
        setAuthError(e.message);
      }
    }
  };

  const loginGoogle = async () => {
    setAuthError(null);
    if (!auth) return;
    try { 
        await signInWithPopup(auth, googleProvider); 
    } catch (e) { 
        console.error(e); // Keep logging for debugging
        if (e.code === 'auth/unauthorized-domain') {
            setAuthError("DOMAIN NOT AUTHORIZED: Go to Firebase Console -> Authentication -> Settings -> Authorized Domains and add the current domain.");
        } else if (e.code === 'auth/admin-restricted-operation') {
             setAuthError("GOOGLE LOGIN DISABLED: Go to Firebase Console -> Authentication -> Sign-in method -> Enable 'Google'.");
        } else {
            setAuthError(e.message);
        }
    }
  };

  const logout = async () => {
    try { if(auth) await signOut(auth); } catch (e) { console.error(e); }
  };

  if (initError) return <InitErrorScreen error={initError} />;
  if (!bootComplete) return <BootSequence onComplete={() => setBootComplete(true)} />;
  if (loading) return <div className="h-screen bg-black text-[#00ff41] flex items-center justify-center">LOADING...</div>;
  if (!user) return <LoginScreen onLoginGuest={loginGuest} onLoginGoogle={loginGoogle} error={authError} />;

  return <OSInterface user={user} logout={logout} />;
}