"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Authenticated, Unauthenticated } from 'convex/react';
import { SignInButton, UserButton } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EventsCalendarWidget } from '@/components/landing/EventsCalendarWidget';
import { ProjectsShowcase } from '@/components/landing/ProjectsShowcase';
import { MapboxPlaceholder } from '@/components/landing/MapboxPlaceholder';
import { 
  Calendar,
  MapPin,
  Users,
  Briefcase,
  FileText,
  Clock,
  ChevronRight,
  Star,
  TrendingUp,
  Activity,
  Building,
  Phone,
  Mail,
  Globe,
  Menu,
  X
} from 'lucide-react';

export default function Home() {
  return (
    <>
      <Authenticated>
        <AuthenticatedLandingPage />
      </Authenticated>
      <Unauthenticated>
        <PublicLandingPage />
      </Unauthenticated>
    </>
  );
}

function AuthenticatedLandingPage() {
  const currentUser = useQuery(api.users.getCurrentUser);
  
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Authenticated Navigation */}
      <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-green-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">BarangayLink</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Welcome, {currentUser?.name}
              </span>
              <Link href="/dashboard">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  Go to Dashboard
                </Button>
              </Link>
              <UserButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section for Authenticated Users */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Welcome Back to <span className="text-emerald-600">BarangayLink</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
              Your personalized dashboard for community engagement and project management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                  <Activity className="w-5 h-5 mr-2" />
                  View Dashboard
                </Button>
              </Link>
              <Link href="/projects">
                <Button size="lg" variant="outline">
                  <Briefcase className="w-5 h-5 mr-2" />
                  Browse Projects
                </Button>
              </Link>
            </div>
          </div>
          
          <QuickStatsSection />
        </div>
      </section>

      <RecentEventsSection />
      <OngoingProjectsSection />
      <CommunityMapSection />
    </main>
  );
}

function PublicLandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      {/* Public Navigation */}
      <nav className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-green-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">BarangayLink</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#about" className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 transition-colors">About</a>
              <a href="#services" className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 transition-colors">Services</a>
              <a href="#events" className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 transition-colors">Events</a>
              <a href="#projects" className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 transition-colors">Projects</a>
              <a href="#contact" className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 transition-colors">Contact</a>
              <SignInButton>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  Sign In
                </Button>
              </SignInButton>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-gray-600 dark:text-gray-300"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col space-y-4">
                <a href="#about" className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 transition-colors">About</a>
                <a href="#services" className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 transition-colors">Services</a>
                <a href="#events" className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 transition-colors">Events</a>
                <a href="#projects" className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 transition-colors">Projects</a>
                <a href="#contact" className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 transition-colors">Contact</a>
                <SignInButton>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 w-full">
                    Sign In
                  </Button>
                </SignInButton>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Public Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Welcome to <span className="text-emerald-600">Barangay Bitano</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
              Your digital gateway to transparent governance, community engagement, and efficient public services.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <SignInButton>
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                  <Users className="w-5 h-5 mr-2" />
                  Join Community
                </Button>
              </SignInButton>
              <Button size="lg" variant="outline">
                <FileText className="w-5 h-5 mr-2" />
                Request Documents
              </Button>
            </div>
          </div>
        </div>
      </section>

      <PublicEventsSection />
      <PublicProjectsSection />
      <ServicesSection />
      <AboutSection />
      <ContactSection />
      <Footer />
    </main>
  );
}

function QuickStatsSection() {
  const dashboardData = useQuery(api.dashboards.getAdminDashboard);
  
  const stats = [
    {
      title: "Active Projects",
      value: dashboardData?.projectStats?.activeProjects || 0,
      icon: <Briefcase className="w-6 h-6" />,
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Upcoming Events",
      value: dashboardData?.upcomingEvents?.length || 0,
      icon: <Calendar className="w-6 h-6" />,
      color: "from-emerald-500 to-emerald-600"
    },
    {
      title: "Community Members",
      value: dashboardData?.userStats?.totalUsers || 0,
      icon: <Users className="w-6 h-6" />,
      color: "from-purple-500 to-purple-600"
    },
    {
      title: "Completed Tasks",
      value: dashboardData?.taskStats?.completedTasks || 0,
      icon: <TrendingUp className="w-6 h-6" />,
      color: "from-green-500 to-green-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card key={stat.title} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center text-white`}>
                {stat.icon}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function RecentEventsSection() {
  return (
    <section id="events" className="py-20 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Recent Events
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Stay updated with community activities and upcoming events
          </p>
        </div>
        <EventsCalendarWidget />
      </div>
    </section>
  );
}

function OngoingProjectsSection() {
  return (
    <section id="projects" className="py-20 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Ongoing Projects
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Track progress of community development initiatives
          </p>
        </div>
        <ProjectsShowcase />
      </div>
    </section>
  );
}

function CommunityMapSection() {
  return (
    <section id="map" className="py-20 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Community Map
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Explore Barangay Bitano and locate important facilities
          </p>
        </div>
        <MapboxPlaceholder />
      </div>
    </section>
  );
}

// Public sections for unauthenticated users
function PublicEventsSection() {
  return (
    <section id="events" className="py-20 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Community Events
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Stay updated with community activities and upcoming events
          </p>
        </div>
        <EventsCalendarWidget />
      </div>
    </section>
  );
}

function PublicProjectsSection() {
  return (
    <section id="projects" className="py-20 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Community Projects
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Track progress of ongoing community development initiatives
          </p>
        </div>
        <ProjectsShowcase />
      </div>
    </section>
  );
}

function ServicesSection() {
  const services = [
    {
      title: "Document Requests",
      description: "Get barangay clearances, certificates, and official documents with ease.",
      icon: "📄",
      color: "from-green-500 to-emerald-500"
    },
    {
      title: "Community Events",
      description: "Stay updated with local events, meetings, and community activities.",
      icon: "🎉",
      color: "from-emerald-500 to-teal-500"
    },
    {
      title: "Project Updates",
      description: "Track ongoing development projects and infrastructure improvements.",
      icon: "🏗️",
      color: "from-teal-500 to-cyan-500"
    },
    {
      title: "Financial Reports",
      description: "Access transparent financial reports and budget information.",
      icon: "💰",
      color: "from-cyan-500 to-blue-500"
    },
    {
      title: "Task Management",
      description: "Efficient task tracking and project management for staff.",
      icon: "✅",
      color: "from-blue-500 to-indigo-500"
    },
    {
      title: "24/7 Support",
      description: "Round-the-clock assistance for all your barangay needs.",
      icon: "🆘",
      color: "from-indigo-500 to-purple-500"
    }
  ];

  return (
    <section id="services" className="py-20 lg:py-32 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Our Services
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Comprehensive government services designed to serve our community efficiently and transparently.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card key={service.title} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-emerald-100 dark:border-emerald-900/30 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-8">
                <div className={`w-16 h-16 bg-gradient-to-br ${service.color} rounded-2xl flex items-center justify-center text-2xl mb-6`}>
                  {service.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  {service.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {service.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  const values = [
    {
      title: "Our Mission",
      description: "To provide efficient, transparent, and accessible government services that empower our community and promote sustainable development.",
      icon: "🎯"
    },
    {
      title: "Our Vision",
      description: "To be a model barangay known for innovation, community engagement, and excellence in public service delivery.",
      icon: "👁️"
    },
    {
      title: "Our Values",
      description: "Integrity, transparency, community service, innovation, and sustainable development guide everything we do.",
      icon: "💎"
    }
  ];

  return (
    <section id="about" className="py-20 lg:py-32 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            About Barangay Bitano
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Learn about our mission, history, and commitment to serving our community with excellence.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {values.map((item, index) => (
            <Card key={item.title} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-emerald-100 dark:border-emerald-900/30 text-center">
              <CardContent className="p-8">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  {item.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  const contacts = [
    { icon: "📞", title: "Phone", contact: "+63 912 345 6789" },
    { icon: "📧", title: "Email", contact: "info@barangaybitano.gov.ph" },
    { icon: "📍", title: "Address", contact: "Barangay Bitano, Legazpi City, Albay" },
    { icon: "🕒", title: "Hours", contact: "Monday - Friday, 8:00 AM - 5:00 PM" }
  ];

  return (
    <section id="contact" className="py-20 lg:py-32 bg-gradient-to-br from-emerald-600 to-green-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Get In Touch
          </h2>
          <p className="text-lg sm:text-xl text-emerald-100 max-w-3xl mx-auto">
            Have questions or need assistance? We're here to help you with all your barangay needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {contacts.map((item, index) => (
            <Card key={item.title} className="bg-white/10 backdrop-blur-sm border-white/20 text-center">
              <CardContent className="p-6">
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-emerald-100">{item.contact}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button className="px-8 py-4 bg-white text-emerald-600 rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            Submit Complaint or Inquiry
          </Button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-green-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold">B</span>
              </div>
              <span className="text-xl font-bold">BarangayLink</span>
            </div>
            <p className="text-gray-400">
              Empowering Barangay Bitano with digital innovation and transparent governance.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Services</h3>
            <ul className="space-y-2 text-gray-400">
              <li>Document Requests</li>
              <li>Community Events</li>
              <li>Project Updates</li>
              <li>Financial Reports</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Community</h3>
            <ul className="space-y-2 text-gray-400">
              <li>Events Calendar</li>
              <li>News & Updates</li>
              <li>Directory</li>
              <li>Contact Us</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Connect</h3>
            <ul className="space-y-2 text-gray-400">
              <li>Facebook</li>
              <li>Twitter</li>
              <li>Instagram</li>
              <li>LinkedIn</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 Barangay Bitano. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}