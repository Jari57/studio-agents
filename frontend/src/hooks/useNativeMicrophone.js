/**
 * Native microphone recording hook.
 * Uses Web Audio API (works on both web and iOS/Android native via Capacitor WKWebView).
 * Provides voice recording for AI vocal/lyrics features — satisfies Apple's
 * "meaningful native functionality" requirement.
 */

import { useState, useRef, useCallback } from 'react';

export function useNativeMicrophone({ maxDuration = 60000 } = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  const startRecording = useCallback(async () => {
    setError(null);
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/mp4'; // iOS Safari/WKWebView uses mp4

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start(250); // Collect in 250ms chunks
      startTimeRef.current = Date.now();
      setIsRecording(true);

      // Auto-stop at maxDuration
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        setDuration(Math.floor(elapsed / 1000));
        if (elapsed >= maxDuration) {
          stopRecording();
        }
      }, 500);
    } catch (err) {
      const msg =
        err.name === 'NotAllowedError'
          ? 'Microphone permission denied. Please allow access in Settings.'
          : err.name === 'NotFoundError'
            ? 'No microphone found on this device.'
            : `Microphone error: ${err.message}`;
      setError(msg);
    }
  }, [maxDuration]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
    if (startTimeRef.current) {
      setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }
  }, []);

  const clearRecording = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setError(null);
  }, [audioUrl]);

  return {
    isRecording,
    audioBlob,
    audioUrl,
    duration,
    error,
    startRecording,
    stopRecording,
    clearRecording,
  };
}
