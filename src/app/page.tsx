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
  CheckCircle2,
  Heart,
  Target,
  Award,
  Zap,
  BarChart3,
  Eye,
  PlayCircle,
  CheckCircle,
  MessageSquare,
  Star,
  Send,
  ThumbsUp,
  Lightbulb,
  AlertCircle as AlertCircleIcon,
  Smile
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
  
  // Feedback state
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    name: '',
    email: '',
    phone: '',
    type: 'comment' as 'comment' | 'suggestion' | 'concern' | 'appreciation',
    rating: 0,
    message: ''
  });
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // Fetch real data
  const featuredProjects = useQuery(api.projects.getFeaturedPublicProjects);
  const publicProjects = useQuery(api.projects.getPublicProjects, { limit: 9 });
  const events = useQuery(api.events.getUpcomingEvents, { limit: 6 });
  const rsvpToEvent = useMutation(api.events.rsvpToEvent);
  const submitFeedback = useMutation(api.projectFeedback.submitPublicFeedback);
  
  // Get feedback stats for all projects
  const projectIds = publicProjects?.map(p => p._id) || [];
  const feedbackStats = useQuery(
    api.projectFeedback.getProjectFeedbackStats, 
    projectIds.length > 0 ? { projectIds } : "skip"
  );

  // Use featured projects for hero, fallback to public projects
  const heroProjects = (featuredProjects && featuredProjects.length > 0) ? featuredProjects : (publicProjects?.slice(0, 3) || []);

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

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    setIsSubmitting(true);
    try {
      await submitFeedback({
        projectId: selectedProject._id,
        submitterName: feedbackForm.name,
        submitterEmail: feedbackForm.email || undefined,
        submitterPhone: feedbackForm.phone || undefined,
        feedbackType: feedbackForm.type,
        rating: feedbackForm.rating > 0 ? feedbackForm.rating : undefined,
        message: feedbackForm.message,
      });

      setFeedbackSuccess(true);
      setTimeout(() => {
        setShowFeedbackModal(false);
        setSelectedProject(null);
        setFeedbackForm({
          name: '',
          email: '',
          phone: '',
          type: 'comment',
          rating: 0,
          message: ''
        });
        setFeedbackSuccess(false);
      }, 2000);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-rotate projects every 5 seconds
  useEffect(() => {
    if (heroProjects.length <= 1) return;
    
    const timer = setInterval(() => {
      setActiveProjectIndex((prev) => (prev + 1) % heroProjects.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [heroProjects.length]);

  const currentProject = heroProjects[activeProjectIndex];

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
              <a href="#about" className="text-sm text-gray-300 hover:text-emerald-400 transition-colors">About</a>
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
                <a href="#about" className="text-sm text-gray-300">About</a>
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
            {heroProjects.length > 1 && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {heroProjects.map((_, index) => (
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

      {/* ABOUT: Barangay Bitano Section */}
      <section id="about" className="py-20 bg-gradient-to-b from-gray-900 to-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              About Barangay Bitano
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              A progressive community committed to transparency, collaboration, and sustainable development
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <div className="bg-gradient-to-br from-emerald-600/20 to-blue-600/20 rounded-2xl p-8 border border-emerald-500/20">
                <Heart className="w-12 h-12 text-emerald-400 mb-4" />
                <h3 className="text-2xl font-bold text-white mb-4">Our Mission</h3>
                <p className="text-gray-300 leading-relaxed">
                  To build a thriving, inclusive community through transparent governance, 
                  innovative project management, and active citizen participation. We leverage 
                  technology to keep our residents informed and engaged in every step of our 
                  community's development.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-xl bg-emerald-600/20 flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Transparent Governance</h4>
                  <p className="text-gray-400">Real-time updates on all community projects and initiatives</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Community Engagement</h4>
                  <p className="text-gray-400">Open participation in events and project planning</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Sustainable Development</h4>
                  <p className="text-gray-400">Environmentally conscious infrastructure projects</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-xl bg-orange-600/20 flex items-center justify-center flex-shrink-0">
                  <Award className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Excellence in Service</h4>
                  <p className="text-gray-400">Dedicated to delivering quality results for our community</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-gray-800/50 rounded-xl p-6 text-center border border-gray-700">
              <div className="text-3xl font-bold text-emerald-400 mb-2">
                {publicProjects?.length || 0}
              </div>
              <div className="text-sm text-gray-400">Active Projects</div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-6 text-center border border-gray-700">
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {events?.length || 0}
              </div>
              <div className="text-sm text-gray-400">Upcoming Events</div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-6 text-center border border-gray-700">
              <div className="text-3xl font-bold text-purple-400 mb-2">
                {publicProjects?.reduce((sum, p) => sum + (p.assignedTo?.length || 0), 0) || 0}
              </div>
              <div className="text-sm text-gray-400">Team Members</div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-6 text-center border border-gray-700">
              <div className="text-3xl font-bold text-orange-400 mb-2">
                100%
              </div>
              <div className="text-sm text-gray-400">Transparency</div>
            </div>
          </div>
        </div>
      </section>

      {/* PUBLIC PROJECTS: Full Showcase */}
      <section id="projects" className="py-20 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Community Projects
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Track the progress of ongoing Barangay development projects. 
              Every project is documented and accessible to the public.
            </p>
          </div>

          {publicProjects && publicProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicProjects.map((project: any) => (
                <div
                  key={project._id}
                  className="bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700 hover:border-emerald-500/50 transition-all group"
                >
                  {/* Project Image */}
                  <div className="aspect-video relative overflow-hidden bg-gray-700">
                    {project.imageUrl ? (
                      <img
                        src={project.imageUrl}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building className="w-16 h-16 text-gray-600" />
                      </div>
                    )}
                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-emerald-600 text-white">
                        {project.status?.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  {/* Project Details */}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className="bg-blue-600/20 text-blue-400 border border-blue-600/30 text-xs">
                        {project.department}
                      </Badge>
                      <Badge className="bg-purple-600/20 text-purple-400 border border-purple-600/30 text-xs">
                        {project.priority}
                      </Badge>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-emerald-400 transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                      {project.description}
                    </p>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400">Progress</span>
                        <span className="text-sm font-semibold text-emerald-400">
                          {project.progress || 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${project.progress || 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-white">
                          {project.assignedTo?.length || 0}
                        </div>
                        <div className="text-xs text-gray-500">Team</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-white">
                          {project.taskStats?.completed || 0}/{project.taskStats?.total || 0}
                        </div>
                        <div className="text-xs text-gray-500">Tasks</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-white">
                          ₱{((project.budget || 0) / 1000000).toFixed(1)}M
                        </div>
                        <div className="text-xs text-gray-500">Budget</div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <SignInButton>
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </SignInButton>
                      <Button
                        onClick={() => {
                          setSelectedProject(project);
                          setShowFeedbackModal(true);
                        }}
                        variant="outline"
                        className="border-blue-500 text-blue-400 hover:bg-blue-600/20"
                        size="sm"
                      >
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Feedback
                        {feedbackStats?.[project._id]?.count > 0 && (
                          <span className="ml-1 text-xs">({feedbackStats[project._id].count})</span>
                        )}
                      </Button>
                    </div>

                    {/* Feedback Stats */}
                    {feedbackStats?.[project._id] && feedbackStats[project._id].count > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-700 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-gray-400">
                          <MessageSquare className="w-3 h-3" />
                          <span>{feedbackStats[project._id].count} feedback</span>
                        </div>
                        {feedbackStats[project._id].averageRating > 0 && (
                          <div className="flex items-center gap-1 text-yellow-400">
                            <Star className="w-3 h-3 fill-yellow-400" />
                            <span>{feedbackStats[project._id].averageRating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-800/50 rounded-xl border border-gray-700">
              <Building className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400">No public projects available at this time</p>
            </div>
          )}

          {/* Call to Action */}
          <div className="mt-12 text-center">
            <div className="bg-gradient-to-r from-emerald-600/20 to-blue-600/20 rounded-2xl p-8 border border-emerald-500/20">
              <h3 className="text-2xl font-bold text-white mb-3">
                Want to Learn More?
              </h3>
              <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                Sign in to access detailed project information, timelines, budgets, and participate in community discussions.
              </p>
              <SignInButton>
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <PlayCircle className="w-5 h-5 mr-2" />
                  Get Started
                </Button>
              </SignInButton>
            </div>
          </div>
        </div>
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

      {/* FEEDBACK MODAL */}
      {showFeedbackModal && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 border border-gray-700">
            {feedbackSuccess ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Thank You!</h3>
                <p className="text-gray-300">
                  Your feedback has been submitted and will be reviewed by our team.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Submit Feedback</h3>
                  <p className="text-gray-400">{selectedProject.title}</p>
                </div>

                <form onSubmit={handleSubmitFeedback} className="space-y-4">
                  {/* Feedback Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Feedback Type *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFeedbackForm({ ...feedbackForm, type: 'comment' })}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          feedbackForm.type === 'comment'
                            ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                            : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        <MessageSquare className="w-5 h-5 mx-auto mb-1" />
                        <div className="text-xs">Comment</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFeedbackForm({ ...feedbackForm, type: 'suggestion' })}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          feedbackForm.type === 'suggestion'
                            ? 'border-purple-500 bg-purple-500/20 text-purple-400'
                            : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        <Lightbulb className="w-5 h-5 mx-auto mb-1" />
                        <div className="text-xs">Suggestion</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFeedbackForm({ ...feedbackForm, type: 'concern' })}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          feedbackForm.type === 'concern'
                            ? 'border-orange-500 bg-orange-500/20 text-orange-400'
                            : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        <AlertCircleIcon className="w-5 h-5 mx-auto mb-1" />
                        <div className="text-xs">Concern</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFeedbackForm({ ...feedbackForm, type: 'appreciation' })}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          feedbackForm.type === 'appreciation'
                            ? 'border-green-500 bg-green-500/20 text-green-400'
                            : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        <Smile className="w-5 h-5 mx-auto mb-1" />
                        <div className="text-xs">Appreciation</div>
                      </button>
                    </div>
                  </div>

                  {/* Rating */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Rating (Optional)
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                          className="p-2 transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-8 h-8 ${
                              star <= feedbackForm.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-600'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={feedbackForm.name}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, name: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Juan Dela Cruz"
                    />
                  </div>

                  {/* Email & Phone */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email (Optional)
                      </label>
                      <input
                        type="email"
                        value={feedbackForm.email}
                        onChange={(e) => setFeedbackForm({ ...feedbackForm, email: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="juan@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Phone (Optional)
                      </label>
                      <input
                        type="tel"
                        value={feedbackForm.phone}
                        onChange={(e) => setFeedbackForm({ ...feedbackForm, phone: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="+63 912 345 6789"
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Your Feedback *
                    </label>
                    <textarea
                      required
                      value={feedbackForm.message}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                      placeholder="Share your thoughts, suggestions, or concerns about this project..."
                      minLength={10}
                      maxLength={1000}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {feedbackForm.message.length}/1000 characters (minimum 10)
                    </p>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setShowFeedbackModal(false);
                        setSelectedProject(null);
                        setFeedbackForm({
                          name: '',
                          email: '',
                          phone: '',
                          type: 'comment',
                          rating: 0,
                          message: ''
                        });
                      }}
                      variant="outline"
                      className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </>
            )}
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
