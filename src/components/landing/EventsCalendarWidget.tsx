"use client";

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';

export function EventsCalendarWidget() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const events = useQuery(api.events.getUpcomingEvents);

  const eventsByDate = events?.reduce((acc: any, event: any) => {
    const dateKey = new Date(event.startDate).toDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(event);
    return acc;
  }, {}) || {};

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Compact Calendar */}
      <div className="lg:col-span-2">
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Calendar className="w-5 h-5 text-emerald-600" />
              Events Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CompactCalendar 
              events={eventsByDate}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              onEventSelect={setSelectedEvent}
            />
          </CardContent>
        </Card>
      </div>

      {/* Event Details */}
      <div>
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {events?.slice(0, 5).map((event: any) => (
                <div key={event._id} className="p-4 rounded-lg border border-emerald-100 dark:border-emerald-900/30 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{event.title}</h4>
                    <Badge className={`${
                      event.eventType === 'community_event' ? 'bg-emerald-100 text-emerald-800' :
                      event.eventType === 'meeting' ? 'bg-blue-100 text-blue-800' :
                      event.eventType === 'emergency' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {event.eventType?.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{event.description}</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {new Date(event.startDate).toLocaleDateString()} at {new Date(event.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Users className="w-3 h-3" />
                      {event.attendees?.length || 0} attending
                    </div>
                  </div>
                </div>
              ))}
              {(!events || events.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No upcoming events</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Compact Calendar Component
function CompactCalendar({ events, selectedDate, onDateSelect, onEventSelect }: any) {
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
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {monthNames[currentMonth]} {currentYear}
        </h3>
        <div className="flex gap-2">
          <button 
            onClick={() => navigateMonth(-1)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
          >
            ←
          </button>
          <button 
            onClick={() => navigateMonth(1)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
          >
            →
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-3 font-medium text-gray-500 dark:text-gray-400">
            {day}
          </div>
        ))}
        
        {days.map((day, index) => {
          if (!day) return <div key={index} className="p-3"></div>;
          
          const date = new Date(currentYear, currentMonth, day);
          const dateKey = date.toDateString();
          const dayEvents = events[dateKey] || [];
          const hasEvents = dayEvents.length > 0;
          const isToday = date.toDateString() === today.toDateString();
          const isSelected = date.toDateString() === selectedDate.toDateString();
          
          return (
            <button
              key={day}
              onClick={() => onDateSelect(date)}
              className={`p-3 rounded-lg relative transition-colors ${
                isToday ? 'bg-emerald-600 text-white font-bold' :
                isSelected ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                hasEvents ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400' :
                'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {day}
              {hasEvents && (
                <div className="absolute bottom-1 right-1 flex gap-0.5">
                  {dayEvents.slice(0, 3).map((_: any, i: number) => (
                    <div key={i} className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
