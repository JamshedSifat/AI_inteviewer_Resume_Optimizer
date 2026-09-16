import { useState, useEffect, useRef, useCallback } from "react";

/**
 * useSpeechToText
 * -----------------
 * A resilient wrapper around the Web Speech API's SpeechRecognition with:
 *  - Auto-reconnect: browsers silently end recognition after a period of
 *    silence ("no-speech" / natural onend while the user still intends to
 *    talk). We detect this and automatically restart, unless the caller
 *    explicitly stopped it.
 *  - Explicit permission state ("prompt" | "granted" | "denied" | "unsupported")
 *    so the UI can show a clear fallback (e.g. text input) instead of a
 *    silently broken mic button.
 *  - Live interim transcript for real-time on-screen captions.
 *  - An approximate 0..1 audio level (via the Web Audio API analyser),
 *    useful for driving the 3D avatar's "listening" ripple intensity.
 *  - useRef-based locks so nothing double-fires under React 18 StrictMode's
 *    intentional double-invoke of effects in development.
 */
export function useSpeechToText() {
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState(null);
  const [permissionState, setPermissionState] = useState("prompt"); // prompt | granted | denied | unsupported
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef(null);
  const shouldBeListeningRef = useRef(false); // the user's *intent*, survives auto-restarts
  const finalTranscriptRef = useRef("");
  const restartTimeoutRef = useRef(null);
  const restartAttemptsRef = useRef(0);

  // --- Web Audio (mic level) plumbing ---
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const rafRef = useRef(null);

  const MAX_QUICK_RESTARTS = 5;

  const stopAudioLevelMonitor = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
  }, []);

  const startAudioLevelMonitor = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContextCtor();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.6;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((sum, v) => sum + v, 0) / dataArray.length;
        setAudioLevel(Math.min(1, average / 128));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();

      setPermissionState("granted");
    } catch (err) {
      console.warn("Microphone access for level metering was denied or failed:", err);
      // Don't hard-fail speech recognition just because level metering
      // couldn't start; recognition may still work via its own permission grant.
    }
  }, []);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setPermissionState("unsupported");
      setError("Speech recognition is not supported in this browser. Please type your answer instead.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let finalChunk = "";
      let interimChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalChunk += chunk;
        } else {
          interimChunk += chunk;
        }
      }
      if (finalChunk) {
        finalTranscriptRef.current = `${finalTranscriptRef.current} ${finalChunk}`.trim();
        setTranscript(finalTranscriptRef.current);
      }
      setInterimTranscript(interimChunk);
      restartAttemptsRef.current = 0; // got real audio; reset the backoff counter
    };

    recognition.onerror = (err) => {
      console.error("Speech Recognition Error:", err.error);
      if (err.error === "not-allowed" || err.error === "service-not-allowed") {
        setPermissionState("denied");
        setError("Microphone access was denied. Please allow microphone permission or type your answer.");
        shouldBeListeningRef.current = false;
        setIsListening(false);
        return;
      }
      // "no-speech" / "network" / "aborted" are transient — let onend's
      // auto-reconnect logic decide whether to retry.
      setError(err.error === "no-speech" ? null : err.error);
    };

    // Browsers end recognition after a pause in speech even when
    // `continuous = true`. If the user still intends to be listening,
    // transparently restart instead of leaving them stuck with a dead mic.
    recognition.onend = () => {
      setIsListening(false);
      if (!shouldBeListeningRef.current) return;

      if (restartAttemptsRef.current >= MAX_QUICK_RESTARTS) {
        setError("Speech recognition kept disconnecting. Please try again or type your answer.");
        shouldBeListeningRef.current = false;
        return;
      }

      restartAttemptsRef.current += 1;
      restartTimeoutRef.current = setTimeout(() => {
        try {
          recognition.start();
          setIsListening(true);
        } catch (err) {
          // Ignore "already started" races; any other case surfaces to the user.
          if (err?.name !== "InvalidStateError") {
            console.error("Auto-reconnect failed:", err);
            setError("Could not restart the microphone automatically.");
          }
        }
      }, 300);
    };

    recognitionRef.current = recognition;

    return () => {
      shouldBeListeningRef.current = false;
      clearTimeout(restartTimeoutRef.current);
      try {
        recognition.stop();
      } catch {
        /* no-op: recognition may not have started yet */
      }
      stopAudioLevelMonitor();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || shouldBeListeningRef.current) return;
    setError(null);
    finalTranscriptRef.current = "";
    setTranscript("");
    setInterimTranscript("");
    restartAttemptsRef.current = 0;
    shouldBeListeningRef.current = true;

    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      if (err?.name !== "InvalidStateError") {
        console.error("Failed to start speech recognition:", err);
        setError("Could not access the microphone. You can type your answer instead.");
        shouldBeListeningRef.current = false;
        return;
      }
    }

    // Fire-and-forget: mic level metering is a nice-to-have for the avatar,
    // not a requirement for recognition itself.
    startAudioLevelMonitor();
  }, [startAudioLevelMonitor]);

  const stopListening = useCallback(() => {
    shouldBeListeningRef.current = false;
    clearTimeout(restartTimeoutRef.current);
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* no-op */
      }
    }
    setIsListening(false);
    stopAudioLevelMonitor();
  }, [isListening, stopAudioLevelMonitor]);

  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = "";
    setTranscript("");
    setInterimTranscript("");
  }, []);

  return {
    transcript,
    interimTranscript,
    fullTranscript: `${transcript} ${interimTranscript}`.trim(),
    isListening,
    audioLevel,
    isSupported,
    permissionState,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}
