"use client";

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  MessageSquare,
  Send,
  Check,
  X,
  Loader2,
  Filter,
  Search,
  CheckCircle2,
  Reply,
  Trash2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Id } from '../../../convex/_generated/dataModel';

interface ConvexCommentsProps {
  resourceType: 'project' | 'task' | 'event' | 'sprint' | 'document';
  resourceId: string;
  title?: string;
}

export function ConvexComments({ resourceType, resourceId, title }: ConvexCommentsProps) {
  const threads = useQuery(api.comments.getCommentThreads, {
    resourceType,
    resourceId,
  });
  
  const createComment = useMutation(api.comments.createComment);
  const toggleResolved = useMutation(api.comments.toggleResolved);
  const deleteComment = useMutation(api.comments.deleteComment);

  const [newCommentText, setNewCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [category, setCategory] = useState<'general' | 'question' | 'feedback' | 'bug' | 'feature'>('general');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [filterResolved, setFilterResolved] = useState<'all' | 'open' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Apply filters
  const filteredThreads = threads?.filter((thread: any) => {
    // Filter by resolved status
    if (filterResolved === 'open' && thread.resolved) return false;
    if (filterResolved === 'resolved' && !thread.resolved) return false;

    // Filter by search query
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesContent = thread.body?.toLowerCase().includes(searchLower);
      const matchesReplies = thread.replies?.some((reply: any) => 
        reply.body?.toLowerCase().includes(searchLower)
      );
      if (!matchesContent && !matchesReplies) return false;
    }

    return true;
  }) || [];

  const handleCreateComment = async () => {
    if (!newCommentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createComment({
        resourceType,
        resourceId: resourceId as any,
        body: newCommentText,
        category,
        priority,
      });

      setNewCommentText('');
      setCategory('general');
      setPriority('medium');
    } catch (error) {
      console.error('Failed to create comment:', error);
      alert('Failed to create comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (parentId: string) => {
    if (!replyText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createComment({
        resourceType,
        resourceId: resourceId as any,
        body: replyText,
        parentId: parentId as any,
      });

      setReplyText('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Failed to reply:', error);
      alert('Failed to post reply. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleResolved = async (commentId: string) => {
    try {
      await toggleResolved({ commentId: commentId as any });
    } catch (error) {
      console.error('Failed to toggle resolved:', error);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await deleteComment({ commentId: commentId as any });
    } catch (error) {
      console.error('Failed to delete comment:', error);
      alert('Failed to delete comment. Please try again.');
    }
  };

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

  if (threads === undefined) {
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
            Comments - {title || 'Discussion'}
          </h3>
          <Badge className="bg-blue-500/20 text-blue-300">
            {filteredThreads.length} {filteredThreads.length === 1 ? 'thread' : 'threads'}
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search comments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={filterResolved}
          onChange={(e) => setFilterResolved(e.target.value as any)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Comments</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* New Comment Form */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-4">
          <textarea
            placeholder="Write a comment..."
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
            rows={3}
            disabled={isSubmitting}
          />

          <div className="flex flex-wrap items-center gap-3 mt-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="px-3 py-1.5 bg-gray-900 border border-gray-700 rounded text-sm text-white focus:outline-none focus:border-blue-500"
              disabled={isSubmitting}
            >
              <option value="general">💬 General</option>
              <option value="question">❓ Question</option>
              <option value="feedback">💡 Feedback</option>
              <option value="bug">🐛 Bug</option>
              <option value="feature">✨ Feature</option>
            </select>

            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="px-3 py-1.5 bg-gray-900 border border-gray-700 rounded text-sm text-white focus:outline-none focus:border-blue-500"
              disabled={isSubmitting}
            >
              <option value="low">🟢 Low</option>
              <option value="medium">🟡 Medium</option>
              <option value="high">🔴 High</option>
            </select>

            <Button
              onClick={handleCreateComment}
              disabled={!newCommentText.trim() || isSubmitting}
              className="ml-auto bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Posting...</>
              ) : (
                <><Send className="w-4 h-4 mr-2" /> Post Comment</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Comments List */}
      {filteredThreads.length === 0 ? (
        <Card className="bg-gray-800/30 border-gray-700">
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
            key={thread._id}
            className={`border transition-all ${
              thread.resolved
                ? 'bg-gray-800/30 border-gray-700/30 opacity-75'
                : 'bg-gray-800/50 border-gray-700 hover:border-blue-500/30'
            }`}
          >
            <CardContent className="p-4 space-y-3">
              {/* Thread Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    {thread.category && (
                      <Badge className={`text-xs border ${getCategoryColor(thread.category)}`}>
                        {thread.category}
                      </Badge>
                    )}
                    {thread.priority && (
                      <span className={`text-xs font-medium ${getPriorityColor(thread.priority)}`}>
                        {thread.priority.toUpperCase()}
                      </span>
                    )}
                    {thread.resolved && (
                      <Badge className="bg-green-500/20 text-green-300 text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Resolved
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleToggleResolved(thread._id)}
                    size="sm"
                    className={`${
                      thread.resolved
                        ? 'bg-gray-700 hover:bg-gray-600'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {thread.resolved ? (
                      <><X className="w-4 h-4 mr-1" /> Reopen</>
                    ) : (
                      <><Check className="w-4 h-4 mr-1" /> Resolve</>
                    )}
                  </Button>
                  
                  <Button
                    onClick={() => handleDelete(thread._id)}
                    size="sm"
                    variant="ghost"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Main Comment */}
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  {thread.userAvatar ? (
                    <img src={thread.userAvatar} alt="" className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                      {thread.userName?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white">{thread.userName}</span>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(thread.createdAt, { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-gray-300 whitespace-pre-wrap">{thread.body}</p>

                  <button
                    onClick={() => setReplyingTo(thread._id === replyingTo ? null : thread._id)}
                    className="mt-2 text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <Reply className="w-4 h-4" />
                    Reply {thread.replyCount > 0 && `(${thread.replyCount})`}
                  </button>
                </div>
              </div>

              {/* Replies */}
              {thread.replies && thread.replies.length > 0 && (
                <div className="ml-12 space-y-3 border-l-2 border-gray-700 pl-4">
                  {thread.replies.map((reply: any) => (
                    <div key={reply._id} className="flex gap-3">
                      <div className="flex-shrink-0">
                        {reply.userAvatar ? (
                          <img src={reply.userAvatar} alt="" className="w-8 h-8 rounded-full" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm font-semibold">
                            {reply.userName?.[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-white text-sm">{reply.userName}</span>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(reply.createdAt, { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm whitespace-pre-wrap">{reply.body}</p>
                      </div>

                      <Button
                        onClick={() => handleDelete(reply._id)}
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Form */}
              {replyingTo === thread._id && (
                <div className="ml-12 mt-3">
                  <textarea
                    placeholder="Write a reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none text-sm"
                    rows={2}
                    disabled={isSubmitting}
                  />
                  <div className="flex gap-2 mt-2">
                    <Button
                      onClick={() => handleReply(thread._id)}
                      disabled={!replyText.trim() || isSubmitting}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Send className="w-3 h-3 mr-1" />
                      )}
                      Reply
                    </Button>
                    <Button
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyText('');
                      }}
                      size="sm"
                      variant="ghost"
                      className="text-gray-400"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
