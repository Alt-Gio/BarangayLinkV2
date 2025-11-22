"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { QrCode, Scan, CheckCircle2, XCircle, User, Calendar, MapPin } from "lucide-react";
import { toast } from "sonner";

interface QRScannerInputProps {
  onSuccess?: () => void;
}

export function QRScannerInput({ onSuccess }: QRScannerInputProps) {
  const [scanInput, setScanInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastScan, setLastScan] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const checkInViaQR = useMutation(api.attendance.checkInViaQR);

  // Auto-focus input for barcode scanner
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleScan = async (ticketCode: string) => {
    if (!ticketCode.trim() || isProcessing) return;

    setIsProcessing(true);

    try {
      const result = await checkInViaQR({ ticketCode: ticketCode.trim() });

      if (result.success) {
        setLastScan(result);
        setShowSuccess(true);
        toast.success(`✅ ${result.attendee.name} checked in!`, {
          description: result.event?.title || "Event attendance marked",
        });

        // Play success sound (optional)
        const audio = new Audio("/sounds/success.mp3");
        audio.play().catch(() => {});

        // Clear after 3 seconds
        setTimeout(() => {
          setShowSuccess(false);
          setLastScan(null);
        }, 3000);

        onSuccess?.();
      } else {
        toast.error(result.message || "Check-in failed", {
          description: `${result.attendee?.name || "Attendee"} already checked in`,
        });
      }
    } catch (error: any) {
      console.error("Check-in error:", error);
      toast.error("Invalid QR code", {
        description: error.message || "Please try again or check in manually",
      });
    } finally {
      setIsProcessing(false);
      setScanInput("");
      inputRef.current?.focus();
    }
  };

  const handleInputChange = (value: string) => {
    setScanInput(value);

    // Auto-submit when scanner sends Enter (most scanners do this)
    // Or when code reaches expected length
    if (value.includes("\n") || value.length > 30) {
      handleScan(value.replace("\n", "").trim());
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleScan(scanInput);
  };

  return (
    <div className="space-y-4">
      {/* Scanner Input */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-emerald-500 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-emerald-500/20 rounded-lg">
            <Scan className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">QR Code Scanner</h3>
            <p className="text-sm text-gray-400">Scan barcode or enter ticket code manually</p>
          </div>
        </div>

        <form onSubmit={handleManualSubmit} className="space-y-3">
          <div className="relative">
            <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              ref={inputRef}
              type="text"
              value={scanInput}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Scan QR code or type ticket code..."
              className="pl-10 bg-gray-800 border-gray-700 text-white text-lg h-12 font-mono"
              disabled={isProcessing}
              autoFocus
            />
          </div>

          <Button
            type="submit"
            disabled={!scanInput.trim() || isProcessing}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-lg"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Check In
              </>
            )}
          </Button>
        </form>

        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-blue-300 flex items-center gap-2">
            <span>💡</span>
            <span>
              <strong>For physical scanners:</strong> Just scan the QR code. For manual entry, type the code and click Check In.
            </span>
          </p>
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

      {/* Instructions */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-300 mb-2">Scanner Instructions:</h4>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• <strong>Physical Scanner:</strong> Point scanner at QR code and press trigger</li>
          <li>• <strong>Manual Entry:</strong> Type ticket code (e.g., EVT-xxx-xxx) and submit</li>
          <li>• <strong>Duplicate Scan:</strong> System will alert if already checked in</li>
          <li>• <strong>Invalid Code:</strong> Error message will show, try manual check-in</li>
        </ul>
      </div>
    </div>
  );
}
