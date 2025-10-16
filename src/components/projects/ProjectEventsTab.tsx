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
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'project' as 'emergency' | 'meeting' | 'community' | 'project' | 'milestone',
    startDate: '',
    endDate: '',
    location: '',
    maxAttendees: 0,
    requiresApproval: false,
    milestoneTaskCount: 0, // Number of tasks to complete for this milestone
  });

  const events = useQuery(api.events.getProjectEvents, { projectId });
  const projectTasks = useQuery(api.gamifiedTasks.getProjectTasks, { projectId });
  const createEvent = useMutation(api.events.createEvent);

  // Calculate completed tasks for milestone progress
  const completedTasksCount = projectTasks?.filter(t => t.status === 'completed').length || 0;

  const handleCreateEvent = async () => {
    try {
      const startDate = new Date(formData.startDate).getTime();
      const endDate = new Date(formData.endDate).getTime();

      const eventId = await createEvent({
        title: `[${project.title}] ${formData.title}`,
        description: formData.description,
        type: formData.type,
        startDate,
        endDate,
        location: formData.location || project.location,
        maxAttendees: formData.maxAttendees || undefined,
        isPublic: false,
        requiresApproval: formData.requiresApproval,
        projectId,
        milestoneTaskCount: formData.type === 'milestone' ? formData.milestoneTaskCount : undefined,
      });

      console.log(`✅ Event created and linked to project ${projectId}`);

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
        milestoneTaskCount: 0,
      });
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event');
    }
  };

  // Note: Attend event functionality can be added later if needed

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'milestone': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'meeting': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'emergency': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'community': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'cancelled': return <AlertCircle className="w-4 h-4 text-red-400" />;
      default: return <Clock className="w-4 h-4 text-blue-400" />;
    }
  };

  const upcomingEvents = events?.filter((e: any) => e.startDate > Date.now()) || [];
  const pastEvents = events?.filter((e: any) => e.startDate <= Date.now()) || [];

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{events?.length || 0}</div>
              <div className="text-xs text-gray-400 mt-1">Total Events</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-300">{upcomingEvents.length}</div>
              <div className="text-xs text-blue-400 mt-1">Upcoming</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-300">{pastEvents.length}</div>
              <div className="text-xs text-gray-400 mt-1">Past</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Banner */}
      <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-blue-400 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-blue-400 font-medium text-sm mb-1">
              📁 Project-Specific Events: {project.title}
            </h4>
            <p className="text-blue-400/70 text-xs mb-2">
              This tab shows all events linked to this project:
            </p>
            <ul className="text-blue-400/70 text-xs space-y-1 ml-4">
              <li>• Events created directly in this tab</li>
              <li>• Events created in the main Events page with this project selected</li>
              <li>• Public events will show a 🌐 badge</li>
            </ul>
          </div>
        </div>
      </div>

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
                  <option value="project" className="bg-gray-900 text-white">Project Event</option>
                  <option value="milestone" className="bg-gray-900 text-white">🎯 Milestone</option>
                  <option value="meeting" className="bg-gray-900 text-white">Team Meeting</option>
                  <option value="community" className="bg-gray-900 text-white">Community Event</option>
                  <option value="emergency" className="bg-gray-900 text-white">Emergency</option>
                </select>
              </div>

              {/* Milestone-specific fields */}
              {formData.type === 'milestone' && (
                <div className="col-span-2 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                  <h4 className="text-purple-300 font-medium mb-3 flex items-center gap-2">
                    🎯 Milestone Configuration
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Required Tasks to Complete
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.milestoneTaskCount}
                        onChange={(e) => setFormData({ ...formData, milestoneTaskCount: parseInt(e.target.value) || 0 })}
                        placeholder="e.g., 10"
                        className="bg-gray-900/50 border-gray-700 text-white"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Number of tasks that must be completed to achieve this milestone
                      </p>
                    </div>
                  </div>
                </div>
              )}

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
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      {getStatusIcon(event.status)}
                      <h3 className="text-lg font-semibold text-white">{event.title}</h3>
                      <Badge className={`${getEventTypeColor(event.type)} capitalize`}>
                        {event.type}
                      </Badge>
                      {event.requiresApproval && (
                        <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                          Requires Approval
                        </Badge>
                      )}
                      {event.isPublic && (
                        <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                          🌐 Public Event
                        </Badge>
                      )}
                    </div>

                    <p className="text-gray-400 mb-4">{event.description}</p>

                    {/* Milestone Progress */}
                    {event.type === 'milestone' && event.milestoneTaskCount && (
                      <div className="mb-4 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-purple-300">🎯 Milestone Progress</span>
                          <span className="text-sm font-bold text-purple-200">
                            {completedTasksCount} / {event.milestoneTaskCount} Tasks
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              completedTasksCount >= event.milestoneTaskCount
                                ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                                : 'bg-gradient-to-r from-purple-500 to-purple-400'
                            }`}
                            style={{
                              width: `${Math.min((completedTasksCount / event.milestoneTaskCount) * 100, 100)}%`
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">
                            {Math.round((completedTasksCount / event.milestoneTaskCount) * 100)}% Complete
                          </span>
                          {completedTasksCount >= event.milestoneTaskCount && (
                            <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Milestone Achieved!
                            </span>
                          )}
                        </div>
                      </div>
                    )}

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

                  <div className="text-sm text-gray-400">
                    {event.attendeeCount || 0} attending
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="bg-gray-800/50 border-gray-700/50">
            <CardContent className="p-12 text-center">
              <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 font-medium">No events for "{project.title}"</p>
              <p className="text-sm text-gray-500 mt-2">
                Create project-specific events like meetings, milestones, or deadlines
              </p>
              <Button
                onClick={() => setIsCreating(true)}
                className="mt-4 bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Event
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
