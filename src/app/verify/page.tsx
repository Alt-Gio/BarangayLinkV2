"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Shield,
  Search,
  CheckCircle,
  XCircle,
  FileText,
  Calendar,
  User,
  MapPin,
  QrCode,
  AlertTriangle,
} from "lucide-react";

export default function VerificationPage() {
  const [qrCode, setQrCode] = useState("");
  const [certificateNumber, setCertificateNumber] = useState("");
  const [searchType, setSearchType] = useState<"qr" | "number">("qr");

  // In production, you'd query based on input
  // const verificationResult = useQuery(
  //   api.certificates.verifyCertificateByQR,
  //   searchType === "qr" && qrCode ? { qrCode } : "skip"
  // );

  // Mock verification result for demonstration
  const mockResult = qrCode || certificateNumber ? {
    valid: qrCode !== "INVALID",
    certificate: {
      certificateNumber: "BC-2024-00001",
      certificateType: "Barangay Clearance",
      residentName: "Juan Dela Cruz",
      purpose: "Employment requirement",
      issuedDate: new Date().toLocaleDateString(),
      issuedBy: "Pedro Santos",
      issuedByPosition: "Barangay Captain",
      validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      qrCode: qrCode,
      isValid: true,
      resident: {
        barangayIdNumber: "BIT-2024-00001",
        age: 34,
        address: "123 Rizal Street, Purok 1",
      },
    },
    message: qrCode === "INVALID" ? "Certificate not found or invalid" : undefined,
  } : null;

  const handleVerify = () => {
    if (!qrCode && !certificateNumber) {
      alert("Please enter a QR code or certificate number");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-white/10 rounded-full">
              <Shield className="w-16 h-16" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-2">Certificate Verification</h1>
          <p className="text-emerald-100 text-lg">Verify the authenticity of barangay certificates</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Verification Input */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Verify Certificate</h2>

          {/* Search Type Tabs */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={searchType === "qr" ? "default" : "outline"}
              onClick={() => setSearchType("qr")}
              className={searchType === "qr" ? "bg-emerald-600" : "border-gray-600"}
            >
              <QrCode className="w-4 h-4 mr-2" />
              QR Code
            </Button>
            <Button
              variant={searchType === "number" ? "default" : "outline"}
              onClick={() => setSearchType("number")}
              className={searchType === "number" ? "bg-emerald-600" : "border-gray-600"}
            >
              <FileText className="w-4 h-4 mr-2" />
              Certificate Number
            </Button>
          </div>

          {/* Input Fields */}
          {searchType === "qr" ? (
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Scan or Enter QR Code Data
              </label>
              <div className="flex gap-2">
                <Input
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                  placeholder="Enter QR code data..."
                  className="bg-gray-900 border-gray-700 text-white"
                />
                <Button onClick={handleVerify} className="bg-emerald-600 hover:bg-emerald-700">
                  <Search className="w-4 h-4 mr-2" />
                  Verify
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 Tip: Use your phone's camera to scan the QR code on the certificate
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Enter Certificate Number
              </label>
              <div className="flex gap-2">
                <Input
                  value={certificateNumber}
                  onChange={(e) => setCertificateNumber(e.target.value)}
                  placeholder="e.g., BC-2024-00001"
                  className="bg-gray-900 border-gray-700 text-white font-mono"
                />
                <Button onClick={handleVerify} className="bg-emerald-600 hover:bg-emerald-700">
                  <Search className="w-4 h-4 mr-2" />
                  Verify
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 Tip: Certificate number format: XX-YYYY-NNNNN
              </p>
            </div>
          )}
        </div>

        {/* Verification Result */}
        {mockResult && (
          <div className="space-y-6">
            {mockResult.valid ? (
              <>
                {/* Valid Certificate */}
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/30 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-green-500/20 rounded-full">
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-green-400 mb-2">
                        ✓ Certificate is Valid
                      </h3>
                      <p className="text-gray-300">
                        This certificate has been verified and is authentic. Issued by Barangay 37 - Bitano, Legazpi City.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Certificate Details */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-blue-500" />
                    Certificate Details
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Certificate Number</p>
                      <p className="text-lg font-mono font-semibold text-white">
                        {mockResult.certificate.certificateNumber}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-400 mb-1">Certificate Type</p>
                      <p className="text-lg font-semibold text-white">
                        {mockResult.certificate.certificateType}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-400 mb-1">Issued To</p>
                      <p className="text-lg font-semibold text-white">
                        {mockResult.certificate.residentName}
                      </p>
                      <p className="text-sm text-gray-500">
                        ID: {mockResult.certificate.resident?.barangayIdNumber}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-400 mb-1">Purpose</p>
                      <p className="text-lg text-white">{mockResult.certificate.purpose}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-400 mb-1">Issue Date</p>
                      <p className="text-lg text-white flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        {mockResult.certificate.issuedDate}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-400 mb-1">Valid Until</p>
                      <p className="text-lg text-white flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-green-400" />
                        {mockResult.certificate.validUntil || "No expiration"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-400 mb-1">Issued By</p>
                      <p className="text-lg text-white">{mockResult.certificate.issuedBy}</p>
                      <p className="text-sm text-gray-500">
                        {mockResult.certificate.issuedByPosition}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-400 mb-1">Status</p>
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold">
                        <CheckCircle className="w-4 h-4" />
                        Valid & Active
                      </span>
                    </div>
                  </div>
                </div>

                {/* Security Features */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Shield className="w-6 h-6 text-emerald-500" />
                    Security Verification
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-green-400">
                      <CheckCircle className="w-5 h-5" />
                      <span>QR code matches certificate number</span>
                    </div>
                    <div className="flex items-center gap-3 text-green-400">
                      <CheckCircle className="w-5 h-5" />
                      <span>Certificate is in official database</span>
                    </div>
                    <div className="flex items-center gap-3 text-green-400">
                      <CheckCircle className="w-5 h-5" />
                      <span>Certificate has not been invalidated</span>
                    </div>
                    <div className="flex items-center gap-3 text-green-400">
                      <CheckCircle className="w-5 h-5" />
                      <span>Signature verified</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Invalid Certificate */
              <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-2 border-red-500/30 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-red-500/20 rounded-full">
                    <XCircle className="w-8 h-8 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-red-400 mb-2">
                      ✗ Certificate Not Valid
                    </h3>
                    <p className="text-gray-300 mb-4">
                      {mockResult.message || "This certificate could not be verified in our system."}
                    </p>
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                      <p className="text-sm text-red-300 flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span>
                          <strong>Warning:</strong> This certificate may be fake, expired, or invalidated. 
                          Please contact Barangay 37 - Bitano office for verification: +63 XX XXXX XXXX
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Information Panel */}
        {!mockResult && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">How to Verify</h3>
            <div className="space-y-4 text-gray-300">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold">
                  1
                </div>
                <div>
                  <p className="font-semibold text-white">Scan QR Code</p>
                  <p className="text-sm text-gray-400">
                    Use your phone camera to scan the QR code on the bottom-right of the certificate
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold">
                  2
                </div>
                <div>
                  <p className="font-semibold text-white">Enter Certificate Number</p>
                  <p className="text-sm text-gray-400">
                    Alternatively, manually type the certificate number found at the top of the document
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold">
                  3
                </div>
                <div>
                  <p className="font-semibold text-white">View Results</p>
                  <p className="text-sm text-gray-400">
                    Instantly see if the certificate is valid and view all certificate details
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-300">
                <strong>💡 Note:</strong> All certificates issued by Barangay 37 - Bitano contain a unique QR code 
                for easy verification. If a certificate cannot be verified, please report it to our office.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
