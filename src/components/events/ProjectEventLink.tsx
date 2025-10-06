"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Briefcase, Plus, X, Calendar, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProjectEventLinkProps {
  projectId: string;
}

export function ProjectEventLink({ projectId }: ProjectEventLinkProps) {
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const createProjectEvent = useMutation(api.events.createProjectEvent);
  const projectEvents = useQuery(api.events.getProjectEvents, { 
    projectId: projectId as any 
  });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "project" as const,
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    location: "",
    isPublic: true,
    requiresApproval: false,
    notifyTeam: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`).getTime();
      const endDateTime = formData.endDate && formData.endTime
        ? new Date(`${formData.endDate}T${formData.endTime}`).getTime()
        : startDateTime + (2 * 60 * 60 * 1000);

      await createProjectEvent({
        projectId: projectId as any,
        title: formData.title,
        description: formData.description,
        type: formData.type,
        startDate: startDateTime,
        endDate: endDateTime,
        location: formData.location,
        isPublic: formData.isPublic,
        requiresApproval: formData.requiresApproval,
        notifyTeam: formData.notifyTeam,
      });

      setIsCreatingEvent(false);
      setFormData({
        title: "",
        description: "",
        type: "project",
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
        location: "",
        isPublic: true,
        requiresApproval: false,
        notifyTeam: true,
      });
    } catch (error) {
      console.error("Failed to create event:", error);
      alert(error instanceof Error ? error.message : "Failed to create event");
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-500" />
          Project Events
        </h3>
        <Button
          onClick={() => setIsCreatingEvent(!isCreatingEvent)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
        >
          {isCreatingEvent ? (
            <>
              <X className="w-4 h-4" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Add Event
            </>
          )}
        </Button>
      </div>

      {/* Create Event Form */}
      {isCreatingEvent && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Event Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g., Project Kickoff Meeting"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              placeholder="Event details..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Start Time</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Meeting location"
              required
            />
          </div>

          <div className="flex gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.notifyTeam}
                onChange={(e) => setFormData({ ...formData, notifyTeam: e.target.checked })}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-emerald-600"
              />
              Notify team
            </label>
          </div>

          <Button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-medium"
          >
            Create Project Event
          </Button>
        </form>
      )}

      {/* Events List */}
      <div className="space-y-3">
        {projectEvents && projectEvents.length > 0 ? (
          projectEvents.map((event: any) => {
            const startDate = new Date(event.startDate);
            const isPast = new Date(event.endDate) < new Date();

            return (
              <div
                key={event._id}
                className={`p-4 rounded-lg border transition-all ${
                  isPast 
                    ? "bg-white/5 border-white/10 opacity-60" 
                    : "bg-purple-600/20 border-purple-500/30 hover:bg-purple-600/30"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="text-white font-semibold">{event.title}</h4>
                    <p className="text-gray-300 text-sm mt-1 line-clamp-2">{event.description}</p>
                  </div>
                  {isPast && (
                    <span className="text-xs text-gray-400 bg-gray-600 px-2 py-1 rounded">Past</span>
                  )}
                </div>

                <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {startDate.toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {event.location}
                  </div>
                </div>

                {event.organizer && (
                  <div className="mt-2 pt-2 border-t border-white/10 text-xs text-gray-400">
                    Organized by {event.organizer.name}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Briefcase className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No events scheduled for this project</p>
          </div>
        )}
      </div>
    </div>
  );
}
