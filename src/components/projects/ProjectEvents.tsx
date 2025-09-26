"use client";

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, MapPin, Users, Edit, Trash2, Bell, Megaphone, Send } from 'lucide-react';

import { Id } from '../../../convex/_generated/dataModel';

interface ProjectEventsProps {
  projectId: Id<"projects">;
  events: any[];
  currentUser: any;
  canManageEvents: boolean;
}

export function ProjectEvents({ projectId, events, currentUser, canManageEvents }: ProjectEventsProps) {
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [isCreatingNotification, setIsCreatingNotification] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    type: 'project',
    startDate: '',
    endDate: '',
    location: '',
    maxAttendees: ''
  });
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    scheduledFor: '',
    targetRoles: [] as string[],
    priority: 'medium'
  });

  const createEvent = useMutation(api.events.createProjectEvent);
  const joinEvent = useMutation(api.events.joinEvent);
  const createNotification = useMutation(api.notifications.createProjectNotification);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-blue-900/20 text-blue-400 border-blue-700';
      case 'community': return 'bg-green-900/20 text-green-400 border-green-700';
      case 'project': return 'bg-purple-900/20 text-purple-400 border-purple-700';
      case 'emergency': return 'bg-red-900/20 text-red-400 border-red-700';
      default: return 'bg-gray-900/20 text-gray-400 border-gray-700';
    }
  };

  const handleCreateEvent = async () => {
    if (!eventForm.title || !eventForm.startDate || !eventForm.location) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      await createEvent({
        projectId,
        title: eventForm.title,
        description: eventForm.description,
        type: eventForm.type as any,
        startDate: new Date(eventForm.startDate).getTime(),
        endDate: eventForm.endDate ? new Date(eventForm.endDate).getTime() : new Date(eventForm.startDate).getTime() + (2 * 60 * 60 * 1000), // Default 2 hours
        location: eventForm.location,
        maxAttendees: parseInt(eventForm.maxAttendees) || undefined
      });
      
      setEventForm({
        title: '',
        description: '',
        type: 'project',
        startDate: '',
        endDate: '',
        location: '',
        maxAttendees: ''
      });
      setIsCreatingEvent(false);
    } catch (error) {
      alert("Error creating event: " + error);
    }
  };

  const handleCreateNotification = async () => {
    if (!notificationForm.title) {
      alert("Please enter a notification title");
      return;
    }

    try {
      await createNotification({
        projectId,
        title: notificationForm.title,
        message: notificationForm.message,
        type: 'announcement',
        scheduledFor: notificationForm.scheduledFor ? 
          new Date(notificationForm.scheduledFor).getTime() : undefined,
        targetRoles: notificationForm.targetRoles.length > 0 ? notificationForm.targetRoles : undefined,
        priority: notificationForm.priority as any
      });
      
      setNotificationForm({
        title: '',
        message: '',
        scheduledFor: '',
        targetRoles: [],
        priority: 'medium'
      });
      setIsCreatingNotification(false);
    } catch (error) {
      alert("Error creating notification: " + error);
    }
  };

  const handleJoinEvent = async (eventId: string) => {
    try {
      await joinEvent({ eventId: eventId as any });
    } catch (error) {
      alert("Error joining event: " + error);
    }
  };

  const canJoinEvent = (event: any) => {
    return !event.attendees?.includes(currentUser._id) && 
           (!event.maxAttendees || event.attendees?.length < event.maxAttendees);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Project Events & Notifications</h2>
          <p className="text-gray-400">Manage project events and send announcements to team members</p>
        </div>
        {canManageEvents && (
          <div className="flex gap-3">
            <Button 
              onClick={() => setIsCreatingNotification(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Bell className="w-4 h-4 mr-2" />
              Send Notification
            </Button>
            <Button 
              onClick={() => setIsCreatingEvent(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          </div>
        )}
      </div>

      {/* Create Event Form */}
      {isCreatingEvent && (
        <div className="bg-gray-700/50 rounded-lg p-6 mb-6 border border-gray-600">
          <h3 className="text-lg font-semibold text-white mb-4">Create Project Event</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Event Title *</label>
                <Input
                  value={eventForm.title}
                  onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                  placeholder="e.g., Project Kickoff Meeting"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <Textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                  placeholder="Event details and agenda"
                  rows={3}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Location *</label>
                <Input
                  value={eventForm.location}
                  onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
                  placeholder="Barangay Hall, Conference Room A"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Event Type</label>
                <Select value={eventForm.type} onValueChange={(value) => setEventForm({...eventForm, type: value})}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="project">Project Event</SelectItem>
                    <SelectItem value="community">Community Event</SelectItem>
                    <SelectItem value="emergency">Emergency Meeting</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Start Date *</label>
                  <Input
                    type="datetime-local"
                    value={eventForm.startDate}
                    onChange={(e) => setEventForm({...eventForm, startDate: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
                  <Input
                    type="datetime-local"
                    value={eventForm.endDate}
                    onChange={(e) => setEventForm({...eventForm, endDate: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Max Attendees (Optional)</label>
                <Input
                  type="number"
                  value={eventForm.maxAttendees}
                  onChange={(e) => setEventForm({...eventForm, maxAttendees: e.target.value})}
                  placeholder="Leave empty for unlimited"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setIsCreatingEvent(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button onClick={handleCreateEvent} className="bg-green-600 hover:bg-green-700">
              Create Event
            </Button>
          </div>
        </div>
      )}

      {/* Create Notification Form */}
      {isCreatingNotification && (
        <div className="bg-gray-700/50 rounded-lg p-6 mb-6 border border-gray-600">
          <div className="flex items-center gap-3 mb-4">
            <Megaphone className="w-6 h-6 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Send Project Notification</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Notification Title *</label>
              <Input
                value={notificationForm.title}
                onChange={(e) => setNotificationForm({...notificationForm, title: e.target.value})}
                placeholder="e.g., Important Project Update"
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Message</label>
              <Textarea
                value={notificationForm.message}
                onChange={(e) => setNotificationForm({...notificationForm, message: e.target.value})}
                placeholder="Notification details and important information..."
                rows={4}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
                <Select 
                  value={notificationForm.priority} 
                  onValueChange={(value) => setNotificationForm({...notificationForm, priority: value})}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="low">Low Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Schedule For (Optional)</label>
                <Input
                  type="datetime-local"
                  value={notificationForm.scheduledFor}
                  onChange={(e) => setNotificationForm({...notificationForm, scheduledFor: e.target.value})}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Target Roles</label>
                <Select 
                  value={notificationForm.targetRoles[0] || "all"} 
                  onValueChange={(value) => setNotificationForm({
                    ...notificationForm, 
                    targetRoles: value === "all" ? [] : [value]
                  })}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="All team members" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="all">All team members</SelectItem>
                    <SelectItem value="WORKER">Workers only</SelectItem>
                    <SelectItem value="BUILDER">Builders only</SelectItem>
                    <SelectItem value="MANAGER">Managers only</SelectItem>
                    <SelectItem value="ADMIN">Admins only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Notification Preview */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-gray-300">Preview</span>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-white">
                  {notificationForm.title || "Notification Title"}
                </h4>
                <p className="text-gray-400 text-sm">
                  {notificationForm.message || "Notification message will appear here..."}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>Priority: {notificationForm.priority}</span>
                  {notificationForm.targetRoles.length > 0 && (
                    <span>• Target: {notificationForm.targetRoles.join(", ")}</span>
                  )}
                  {notificationForm.scheduledFor && (
                    <span>• Scheduled: {new Date(notificationForm.scheduledFor).toLocaleString()}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setIsCreatingNotification(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button onClick={handleCreateNotification} className="bg-blue-600 hover:bg-blue-700">
              <Send className="w-4 h-4 mr-2" />
              Send Notification
            </Button>
          </div>
        </div>
      )}

      {/* Events List */}
      {events.length === 0 ? (
        <div className="bg-gray-700/30 rounded-lg p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">No Events Scheduled</h3>
          <p className="text-gray-500">
            {canManageEvents ? "Create your first project event to get started." : "No events scheduled for this project yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {events.map((event) => (
            <div key={event._id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">{event.title}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className={getTypeColor(event.type)} variant="outline">
                      {event.type}
                    </Badge>
                    {event.status === 'cancelled' && (
                      <Badge variant="destructive">Cancelled</Badge>
                    )}
                  </div>
                </div>
                
                {canManageEvents && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="border-gray-600 text-gray-300">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
              
              {event.description && (
                <p className="text-gray-400 mb-4">{event.description}</p>
              )}
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-400">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>{new Date(event.startDate).toLocaleString()}</span>
                  {event.endDate && event.endDate !== event.startDate && (
                    <span className="ml-2">- {new Date(event.endDate).toLocaleString()}</span>
                  )}
                </div>
                
                <div className="flex items-center text-sm text-gray-400">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>{event.location}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-400">
                  <Users className="w-4 h-4 mr-2" />
                  <span>
                    {event.attendees?.length || 0} attending
                    {event.maxAttendees && ` / ${event.maxAttendees} max` }
                  </span>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                {canJoinEvent(event) ? (
                  <Button 
                    size="sm" 
                    onClick={() => handleJoinEvent(event._id)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Join Event
                  </Button>
                ) : event.attendees?.includes(currentUser._id) ? (
                  <Badge variant="outline" className="text-green-400 border-green-600">
                    You're attending
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-gray-400">
                    Event Full
                  </Badge>
                )}
                
                <span className="text-sm text-gray-400">
                  {event.startDate > Date.now() ? (
                    <>Starts in {Math.ceil((event.startDate - Date.now()) / (1000 * 60 * 60 * 24))} days</>
                  ) : event.endDate > Date.now() ? (
                    <span className="text-green-400">Happening now</span>
                  ) : (
                    <span className="text-gray-500">Completed</span>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
