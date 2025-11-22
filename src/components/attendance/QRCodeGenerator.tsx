"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, Download, Mail, CheckCircle, Barcode } from "lucide-react";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";

interface QRCodeGeneratorProps {
  attendeeId: Id<"eventAttendees">;
  attendeeName: string;
  attendeeEmail: string;
  eventTitle: string;
  ticketCode?: string;
}

export function QRCodeGenerator({
  attendeeId,
  attendeeName,
  attendeeEmail,
  eventTitle,
  ticketCode,
}: QRCodeGeneratorProps) {
  const [qrDataURL, setQrDataURL] = useState<string>("");
  const [barcodeDataURL, setBarcodeDataURL] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateQRCode = useMutation(api.attendance.generateAttendeeQRCode);
  const markQRSent = useMutation(api.attendance.markQRCodeSent);

  useEffect(() => {
    if (ticketCode) {
      generateQR(ticketCode);
      generateBarcode(ticketCode);
    }
  }, [ticketCode]);

  const generateQR = async (code: string) => {
    try {
      const dataURL = await QRCode.toDataURL(code, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
      setQrDataURL(dataURL);
    } catch (error) {
      console.error("QR generation error:", error);
    }
  };

  const generateBarcode = async (code: string) => {
    try {
      const canvas = document.createElement("canvas");
      JsBarcode(canvas, code, {
        format: "CODE39", // Better for short alphanumeric codes
        width: 2,
        height: 70,
        displayValue: true,
        fontSize: 16,
        margin: 8,
        textMargin: 5,
      });
      const dataURL = canvas.toDataURL("image/png");
      setBarcodeDataURL(dataURL);
    } catch (error) {
      console.error("Barcode generation error:", error);
    }
  };

  const handleGenerate = async () => {
    if (ticketCode) {
      generateQR(ticketCode);
      generateBarcode(ticketCode);
      return;
    }

    setGenerating(true);
    try {
      const result = await generateQRCode({
        eventId: attendeeId as any, // Will be properly typed
        attendeeId,
      });

      await generateQR(result.ticketCode);
      await generateBarcode(result.ticketCode);
      toast.success("QR code & Barcode generated!");
    } catch (error) {
      toast.error("Failed to generate codes");
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!qrDataURL) return;

    const link = document.createElement("a");
    link.download = `${attendeeName.replace(/\s+/g, "_")}_${eventTitle.replace(/\s+/g, "_")}_QR.png`;
    link.href = qrDataURL;
    link.click();

    toast.success("QR code downloaded!");
  };

  const handleSendEmail = async () => {
    setSendingEmail(true);
    try {
      // Call email API endpoint
      const response = await fetch("/api/send-qr-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendeeId,
          attendeeName,
          attendeeEmail,
          eventTitle,
          ticketCode: ticketCode || "",
          qrDataURL,
          barcodeDataURL,
        }),
      });

      if (!response.ok) {
        throw new Error("Email sending failed");
      }

      await markQRSent({ attendeeId });

      toast.success(`QR code & Barcode sent to ${attendeeEmail}!`);
    } catch (error) {
      toast.error("Failed to send email");
      console.error(error);
    } finally {
      setSendingEmail(false);
    }
  };

  if (!qrDataURL && ticketCode) {
    return (
      <Button
        size="sm"
        onClick={handleGenerate}
        disabled={generating}
        className="bg-blue-600 hover:bg-blue-700"
      >
        {generating ? "Generating..." : "Show QR"}
      </Button>
    );
  }

  if (!qrDataURL) {
    return (
      <Button
        size="sm"
        onClick={handleGenerate}
        disabled={generating}
        className="bg-blue-600 hover:bg-blue-700"
      >
        <QrCode className="w-4 h-4 mr-1" />
        {generating ? "Generating..." : "Generate QR"}
      </Button>
    );
  }

  return (
    <div className="inline-flex items-center gap-2">
      <div className="relative group">
        <Button
          size="sm"
          variant="outline"
          className="border-blue-500 text-blue-400 hover:bg-blue-500/20"
        >
          <QrCode className="w-4 h-4" />
        </Button>

        {/* QR Code Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-50 animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
            <img src={qrDataURL} alt="QR Code" className="w-40 h-40 rounded" />
            <p className="text-xs text-gray-400 text-center mt-2">{ticketCode}</p>
          </div>
        </div>
      </div>

      <Button
        size="sm"
        onClick={handleDownload}
        variant="outline"
        className="border-emerald-500 text-emerald-400 hover:bg-emerald-500/20"
      >
        <Download className="w-4 h-4" />
      </Button>

      <Button
        size="sm"
        onClick={handleSendEmail}
        disabled={sendingEmail}
        className="bg-blue-600 hover:bg-blue-700"
      >
        {sendingEmail ? (
          <>
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
            Sending...
          </>
        ) : (
          <>
            <Mail className="w-4 h-4 mr-1" />
            Email QR
          </>
        )}
      </Button>
    </div>
  );
}
