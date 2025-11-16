"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Printer, Download, X, QrCode } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { generateCertificateHTML, CertificateData } from "@/lib/pdf/certificateTemplates";

interface CertificatePreviewModalProps {
  open: boolean;
  onClose: () => void;
  certificateId: Id<"certificates">;
}

export default function CertificatePreviewModal({
  open,
  onClose,
  certificateId,
}: CertificatePreviewModalProps) {
  const [htmlContent, setHtmlContent] = useState("");
  
  // Fetch certificate data
  const certificateData = useQuery(
    api.certificates.getCertificateById,
    open ? { certificateId } : "skip"
  );

  useEffect(() => {
    if (certificateData && certificateData.resident) {
      // Generate QR code data URL
      const qrCodeData = generateQRCodeDataURL(certificateData.qrCode);
      
      // Prepare certificate data
      const certData: CertificateData = {
        certificateNumber: certificateData.certificateNumber,
        certificateType: certificateData.certificateType,
        residentName: certificateData.residentName,
        residentAddress: certificateData.resident.householdId 
          ? "Address from household" // You'd fetch this from household
          : "Barangay 37 - Bitano, Legazpi City",
        purpose: certificateData.purpose,
        issuedDate: new Date(certificateData.issuedAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric"
        }),
        issuedBy: certificateData.issuedByName,
        issuedByPosition: certificateData.issuedByPosition,
        notedBy: certificateData.notedBy,
        notedByPosition: certificateData.notedByPosition,
        qrCode: qrCodeData,
        validUntil: certificateData.validUntil 
          ? new Date(certificateData.validUntil).toLocaleDateString()
          : undefined,
        additionalInfo: {
          age: certificateData.resident.age,
          civilStatus: certificateData.resident.civilStatus,
          yearsOfResidency: certificateData.resident.yearsOfResidency,
          monthlyIncome: certificateData.resident.monthlyIncome,
          occupation: certificateData.resident.occupation,
        },
      };

      // Generate HTML
      const html = generateCertificateHTML(certificateData.certificateType, certData);
      setHtmlContent(html);
    }
  }, [certificateData]);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${certificateData?.certificateNumber || "certificate"}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] bg-gray-900 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2 justify-between">
            <span className="flex items-center gap-2">
              <QrCode className="w-6 h-6 text-indigo-500" />
              Certificate Preview
            </span>
            <div className="flex gap-2">
              <Button
                onClick={handlePrint}
                className="bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button
                onClick={handleDownload}
                className="bg-green-600 hover:bg-green-700"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="border-gray-600"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Certificate Info */}
        {certificateData && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Certificate Number</p>
                <p className="font-mono font-bold">{certificateData.certificateNumber}</p>
              </div>
              <div>
                <p className="text-gray-400">Type</p>
                <p className="font-semibold">{certificateData.certificateType}</p>
              </div>
              <div>
                <p className="text-gray-400">Issued Date</p>
                <p>{new Date(certificateData.issuedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Preview */}
        <div className="bg-white rounded-lg overflow-hidden" style={{ height: "600px" }}>
          <iframe
            srcDoc={htmlContent}
            className="w-full h-full border-0"
            title="Certificate Preview"
          />
        </div>

        {/* Instructions */}
        <div className="text-xs text-gray-400 text-center mt-2">
          <p>💡 Use Print button for official printing or Download to save as HTML</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Generate QR Code as Data URL
 * In production, use a proper QR code library like `qrcode` or `qr-code-styling`
 */
function generateQRCodeDataURL(qrData: string): string {
  // Simple SVG QR code placeholder
  // In production, replace with actual QR code generation
  const svg = `
    <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="white"/>
      <text x="50" y="50" text-anchor="middle" font-size="8" fill="black">
        QR: ${qrData.substring(0, 12)}...
      </text>
      <rect x="10" y="10" width="80" height="80" fill="none" stroke="black" stroke-width="2"/>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
