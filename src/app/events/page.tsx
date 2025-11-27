"use client";

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useOfflineData } from '@/contexts/OfflineDataContext';
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import RippleLoader from '@/components/ui/RippleLoader';
import { 
  Calendar, 
  List, 
  Grid, 
  Plus, 
  Filter,
  Search,
  Clock,
  MapPin,
  Users,
  AlertTriangle,
  Briefcase,
  MessageSquare,
  Globe,
  Menu,
  Download,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/Sidebar";
import { CalendarView } from "@/components/events/CalendarView";
import { WeekView } from "@/components/events/WeekView";
import { DayView } from "@/components/events/DayView";
import { EventsList } from "@/components/events/EventsList";
import { EventCard } from "@/components/events/EventCard";
import { CreateEventModal } from "@/components/events/CreateEventModal";
import { EditEventModal } from "@/components/events/EditEventModal";
import { EventDetailsModal } from "@/components/events/EventDetailsModal";
import { EmergencyAlert, EmergencyBanner } from "@/components/events/EmergencyAlert";

export const dynamic = 'force-dynamic';

type ViewMode = "month" | "week" | "day" | "list" | "grid";
type EventType = "all" | "meeting" | "community" | "project" | "emergency";

export default function EventsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [eventType, setEventType] = useState<EventType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [emergencyAlerts, setEmergencyAlerts] = useState<any[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  
  // Get current user from offline context (cached, saves bandwidth)
  const { currentUser, isOnline } = useOfflineData();

  // Voice assistant integration state
  const [defaultEventTitle, setDefaultEventTitle] = useState("");

  // Voice assistant integration: Auto-open create modal from URL params
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'create') {
      // Check if title was provided via voice command
      const title = searchParams.get('title');
      if (title) {
        setDefaultEventTitle(decodeURIComponent(title));
      }
      setIsCreateModalOpen(true);
      // Clear the params from URL to prevent re-triggering
      router.replace('/events', { scroll: false });
    }
  }, [searchParams, router]);
  
  // Mutations for event actions
  const archiveEvent = useMutation(api.events.archiveEvent);
  const restoreEvent = useMutation(api.events.restoreEvent);
  const deleteEvent = useMutation(api.events.deleteEvent);
  
  const events = useQuery(api.events.getAllEvents, {
    type: eventType === "all" ? undefined : eventType,
    status: "published",
  });

  const upcomingEvents = useQuery(api.events.getUpcomingEvents, { limit: 10 });
  const exportData = useQuery(api.events.getEventsForExport, {});

  // Check for emergency events
  useEffect(() => {
    if (events) {
      const emergencies = events.filter(e => 
        e.type === "emergency" && 
        new Date(e.endDate) > new Date() &&
        !dismissedAlerts.includes(e._id)
      );
      setEmergencyAlerts(emergencies);
    }
  }, [events, dismissedAlerts]);

  // Redirect to login if not authenticated
  if (isLoaded && !user) {
    router.push('/login');
    return null;
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <RippleLoader size="lg" color="emerald" text="Loading events..." />
      </div>
    );
  }

  // Filter events based on search
  const filteredEvents = events?.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.location.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Export functions
  const exportToCSV = () => {
    if (!exportData) return;
    
    const headers = ['Title', 'Type', 'Status', 'Start Date', 'End Date', 'Location', 'Organizer', 'Attendees'];
    const rows = exportData.map(e => [
      e.title,
      e.type,
      e.status,
      new Date(e.startDate).toLocaleString(),
      new Date(e.endDate).toLocaleString(),
      e.location,
      e.organizer,
      e.attendeeCount.toString()
    ]);
    
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `events-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const eventTypeColors: Record<string, { bg: string; text: string; icon: any }> = {
    meeting: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", icon: MessageSquare },
    community: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", icon: Users },
    project: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-400", icon: Briefcase },
    emergency: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", icon: AlertTriangle },
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Sidebar 
        userRole={currentUser?.userLevel?.name || "WORKER"}
        dashboardTitle="Events"
        dashboardSubtitle="Manage events and calendar"
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="flex-1 overflow-y-auto">
        {/* Mobile Header with Filters */}
        <div className="md:hidden bg-gray-800 sticky top-0 z-50">
          {/* Top Bar */}
          <div className="p-4 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-white">Events & Calendar</h1>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                console.log('Create Event button clicked!');
                setIsCreateModalOpen(true);
              }}
              className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          {/* Mobile Search */}
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          
          {/* Mobile Event Type Filter - Icons with Labels */}
          <div className="px-4 pb-3 overflow-x-auto no-scrollbar">
            <div className="flex gap-2">
              {[
                { value: "all" as const, label: "All Events", shortLabel: "All", icon: Globe },
                { value: "meeting" as const, label: "Meetings", shortLabel: "Meet", icon: MessageSquare },
                { value: "community" as const, label: "Community", shortLabel: "Community", icon: Users },
                { value: "project" as const, label: "Projects", shortLabel: "Projects", icon: Briefcase },
                { value: "emergency" as const, label: "Emergency", shortLabel: "Emergency", icon: AlertTriangle },
              ].map(({ value, label, shortLabel, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setEventType(value)}
                  className={`flex-shrink-0 px-3 py-2 rounded-lg flex flex-col sm:flex-row items-center gap-1 sm:gap-2 transition-all min-w-[70px] sm:min-w-0 ${
                    eventType === value
                      ? "bg-emerald-600 text-white shadow-lg"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                  title={label}
                >
                  <Icon className="w-5 h-5 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm whitespace-nowrap">{shortLabel}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Mobile View Mode Switcher - ONLY List and Grid */}
          <div className="px-4 pb-4 flex gap-3">
            <button
              onClick={() => setViewMode("list")}
              className={`flex-1 p-3 rounded-xl transition-all flex items-center justify-center gap-2 font-medium ${
                viewMode === "list" ? "bg-emerald-600 text-white" : "bg-gray-700 text-gray-400 hover:bg-gray-600"
              }`}
            >
              <List className="w-5 h-5" />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`flex-1 p-3 rounded-xl transition-all flex items-center justify-center gap-2 font-medium ${
                viewMode === "grid" ? "bg-emerald-600 text-white" : "bg-gray-700 text-gray-400 hover:bg-gray-600"
              }`}
            >
              <Grid className="w-5 h-5" />
              <span>Grid</span>
            </button>
          </div>
        </div>
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Emergency Banner */}
      {emergencyAlerts.length > 0 && emergencyAlerts[0] && (
        <EmergencyBanner 
          event={emergencyAlerts[0]} 
          onClick={() => setSelectedEvent(emergencyAlerts[0])}
        />
      )}

      {/* Emergency Alerts (Floating) */}
      {emergencyAlerts.slice(1, 3).map((alert, index) => (
        <div key={alert._id} style={{ top: `${80 + (index * 280)}px` }}>
          <EmergencyAlert
            event={alert}
            onClose={() => setDismissedAlerts([...dismissedAlerts, alert._id])}
            onViewDetails={() => setSelectedEvent(alert)}
          />
        </div>
      ))}

      {/* Header - Modern Design */}
      <div className="hidden md:block bg-gradient-to-r from-gray-800/95 via-gray-800/90 to-gray-900/95 backdrop-blur-xl border-b border-emerald-500/20 md:sticky md:top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg shadow-emerald-500/30">
                    <Calendar className="w-7 h-7 text-white" />
                  </div>
                  Events & Calendar
                </h1>
                <p className="text-gray-400 mt-2 text-sm font-medium">Manage and explore community events</p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={exportToCSV}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white px-5 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 hover:scale-105 shadow-lg shadow-blue-500/30 font-semibold"
                >
                  <Download className="w-5 h-5" />
                  <span className="hidden lg:inline">Export CSV</span>
                </Button>
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 hover:scale-105 shadow-lg shadow-emerald-500/30 font-semibold"
                >
                  <Plus className="w-5 h-5" />
                  Create Event
                </Button>
              </div>
            </div>

            {/* Filters and Search - Clean Icon Design */}
            <div className="flex items-center gap-4">
              {/* Icon-Only Filter Buttons */}
              <div className="flex gap-2">
                {[
                  { value: "all" as const, icon: Globe, tooltip: "All Events" },
                  { value: "meeting" as const, icon: MessageSquare, tooltip: "Meetings" },
                  { value: "community" as const, icon: Users, tooltip: "Community" },
                  { value: "project" as const, icon: Briefcase, tooltip: "Projects" },
                  { value: "emergency" as const, icon: AlertTriangle, tooltip: "Emergency" },
                ].map(({ value, icon: Icon, tooltip }) => (
                  <button
                    key={value}
                    onClick={() => setEventType(value)}
                    title={tooltip}
                    className={`p-3.5 rounded-xl transition-all duration-200 ${
                      eventType === value
                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/40 scale-110"
                        : "bg-gray-700/60 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-600 hover:border-emerald-500/50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                ))}
              </div>

              {/* Larger Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-emerald-400" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-5 py-4 text-lg bg-gray-700/50 border-2 border-gray-600 hover:border-emerald-500/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-inner"
                />
              </div>

              {/* View Mode Switcher - Modern Design */}
              <div className="flex gap-1 bg-gradient-to-r from-gray-800/80 to-gray-800/60 backdrop-blur-sm p-1 rounded-xl border border-white/10 shadow-lg">
                <button
                  onClick={() => setViewMode("month")}
                  className={`px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-semibold flex items-center gap-2 ${
                    viewMode === "month" 
                      ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/30" 
                      : "text-gray-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span className="hidden sm:inline">Month</span>
                </button>
                <button
                  onClick={() => setViewMode("week")}
                  className={`px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-semibold flex items-center gap-2 ${
                    viewMode === "week" 
                      ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/30" 
                      : "text-gray-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span className="hidden sm:inline">Week</span>
                </button>
                <button
                  onClick={() => setViewMode("day")}
                  className={`px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-semibold flex items-center gap-2 ${
                    viewMode === "day" 
                      ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/30" 
                      : "text-gray-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span className="hidden sm:inline">Day</span>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-semibold flex items-center gap-2 ${
                    viewMode === "list" 
                      ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/30" 
                      : "text-gray-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline">List</span>
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-semibold flex items-center gap-2 ${
                    viewMode === "grid" 
                      ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/30" 
                      : "text-gray-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Grid className="w-4 h-4" />
                  <span className="hidden sm:inline">Grid</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Calendar/List View */}
          <div className="lg:col-span-3">
            {viewMode === "month" && (
              <CalendarView 
                events={filteredEvents} 
                onEventClick={setSelectedEvent}
              />
            )}
            {viewMode === "week" && (
              <WeekView 
                events={filteredEvents} 
                onEventClick={setSelectedEvent}
              />
            )}
            {viewMode === "day" && (
              <DayView 
                events={filteredEvents} 
                onEventClick={setSelectedEvent}
              />
            )}
            {viewMode === "list" && (
              <EventsList 
                events={filteredEvents} 
                onEventClick={setSelectedEvent}
              />
            )}
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEvents.map(event => {
                  const isOrganizer = event.organizer === currentUser?._id;
                  const isAdmin = currentUser?.userLevel?.level && currentUser.userLevel.level >= 4;
                  
                  return (
                    <EventCard 
                      key={event._id} 
                      event={event} 
                      onClick={() => setSelectedEvent(event)}
                      onEdit={(e) => setEditingEvent(e)}
                      onArchive={async (id) => {
                        if (confirm('Archive this event?')) {
                          await archiveEvent({ eventId: id as any });
                        }
                      }}
                      onRestore={async (id) => {
                        if (confirm('Restore this event?')) {
                          await restoreEvent({ eventId: id as any });
                        }
                      }}
                      onDelete={async (id) => {
                        if (confirm('Permanently delete this event? This cannot be undone.')) {
                          await deleteEvent({ eventId: id as any });
                        }
                      }}
                      projectName={(event as any).projectName}
                      isOrganizer={isOrganizer}
                      isAdmin={Boolean(isAdmin)}
                    />
                  );
                })}
                {filteredEvents.length === 0 && (
                  <div className="col-span-2 text-center py-12 text-gray-400">
                    <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No events found</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar - Upcoming Events */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6 sticky top-28">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-500" />
                Upcoming Events
              </h3>
              <div className="space-y-3">
                {upcomingEvents?.slice(0, 5).map(event => {
                  const typeConfig = eventTypeColors[event.type];
                  const Icon = typeConfig.icon;
                  return (
                    <div
                      key={event._id}
                      onClick={() => setSelectedEvent(event)}
                      className="p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${typeConfig.bg}`}>
                          <Icon className={`w-4 h-4 ${typeConfig.text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-white truncate">{event.title}</h4>
                          {(event as any).projectName && (
                            <p className="text-xs text-purple-400 flex items-center gap-1 mt-1">
                              <Briefcase className="w-3 h-3" />
                              {(event as any).projectName}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            {new Date(event.startDate).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                            <Users className="w-3 h-3" />
                            {event.attendeeCount} attending
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {(!upcomingEvents || upcomingEvents.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No upcoming events</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          console.log('Closing Create Event modal');
          setIsCreateModalOpen(false);
          setDefaultEventTitle(""); // Clear title on close
        }}
        defaultTitle={defaultEventTitle}
      />
      
      {editingEvent && (
        <EditEventModal
          event={editingEvent}
          isOpen={!!editingEvent}
          onClose={() => setEditingEvent(null)}
        />
      )}
      
      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
      </div>
    </div>
  );
}
