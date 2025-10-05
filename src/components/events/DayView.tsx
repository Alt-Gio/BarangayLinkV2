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
    <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {dayNames[selectedDate.getDay()]}, {monthNames[selectedDate.getMonth()]} {selectedDate.getDate()}, {selectedDate.getFullYear()}
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'} scheduled
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
              onClick={() => navigateDay(-1)}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigateDay(1)}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Day Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Timeline */}
        <div className="lg:col-span-8 bg-white/5 rounded-lg border border-white/10 p-4">
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
                            className={`${eventColor.bg} rounded-lg p-3 cursor-pointer hover:opacity-90 transition-all shadow-lg`}
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

        {/* Sidebar - Events Summary */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white/5 rounded-lg border border-white/10 p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Events Today</h3>
            <div className="space-y-3">
              {dayEvents.map(event => {
                const eventColor = eventTypeColors[event.type];
                const startTime = new Date(event.startDate);
                
                return (
                  <div
                    key={event._id}
                    onClick={() => onEventClick(event)}
                    className="p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 cursor-pointer transition-all"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <div className={`w-3 h-3 rounded-full ${eventColor.bg} mt-1 flex-shrink-0`}></div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium text-sm truncate">{event.title}</h4>
                        <p className="text-xs text-gray-400 mt-1">
                          {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {dayEvents.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No events scheduled</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          {isToday && dayEvents.length > 0 && (
            <div className="bg-emerald-600/20 rounded-lg border border-emerald-500/30 p-4">
              <h4 className="text-emerald-400 font-semibold mb-2">Today's Schedule</h4>
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
