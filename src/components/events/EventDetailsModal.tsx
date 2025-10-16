"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  User, 
  Check,
  AlertTriangle, 
  Briefcase, 
  MessageSquare,
  Edit,
  Trash2,
  UserPlus,
  UserMinus,
  Globe,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface EventDetailsModalProps {
  event: any;
  isOpen: boolean;
  onClose: () => void;
}

export function EventDetailsModal({ event, isOpen, onClose }: EventDetailsModalProps) {
  const rsvpToEvent = useMutation(api.events.rsvpToEvent);
  const deleteEvent = useMutation(api.events.deleteEvent);
  
  // Get image URL if event has an image
  const imageUrl = useQuery(
    api.documents.getFileUrl,
    event?.imageUrl ? { storageId: event.imageUrl } : "skip"
  );
  
  const [isRsvping, setIsRsvping] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !event) return null;

  const eventTypeConfig: Record<string, { bg: string; gradient: string; text: string; icon: any }> = {
    meeting: { 
      bg: "bg-blue-600", 
      gradient: "from-blue-600 to-blue-700", 
      text: "text-blue-400", 
      icon: MessageSquare 
    },
    community: { 
      bg: "bg-emerald-600", 
      gradient: "from-emerald-600 to-emerald-700", 
      text: "text-emerald-400", 
      icon: Users 
    },
    project: { 
      bg: "bg-purple-600", 
      gradient: "from-purple-600 to-purple-700", 
      text: "text-purple-400", 
      icon: Briefcase 
    },
    emergency: { 
      bg: "bg-red-600", 
      gradient: "from-red-600 to-red-700", 
      text: "text-red-400", 
      icon: AlertTriangle 
    },
  };

  const typeConfig = eventTypeConfig[event.type];
  const Icon = typeConfig.icon;
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  const isPastEvent = endDate < new Date();
  const isAtCapacity = event.maxAttendees && event.attendeeCount >= event.maxAttendees;

  const handleRSVP = async (action: "join" | "leave") => {
    setIsRsvping(true);
    try {
      await rsvpToEvent({ eventId: event._id, action });
      onClose(); // Refresh data by closing modal
    } catch (error) {
      console.error("RSVP error:", error);
      alert(error instanceof Error ? error.message : "Failed to RSVP");
    } finally {
      setIsRsvping(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    
    setIsDeleting(true);
    try {
      await deleteEvent({ eventId: event._id });
      onClose();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete event");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-white/20 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Event Image (if available) */}
        {imageUrl && (
          <div className="relative h-64 overflow-hidden">
            <img 
              src={imageUrl} 
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          </div>
        )}
        
        {/* Header with Event Type */}
        <div className={`bg-gradient-to-r ${typeConfig.gradient} p-6`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white/80 text-sm font-medium capitalize">{event.type}</p>
                <h2 className="text-2xl font-bold text-white mt-1">{event.title}</h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Event Status Badges */}
          <div className="flex flex-wrap gap-2">
            {event.isUserAttending && (
              <Badge className="bg-white/20 text-white backdrop-blur-sm flex items-center gap-1">
                <Check className="w-3 h-3" />
                You're attending
              </Badge>
            )}
            {isPastEvent && (
              <Badge className="bg-gray-700 text-gray-300">Past Event</Badge>
            )}
            {event.isPublic ? (
              <Badge className="bg-white/20 text-white backdrop-blur-sm flex items-center gap-1">
                <Globe className="w-3 h-3" />
                Public
              </Badge>
            ) : (
              <Badge className="bg-white/20 text-white backdrop-blur-sm flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Private
              </Badge>
            )}
            {isAtCapacity && (
              <Badge className="bg-yellow-600 text-white">At Capacity</Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{event.description}</p>
          </div>

          {/* Event Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-medium text-gray-400">Start Date & Time</span>
              </div>
              <p className="text-white font-semibold">{startDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p className="text-gray-400 text-sm">{startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
            </div>

            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-medium text-gray-400">End Date & Time</span>
              </div>
              <p className="text-white font-semibold">{endDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p className="text-gray-400 text-sm">{endDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
            </div>

            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-medium text-gray-400">Location</span>
              </div>
              <p className="text-white font-semibold">{event.location}</p>
            </div>

            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-medium text-gray-400">Attendees</span>
              </div>
              <p className="text-white font-semibold">
                {event.attendeeCount} {event.attendeeCount === 1 ? 'person' : 'people'}
                {event.maxAttendees && ` / ${event.maxAttendees} max`}
              </p>
            </div>
          </div>

          {/* Organizer */}
          {event.organizer && (
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Organized by</h3>
              <div className="flex items-center gap-3">
                {event.organizer.imageUrl ? (
                  <img
                    src={event.organizer.imageUrl}
                    alt={event.organizer.name}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                )}
                <div>
                  <p className="text-white font-semibold">{event.organizer.name}</p>
                  <p className="text-gray-400 text-sm">{event.organizer.department || 'Community Member'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Attendees List */}
          {event.attendeesList && event.attendeesList.length > 0 && (
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Attendees ({event.attendeeCount})</h3>
              <div className="flex flex-wrap gap-2">
                {event.attendeesList.map((attendee: any) => (
                  <div key={attendee._id} className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/10">
                    {attendee.imageUrl ? (
                      <img
                        src={attendee.imageUrl}
                        alt={attendee.name}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <span className="text-sm text-white">{attendee.name}</span>
                  </div>
                ))}
                {event.attendeeCount > 10 && (
                  <div className="px-3 py-2 bg-white/5 rounded-lg border border-white/10">
                    <span className="text-sm text-gray-400">+{event.attendeeCount - 10} more</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            {!isPastEvent && (
              <>
                {event.isUserAttending ? (
                  <Button
                    onClick={() => handleRSVP("leave")}
                    disabled={isRsvping}
                    className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <UserMinus className="w-5 h-5" />
                    {isRsvping ? "Leaving..." : "Leave Event"}
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleRSVP("join")}
                    disabled={isRsvping || isAtCapacity}
                    className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <UserPlus className="w-5 h-5" />
                    {isRsvping ? "Joining..." : isAtCapacity ? "Event Full" : "Join Event"}
                  </Button>
                )}
              </>
            )}
            
            {event.canEdit && (
              <>
                <Button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Trash2 className="w-5 h-5" />
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
