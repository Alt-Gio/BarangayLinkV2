"use client";

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Sidebar } from '@/components/layout/Sidebar';
import { LiveComments } from '@/components/collaboration/LiveComments';
import { LiveNotifications } from '@/components/collaboration/LiveNotifications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Users,
  FolderKanban,
  CheckSquare,
  Calendar,
  Menu,
  User,
  Search,
  Filter,
  Globe,
  Star,
  ThumbsUp,
  Lightbulb,
  AlertCircle,
  Smile,
} from 'lucide-react';
import { RoomProvider } from '@/liveblocks.config';
import { ConvexComments } from '@/components/collaboration/ConvexComments';

export default function CollaborationPage() {
  const { user, isLoaded } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<{ type: string; id: string; title: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [resourceFilter, setResourceFilter] = useState<'all' | 'project' | 'task' | 'event' | 'sprint'>('all');
  const [activeTab, setActiveTab] = useState<'comments' | 'public'>('comments');

  const currentUser = useQuery(api.users.getCurrentUser);
  const projects = useQuery(api.projects.getAllProjects);
  const events = useQuery(api.events.getAllEvents);
  
  // Get public feedback for selected project
  const publicFeedback = useQuery(
    api.projectFeedback.getProjectFeedback,
    selectedResource?.type === 'project' ? { projectId: selectedResource.id as any } : "skip"
  );
  
  // Get feedback stats
  const feedbackCount = useQuery(
    api.projectFeedback.getProjectFeedbackCount,
    selectedResource?.type === 'project' ? { projectId: selectedResource.id as any } : "skip"
  );

  if (!isLoaded || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading collaboration workspace...</p>
        </div>
      </div>
    );
  }

  // Combine all resources
  const allResources = [
    ...(projects?.map((p: any) => ({ type: 'project', id: p._id, title: p.title, icon: FolderKanban })) || []),
    ...(events?.map((e: any) => ({ type: 'event', id: e._id, title: e.title, icon: Calendar })) || []),
  ];

  // Filter resources
  const filteredResources = allResources.filter((resource: any) => {
    // Filter by type
    if (resourceFilter !== 'all' && resource.type !== resourceFilter) return false;

    // Filter by search
    if (searchQuery && !resource.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;

    return true;
  });

  const getResourceStats = () => {
    return {
      projects: projects?.length || 0,
      events: events?.length || 0,
    };
  };

  const stats = getResourceStats();

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
      <Sidebar
        userRole={currentUser?.userLevel?.name || "WORKER"}
        dashboardTitle="Collaboration"
        dashboardSubtitle="Real-time workspace"
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 overflow-y-auto">
        {/* Mobile Header */}
        <div className="md:hidden bg-gray-800 p-4 flex items-center justify-between sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-white">Collaboration</h1>
          <LiveNotifications userId={currentUser._id} />
        </div>

        <div className="p-6 space-y-6">
          <div className="max-w-[1920px] mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <MessageSquare className="w-8 h-8 text-blue-400" />
                  Collaboration Workspace
                </h1>
                <p className="text-gray-400 mt-1">Real-time comments and discussions</p>
              </div>
              <div className="hidden md:block">
                <LiveNotifications userId={currentUser._id} />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card className="bg-gray-800/50 border-gray-700/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-500/20 rounded-lg">
                      <FolderKanban className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{stats.projects}</div>
                      <div className="text-xs text-gray-400">Projects</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-500/20 rounded-lg">
                      <Calendar className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{stats.events}</div>
                      <div className="text-xs text-gray-400">Events</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Resource Selector */}
              <Card className="bg-gray-800/50 border-gray-700 lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    Select Resource
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Filter */}
                  <select
                    value={resourceFilter}
                    onChange={(e) => setResourceFilter(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all" className="bg-gray-900">All Resources</option>
                    <option value="project" className="bg-gray-900">Projects</option>
                    <option value="event" className="bg-gray-900">Events</option>
                  </select>

                  {/* Resource List */}
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {filteredResources.map((resource) => {
                      const Icon = resource.icon;
                      const isSelected = selectedResource?.id === resource.id;

                      return (
                        <button
                          key={resource.id}
                          onClick={() => setSelectedResource({ type: resource.type, id: resource.id, title: resource.title })}
                          className={`w-full p-3 rounded-lg text-left transition-all ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-900 text-gray-300 hover:bg-gray-800'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-4 h-4" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{resource.title}</div>
                              <div className="text-xs opacity-75 capitalize">{resource.type}</div>
                            </div>
                          </div>
                        </button>
                      );
                    })}

                    {filteredResources.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Filter className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No resources found</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Tabbed Content Section */}
              <Card className="bg-gray-800/50 border-gray-700 lg:col-span-2">
                {selectedResource ? (
                  <>
                    {/* Tabs */}
                    <div className="border-b border-gray-700 bg-gray-800/70">
                      <div className="flex">
                        <button
                          onClick={() => setActiveTab('comments')}
                          className={`flex-1 px-6 py-4 text-sm font-medium transition-all ${
                            activeTab === 'comments'
                              ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-500/10'
                              : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Internal Comments
                          </div>
                        </button>
                        {selectedResource.type === 'project' && (
                          <button
                            onClick={() => setActiveTab('public')}
                            className={`flex-1 px-6 py-4 text-sm font-medium transition-all ${
                              activeTab === 'public'
                                ? 'text-emerald-400 border-b-2 border-emerald-500 bg-emerald-500/10'
                                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                            }`}
                          >
                            <div className="flex items-center justify-center gap-2">
                              <Globe className="w-4 h-4" />
                              Public Feedback
                              {feedbackCount && feedbackCount.total > 0 && (
                                <Badge className="bg-emerald-600 text-white text-xs">
                                  {feedbackCount.total}
                                </Badge>
                              )}
                            </div>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Tab Content */}
                    <CardContent className="p-6">
                      {activeTab === 'comments' ? (
                        <ConvexComments
                          resourceType={selectedResource.type as any}
                          resourceId={selectedResource.id}
                          title={selectedResource.title}
                        />
                      ) : (
                        /* Public Feedback Tab */
                        <div className="space-y-4">
                          {/* Feedback Stats Header */}
                          {feedbackCount && feedbackCount.total > 0 && (
                            <div className="bg-gradient-to-r from-emerald-600/10 to-blue-600/10 border border-emerald-500/20 rounded-lg p-4 mb-6">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="text-lg font-semibold text-white mb-1">
                                    Community Feedback
                                  </h3>
                                  <p className="text-sm text-gray-400">
                                    {feedbackCount.total} feedback from the community
                                  </p>
                                </div>
                                {feedbackCount.averageRating > 0 && (
                                  <div className="text-right">
                                    <div className="flex items-center gap-2 text-yellow-400 mb-1">
                                      <Star className="w-5 h-5 fill-yellow-400" />
                                      <span className="text-2xl font-bold">
                                        {feedbackCount.averageRating.toFixed(1)}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-400">Average Rating</p>
                                  </div>
                                )}
                              </div>

                              {/* Feedback Type Breakdown */}
                              <div className="grid grid-cols-4 gap-2 mt-4">
                                <div className="text-center">
                                  <div className="text-blue-400 font-bold">{feedbackCount.byType.comment}</div>
                                  <div className="text-xs text-gray-500">Comments</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-purple-400 font-bold">{feedbackCount.byType.suggestion}</div>
                                  <div className="text-xs text-gray-500">Suggestions</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-orange-400 font-bold">{feedbackCount.byType.concern}</div>
                                  <div className="text-xs text-gray-500">Concerns</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-green-400 font-bold">{feedbackCount.byType.appreciation}</div>
                                  <div className="text-xs text-gray-500">Thanks</div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Feedback List */}
                          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                            {publicFeedback && publicFeedback.length > 0 ? (
                              publicFeedback.map((feedback) => {
                                const typeConfig = {
                                  comment: { icon: MessageSquare, color: 'blue', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20', textColor: 'text-blue-400' },
                                  suggestion: { icon: Lightbulb, color: 'purple', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20', textColor: 'text-purple-400' },
                                  concern: { icon: AlertCircle, color: 'orange', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/20', textColor: 'text-orange-400' },
                                  appreciation: { icon: Smile, color: 'green', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/20', textColor: 'text-green-400' },
                                };

                                const config = typeConfig[feedback.feedbackType];
                                const Icon = config.icon;

                                return (
                                  <div
                                    key={feedback._id}
                                    className={`${config.bgColor} border ${config.borderColor} rounded-lg p-4 transition-all hover:shadow-lg`}
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className={`p-2 ${config.bgColor} rounded-lg`}>
                                        <Icon className={`w-5 h-5 ${config.textColor}`} />
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-start justify-between mb-2">
                                          <div>
                                            <p className="text-white font-semibold">{feedback.submitterName}</p>
                                            <p className="text-xs text-gray-500 capitalize">
                                              {feedback.feedbackType} • {new Date(feedback.submittedAt).toLocaleDateString()}
                                            </p>
                                          </div>
                                          {feedback.rating && feedback.rating > 0 && (
                                            <div className="flex items-center gap-1">
                                              {[...Array(feedback.rating)].map((_, i) => (
                                                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                                          {feedback.message}
                                        </p>
                                        {(feedback.submitterEmail || feedback.submitterPhone) && (
                                          <div className="mt-3 pt-3 border-t border-gray-700/50 flex gap-4 text-xs text-gray-500">
                                            {feedback.submitterEmail && (
                                              <span>📧 {feedback.submitterEmail}</span>
                                            )}
                                            {feedback.submitterPhone && (
                                              <span>📱 {feedback.submitterPhone}</span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="text-center py-16">
                                <Globe className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-white mb-2">
                                  No Public Feedback Yet
                                </h3>
                                <p className="text-gray-400">
                                  This project hasn't received any public feedback from the community yet.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </>
                ) : (
                  <CardContent className="p-6">
                    <div className="text-center py-16">
                      <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Select a Resource
                      </h3>
                      <p className="text-gray-400">
                        Choose a project or event to view comments and public feedback
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
