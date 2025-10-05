"use client";

import { Clock, MapPin, Users, User, AlertTriangle, Briefcase, MessageSquare, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EventsListProps {
  events: any[];
  onEventClick: (event: any) => void;
}

export function EventsList({ events, onEventClick }: EventsListProps) {
  const eventTypeConfig: Record<string, { bg: string; text: string; icon: any }> = {
    meeting: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", icon: MessageSquare },
    community: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", icon: Users },
    project: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-400", icon: Briefcase },
    emergency: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", icon: AlertTriangle },
  };

  if (events.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-12 text-center">
        <Globe className="w-16 h-16 text-gray-500 mx-auto mb-4 opacity-50" />
        <h3 className="text-xl font-semibold text-gray-300 mb-2">No Events Found</h3>
        <p className="text-gray-400">Try adjusting your filters or search query</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map(event => {
        const typeConfig = eventTypeConfig[event.type];
        const Icon = typeConfig.icon;
        const startDate = new Date(event.startDate);
        const endDate = new Date(event.endDate);
        const isPastEvent = endDate < new Date();

        return (
          <div
            key={event._id}
            onClick={() => onEventClick(event)}
            className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6 hover:bg-white/10 transition-all cursor-pointer group"
          >
            <div className="flex items-start gap-4">
              {/* Event Date Box */}
              <div className="flex-shrink-0 text-center bg-emerald-600 rounded-lg p-3 w-16">
                <div className="text-white text-2xl font-bold">
                  {startDate.getDate()}
                </div>
                <div className="text-emerald-200 text-xs font-medium uppercase">
                  {startDate.toLocaleString('default', { month: 'short' })}
                </div>
              </div>

              {/* Event Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                        {event.title}
                      </h3>
                      {event.isUserAttending && (
                        <Badge className="bg-emerald-600 text-white text-xs">Attending</Badge>
                      )}
                      {isPastEvent && (
                        <Badge className="bg-gray-600 text-white text-xs">Past</Badge>
                      )}
                    </div>
                    <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                      {event.description}
                    </p>
                  </div>

                  {/* Event Type Badge */}
                  <div className={`px-3 py-1 rounded-lg ${typeConfig.bg} flex items-center gap-2 flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${typeConfig.text}`} />
                    <span className={`text-sm font-medium ${typeConfig.text} capitalize`}>
                      {event.type}
                    </span>
                  </div>
                </div>

                {/* Event Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <span>
                      {startDate.toLocaleDateString()} • {startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Users className="w-4 h-4 flex-shrink-0" />
                    <span>
                      {event.attendeeCount} {event.attendeeCount === 1 ? 'attendee' : 'attendees'}
                      {event.maxAttendees && ` / ${event.maxAttendees} max`}
                    </span>
                  </div>
                </div>

                {/* Organizer */}
                {event.organizer && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
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
                    <span className="text-sm text-gray-400">
                      Organized by <span className="text-white font-medium">{event.organizer.name}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
