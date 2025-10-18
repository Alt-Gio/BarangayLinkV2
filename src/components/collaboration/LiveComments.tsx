"use client";

import { useState } from 'react';
import { useThreads, useCreateThread, useCreateComment, useEditThreadMetadata } from '@/liveblocks.config';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  MessageSquare,
  Send,
  Check,
  X,
  MoreVertical,
  Tag,
  User,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Filter,
  Search,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface LiveCommentsProps {
  resourceType: 'project' | 'task' | 'event' | 'sprint' | 'document';
  resourceId: string;
  title?: string;
}

export function LiveComments({ resourceType, resourceId, title }: LiveCommentsProps) {
  const { threads, isLoading } = useThreads();
  const createThread = useCreateThread();
  const createComment = useCreateComment();
  const editThreadMetadata = useEditThreadMetadata();

  const [newCommentText, setNewCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [category, setCategory] = useState<'general' | 'question' | 'feedback' | 'bug' | 'feature'>('general');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [filterResolved, setFilterResolved] = useState<'all' | 'open' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter threads for this resource
  const resourceThreads = threads?.filter(
    (thread: any) => thread.metadata.resourceType === resourceType && thread.metadata.resourceId === resourceId
  ) || [];

  // Apply filters
  const filteredThreads = resourceThreads.filter((thread: any) => {
    // Filter by resolved status
    if (filterResolved === 'open' && thread.metadata.resolved) return false;
    if (filterResolved === 'resolved' && !thread.metadata.resolved) return false;

    // Filter by search query
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesContent = thread.comments.some((comment: any) => 
        comment.body?.toLowerCase().includes(searchLower)
      );
      const matchesCategory = thread.metadata.category?.toLowerCase().includes(searchLower);
      if (!matchesContent && !matchesCategory) return false;
    }

    return true;
  });

  const handleCreateComment = async () => {
    if (!newCommentText.trim()) return;

    try {
      const thread = await createThread({
        body: newCommentText,
        metadata: {
          resolved: false,
          resourceType,
          resourceId,
          category,
          priority,
          createdAt: Date.now(),
        },
      });

      setNewCommentText('');
      setCategory('general');
      setPriority('medium');
    } catch (error) {
      console.error('Failed to create comment:', error);
    }
  };

  const handleReply = async (threadId: string) => {
    if (!replyText.trim()) return;

    try {
      await createComment({ threadId, body: replyText });
      setReplyText('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Failed to reply:', error);
    }
  };

  const toggleResolved = async (threadId: string, currentResolved: boolean) => {
    try {
      await editThreadMetadata({
        threadId,
        metadata: { resolved: !currentResolved },
      });
    } catch (error) {
      console.error('Failed to toggle resolved:', error);
    }
  };

  // Note: Delete functionality requires additional Liveblocks permissions

  const getCategoryColor = (cat: string) => {
    const colors = {
      question: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      feedback: 'bg-green-500/20 text-green-300 border-green-500/30',
      bug: 'bg-red-500/20 text-red-300 border-red-500/30',
      feature: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      general: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    };
    return colors[cat as keyof typeof colors] || colors.general;
  };

  const getPriorityColor = (pri: string) => {
    const colors = {
      low: 'text-green-400',
      medium: 'text-yellow-400',
      high: 'text-red-400',
    };
    return colors[pri as keyof typeof colors] || colors.medium;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-400">Loading comments...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">
            Comments {title && `- ${title}`}
          </h3>
          <Badge className="bg-blue-500/20 text-blue-300">
            {filteredThreads.length} {filteredThreads.length === 1 ? 'thread' : 'threads'}
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search comments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterResolved}
          onChange={(e) => setFilterResolved(e.target.value as any)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all" className="bg-gray-900">All Comments</option>
          <option value="open" className="bg-gray-900">Open</option>
          <option value="resolved" className="bg-gray-900">Resolved</option>
        </select>
      </div>

      {/* New Comment Form */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-4 space-y-3">
          <textarea
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="Write a comment..."
            rows={3}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="general" className="bg-gray-900">💬 General</option>
              <option value="question" className="bg-gray-900">❓ Question</option>
              <option value="feedback" className="bg-gray-900">💡 Feedback</option>
              <option value="bug" className="bg-gray-900">🐛 Bug</option>
              <option value="feature" className="bg-gray-900">✨ Feature</option>
            </select>

            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low" className="bg-gray-900">🟢 Low</option>
              <option value="medium" className="bg-gray-900">🟡 Medium</option>
              <option value="high" className="bg-gray-900">🔴 High</option>
            </select>

            <Button
              onClick={handleCreateComment}
              disabled={!newCommentText.trim()}
              className="ml-auto bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Send className="w-4 h-4 mr-2" />
              Post Comment
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Comment Threads */}
      <div className="space-y-3">
        {filteredThreads.length === 0 ? (
          <Card className="bg-gray-800/30 border-gray-700/50">
            <CardContent className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">
                {searchQuery || filterResolved !== 'all' 
                  ? 'No comments match your filters'
                  : 'No comments yet. Be the first to comment!'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredThreads.map((thread: any) => (
            <Card
              key={thread.id}
              className={`border transition-all ${
                thread.metadata.resolved
                  ? 'bg-gray-800/30 border-gray-700/30 opacity-75'
                  : 'bg-gray-800/50 border-gray-700 hover:border-blue-500/30'
              }`}
            >
              <CardContent className="p-4 space-y-3">
                {/* Thread Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      {thread.metadata.category && (
                        <Badge className={`text-xs ${getCategoryColor(thread.metadata.category)}`}>
                          {thread.metadata.category}
                        </Badge>
                      )}
                      {thread.metadata.priority && (
                        <span className={`text-xs font-medium ${getPriorityColor(thread.metadata.priority)}`}>
                          {thread.metadata.priority.toUpperCase()}
                        </span>
                      )}
                      {thread.metadata.resolved && (
                        <Badge className="bg-green-500/20 text-green-300 text-xs">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Resolved
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => toggleResolved(thread.id, thread.metadata.resolved || false)}
                      size="sm"
                      className={`${
                        thread.metadata.resolved
                          ? 'bg-gray-700 hover:bg-gray-600'
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {thread.metadata.resolved ? (
                        <><X className="w-4 h-4 mr-1" /> Reopen</>
                      ) : (
                        <><Check className="w-4 h-4 mr-1" /> Resolve</>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Thread Comments */}
                <div className="space-y-3">
                  {thread.comments.map((comment: any, index: number) => (
                    <div
                      key={comment.id}
                      className={`${
                        index === 0 ? '' : 'ml-6 pl-4 border-l-2 border-gray-700'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-white text-sm">
                              {comment.userId || 'Anonymous'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-gray-300 text-sm whitespace-pre-wrap">
                            {comment.body}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply Form */}
                {replyingTo === thread.id ? (
                  <div className="ml-6 pl-4 border-l-2 border-blue-500 space-y-2">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write a reply..."
                      rows={2}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleReply(thread.id)}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Send className="w-3 h-3 mr-1" />
                        Reply
                      </Button>
                      <Button
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyText('');
                        }}
                        size="sm"
                        variant="outline"
                        className="border-gray-600"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="ml-6">
                    <Button
                      onClick={() => setReplyingTo(thread.id)}
                      size="sm"
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <MessageSquare className="w-3 h-3 mr-1" />
                      Reply
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
