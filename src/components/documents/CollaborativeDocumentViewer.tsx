"use client";

import { useState, useEffect } from 'react';
import { useRoom, useSelf, useOthers, useMyPresence } from "@/liveblocks.config";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  File, Download, X, Users, Eye, MessageSquare, Pen
} from 'lucide-react';

interface CollaborativeDocumentViewerProps {
  document: any;
  onClose: () => void;
}

export function CollaborativeDocumentViewer({ document, onClose }: CollaborativeDocumentViewerProps) {
  const room = useRoom();
  const self = useSelf();
  const others = useOthers();
  const [myPresence, updateMyPresence] = useMyPresence();
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [annotations, setAnnotations] = useState<any[]>([]);

  // Get file URL on mount
  useEffect(() => {
    const getUrl = async () => {
      try {
        const url = `${process.env.NEXT_PUBLIC_CONVEX_URL}/api/storage/${document.storageId}`;
        setFileUrl(url);
        
        // Update presence to show viewing this document
        updateMyPresence({ 
          viewing: document._id,
          viewingName: document.fileName
        });
      } catch (error) {
        console.error('Failed to get file URL:', error);
      } finally {
        setLoading(false);
      }
    };
    getUrl();

    return () => {
      // Clear presence when unmounting
      updateMyPresence({ viewing: null, viewingName: null });
    };
  }, [document.storageId, document._id, document.fileName, updateMyPresence]);

  // Get other users viewing this document
  const viewersCount = others.filter((other) => 
    other.presence?.viewing === document._id
  ).length + 1; // +1 for self

  const handleDownload = () => {
    if (fileUrl) {
      const a = window.document.createElement('a');
      a.href = fileUrl;
      a.download = document.fileName;
      a.click();
    }
  };

  const handleAddComment = () => {
    if (newComment.trim() && self) {
      const comment = {
        id: Date.now().toString(),
        text: newComment,
        userId: self.id,
        userName: self.info?.name || 'Anonymous',
        timestamp: Date.now()
      };
      setComments([...comments, comment]);
      setNewComment('');
      
      // Broadcast comment via Liveblocks
      room.broadcastEvent({
        type: 'comment-added',
        comment
      });
    }
  };

  // Listen for comments from other users
  useEffect(() => {
    const unsubscribe = room.subscribe("event", ({ event }: any) => {
      if (event.type === 'comment-added') {
        setComments((prev) => [...prev, event.comment]);
      }
    });

    return () => unsubscribe();
  }, [room]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-gray-900 rounded-xl border border-white/10 max-w-7xl w-full h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <h3 className="text-white font-semibold">{document.fileName}</h3>
            
            {/* Live Viewers */}
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-600/20 rounded-full">
              <Users className="w-4 h-4 text-emerald-500" />
              <span className="text-emerald-400 text-sm">{viewersCount} viewing</span>
            </div>

            {/* Active Users Avatars */}
            <div className="flex -space-x-2">
              {self && (
                <div className="w-8 h-8 rounded-full bg-emerald-600 border-2 border-gray-900 flex items-center justify-center text-white text-xs font-semibold">
                  {self.info?.name?.[0] || 'Y'}
                </div>
              )}
              {others
                .filter((other) => other.presence?.viewing === document._id)
                .slice(0, 3)
                .map((other, index) => (
                  <div
                    key={other.id}
                    className="w-8 h-8 rounded-full bg-blue-600 border-2 border-gray-900 flex items-center justify-center text-white text-xs font-semibold"
                    style={{
                      backgroundColor: `hsl(${(index * 137) % 360}, 70%, 50%)`
                    }}
                  >
                    {other.info?.name?.[0] || '?'}
                  </div>
                ))}
              {others.filter((other) => other.presence?.viewing === document._id).length > 3 && (
                <div className="w-8 h-8 rounded-full bg-gray-700 border-2 border-gray-900 flex items-center justify-center text-white text-xs font-semibold">
                  +{others.filter((other) => other.presence?.viewing === document._id).length - 3}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleDownload}
              variant="outline"
              size="sm"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Document Viewer */}
          <div className="flex-1 overflow-auto p-4 bg-gray-950">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : fileUrl && document.mimeType.startsWith('image/') ? (
              <img src={fileUrl} alt={document.fileName} className="max-w-full h-auto mx-auto" />
            ) : fileUrl && document.mimeType.includes('pdf') ? (
              <iframe 
                src={fileUrl} 
                className="w-full h-full min-h-[600px]" 
                title={document.fileName}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-8">
                  <File className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">Preview not available for this file type</p>
                  <Button
                    onClick={handleDownload}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download File
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Collaboration Sidebar */}
          <div className="w-80 border-l border-white/10 flex flex-col bg-gray-900">
            {/* Comments Section */}
            <div className="p-4 border-b border-white/10">
              <h4 className="text-white font-semibold flex items-center gap-2 mb-4">
                <MessageSquare className="w-4 h-4 text-emerald-500" />
                Comments ({comments.length})
              </h4>
              
              {/* Comment Input */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Button
                  onClick={handleAddComment}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Pen className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {comments.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No comments yet</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-emerald-400 text-sm font-medium">
                        {comment.userName}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {new Date(comment.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm">{comment.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Activity Feed */}
            <div className="p-4 border-t border-white/10">
              <h4 className="text-white font-semibold text-sm mb-3">Activity</h4>
              <div className="space-y-2">
                {others
                  .filter((other) => other.presence?.viewing === document._id)
                  .map((other) => (
                    <div key={other.id} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-gray-400">
                        {other.info?.name || 'Anonymous'} is viewing
                      </span>
                    </div>
                  ))}
                {others.filter((other) => other.presence?.viewing === document._id).length === 0 && (
                  <p className="text-gray-500 text-xs">You're the only one viewing</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
