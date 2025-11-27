"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { 
  Camera, 
  X, 
  Hand, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  User,
  PartyPopper,
  RefreshCw,
  Aperture
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import type { Id } from "../../../convex/_generated/dataModel";

interface SmartVisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: Id<"events">;
  joinCode: string;
}

type ModalStep = "camera" | "captured" | "success";

export function SmartVisionModal({ isOpen, onClose, eventId, joinCode }: SmartVisionModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const handsRef = useRef<any>(null);
  const animationRef = useRef<number | null>(null);
  
  const [step, setStep] = useState<ModalStep>("camera");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [palmDetected, setPalmDetected] = useState(false);
  const [palmProgress, setPalmProgress] = useState(0);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [checkInResult, setCheckInResult] = useState<any>(null);
  const [countdown, setCountdown] = useState(5);
  const [isLoadingHands, setIsLoadingHands] = useState(false);
  const [handDetectionEnabled, setHandDetectionEnabled] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const hasSubmittedRef = useRef(false);
  const palmHoldStartRef = useRef<number | null>(null);
  const hasCapturedRef = useRef(false);
  
  const guestCheckIn = useMutation(api.events.guestCheckIn);
  
  // Check if all fingers are extended (open palm) - simplified for speed
  const isOpenPalm = useCallback((landmarks: any[]) => {
    if (!landmarks || landmarks.length < 21) return false;
    
    // Simplified check: just verify fingers are spread up
    const fingerTips = [8, 12, 16, 20]; // Index, Middle, Ring, Pinky tips
    const fingerMids = [6, 10, 14, 18]; // PIP joints
    
    let extendedCount = 0;
    for (let i = 0; i < 4; i++) {
      if (landmarks[fingerTips[i]].y < landmarks[fingerMids[i]].y) {
        extendedCount++;
      }
    }
    
    // At least 3 fingers extended = palm open
    return extendedCount >= 3;
  }, []);
  
  // Manual capture function - works without MediaPipe
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || hasCapturedRef.current) return;
    
    hasCapturedRef.current = true;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    
    if (!ctx) return;
    
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0);
    
    const imageData = canvas.toDataURL("image/jpeg", 0.8);
    setCapturedImage(imageData);
    
    // Stop camera and hand detection
    stopCamera();
    
    setStep("captured");
    toast.success("Photo captured!");
  }, []);
  
  // Initialize MediaPipe Hands (optional - runs in background)
  const initHands = useCallback(async () => {
    if (!isOpen || step !== "camera" || !cameraReady) return;
    
    setIsLoadingHands(true);
    
    try {
      // Suppress console warnings from MediaPipe
      const originalWarn = console.warn;
      console.warn = (...args) => {
        if (!args[0]?.includes?.('offline') && !args[0]?.includes?.('debug')) {
          originalWarn.apply(console, args);
        }
      };
      
      const { Hands } = await import("@mediapipe/hands");
      
      const hands = new Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`;
        },
      });
      
      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 0, // Use simplest model for speed
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.3,
      });
      
      hands.onResults((results: any) => {
        if (hasCapturedRef.current) return;
        
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          const landmarks = results.multiHandLandmarks[0];
          const palmOpen = isOpenPalm(landmarks);
          
          if (palmOpen) {
            setPalmDetected(true);
            
            if (!palmHoldStartRef.current) {
              palmHoldStartRef.current = Date.now();
            }
            
            const holdDuration = Date.now() - palmHoldStartRef.current;
            // Faster: only 0.5 seconds hold time
            const progress = Math.min((holdDuration / 500) * 100, 100);
            setPalmProgress(progress);
            
            if (holdDuration >= 500 && !hasCapturedRef.current) {
              capturePhoto();
            }
          } else {
            setPalmDetected(false);
            palmHoldStartRef.current = null;
            setPalmProgress(0);
          }
        } else {
          setPalmDetected(false);
          palmHoldStartRef.current = null;
          setPalmProgress(0);
        }
      });
      
      handsRef.current = hands;
      setHandDetectionEnabled(true);
      setIsLoadingHands(false);
      
      // Restore console
      console.warn = originalWarn;
      
      // Start detection loop
      detectLoop();
    } catch (error) {
      console.error("MediaPipe Hands init error:", error);
      setIsLoadingHands(false);
      // Don't show error - manual capture still works
    }
  }, [isOpen, step, cameraReady, isOpenPalm, capturePhoto]);
  
  // Detection loop - runs at lower frequency for performance
  const detectLoop = useCallback(async () => {
    if (!videoRef.current || !handsRef.current || hasCapturedRef.current) return;
    
    if (videoRef.current.readyState >= 2) {
      try {
        await handsRef.current.send({ image: videoRef.current });
      } catch (e) {
        // Ignore detection errors
      }
    }
    
    // Run at ~15fps instead of max rate
    animationRef.current = setTimeout(() => {
      requestAnimationFrame(detectLoop);
    }, 66) as unknown as number;
  }, []);
  
  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      hasCapturedRef.current = false;
      palmHoldStartRef.current = null;
      setPalmProgress(0);
      setCameraReady(false);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        }
      });
      
      streamRef.current = mediaStream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadeddata = () => {
          setCameraReady(true);
        };
      }
    } catch (error) {
      console.error("Camera error:", error);
      setCameraError("Unable to access camera. Please allow camera permissions.");
    }
  }, []);
  
  // Stop camera and cleanup
  const stopCamera = useCallback(() => {
    if (animationRef.current) {
      clearTimeout(animationRef.current as unknown as number);
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    if (handsRef.current) {
      try {
        handsRef.current.close();
      } catch (e) {}
      handsRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setHandDetectionEnabled(false);
  }, []);
  
  // Start camera when modal opens
  useEffect(() => {
    if (isOpen && step === "camera") {
      startCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [isOpen, step, startCamera, stopCamera]);
  
  // Initialize hand detection after camera is ready (with delay for smoother UX)
  useEffect(() => {
    if (cameraReady && step === "camera" && !handDetectionEnabled && !isLoadingHands) {
      // Small delay to let camera stabilize
      const timer = setTimeout(() => {
        initHands();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [cameraReady, step, handDetectionEnabled, isLoadingHands, initHands]);
  
  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setStep("camera");
      setCapturedImage(null);
      setPalmDetected(false);
      setPalmProgress(0);
      setFirstName("");
      setLastName("");
      setCheckInResult(null);
      setCameraReady(false);
      setHandDetectionEnabled(false);
      hasSubmittedRef.current = false;
      hasCapturedRef.current = false;
      palmHoldStartRef.current = null;
    }
  }, [isOpen, stopCamera]);
  
  const retakePhoto = () => {
    setCapturedImage(null);
    setPalmDetected(false);
    setPalmProgress(0);
    hasCapturedRef.current = false;
    palmHoldStartRef.current = null;
    setHandDetectionEnabled(false);
    setStep("camera");
    startCamera();
  };
  
  const handleSubmit = async () => {
    if (hasSubmittedRef.current || isSubmitting) return;
    
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    
    if (!capturedImage) {
      toast.error("Please capture a photo first");
      return;
    }
    
    hasSubmittedRef.current = true;
    setIsSubmitting(true);
    
    try {
      const result = await guestCheckIn({
        joinCode,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        joinMethod: "camera",
        photoUrl: capturedImage,
      });
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      setCheckInResult(result);
      setStep("success");
      setCountdown(5);
    } catch (error: any) {
      toast.error(error.message || "Failed to join");
      hasSubmittedRef.current = false;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Countdown for success screen
  useEffect(() => {
    if (step === "success") {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            handleClose();
            return 5;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step]);
  
  const handleClose = () => {
    stopCamera();
    onClose();
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-700 relative">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Smart Vision Capture</h2>
              <p className="text-sm text-gray-400">Capture your photo to join</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        {/* Success Overlay */}
        {step === "success" && checkInResult && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-10 rounded-2xl">
            <div className="text-center p-8 max-w-md">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 mb-6">
                <PartyPopper className="w-10 h-10 text-white" />
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-2">Welcome!</h2>
              <p className="text-4xl font-bold text-emerald-400 mb-4">
                {firstName} {lastName}
              </p>
              
              {checkInResult.welcomeMessage && (
                <p className="text-white/80 mb-4">{checkInResult.welcomeMessage}</p>
              )}
              
              <p className="text-gray-400 mb-6">
                Guest #{checkInResult.guestNumber} • {checkInResult.eventTitle}
              </p>
              
              <div className="flex items-center justify-center gap-2 text-gray-400 mb-4">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Closing in {countdown}...</span>
              </div>
              
              <Button
                onClick={handleClose}
                className="bg-white/20 hover:bg-white/30 text-white"
              >
                Done
              </Button>
            </div>
          </div>
        )}
        
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Camera / Captured Image */}
            <div className="space-y-4">
              {step === "camera" && (
                <>
                  <div className="relative bg-black rounded-xl overflow-hidden aspect-[4/3]">
                    {cameraError ? (
                      <div className="absolute inset-0 flex items-center justify-center text-center p-4">
                        <div>
                          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                          <p className="text-red-400">{cameraError}</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                          style={{ transform: "scaleX(-1)" }}
                        />
                        
                        {/* Palm detection overlay - only show when hand detection is active */}
                        {handDetectionEnabled && (
                          <div className={`absolute inset-4 border-4 rounded-xl transition-all duration-200 pointer-events-none ${
                            palmDetected 
                              ? "border-emerald-500 bg-emerald-500/10" 
                              : "border-white/20 border-dashed"
                          }`}>
                            {/* Progress circle when palm detected */}
                            {palmDetected && palmProgress > 0 && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="relative w-20 h-20">
                                  <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                      cx="40"
                                      cy="40"
                                      r="36"
                                      fill="none"
                                      stroke="#1f2937"
                                      strokeWidth="6"
                                    />
                                    <circle
                                      cx="40"
                                      cy="40"
                                      r="36"
                                      fill="none"
                                      stroke="#10b981"
                                      strokeWidth="6"
                                      strokeLinecap="round"
                                      strokeDasharray={`${palmProgress * 2.26} 226`}
                                      className="transition-all duration-100"
                                    />
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <Hand className="w-8 h-8 text-emerald-400" />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Status badge */}
                        <div className="absolute top-3 left-3">
                          {isLoadingHands ? (
                            <span className="bg-yellow-500/90 text-white text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5">
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              Loading AI...
                            </span>
                          ) : handDetectionEnabled ? (
                            <span className="bg-emerald-500/90 text-white text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5">
                              <Hand className="w-3 h-3" />
                              Palm Detection Active
                            </span>
                          ) : cameraReady ? (
                            <span className="bg-blue-500/90 text-white text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5">
                              <Camera className="w-3 h-3" />
                              Camera Ready
                            </span>
                          ) : null}
                        </div>
                        
                        {/* Instructions */}
                        <div className={`absolute bottom-4 left-4 right-4 p-3 rounded-lg transition-all ${
                          palmDetected 
                            ? "bg-emerald-500" 
                            : "bg-gray-900/90"
                        }`}>
                          <p className="text-white text-sm font-medium flex items-center gap-2">
                            {palmDetected ? (
                              <>
                                <Hand className="w-4 h-4" />
                                Hold steady... {Math.round(palmProgress)}%
                              </>
                            ) : (
                              <>
                                <Aperture className="w-4 h-4" />
                                Click capture or show open palm
                              </>
                            )}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {/* Manual Capture Button - Always available */}
                  <Button
                    onClick={capturePhoto}
                    disabled={!cameraReady}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-lg disabled:opacity-50"
                  >
                    <Aperture className="w-5 h-5 mr-2" />
                    Capture Photo
                  </Button>
                </>
              )}
              
              {step === "captured" && capturedImage && (
                <div className="space-y-4">
                  <div className="relative bg-black rounded-xl overflow-hidden aspect-[4/3]">
                    <img 
                      src={capturedImage} 
                      alt="Captured" 
                      className="w-full h-full object-cover"
                      style={{ transform: "scaleX(-1)" }}
                    />
                    <div className="absolute top-3 right-3">
                      <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        ✓ Captured
                      </span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={retakePhoto}
                    variant="outline"
                    className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Retake Photo
                  </Button>
                </div>
              )}
            </div>
            
            {/* Form */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-white">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold">Your Details</h3>
              </div>
              
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                  <User className="w-4 h-4" />
                  First Name *
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
                  placeholder="Enter your first name"
                />
              </div>
              
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                  <User className="w-4 h-4" />
                  Last Name *
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
                  placeholder="Enter your last name"
                />
              </div>
              
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !capturedImage || !firstName.trim() || !lastName.trim()}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-bold text-lg disabled:opacity-50 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Complete
                  </>
                )}
              </Button>
              
              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                <h4 className="font-medium text-white mb-2 text-sm">Quick Tips:</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                    Click <strong className="text-blue-400">Capture Photo</strong> anytime
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                    Or show <strong className="text-emerald-400">open palm</strong> for auto-capture
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                    Enter your name and click Complete
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
