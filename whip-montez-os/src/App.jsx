import React, { useState, useEffect, useRef } from 'react';
import { X, Minus, Square, Disc, Folder, Image as ImageIcon, Terminal } from 'lucide-react';

// --- System Configuration ---
const SYSTEM_THEME = {
  bg: "bg-[#008080]", // Classic Teal
  windowBg: "bg-[#c0c0c0]",
  headerBlue: "bg-gradient-to-r from-[#000080] to-[#1084d0]",
  text: "text-black",
  font: "font-mono", 
};

// --- CONFIGURATION: THE LOST TAPES ---
// Converted your Drive Links to Direct Stream Format
const ALBUMS = [
  { 
    id: 1, 
    title: "Kanye Beat Freestyle - Whip Montez", 
    year: "2004", 
    src: "https://drive.google.com/uc?export=download&id=1akSj-M3Lb55E1u_w3p4pNwtc3new_ICh" 
  },
  { 
    id: 2, 
    title: "50 Cent Beat Feat. Ali Vegas", 
    year: "2003", 
    src: "https://drive.google.com/uc?export=download&id=1e5E3cKU6lI1ATjZEywxr8mYzRLvzNOZm" 
  },
  { 
    id: 3, 
    title: "Sprung (Remix) Feat. Whip Montez", 
    year: "2005", 
    src: "https://drive.google.com/uc?export=download&id=1_BQCZtE1jO6Jg9DoV8--R0nDIwgk7WXb" 
  },
  { 
    id: 4, 
    title: "Push It (Remix) Feat. Whip Montez", 
    year: "2004", 
    src: "https://drive.google.com/uc?export=download&id=1dnj2DpFySWtZvnRM70srOD2iFXztMKGz" 
  },
  { 
    id: 5, 
    title: "Jim Jones Beat Freestyle", 
    year: "2006", 
    src: "https://drive.google.com/uc?export=download&id=11a2aaSNoYX_CRLDJnk2Q6L_scW2GQRTE" 
  },
];

const DesktopIcon = ({ icon: Icon, label, onDoubleClick }) => (
  <div 
    className="flex flex-col items-center w-24 p-2 cursor-pointer hover:bg-blue-800/20 border border-transparent hover:border-blue-200/30 rounded"
    onDoubleClick={onDoubleClick}
  >
    <Icon size={32} className="text-white drop-shadow-md mb-1" />
    <span className="text-white text-xs text-center drop-shadow-md bg-transparent px-1">
      {label}
    </span>
  </div>
);

const Window = ({ id, title, children, onClose, isActive, onFocus }) => {
  if (!isActive) return null;

  return (
    <div 
      className={`absolute top-10 left-10 w-96 ${SYSTEM_THEME.windowBg} border-2 border-t-white border-l-white border-b-black border-r-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] flex flex-col`}
      onMouseDown={onFocus}
      style={{ zIndex: isActive ? 50 : 10 }}
    >
      <div className={`${SYSTEM_THEME.headerBlue} p-1 flex justify-between items-center cursor-move`}>
        <div className="flex items-center gap-2">
          <span className="text-white text-xs font-bold tracking-wide pl-1">{title}</span>
        </div>
        <div className="flex gap-1">
          <button onClick={() => onClose(id)} className="w-5 h-5 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black flex items-center justify-center active:border-t-black active:border-l-black active:border-b-white active:border-r-white text-black font-bold">
            <X size={12} strokeWidth={4} />
          </button>
        </div>
      </div>
      <div className="p-1">
        <div className="bg-white border-2 border-t-black border-l-black border-b-white border-r-white p-4 h-64 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- WHIP_AMP Player Component ---
const WhipAmp = ({ onClose }) => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(new Audio(ALBUMS[0].src));

  // Handle Playback Logic
  useEffect(() => {
    const audio = audioRef.current;
    
    // Allow cross-origin for Drive files (helps with some browser policies)
    audio.crossOrigin = "anonymous";

    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => handleNext(); // Auto-play next

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', handleEnded);
      audio.pause(); // Cleanup on unmount
    };
  }, []);

  // Handle Track Changes
  useEffect(() => {
    if (isPlaying) {
      audioRef.current.src = ALBUMS[currentTrackIndex].src;
      audioRef.current.play().catch(e => console.log("Playback error (Check Drive Permissions):", e));
    } else {
      audioRef.current.src = ALBUMS[currentTrackIndex].src;
    }
  }, [currentTrackIndex]);

  const handlePlay = () => {
    audioRef.current.play().catch(e => console.log("Playback error (Check Drive Permissions):", e));
    setIsPlaying(true);
  };

  const handlePause = () => {
    audioRef.current.pause();
    setIsPlaying(false);
  };

  const handleNext = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % ALBUMS.length);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + ALBUMS.length) % ALBUMS.length);
    setIsPlaying(true);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute top-20 right-20 w-72 bg-[#29293d] border-2 border-gray-600 shadow-xl flex flex-col p-1 z-50">
      {/* Header */}
      <div className="bg-[#1a1a2e] px-2 py-1 flex justify-between items-center mb-1 border-b border-gray-600 cursor-move">
        <span className="text-[#00ff00] font-mono text-xs">WHIP_AMP v2.0</span>
        <button onClick={onClose} className="text-[#00ff00] hover:text-white"><X size={10} /></button>
      </div>
      
      {/* Visualization & Time */}
      <div className="bg-black h-16 mb-2 border-2 border-gray-700 relative overflow-hidden">
        <div className="absolute inset-0 flex items-end gap-1 px-1">
          {/* Animated Bars */}
          {[...Array(20)].map((_, i) => (
            <div 
              key={i} 
              className={`w-2 bg-gradient-to-t from-green-500 via-yellow-500 to-red-500 transition-all duration-75`}
              style={{ 
                height: isPlaying ? `${Math.random() * 100}%` : '5%', 
                opacity: 0.8 
              }}
            />
          ))}
        </div>
        <div className="absolute top-1 left-1 text-[#00ff00] font-mono text-xs bg-black/50 px-1">
          {formatTime(currentTime)} <span className={isPlaying ? "animate-pulse text-red-500" : "text-gray-500"}>
            {isPlaying ? "PLAYING" : "PAUSED"}
          </span>
        </div>
        <div className="absolute bottom-1 right-1 text-[#00ff00] font-mono text-[10px] text-right bg-black/50 px-1">
          {ALBUMS[currentTrackIndex].title}
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2 justify-center mb-2 bg-[#1a1a2e] p-1 border border-gray-600">
        <button onClick={handlePrev} className="text-gray-300 hover:text-white text-xs font-bold px-1">[PREV]</button>
        <button onClick={handlePlay} className="text-[#00ff00] hover:text-white text-xs font-bold px-1">[PLAY]</button>
        <button onClick={handlePause} className="text-yellow-400 hover:text-white text-xs font-bold px-1">[PAUSE]</button>
        <button onClick={handleNext} className="text-gray-300 hover:text-white text-xs font-bold px-1">[NEXT]</button>
      </div>

      {/* Playlist */}
      <div className="bg-black border border-gray-700 p-1 h-24 overflow-y-auto font-mono text-[10px]">
        <ul className="text-[#00ff00] leading-tight">
          {ALBUMS.map((album, i) => (
            <li 
              key={album.id} 
              onClick={() => { setCurrentTrackIndex(i); setIsPlaying(true); }}
              className={`cursor-pointer px-1 truncate ${currentTrackIndex === i ? 'bg-[#00ff00] text-black animate-pulse' : 'hover:bg-[#00ff00]/20'}`}
            >
              {i + 1}. {album.title}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default function WhipOS() {
  const [windows, setWindows] = useState({
    bio: false,
    music: true,
    gallery: false
  });

  const toggleWindow = (key) => setWindows(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className={`w-full h-screen ${SYSTEM_THEME.bg} overflow-hidden relative font-sans select-none`}>
      
      {/* Desktop Icons */}
      <div className="p-4 grid grid-cols-1 gap-4 w-fit">
        <DesktopIcon icon={Folder} label="My Documents" onDoubleClick={() => toggleWindow('bio')} />
        <DesktopIcon icon={Disc} label="WhipAmp Player" onDoubleClick={() => toggleWindow('music')} />
        <DesktopIcon icon={ImageIcon} label="Gallery" onDoubleClick={() => toggleWindow('gallery')} />
        <DesktopIcon icon={Terminal} label="CMD.EXE" onDoubleClick={() => {}} />
      </div>

      {/* Windows */}
      <Window id="bio" title="My Documents - Readme.txt" isActive={windows.bio} onClose={() => toggleWindow('bio')}>
        <h2 className="font-bold text-lg mb-2">WHIP MONTEZ BIO</h2>
        <p className="text-sm mb-4">Established 2002. Re-released 2025. Defining the sound of the lost era.</p>
        <p className="font-mono text-xs text-gray-500">Last modified: 11/30/2025</p>
      </Window>

      {windows.music && <WhipAmp onClose={() => toggleWindow('music')} />}

      {/* Taskbar */}
      <div className="absolute bottom-0 left-0 right-0 h-10 bg-[#c0c0c0] border-t-2 border-white flex items-center px-1 gap-2 shadow-lg z-50">
        <button className="flex items-center gap-1 px-2 py-1 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black active:border-t-black active:border-l-black active:border-b-white active:border-r-white font-bold text-sm hover:bg-gray-200">
          <div className="w-4 h-4 bg-gradient-to-br from-red-500 to-blue-500" />
          Start
        </button>
        <div className="h-6 w-[2px] bg-gray-400 border-r border-white mx-1"></div>
        
        {Object.entries(windows).map(([key, isOpen]) => isOpen && (
          <div key={key} className="w-32 bg-[#d4d4d4] border-2 border-t-black border-l-black border-b-white border-r-white px-2 py-1 text-xs truncate font-bold shadow-inner cursor-pointer active:border-t-white active:border-b-black">
            {key.toUpperCase()}
          </div>
        ))}

        <div className="ml-auto bg-[#d4d4d4] border-2 border-t-black border-l-black border-b-white border-r-white px-3 py-1 text-xs font-mono">
          10:24 PM
        </div>
      </div>
    </div>
  );
}