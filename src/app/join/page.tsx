"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useQuery, useMutation } from "convex/react";
import { useSearchParams } from "next/navigation";
import { api } from "../../../convex/_generated/api";
import { 
  QrCode, 
  Users, 
  MapPin, 
  CheckCircle2, 
  Sparkles,
  Camera,
  X,
  PartyPopper,
  Keyboard,
  ScanBarcode,
  MessageSquare,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import confetti from "canvas-confetti";

function JoinEventContent() {
  const searchParams = useSearchParams();
  const [joinCode, setJoinCode] = useState(["", "", "", ""]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [step, setStep] = useState<"code" | "name" | "success">("code");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [inputMode, setInputMode] = useState<"code" | "scanner">("code");
  const [scannerBuffer, setScannerBuffer] = useState("");
  const [checkInResult, setCheckInResult] = useState<any>(null);
  const [countdown, setCountdown] = useState(10);
  const [joinMethod, setJoinMethod] = useState<"code" | "qr" | "scanner">("code");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const scannerInputRef = useRef<HTMLInputElement>(null);
  const qrScannerRef = useRef<any>(null);
  const hasSubmittedRef = useRef(false);
  
  const fullCode = joinCode.join("");
  
  useEffect(() => {
    const codeFromUrl = searchParams.get("code");
    if (codeFromUrl && codeFromUrl.length === 4) {
      setJoinCode(codeFromUrl.split(""));
      setJoinMethod("qr");
    }
  }, [searchParams]);
  
  const event = useQuery(
    api.events.getEventByJoinCode, 
    fullCode.length === 4 ? { joinCode: fullCode } : "skip"
  );
  
  const guestCheckIn = useMutation(api.events.guestCheckIn);
  
  useEffect(() => {
    if (step === "success") {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            handleRestart();
            return 10;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step]);
  
  const handleCodeInput = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, 4).split("");
      const newCode = [...joinCode];
      digits.forEach((digit, i) => {
        if (index + i < 4) {
          newCode[index + i] = digit;
        }
      });
      setJoinCode(newCode);
      const lastIndex = Math.min(index + digits.length, 3);
      inputRefs.current[lastIndex]?.focus();
    } else if (/^\d$/.test(value)) {
      const newCode = [...joinCode];
      newCode[index] = value;
      setJoinCode(newCode);
      if (index < 3) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };
  
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !joinCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };
  
  useEffect(() => {
    if (fullCode.length === 4 && event && step === "code") {
      setStep("name");
    }
  }, [fullCode, event, step]);
  
  const handleScannerInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setScannerBuffer(value);
    
    if (/^\d{4}$/.test(value)) {
      setJoinCode(value.split(""));
      setJoinMethod("scanner");
      setScannerBuffer("");
      if (scannerInputRef.current) {
        scannerInputRef.current.value = "";
      }
    }
  }, []);
  
  const stopQRScanner = useCallback(async () => {
    if (qrScannerRef.current) {
      try {
        await qrScannerRef.current.stop();
        qrScannerRef.current.clear();
      } catch (e) {}
      qrScannerRef.current = null;
    }
    setShowQRScanner(false);
  }, []);
  
  const startQRScanner = async () => {
    setShowQRScanner(true);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const html5QrCode = new Html5Qrcode("qr-reader");
      qrScannerRef.current = html5QrCode;
      
      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          let code = decodedText;
          if (decodedText.includes("code=")) {
            try {
              const url = new URL(decodedText);
              code = url.searchParams.get("code") || "";
            } catch {
              code = "";
            }
          } else if (decodedText.includes("/join/")) {
            code = decodedText.split("/join/").pop()?.split("?")[0] || "";
          }
          
          if (/^\d{4}$/.test(code)) {
            await stopQRScanner();
            setJoinCode(code.split(""));
            setJoinMethod("qr");
            toast.success("QR Code scanned!");
          }
        },
        () => {}
      );
    } catch (err) {
      console.error("Camera error:", err);
      toast.error("Could not access camera");
      setShowQRScanner(false);
    }
  };
  
  useEffect(() => {
    return () => {
      stopQRScanner();
    };
  }, [stopQRScanner]);
  
  const handleSubmit = async () => {
    if (hasSubmittedRef.current || isSubmitting) return;
    
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    
    hasSubmittedRef.current = true;
    setIsSubmitting(true);
    
    try {
      const result = await guestCheckIn({
        joinCode: fullCode,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        joinMethod: joinMethod,
        message: customMessage.trim() || undefined,
      });
      
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 }
      });
      
      setCheckInResult(result);
      setStep("success");
      setCountdown(10);
    } catch (error: any) {
      toast.error(error.message || "Failed to join");
      hasSubmittedRef.current = false;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleRestart = () => {
    hasSubmittedRef.current = false;
    setStep("code");
    setJoinCode(["", "", "", ""]);
    setFirstName("");
    setLastName("");
    setCustomMessage("");
    setCheckInResult(null);
    setCountdown(10);
    setInputMode("code");
    setJoinMethod("code");
    setScannerBuffer("");
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col relative">
      {/* Success Overlay - Full Screen Blur */}
      {step === "success" && checkInResult && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="text-center max-w-lg w-full">
            {/* Welcome Card */}
            <div className="bg-gradient-to-br from-emerald-600 to-blue-600 rounded-3xl p-8 mb-6 shadow-2xl shadow-emerald-500/30">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 mb-6">
                <PartyPopper className="w-10 h-10 text-white" />
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Welcome!
              </h2>
              
              <p className="text-4xl md:text-5xl font-bold text-white mb-4">
                {checkInResult.eventTitle ? `${firstName} ${lastName}` : `${firstName} ${lastName}`}
              </p>
              
              {checkInResult.welcomeMessage && (
                <p className="text-white/90 text-lg mb-4 whitespace-pre-wrap">
                  {checkInResult.welcomeMessage}
                </p>
              )}
              
              <div className="flex items-center justify-center gap-2 text-white/80">
                <Users className="w-5 h-5" />
                <span className="text-lg">
                  Guest #{checkInResult.guestNumber} • {checkInResult.eventTitle}
                </span>
              </div>
              
              {customMessage && (
                <div className="mt-4 p-3 bg-white/10 rounded-xl">
                  <p className="text-white/90 text-sm italic">&quot;{customMessage}&quot;</p>
                </div>
              )}
            </div>
            
            {/* Countdown */}
            <div className="flex items-center justify-center gap-3 text-gray-300 mb-4">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Restarting in {countdown} seconds...</span>
            </div>
            
            <Button
              onClick={handleRestart}
              className="bg-white/20 hover:bg-white/30 text-white px-8 py-3 rounded-xl"
            >
              Add Another Person
            </Button>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="text-center pt-8 pb-4 px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-r from-emerald-500 to-blue-500 mb-4">
          <QrCode className="w-8 h-8 md:w-10 md:h-10 text-white" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Join Event</h1>
        <p className="text-gray-400">Enter the code or scan QR to join</p>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Step: Enter Code */}
          {step === "code" && (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              {/* Input Mode Toggle */}
              <div className="flex gap-2 mb-6 bg-gray-900/50 p-1 rounded-lg">
                <button
                  onClick={() => setInputMode("code")}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                    inputMode === "code" 
                      ? "bg-emerald-600 text-white" 
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Keyboard className="w-4 h-4" />
                  Manual Code
                </button>
                <button
                  onClick={() => {
                    setInputMode("scanner");
                    setTimeout(() => scannerInputRef.current?.focus(), 100);
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                    inputMode === "scanner" 
                      ? "bg-blue-600 text-white" 
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <ScanBarcode className="w-4 h-4" />
                  Physical Scanner
                </button>
              </div>
              
              {inputMode === "code" ? (
                <>
                  <p className="text-center text-gray-300 mb-4 font-medium">
                    Enter 4-Digit Code
                  </p>
                  
                  <div className="flex justify-center gap-3 mb-6">
                    {[0, 1, 2, 3].map((i) => (
                      <input
                        key={i}
                        ref={(el) => { inputRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        value={joinCode[i]}
                        onChange={(e) => handleCodeInput(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        className="w-14 h-16 md:w-16 md:h-20 text-center text-2xl md:text-3xl font-bold bg-gray-900/50 border-2 border-gray-600 rounded-xl text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                        autoFocus={i === 0}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-center text-gray-300 mb-4 font-medium">
                    Physical Scanner Mode
                  </p>
                  
                  <div className="mb-6">
                    <input
                      ref={scannerInputRef}
                      type="text"
                      value={scannerBuffer}
                      onChange={handleScannerInput}
                      className="w-full h-20 text-center text-3xl font-bold bg-gray-900/50 border-2 border-blue-500 rounded-xl text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                      placeholder="Scan..."
                      autoFocus
                    />
                    <p className="text-center text-gray-400 text-sm mt-3">
                      Point your physical barcode scanner at the QR code
                    </p>
                  </div>
                </>
              )}
              
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-gray-700" />
                <span className="text-gray-500 text-sm">or</span>
                <div className="flex-1 h-px bg-gray-700" />
              </div>
              
              <Button
                onClick={startQRScanner}
                className="w-full py-6 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                Scan QR Code with Camera
              </Button>
              
              {fullCode.length === 4 && event === null && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm text-center">
                    Invalid code. Please check and try again.
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Step: Enter Name */}
          {step === "name" && event && (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <div className="text-center mb-6 pb-6 border-b border-gray-700">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/20 mb-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-1">{event.title}</h2>
                <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>{event.location}</span>
                </div>
              </div>
              
              {event.checkInInfoText && (
                <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                  <p className="text-blue-300 text-sm whitespace-pre-wrap">
                    {event.checkInInfoText}
                  </p>
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 outline-none"
                    placeholder="Juan"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 outline-none"
                    placeholder="Dela Cruz"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Message (Optional)
                  </label>
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 outline-none resize-none"
                    placeholder="Leave a message..."
                    maxLength={200}
                  />
                </div>
                
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !firstName.trim() || !lastName.trim()}
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-lg rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Join Event
                    </>
                  )}
                </Button>
                
                <button
                  onClick={() => {
                    setStep("code");
                    setJoinCode(["", "", "", ""]);
                    hasSubmittedRef.current = false;
                  }}
                  className="w-full text-gray-400 hover:text-white text-sm py-2 transition-colors"
                >
                  ← Enter different code
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* QR Scanner Modal */}
      {showQRScanner && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 bg-black">
            <h3 className="text-white font-bold text-lg">Scan QR Code</h3>
            <button
              onClick={stopQRScanner}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
          
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
              <div 
                id="qr-reader" 
                className="rounded-2xl overflow-hidden bg-black"
                style={{ width: "100%" }}
              />
              <p className="text-center text-gray-400 mt-4">
                Point camera at the event QR code
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Footer */}
      <div className="text-center py-4 text-gray-500 text-sm">
        Powered by BarangayLink
      </div>
    </div>
  );
}

export default function JoinEventPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <JoinEventContent />
    </Suspense>
  );
}
