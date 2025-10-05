"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Users, AlertTriangle, Briefcase, MessageSquare } from "lucide-react";

interface CalendarViewProps {
  events: any[];
  onEventClick: (event: any) => void;
}

export function CalendarView({ events, onEventClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Group events by date
  const eventsByDate = events.reduce((acc: any, event: any) => {
    const dateKey = new Date(event.startDate).toDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(event);
    return acc;
  }, {});

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(year, month + direction, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const renderCalendarDays = () => {
    const days = [];
    const today = new Date().toDateString();

    // Empty cells for days before the first day of month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-32 bg-white/5 border border-white/10 rounded-lg" />
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toDateString();
      const dayEvents = eventsByDate[dateString] || [];
      const isToday = dateString === today;
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;

      days.push(
        <div
          key={day}
          className={`h-32 p-2 border border-white/10 rounded-lg transition-all hover:bg-white/10 relative overflow-hidden ${
            isToday ? "bg-emerald-900/30 ring-2 ring-emerald-500" : 
            isWeekend ? "bg-white/5" : "bg-white/5"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-sm font-semibold ${
              isToday ? "text-emerald-400" : "text-white"
            }`}>
              {day}
            </span>
            {dayEvents.length > 0 && (
              <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                {dayEvents.length}
              </span>
            )}
          </div>
          
          <div className="space-y-1 overflow-y-auto max-h-20">
            {dayEvents.slice(0, 3).map((event: any) => {
              const eventColor = {
                meeting: "bg-blue-600",
                community: "bg-emerald-600",
                project: "bg-purple-600",
                emergency: "bg-red-600",
              }[event.type];

              const eventIcon = {
                meeting: MessageSquare,
                community: Users,
                project: Briefcase,
                emergency: AlertTriangle,
              }[event.type];
              
              const Icon = eventIcon;

              return (
                <div
                  key={event._id}
                  onClick={() => onEventClick(event)}
                  className={`text-xs px-2 py-1 rounded cursor-pointer hover:opacity-80 transition-opacity ${eventColor} text-white flex items-center gap-1 truncate`}
                  title={event.title}
                >
                  <Icon className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{event.title}</span>
                </div>
              );
            })}
            {dayEvents.length > 3 && (
              <div className="text-xs text-gray-400 px-2">
                +{dayEvents.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {monthNames[month]} {year}
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {events.length} events this month
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Today
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {dayNames.map(day => (
          <div key={day} className="text-center text-sm font-semibold text-gray-400 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {renderCalendarDays()}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 pt-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-600"></div>
          <span className="text-xs text-gray-400">Meetings</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-600"></div>
          <span className="text-xs text-gray-400">Community</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-600"></div>
          <span className="text-xs text-gray-400">Projects</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-600"></div>
          <span className="text-xs text-gray-400">Emergency</span>
        </div>
      </div>
    </div>
  );
}
