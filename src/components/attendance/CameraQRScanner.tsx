"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, X, Zap, CheckCircle2, Calendar, MapPin, Video } from "lucide-react";
import { toast } from "sonner";
import { Html5QrcodeScanner, Html5Qrcode } from "html5-qrcode";

interface CameraQRScannerProps {
  onSuccess?: () => void;
}

export function CameraQRScanner({ onSuccess }: CameraQRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [useFlash, setUseFlash] = useState(false);
  const [cameraError, setCameraError] = useState<string>("");
  const scannerRef = useRef<any>(null);

  const checkInViaQR = useMutation(api.attendance.checkInViaQR);

  const handleScanSuccess = async (decodedText: string) => {
    if (!decodedText.trim()) return;

    // Stop scanner temporarily to process
    if (scannerRef.current?.isScanning) {
      scannerRef.current.pause(true);
    }

    try {
      const result = await checkInViaQR({ ticketCode: decodedText.trim() });

      if (result.success) {
        setLastScan(result);
        setShowSuccess(true);
        toast.success(`✅ ${result.attendee.name} checked in!`, {
          description: result.event?.title || "Event attendance marked",
        });

        // Play success sound
        const audio = new Audio("/sounds/success.mp3");
        audio.play().catch(() => {});

        // Clear after 3 seconds
        setTimeout(() => {
          setShowSuccess(false);
          setLastScan(null);
          // Resume scanning
          if (scannerRef.current?.isScanning) {
            scannerRef.current.resume();
          }
        }, 3000);

        onSuccess?.();
      } else {
        toast.error(result.message || "Check-in failed", {
          description: `${result.attendee?.name || "Attendee"} already checked in`,
        });
        // Resume scanning after error
        setTimeout(() => {
          if (scannerRef.current?.isScanning) {
            scannerRef.current.resume();
          }
        }, 2000);
      }
    } catch (error: any) {
      console.error("Check-in error:", error);
      toast.error("Invalid QR code", {
        description: error.message || "Please try again",
      });
      // Resume scanning after error
      setTimeout(() => {
        if (scannerRef.current?.isScanning) {
          scannerRef.current.resume();
        }
      }, 2000);
    }
  };

  const startScanning = async () => {
    setCameraError("");
    setIsScanning(true);

    // Wait for DOM to render the qr-reader div
    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode("qr-reader");
        scannerRef.current = html5QrCode;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            handleScanSuccess(decodedText);
          },
          (errorMessage) => {
            // Silent - scanning errors are normal
          }
        );

        toast.success("Camera started! Point at QR code");
      } catch (err: any) {
        console.error("Camera error:", err);
        setCameraError(err.message || "Failed to start camera");
        setIsScanning(false);
        toast.error("Camera access denied or unavailable");
      }
    }, 100);
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (err) {
        console.error("Stop error:", err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const toggleFlash = async () => {
    toast.info("Flash control not supported in browser camera");
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Camera Scanner */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-blue-500 rounded-xl overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Camera className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Camera QR Scanner</h3>
              <p className="text-sm text-gray-400">Use your webcam or phone camera to scan</p>
            </div>
          </div>

          {/* Camera View */}
          <div className="relative bg-black rounded-lg overflow-hidden min-h-[400px]">
            {!isScanning ? (
              <div className="flex items-center justify-center h-[400px]">
                <div className="text-center p-8">
                  <Video className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">Camera not started</p>
                  <Button
                    onClick={startScanning}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Start Camera
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div id="qr-reader" className="w-full"></div>
                
                <div className="absolute top-4 left-4">
                  <Badge className="bg-red-600 text-white animate-pulse">
                    <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                    Scanning...
                  </Badge>
                </div>

                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <div className="inline-block bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2">
                    <p className="text-white text-sm">👆 Point camera at QR code</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Camera Error */}
          {cameraError && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-300">{cameraError}</p>
              <p className="text-xs text-red-400 mt-1">
                Make sure camera permissions are granted in your browser
              </p>
            </div>
          )}

          {/* Controls */}
          {isScanning && (
            <div className="flex gap-3 mt-4">
              <Button
                onClick={stopScanning}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white h-12"
              >
                <X className="w-4 h-4 mr-2" />
                Stop Camera
              </Button>
            </div>
          )}

          {/* Info */}
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-300 flex items-center gap-2">
              <span>💡</span>
              <span>
                <strong>Camera Tips:</strong> Hold steady, ensure good lighting, position QR code in frame
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Success Animation */}
      {showSuccess && lastScan && (
        <div className="bg-gradient-to-br from-emerald-900 to-emerald-800 border-2 border-emerald-400 rounded-xl p-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-emerald-500 rounded-full animate-bounce">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-bold text-white mb-1">✅ Check-In Successful!</h4>
              <p className="text-emerald-200 text-lg font-semibold">
                {lastScan.attendee.name}
              </p>
              {lastScan.event && (
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-emerald-300 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {lastScan.event.title}
                  </p>
                  <p className="text-sm text-emerald-300 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {lastScan.event.location}
                  </p>
                </div>
              )}
              <p className="text-xs text-emerald-400 mt-2">
                {new Date(lastScan.attendee.checkedInAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Camera Requirements */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-300 mb-2">Camera Requirements:</h4>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• <strong>Browser Permissions:</strong> Allow camera access when prompted</li>
          <li>• <strong>HTTPS Required:</strong> Camera only works on secure connections</li>
          <li>• <strong>Lighting:</strong> Ensure good lighting for best results</li>
          <li>• <strong>Distance:</strong> Hold QR code 6-12 inches from camera</li>
          <li>• <strong>Supported:</strong> Chrome, Firefox, Safari, Edge</li>
        </ul>
      </div>
    </div>
  );
}
