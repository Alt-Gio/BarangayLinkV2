"use client";

import { Clock, MapPin, Users, User, AlertTriangle, Briefcase, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EventCardProps {
  event: any;
  onClick: () => void;
}

export function EventCard({ event, onClick }: EventCardProps) {
  const eventTypeConfig: Record<string, { bg: string; gradient: string; text: string; icon: any }> = {
    meeting: { 
      bg: "bg-blue-600", 
      gradient: "from-blue-600 to-blue-700", 
      text: "text-blue-100", 
      icon: MessageSquare 
    },
    community: { 
      bg: "bg-emerald-600", 
      gradient: "from-emerald-600 to-emerald-700", 
      text: "text-emerald-100", 
      icon: Users 
    },
    project: { 
      bg: "bg-purple-600", 
      gradient: "from-purple-600 to-purple-700", 
      text: "text-purple-100", 
      icon: Briefcase 
    },
    emergency: { 
      bg: "bg-red-600", 
      gradient: "from-red-600 to-red-700", 
      text: "text-red-100", 
      icon: AlertTriangle 
    },
  };

  const typeConfig = eventTypeConfig[event.type];
  const Icon = typeConfig.icon;
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  const isPastEvent = endDate < new Date();

  return (
    <div
      onClick={onClick}
      className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden hover:scale-105 transition-all cursor-pointer group"
    >
      {/* Event Type Header */}
      <div className={`bg-gradient-to-r ${typeConfig.gradient} p-4`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-white" />
            <span className="text-white text-sm font-medium capitalize">{event.type}</span>
          </div>
          {event.isUserAttending && (
            <Badge className="bg-white/20 text-white text-xs backdrop-blur-sm">Attending</Badge>
          )}
        </div>
        <h3 className="text-white font-bold text-lg line-clamp-2 group-hover:text-white/90 transition-colors">
          {event.title}
        </h3>
      </div>

      {/* Event Details */}
      <div className="p-4">
        <p className="text-gray-300 text-sm mb-4 line-clamp-3">
          {event.description}
        </p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span>{startDate.toLocaleDateString()}</span>
            <span className="text-gray-600">•</span>
            <span>{startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Users className="w-4 h-4 flex-shrink-0" />
            <span>
              {event.attendeeCount} attending
              {event.maxAttendees && ` / ${event.maxAttendees} max`}
            </span>
          </div>
        </div>

        {/* Organizer */}
        {event.organizer && (
          <div className="flex items-center gap-2 pt-3 border-t border-white/10">
            {event.organizer.imageUrl ? (
              <img
                src={event.organizer.imageUrl}
                alt={event.organizer.name}
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
            <span className="text-xs text-gray-400 truncate">{event.organizer.name}</span>
          </div>
        )}

        {isPastEvent && (
          <div className="mt-3 px-3 py-1 bg-gray-600 text-gray-300 text-xs rounded text-center">
            Past Event
          </div>
        )}
      </div>
    </div>
  );
}
