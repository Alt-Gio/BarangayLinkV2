"use client";

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Users, Plus, X, Trash2 } from 'lucide-react';
import { CreateEventModal } from '@/components/events/CreateEventModal';
import { EventDetailsModal } from '@/components/events/EventDetailsModal';

export function EventsCalendarWidget() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createEventDate, setCreateEventDate] = useState<Date | null>(null);
  const events = useQuery(api.events.getUpcomingEvents);

  const eventsByDate = events?.reduce((acc: any, event: any) => {
    const dateKey = new Date(event.startDate).toDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(event);
    return acc;
  }, {}) || {};

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleCreateEventForDate = (date: Date) => {
    setCreateEventDate(date);
    setIsCreateModalOpen(true);
  };

  const selectedDateEvents = eventsByDate[selectedDate.toDateString()] || [];

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
      {/* Compact Calendar */}
      <div className="lg:col-span-2">
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Calendar className="w-5 h-5 text-emerald-600" />
                Events Calendar
              </CardTitle>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 md:px-4 md:py-2 text-sm"
              >
                <Plus className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Create Event</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <CompactCalendar 
              events={eventsByDate}
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              onEventSelect={setSelectedEvent}
              onCreateEvent={handleCreateEventForDate}
            />
          </CardContent>
        </Card>
      </div>

      {/* Event Details */}
      <div>
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white text-base md:text-lg">
              {selectedDateEvents.length > 0 
                ? `Events on ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                : 'Upcoming Events'
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 md:space-y-4">
              {selectedDateEvents.length > 0 ? (
                selectedDateEvents.map((event: any) => (
                  <div key={event._id} className="p-3 md:p-4 rounded-lg border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/20 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 transition-colors cursor-pointer" onClick={() => setSelectedEvent(event)}>
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">{event.title}</h4>
                      <Badge className={`text-xs ${
                        event.type === 'community' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-400' :
                        event.type === 'meeting' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400' :
                        event.type === 'emergency' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {event.type?.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">{event.description}</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {new Date(event.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Users className="w-3 h-3" />
                        {event.attendeeCount || 0} attending
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                events?.slice(0, 5).map((event: any) => (
                  <div key={event._id} className="p-3 md:p-4 rounded-lg border border-emerald-100 dark:border-emerald-900/30 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors cursor-pointer" onClick={() => setSelectedEvent(event)}>
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">{event.title}</h4>
                      <Badge className={`text-xs ${
                        event.type === 'community' ? 'bg-emerald-100 text-emerald-800' :
                        event.type === 'meeting' ? 'bg-blue-100 text-blue-800' :
                        event.type === 'emergency' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {event.type?.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-2 md:mb-3 line-clamp-2">{event.description}</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {new Date(event.startDate).toLocaleDateString()} at {new Date(event.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Users className="w-3 h-3" />
                        {event.attendeeCount || 0} attending
                      </div>
                    </div>
                  </div>
                ))
              )}
              {(!events || events.length === 0) && selectedDateEvents.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm md:text-base">No upcoming events</p>
                  <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Event
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    {/* Modals */}
    {isCreateModalOpen && (
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCreateEventDate(null);
        }}
      />
    )}
    
    {selectedEvent && (
      <EventDetailsModal
        event={selectedEvent}
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    )}
    </>
  );
}

// Compact Calendar Component
function CompactCalendar({ events, selectedDate, onDateSelect, onEventSelect, onCreateEvent }: any) {
  const today = new Date();
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();
  
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  const days = [];
  
  // Empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentYear, currentMonth + direction, 1);
    onDateSelect(newDate);
  };
  
  return (
    <div>
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
          {monthNames[currentMonth]} {currentYear}
        </h3>
        <div className="flex gap-1 md:gap-2">
          <button 
            onClick={() => navigateMonth(-1)}
            className="p-2 md:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 touch-manipulation"
          >
            ←
          </button>
          <button 
            onClick={() => navigateMonth(1)}
            className="p-2 md:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 touch-manipulation"
          >
            →
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center text-xs md:text-sm">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 md:p-3 font-medium text-gray-500 dark:text-gray-400">
            <span className="hidden md:inline">{day}</span>
            <span className="md:hidden">{day.charAt(0)}</span>
          </div>
        ))}
        
        {days.map((day, index) => {
          if (!day) return <div key={`empty-${index}`} className="p-3"></div>;
          
          const date = new Date(currentYear, currentMonth, day);
          const dateKey = date.toDateString();
          const dayEvents = events[dateKey] || [];
          const hasEvents = dayEvents.length > 0;
          const isToday = date.toDateString() === today.toDateString();
          const isSelected = date.toDateString() === selectedDate.toDateString();
          
          return (
            <div key={`day-${currentYear}-${currentMonth}-${day}`} className="relative group">
              <button
                onClick={() => onDateSelect(date)}
                className={`w-full aspect-square md:p-3 p-2 rounded-lg relative transition-all touch-manipulation ${
                  isToday ? 'bg-emerald-600 text-white font-bold ring-2 ring-emerald-400' :
                  isSelected ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 ring-2 ring-emerald-500' :
                  hasEvents ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 hover:scale-105' :
                  'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:scale-105'
                }`}
              >
                <span className="text-xs md:text-sm">{day}</span>
                {hasEvents && (
                  <div className="absolute bottom-0.5 md:bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                    {dayEvents.slice(0, 3).map((event: any, i: number) => (
                      <div key={`${event._id}-${i}`} className="w-1 h-1 md:w-1.5 md:h-1.5 bg-emerald-600 dark:bg-emerald-400 rounded-full"></div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-emerald-400 dark:bg-emerald-300 rounded-full"></div>
                    )}
                  </div>
                )}
              </button>
              {hasEvents && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateEvent(date);
                  }}
                  className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-600 hover:bg-emerald-700 text-white rounded-full p-1 shadow-lg z-10 touch-manipulation"
                  title="Create event on this date"
                >
                  <Plus className="w-2.5 h-2.5 md:w-3 md:h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
