"use client";

import Link from 'next/link';
import { Authenticated, Unauthenticated } from 'convex/react';
import { SignInButton, UserButton } from '@clerk/nextjs';

// Force dynamic rendering since this page uses Clerk components
export const dynamic = 'force-dynamic';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Calendar, 
  MapPin, 
  Briefcase, 
  TrendingUp, 
  Star, 
  Menu, 
  X,
  Phone,
  Clock,
  ChevronLeft,
  ChevronRight,
  Building,
  Globe
} from 'lucide-react';
import { ProjectsShowcase } from '@/components/landing/ProjectsShowcase';
import { MapboxPlaceholder } from '@/components/landing/MapboxPlaceholder';
import { EventsCalendarWidget } from '@/components/landing/EventsCalendarWidget';
import { useState } from 'react';

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

      {/* Community Success Stories Section */}
      <CommunitySuccessSection />
      
      {/* Quick Stats Section */}
      <section className="py-12 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

      {/* Community Success Stories Section */}
      <CommunitySuccessSection />

      <PublicEventsSection />
      <PublicProjectsSection />
      <PublicMapSection />
      <ServicesSection />
      <AboutSection />
      <ContactSection />
      <Footer />
    </main>
  );
}

function QuickStatsSection() {
  const projects = useQuery(api.projects.getActiveProjects);
  const events = useQuery(api.events.getUpcomingEvents);
  
  // Create dashboard data from available queries
  const dashboardData = {
    systemOverview: {
      totalUsers: 0, // Don't expose publicly
      activeUsers: 0,
      totalProjects: projects?.length || 0,
      activeProjects: projects?.filter(p => p.status === "active")?.length || 0,
      totalTasks: 0, // Don't expose publicly
      completedTasks: 0,
      totalBudget: projects?.reduce((sum, p) => sum + (p.budget || 0), 0) || 0,
      totalSpent: 0
    },
    recentActivity: events?.slice(0, 5)?.map(event => ({
      type: 'event',
      title: event.title,
      description: event.description,
      timestamp: event.startDate
    })) || []
  };
  
  const stats = [
    {
      title: "Active Projects",
      value: dashboardData?.systemOverview?.activeProjects || 0,
      icon: <Briefcase className="w-6 h-6" />,
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Upcoming Events",
      value: dashboardData?.recentActivity?.filter((activity: { type: string }) => activity.type === 'event')?.length || 0,
      icon: <Calendar className="w-6 h-6" />,
      color: "from-emerald-500 to-emerald-600"
    },
    {
      title: "Community Members",
      value: dashboardData?.systemOverview?.totalUsers || 0,
      icon: <Users className="w-6 h-6" />,
      color: "from-purple-500 to-purple-600"
    },
    {
      title: "Completed Tasks",
      value: dashboardData?.systemOverview?.completedTasks || 0,
      icon: <TrendingUp className="w-6 h-6" />,
      color: "from-green-500 to-green-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
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
          {services.map((service) => (
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
          {values.map((item) => (
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
            Have questions or need assistance? We&apos;re here to help you with all your barangay needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {contacts.map((item) => (
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

// Community Success Stories Carousel Section
function CommunitySuccessSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Mock success stories with actual event photos - in production, these would come from the database
  const successStories = [
    {
      id: 1,
      title: "Community Clean-Up Drive 2024",
      date: "March 15, 2024",
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=800&fit=crop",
      achievements: [
        "500+ volunteers participated",
        "15 tons of waste collected",
        "3 parks restored to pristine condition",
        "100% community satisfaction rate"
      ],
      impact: "Transformed our community into a cleaner, healthier environment for all residents.",
      category: "Environmental",
      participants: "500+ Volunteers",
      location: "Barangay Bitano Parks"
    },
    {
      id: 2,
      title: "Digital Literacy Program Launch",
      date: "February 20, 2024",
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&h=800&fit=crop",
      achievements: [
        "200+ seniors trained in digital skills",
        "95% completion rate",
        "50 new online service users",
        "24/7 digital support established"
      ],
      impact: "Bridged the digital divide and empowered our elderly community members.",
      category: "Education",
      participants: "200+ Seniors",
      location: "Community Learning Center"
    },
    {
      id: 3,
      title: "Youth Sports Festival 2024",
      date: "January 28, 2024",
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=800&fit=crop",
      achievements: [
        "300+ young athletes participated",
        "12 sports categories featured",
        "₱50,000 in scholarships awarded",
        "New sports equipment donated"
      ],
      impact: "Promoted healthy lifestyle and discovered new sporting talents in our community.",
      category: "Sports",
      participants: "300+ Athletes",
      location: "Barangay Sports Complex"
    },
    {
      id: 4,
      title: "Senior Citizens Health Fair",
      date: "December 10, 2023",
      image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=1200&h=800&fit=crop",
      achievements: [
        "400+ seniors received free checkups",
        "150 health screenings conducted",
        "100% vaccination coverage achieved",
        "Health monitoring program launched"
      ],
      impact: "Ensured the health and wellness of our senior community members.",
      category: "Healthcare",
      participants: "400+ Seniors",
      location: "Barangay Health Center"
    },
    {
      id: 5,
      title: "Tree Planting Initiative 2023",
      date: "November 5, 2023",
      image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1200&h=800&fit=crop",
      achievements: [
        "1,000+ trees planted",
        "250+ families participated",
        "5 hectares reforested",
        "Carbon footprint reduced by 30%"
      ],
      impact: "Created a greener, more sustainable environment for future generations.",
      category: "Environmental",
      participants: "250+ Families",
      location: "Barangay Hills Area"
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % successStories.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + successStories.length) % successStories.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const currentStory = successStories[currentSlide];

  return (
    <section className="relative py-20 lg:py-32 bg-gradient-to-br from-emerald-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-800 dark:text-emerald-400 text-sm font-medium mb-4">
            <Star className="w-4 h-4 mr-2" />
            Community Achievements
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Our <span className="text-emerald-600">Success Stories</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Celebrating the remarkable achievements and positive impact of our community events and initiatives.
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Main Carousel */}
          <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden">
            {/* Large Image */}
            <div className="relative h-96 lg:h-[600px]">
              <img 
                src={currentStory.image} 
                alt={currentStory.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
              
              {/* Category Badge */}
              <div className="absolute top-6 left-6">
                <Badge className="bg-emerald-600 text-white text-sm px-4 py-2">
                  {currentStory.category}
                </Badge>
              </div>

              {/* Navigation Arrows */}
              <button 
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button 
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              {/* Content Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8 text-white">
                <div className="max-w-4xl">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="flex items-center space-x-2 text-emerald-300">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm font-medium">{currentStory.date}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-emerald-300">
                      <Users className="w-4 h-4" />
                      <span className="text-sm font-medium">{currentStory.participants}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-emerald-300">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm font-medium">{currentStory.location}</span>
                    </div>
                  </div>
                  <h2 className="text-3xl lg:text-5xl font-bold mb-4">{currentStory.title}</h2>
                  <p className="text-lg lg:text-xl text-gray-200 mb-6 max-w-3xl">{currentStory.impact}</p>
                </div>
              </div>
            </div>

            {/* Achievements Section */}
            <div className="p-6 lg:p-8 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-gray-800 dark:to-gray-700">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Achievements Grid */}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                    <TrendingUp className="w-6 h-6 text-emerald-600 mr-3" />
                    Key Achievements
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {currentStory.achievements.map((achievement, i) => (
                      <div key={i} className="flex items-start space-x-3 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-emerald-100 dark:border-emerald-900/30">
                        <div className="w-3 h-3 bg-emerald-600 rounded-full mt-1.5 flex-shrink-0"></div>
                        <span className="text-gray-700 dark:text-gray-300 font-medium">{achievement}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Call to Action */}
                <div className="flex flex-col justify-center space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                      Join Our Community
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      Be part of our next success story. Together, we can create even more positive impact in our community.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      <Calendar className="w-4 h-4 mr-2" />
                      View Event Details
                    </Button>
                    <Button variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50">
                      <Users className="w-4 h-4 mr-2" />
                      Join Next Event
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Slide Indicators */}
          <div className="flex justify-center space-x-3 mt-8">
            {successStories.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  index === currentSlide 
                    ? 'bg-emerald-600 w-8' 
                    : 'bg-gray-300 dark:bg-gray-600 hover:bg-emerald-400'
                }`}
              />
            ))}
          </div>

          {/* Slide Counter */}
          <div className="text-center mt-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {currentSlide + 1} of {successStories.length}
            </span>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-20">
          <div className="bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl p-8 sm:p-12 text-white">
            <h3 className="text-2xl sm:text-3xl font-bold mb-4">
              Be Part of Our Next Success Story
            </h3>
            <p className="text-emerald-100 mb-8 max-w-2xl mx-auto">
              Join our thriving community and help us create more positive impact together. 
              Your participation makes the difference!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <SignInButton>
                <Button size="lg" className="bg-white text-emerald-600 hover:bg-gray-100">
                  <Users className="w-5 h-5 mr-2" />
                  Join Community
                </Button>
              </SignInButton>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                <Calendar className="w-5 h-5 mr-2" />
                View Upcoming Events
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Public Map Section with Mapbox Integration for Unregistered Users
function PublicMapSection() {
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  
  // Important locations in Barangay Bitano
  const importantLocations = [
    {
      id: 1,
      name: "Barangay Hall",
      type: "Government",
      description: "Main administrative center for all barangay services",
      coordinates: [121.0244, 14.5547], // Sample coordinates for Manila area
      services: ["Document Processing", "Permits & Licenses", "Community Services"],
      hours: "Mon-Fri: 8:00 AM - 5:00 PM",
      contact: "+63 2 1234 5678",
      icon: "🏛️"
    },
    {
      id: 2,
      name: "Health Center",
      type: "Healthcare",
      description: "Primary healthcare facility serving the community",
      coordinates: [121.0254, 14.5557],
      services: ["Medical Consultations", "Vaccinations", "Health Programs"],
      hours: "Mon-Sat: 7:00 AM - 6:00 PM",
      contact: "+63 2 1234 5679",
      icon: "🏥"
    },
    {
      id: 3,
      name: "Community Learning Center",
      type: "Education",
      description: "Educational hub for community programs and digital literacy",
      coordinates: [121.0234, 14.5537],
      services: ["Digital Training", "Skills Development", "Community Classes"],
      hours: "Mon-Fri: 9:00 AM - 7:00 PM",
      contact: "+63 2 1234 5680",
      icon: "📚"
    },
    {
      id: 4,
      name: "Sports Complex",
      type: "Recreation",
      description: "Multi-purpose sports facility for community events",
      coordinates: [121.0264, 14.5567],
      services: ["Sports Events", "Community Gatherings", "Youth Programs"],
      hours: "Daily: 6:00 AM - 10:00 PM",
      contact: "+63 2 1234 5681",
      icon: "⚽"
    },
    {
      id: 5,
      name: "Public Market",
      type: "Commerce",
      description: "Central marketplace for local vendors and fresh produce",
      coordinates: [121.0274, 14.5577],
      services: ["Fresh Produce", "Local Goods", "Community Vendors"],
      hours: "Daily: 5:00 AM - 8:00 PM",
      contact: "+63 2 1234 5682",
      icon: "🏪"
    }
  ];

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-800 dark:text-emerald-400 text-sm font-medium mb-4">
            <MapPin className="w-4 h-4 mr-2" />
            Community Map
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Explore <span className="text-emerald-600">Barangay Bitano</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Discover important locations, services, and facilities in our community. 
            Find what you need and plan your visit with our interactive map.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map Container */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
              {/* Map Placeholder with Mapbox-style design */}
              <div className="relative h-96 lg:h-[500px] bg-gradient-to-br from-emerald-100 to-green-200 dark:from-emerald-900/20 dark:to-green-900/20">
                {/* Simulated Map Interface */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-green-100 dark:from-gray-800 dark:to-gray-700">
                  {/* Map Grid Pattern */}
                  <div className="absolute inset-0 opacity-20">
                    <div className="grid grid-cols-8 grid-rows-6 h-full">
                      {Array.from({ length: 48 }).map((_, i) => (
                        <div key={i} className="border border-emerald-300 dark:border-emerald-700"></div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Location Markers */}
                  {importantLocations.map((location, index) => (
                    <button
                      key={location.id}
                      onClick={() => setSelectedLocation(location)}
                      className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 hover:scale-110 ${
                        selectedLocation?.id === location.id ? 'scale-125 z-10' : 'z-5'
                      }`}
                      style={{
                        left: `${20 + (index * 15)}%`,
                        top: `${30 + (index * 10)}%`
                      }}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg ${
                        location.type === 'Government' ? 'bg-blue-600' :
                        location.type === 'Healthcare' ? 'bg-red-600' :
                        location.type === 'Education' ? 'bg-purple-600' :
                        location.type === 'Recreation' ? 'bg-orange-600' :
                        'bg-green-600'
                      }`}>
                        <span className="text-lg">{location.icon}</span>
                      </div>
                      {selectedLocation?.id === location.id && (
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 min-w-48 z-20">
                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{location.name}</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{location.description}</p>
                        </div>
                      )}
                    </button>
                  ))}
                  
                  {/* Map Controls */}
                  <div className="absolute top-4 right-4 flex flex-col space-y-2">
                    <button className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <span className="text-lg font-bold">+</span>
                    </button>
                    <button className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <span className="text-lg font-bold">−</span>
                    </button>
                  </div>
                  
                  {/* Mapbox Attribution Style */}
                  <div className="absolute bottom-2 left-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>© Barangay Bitano | </span>
                    <a href="#" className="text-emerald-600 hover:underline">Mapbox</a>
                  </div>
                </div>
                
                {/* Coming Soon Overlay */}
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-6 text-center max-w-sm">
                    <Globe className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Interactive Map Coming Soon
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      We&apos;re working on bringing you a fully interactive Mapbox-powered map experience.
                    </p>
                    <SignInButton>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                        Join for Updates
                      </Button>
                    </SignInButton>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Location Details Sidebar */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Building className="w-5 h-5 text-emerald-600 mr-2" />
                Important Locations
              </h3>
              <div className="space-y-4">
                {importantLocations.map((location) => (
                  <button
                    key={location.id}
                    onClick={() => setSelectedLocation(location)}
                    className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                      selectedLocation?.id === location.id
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800'
                        : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{location.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                          {location.name}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                          {location.type}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Location Details */}
            {selectedLocation && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                <div className="flex items-start space-x-3 mb-4">
                  <span className="text-3xl">{selectedLocation.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedLocation.name}
                    </h3>
                    <Badge className="mt-1 text-xs">
                      {selectedLocation.type}
                    </Badge>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  {selectedLocation.description}
                </p>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Services:</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedLocation.services.map((service: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                    <Clock className="w-4 h-4" />
                    <span>{selectedLocation.hours}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                    <Phone className="w-4 h-4" />
                    <span>{selectedLocation.contact}</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700">
                    <MapPin className="w-4 h-4 mr-2" />
                    Get Directions
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              Join Our Community for Full Map Access
            </h3>
            <p className="text-emerald-100 mb-6 max-w-2xl mx-auto">
              Sign up to access our full interactive map with real-time updates, 
              personalized directions, and exclusive community features.
            </p>
            <SignInButton>
              <Button size="lg" className="bg-white text-emerald-600 hover:bg-gray-100">
                <Users className="w-5 h-5 mr-2" />
                Join Community
              </Button>
            </SignInButton>
          </div>
        </div>
      </div>
    </section>
  );
}