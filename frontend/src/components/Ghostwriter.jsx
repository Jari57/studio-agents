import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

export default function Ghostwriter({ callGemini }) {
  const [prompt, setPrompt] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setLyrics("");

    const systemPrompt = "You are Whip Montez, a gritty, lyrical female rapper from Red Hook Brooklyn, circa 2004. Write an 8-bar verse about the user's topic. Use Spanglish, NY slang from the early 2000s (e.g., 'son', 'dun', 'mad', 'deadass'), and keep it confident and raw. Do not use hashtags. Format it as a verse.";

    try {
      const result = await callGemini(prompt, systemPrompt);
      setLyrics(typeof result === 'string' ? result : JSON.stringify(result));
    } catch (e) {
      console.error('Ghostwriter generation failed', e);
      setLyrics('ERROR: Could not generate lyrics.');
    }

    setLoading(false);
  };

  return (
    <div className="h-full w-full relative overflow-hidden p-3 md:p-6 flex flex-col items-center justify-center">
      <div className="absolute inset-0 bg-black/80 z-10"></div>
      <div className="relative z-20 w-full max-w-3xl border border-cyan-600 bg-[#050505]/90 p-1 shadow-[0_0_30px_rgba(0,180,255,0.4)]">
        <div className="bg-cyan-600 text-black px-2 py-1 font-bold flex justify-between items-center mb-2 text-xs md:text-sm">
          <span>LYRIC_RECOVERY_TOOL.EXE</span>
          <div className="flex gap-1"><div className="w-3 h-3 bg-black"></div></div>
        </div>
        <div className="p-3 md:p-4 flex flex-col gap-3 md:gap-4">
          <div className="text-cyan-400 font-mono text-xs md:text-sm mb-2">{'>'} SYSTEM ALERT: CORRUPTED LYRIC FILES DETECTED.<br/>{'>'} ENTER KEYWORDS TO ATTEMPT DATA RECOVERY...</div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="ENTER TOPIC (e.g., 'Summertime in Brooklyn', 'Haters', 'Money')"
              className="flex-1 bg-black border border-cyan-800 text-white p-2 md:p-2 font-mono text-xs md:text-sm outline-none focus:border-cyan-400"
              onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
            />
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-cyan-600 text-black px-4 py-2 font-bold font-mono hover:bg-cyan-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-xs md:text-sm whitespace-nowrap"
            >
              {loading ? 'RECOVERING...' : <span className="flex items-center gap-2">INITIATE <Sparkles className="inline w-4 h-4"/></span>}
            </button>
          </div>
          <div className="min-h-[200px] border border-cyan-800 bg-[#000000] p-3 md:p-4 font-mono text-xs md:text-sm leading-relaxed overflow-y-auto max-h-[400px]">
            {loading && <div className="text-cyan-400 animate-pulse">{'>'} SCANNING SECTORS...<br/>{'>'} DECRYPTING FLOW...<br/>{'>'} ASSEMBLING BARS...</div>}
            {!loading && lyrics && <div className="text-white whitespace-pre-line">{lyrics}</div>}
            {!loading && !lyrics && <div className="text-gray-600 italic">// WAITING FOR INPUT //</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
