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
          className={`h-36 p-3 border rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-xl relative overflow-hidden group cursor-pointer ${
            isToday 
              ? "bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 border-emerald-500/50 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/20" 
              : isWeekend
              ? "bg-gradient-to-br from-gray-800/40 to-gray-900/20 border-white/5 hover:border-white/20"
              : "bg-gradient-to-br from-gray-800/30 to-gray-900/10 border-white/10 hover:border-white/20"
          }`}
        >
          {/* Day Number */}
          <div className="flex items-center justify-between mb-2">
            <span className={`text-base font-bold ${
              isToday ? "text-emerald-400" : "text-white"
            }`}>
              {day}
            </span>
            {dayEvents.length > 0 && (
              <span className="text-xs bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-2.5 py-1 rounded-full font-semibold shadow-lg shadow-emerald-500/30">
                {dayEvents.length}
              </span>
            )}
          </div>
          
          {/* Events List */}
          <div className="space-y-1.5 overflow-y-auto max-h-20">
            {dayEvents.slice(0, 2).map((event: any) => {
              const eventConfigMap: Record<string, { bg: string; icon: any }> = {
                meeting: { bg: "bg-gradient-to-r from-blue-600 to-blue-500", icon: MessageSquare },
                community: { bg: "bg-gradient-to-r from-emerald-600 to-emerald-500", icon: Users },
                project: { bg: "bg-gradient-to-r from-purple-600 to-purple-500", icon: Briefcase },
                emergency: { bg: "bg-gradient-to-r from-red-600 to-red-500", icon: AlertTriangle },
              };
              const eventConfig = eventConfigMap[event.type] || eventConfigMap.community;
              
              const Icon = eventConfig.icon;

              return (
                <div
                  key={event._id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick(event);
                  }}
                  className={`text-xs px-2.5 py-1.5 rounded-lg cursor-pointer hover:scale-105 transition-all duration-200 ${eventConfig.bg} text-white flex items-center gap-1.5 truncate shadow-md`}
                  title={event.title}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate font-medium">{event.title}</span>
                </div>
              );
            })}
            {dayEvents.length > 2 && (
              <div className="text-xs text-emerald-400 px-2.5 py-1 bg-emerald-900/30 rounded-lg font-medium border border-emerald-500/20">
                +{dayEvents.length - 2} more
              </div>
            )}
          </div>
          
          {/* Hover Effect Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl"></div>
        </div>
      );
    }

    return days;
  };

  return (
    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6 shadow-2xl">
      {/* Calendar Header - Modern Design */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
            {monthNames[month]} {year}
          </h2>
          <p className="text-sm text-gray-400 mt-2 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600/20 text-emerald-400 text-xs font-semibold">
              {events.length}
            </span>
            events this month
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={goToToday}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg shadow-emerald-500/30 hover:scale-105"
          >
            Today
          </button>
          <div className="flex gap-2 bg-gray-800/50 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2.5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg transition-all duration-200"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2.5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg transition-all duration-200"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Day Names - Modern Design */}
      <div className="grid grid-cols-7 gap-3 mb-3">
        {dayNames.map(day => (
          <div key={day} className="text-center text-xs font-bold text-emerald-400/80 uppercase tracking-wider py-3 bg-gradient-to-b from-emerald-900/20 to-transparent rounded-t-lg">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid - Modern Design */}
      <div className="grid grid-cols-7 gap-3">
        {renderCalendarDays()}
      </div>

      {/* Legend - Modern Design */}
      <div className="mt-8 flex flex-wrap gap-4 pt-6 border-t border-white/5">
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-600/10 border border-blue-500/20 rounded-lg">
          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/50"></div>
          <span className="text-xs text-blue-300 font-medium">Meetings</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-600/10 border border-emerald-500/20 rounded-lg">
          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/50"></div>
          <span className="text-xs text-emerald-300 font-medium">Community</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-purple-600/10 border border-purple-500/20 rounded-lg">
          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/50"></div>
          <span className="text-xs text-purple-300 font-medium">Projects</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-red-600/10 border border-red-500/20 rounded-lg">
          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/50"></div>
          <span className="text-xs text-red-300 font-medium">Emergency</span>
        </div>
      </div>
    </div>
  );
}
