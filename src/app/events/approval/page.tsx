"use client";

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useOfflineData } from '@/contexts/OfflineDataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sidebar } from '@/components/layout/Sidebar';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Users,
  MapPin,
  Clock,
  Shield,
  Menu,
  Briefcase,
  MessageSquare,
  AlertTriangle
} from 'lucide-react';

export default function EventApprovalPage() {
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Get current user from offline context
  const { currentUser, isOnline } = useOfflineData();
  
  // Get user role
  const userRole = currentUser?.userLevel?.name || 'WORKER';
  
  // Get pending events
  const pendingEvents = useQuery(api.events.getPendingEvents);
  
  // Approval mutations
  const approveEvent = useMutation(api.events.approveEvent);
  const rejectEvent = useMutation(api.events.rejectEvent);

  const handleReview = async (action: 'approve' | 'reject') => {
    if (!selectedEvent) return;
    
    if (action === 'reject' && !feedback.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setIsSubmitting(true);
    try {
      if (action === 'approve') {
        await approveEvent({ eventId: selectedEvent._id });
      } else {
        await rejectEvent({ 
          eventId: selectedEvent._id,
          reason: feedback.trim()
        });
      }

      alert(`Event ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);
      setSelectedEvent(null);
      setFeedback('');
    } catch (error) {
      console.error('Error reviewing event:', error);
      alert('Failed to review event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'emergency': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'meeting': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'community': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'project': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'emergency': return AlertTriangle;
      case 'meeting': return MessageSquare;
      case 'community': return Users;
      case 'project': return Briefcase;
      default: return Calendar;
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (currentUser.userLevel?.name !== 'ADMIN' && currentUser.userLevel?.name !== 'MANAGER') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 flex items-center justify-center p-6">
        <Card className="bg-gray-800/50 border-gray-700/50 max-w-md">
          <CardContent className="p-12 text-center">
            <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Access Denied</h2>
            <p className="text-gray-400">Only Managers and Admins can access event approvals</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
      {/* Sidebar */}
      <Sidebar 
        userRole={userRole} 
        dashboardTitle="Event Approval"
        dashboardSubtitle="Review and approve pending events"
        isOpen={sidebarOpen}
      />

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
              <h1 className="text-3xl lg:text-4xl font-bold text-white">Event Approval</h1>
            </div>
            <p className="text-gray-400 ml-11">Review and approve pending event submissions</p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
            {/* Pending Events List */}
            <Card className="bg-gray-800/50 border-gray-700/50 h-fit xl:max-h-[calc(100vh-12rem)] xl:overflow-y-auto">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span>Pending Events</span>
                  <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                    {pendingEvents?.length || 0} Pending
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingEvents && pendingEvents.length > 0 ? (
                  pendingEvents.map((event: any) => {
                    const EventIcon = getEventTypeIcon(event.type);
                    return (
                      <div
                        key={event._id}
                        onClick={() => setSelectedEvent(event)}
                        className={`p-3 lg:p-4 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] ${
                          selectedEvent?._id === event._id
                            ? 'bg-emerald-500/10 border-emerald-500/30'
                            : 'bg-gray-900/50 border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-white mb-1">{event.title}</h3>
                            <p className="text-sm text-gray-400 mb-2 line-clamp-2">{event.description}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={`text-xs ${getEventTypeColor(event.type)}`}>
                                <EventIcon className="w-3 h-3 mr-1" />
                                {event.type}
                              </Badge>
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(event.startDate).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 pt-3 border-t border-gray-700">
                          <Users className="w-3 h-3" />
                          <span>By: {event.organizerName}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-16">
                    <div className="mb-6">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-700/50 flex items-center justify-center">
                        <CheckCircle className="w-10 h-10 text-emerald-500" />
                      </div>
                      <div className="mb-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700/50 rounded-full">
                          <span className="text-3xl font-bold text-white">0</span>
                          <span className="text-gray-400">Events</span>
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">No Pending Approvals</h3>
                      <p className="text-gray-400 mb-1">All events have been reviewed</p>
                      <p className="text-sm text-gray-500">New events requiring approval will appear here</p>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
                      <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></div>
                      <span>System ready for new submissions</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Event Details & Review */}
            <Card className="bg-gray-800/50 border-gray-700/50 h-fit xl:sticky xl:top-8">
              <CardHeader>
                <CardTitle className="text-white">
                  {selectedEvent ? 'Event Details' : 'Select an Event'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedEvent ? (
                  <div className="space-y-6">
                    {/* Event Image */}
                    {selectedEvent.imageUrl && (
                      <div className="aspect-video rounded-lg overflow-hidden bg-gray-900">
                        <img
                          src={selectedEvent.imageUrl}
                          alt={selectedEvent.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop';
                          }}
                        />
                      </div>
                    )}

                    {/* Event Info */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-2">{selectedEvent.title}</h3>
                        <p className="text-gray-300">{selectedEvent.description}</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 pt-4 border-t border-gray-700">
                        <div className="flex items-start gap-2">
                          <Calendar className="w-5 h-5 text-emerald-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Start Date</p>
                            <p className="text-sm font-medium text-white">
                              {new Date(selectedEvent.startDate).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Clock className="w-5 h-5 text-emerald-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">End Date</p>
                            <p className="text-sm font-medium text-white">
                              {new Date(selectedEvent.endDate).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <MapPin className="w-5 h-5 text-emerald-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Location</p>
                            <p className="text-sm font-medium text-white">{selectedEvent.location}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Users className="w-5 h-5 text-emerald-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Organizer</p>
                            <p className="text-sm font-medium text-white">{selectedEvent.organizerName}</p>
                          </div>
                        </div>
                      </div>

                      {/* Event Settings */}
                      <div className="pt-4 border-t border-gray-700">
                        <p className="text-xs font-semibold text-gray-400 mb-2">EVENT SETTINGS</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedEvent.isPublic && (
                            <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30">Public Event</Badge>
                          )}
                          {selectedEvent.allowPublicRSVP && (
                            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">Open RSVP</Badge>
                          )}
                          {selectedEvent.allowDocumentUpload && (
                            <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/30">Document Required</Badge>
                          )}
                          {selectedEvent.maxAttendees && (
                            <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/30">Max: {selectedEvent.maxAttendees}</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Feedback Textarea */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Feedback (Optional for approval, required for rejection)
                      </label>
                      <Textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Provide feedback to the organizer..."
                        className="bg-gray-900 border-gray-700 text-white min-h-[100px]"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        onClick={() => handleReview('approve')}
                        disabled={isSubmitting}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve Event
                      </Button>
                      <Button
                        onClick={() => handleReview('reject')}
                        disabled={isSubmitting}
                        variant="destructive"
                        className="flex-1"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject Event
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-700/50 flex items-center justify-center">
                      <AlertCircle className="w-10 h-10 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Select an Event to Review</h3>
                    <p className="text-gray-400 mb-2">Choose a pending event from the list</p>
                    <p className="text-sm text-gray-500">Event details will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
