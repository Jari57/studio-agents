import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  Play, 
  Pause, 
  Rewind, 
  ShoppingBag, 
  Radio, 
  ShieldAlert, 
  Phone, 
  Disc, 
  Cpu, 
  X, 
  Maximize2, 
  Minus, 
  FileText, 
  Film, 
  Mic, 
  MessageSquare, 
  Sparkles, 
  Music, 
  Video, 
  Share2, 
  Heart, 
  MessageCircle, 
  CreditCard, 
  Lock, 
  Truck, 
  CheckCircle, 
  MapPin, 
  Calendar, 
  Ticket, 
  Flame, 
  Search, 
  Database, 
  Globe, 
  Newspaper, 
  ExternalLink, 
  User, 
  Hash, 
  Grid, 
  Headphones, 
  Activity, 
  Zap, 
  Mic2, 
  Music4, 
  Upload, 
  Wand2, 
  Sliders, 
  Briefcase, 
  Award, 
  BookOpen, 
  ArrowRightLeft
} from 'lucide-react';

// --- GEMINI API HELPERS ---
const apiKey = ""; // Injected at runtime

const callGemini = async (prompt, systemInstruction = "") => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "DATA CORRUPTION ERROR. TRY AGAIN.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "CONNECTION LOST. SIGNAL WEAK.";
  }
};

// --- COMPONENTS ---

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
    bootSequenceData.forEach((item, index) => {
      const isError = item.text.includes("ERROR");
      const isRecovery = item.text.includes("RECOVERY");
      
      const stepDelay = isError ? 1500 : isRecovery ? 2000 : Math.random() * 300 + 100;
      delay += stepDelay;

      setTimeout(() => {
        setLines(prev => [...prev, item]);
        const el = document.getElementById('boot-log');
        if(el) el.scrollTop = el.scrollHeight;
        
        if (index === bootSequenceData.length - 1) {
          setTimeout(onComplete, 1200);
        }
      }, delay);
    });
  }, []);

  return (
    <div className="h-screen w-full bg-black flex flex-col justify-start p-10 font-mono text-xl z-50 absolute top-0 left-0 overflow-hidden">
      <div id="boot-log" className="overflow-y-auto h-full space-y-1">
        {lines.map((line, i) => (
          <div key={i} className={`typing-effect ${line.style}`}>
            {`> ${line.text}`}
          </div>
        ))}
        <div className="w-3 h-5 bg-[#00ff41] animate-pulse inline-block ml-2"></div>
      </div>
    </div>
  );
};

// Background Carousel
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

// 2. HOME (Interactive Home)
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
      id: 'battle',
      title: 'THE DOJO',
      subtitle: 'CIPHER_CHALLENGE',
      icon: Flame,
      color: 'text-red-500',
      borderColor: 'border-red-500',
      hoverBg: 'hover:bg-red-500/10',
      shadow: 'group-hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]',
      content: 'VS AI OPPONENT',
      action: () => setSection('battle')
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
    <div className="relative h-full w-full overflow-hidden flex flex-col font-sans">
      <BackgroundCarousel images={homeCarouselImages} />
      
      <div className="relative z-30 flex-1 flex flex-col justify-between p-6 md:p-12 bg-gradient-to-t from-black via-transparent to-black/40">
        
        <div className="flex justify-between items-start w-full">
          <div className="animate-slide-in-left">
            <h1 className="chrome-text text-7xl md:text-9xl font-black uppercase tracking-tighter leading-none opacity-90 drop-shadow-2xl">
              Whip<br/>Montez
            </h1>
            <div className="flex items-center gap-2 mt-4">
              <div className="h-[2px] w-12 bg-[#00ff41]"></div>
              <p className="text-[#00ff41] text-xs tracking-[0.3em] font-mono bg-black/50 px-2">RESTORED_SESSION_2004</p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-4">
            <div className="border-2 border-white bg-black/80 px-4 py-2 flex items-center gap-3 shadow-[0_0_15px_rgba(255,255,255,0.5)] backdrop-blur-sm transform hover:scale-105 transition-transform cursor-default select-none group">
               <div className="relative w-8 h-8 flex items-center justify-center">
                  <div className="absolute w-full h-[2px] bg-white group-hover:bg-[#00ff41] transition-colors"></div>
                  <div className="absolute h-full w-[2px] bg-white group-hover:bg-[#00ff41] transition-colors"></div>
                  <div className="w-6 h-6 border border-white rounded-full animate-spin-slow group-hover:border-[#00ff41]"></div>
                  <Zap size={16} className="text-yellow-400 relative z-10 fill-current"/>
               </div>
               <div className="text-right">
                  <h2 className="text-white font-black italic tracking-tighter text-xl leading-none group-hover:text-shadow-glow transition-all">LIVEWIRE</h2>
                  <p className="text-gray-400 text-[8px] tracking-[0.2em] font-bold uppercase group-hover:text-[#00ff41] transition-colors">Entertainment LLC</p>
               </div>
            </div>

            <div className="hidden md:block text-right">
               <div className="text-white font-mono text-xs opacity-50">SYSTEM_STATUS</div>
               <div className="text-[#00ff41] font-mono text-sm animate-pulse">ONLINE</div>
            </div>
          </div>
        </div>

        <div className="flex-1"></div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 w-full">
          {widgets.map((widget, i) => (
            <div 
              key={widget.id}
              onClick={widget.action}
              onMouseEnter={() => setHoveredItem(widget.title)}
              onMouseLeave={() => setHoveredItem(null)}
              className={`
                group relative h-32 border-t-2 bg-black/80 backdrop-blur-md p-4 cursor-pointer transition-all duration-300
                flex flex-col justify-between overflow-hidden
                ${widget.borderColor} ${widget.hoverBg} ${widget.shadow} hover:-translate-y-2
              `}
            >
              <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.2)_50%)] bg-[length:100%_4px] pointer-events-none opacity-50"></div>
              
              <div className="flex justify-between items-start relative z-10">
                 <widget.icon size={24} className={`${widget.color} transition-transform group-hover:scale-110 duration-300`} />
                 <span className="text-[10px] font-mono text-gray-500 group-hover:text-white transition-colors">{String(i + 1).padStart(2, '0')}</span>
              </div>

              <div className="relative z-10">
                 <h3 className={`text-xl font-black uppercase tracking-tight text-white leading-none mb-1 group-hover:tracking-widest transition-all duration-300`}>
                   {widget.title}
                 </h3>
                 <div className={`text-[9px] font-mono uppercase tracking-wider ${widget.color} truncate`}>
                   {widget.id === 'news' ? (
                     <span className="animate-pulse">{'>'} {widget.content}</span>
                   ) : (
                     <>{'>'} {widget.subtitle}</>
                   )}
                 </div>
              </div>

              <div className={`absolute -bottom-10 -right-10 w-24 h-24 ${widget.color.replace('text-', 'bg-')}/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

// 3. MUSIC PLAYER
const MusicPlayer = () => {
  const [selectedAlbumId, setSelectedAlbumId] = useState('tape1');
  const [currentTrack, setCurrentTrack] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const albums = [
    {
      id: 'tape1',
      title: "LIVEWIRE SESSIONS",
      date: "FEB 14 2004",
      description: "The unreleased debut. Raw, boom-bap, recorded in Erick's basement.",
      color: "text-[#00ff41]", 
      tapeColor: "border-[#00ff41]",
      tracks: [
        { id: 101, title: "Freestyle (Kanye Beat)", duration: "2:15", date: "2004-02-14", video: true },
        { id: 102, title: "Feat. Ali Vegas (50 Cent Beat)", duration: "3:42", date: "2004-03-01", video: false },
        { id: 103, title: "Sprung (Remix)", duration: "3:30", date: "2004-04-20", video: true },
        { id: 104, title: "Push It (Remix)", duration: "3:15", date: "2004-05-10", video: false },
        { id: 105, title: "Freestyle (Jim Jones Beat)", duration: "2:50", date: "2004-06-05", video: true }
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
        { id: 201, title: "Projects Window", duration: "2:50", date: "2002-09-11", video: true },
        { id: 202, title: "Subway Surfing", duration: "3:15", date: "2002-12-01", video: false },
        { id: 203, title: "Loose Cigarettes", duration: "2:10", date: "2003-02-14", video: false },
        { id: 204, title: "Summer Heat (Interlude)", duration: "1:20", date: "2003-07-04", video: false },
        { id: 205, title: "Lights Out", duration: "4:00", date: "2003-08-14", video: true }
      ]
    }
  ];

  const activeAlbum = albums.find(a => a.id === selectedAlbumId) || albums[0];

  const getLyricsForAlbum = (id) => {
    switch(id) {
      case 'tape1': return [
        { es: "Flow so cold it burns", en: "Reference to the Kanye beat intro", note: "Opening bars." },
        { es: "Ali Vegas on the track", en: "Queens meets Brooklyn", note: "The collaboration." }
      ];
      default: return [
        { es: "Buscando mi dinero", en: "Looking for my money", note: "Hustle culture." },
        { es: "Siempre leal", en: "Always loyal", note: "Livewire code." }
      ];
    }
  };

  const currentLyrics = getLyricsForAlbum(selectedAlbumId);

  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-[#0a0a0a]">
      <div className="h-12 border-b border-[#333] bg-[#111] flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Disc size={18} className="text-[#00ff41]" />
          <span className="font-bold tracking-widest text-sm text-white">EVIDENCE_LOCKER // AUDIO_ARCHIVE</span>
        </div>
        <div className="text-[10px] font-mono text-gray-500">TOTAL_SIZE: 4.2GB</div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {showVideoModal && (
          <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center p-8 backdrop-blur-sm">
            <div className="w-full max-w-3xl border-2 border-[#00ff41] bg-black shadow-[0_0_50px_rgba(0,255,65,0.2)] flex flex-col">
              <div className="h-8 bg-[#00ff41] flex items-center justify-between px-2">
                <span className="text-black font-bold text-xs font-mono">MEDIA_PLAYER_V1.EXE</span>
                <X size={16} className="text-black cursor-pointer hover:bg-white/20" onClick={() => setShowVideoModal(false)} />
              </div>
              <div className="aspect-video bg-[#111] relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                <div className="text-center">
                  <div className="text-[#00ff41] text-4xl mb-4 animate-pulse"><Play size={64}/></div>
                  <p className="text-gray-500 font-mono text-sm">BUFFERING VIDEO FEED...</p>
                  <p className="text-gray-700 text-xs mt-2">SOURCE: {currentTrack?.title}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="w-1/4 min-w-[200px] border-r border-[#333] bg-[#050505] flex flex-col">
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

        <div className="flex-1 flex flex-col bg-black/80">
          <div className="p-4 border-b border-[#333] bg-[#0a0a0a]">
            <h2 className={`text-2xl md:text-4xl font-black chrome-text mb-2`}>{activeAlbum.title}</h2>
            <p className="text-gray-400 font-mono text-xs">{activeAlbum.description}</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-0">
            <table className="w-full text-left border-collapse">
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
                    <td className="p-3 border-b border-[#333]/50 text-gray-600 group-hover:text-white" onClick={() => { setCurrentTrack(track); setIsPlaying(true); }}>
                      {currentTrack?.id === track.id && isPlaying ? <div className="animate-pulse text-[#00ff41]">▶</div> : (i + 1).toString().padStart(2, '0')}
                    </td>
                    <td className="p-3 border-b border-[#333]/50 font-bold" onClick={() => { setCurrentTrack(track); setIsPlaying(true); }}>{track.title}</td>
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
          </div>
        </div>

        <div className="w-1/3 min-w-[300px] border-l border-[#333] bg-[#080808] flex flex-col hidden md:flex">
          <div className="p-6 bg-[#111] border-b border-[#333]">
             <div className="bg-[#0f281f] border-2 border-[#333] rounded-sm p-4 shadow-inner relative overflow-hidden h-32 flex flex-col justify-between mb-4">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.1)_50%,rgba(0,0,0,0)_50%)] bg-[length:100%_4px] pointer-events-none"></div>
                <div className="flex justify-between text-[10px] text-emerald-600/60 font-mono">
                    <span>SRC: TAPE</span>
                    <span>VOL: 24</span>
                </div>
                <div className="font-mono text-emerald-400 text-lg whitespace-nowrap overflow-hidden">
                    <span className="animate-marquee block">{currentTrack ? `${currentTrack.title} - WHIP MONTEZ` : "INSERT CASSETTE..."}</span>
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
                <button className="bg-[#222] h-10 rounded border-b-2 border-black active:border-b-0 active:translate-y-[2px] flex items-center justify-center text-[#666] hover:text-[#00ff41] transition-colors"><Rewind size={16}/></button>
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="bg-[#222] h-10 rounded border-b-2 border-black active:border-b-0 active:translate-y-[2px] flex items-center justify-center text-[#666] hover:text-[#00ff41] transition-colors"
                >
                  {isPlaying ? <Pause size={16}/> : <Play size={16}/>}
                </button>
                <button className="bg-[#222] h-10 rounded border-b-2 border-black active:border-b-0 active:translate-y-[2px] flex items-center justify-center text-[#666] hover:text-[#00ff41] transition-colors"><div className="w-3 h-3 bg-current rounded-sm"></div></button>
                <button className="bg-[#222] h-10 rounded border-b-2 border-black active:border-b-0 active:translate-y-[2px] flex items-center justify-center text-[#666] hover:text-[#00ff41] transition-colors"><div className="flex"><Play size={10}/><Play size={10}/></div></button>
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
    </div>
  );
};

// 4. BIO SECTION
const Bio = ({ setSection }) => {
  return (
    <div className="h-full w-full relative overflow-hidden flex items-center justify-center p-4">
      <BackgroundCarousel images={[]} />
      <div className="absolute inset-0 bg-black/60 z-10"></div>
      
      <div className="relative z-30 w-full max-w-5xl h-[85vh] bg-[#0f0f0f] border-2 border-[#333] flex flex-col md:flex-row shadow-2xl">
        
        <div className="w-full md:w-80 bg-[#111] border-r border-[#333] p-6 flex flex-col gap-6">
           <div className="aspect-square w-full bg-[#222] border-4 border-[#333] relative overflow-hidden group">
              <img 
                src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=800&q=80" 
                className="w-full h-full object-cover grayscale contrast-125 group-hover:scale-110 transition-transform duration-500" 
                alt="Whip Montez"
              />
              <div className="absolute bottom-2 right-2 bg-[#00ff41] text-black text-xs font-bold px-2 py-0.5 animate-pulse">
                 ONLINE
              </div>
           </div>

           <div className="space-y-1">
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Whip Montez</h2>
              <p className="text-[#00ff41] font-mono text-xs">RED HOOK, BROOKLYN</p>
              <p className="text-gray-500 font-mono text-xs">LIVEWIRE RECORDS</p>
           </div>

           <div className="flex-1 space-y-2">
              <button onClick={() => setSection('music')} className="w-full bg-[#1a1a1a] border border-[#333] text-gray-300 py-3 text-xs font-bold tracking-widest hover:bg-[#00ff41] hover:text-black hover:border-[#00ff41] transition-all flex items-center justify-center gap-2">
                 <Disc size={14}/> DISCOGRAPHY
              </button>
              <button onClick={() => setSection('tour')} className="w-full bg-[#1a1a1a] border border-[#333] text-gray-300 py-3 text-xs font-bold tracking-widest hover:bg-[#00ff41] hover:text-black hover:border-[#00ff41] transition-all flex items-center justify-center gap-2">
                 <Calendar size={14}/> TOUR DATES
              </button>
              <button onClick={() => setSection('news')} className="w-full bg-[#1a1a1a] border border-[#333] text-gray-300 py-3 text-xs font-bold tracking-widest hover:bg-[#00ff41] hover:text-black hover:border-[#00ff41] transition-all flex items-center justify-center gap-2">
                 <Newspaper size={14}/> PRESS / NEWS
              </button>
              <button onClick={() => window.open('https://www.youtube.com/results?search_query=90s+hip+hop', '_blank')} className="w-full bg-[#1a1a1a] border border-[#333] text-gray-300 py-3 text-xs font-bold tracking-widest hover:bg-[#00ff41] hover:text-black hover:border-[#00ff41] transition-all flex items-center justify-center gap-2">
                 <Video size={14}/> VIDEOS
              </button>
           </div>

           <div className="border-t border-[#333] pt-4">
              <p className="text-[10px] text-gray-500 font-mono mb-2">MANAGEMENT:</p>
              <div className="text-xs text-white font-bold">JARI MONTEZ</div>
              <div className="text-xs text-gray-400">jari@livewire-ent.com</div>
           </div>
        </div>

        <div className="flex-1 bg-[#0a0a0a] flex flex-col relative overflow-hidden">
           <div className="h-16 bg-[#00ff41] text-black p-4 flex justify-between items-center">
              <h1 className="text-4xl font-black tracking-tighter">OFFICIAL PROFILE</h1>
              <div className="flex gap-2">
                 <div className="w-3 h-3 bg-black"></div>
                 <div className="w-3 h-3 bg-black"></div>
                 <div className="w-3 h-3 bg-black"></div>
              </div>
           </div>

           <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="max-w-2xl mx-auto space-y-8">
                 <blockquote className="border-l-4 border-[#00ff41] pl-6 py-2">
                    <p className="text-xl md:text-2xl font-bold text-white italic leading-relaxed">
                       "They said Red Hook was underwater before the hurricane ever hit. In '04, I wasn't just a rapper; I was the life raft."
                    </p>
                 </blockquote>

                 <div className="grid grid-cols-2 gap-4 border-y border-[#333] py-6 my-6">
                    <div>
                       <div className="text-[10px] text-gray-500 font-mono uppercase">Style</div>
                       <div className="text-[#00ff41] font-bold">Boom Bap / Noir / Lyrical</div>
                    </div>
                    <div>
                       <div className="text-[10px] text-gray-500 font-mono uppercase">Debut</div>
                       <div className="text-[#00ff41] font-bold">Livewire Sessions (2004)</div>
                    </div>
                    <div>
                       <div className="text-[10px] text-gray-500 font-mono uppercase">Influence</div>
                       <div className="text-[#00ff41] font-bold">Nas, Lauryn Hill, Big L</div>
                    </div>
                    <div>
                       <div className="text-[10px] text-gray-500 font-mono uppercase">Status</div>
                       <div className="text-[#00ff41] font-bold animate-pulse">ARCHIVE RECOVERY...</div>
                    </div>
                 </div>

                 <div className="prose prose-invert prose-sm font-mono text-gray-300 leading-relaxed">
                    <p className="first-letter:text-4xl first-letter:text-[#00ff41] first-letter:font-black first-letter:float-left first-letter:mr-2">
                       While the rest of the city was chasing the "bling era"—popping bottles in midtown and wearing oversized button-downs—Whip was sitting on the stoop of 485 Columbia Street, dissecting the geometry of a corner store hustle.
                    </p>
                    <p className="mt-4">
                       The turning point came when <strong className="text-white">Erick Sermon</strong> found her tape. A mixtape passed from a cousin to a barber to a Livewire intern. He signed her the next day. The deal was supposed to change everything. It was validation for the block.
                    </p>
                    <p className="mt-4">
                       But Whip didn't move alone. Her brother <strong className="text-white">Jari</strong> stepped up as manager, the only one she trusted to watch her back in a room full of sharks. Together, we navigated the madness of the mid-2000s music industry. Jari held the line against out-of-touch executives trying to water down her sound for radio play. We spent endless nights in the studio, battling over marketing budgets, planning showcase runs, and fighting to keep the vision pure amidst the chaos of major label politics.
                    </p>
                    <p className="mt-4">
                       But then the hard drive crashed. Or maybe the budget dried up. Or maybe Whip just saw the industry for the plastic machine it was and walked back across the highway into the shadows. She vanished.
                    </p>
                    <p className="mt-4 text-[#00ff41] font-bold border-t border-[#333] pt-4">
                       {'>'} SYSTEM NOTE: This OS is all that's left. A digital ghost of the girl who almost took the crown.
                    </p>
                 </div>

              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

// 5. TOUR ARCHIVE
const TourHistory = () => {
  const dates = [
    { city: "RED HOOK, NY", venue: "THE REC CENTER", date: "AUG 14 2004", status: "SOLD OUT" },
    { city: "HARLEM, NY", venue: "APOLLO THEATER (OPENER)", date: "SEP 02 2004", status: "COMPLETED" },
    { city: "PHILADELPHIA, PA", venue: "THE TLA", date: "SEP 15 2004", status: "CANCELLED" },
    { city: "BOSTON, MA", venue: "MIDDLE EAST", date: "SEP 22 2004", status: "CANCELLED" },
    { city: "TORONTO, ON", venue: "OPERA HOUSE", date: "OCT 05 2004", status: "PENDING..." },
  ];

  return (
    <div className="h-full w-full relative overflow-hidden flex items-center justify-center p-4">
      <BackgroundCarousel images={[]} />
      <div className="absolute inset-0 bg-black/70 z-10"></div>
      <div className="relative z-30 w-full max-w-4xl h-[80vh] bg-[#111] border border-[#333] shadow-2xl flex flex-col">
        <div className="bg-[#00ff41] text-black px-4 py-2 flex justify-between items-center font-bold">
           <span className="flex items-center gap-2"><Truck size={18}/> WORLD_TOUR_LOG.EXE</span>
           <div className="flex gap-1">
             <div className="w-3 h-3 bg-black"></div>
             <div className="w-3 h-3 bg-black"></div>
           </div>
        </div>
        <div className="flex-1 overflow-y-auto p-8">
           <div className="border-b-2 border-[#333] pb-6 mb-6">
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-2">THE 'LOST' TOUR</h1>
              <p className="font-mono text-[#00ff41]">SUMMER/FALL 2004 // EAST COAST LEG</p>
           </div>
           
           <div className="grid gap-4">
              {dates.map((gig, i) => (
                <div key={i} className="flex flex-col md:flex-row md:items-center justify-between border border-[#333] p-4 bg-[#0a0a0a] hover:border-[#00ff41] transition-colors group">
                   <div className="flex items-center gap-4">
                      <div className="text-2xl font-black text-gray-700 group-hover:text-white transition-colors">{(i+1).toString().padStart(2, '0')}</div>
                      <div>
                         <div className="text-white font-bold text-lg flex items-center gap-2"><MapPin size={14} className="text-[#00ff41]"/> {gig.city}</div>
                         <div className="text-gray-500 font-mono text-xs">{gig.venue}</div>
                      </div>
                   </div>
                   <div className="flex items-center gap-6 mt-4 md:mt-0">
                      <div className="text-gray-400 font-mono text-sm flex items-center gap-2"><Calendar size={14}/> {gig.date}</div>
                      <div className={`px-3 py-1 text-xs font-bold border ${
                        gig.status === 'SOLD OUT' ? 'bg-[#00ff41] text-black border-[#00ff41]' :
                        gig.status === 'CANCELLED' ? 'bg-red-900 text-red-200 border-red-700' :
                        'border-gray-600 text-gray-400'
                      }`}>
                        {gig.status}
                      </div>
                   </div>
                </div>
              ))}
           </div>
           
           <div className="mt-8 border-t border-[#333] pt-6 flex gap-4">
              <div className="flex-1 bg-[#1a1a1a] p-4 border border-[#333]">
                 <h3 className="text-white font-bold mb-2 flex items-center gap-2"><Ticket size={16} className="text-[#00ff41]"/> TICKET_STUBS.JPG</h3>
                 <div className="h-32 bg-black flex items-center justify-center text-gray-600 text-xs font-mono">IMAGE_CORRUPTED</div>
              </div>
              <div className="flex-1 bg-[#1a1a1a] p-4 border border-[#333]">
                 <h3 className="text-white font-bold mb-2">TOUR_RIDER.TXT</h3>
                 <p className="font-mono text-xs text-gray-400 leading-relaxed">
                    {'>'} 2 BOTTLES HENNESSY<br/>
                    {'>'} 1 BOX DUTCH MASTERS<br/>
                    {'>'} NO BROWN M&Ms<br/>
                    {'>'} 1 PLAYSTATION 2
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

// 6. STYLE ARCHIVE (Merch Store)
const StyleArchive = () => {
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState('cart'); 
  const [processing, setProcessing] = useState(false);

  const merchItems = [
    { id: 1, name: "LIVEWIRE FITTED", category: 'HEADWEAR', price: 45, era: '2004', stock: 3, image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500&q=80', desc: 'WASHED COTTON / STRUCTURED' },
    { id: 2, name: "VELOUR TRACK JKT", category: 'APPAREL', price: 120, era: '2003', stock: 0, image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&q=80', desc: 'DUST NAVY / CROPPED' },
    { id: 3, name: "WHIP JERSEY 04", category: 'APPAREL', price: 85, era: '2004', stock: 12, image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500&q=80', desc: 'OATMEAL / HEAVY MESH' },
    { id: 4, name: "PUFFER VEST", category: 'APPAREL', price: 150, era: '2005', stock: 5, image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&q=80', desc: 'CLAY / MATTE FINISH' },
    { id: 5, name: "CARGO DENIM", category: 'APPAREL', price: 90, era: '2002', stock: 8, image: 'https://images.unsplash.com/photo-1542272617-08f086303294?w=500&q=80', desc: 'DISTRESSED / BAGGY FIT' },
    { id: 6, name: "TOUR BANDANA", category: 'ACCESSORIES', price: 20, era: '2004', stock: 50, image: 'https://images.unsplash.com/photo-1629316075677-72782e379a41?w=500&q=80', desc: 'OLIVE / SILK SCREEN' }
  ];

  const addToCart = (item) => {
    if (item.stock > 0) {
      setCart([...cart, item]);
      setIsCartOpen(true);
    }
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.price, 0);

  const handleCheckout = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setCheckoutStep('success');
      setCart([]);
    }, 3000);
  };

  const filteredItems = activeCategory === 'ALL' ? merchItems : merchItems.filter(item => item.category === activeCategory);

  return (
    <div className="h-full flex flex-col bg-[#111] text-[#ccc] relative">
      <div className="min-h-[80px] border-b border-[#333] flex flex-col md:flex-row md:items-center justify-between px-6 py-4 bg-[#0a0a0a]">
        <h2 className="text-4xl font-black uppercase tracking-tighter text-white leading-none mb-4 md:mb-0">Y2K<br/>SEASON</h2>
        <div className="flex gap-6 text-[10px] font-bold tracking-[0.2em] uppercase">
          {['ALL', 'APPAREL', 'HEADWEAR', 'ACCESSORIES'].map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`hover:text-white transition-colors ${activeCategory === cat ? 'text-white line-through decoration-[#00ff41] decoration-2' : 'text-gray-600'}`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div 
          onClick={() => setIsCartOpen(true)}
          className="hidden md:flex items-center gap-2 font-bold text-xs border border-[#333] px-4 py-2 hover:bg-[#00ff41] hover:text-black hover:border-[#00ff41] transition-all cursor-pointer uppercase tracking-widest"
        >
          <ShoppingBag size={14}/> <span>CART ({cart.length})</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-[#333]">
          {filteredItems.map(item => (
            <div key={item.id} className="group relative bg-[#0a0a0a] aspect-[3/4] flex flex-col cursor-pointer overflow-hidden">
              <div className="absolute inset-0">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover filter grayscale contrast-125 brightness-75 group-hover:scale-105 group-hover:brightness-100 transition-all duration-700" />
                
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none mix-blend-overlay opacity-80">
                  <div className="transform -rotate-6">
                    <h1 className="font-black text-6xl text-white tracking-tighter opacity-90 leading-none">
                      WHIP<br/>MNTZ
                    </h1>
                  </div>
                </div>

                {item.stock === 0 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm z-20">
                    <span className="text-red-500 font-bold text-xl tracking-[0.5em] border-2 border-red-500 px-6 py-2 uppercase">Sold Out</span>
                  </div>
                )}
              </div>

              <div className="absolute bottom-0 left-0 w-full p-6 z-10 bg-gradient-to-t from-black via-black/80 to-transparent pt-12">
                <div className="flex justify-between items-end border-b border-white/20 pb-2 mb-2">
                  <div>
                    <h3 className="font-bold text-white text-lg uppercase leading-none tracking-tight">{item.name}</h3>
                    <p className="text-[#00ff41] text-[10px] font-mono mt-1 uppercase tracking-wider">{item.desc}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-mono font-bold text-xl">${item.price}</div>
                  </div>
                </div>
                
                <button 
                  onClick={() => addToCart(item)}
                  disabled={item.stock === 0}
                  className="w-full text-xs font-bold uppercase tracking-[0.2em] py-3 hover:bg-[#00ff41] hover:text-black transition-colors text-gray-400 border border-transparent hover:border-[#00ff41] flex justify-between px-2 items-center"
                >
                  <span>{item.stock === 0 ? "OUT OF STOCK" : "ADD TO CART"}</span>
                  {item.stock > 0 && <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>}
                </button>
              </div>
              
              {item.stock > 0 && item.stock < 5 && (
                <div className="absolute top-4 right-4 bg-red-600 text-white px-2 py-1 text-[10px] font-bold tracking-widest uppercase z-20 animate-pulse">
                  Low Stock
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {isCartOpen && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex justify-end">
          <div className="w-full max-w-md h-full bg-[#0a0a0a] border-l border-[#333] flex flex-col shadow-2xl">
            <div className="h-16 border-b border-[#333] flex items-center justify-between px-6 bg-[#111]">
              <h2 className="text-xl font-black uppercase tracking-tighter text-white">
                {checkoutStep === 'cart' ? 'YOUR_CART' : checkoutStep === 'shipping' ? 'SHIPPING_INFO' : checkoutStep === 'payment' ? 'SECURE_PAYMENT' : 'RECEIPT'}
              </h2>
              <button onClick={() => {setIsCartOpen(false); setCheckoutStep('cart');}}><X size={20} className="text-white hover:text-[#00ff41]"/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 relative">
              {checkoutStep === 'cart' && (
                <>
                  {cart.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-500 font-mono text-xs">CART IS EMPTY</div>
                  ) : (
                    <div className="space-y-4">
                      {cart.map((item, idx) => (
                        <div key={idx} className="flex gap-4 border border-[#333] p-2 bg-[#111]">
                          <div className="w-16 h-16 bg-[#222]">
                            <img src={item.image} className="w-full h-full object-cover grayscale"/>
                          </div>
                          <div className="flex-1">
                            <div className="text-white font-bold text-sm uppercase">{item.name}</div>
                            <div className="text-[#00ff41] font-mono text-xs">${item.price}</div>
                          </div>
                          <button 
                            onClick={() => setCart(cart.filter((_, i) => i !== idx))}
                            className="text-gray-500 hover:text-white"
                          ><X size={14}/></button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {(checkoutStep === 'shipping' || checkoutStep === 'payment') && (
                <div className="space-y-4 font-mono text-xs">
                  {checkoutStep === 'shipping' && (
                    <>
                      <input type="text" placeholder="FULL NAME" className="w-full bg-[#111] border border-[#333] p-3 text-white outline-none focus:border-[#00ff41]" />
                      <input type="text" placeholder="ADDRESS LINE 1" className="w-full bg-[#111] border border-[#333] p-3 text-white outline-none focus:border-[#00ff41]" />
                      <div className="flex gap-2">
                        <input type="text" placeholder="CITY" className="w-full bg-[#111] border border-[#333] p-3 text-white outline-none focus:border-[#00ff41]" />
                        <input type="text" placeholder="ZIP" className="w-1/3 bg-[#111] border border-[#333] p-3 text-white outline-none focus:border-[#00ff41]" />
                      </div>
                    </>
                  )}
                  {checkoutStep === 'payment' && (
                    <>
                      <div className="flex items-center gap-2 mb-4 text-[#00ff41]">
                        <Lock size={14} /> SECURE TERMINAL ENCRYPTED
                      </div>
                      <input type="text" placeholder="CARD NUMBER" className="w-full bg-[#111] border border-[#333] p-3 text-white outline-none focus:border-[#00ff41]" />
                      <div className="flex gap-2">
                        <input type="text" placeholder="MM/YY" className="w-1/2 bg-[#111] border border-[#333] p-3 text-white outline-none focus:border-[#00ff41]" />
                        <input type="text" placeholder="CVC" className="w-1/2 bg-[#111] border border-[#333] p-3 text-white outline-none focus:border-[#00ff41]" />
                      </div>
                    </>
                  )}
                </div>
              )}

              {checkoutStep === 'success' && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <CheckCircle size={64} className="text-[#00ff41]" />
                  <h3 className="text-2xl font-black uppercase text-white">ORDER CONFIRMED</h3>
                  <p className="text-gray-500 font-mono text-xs max-w-xs">
                    CONFIRMATION SENT TO EMAIL.<br/>
                    ESTIMATED SHIPPING: 2004
                  </p>
                  <button onClick={() => {setIsCartOpen(false); setCheckoutStep('cart');}} className="text-[#00ff41] underline font-mono text-xs mt-4">CLOSE RECEIPT</button>
                </div>
              )}

              {processing && (
                <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50">
                  <div className="w-12 h-12 border-4 border-[#00ff41] border-t-transparent rounded-full animate-spin mb-4"></div>
                  <div className="text-[#00ff41] font-mono text-xs animate-pulse">PROCESSING TRANSACTION...</div>
                </div>
              )}
            </div>

            {checkoutStep !== 'success' && (
              <div className="p-6 border-t border-[#333] bg-[#111]">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-gray-500 font-mono text-xs">TOTAL</span>
                  <span className="text-white font-bold text-xl font-mono">${cartTotal}</span>
                </div>
                <button 
                  onClick={() => checkoutStep === 'cart' ? setCheckoutStep('shipping') : checkoutStep === 'shipping' ? setCheckoutStep('payment') : handleCheckout()}
                  className="w-full bg-[#00ff41] text-black py-3 font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkoutStep === 'payment' ? 'PAY NOW' : 'CONTINUE'}
                </button>
              </div>
            )}
          </div>
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

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setLyrics("");
    const systemPrompt = "You are Whip Montez, a gritty, lyrical female rapper from Red Hook Brooklyn, circa 2004. Write an 8-bar verse about the user's topic. Use Spanglish, NY slang from the early 2000s (e.g., 'son', 'dun', 'mad', 'deadass'), and keep it confident and raw. Do not use hashtags. Format it as a verse.";
    const result = await callGemini(prompt, systemPrompt);
    setLyrics(result);
    setLoading(false);
  };

  return (
    <div className="h-full w-full relative overflow-hidden p-6 flex flex-col items-center justify-center">
      <BackgroundCarousel images={[]} />
      <div className="absolute inset-0 bg-black/80 z-10"></div>
      <div className="relative z-20 w-full max-w-3xl border border-[#00ff41] bg-black/90 p-1 shadow-[0_0_30px_rgba(0,255,65,0.1)]">
        <div className="bg-[#00ff41] text-black px-2 py-1 font-bold flex justify-between items-center mb-2">
          <span>LYRIC_RECOVERY_TOOL.EXE</span>
          <div className="flex gap-1"><div className="w-3 h-3 bg-black"></div></div>
        </div>
        <div className="p-4 flex flex-col gap-4">
          <div className="text-[#00ff41] font-mono text-sm mb-2">{'>'} SYSTEM ALERT: CORRUPTED LYRIC FILES DETECTED.<br/>{'>'} ENTER KEYWORDS TO ATTEMPT DATA RECOVERY...</div>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={prompt} 
              onChange={(e) => setPrompt(e.target.value)} 
              placeholder="ENTER TOPIC (e.g., 'Summertime in Brooklyn', 'Haters', 'Money')" 
              className="flex-1 bg-black border border-[#333] text-white p-2 font-mono outline-none focus:border-[#00ff41]" 
              onKeyPress={(e) => e.key === 'Enter' && handleGenerate()} 
            />
            <button 
              onClick={handleGenerate} 
              disabled={loading} 
              className="bg-[#00ff41] text-black px-4 py-2 font-bold font-mono hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? "RECOVERING..." : <span>INITIATE <Sparkles className="inline w-4 h-4"/></span>}
            </button>
          </div>
          <div className="min-h-[200px] border border-[#333] bg-[#050505] p-4 font-mono text-sm md:text-base leading-relaxed overflow-y-auto max-h-[400px]">
            {loading && <div className="text-[#00ff41] animate-pulse">{'>'} SCANNING SECTORS...<br/>{'>'} DECRYPTING FLOW...<br/>{'>'} ASSEMBLING BARS...</div>}
            {!loading && lyrics && <div className="text-white whitespace-pre-line typing-cursor">{lyrics}</div>}
            {!loading && !lyrics && <div className="text-gray-600 italic">// WAITING FOR INPUT //</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

// 8. COMMUNITY HUB (The Block & Rosetta Stone)
const CommunityHub = ({ setSection }) => {
  const [activeTab, setActiveTab] = useState('forum'); // 'forum' | 'translator'
  
  // Translator State
  const [transInput, setTransInput] = useState("");
  const [transOutput, setTransOutput] = useState("");
  const [transLoading, setTransLoading] = useState(false);

  const posts = [
    { id: 1, user: "RedHookFinest", date: "10/22/04 11:42 PM", content: "Just saw Whip at the bodega on Columbia. She said the album drops next week! 🔥", type: 'text', likes: 24, replies: 5 },
    { id: 2, user: "LivewireFan_88", date: "10/21/04 04:20 PM", content: "EXCLUSIVE FOOTAGE: Whip freestyling outside the studio.", type: 'video', likes: 102, replies: 12 },
    { id: 3, user: "BklynZoo_99", date: "10/20/04 09:15 AM", content: "Who got that new mixtape? I need a copy asap.", type: 'text', likes: 8, replies: 2 },
  ];

  const handleTranslate = async () => {
    if (!transInput.trim()) return;
    setTransLoading(true);
    setTransOutput("");
    
    const systemPrompt = "You are a slang translator. Translate the given modern English text into authentic 2004 New York City / Red Hook street slang. Use terms like 'son', 'dun', 'mad', 'brick', 'deadass', 'tight', 'guap', 'whip', 'crib'. Keep it short and punchy.";
    const result = await callGemini(transInput, systemPrompt);
    
    setTransOutput(result);
    setTransLoading(false);
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] relative overflow-hidden">
      <div className="h-16 border-b border-[#333] flex items-center justify-between px-6 bg-[#111] shrink-0">
        <div>
          <h2 className="text-xl font-black chrome-text tracking-tight">THE_BLOCK // COMMUNITY</h2>
          <div className="flex gap-4 mt-1">
             <button 
               onClick={() => setActiveTab('forum')}
               className={`text-[10px] font-mono font-bold uppercase tracking-wider hover:text-[#00ff41] transition-colors ${activeTab === 'forum' ? 'text-[#00ff41] underline underline-offset-4' : 'text-gray-500'}`}
             >
               FORUM.EXE
             </button>
             <button 
               onClick={() => setActiveTab('translator')}
               className={`text-[10px] font-mono font-bold uppercase tracking-wider hover:text-[#00ff41] transition-colors ${activeTab === 'translator' ? 'text-[#00ff41] underline underline-offset-4' : 'text-gray-500'}`}
             >
               ROSETTA_STONE_TOOL ✨
             </button>
          </div>
        </div>
        <button 
          onClick={() => setSection('chat')}
          className="bg-[#00ff41] text-black px-4 py-2 font-bold font-mono text-xs flex items-center gap-2 hover:bg-white transition-colors"
        >
          <MessageSquare size={14}/> START CHAT WITH WHIP
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">
        
        {activeTab === 'forum' ? (
          <div className="space-y-6">
            <div className="border border-[#333] bg-[#111] p-4 flex gap-4">
              <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-gray-500 text-xs font-bold">USER</div>
              <div className="flex-1">
                <textarea placeholder="Post to the block..." className="w-full bg-transparent text-white text-sm outline-none resize-none h-12 font-mono"></textarea>
                <div className="flex justify-between items-center mt-2 border-t border-[#333] pt-2">
                  <div className="flex gap-2 text-gray-500">
                    <Video size={16} className="cursor-pointer hover:text-white"/>
                    <Share2 size={16} className="cursor-pointer hover:text-white"/>
                  </div>
                  <button className="text-[#00ff41] text-xs font-bold hover:underline">POST MESSAGE</button>
                </div>
              </div>
            </div>

            {posts.map(post => (
              <div key={post.id} className="border border-[#333] bg-[#050505] p-4 hover:border-gray-600 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-900 to-purple-900 rounded-full border border-gray-600"></div>
                    <div>
                      <div className="text-[#00ff41] font-bold text-xs">{post.user}</div>
                      <div className="text-gray-600 text-[10px] font-mono">{post.date}</div>
                    </div>
                  </div>
                </div>
                <div className="text-gray-300 text-sm mb-4 font-sans leading-relaxed">
                  {post.content}
                </div>
                {post.type === 'video' && (
                  <div className="bg-black aspect-video mb-4 flex items-center justify-center border border-[#333] relative group cursor-pointer">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                    <Play size={40} className="text-white opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all"/>
                  </div>
                )}
                <div className="flex gap-6 text-xs text-gray-500 font-mono border-t border-[#222] pt-2">
                  <span className="flex items-center gap-1 cursor-pointer hover:text-[#00ff41]"><Heart size={12}/> {post.likes} LIKES</span>
                  <span className="flex items-center gap-1 cursor-pointer hover:text-[#00ff41]"><MessageCircle size={12}/> {post.replies} REPLIES</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center">
             <div className="w-full max-w-2xl border-2 border-[#00ff41] bg-[#111] p-1 shadow-[0_0_30px_rgba(0,255,65,0.1)]">
                <div className="bg-[#00ff41] text-black px-3 py-2 font-bold flex justify-between items-center mb-1">
                   <span className="flex items-center gap-2"><BookOpen size={16}/> SLANG_TRANSLATOR.EXE</span>
                   <div className="flex gap-1"><div className="w-3 h-3 bg-black"></div></div>
                </div>
                
                <div className="p-6 grid gap-6">
                   <div className="space-y-2">
                      <label className="text-[#00ff41] text-xs font-mono font-bold">MODERN ENGLISH INPUT:</label>
                      <textarea 
                        value={transInput}
                        onChange={(e) => setTransInput(e.target.value)}
                        placeholder="e.g. 'That party was really fun, I made a lot of money.'"
                        className="w-full h-24 bg-black border border-[#333] p-4 text-white font-sans text-sm outline-none focus:border-[#00ff41]"
                      />
                   </div>

                   <div className="flex justify-center">
                      <button 
                        onClick={handleTranslate}
                        disabled={transLoading}
                        className="bg-[#333] hover:bg-[#00ff41] text-white hover:text-black border border-[#00ff41] px-6 py-2 font-mono text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                         {transLoading ? 'TRANSLATING...' : <><ArrowRightLeft size={14}/> CONVERT TO 2004 NYC ✨</>}
                      </button>
                   </div>

                   <div className="space-y-2 relative">
                      <label className="text-[#00ff41] text-xs font-mono font-bold">OUTPUT (RED HOOK DIALECT):</label>
                      <div className="w-full h-24 bg-[#050505] border border-[#333] p-4 text-[#00ff41] font-mono text-sm leading-relaxed overflow-y-auto">
                         {transOutput ? transOutput : <span className="text-gray-700 italic">// AWAITING INPUT //</span>}
                      </div>
                   </div>
                </div>
             </div>
             <p className="text-gray-500 font-mono text-[10px] mt-4 text-center max-w-md">
                {'>'} NOTE: TRANSLATION ENGINE BASED ON 2004 LIVEWIRE FORUM LOGS. ACCURACY NOT GUARANTEED OUTSIDE OF BROOKLYN.
             </p>
          </div>
        )}
      </div>
    </div>
  );
};

// 9. SIDEKICK CHAT (IM Style Refined)
const SidekickChat = () => {
  const [messages, setMessages] = useState([
    { sender: 'whip', text: "Yo, who's this? How'd you tap into my drive?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    
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
      {/* AIM-Style Container */}
      <div className="relative z-20 w-full max-w-md bg-[#d4d0c8] border-2 border-white shadow-2xl flex flex-col h-[500px]">
        {/* Title Bar */}
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
        
        {/* Menu Bar */}
        <div className="bg-[#d4d0c8] text-black text-[10px] px-2 border-b border-gray-400 flex gap-2 font-sans py-0.5">
           <span className="underline">F</span>ile <span className="underline">E</span>dit <span className="underline">I</span>nsert <span className="underline">P</span>eople
        </div>

        {/* Chat Area */}
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

        {/* Input Area */}
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

        {/* Footer Buttons */}
        <div className="flex justify-between p-1 bg-[#d4d0c8]">
           <button className="px-3 py-0.5 border border-white border-r-gray-600 border-b-gray-600 text-xs shadow-sm bg-[#d4d0c8] active:border-gray-600 active:border-r-white">Warn</button>
           <button className="px-3 py-0.5 border border-white border-r-gray-600 border-b-gray-600 text-xs shadow-sm bg-[#d4d0c8] active:border-gray-600 active:border-r-white">Block</button>
           <button 
             onClick={handleSend}
             className="px-6 py-0.5 border border-white border-r-gray-600 border-b-gray-600 text-xs shadow-sm bg-[#d4d0c8] font-bold active:border-gray-600 active:border-r-white"
           >
             Send
           </button>
        </div>
      </div>
    </div>
  );
};

// 10. NEWS ARCHIVE (New Feature - 2004/2005 Clippings)
const NewsArchive = () => {
  const newsItems = [
    { 
      id: 1,
      date: "OCT 24 2004", 
      time: "11:23 PM EST",
      source: "XXL MAGAZINE ONLINE", 
      author: "B. Wilson",
      title: "BREAKING: RED HOOK EMCEE 'WHIP MONTEZ' SIGNS TO LIVEWIRE", 
      content: "The rumors are true. After a bidding war that reportedly involved Def Jam and Roc-A-Fella, the Red Hook lyricist known as Whip Montez has inked a deal with Erick Sermon's Livewire imprint. Sources say the deal includes full creative control—a rarity for a debut artist. Whip has been tearing up the mixtape circuit with 'Red Hook Diaries', bringing a gritty, noir storytelling style that's been missing from the radio. Debut album 'Female Hustle' is tentatively scheduled for Summer 2005.",
      tags: ["HIPHOP", "NEW_SIGNING", "NYC"],
      comments: [
        { user: "BklynZoo_99", time: "11:45 PM", text: "Finally! She's been holding it down for the hook. Livewire better not shelf her." },
        { user: "Haterade", time: "11:50 PM", text: "Another one hit wonder. Bet we never hear the album." },
        { user: "RealHipHopHead", time: "12:02 AM", text: "Her flow is different though. That 'Projects Window' track is classic." }
      ]
    },
    { 
      id: 2,
      date: "APR 01 2004", 
      time: "09:00 AM PST",
      source: "GOOGLE PRESS RELEASE", 
      author: "System Admin",
      title: "GOOGLE ANNOUNCES 'GMAIL': 1GB STORAGE FREE?", 
      content: "In a move that many are calling an April Fools' joke, search giant Google has announced a new email service called 'Gmail'. The service claims to offer 1 gigabyte of storage per user—500 times what Hotmail offers. Critics are skeptical about the storage claims and privacy implications of 'contextual advertising'. Is this the end of paid email, or just a data mining operation?",
      tags: ["TECH", "GOOGLE", "EMAIL"],
      comments: [
        { user: "TechGuru04", time: "09:15 AM", text: "1GB? Impossible. Servers cost too much. Definitely a prank." },
        { user: "Hotmail4Life", time: "09:30 AM", text: "Who needs 1GB of email? I delete mine every week." }
      ]
    },
    { 
      id: 3,
      date: "FEB 04 2004", 
      time: "03:30 PM EST",
      source: "THE HARVARD CRIMSON", 
      author: "Campus Beat",
      title: "THEFACEBOOK.COM LAUNCHES: EXCLUSIVE TO STUDENTS", 
      content: "A new social utility has launched at Harvard. 'TheFacebook' describes itself as an online directory that connects people through social networks at colleges. Unlike Friendster, it's clean, fast, and requires a .edu email address. Early adoption is skyrocketing across campus. Will it expand to other Ivies?",
      tags: ["SOCIAL", "COLLEGE", "STARTUP"],
      comments: [
        { user: "SocialButterfly", time: "04:00 PM", text: "Friendster is dead. MySpace is too ugly. This looks promising." },
        { user: "CodingNinja", time: "04:20 PM", text: "It's just a PHP directory. Give it 6 months." }
      ]
    },
    { 
      id: 4,
      date: "NOV 09 2004", 
      time: "12:01 AM EST",
      source: "GAMING INSIDER", 
      author: "MasterChief Fan",
      title: "HALO 2 SHATTERS SALES RECORDS: $125M DAY ONE", 
      content: "Microsoft's Halo 2 has officially become the biggest entertainment launch in history. Lines wrapped around blocks nationwide for midnight releases. The introduction of Xbox Live matchmaking is being hailed as a revolution for console gaming. Productivity across America is expected to drop significantly tomorrow.",
      tags: ["GAMING", "XBOX", "HALO2"],
      comments: [
        { user: "SniperElite", time: "12:05 AM", text: "Dual wielding is game changing. See you on Live!" },
        { user: "SonyPony", time: "12:10 AM", text: "PS2 still has better exclusives. GTA San Andreas > Halo." }
      ]
    }
  ];

  return (
    <div className="h-full w-full relative overflow-hidden flex items-center justify-center p-4">
      <BackgroundCarousel images={[]} />
      <div className="absolute inset-0 bg-black/80 z-10"></div>
      
      {/* Main Container - Blog Style */}
      <div className="relative z-30 w-full max-w-5xl h-[85vh] bg-[#0a0a0a] border-2 border-[#333] shadow-[0_0_40px_rgba(0,255,65,0.1)] flex flex-col font-mono text-gray-300">
        
        {/* Header Banner */}
        <div className="bg-[#00ff41] text-black p-4 border-b-4 border-black flex justify-between items-end">
           <div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none flex items-center gap-4">
                <Globe size={48} strokeWidth={2.5}/> 
                THE_FEED
              </h1>
              <p className="font-bold tracking-widest text-xs md:text-sm mt-1">UNFILTERED NEWS FROM THE UNDERGROUND // EST. 1999</p>
           </div>
           <div className="text-right hidden md:block">
              <div className="font-bold text-lg">VOL. 84</div>
              <div className="text-xs">ARCHIVE_MODE: READ_ONLY</div>
           </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
           
           {/* Sidebar (Desktop) */}
           <div className="hidden md:block w-64 bg-[#111] border-r border-[#333] p-4 overflow-y-auto">
              <div className="mb-6">
                 <h3 className="text-[#00ff41] font-bold border-b border-[#333] pb-1 mb-2 text-sm">POPULAR_TAGS</h3>
                 <div className="flex flex-wrap gap-2">
                    {['#HIPHOP', '#TECH', '#GAMING', '#NYC', '#LEAKS', '#DRAMA'].map(tag => (
                       <span key={tag} className="text-xs text-gray-500 hover:text-white cursor-pointer hover:underline">{tag}</span>
                    ))}
                 </div>
              </div>
              <div className="mb-6">
                 <h3 className="text-[#00ff41] font-bold border-b border-[#333] pb-1 mb-2 text-sm">BLOGROLL</h3>
                 <ul className="space-y-2 text-xs text-blue-400">
                    <li className="cursor-pointer hover:underline hover:text-[#00ff41]">{'>'} NahRight.com</li>
                    <li className="cursor-pointer hover:underline hover:text-[#00ff41]">{'>'} 2DopeBoyz</li>
                    <li className="cursor-pointer hover:underline hover:text-[#00ff41]">{'>'} Slashdot</li>
                    <li className="cursor-pointer hover:underline hover:text-[#00ff41]">{'>'} HypeBeast</li>
                 </ul>
              </div>
              <div className="border border-[#333] p-2 bg-black text-center">
                 <div className="text-[10px] text-gray-500 mb-1">ADVERTISEMENT</div>
                 <div className="h-24 bg-[#00ff41]/10 flex items-center justify-center border border-dashed border-[#00ff41]/30 text-[#00ff41] text-xs font-bold animate-pulse">
                    BUY RINGTONES<br/>TEXT 'WHIP' TO 55555
                 </div>
              </div>
           </div>

           {/* Main Feed */}
           <div className="flex-1 overflow-y-auto bg-[#0a0a0a] p-4 md:p-8 space-y-8 custom-scrollbar">
              {newsItems.map((item) => (
                <div key={item.id} className="border border-[#333] bg-[#111] p-1 shadow-lg hover:border-[#00ff41]/50 transition-colors">
                   
                   {/* Post Header */}
                   <div className="bg-[#1a1a1a] p-3 border-b border-[#333] flex justify-between items-start">
                      <div>
                         <h2 className="text-xl md:text-2xl font-bold text-[#e0e0e0] leading-tight hover:text-[#00ff41] cursor-pointer transition-colors">
                            <span className="text-[#00ff41] mr-2">[{item.id}]</span>
                            {item.title}
                         </h2>
                         <div className="flex gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><Calendar size={12}/> {item.date}</span>
                            <span className="flex items-center gap-1"><User size={12}/> {item.author}</span>
                            <span className="text-[#00ff41] uppercase tracking-wider">SOURCE: {item.source}</span>
                         </div>
                      </div>
                   </div>

                   {/* Post Content */}
                   <div className="p-4 md:p-6 bg-[#0a0a0a]">
                      <p className="text-sm md:text-base leading-relaxed text-gray-300 font-sans border-l-2 border-[#333] pl-4">
                         {item.content}
                      </p>
                      <div className="mt-4 flex gap-2">
                         {item.tags.map(tag => (
                            <span key={tag} className="text-[10px] bg-[#222] text-gray-400 px-2 py-1 rounded border border-[#333] flex items-center gap-1">
                               <Hash size={8}/> {tag}
                            </span>
                         ))}
                      </div>
                      <div className="mt-4 pt-4 border-t border-[#333] flex gap-4 text-xs font-bold">
                         <button className="text-blue-400 hover:text-white flex items-center gap-1 hover:underline">
                            <ExternalLink size={12}/> PERMALINK
                         </button>
                         <button className="text-blue-400 hover:text-white flex items-center gap-1 hover:underline">
                            <MessageSquare size={12}/> {item.comments.length} COMMENTS
                         </button>
                      </div>
                   </div>

                   {/* Comments Section */}
                   <div className="bg-[#0f0f0f] p-4 border-t border-[#333]">
                      <div className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-widest">User Comments</div>
                      <div className="space-y-3">
                         {item.comments.map((comment, idx) => (
                            <div key={idx} className="flex gap-3 text-sm group">
                               <div className="w-8 h-8 bg-[#222] border border-[#333] flex items-center justify-center text-[#00ff41] font-bold text-xs shrink-0">
                                  {comment.user.charAt(0)}
                               </div>
                               <div className="flex-1">
                                  <div className="flex items-baseline gap-2">
                                     <span className="text-[#00ff41] font-bold text-xs hover:underline cursor-pointer">{comment.user}</span>
                                     <span className="text-[10px] text-gray-600">{comment.time}</span>
                                  </div>
                                  <div className="text-gray-400 text-xs mt-0.5 group-hover:text-gray-200 transition-colors">
                                     {comment.text}
                                  </div>
                               </div>
                            </div>
                         ))}
                      </div>
                      
                      {/* Add Comment Box */}
                      <div className="mt-4 flex gap-2">
                         <input 
                           type="text" 
                           placeholder="Post a comment..." 
                           className="flex-1 bg-black border border-[#333] px-3 py-2 text-xs text-white focus:border-[#00ff41] outline-none font-sans"
                         />
                         <button className="bg-[#333] text-white px-4 py-2 text-xs font-bold hover:bg-[#00ff41] hover:text-black transition-colors">POST</button>
                      </div>
                   </div>

                </div>
              ))}
              
              <div className="text-center py-8">
                 <button className="text-[#00ff41] text-xs font-bold border border-[#00ff41] px-6 py-2 hover:bg-[#00ff41] hover:text-black transition-colors">
                    LOAD OLDER POSTS
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

// 11. NEW: RAP BATTLE (The Cipher)
const RapBattle = () => {
  const [history, setHistory] = useState([
    { sender: 'ai', text: "Yo, step up to the mic if you think you're raw / I'll chew you up and spit you out, that's the law." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const handleBattle = async () => {
    if (!input.trim()) return;
    const userBar = { sender: 'user', text: input };
    setHistory(prev => [...prev, userBar]);
    setInput("");
    setLoading(true);

    const systemPrompt = "You are a fierce battle rapper from 2004 Brooklyn. The user is your opponent. Respond to their bar with a 2-4 line diss track verse. Be aggressive, witty, use NYC slang, and make it rhyme. Keep it under 200 characters.";
    const responseText = await callGemini(`Opponent says: "${input}". Respond with a diss.`, systemPrompt);
    
    setHistory(prev => [...prev, { sender: 'ai', text: responseText }]);
    setLoading(false);
  };

  return (
    <div className="h-full w-full relative overflow-hidden flex items-center justify-center p-4">
      <BackgroundCarousel images={[]} />
      <div className="absolute inset-0 bg-black/80 z-10"></div>
      <div className="relative z-30 w-full max-w-2xl h-[70vh] bg-[#111] border border-[#333] shadow-2xl flex flex-col">
        <div className="bg-red-700 text-white px-4 py-2 flex justify-between items-center font-bold">
           <span className="flex items-center gap-2"><Flame size={18}/> CIPHER_DOJO.EXE</span>
           <div className="flex gap-1">
             <div className="w-3 h-3 bg-black"></div>
           </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/90">
           {history.map((turn, i) => (
             <div key={i} className={`flex ${turn.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] p-3 border-l-4 ${turn.sender === 'user' ? 'border-[#00ff41] bg-[#00ff41]/10 text-right' : 'border-red-500 bg-red-900/20 text-left'}`}>
                   <div className={`text-[10px] font-bold mb-1 ${turn.sender === 'user' ? 'text-[#00ff41]' : 'text-red-500'}`}>{turn.sender === 'user' ? 'YOU' : 'RIVAL MC'}</div>
                   <div className="text-white font-mono text-sm whitespace-pre-wrap">{turn.text}</div>
                </div>
             </div>
           ))}
           {loading && <div className="text-red-500 animate-pulse text-xs font-mono">Rival is writing a diss...</div>}
           <div ref={endRef}></div>
        </div>

        <div className="p-4 bg-[#1a1a1a] border-t border-[#333] flex gap-2">
           <input 
             type="text" 
             value={input} 
             onChange={(e) => setInput(e.target.value)} 
             placeholder="Spit your bars here..." 
             className="flex-1 bg-black border border-[#333] text-white p-2 font-mono outline-none focus:border-[#00ff41]" 
             onKeyPress={(e) => e.key === 'Enter' && handleBattle()} 
           />
           <button onClick={handleBattle} disabled={loading} className="bg-red-600 text-white px-6 py-2 font-bold font-mono hover:bg-red-500 transition-colors uppercase disabled:opacity-50">SPIT</button>
        </div>
      </div>
    </div>
  );
};

// 12. NEW: CRATE DIGGER (Sample Finder)
const CrateDigger = () => {
  const [mood, setMood] = useState("");
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleDig = async () => {
    if (!mood.trim()) return;
    setLoading(true);
    setSamples([]);
    
    const systemPrompt = "You are a crate digger and hip hop producer from 2004. The user gives you a 'vibe' or 'mood'. You suggest 3 obscure 70s/80s records (Soul, Jazz, Funk, OSTs) that would be perfect to sample for that vibe. Format the output as a valid JSON array of objects with keys: 'artist', 'track', 'year', 'desc'. The 'desc' should explain why it's good for sampling (e.g. 'nasty drum break', 'haunting vocal'). Do not include markdown formatting.";
    
    const responseText = await callGemini(mood, systemPrompt);
    try {
      // Clean up potential markdown formatting from LLM
      const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '');
      const parsed = JSON.parse(cleanText);
      setSamples(parsed);
    } catch (e) {
      console.error("Failed to parse samples", e);
    }
    setLoading(false);
  };

  return (
    <div className="h-full w-full relative overflow-hidden flex items-center justify-center p-4">
      <BackgroundCarousel images={[]} />
      <div className="absolute inset-0 bg-black/80 z-10"></div>
      <div className="relative z-30 w-full max-w-3xl h-[80vh] bg-[#111] border border-[#333] shadow-2xl flex flex-col">
        <div className="bg-yellow-600 text-black px-4 py-2 flex justify-between items-center font-bold">
           <span className="flex items-center gap-2"><Disc size={18}/> CRATE_DIGGER_PRO.EXE</span>
           <div className="flex gap-1">
             <div className="w-3 h-3 bg-black"></div>
           </div>
        </div>

        <div className="p-6 bg-[#1a1a1a] border-b border-[#333]">
           <h2 className="text-white font-black text-2xl mb-2 tracking-tight">FIND THE PERFECT SAMPLE</h2>
           <div className="flex gap-2">
              <input 
                type="text" 
                value={mood} 
                onChange={(e) => setMood(e.target.value)} 
                placeholder="Enter a vibe (e.g. 'grimy piano noir', '70s cop show chase')" 
                className="flex-1 bg-black border border-[#333] text-white p-3 font-mono outline-none focus:border-yellow-600" 
                onKeyPress={(e) => e.key === 'Enter' && handleDig()} 
              />
              <button onClick={handleDig} disabled={loading} className="bg-yellow-600 text-black px-6 font-bold font-mono hover:bg-yellow-500 transition-colors flex items-center gap-2 disabled:opacity-50">
                {loading ? "DIGGING..." : <><Search size={18}/> DIG</>}
              </button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-[#0a0a0a]">
           <div className="grid gap-4">
              {samples.map((sample, i) => (
                <div key={i} className="flex gap-4 p-4 border border-[#333] bg-[#111] hover:border-yellow-600 transition-colors group">
                   <div className="w-24 h-24 bg-[#222] flex items-center justify-center relative shrink-0">
                      <div className="w-20 h-20 rounded-full bg-black border-4 border-[#333] flex items-center justify-center animate-spin-slow">
                         <div className="w-8 h-8 rounded-full bg-yellow-600/50"></div>
                      </div>
                   </div>
                   <div className="flex-1">
                      <div className="text-yellow-600 text-xs font-bold mb-1">{sample.year} // {sample.artist}</div>
                      <div className="text-white font-black text-xl mb-2">{sample.track}</div>
                      <div className="text-gray-400 font-mono text-sm leading-relaxed border-l-2 border-yellow-600/30 pl-3">
                         "{sample.desc}"
                      </div>
                   </div>
                </div>
              ))}
              {!loading && samples.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-gray-600 font-mono opacity-50 mt-12">
                   <Database size={48} className="mb-4"/>
                   <div>AWAITING QUERY...</div>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

// 12.5. NEW: THE A&R OFFICE (Demo Review)
const AROffice = () => {
  const [demoText, setDemoText] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!demoText.trim()) return;
    setLoading(true);
    setFeedback(null);

    const systemPrompt = `You are a ruthless, busy, high-powered Record Executive in New York City, year 2004 (think Dame Dash meets Suge Knight). 
    A hopeful artist has just submitted a demo (lyrics or concept). 
    Rate their potential from 'Trash' (1/10), 'Brick' (3/10), 'Gold' (7/10), to 'Platinum' (10/10). 
    Give a short, harsh, but constructive critique in the style of a 2004 industry mogul. Use slang like 'money', 'clown', 'hot', 'wack'. 
    If it's wack, say it's wack. If it's hot, tell them we might sign a deal. 
    Return strictly a JSON object: { "rating": "string", "score": number, "critique": "string" }.`;

    try {
      const result = await callGemini(demoText, systemPrompt);
      const cleanJson = result.replace(/```json/g, '').replace(/```/g, '');
      const parsed = JSON.parse(cleanJson);
      setFeedback(parsed);
    } catch (e) {
      setFeedback({ rating: "ERROR", score: 0, critique: "Get out of my office. (System Error)" });
    }
    setLoading(false);
  };

  return (
    <div className="h-full w-full relative overflow-hidden flex items-center justify-center p-4">
      <BackgroundCarousel images={[]} />
      <div className="absolute inset-0 bg-black/90 z-10"></div>
      
      <div className="relative z-30 w-full max-w-4xl h-[85vh] flex flex-col border-4 border-[#444] shadow-2xl bg-[#1a1a1a]">
        {/* Executive Office Header */}
        <div className="bg-gradient-to-r from-gray-200 to-gray-400 p-4 border-b-4 border-[#333] flex justify-between items-center">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center border-2 border-yellow-600">
                 <Briefcase size={24} className="text-yellow-500"/>
              </div>
              <div>
                 <h1 className="text-2xl font-black text-black uppercase tracking-tighter">EXECUTIVE SUITE</h1>
                 <p className="text-xs font-bold text-gray-700 tracking-widest">LIVEWIRE ENTERTAINMENT HQ // 45TH FLOOR</p>
              </div>
           </div>
           <div className="hidden md:block text-right">
              <div className="text-[10px] font-bold text-gray-600">CURRENT STATUS</div>
              <div className="text-red-700 font-black text-lg animate-pulse">DO NOT DISTURB</div>
           </div>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
           {/* Input Section */}
           <div className="w-full md:w-1/2 p-6 flex flex-col bg-[#0f0f0f] border-r border-[#333]">
              <label className="text-gray-400 text-xs font-bold mb-4 uppercase tracking-widest flex items-center gap-2">
                 <Award size={14} className="text-yellow-500"/> Submit Your Demo
              </label>
              <textarea 
                value={demoText}
                onChange={(e) => setDemoText(e.target.value)}
                placeholder="Spit your best 16 bars or pitch your album concept here. Don't waste my time..."
                className="flex-1 bg-[#050505] border border-[#333] p-4 text-white font-mono text-sm outline-none focus:border-yellow-500 resize-none mb-4 placeholder-gray-700"
              />
              <button 
                onClick={handleSubmit}
                disabled={loading || !demoText}
                className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-black uppercase py-4 tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "EXECUTIVE IS REVIEWING..." : "SUBMIT FOR REVIEW ✨"}
              </button>
           </div>

           {/* Feedback Section */}
           <div className="w-full md:w-1/2 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] bg-[#2a2a2a] relative flex flex-col items-center justify-center p-8 text-center">
              <div className="absolute inset-0 bg-black/60"></div>
              
              <div className="relative z-10 w-full">
                 {!feedback && !loading && (
                    <div className="opacity-50">
                       <h3 className="text-3xl font-black text-white mb-2">THE DESK</h3>
                       <p className="text-gray-400 font-mono text-xs">Waiting for submission...</p>
                    </div>
                 )}

                 {loading && (
                    <div className="flex flex-col items-center gap-4">
                       <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                       <div className="text-yellow-500 font-mono text-xs animate-pulse">ANALYZING FLOW PATTERNS...</div>
                    </div>
                 )}

                 {feedback && !loading && (
                    <div className="animate-slide-up">
                       <div className="inline-block border-4 border-white px-8 py-2 mb-6 bg-black shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                          <span className={`text-4xl md:text-5xl font-black uppercase tracking-tighter ${
                             feedback.rating === 'Platinum' ? 'text-[#00ff41]' : 
                             feedback.rating === 'Gold' ? 'text-yellow-400' : 
                             feedback.rating === 'Trash' ? 'text-red-600' : 'text-gray-400'
                          }`}>
                             {feedback.rating}
                          </span>
                       </div>
                       
                       <div className="bg-[#111] border border-white/20 p-6 shadow-2xl transform rotate-1">
                          <div className="text-xs text-gray-500 font-bold mb-2 uppercase tracking-widest">Executive Feedback</div>
                          <p className="text-white font-serif text-lg md:text-xl italic leading-relaxed">
                             "{feedback.critique}"
                          </p>
                          <div className="mt-4 flex justify-center gap-1">
                             {[...Array(10)].map((_, i) => (
                                <div key={i} className={`h-2 w-4 rounded-sm ${i < feedback.score ? 'bg-yellow-500' : 'bg-gray-800'}`}></div>
                             ))}
                          </div>
                       </div>

                       {feedback.rating === 'Platinum' && (
                          <button className="mt-8 bg-[#00ff41] text-black px-6 py-2 font-bold animate-bounce shadow-[0_0_20px_rgba(0,255,65,0.5)]">
                             PRINT CONTRACT
                          </button>
                       )}
                    </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

// 13. NEW: MIX MASTER SUITE (Capstone Feature)
const MixMaster = () => {
  const [mode, setMode] = useState('write'); // 'write' | 'produce'
  
  // Write Mode State
  const [acapellaFile, setAcapellaFile] = useState(null);
  const [lyrics, setLyrics] = useState("");
  const [rhymeSuggestions, setRhymeSuggestions] = useState([]);
  const [rhymeLoading, setRhymeLoading] = useState(false);

  // Produce Mode State
  const [instrumentalFile, setInstrumentalFile] = useState(null);
  const [prodLyrics, setProdLyrics] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [trackReady, setTrackReady] = useState(false);

  const audioRef = useRef(null);

  // Handler for file uploads
  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (type === 'acapella') setAcapellaFile({ name: file.name, url });
      if (type === 'instrumental') setInstrumentalFile({ name: file.name, url });
    }
  };

  // Gemini Rhyme Assist
  const getRhymes = async () => {
    const lines = lyrics.split('\n');
    const lastLine = lines[lines.length - 1];
    if (!lastLine.trim()) return;

    setRhymeLoading(true);
    const prompt = `I am writing a rap song. Give me 5 hard, multi-syllabic rhymes for the line: "${lastLine}". Return only the rhyme words/phrases in a comma-separated list.`;
    const result = await callGemini(prompt, "You are a lyrical assistant.");
    setRhymeSuggestions(result.split(','));
    setRhymeLoading(false);
  };

  // Simulate Song Generation
  const handleGenerate = () => {
    if (!instrumentalFile || !prodLyrics) return;
    setGenerating(true);
    setGenerationProgress(0);
    setTrackReady(false);

    const interval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setGenerating(false);
          setTrackReady(true);
          return 100;
        }
        return prev + 2; // 5 seconds approx
      });
    }, 100);
  };

  return (
    <div className="h-full w-full relative overflow-hidden flex items-center justify-center p-4">
      <BackgroundCarousel images={[]} />
      <div className="absolute inset-0 bg-black/90 z-10"></div>
      
      <div className="relative z-30 w-full max-w-6xl h-[85vh] bg-[#111] border-2 border-[#00ff41] shadow-[0_0_50px_rgba(0,255,65,0.15)] flex flex-col">
        {/* Header */}
        <div className="h-16 border-b-2 border-[#00ff41] bg-[#0a0a0a] flex justify-between items-center px-6">
           <div className="flex items-center gap-3">
              <Sliders size={24} className="text-[#00ff41]"/>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tighter italic">MIX_MASTER_SUITE_V2.0</h1>
           </div>
           <div className="flex gap-2">
              <button 
                onClick={() => setMode('write')}
                className={`px-6 py-2 font-bold font-mono text-xs tracking-widest border ${mode === 'write' ? 'bg-[#00ff41] text-black border-[#00ff41]' : 'text-[#00ff41] border-[#00ff41] hover:bg-[#00ff41]/10'}`}
              >
                WRITER_MODE
              </button>
              <button 
                onClick={() => setMode('produce')}
                className={`px-6 py-2 font-bold font-mono text-xs tracking-widest border ${mode === 'produce' ? 'bg-yellow-500 text-black border-yellow-500' : 'text-yellow-500 border-yellow-500 hover:bg-yellow-500/10'}`}
              >
                PRODUCER_MODE
              </button>
           </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          
          {/* --- WRITER MODE --- */}
          {mode === 'write' && (
            <div className="flex-1 flex flex-col md:flex-row">
               {/* Left: Audio Deck */}
               <div className="w-full md:w-1/3 bg-[#0f0f0f] border-r border-[#333] p-6 flex flex-col gap-6">
                  <div className="border border-[#333] p-4 bg-black/50 text-center relative group">
                     <input type="file" accept="audio/*" onChange={(e) => handleFileUpload(e, 'acapella')} className="absolute inset-0 opacity-0 cursor-pointer z-20"/>
                     <div className="flex flex-col items-center gap-2 text-gray-500 group-hover:text-[#00ff41] transition-colors">
                        <Upload size={32}/>
                        <span className="font-mono text-xs font-bold">{acapellaFile ? "REPLACE FILE" : "UPLOAD ACAPELLA / BEAT"}</span>
                     </div>
                  </div>

                  {acapellaFile && (
                    <div className="bg-[#1a1a1a] border border-[#00ff41]/30 p-4 rounded">
                       <div className="text-[#00ff41] text-xs font-mono mb-2 truncate">{acapellaFile.name}</div>
                       <audio ref={audioRef} controls src={acapellaFile.url} className="w-full h-8 invert contrast-200" />
                       <div className="flex justify-between mt-2 text-[10px] text-gray-500 font-mono">
                          <span>WAVEFORM_VISUALIZER_ACTIVE</span>
                          <Activity size={12} className="text-[#00ff41] animate-pulse"/>
                       </div>
                    </div>
                  )}

                  <div className="flex-1 bg-[#050505] border border-[#333] p-4 overflow-y-auto">
                     <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2"><Wand2 size={14} className="text-purple-500"/> GEMINI RHYME ASSIST</h3>
                     {rhymeSuggestions.length > 0 ? (
                       <div className="space-y-2">
                          {rhymeSuggestions.map((rhyme, i) => (
                            <div key={i} className="bg-[#111] border border-purple-500/30 p-2 text-purple-300 text-xs font-mono cursor-pointer hover:bg-purple-500/20 hover:text-white">
                               {rhyme.trim()}
                            </div>
                          ))}
                       </div>
                     ) : (
                       <div className="text-gray-600 text-xs font-mono italic text-center mt-10">
                          Type a line in the editor and click "Get Rhymes" to activate AI assistance.
                       </div>
                     )}
                  </div>
               </div>

               {/* Right: Text Editor */}
               <div className="flex-1 bg-[#111] flex flex-col relative">
                  <div className="bg-[#222] px-4 py-2 flex justify-between items-center border-b border-[#333]">
                     <span className="text-gray-400 text-xs font-mono">UNTITLED_DRAFT.TXT</span>
                     <button onClick={getRhymes} disabled={rhymeLoading} className="bg-purple-600 text-white px-4 py-1 text-xs font-bold hover:bg-purple-500 disabled:opacity-50 flex items-center gap-2">
                        {rhymeLoading ? 'ANALYZING...' : <><Sparkles size={12}/> GET RHYMES</>}
                     </button>
                  </div>
                  <textarea 
                    value={lyrics}
                    onChange={(e) => setLyrics(e.target.value)}
                    placeholder="Start writing your bars here..."
                    className="flex-1 bg-[#0a0a0a] text-gray-300 p-8 font-mono text-lg outline-none resize-none leading-relaxed"
                    spellCheck="false"
                  />
               </div>
            </div>
          )}

          {/* --- PRODUCER MODE --- */}
          {mode === 'produce' && (
             <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
                {/* Background FX */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                   <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.15)_0%,transparent_70%)]"></div>
                   <div className="grid grid-cols-12 h-full w-full opacity-10">
                      {[...Array(12)].map((_, i) => <div key={i} className="border-r border-yellow-500/20 h-full"></div>)}
                   </div>
                </div>

                {!trackReady ? (
                  <div className="w-full max-w-2xl z-10 space-y-8 p-8">
                     <div className="grid grid-cols-2 gap-6">
                        {/* Slot 1: Instrumental */}
                        <div className="border-2 border-dashed border-yellow-600/50 bg-[#0a0a0a] h-48 flex flex-col items-center justify-center relative hover:border-yellow-500 hover:bg-yellow-900/10 transition-all group">
                           <input type="file" accept="audio/*" onChange={(e) => handleFileUpload(e, 'instrumental')} className="absolute inset-0 opacity-0 cursor-pointer z-20"/>
                           <Music4 size={48} className={`mb-4 ${instrumentalFile ? 'text-yellow-500' : 'text-gray-600 group-hover:text-yellow-500'}`}/>
                           <div className="text-center">
                              <div className="font-black text-white uppercase tracking-widest mb-1">
                                 {instrumentalFile ? "TRACK LOADED" : "UPLOAD BEAT"}
                              </div>
                              <div className="text-[10px] font-mono text-gray-500">{instrumentalFile ? instrumentalFile.name : "DRAG & DROP OR CLICK"}</div>
                           </div>
                        </div>

                        {/* Slot 2: Lyrics */}
                        <div className="border-2 border-dashed border-yellow-600/50 bg-[#0a0a0a] h-48 flex flex-col relative hover:border-yellow-500 transition-all">
                           <div className="absolute top-0 left-0 bg-yellow-600 text-black text-[10px] font-bold px-2 py-1">LYRIC INPUT</div>
                           <textarea 
                             value={prodLyrics}
                             onChange={(e) => setProdLyrics(e.target.value)}
                             placeholder="Paste your lyrics here for synthesis..."
                             className="w-full h-full bg-transparent text-white p-4 pt-8 font-mono text-xs outline-none resize-none"
                           />
                        </div>
                     </div>

                     {/* Action Area */}
                     <div className="relative">
                        {generating ? (
                          <div className="bg-[#111] border border-yellow-600 p-6">
                             <div className="flex justify-between text-yellow-500 font-mono text-xs mb-2">
                                <span className="animate-pulse">SYNTHESIZING VOCALS...</span>
                                <span>{generationProgress}%</span>
                             </div>
                             <div className="w-full h-4 bg-[#000] border border-[#333]">
                                <div className="h-full bg-yellow-600 transition-all duration-100" style={{width: `${generationProgress}%`}}></div>
                             </div>
                             <div className="mt-2 text-[10px] text-gray-500 font-mono">
                                {'>'} MATCHING BPM... <br/>
                                {'>'} APPLYING LO-FI FILTER... <br/>
                                {'>'} RENDERING MONTEZ_VOX_MODEL_V2...
                             </div>
                          </div>
                        ) : (
                          <button 
                            onClick={handleGenerate}
                            disabled={!instrumentalFile || !prodLyrics}
                            className="w-full bg-yellow-600 text-black h-16 font-black text-xl tracking-[0.2em] hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
                          >
                             <Zap size={24} fill="black"/> GENERATE TRACK
                          </button>
                        )}
                     </div>
                  </div>
                ) : (
                  <div className="w-full max-w-xl bg-[#0a0a0a] border-2 border-yellow-500 p-8 text-center z-10 shadow-[0_0_50px_rgba(234,179,8,0.2)]">
                     <CheckCircle size={64} className="text-yellow-500 mx-auto mb-6"/>
                     <h2 className="text-3xl font-black text-white italic mb-2">TRACK COMPLETE</h2>
                     <p className="text-gray-400 font-mono text-sm mb-8">AI_VOCAL_SYNTHESIS_SUCCESSFUL // READY_FOR_PLAYBACK</p>
                     
                     <div className="bg-[#111] p-4 border border-[#333] mb-6 flex items-center gap-4">
                        <div className="w-12 h-12 bg-yellow-600 flex items-center justify-center">
                           <Play size={24} className="text-black fill-black"/>
                        </div>
                        <div className="text-left flex-1">
                           <div className="text-white font-bold">NEW_TRACK_01.MP3</div>
                           <div className="text-xs text-gray-500 font-mono">03:42 // 192KBPS</div>
                        </div>
                        <div className="text-yellow-500 font-mono text-xs animate-pulse">PLAYING</div>
                     </div>

                     <button onClick={() => setTrackReady(false)} className="text-gray-500 hover:text-white underline text-xs font-mono">START OVER</button>
                  </div>
                )}
             </div>
          )}

        </div>
      </div>
    </div>
  );
};

// 14. UPDATED: STUDIO HUB (Linking to MixMaster & AR Office)
const StudioHub = ({ setSection }) => {
  return (
    <div className="h-full w-full relative overflow-hidden flex items-center justify-center p-4">
      <BackgroundCarousel images={[]} />
      <div className="absolute inset-0 bg-black/80 z-10"></div>
      
      <div className="relative z-30 w-full max-w-6xl h-[85vh] flex flex-col gap-6">
         <div className="text-center shrink-0">
            <h1 className="text-5xl md:text-7xl font-black chrome-text tracking-tighter mb-2">THE LAB</h1>
            <p className="text-[#00ff41] font-mono tracking-[0.5em] text-sm">SELECT YOUR WEAPON</p>
         </div>

         <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 min-h-0">
            {/* Cipher Card */}
            <div 
              onClick={() => setSection('battle')}
              className="bg-[#111] border-2 border-red-900 p-6 flex flex-col items-center text-center hover:border-red-500 hover:bg-red-900/10 transition-all cursor-pointer group justify-center relative overflow-hidden"
            >
               <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
               <Flame size={48} className="text-red-600 mb-4 group-hover:scale-110 transition-transform relative z-10"/>
               <h2 className="text-xl font-black text-white uppercase mb-1 relative z-10">The Cipher</h2>
               <p className="text-gray-400 text-[10px] font-mono relative z-10 group-hover:text-red-200">Battle against the AI MC.</p>
            </div>

            {/* Crates Card */}
            <div 
              onClick={() => setSection('crates')}
              className="bg-[#111] border-2 border-yellow-900 p-6 flex flex-col items-center text-center hover:border-yellow-500 hover:bg-yellow-900/10 transition-all cursor-pointer group justify-center relative overflow-hidden"
            >
               <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
               <Disc size={48} className="text-yellow-600 mb-4 group-hover:scale-110 transition-transform relative z-10"/>
               <h2 className="text-xl font-black text-white uppercase mb-1 relative z-10">Crate Digger</h2>
               <p className="text-gray-400 text-[10px] font-mono relative z-10 group-hover:text-yellow-200">Hunt for obscure samples.</p>
            </div>

            {/* Lyric Card */}
            <div 
              onClick={() => setSection('ghostwriter')}
              className="bg-[#111] border-2 border-[#00ff41]/30 p-6 flex flex-col items-center text-center hover:border-[#00ff41] hover:bg-[#00ff41]/10 transition-all cursor-pointer group justify-center relative overflow-hidden"
            >
               <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
               <Mic size={48} className="text-[#00ff41] mb-4 group-hover:scale-110 transition-transform relative z-10"/>
               <h2 className="text-xl font-black text-white uppercase mb-1 relative z-10">Ghostwriter</h2>
               <p className="text-gray-400 text-[10px] font-mono relative z-10 group-hover:text-[#00ff41]">Recover lost lyrics.</p>
            </div>

            {/* NEW: A&R Office Card */}
            <div 
              onClick={() => setSection('ar_office')}
              className="bg-[#111] border-2 border-gray-600 p-6 flex flex-col items-center text-center hover:border-white hover:bg-white/10 transition-all cursor-pointer group justify-center relative overflow-hidden"
            >
               <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
               <Briefcase size={48} className="text-gray-400 mb-4 group-hover:scale-110 group-hover:text-white transition-all relative z-10"/>
               <h2 className="text-xl font-black text-white uppercase mb-1 relative z-10">A&R Office</h2>
               <p className="text-gray-400 text-[10px] font-mono relative z-10 group-hover:text-white">Get Signed or Get Dropped. ✨</p>
            </div>
         </div>

         {/* CAPSTONE: MIX MASTER BANNER */}
         <div 
            onClick={() => setSection('mix_master')}
            className="h-32 bg-gradient-to-r from-gray-900 via-[#111] to-gray-900 border-2 border-white/20 hover:border-[#00ff41] hover:shadow-[0_0_30px_rgba(0,255,65,0.2)] transition-all cursor-pointer flex items-center justify-between px-12 group relative overflow-hidden"
         >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30"></div>
            <div className="relative z-10 flex items-center gap-6">
               <div className="w-16 h-16 bg-[#00ff41] flex items-center justify-center rounded-full group-hover:scale-110 transition-transform">
                  <Headphones size={32} className="text-black"/>
               </div>
               <div className="text-left">
                  <h2 className="text-3xl font-black text-white italic tracking-tighter group-hover:text-[#00ff41] transition-colors">MIX MASTER SUITE</h2>
                  <p className="text-gray-400 font-mono text-xs tracking-widest">VOCAL RECORDING // AI PRODUCTION TOOLS</p>
               </div>
            </div>
            <div className="relative z-10 hidden md:block">
               <button className="bg-white text-black px-6 py-2 font-bold font-mono text-xs uppercase tracking-widest hover:bg-[#00ff41] transition-colors">ENTER STUDIO</button>
            </div>
         </div>
      </div>
    </div>
  );
};

// 15. MAIN OS SHELL (Updated Navigation)
const OSInterface = () => {
  const [activeSection, setActiveSection] = useState('home');
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    // The boot sequence is handled in App, so we don't need to setBooted here.
    const clockTimer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(clockTimer);
  }, []);

  return (
    <div className="flex flex-col h-screen w-full relative z-10">
      {/* Top Bar */}
      <div className="h-10 bg-[#111] border-b border-[#333] flex items-center justify-between px-4 select-none overflow-x-auto">
        <div className="flex items-center gap-4 min-w-max">
          <div className="flex items-center gap-2 text-[#00ff41] font-bold">
            <Cpu size={16} /> 
            <span className="hidden md:inline">SYSTEM_READY</span>
          </div>
          <div className="h-4 w-[1px] bg-[#333]"></div>
          <nav className="flex gap-1">
            {['home', 'bio', 'music', 'tour', 'style', 'community', 'news'].map(section => (
              <button 
                key={section}
                onClick={() => setActiveSection(section)} 
                className={`px-3 py-1 text-xs font-mono uppercase transition-colors ${activeSection === section ? 'bg-[#00ff41] text-black' : 'text-gray-400 hover:text-white'}`}
              >
                {section === 'music' ? 'Lost_Tapes' : section === 'style' ? 'Merch' : section === 'community' ? 'The_Block' : section}
              </button>
            ))}
            <div className="h-4 w-[1px] bg-[#333] mx-1"></div>
            <button onClick={() => setActiveSection('studio')} className={`px-3 py-1 text-xs font-mono uppercase transition-colors flex items-center gap-1 ${['studio', 'battle', 'crates', 'ghostwriter', 'mix_master', 'ar_office'].includes(activeSection) ? 'bg-yellow-600 text-black' : 'text-gray-400 hover:text-white'}`}><Grid size={10} /> STUDIO</button>
          </nav>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-[#00ff41] ml-4">
          <span className="animate-pulse hidden md:inline">CONN: SECURE</span>
          <span>{time}</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden bg-black">
        <div className="absolute inset-2 border border-[#333] flex flex-col bg-[#050505]">
          <div className="h-8 bg-[#1a1a1a] border-b border-[#333] flex items-center justify-between px-2">
            <div className="text-xs text-gray-400 font-mono flex items-center gap-2">
              <Terminal size={12} />
              C:\WHIP_MONTEZ\{activeSection.toUpperCase()}.EXE
            </div>
            <div className="flex gap-2">
              <Minus size={12} className="text-gray-500 cursor-pointer" />
              <Maximize2 size={12} className="text-gray-500 cursor-pointer" />
              <X size={12} className="text-gray-500 cursor-pointer" />
            </div>
          </div>
          
          <div className="flex-1 relative overflow-hidden">
            {activeSection === 'home' && <Home setSection={setActiveSection} />}
            {activeSection === 'bio' && <Bio setSection={setActiveSection} />}
            {activeSection === 'music' && <MusicPlayer />}
            {activeSection === 'tour' && <TourHistory />}
            {activeSection === 'style' && <StyleArchive />}
            {activeSection === 'community' && <CommunityHub setSection={setActiveSection} />}
            {activeSection === 'studio' && <StudioHub setSection={setActiveSection} />}
            {/* Sub-sections accessed via StudioHub or direct links */}
            {activeSection === 'ghostwriter' && <Ghostwriter />}
            {activeSection === 'chat' && <SidekickChat />}
            {activeSection === 'battle' && <RapBattle />}
            {activeSection === 'crates' && <CrateDigger />}
            {activeSection === 'ar_office' && <AROffice />}
            {activeSection === 'news' && <NewsArchive />}
            {activeSection === 'mix_master' && <MixMaster />}
          </div>
        </div>
      </div>

      {/* Footer Ticker */}
      <div className="h-6 bg-[#00ff41] text-black text-xs font-mono flex items-center overflow-hidden border-t border-[#00ff41]">
         <div className="animate-marquee whitespace-nowrap uppercase font-bold">
            *** BREAKING: UNRELEASED TRACKS FOUND IN RED HOOK BASEMENT *** TOUR DATES LEAKED FROM 2004 *** WHIP MONTEZ SIGHTING CONFIRMED AT BODEGA *** SYSTEM RESTORATION AT 99% ***
         </div>
      </div>
    </div>
  );
};

export default function App() {
  const [booted, setBooted] = useState(false);

  return (
    <div className="relative w-full h-screen bg-black text-white selection:bg-[#00ff41] selection:text-black font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Anton&family=Inter:wght@400;800&family=Comic+Neue:wght@700&display=swap');
        
        :root {
          --neon-green: #00ff41;
          --dark-bg: #050505;
          --chrome-1: #e0e0e0;
          --chrome-2: #8a8a8a;
          --chrome-3: #ffffff;
        }

        /* --- SCROLLBAR STYLING --- */
        ::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        
        ::-webkit-scrollbar-track {
          background: #050505;
          border-left: 1px solid #333;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 0;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #00ff41;
          border: 1px solid #00ff41;
          box-shadow: 0 0 10px #00ff41;
        }

        .crt-overlay {
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
          background-size: 100% 2px, 3px 100%;
          pointer-events: none;
          z-index: 60;
        }

        .scanline {
          width: 100%;
          height: 100px;
          z-index: 55;
          background: linear-gradient(0deg, rgba(0,0,0,0) 0%, rgba(0, 255, 65, 0.1) 50%, rgba(0,0,0,0) 100%);
          opacity: 0.1;
          position: absolute;
          bottom: 100%;
          animation: scanline 10s linear infinite;
          pointer-events: none;
        }

        @keyframes scanline {
          0% { bottom: 100%; }
          100% { bottom: -100px; }
        }

        .chrome-text {
          font-family: 'Anton', sans-serif;
          background: linear-gradient(to bottom, var(--chrome-3) 0%, var(--chrome-1) 50%, var(--chrome-2) 51%, var(--chrome-3) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0px 2px 0px rgba(0,0,0,0.5);
          -webkit-text-stroke: 1px rgba(255,255,255,0.4);
          letter-spacing: -0.02em;
        }

        .y2k-enhanced-image {
          filter: contrast(1.3) saturate(1.2) sepia(0.3) brightness(0.8) hue-rotate(-10deg);
          mix-blend-mode: luminosity;
        }

        .ken-burns-anim {
          animation: kenBurns 20s infinite alternate ease-in-out;
        }

        @keyframes kenBurns {
          0% { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.2) translate(-3%, -2%); }
        }

        .typing-cursor::after {
          content: '█';
          animation: blink 1s infinite;
        }

        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

        .equalizer-bar {
          animation: equalize 1s infinite;
        }

        @keyframes equalize {
          0% { height: 20%; }
          50% { height: 100%; }
          100% { height: 20%; }
        }

        .animate-marquee {
          animation: marquee 15s linear infinite;
        }
        
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        
        .glitch-text {
          animation: glitch 0.5s infinite;
        }
        
        @keyframes glitch {
          0% { transform: translate(0) }
          20% { transform: translate(-2px, 2px) }
          40% { transform: translate(-2px, -2px) }
          60% { transform: translate(2px, 2px) }
          80% { transform: translate(2px, -2px) }
          100% { transform: translate(0) }
        }
        
        .animate-slide-up {
          animation: slideUp 0.5s ease-out forwards;
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="absolute inset-0 z-[100] pointer-events-none overflow-hidden">
        <div className="crt-overlay absolute inset-0"></div>
        <div className="scanline"></div>
        <div className="absolute inset-0 bg-black opacity-10 pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      </div>

      {!booted ? <BootSequence onComplete={() => setBooted(true)} /> : <OSInterface />}
    </div>
  );
}