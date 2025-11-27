"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import { 
  QrCode, 
  Users, 
  Calendar, 
  MapPin, 
  Sparkles,
  Copy,
  Check,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import QRCode from "react-qr-code";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function EventJoinDisplayPage() {
  const params = useParams();
  const eventId = params.eventId as Id<"events">;
  const [copied, setCopied] = useState(false);
  
  const liveFeed = useQuery(api.events.getLiveGuestFeed, { eventId });
  const event = useQuery(api.events.getEventById, { eventId });
  
  const joinUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/join` 
    : '/join';

  const handleCopyCode = () => {
    if (liveFeed?.joinCode) {
      navigator.clipboard.writeText(liveFeed.joinCode);
      setCopied(true);
      toast.success("Code copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!liveFeed || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!liveFeed.enableEasyAttendance) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <QrCode className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Easy Attendance Not Enabled</h1>
          <p className="text-gray-400">Enable Easy Attendance in event settings to use this feature.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{event.title}</h1>
          <div className="flex items-center justify-center gap-4 text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(event.startDate).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {event.location}
            </span>
          </div>
        </div>
        
        {/* Live Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
            <Users className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <p className="text-3xl font-bold text-white">{liveFeed.totalAttendees}</p>
            <p className="text-sm text-gray-400">Total Joined</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-center">
            <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <p className="text-3xl font-bold text-white">{liveFeed.totalGuests}</p>
            <p className="text-sm text-gray-400">Guest Check-ins</p>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 text-center col-span-2">
            <QrCode className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-4xl font-bold text-white tracking-widest">
              {liveFeed.joinCode?.split("").join(" ")}
            </p>
            <p className="text-sm text-gray-400">Join Code</p>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* QR Code */}
          <div className="bg-white rounded-2xl p-8 text-center">
            <h2 className="text-gray-800 font-bold text-xl mb-4">Scan to Join</h2>
            <div className="inline-block p-4 bg-white rounded-xl">
              <QRCode 
                value={`${joinUrl}?code=${liveFeed.joinCode}`}
                size={250}
                level="H"
              />
            </div>
            <p className="text-gray-600 mt-4 text-sm">
              Point your phone camera at this code
            </p>
          </div>
          
          {/* Instructions */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <h2 className="text-white font-bold text-xl mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              How to Join
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold shrink-0">
                  1
                </div>
                <div>
                  <p className="text-white font-medium text-lg">Go to</p>
                  <a 
                    href={joinUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-emerald-400 font-mono text-lg hover:underline flex items-center gap-1"
                  >
                    {joinUrl}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold shrink-0">
                  2
                </div>
                <div>
                  <p className="text-white font-medium text-lg">Enter Code</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-5xl font-bold text-emerald-400 tracking-[0.3em]">
                      {liveFeed.joinCode}
                    </p>
                    <Button
                      onClick={handleCopyCode}
                      size="sm"
                      className="bg-gray-700 hover:bg-gray-600"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold shrink-0">
                  3
                </div>
                <div>
                  <p className="text-white font-medium text-lg">Enter your name</p>
                  <p className="text-gray-400">No email or account needed!</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <p className="text-emerald-300 text-center">
                ✨ That&apos;s it! You&apos;re checked in!
              </p>
            </div>
          </div>
        </div>
        
        {/* Recent Check-ins */}
        <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              Recent Check-ins
            </h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-sm text-emerald-400">Live</span>
            </div>
          </div>
          
          <div className="divide-y divide-white/10 max-h-[300px] overflow-y-auto">
            {liveFeed.recentGuests.length > 0 ? (
              liveFeed.recentGuests.map((guest, index) => (
                <div 
                  key={index} 
                  className={`p-4 flex items-center gap-4 ${index === 0 ? "bg-emerald-500/10" : ""}`}
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                    {guest.firstName[0]}{guest.lastName[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-lg">
                      {guest.firstName} {guest.lastName}
                    </p>
                    <p className="text-sm text-gray-400">
                      Joined {new Date(guest.joinedAt).toLocaleTimeString()}
                    </p>
                  </div>
                  {index === 0 && (
                    <span className="text-emerald-400 text-sm animate-pulse">Just joined!</span>
                  )}
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-gray-400">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Waiting for attendees...</p>
                <p className="text-sm mt-1">Check-ins will appear here in real-time</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
