"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
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
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/Sidebar";
import { CalendarView } from "@/components/events/CalendarView";
import { WeekView } from "@/components/events/WeekView";
import { DayView } from "@/components/events/DayView";
import { EventsList } from "@/components/events/EventsList";
import { EventCard } from "@/components/events/EventCard";
import { CreateEventModal } from "@/components/events/CreateEventModal";
import { EventDetailsModal } from "@/components/events/EventDetailsModal";
import { EmergencyAlert, EmergencyBanner } from "@/components/events/EmergencyAlert";
import { useEffect } from "react";

export const dynamic = 'force-dynamic';

type ViewMode = "month" | "week" | "day" | "list" | "grid";
type EventType = "all" | "meeting" | "community" | "project" | "emergency";

export default function EventsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [eventType, setEventType] = useState<EventType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [emergencyAlerts, setEmergencyAlerts] = useState<any[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  
  const currentUser = useQuery(api.users.getCurrentUser);
  
  const events = useQuery(api.eventsCalendar.getAllEvents, {
    type: eventType,
    status: "published",
  });

  const upcomingEvents = useQuery(api.eventsCalendar.getUpcomingEvents, { limit: 10 });

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
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading events...</p>
        </div>
      </div>
    );
  }

  // Filter events based on search
  const filteredEvents = events?.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.location.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

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
        {/* Mobile Header */}
        <div className="md:hidden bg-gray-800 p-4 flex items-center justify-between sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-white">Events</h1>
          <div className="w-9" />
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

      {/* Header */}
      <div className="bg-white/5 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <Calendar className="w-8 h-8 text-emerald-500" />
                  Events & Calendar
                </h1>
                <p className="text-gray-400 mt-1">Manage and explore community events</p>
              </div>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                Create Event
              </Button>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Event Type Filter */}
              <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                {[
                  { value: "all" as const, label: "All Events", icon: Globe },
                  { value: "meeting" as const, label: "Meetings", icon: MessageSquare },
                  { value: "community" as const, label: "Community", icon: Users },
                  { value: "project" as const, label: "Projects", icon: Briefcase },
                  { value: "emergency" as const, label: "Emergency", icon: AlertTriangle },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setEventType(value)}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap transition-all ${
                      eventType === value
                        ? "bg-emerald-600 text-white"
                        : "bg-white/10 text-gray-300 hover:bg-white/20"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>

              {/* View Mode Switcher */}
              <div className="flex gap-1 bg-white/10 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode("month")}
                  className={`px-3 py-2 rounded transition-all text-sm font-medium flex items-center gap-2 ${
                    viewMode === "month" ? "bg-emerald-600 text-white" : "text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span className="hidden sm:inline">Month</span>
                </button>
                <button
                  onClick={() => setViewMode("week")}
                  className={`px-3 py-2 rounded transition-all text-sm font-medium flex items-center gap-2 ${
                    viewMode === "week" ? "bg-emerald-600 text-white" : "text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span className="hidden sm:inline">Week</span>
                </button>
                <button
                  onClick={() => setViewMode("day")}
                  className={`px-3 py-2 rounded transition-all text-sm font-medium flex items-center gap-2 ${
                    viewMode === "day" ? "bg-emerald-600 text-white" : "text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span className="hidden sm:inline">Day</span>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-2 rounded transition-all text-sm font-medium flex items-center gap-2 ${
                    viewMode === "list" ? "bg-emerald-600 text-white" : "text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline">List</span>
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-2 rounded transition-all text-sm font-medium flex items-center gap-2 ${
                    viewMode === "grid" ? "bg-emerald-600 text-white" : "text-gray-400 hover:text-white hover:bg-white/10"
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredEvents.map(event => (
                  <EventCard 
                    key={event._id} 
                    event={event} 
                    onClick={() => setSelectedEvent(event)}
                  />
                ))}
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
      {isCreateModalOpen && (
        <CreateEventModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
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
