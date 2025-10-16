"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Clock, MapPin, Users, User } from "lucide-react";

interface DayViewProps {
  events: any[];
  onEventClick: (event: any) => void;
}

export function DayView({ events, onEventClick }: DayViewProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const navigateDay = (direction: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Filter events for selected day
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startDate);
    return eventDate.toDateString() === selectedDate.toDateString();
  }).sort((a, b) => a.startDate - b.startDate);

  const eventTypeColors: Record<string, { bg: string; text: string }> = {
    meeting: { bg: "bg-blue-600", text: "text-blue-100" },
    community: { bg: "bg-emerald-600", text: "text-emerald-100" },
    project: { bg: "bg-purple-600", text: "text-purple-100" },
    emergency: { bg: "bg-red-600", text: "text-red-100" },
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  // Generate time slots (6 AM to 11 PM)
  const timeSlots = Array.from({ length: 18 }, (_, i) => i + 6);

  return (
    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6 shadow-2xl">
      {/* Header - Modern Design */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
            {dayNames[selectedDate.getDay()]}, {monthNames[selectedDate.getMonth()]} {selectedDate.getDate()}, {selectedDate.getFullYear()}
          </h2>
          <p className="text-sm text-gray-400 mt-2 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600/20 text-emerald-400 text-xs font-semibold">
              {dayEvents.length}
            </span>
            {dayEvents.length === 1 ? 'event' : 'events'} scheduled
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
              onClick={() => navigateDay(-1)}
              className="p-2.5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg transition-all duration-200"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigateDay(1)}
              className="p-2.5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg transition-all duration-200"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Day Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Timeline - Modern Design */}
        <div className="lg:col-span-8 bg-gradient-to-br from-gray-800/30 to-gray-900/10 rounded-xl border border-white/10 p-5 shadow-lg">
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {timeSlots.map(hour => {
              const hourStart = hour * 60; // minutes from midnight
              const hourEnd = (hour + 1) * 60;
              
              // Find events in this hour
              const hourEvents = dayEvents.filter(event => {
                const eventStart = new Date(event.startDate);
                const eventMinutes = eventStart.getHours() * 60 + eventStart.getMinutes();
                return eventMinutes >= hourStart && eventMinutes < hourEnd;
              });

              return (
                <div key={hour} className="flex gap-4 min-h-[80px]">
                  {/* Time Label */}
                  <div className="w-20 flex-shrink-0 text-right pt-2">
                    <span className="text-sm font-medium text-gray-400">
                      {hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? 'PM' : 'AM'}
                    </span>
                  </div>

                  {/* Events Container */}
                  <div className="flex-1 border-t border-white/10 pt-2 space-y-2">
                    {hourEvents.length > 0 ? (
                      hourEvents.map(event => {
                        const eventColor = eventTypeColors[event.type];
                        const startTime = new Date(event.startDate);
                        const endTime = new Date(event.endDate);
                        const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

                        return (
                          <div
                            key={event._id}
                            onClick={() => onEventClick(event)}
                            className={`bg-gradient-to-r ${eventColor.bg === 'bg-blue-600' ? 'from-blue-600 to-blue-500' : eventColor.bg === 'bg-emerald-600' ? 'from-emerald-600 to-emerald-500' : eventColor.bg === 'bg-purple-600' ? 'from-purple-600 to-purple-500' : 'from-red-600 to-red-500'} rounded-xl p-4 cursor-pointer hover:scale-105 transition-all duration-200 shadow-xl`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="text-white font-semibold mb-1">{event.title}</h4>
                                <p className={`text-sm ${eventColor.text} line-clamp-2`}>{event.description}</p>
                              </div>
                              {event.isUserAttending && (
                                <span className="ml-2 px-2 py-1 bg-white/20 rounded text-xs text-white">
                                  Attending
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-white/90">
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span className="truncate">{event.location}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                <span>{event.attendeeCount}</span>
                              </div>
                            </div>

                            {event.organizer && (
                              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/20">
                                {event.organizer.imageUrl ? (
                                  <img src={event.organizer.imageUrl} alt="" className="w-5 h-5 rounded-full" />
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                                    <User className="w-3 h-3 text-white" />
                                  </div>
                                )}
                                <span className="text-xs text-white/80">{event.organizer.name}</span>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar - Events Summary - Modern Design */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/20 rounded-xl border border-white/10 p-5 shadow-lg">
            <h3 className="text-xl font-bold text-white mb-5 bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">Events Today</h3>
            <div className="space-y-3">
              {dayEvents.map(event => {
                const eventColor = eventTypeColors[event.type];
                const startTime = new Date(event.startDate);
                
                return (
                  <div
                    key={event._id}
                    onClick={() => onEventClick(event)}
                    className="p-4 bg-gradient-to-r from-gray-800/50 to-gray-900/30 rounded-xl border border-white/10 hover:border-white/20 hover:scale-105 cursor-pointer transition-all duration-200 shadow-md hover:shadow-xl"
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <div className={`w-4 h-4 rounded-full ${eventColor.bg === 'bg-blue-600' ? 'bg-gradient-to-br from-blue-500 to-blue-600' : eventColor.bg === 'bg-emerald-600' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : eventColor.bg === 'bg-purple-600' ? 'bg-gradient-to-br from-purple-500 to-purple-600' : 'bg-gradient-to-br from-red-500 to-red-600'} mt-1 flex-shrink-0 shadow-lg`}></div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-semibold text-sm truncate">{event.title}</h4>
                        <p className="text-xs text-emerald-400 mt-1.5 font-medium">
                          {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {dayEvents.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <div className="w-16 h-16 rounded-full bg-gray-700/30 mx-auto mb-4 flex items-center justify-center">
                    <Clock className="w-8 h-8 text-gray-600" />
                  </div>
                  <p className="text-sm">No events scheduled</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats - Modern Design */}
          {isToday && dayEvents.length > 0 && (
            <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-500/10 rounded-xl border border-emerald-500/30 p-5 shadow-lg">
              <h4 className="text-emerald-400 font-bold text-lg mb-3">Today's Schedule</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-white">
                  <span>Total Events:</span>
                  <span className="font-semibold">{dayEvents.length}</span>
                </div>
                <div className="flex justify-between text-white">
                  <span>Attending:</span>
                  <span className="font-semibold">{dayEvents.filter(e => e.isUserAttending).length}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
