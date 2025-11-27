"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { 
  Users, 
  QrCode, 
  Sparkles,
  Clock,
  Camera,
  UserCheck,
  MessageSquare,
  Settings,
  Save,
  ExternalLink,
  ScanBarcode,
  Copy,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Id } from "../../../convex/_generated/dataModel";
import QRCode from "react-qr-code";
import { toast } from "sonner";

interface LiveAttendanceDashboardProps {
  eventId: Id<"events">;
  eventTitle: string;
}

export function LiveAttendanceDashboard({ eventId, eventTitle }: LiveAttendanceDashboardProps) {
  const liveFeed = useQuery(api.events.getLiveGuestFeed, { eventId });
  const updateWelcomeSettings = useMutation(api.events.updateEventWelcomeSettings);
  
  const [showSettings, setShowSettings] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [checkInInfoText, setCheckInInfoText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Initialize form values when liveFeed loads
  useState(() => {
    if (liveFeed) {
      setWelcomeMessage(liveFeed.welcomeMessage || "");
      setCheckInInfoText(liveFeed.checkInInfoText || "");
    }
  });
  
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await updateWelcomeSettings({
        eventId,
        welcomeMessage: welcomeMessage || undefined,
        checkInInfoText: checkInInfoText || undefined,
      });
      toast.success("Settings saved!");
      setShowSettings(false);
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCopyCode = () => {
    if (liveFeed?.joinCode) {
      navigator.clipboard.writeText(liveFeed.joinCode);
      setCopied(true);
      toast.success("Code copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  if (!liveFeed) {
    return (
      <div className="text-center py-8">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Loading live feed...</p>
      </div>
    );
  }

  const joinUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/join` 
    : '/join';

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
          <Users className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
          <p className="text-3xl font-bold text-white">{liveFeed.totalAttendees}</p>
          <p className="text-sm text-gray-400">Total Attendees</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-center">
          <UserCheck className="w-6 h-6 text-blue-400 mx-auto mb-2" />
          <p className="text-3xl font-bold text-white">{liveFeed.totalGuests}</p>
          <p className="text-sm text-gray-400">Guest Check-ins</p>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 text-center">
          <QrCode className="w-6 h-6 text-purple-400 mx-auto mb-2" />
          <p className="text-3xl font-bold text-white">{liveFeed.joinCode || "N/A"}</p>
          <p className="text-sm text-gray-400">Join Code</p>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
          <Sparkles className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
          <p className="text-lg font-bold text-white">
            {liveFeed.enableEasyAttendance ? "Active" : "Off"}
          </p>
          <p className="text-sm text-gray-400">Easy Attendance</p>
        </div>
      </div>
      
      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" />
            Welcome Message Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Welcome Message (shown after check-in)
              </label>
              <textarea
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 outline-none resize-none"
                placeholder="e.g., Welcome to our event! Please proceed to the registration desk."
                maxLength={300}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Check-in Info Text (shown during check-in)
              </label>
              <textarea
                value={checkInInfoText}
                onChange={(e) => setCheckInInfoText(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 outline-none resize-none"
                placeholder="e.g., Please have your ID ready for verification. Refreshments will be served after the program."
                maxLength={300}
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Saving..." : "Save Settings"}
              </Button>
              <Button
                onClick={() => setShowSettings(false)}
                variant="ghost"
                className="text-gray-400 hover:text-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* QR Code & Join Info */}
      {liveFeed.enableEasyAttendance && liveFeed.joinCode && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* QR Code */}
          <div className="bg-white rounded-xl p-6 text-center">
            <QRCode 
              value={`${joinUrl}?code=${liveFeed.joinCode}`}
              size={200}
              level="H"
              className="mx-auto"
            />
            <p className="text-gray-600 mt-4 text-sm">Scan to join event</p>
            
            {/* Actions */}
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button
                onClick={handleCopyCode}
                size="sm"
                className="bg-gray-800 hover:bg-gray-700 text-white"
              >
                {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                Copy Code
              </Button>
              <Button
                onClick={() => window.open(`/join/${eventId}`, '_blank')}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Full Screen
              </Button>
            </div>
          </div>
          
          {/* Join Instructions */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                How to Join
              </h3>
              <Button
                onClick={() => {
                  setWelcomeMessage(liveFeed.welcomeMessage || "");
                  setCheckInInfoText(liveFeed.checkInInfoText || "");
                  setShowSettings(!showSettings);
                }}
                size="sm"
                variant="ghost"
                className="text-gray-400 hover:text-white"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold shrink-0">
                  1
                </div>
                <div>
                  <p className="text-white font-medium">Go to</p>
                  <p className="text-emerald-400 font-mono">{joinUrl}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold shrink-0">
                  2
                </div>
                <div>
                  <p className="text-white font-medium">Enter Code</p>
                  <p className="text-4xl font-bold text-emerald-400 tracking-widest">
                    {liveFeed.joinCode.split("").join(" ")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold shrink-0">
                  3
                </div>
                <div>
                  <p className="text-white font-medium">Enter your name</p>
                  <p className="text-gray-400 text-sm">No email or account needed!</p>
                </div>
              </div>
            </div>
            
            {/* Physical Scanner Info */}
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-blue-300 text-sm flex items-center gap-2">
                <ScanBarcode className="w-4 h-4" />
                <span>Physical scanner mode available on /join page</span>
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Live Feed */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            Recent Check-ins
          </h3>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm text-emerald-400">Live</span>
          </div>
        </div>
        
        <div className="divide-y divide-white/10 max-h-[400px] overflow-y-auto">
          {liveFeed.recentGuests.length > 0 ? (
            liveFeed.recentGuests.map((guest, index) => (
              <div key={index}>
                <div 
                  className={`p-4 ${
                    index === 0 ? "bg-emerald-500/10 animate-pulse-once" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Photo or Avatar */}
                    {guest.photoUrl ? (
                      <div className="relative group">
                        <img 
                          src={guest.photoUrl} 
                          alt={`${guest.firstName} ${guest.lastName}`}
                          className="w-12 h-12 rounded-full object-cover border-2 border-blue-500 cursor-pointer hover:scale-105 transition-transform"
                          style={{ transform: "scaleX(-1)" }}
                        />
                        {/* Hover to view larger */}
                        <div className="absolute left-0 top-full mt-2 z-50 hidden group-hover:block">
                          <div className="bg-gray-800 rounded-xl p-2 shadow-2xl border border-gray-700">
                            <img 
                              src={guest.photoUrl} 
                              alt={`${guest.firstName} ${guest.lastName}`}
                              className="w-48 h-48 rounded-lg object-cover"
                              style={{ transform: "scaleX(-1)" }}
                            />
                            <p className="text-white text-center text-sm mt-2 font-medium">
                              {guest.firstName} {guest.lastName}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
                        {guest.firstName[0]}{guest.lastName[0]}
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-white font-medium truncate">
                          {guest.firstName} {guest.lastName}
                        </p>
                        {guest.joinMethod === "camera" ? (
                          <span className="flex items-center gap-1 text-xs text-blue-400 bg-blue-500/20 px-2 py-1 rounded-full shrink-0">
                            <Camera className="w-3 h-3" />
                            Camera
                          </span>
                        ) : guest.joinMethod === "scanner" ? (
                          <span className="flex items-center gap-1 text-xs text-purple-400 bg-purple-500/20 px-2 py-1 rounded-full shrink-0">
                            <ScanBarcode className="w-3 h-3" />
                            Scanner
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded-full shrink-0">
                            <QrCode className="w-3 h-3" />
                            {guest.joinMethod === "qr" ? "QR" : "Code"}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">
                        {new Date(guest.joinedAt).toLocaleTimeString()}
                      </p>
                      {guest.message && (
                        <p className="text-gray-400 text-sm italic mt-1 border-l-2 border-gray-700 pl-2">
                          &quot;{guest.message}&quot;
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No check-ins yet</p>
              <p className="text-sm mt-1">Waiting for attendees...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
