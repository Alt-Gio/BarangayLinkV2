"use client";

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Plus, 
  X,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface ProjectEventsTabProps {
  projectId: Id<"projects">;
  project: any;
}

export function ProjectEventsTab({ projectId, project }: ProjectEventsTabProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'project' as 'project' | 'meeting' | 'milestone' | 'deadline',
    startDate: '',
    endDate: '',
    location: '',
    maxAttendees: 0,
    requiresApproval: false,
  });

  const events = useQuery(api.events.getProjectEvents, { projectId });
  const createEvent = useMutation(api.events.createEvent);
  const attendEvent = useMutation(api.events.attendEvent);

  const handleCreateEvent = async () => {
    try {
      const startDate = new Date(formData.startDate).getTime();
      const endDate = new Date(formData.endDate).getTime();

      await createEvent({
        title: formData.title,
        description: formData.description,
        type: formData.type,
        status: 'published',
        startDate,
        endDate,
        location: formData.location || project.location,
        maxAttendees: formData.maxAttendees || undefined,
        isPublic: false,
        requiresApproval: formData.requiresApproval,
        projectId,
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        type: 'project',
        startDate: '',
        endDate: '',
        location: '',
        maxAttendees: 0,
        requiresApproval: false,
      });
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event');
    }
  };

  const handleAttendEvent = async (eventId: Id<"events">) => {
    try {
      await attendEvent({ eventId });
    } catch (error) {
      console.error('Error attending event:', error);
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'milestone': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'meeting': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'deadline': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'cancelled': return <AlertCircle className="w-4 h-4 text-red-400" />;
      default: return <Clock className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Event Button */}
      {!isCreating && (
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Project Event
        </Button>
      )}

      {/* Create Event Form */}
      {isCreating && (
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Create New Event</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCreating(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Event Title
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter event title"
                  className="bg-gray-900/50 border-gray-700 text-white"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter event description"
                  rows={3}
                  className="bg-gray-900/50 border-gray-700 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Event Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-md text-white"
                >
                  <option value="project">Project Event</option>
                  <option value="meeting">Team Meeting</option>
                  <option value="milestone">Milestone</option>
                  <option value="deadline">Deadline</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Location
                </label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder={project.location || "Enter location"}
                  className="bg-gray-900/50 border-gray-700 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Start Date & Time
                </label>
                <Input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="bg-gray-900/50 border-gray-700 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  End Date & Time
                </label>
                <Input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="bg-gray-900/50 border-gray-700 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Attendees (0 = unlimited)
                </label>
                <Input
                  type="number"
                  value={formData.maxAttendees}
                  onChange={(e) => setFormData({ ...formData, maxAttendees: parseInt(e.target.value) || 0 })}
                  min="0"
                  className="bg-gray-900/50 border-gray-700 text-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="requiresApproval"
                  checked={formData.requiresApproval}
                  onChange={(e) => setFormData({ ...formData, requiresApproval: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="requiresApproval" className="text-sm text-gray-300">
                  Requires attendance approval
                </label>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsCreating(false)}
                className="border-gray-600 text-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateEvent}
                disabled={!formData.title || !formData.startDate || !formData.endDate}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Create Event
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Events List */}
      <div className="grid gap-4">
        {events && events.length > 0 ? (
          events.map((event: any) => (
            <Card key={event._id} className="bg-gray-800/50 border-gray-700/50 hover:border-gray-600/50 transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {getStatusIcon(event.status)}
                      <h3 className="text-lg font-semibold text-white">{event.title}</h3>
                      <Badge className={`${getEventTypeColor(event.type)} capitalize`}>
                        {event.type}
                      </Badge>
                    </div>

                    <p className="text-gray-400 mb-4">{event.description}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <div>
                          <div className="text-xs text-gray-500">Start</div>
                          <div className="text-white">
                            {new Date(event.startDate).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-gray-400">
                        <Clock className="w-4 h-4" />
                        <div>
                          <div className="text-xs text-gray-500">End</div>
                          <div className="text-white">
                            {new Date(event.endDate).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(event.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>

                      {event.location && (
                        <div className="flex items-center gap-2 text-gray-400">
                          <MapPin className="w-4 h-4" />
                          <div>
                            <div className="text-xs text-gray-500">Location</div>
                            <div className="text-white">{event.location}</div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-gray-400">
                        <Users className="w-4 h-4" />
                        <div>
                          <div className="text-xs text-gray-500">Attendees</div>
                          <div className="text-white">
                            {event.attendees?.length || 0}
                            {event.maxAttendees ? ` / ${event.maxAttendees}` : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleAttendEvent(event._id)}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Attend
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="bg-gray-800/50 border-gray-700/50">
            <CardContent className="p-12 text-center">
              <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No events yet for this project</p>
              <p className="text-sm text-gray-500 mt-2">Create your first event to get started</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
