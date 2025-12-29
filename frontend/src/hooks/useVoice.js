import { useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

/**
 * Global Voice Hook - Provides Voice-to-Text (VTT) and Text-to-Voice (TTV) functionality
 * 
 * Usage:
 *   const { isListening, isSpeaking, startListening, stopListening, speak, stopSpeaking } = useVoice();
 */
export function useVoice(options = {}) {
  const {
    language = 'en-US',
    voiceGender = 'female',
    voiceRegion = 'US',
    onResult = null,
    onError = null,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef(null);

  // Check browser support
  const isVoiceSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  const isSpeechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Voice-to-Text: Start listening
  const startListening = useCallback((callback) => {
    if (!isVoiceSupported) {
      toast.error('Voice input not supported. Try Chrome or Safari.');
      onError?.('Voice input not supported');
      return;
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = true; // Show partial results for better UX
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      // Visual feedback
      toast.success('🎤 Listening...', { duration: 1500, id: 'voice-listening' });
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      recognitionRef.current = null;
      
      if (event.error === 'not-allowed') {
        toast.error('Microphone access denied. Please allow microphone access.');
      } else if (event.error === 'no-speech') {
        toast.error('No speech detected. Please try again.');
      } else {
        toast.error(`Voice error: ${event.error}`);
      }
      onError?.(event.error);
    };

    recognition.onresult = (event) => {
      const results = event.results;
      const lastResult = results[results.length - 1];
      
      if (lastResult.isFinal) {
        const transcript = lastResult[0].transcript;
        console.log('Voice transcript:', transcript);
        
        // Call the callback or the onResult option
        if (callback && typeof callback === 'function') {
          callback(transcript);
        } else if (onResult) {
          onResult(transcript);
        }
        
        toast.success('✓ Got it!', { duration: 1000, id: 'voice-listening' });
      }
    };

    recognitionRef.current = recognition;
    
    try {
      recognition.start();
    } catch (err) {
      console.error('Failed to start recognition:', err);
      toast.error('Failed to start voice input');
      setIsListening(false);
    }
  }, [isVoiceSupported, language, onResult, onError]);

  // Voice-to-Text: Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  // Toggle listening
  const toggleListening = useCallback((callback) => {
    if (isListening) {
      stopListening();
    } else {
      startListening(callback);
    }
  }, [isListening, startListening, stopListening]);

  // Text-to-Voice: Speak text
  const speak = useCallback((text, speakOptions = {}) => {
    if (!isSpeechSupported) {
      console.warn('Speech synthesis not supported');
      return;
    }

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return;
    }

    // Cancel any current speech
    window.speechSynthesis.cancel();

    const performSpeak = (voices) => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Determine language code
      const langCode = speakOptions.language || language.split('-')[0] || 'en';
      
      // Filter voices by language
      const filteredVoices = voices.filter(v => v.lang.startsWith(langCode));
      
      // Try to find a matching voice
      let selectedVoice = null;
      const region = speakOptions.region || voiceRegion;
      const gender = speakOptions.gender || voiceGender;
      
      // Try region first
      if (region === 'UK' || region === 'GB') {
        selectedVoice = filteredVoices.find(v => 
          v.name.includes('UK') || v.name.includes('British') || v.lang.includes('GB')
        );
      } else if (region === 'AU') {
        selectedVoice = filteredVoices.find(v => 
          v.name.includes('Australia') || v.lang.includes('AU')
        );
      } else if (region === 'IN') {
        selectedVoice = filteredVoices.find(v => 
          v.name.includes('India') || v.lang.includes('IN')
        );
      }
      
      // Try gender if no region match
      if (!selectedVoice) {
        const genderPatterns = gender === 'female' 
          ? ['female', 'samantha', 'victoria', 'karen', 'moira', 'fiona']
          : ['male', 'alex', 'daniel', 'fred', 'tom'];
        
        selectedVoice = filteredVoices.find(v => 
          genderPatterns.some(p => v.name.toLowerCase().includes(p))
        );
      }
      
      // Fallback to first available voice for language
      if (!selectedVoice && filteredVoices.length > 0) {
        selectedVoice = filteredVoices[0];
      }
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      utterance.lang = langCode;
      utterance.rate = speakOptions.rate || 0.95;
      utterance.pitch = speakOptions.pitch || (gender === 'female' ? 1.05 : 0.95);
      utterance.volume = speakOptions.volume || 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (e) => {
        console.error('Speech synthesis error:', e);
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    };

    // Get voices - may need to wait for them to load
    let voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      performSpeak(voices);
    } else {
      // Voices not loaded yet, wait for them
      const handleVoicesChanged = () => {
        voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          performSpeak(voices);
          window.speechSynthesis.onvoiceschanged = null;
        }
      };
      window.speechSynthesis.onvoiceschanged = handleVoicesChanged;
      
      // Fallback timeout
      setTimeout(() => {
        if (!isSpeaking) {
          voices = window.speechSynthesis.getVoices();
          if (voices.length > 0) {
            performSpeak(voices);
          }
        }
      }, 100);
    }
  }, [isSpeechSupported, language, voiceGender, voiceRegion]);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (isSpeechSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSpeechSupported]);

  // Toggle speaking
  const toggleSpeaking = useCallback((text) => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speak(text);
    }
  }, [isSpeaking, speak, stopSpeaking]);

  return {
    // State
    isListening,
    isSpeaking,
    isVoiceSupported,
    isSpeechSupported,
    
    // Voice-to-Text
    startListening,
    stopListening,
    toggleListening,
    
    // Text-to-Voice
    speak,
    stopSpeaking,
    toggleSpeaking,
  };
}

export default useVoice;
