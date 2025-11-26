"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export type VoiceState = "idle" | "listening" | "processing" | "speaking" | "error";

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  action?: string;
  actionResult?: any;
}

export interface UseVoiceAssistantOptions {
  userId: Id<"users"> | null;
  onTranscription?: (text: string) => void;
  onResponse?: (response: string) => void;
  onNavigate?: (route: string) => void; // Callback when navigation happens
  onError?: (error: string) => void;
  autoSpeak?: boolean;
  language?: string;
}

export function useVoiceAssistant(options: UseVoiceAssistantOptions) {
  const {
    userId,
    onTranscription,
    onResponse,
    onNavigate,
    onError,
    autoSpeak = true,
    language = "fil-PH", // Filipino/Tagalog default
  } = options;

  // Router for navigation
  const router = useRouter();

  const [state, setState] = useState<VoiceState>("idle");
  const [isSupported, setIsSupported] = useState(true);
  const [transcription, setTranscription] = useState("");
  const [response, setResponse] = useState("");
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Convex action for handling voice commands
  const handleVoiceCommand = useAction(api.voiceAssistant.handleVoiceCommand);

  // Check for browser support
  useEffect(() => {
    const checkSupport = () => {
      const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      const hasSpeechSynthesis = "speechSynthesis" in window;
      setIsSupported(hasMediaDevices && hasSpeechSynthesis);
    };
    checkSupport();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Start recording audio
  const startRecording = useCallback(async () => {
    if (!userId) {
      setError("User not authenticated");
      onError?.("User not authenticated");
      return;
    }

    try {
      setState("listening");
      setError(null);
      audioChunksRef.current = [];

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });
      streamRef.current = stream;

      // Set up audio analyzer for volume visualization
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      // Start volume monitoring
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVolume = () => {
        if (analyserRef.current && state === "listening") {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setVolume(average / 255);
          animationFrameRef.current = requestAnimationFrame(updateVolume);
        }
      };
      updateVolume();

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Process the recorded audio
        await processAudio();
      };

      mediaRecorder.start(100); // Collect data every 100ms
    } catch (err) {
      console.error("Error starting recording:", err);
      setState("error");
      const errorMsg = err instanceof Error ? err.message : "Microphone access denied";
      setError(errorMsg);
      onError?.(errorMsg);
    }
  }, [userId, state, onError]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    setVolume(0);
  }, []);

  // Process recorded audio
  const processAudio = useCallback(async () => {
    if (!userId || audioChunksRef.current.length === 0) {
      setState("idle");
      return;
    }

    setState("processing");

    try {
      // Combine audio chunks into a single blob
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });

      // Convert to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(",")[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(audioBlob);
      const audioBase64 = await base64Promise;

      // Build conversation history for context
      const conversationHistory = conversation.slice(-6).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Send to Convex for processing
      const result = await handleVoiceCommand({
        userId,
        audioBase64,
        mimeType: "audio/webm",
        conversationHistory,
      });

      if (result.success) {
        // Update transcription
        setTranscription(result.transcription || "");
        onTranscription?.(result.transcription || "");

        // Update response
        setResponse(result.response || "");
        onResponse?.(result.response || "");

        // Add to conversation
        const userMessage: ConversationMessage = {
          role: "user",
          content: result.transcription || "",
          timestamp: Date.now(),
        };

        const assistantMessage: ConversationMessage = {
          role: "assistant",
          content: result.response || "",
          timestamp: Date.now(),
          action: result.action || undefined,
          actionResult: result.actionResult,
        };

        setConversation((prev) => [...prev, userMessage, assistantMessage]);

        // Handle navigation action
        if (result.action === "navigate" && result.actionResult?.route) {
          const route = result.actionResult.route as string;
          console.log("Voice navigation to:", route);
          
          // Notify via callback
          onNavigate?.(route);
          
          // Navigate after a short delay (let the speech start first)
          setTimeout(() => {
            router.push(route);
          }, 500);
        }

        // Speak the response
        if (autoSpeak && result.response) {
          speak(result.response);
        } else {
          setState("idle");
        }
      } else {
        throw new Error(result.error || "Processing failed");
      }
    } catch (err) {
      console.error("Error processing audio:", err);
      setState("error");
      const errorMsg = err instanceof Error ? err.message : "Processing failed";
      setError(errorMsg);
      onError?.(errorMsg);

      // Auto-recover after error
      setTimeout(() => {
        setState("idle");
        setError(null);
      }, 3000);
    }
  }, [userId, conversation, handleVoiceCommand, autoSpeak, onTranscription, onResponse, onNavigate, onError, router]);

  // Text-to-Speech with improved natural voice
  const speak = useCallback(
    (text: string) => {
      if (!("speechSynthesis" in window)) {
        setState("idle");
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      setState("speaking");

      const utterance = new SpeechSynthesisUtterance(text);
      speechSynthRef.current = utterance;

      // Get available voices
      const voices = window.speechSynthesis.getVoices();
      
      // Priority order for natural-sounding voices
      const preferredVoices = [
        // Google voices (most natural)
        "Google US English",
        "Google UK English Female",
        "Google UK English Male",
        // Microsoft voices (natural)
        "Microsoft Zira",
        "Microsoft David",
        "Microsoft Mark",
        "Samantha", // macOS
        "Karen", // macOS Australian
        "Daniel", // macOS British
        // Filipino voices
        "Google Filipino",
        "Microsoft Filipino",
      ];

      // Find best available voice
      let selectedVoice = null;
      for (const preferred of preferredVoices) {
        const found = voices.find((v) => 
          v.name.includes(preferred) || v.name === preferred
        );
        if (found) {
          selectedVoice = found;
          break;
        }
      }

      // Fallback: find any high-quality English voice
      if (!selectedVoice) {
        selectedVoice = voices.find((v) => 
          v.lang.startsWith("en") && 
          (v.name.includes("Google") || v.name.includes("Microsoft") || v.localService === false)
        ) || voices.find((v) => v.lang.startsWith("en"));
      }

      // Check for Tagalog content
      const hasTagalog = /\b(po|na|ang|ng|sa|ko|mo|ka|ako|ikaw|siya|kami|tayo|sila|ito|iyan|iyon|hindi|oo|salamat|magandang|umaga|hapon|gabi|araw|buwan|taon|naka|tigil|gawa|trabaho)\b/i.test(text);

      if (hasTagalog) {
        // Try Filipino voice for Tagalog content
        const filipinoVoice = voices.find((v) =>
          v.lang.includes("fil") || v.lang.includes("tl") ||
          v.name.toLowerCase().includes("filipino") ||
          v.name.toLowerCase().includes("tagalog")
        );
        if (filipinoVoice) {
          selectedVoice = filipinoVoice;
          utterance.lang = "fil-PH";
        }
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      // Natural speech settings
      utterance.rate = 0.95; // Slightly slower for naturalness
      utterance.pitch = 1.05; // Slightly higher for friendliness
      utterance.volume = 1;

      utterance.onend = () => {
        setState("idle");
      };

      utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event);
        setState("idle");
      };

      window.speechSynthesis.speak(utterance);
    },
    []
  );

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setState("idle");
  }, []);

  // Clear conversation history
  const clearConversation = useCallback(() => {
    setConversation([]);
    setTranscription("");
    setResponse("");
  }, []);

  // Toggle recording (for push-to-talk)
  const toggleRecording = useCallback(() => {
    if (state === "listening") {
      stopRecording();
    } else if (state === "idle") {
      startRecording();
    } else if (state === "speaking") {
      stopSpeaking();
    }
  }, [state, startRecording, stopRecording, stopSpeaking]);

  return {
    // State
    state,
    isSupported,
    transcription,
    response,
    conversation,
    error,
    volume,

    // Actions
    startRecording,
    stopRecording,
    toggleRecording,
    speak,
    stopSpeaking,
    clearConversation,

    // Computed
    isListening: state === "listening",
    isProcessing: state === "processing",
    isSpeaking: state === "speaking",
    isIdle: state === "idle",
    hasError: state === "error",
  };
}
