"use client";

import { AlertTriangle, X, Bell, MapPin, Clock, Users, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface EmergencyAlertProps {
  event: any;
  onClose: () => void;
  onViewDetails: () => void;
}

export function EmergencyAlert({ event, onClose, onViewDetails }: EmergencyAlertProps) {
  const startDate = new Date(event.startDate);
  const timeUntil = Math.ceil((event.startDate - Date.now()) / (1000 * 60)); // minutes

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-right">
      <div className="bg-red-600 rounded-xl shadow-2xl border-2 border-red-400 overflow-hidden">
        {/* Alert Header */}
        <div className="bg-red-700 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <AlertTriangle className="w-8 h-8 text-white animate-pulse" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></span>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Emergency Alert</h3>
              <p className="text-red-100 text-xs">Immediate attention required</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-red-600 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Alert Content */}
        <div className="p-4 bg-white">
          <div className="mb-3">
            <Badge className="bg-red-600 text-white mb-2">URGENT</Badge>
            <h4 className="text-lg font-bold text-gray-900 mb-1">{event.title}</h4>
            <p className="text-gray-700 text-sm line-clamp-3">{event.description}</p>
          </div>

          {/* Event Details */}
          <div className="space-y-2 mb-4 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <Clock className="w-4 h-4 text-red-600" />
              <span className="font-semibold">
                {timeUntil > 0 ? `In ${timeUntil} minutes` : 'Happening now!'}
              </span>
              <span className="text-gray-500">• {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            
            <div className="flex items-center gap-2 text-gray-700">
              <MapPin className="w-4 h-4 text-red-600" />
              <span className="font-semibold">{event.location}</span>
            </div>

            {event.organizer && (
              <div className="flex items-center gap-2 text-gray-700">
                <Bell className="w-4 h-4 text-red-600" />
                <span>Organized by <span className="font-semibold">{event.organizer.name}</span></span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={onViewDetails}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              View Details
            </Button>
            <Button
              onClick={onClose}
              className="px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-lg transition-colors"
            >
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Emergency Banner for top of page
export function EmergencyBanner({ event, onClick }: { event: any; onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="bg-red-600 text-white py-3 px-6 cursor-pointer hover:bg-red-700 transition-colors border-b-2 border-red-400"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <AlertTriangle className="w-6 h-6 animate-pulse" />
          <div>
            <p className="font-bold">EMERGENCY ALERT: {event.title}</p>
            <p className="text-sm text-red-100">{event.location} • Click for details</p>
          </div>
        </div>
        <Badge className="bg-yellow-400 text-red-900 font-bold px-3 py-1">
          URGENT
        </Badge>
      </div>
    </div>
  );
}
