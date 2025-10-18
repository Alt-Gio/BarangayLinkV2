"use client";

import { Clock, MapPin, Users, User, AlertTriangle, Briefcase, MessageSquare, Edit, Archive, RotateCcw, Trash2, MoreVertical, Target, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EventCardProps {
  event: any;
  onClick: () => void;
  onEdit?: (event: any) => void;
  onArchive?: (eventId: string) => void;
  onRestore?: (eventId: string) => void;
  onDelete?: (eventId: string) => void;
  projectName?: string;
  isOrganizer?: boolean;
  isAdmin?: boolean;
}

export function EventCard({ 
  event, 
  onClick, 
  onEdit, 
  onArchive, 
  onRestore, 
  onDelete,
  projectName,
  isOrganizer = false,
  isAdmin = false 
}: EventCardProps) {
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

  const isArchived = event.status === "archived";
  const canManage = isOrganizer || isAdmin;

  // Get event progress
  const eventProgress = useQuery(api.eventControl.getEventProgress, { eventId: event._id });

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <div
      className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden hover:border-emerald-500/50 transition-all duration-300 group shadow-xl hover:shadow-emerald-500/10 relative"
    >
      {/* Event Type Header with Actions */}
      <div className={`bg-gradient-to-r ${typeConfig.gradient} p-4 relative`}>
        <div className="absolute top-2 right-2 z-10">
          {(canManage || onEdit || onArchive) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-10 w-10 p-0 bg-white/20 hover:bg-white/30 text-white border-2 border-white/40 shadow-xl backdrop-blur-md rounded-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-5 h-5 stroke-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-900 border border-white/20 shadow-2xl">
                {!isArchived && (
                  <DropdownMenuItem
                    onClick={(e: React.MouseEvent) => handleAction(e, () => window.location.href = `/events/${event._id}/control`)}
                    className="text-emerald-400 hover:bg-emerald-600/20 cursor-pointer"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Event Control
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem
                    onClick={(e: React.MouseEvent) => handleAction(e, () => onEdit(event))}
                    className="text-blue-400 hover:bg-blue-600/20 cursor-pointer"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Event
                  </DropdownMenuItem>
                )}
                {!isArchived && onArchive && isAdmin && (
                  <DropdownMenuItem
                    onClick={(e: React.MouseEvent) => handleAction(e, () => onArchive(event._id))}
                    className="text-amber-400 hover:bg-amber-600/20 cursor-pointer"
                  >
                    <Archive className="w-4 h-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                )}
                {isArchived && onRestore && isAdmin && (
                  <DropdownMenuItem
                    onClick={(e: React.MouseEvent) => handleAction(e, () => onRestore(event._id))}
                    className="text-emerald-400 hover:bg-emerald-600/20 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Restore
                  </DropdownMenuItem>
                )}
                {isAdmin && onDelete && (
                  <DropdownMenuItem
                    onClick={(e: React.MouseEvent) => handleAction(e, () => onDelete(event._id))}
                    className="text-red-400 hover:bg-red-600/20 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Permanently
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <span className="text-white/80 text-xs font-medium uppercase tracking-wider">{event.type}</span>
          </div>
        </div>
        <h3 className="text-white font-bold text-xl line-clamp-2 group-hover:text-white transition-colors pr-8">
          {event.title}
        </h3>
      </div>

      {/* Badges Row */}
      <div className="px-4 py-2 bg-black/20 flex flex-wrap gap-2">
        {isArchived && (
          <Badge className="bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-medium">
            <Archive className="w-3 h-3 mr-1" />
            Archived
          </Badge>
        )}
        {projectName && (
          <Badge className="bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-medium">
            <Briefcase className="w-3 h-3 mr-1" />
            {projectName}
          </Badge>
        )}
        {event.isUserAttending && (
          <Badge className="bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-medium">
            ✓ Attending
          </Badge>
        )}
        {isPastEvent && !isArchived && (
          <Badge className="bg-gray-600/30 text-gray-300 border border-gray-500/30 text-xs font-medium">
            Past Event
          </Badge>
        )}
      </div>

      {/* Event Details */}
      <div className="p-4 md:p-5 space-y-3 md:space-y-4" onClick={onClick}>
        <p className="text-gray-300 text-sm line-clamp-1 md:line-clamp-2 leading-relaxed">
          {event.description}
        </p>

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-2 text-emerald-400">
              <Clock className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="text-white font-medium">
                <span className="md:hidden">{startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <span className="hidden md:inline">{startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <div className="text-gray-400 text-xs">{startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {endDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-2 text-blue-400">
              <MapPin className="w-4 h-4" />
            </div>
            <span className="text-gray-300 truncate flex-1">{event.location}</span>
          </div>
          
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-2 text-purple-400">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-gray-300">
              <span className="text-white font-medium">{event.attendeeCount}</span> attending
              {event.maxAttendees && <span className="text-gray-500"> / {event.maxAttendees} max</span>}
            </span>
          </div>
        </div>

        {/* Organizer */}
        {event.organizerDetails && (
          <div className="flex items-center gap-3 pt-4 border-t border-white/5">
            {event.organizerDetails.imageUrl ? (
              <img
                src={event.organizerDetails.imageUrl}
                alt={event.organizerDetails.name}
                className="w-8 h-8 rounded-full border-2 border-emerald-500/30"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-500">Organized by</div>
              <div className="text-sm text-gray-300 font-medium truncate">{event.organizerDetails.name}</div>
            </div>
          </div>
        )}

        {/* Event Progress */}
        {eventProgress && eventProgress.totalTasks > 0 && !isArchived && (
          <div className="pt-3 border-t border-white/5">
            <div className="flex items-center justify-between mb-2 text-xs">
              <div className="flex items-center gap-1 text-emerald-400">
                <TrendingUp className="w-3 h-3" />
                <span className="font-medium">Event Progress</span>
              </div>
              <span className="text-gray-400">
                {eventProgress.completedTasks}/{eventProgress.totalTasks} tasks
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${eventProgress.progress}%` }}
              />
            </div>
            <div className="text-right mt-1">
              <span className="text-xs font-semibold text-emerald-400">{eventProgress.progress}%</span>
            </div>
          </div>
        )}

        {/* Event Control Button */}
        {!isArchived && (
          <div className="pt-3 border-t border-white/5">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `/events/${event._id}/control`;
              }}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg"
            >
              <Target className="w-4 h-4 mr-2" />
              Event Control Board
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
