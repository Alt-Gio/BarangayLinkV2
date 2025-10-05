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
    <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {monthNames[weekDays[0].getMonth()]} {weekDays[0].getDate()} - {monthNames[weekDays[6].getMonth()]} {weekDays[6].getDate()}, {weekDays[0].getFullYear()}
          </h2>
          <p className="text-sm text-gray-400 mt-1">Week View</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            This Week
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => navigateWeek(-1)}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigateWeek(1)}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((date, index) => {
          const dateString = date.toDateString();
          const dayEvents = eventsByDate[dateString] || [];
          const isToday = dateString === today;

          return (
            <div
              key={index}
              className={`min-h-[400px] border border-white/10 rounded-lg p-3 ${
                isToday ? "bg-emerald-900/30 ring-2 ring-emerald-500" : "bg-white/5"
              }`}
            >
              {/* Day Header */}
              <div className="text-center mb-3 pb-3 border-b border-white/10">
                <div className={`text-xs font-medium ${isToday ? "text-emerald-400" : "text-gray-400"} uppercase`}>
                  {dayNames[date.getDay()]}
                </div>
                <div className={`text-2xl font-bold mt-1 ${isToday ? "text-emerald-400" : "text-white"}`}>
                  {date.getDate()}
                </div>
              </div>

              {/* Events */}
              <div className="space-y-2 overflow-y-auto max-h-[320px]">
                {dayEvents.map((event: any) => {
                  const startTime = new Date(event.startDate);
                  return (
                    <div
                      key={event._id}
                      onClick={() => onEventClick(event)}
                      className={`p-2 rounded-lg cursor-pointer hover:opacity-90 transition-all ${eventTypeColors[event.type]} text-white`}
                    >
                      <div className="text-xs font-semibold mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-sm font-medium line-clamp-2 mb-1">
                        {event.title}
                      </div>
                      <div className="text-xs opacity-80 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </div>
                    </div>
                  );
                })}
                {dayEvents.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-xs">
                    No events
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
