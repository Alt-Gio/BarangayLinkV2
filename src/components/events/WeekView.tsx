"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Clock, MapPin, Users } from "lucide-react";

interface WeekViewProps {
  events: any[];
  onEventClick: (event: any) => void;
}

export function WeekView({ events, onEventClick }: WeekViewProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day; // Get Sunday
    return new Date(today.setDate(diff));
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(currentWeekStart.getDate() + i);
    return date;
  });

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentWeekStart(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    setCurrentWeekStart(new Date(today.setDate(diff)));
  };

  // Group events by date
  const eventsByDate = events.reduce((acc: any, event: any) => {
    const dateKey = new Date(event.startDate).toDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(event);
    return acc;
  }, {});

  const eventTypeColors: Record<string, string> = {
    meeting: "bg-blue-600",
    community: "bg-emerald-600",
    project: "bg-purple-600",
    emergency: "bg-red-600",
  };

  const today = new Date().toDateString();

  return (
    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6 shadow-2xl">
      {/* Header - Modern Design */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
            {monthNames[weekDays[0].getMonth()]} {weekDays[0].getDate()} - {monthNames[weekDays[6].getMonth()]} {weekDays[6].getDate()}, {weekDays[0].getFullYear()}
          </h2>
          <p className="text-sm text-gray-400 mt-2">Week View • {events.filter(e => {
            const eventDate = new Date(e.startDate);
            return eventDate >= weekDays[0] && eventDate <= weekDays[6];
          }).length} events</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={goToToday}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg shadow-emerald-500/30 hover:scale-105"
          >
            This Week
          </button>
          <div className="flex gap-2 bg-gray-800/50 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => navigateWeek(-1)}
              className="p-2.5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg transition-all duration-200"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigateWeek(1)}
              className="p-2.5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg transition-all duration-200"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Week Grid - Modern Design */}
      <div className="grid grid-cols-7 gap-3">
        {weekDays.map((date, index) => {
          const dateString = date.toDateString();
          const dayEvents = eventsByDate[dateString] || [];
          const isToday = dateString === today;

          return (
            <div
              key={index}
              className={`min-h-[450px] border rounded-xl p-4 transition-all duration-200 hover:scale-105 hover:shadow-xl ${
                isToday 
                  ? "bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 border-emerald-500/50 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/20" 
                  : "bg-gradient-to-br from-gray-800/30 to-gray-900/10 border-white/10 hover:border-white/20"
              }`}
            >
              {/* Day Header - Modern Design */}
              <div className="text-center mb-4 pb-4 border-b border-white/5">
                <div className={`text-xs font-bold uppercase tracking-wider ${
                  isToday ? "text-emerald-400" : "text-gray-400"
                }`}>
                  {dayNames[date.getDay()]}
                </div>
                <div className={`text-3xl font-bold mt-2 ${
                  isToday ? "text-emerald-400" : "text-white"
                }`}>
                  {date.getDate()}
                </div>
                {dayEvents.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-3 py-1 rounded-full font-semibold shadow-lg shadow-emerald-500/30">
                      {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}
                    </span>
                  </div>
                )}
              </div>

              {/* Events - Modern Design */}
              <div className="space-y-3 overflow-y-auto max-h-[350px] pr-1">
                {dayEvents.map((event: any) => {
                  const startTime = new Date(event.startDate);
                  const eventColorMap: Record<string, string> = {
                    meeting: "bg-gradient-to-r from-blue-600 to-blue-500",
                    community: "bg-gradient-to-r from-emerald-600 to-emerald-500",
                    project: "bg-gradient-to-r from-purple-600 to-purple-500",
                    emergency: "bg-gradient-to-r from-red-600 to-red-500",
                  };
                  const eventColor = eventColorMap[event.type] || eventColorMap.community;
                  
                  return (
                    <div
                      key={event._id}
                      onClick={() => onEventClick(event)}
                      className={`p-3 rounded-xl cursor-pointer hover:scale-105 transition-all duration-200 ${eventColor} text-white shadow-lg group`}
                    >
                      <div className="text-xs font-bold mb-2 flex items-center gap-1.5 opacity-90">
                        <Clock className="w-3.5 h-3.5" />
                        {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-sm font-bold line-clamp-2 mb-2">
                        {event.title}
                      </div>
                      <div className="text-xs opacity-80 flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{event.location}</span>
                      </div>
                      {event.attendeeCount > 0 && (
                        <div className="text-xs opacity-80 flex items-center gap-1.5 mt-2 pt-2 border-t border-white/20">
                          <Users className="w-3 h-3" />
                          {event.attendeeCount} attending
                        </div>
                      )}
                    </div>
                  );
                })}
                {dayEvents.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <div className="w-12 h-12 rounded-full bg-gray-700/30 mx-auto mb-3 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-gray-600" />
                    </div>
                    <p className="text-xs">No events</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
