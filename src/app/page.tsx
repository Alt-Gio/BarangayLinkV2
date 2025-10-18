"use client";

import Link from 'next/link';
import { Authenticated, Unauthenticated } from 'convex/react';
import { SignInButton, UserButton } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  MapPin, 
  TrendingUp, 
  Menu, 
  X,
  Clock,
  Users,
  ArrowRight,
  Building,
  CheckCircle2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import dynamicImport from 'next/dynamic';

export const dynamic = 'force-dynamic';

// Dynamically import Map component (no SSR)
const Map = dynamicImport(() => import('@/components/landing/MapboxMap'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-800 animate-pulse flex items-center justify-center text-white">Loading Map...</div>
});

export default function Home() {
  return (
    <>
      <Authenticated>
        <Link href="/dashboard">
          <Button className="fixed top-4 right-4 z-50 bg-emerald-600 hover:bg-emerald-700">
            Go to Dashboard
          </Button>
        </Link>
      </Authenticated>
      <PublicLandingPage />
    </>
  );
}

function PublicLandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeProjectIndex, setActiveProjectIndex] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinForm, setJoinForm] = useState({ firstName: '', lastName: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch real data
  const projects = useQuery(api.projects.getAllProjects);
  const events = useQuery(api.events.getUpcomingEvents, { limit: 6 });
  const rsvpToEvent = useMutation(api.events.rsvpToEvent);

  // Filter active/ongoing projects only
  const activeProjects = projects?.filter(p => p.status === 'active' || p.status === 'ongoing') || [];

  const handleJoinEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    setIsSubmitting(true);
    try {
      await rsvpToEvent({
        eventId: selectedEvent._id,
        action: "join",
        attendeeInfo: {
          firstName: joinForm.firstName,
          lastName: joinForm.lastName,
          phone: joinForm.phone,
        }
      });

      alert('✅ Successfully joined the event! We will contact you soon.');
      setShowJoinModal(false);
      setJoinForm({ firstName: '', lastName: '', phone: '' });
      setSelectedEvent(null);
    } catch (error) {
      alert('Failed to join event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-rotate projects every 5 seconds
  useEffect(() => {
    if (activeProjects.length <= 1) return;
    
    const timer = setInterval(() => {
      setActiveProjectIndex((prev) => (prev + 1) % activeProjects.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [activeProjects.length]);

  const currentProject = activeProjects[activeProjectIndex];

  return (
    <main className="min-h-screen bg-gray-900">
      {/* Compact Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="text-lg font-bold text-white">BarangayLink</span>
            </div>
            
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-6">
              <a href="#projects" className="text-sm text-gray-300 hover:text-emerald-400 transition-colors">Projects</a>
              <a href="#events" className="text-sm text-gray-300 hover:text-emerald-400 transition-colors">Events</a>
              <a href="#map" className="text-sm text-gray-300 hover:text-emerald-400 transition-colors">Map</a>
              <SignInButton>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                  Sign In
                </Button>
              </SignInButton>
            </div>

            {/* Mobile button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-300"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile Nav */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-800">
              <div className="flex flex-col space-y-3">
                <a href="#projects" className="text-sm text-gray-300">Projects</a>
                <a href="#events" className="text-sm text-gray-300">Events</a>
                <a href="#map" className="text-sm text-gray-300">Map</a>
                <SignInButton>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 w-full">
                    Sign In
                  </Button>
                </SignInButton>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* HERO: Full Viewport Projects Showcase */}
      <section id="projects" className="h-screen w-full relative pt-14">
        {currentProject ? (
          <div className="h-full w-full relative">
            {/* Background Image */}
            <div className="absolute inset-0">
              <img
                src={currentProject.imageUrl || 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1920&h=1080&fit=crop'}
                alt={currentProject.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/50"></div>
            </div>

            {/* Content Overlay */}
            <div className="relative z-10 h-full flex items-center">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="max-w-3xl">
                  {/* Project Badge */}
                  <div className="flex items-center gap-3 mb-6">
                    <Badge className="bg-emerald-600 text-white px-4 py-1.5 text-sm">
                      {currentProject.status?.toUpperCase() || 'ACTIVE'}
                    </Badge>
                    <span className="text-gray-300 text-sm">{currentProject.department}</span>
                  </div>

                  {/* Title */}
                  <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                    {currentProject.title}
                  </h1>

                  {/* Description */}
                  <p className="text-xl sm:text-2xl text-gray-300 mb-8 leading-relaxed">
                    {currentProject.description}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-6 mb-8">
                    <div>
                      <div className="text-3xl font-bold text-emerald-400">
                        {currentProject.progress || 0}%
                      </div>
                      <div className="text-sm text-gray-400">Progress</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-emerald-400">
                        {currentProject.assignedTo?.length || 0}
                      </div>
                      <div className="text-sm text-gray-400">Team Members</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-emerald-400">
                        ₱{((currentProject.budget || 0) / 1000000).toFixed(1)}M
                      </div>
                      <div className="text-sm text-gray-400">Budget</div>
                    </div>
                  </div>

                  {/* CTA */}
                  <SignInButton>
                    <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8">
                      View Full Details
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </SignInButton>
                </div>
              </div>
            </div>

            {/* Project Navigation Dots */}
            {activeProjects.length > 1 && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {activeProjects.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveProjectIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === activeProjectIndex
                        ? 'bg-emerald-500 w-8'
                        : 'bg-gray-600 hover:bg-gray-500'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Building className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Loading projects...</p>
            </div>
          </div>
        )}
      </section>

      {/* EVENTS: Compact Grid Section */}
      <section id="events" className="py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-white mb-3">
              Upcoming Events
            </h2>
            <p className="text-lg text-gray-400">
              Join community activities and stay connected
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events?.filter(e => e.isPublic && e.allowPublicRSVP).slice(0, 6).map((event) => (
              <div
                key={event._id}
                className="bg-gray-800 rounded-xl overflow-hidden hover:bg-gray-750 transition-all group"
              >
                <div className="aspect-video relative overflow-hidden bg-gray-700">
                  <img
                    src={event.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop'}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className="bg-emerald-600/20 text-emerald-400 border border-emerald-600/30">
                      {event.type}
                    </Badge>
                    {event.allowPublicRSVP && (
                      <Badge className="bg-blue-600/20 text-blue-400 border border-blue-600/30">
                        Open RSVP
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
                    {event.title}
                  </h3>
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                    {event.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(event.startDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {event.location}
                    </div>
                  </div>
                  {event.allowPublicRSVP && (
                    <Button
                      onClick={() => {
                        setSelectedEvent(event);
                        setShowJoinModal(true);
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                      size="sm"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Join Event
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {(!events || events.filter(e => e.isPublic).length === 0) && (
            <div className="text-center py-12 bg-gray-800 rounded-xl">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400">No upcoming events</p>
            </div>
          )}
        </div>
      </section>

      {/* MAP: Full Width Mapbox Integration */}
      <section id="map" className="h-screen w-full bg-gray-900">
        <div className="h-full relative">
          {/* Map Title Overlay */}
          <div className="absolute top-8 left-8 z-10 bg-gray-900/90 backdrop-blur-sm rounded-xl p-6 max-w-md">
            <h2 className="text-3xl font-bold text-white mb-2">
              Community Map
            </h2>
            <p className="text-gray-300">
              Explore Barangay Bitano and locate important facilities
            </p>
          </div>

          {/* Mapbox Component */}
          <Map />
        </div>
      </section>

      {/* JOIN EVENT MODAL */}
      {showJoinModal && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-800 rounded-2xl max-w-md w-full p-6 border border-gray-700">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Join Event</h3>
              <p className="text-gray-400">{selectedEvent.title}</p>
            </div>

            <form onSubmit={handleJoinEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={joinForm.firstName}
                  onChange={(e) => setJoinForm({ ...joinForm, firstName: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Juan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={joinForm.lastName}
                  onChange={(e) => setJoinForm({ ...joinForm, lastName: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Dela Cruz"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={joinForm.phone}
                  onChange={(e) => setJoinForm({ ...joinForm, phone: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="+63 912 345 6789"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isSubmitting ? 'Joining...' : 'Join Event'}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowJoinModal(false);
                    setSelectedEvent(null);
                    setJoinForm({ firstName: '', lastName: '', phone: '' });
                  }}
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOOTER: Compact */}
      <footer className="bg-gray-950 text-white py-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="text-lg font-bold">BarangayLink</span>
            </div>
            <p className="text-sm text-gray-400">
              © 2024 Barangay Bitano. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-emerald-400 transition-colors">Privacy</a>
              <a href="#" className="hover:text-emerald-400 transition-colors">Terms</a>
              <a href="#" className="hover:text-emerald-400 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
