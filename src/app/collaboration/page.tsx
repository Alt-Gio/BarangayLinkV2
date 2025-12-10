"use client";

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Sidebar } from '@/components/layout/Sidebar';
import RippleLoader from '@/components/ui/RippleLoader';
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
  const [showPendingFeedback, setShowPendingFeedback] = useState(false);

  const currentUser = useQuery(api.users.getCurrentUser);
  const projects = useQuery(api.productivity.getProjects, { limit: 100 });
  const events = useQuery(api.events.getAllEvents, { status: "published" });
  
  const publicFeedback = useQuery(
    api.projectFeedback.getProjectFeedback,
    selectedResource?.type === 'project' ? { projectId: selectedResource.id as any } : "skip"
  );
  
  const pendingProjectFeedback = useQuery(
    api.projectFeedback.getAllFeedback,
    selectedResource?.type === 'project' && (currentUser?.userLevel?.name === 'ADMIN' || currentUser?.userLevel?.name === 'MANAGER')
      ? { status: "pending", limit: 50 } : "skip"
  );
  
  const selectedProjectPendingFeedback = pendingProjectFeedback?.filter(
    (f: any) => f.projectId === selectedResource?.id
  ) || [];
  
  const feedbackCount = useQuery(
    api.projectFeedback.getProjectFeedbackCount,
    selectedResource?.type === 'project' ? { projectId: selectedResource.id as any } : "skip"
  );
  
  const pendingFeedback = useQuery(
    api.projectFeedback.getAllFeedback,
    showPendingFeedback ? { status: "pending", limit: 50 } : "skip"
  );
  
  const approveFeedbackMut = useMutation(api.projectFeedback.approveFeedback);
  const rejectFeedbackMut = useMutation(api.projectFeedback.rejectFeedback);
  const markAsSpamMut = useMutation(api.projectFeedback.markAsSpam);

  if (!isLoaded || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 flex items-center justify-center">
        <RippleLoader size="lg" color="blue" text="Loading collaboration workspace..." />
      </div>
    );
  }

  const allResources = [
    ...(projects?.map((p: any) => ({ type: 'project', id: p._id, title: p.title, icon: FolderKanban })) || []),
    ...(events?.map((e: any) => ({ type: 'event', id: e._id, title: e.title, icon: Calendar })) || []),
  ];

  const filteredResources = allResources.filter((resource: any) => {
    if (resourceFilter !== 'all' && resource.type !== resourceFilter) return false;
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
        {/* Mobile Header with Hamburger + Centered Title */}
        <div className="md:hidden bg-white/5 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              aria-label="Toggle Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-white absolute left-1/2 transform -translate-x-1/2">
              Collaboration
            </h1>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-6">
          <div className="max-w-[1920px] mx-auto">
            {/* Desktop Header */}
            <div className="hidden md:flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                  <MessageSquare className="w-6 h-6 md:w-8 md:h-8 text-blue-400" />
                  Collaboration Workspace
                </h1>
                <p className="text-sm md:text-base text-gray-400 mt-1">Real-time comments and discussions</p>
              </div>
              <div className="flex items-center gap-3">
                {(currentUser?.userLevel?.name === 'ADMIN' || currentUser?.userLevel?.name === 'MANAGER') && (
                  <Button
                    onClick={() => setShowPendingFeedback(!showPendingFeedback)}
                    className={`${showPendingFeedback ? 'bg-emerald-600' : 'bg-gray-700'} hover:bg-emerald-700`}
                  >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {showPendingFeedback ? 'Hide' : 'Show'} Pending Feedback
                    {pendingFeedback && pendingFeedback.length > 0 && (
                      <Badge className="ml-2 bg-red-600">{pendingFeedback.length}</Badge>
                    )}
                  </Button>
                )}
                <div className="hidden md:block">
                  <LiveNotifications userId={currentUser._id} />
                </div>
              </div>
            </div>

            {/* Mobile Action Buttons */}
            <div className="md:hidden flex flex-col gap-2 mb-4">
              {(currentUser?.userLevel?.name === 'ADMIN' || currentUser?.userLevel?.name === 'MANAGER') && (
                <Button
                  onClick={() => setShowPendingFeedback(!showPendingFeedback)}
                  className={`${showPendingFeedback ? 'bg-emerald-600' : 'bg-gray-700'} hover:bg-emerald-700 w-full justify-center`}
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {showPendingFeedback ? 'Hide' : 'Show'} Pending Feedback
                  {pendingFeedback && pendingFeedback.length > 0 && (
                    <Badge className="ml-2 bg-red-600">{pendingFeedback.length}</Badge>
                  )}
                </Button>
              )}
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

            {/* Pending Feedback Moderation Panel */}
            {showPendingFeedback && pendingFeedback && pendingFeedback.length > 0 && (
              <Card className="bg-orange-900/20 border-orange-500/30 mb-6">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-400" />
                    Pending Feedback Moderation ({pendingFeedback.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
                  {pendingFeedback.map((feedback: any) => {
                    const handleApprove = async () => {
                      try {
                        await approveFeedbackMut({ feedbackId: feedback._id });
                        alert('✅ Feedback approved!');
                      } catch (error: any) {
                        alert('❌ ' + error.message);
                      }
                    };

                    const handleReject = async () => {
                      const reason = prompt('Reason for rejection (optional):');
                      try {
                        await rejectFeedbackMut({ feedbackId: feedback._id, reason: reason || undefined });
                        alert('✅ Feedback rejected!');
                      } catch (error: any) {
                        alert('❌ ' + error.message);
                      }
                    };

                    const handleSpam = async () => {
                      if (confirm('Mark this as spam?')) {
                        try {
                          await markAsSpamMut({ feedbackId: feedback._id });
                          alert('✅ Marked as spam!');
                        } catch (error: any) {
                          alert('❌ ' + error.message);
                        }
                      }
                    };

                    return (
                      <div key={feedback._id} className="bg-gray-800/70 border border-orange-500/20 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-white font-semibold">{feedback.submitterName}</p>
                            <p className="text-xs text-gray-400">
                              {feedback.project?.title} • {new Date(feedback.submittedAt).toLocaleString()}
                            </p>
                          </div>
                          <Badge className={`${
                            feedback.feedbackType === 'comment' ? 'bg-blue-600' :
                            feedback.feedbackType === 'suggestion' ? 'bg-purple-600' :
                            feedback.feedbackType === 'concern' ? 'bg-orange-600' :
                            'bg-green-600'
                          }`}>
                            {feedback.feedbackType}
                          </Badge>
                        </div>
                        
                        <p className="text-gray-300 text-sm mb-3">{feedback.message}</p>
                        
                        {feedback.rating && (
                          <div className="flex items-center gap-1 mb-3">
                            {[...Array(feedback.rating)].map((_, i) => (
                              <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        )}
                        
                        {(feedback.submitterEmail || feedback.submitterPhone) && (
                          <div className="text-xs text-gray-500 mb-3 pb-3 border-b border-gray-700">
                            {feedback.submitterEmail && <span>📧 {feedback.submitterEmail}</span>}
                            {feedback.submitterEmail && feedback.submitterPhone && <span className="mx-2">•</span>}
                            {feedback.submitterPhone && <span>📱 {feedback.submitterPhone}</span>}
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <Button
                            onClick={handleApprove}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 flex-1"
                          >
                            <ThumbsUp className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            onClick={handleReject}
                            size="sm"
                            variant="outline"
                            className="border-red-500 text-red-400 hover:bg-red-500/20 flex-1"
                          >
                            Reject
                          </Button>
                          <Button
                            onClick={handleSpam}
                            size="sm"
                            variant="outline"
                            className="border-gray-600 text-gray-400 hover:bg-gray-700"
                          >
                            Spam
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

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

                          {/* Pending Feedback Section (Admin/Manager only) */}
                          {selectedProjectPendingFeedback.length > 0 && (
                            <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4 mb-6">
                              <h3 className="text-orange-400 font-semibold mb-3 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5" />
                                Pending Approval ({selectedProjectPendingFeedback.length})
                              </h3>
                              <div className="space-y-3">
                                {selectedProjectPendingFeedback.map((feedback: any) => {
                                  const handleApprove = async () => {
                                    try {
                                      await approveFeedbackMut({ feedbackId: feedback._id });
                                      alert('✅ Feedback approved!');
                                    } catch (error: any) {
                                      alert('❌ ' + error.message);
                                    }
                                  };

                                  const handleReject = async () => {
                                    const reason = prompt('Reason for rejection (optional):');
                                    try {
                                      await rejectFeedbackMut({ feedbackId: feedback._id, reason: reason || undefined });
                                      alert('✅ Feedback rejected!');
                                    } catch (error: any) {
                                      alert('❌ ' + error.message);
                                    }
                                  };

                                  return (
                                    <div key={feedback._id} className="bg-gray-800/70 border border-orange-500/20 rounded-lg p-3">
                                      <div className="flex items-start justify-between mb-2">
                                        <div>
                                          <p className="text-white font-semibold text-sm">{feedback.submitterName}</p>
                                          <p className="text-xs text-gray-400">
                                            {feedback.feedbackType} • {new Date(feedback.submittedAt).toLocaleString()}
                                          </p>
                                        </div>
                                        {feedback.rating && (
                                          <div className="flex items-center gap-1">
                                            {[...Array(feedback.rating)].map((_, i) => (
                                              <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                      
                                      <p className="text-gray-300 text-sm mb-3">{feedback.message}</p>
                                      
                                      <div className="flex gap-2">
                                        <Button
                                          onClick={handleApprove}
                                          size="sm"
                                          className="bg-green-600 hover:bg-green-700 text-xs flex-1"
                                        >
                                          <ThumbsUp className="w-3 h-3 mr-1" />
                                          Approve
                                        </Button>
                                        <Button
                                          onClick={handleReject}
                                          size="sm"
                                          variant="outline"
                                          className="border-red-500 text-red-400 hover:bg-red-500/20 text-xs flex-1"
                                        >
                                          Reject
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Approved Feedback List */}
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
                                  No Approved Feedback Yet
                                </h3>
                                <p className="text-gray-400">
                                  {selectedProjectPendingFeedback.length > 0
                                    ? `There ${selectedProjectPendingFeedback.length === 1 ? 'is' : 'are'} ${selectedProjectPendingFeedback.length} pending feedback item${selectedProjectPendingFeedback.length === 1 ? '' : 's'} waiting for approval above.`
                                    : 'This project hasn\'t received any public feedback from the community yet.'}
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
