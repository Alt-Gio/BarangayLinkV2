import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  File, FileText, Image, FileSpreadsheet, Presentation,
  Download, Trash2, Edit, Eye, MoreVertical, Calendar, User, X
} from 'lucide-react';
import { Id } from '../../../convex/_generated/dataModel';

interface DocumentListProps {
  projectId?: Id<"projects">;
  taskId?: Id<"tasks">;
  eventId?: Id<"events">;
  category?: string;
  limit?: number;
}

export function DocumentList({ projectId, taskId, eventId, category, limit }: DocumentListProps) {
  const documents = useQuery(api.documents.getAllDocuments, {
    projectId,
    taskId,
    category,
    limit
  });

  const currentUser = useQuery(api.users.getCurrentUser);
  const deleteDocument = useMutation(api.documents.deleteDocument);

  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  
  // Check if user can delete document (admin or uploader)
  const canDeleteDocument = (doc: any) => {
    if (!currentUser) return false;
    const userLevel = typeof currentUser.userLevel === 'object' ? currentUser.userLevel : null;
    const isAdmin = userLevel && 'level' in userLevel && userLevel.level >= 4;
    const isUploader = doc.uploadedBy === currentUser._id;
    return isAdmin || isUploader;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-6 h-6" />;
    if (mimeType.includes('pdf')) return <FileText className="w-6 h-6" />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <FileSpreadsheet className="w-6 h-6" />;
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return <Presentation className="w-6 h-6" />;
    return <File className="w-6 h-6" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleDownload = (doc: any) => {
    // Open the document viewer which will show download button
    setSelectedDoc(doc);
  };

  const handleDelete = async (documentId: Id<"documents">) => {
    if (confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      try {
        await deleteDocument({ documentId });
        alert('Document deleted successfully!');
      } catch (error) {
        console.error('Delete failed:', error);
        alert('Failed to delete document. Please try again.');
      }
    }
  };

  if (!documents) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center p-8">
        <File className="w-16 h-16 text-gray-500 mx-auto mb-4" />
        <p className="text-gray-400">No documents uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {documents.map((doc: any) => (
        <div
          key={doc._id}
          className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl border border-white/10 p-5 hover:border-emerald-500/50 transition-all duration-300 group shadow-xl hover:shadow-emerald-500/10"
        >
          <div className="flex items-start gap-4">
            {/* File Icon */}
            <div className="flex-shrink-0 p-3 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-xl text-emerald-400 group-hover:from-emerald-500/30 group-hover:to-emerald-600/30 transition-all">
              {getFileIcon(doc.mimeType)}
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0 space-y-2">
              <h4 className="text-white font-semibold text-lg line-clamp-2 group-hover:text-emerald-300 transition-colors" title={doc.fileName}>
                {doc.fileName}
              </h4>
                
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1.5 hover:text-gray-300 transition-colors">
                  <User className="w-4 h-4" />
                  <span className="font-medium">{doc.uploaderName}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {new Date(doc._creationTime).toLocaleDateString()}
                </span>
                <span className="px-2 py-1 bg-white/5 rounded-md font-medium">{formatFileSize(doc.fileSize)}</span>
              </div>

              {doc.description && (
                <p className="text-gray-300 text-sm line-clamp-2">{doc.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-2">
                {/* Category Badge */}
                <Badge className="bg-gradient-to-r from-purple-600/30 to-purple-500/30 text-purple-300 border border-purple-500/30 text-xs font-medium">
                  {doc.category}
                </Badge>
                
                {/* Tags */}
                {doc.tags.slice(0, 3).map((tag: string) => (
                  <Badge key={tag} className="bg-gradient-to-r from-blue-600/30 to-blue-500/30 text-blue-300 border border-blue-500/30 text-xs">
                    {tag}
                  </Badge>
                ))}
                {doc.tags.length > 3 && (
                  <Badge className="bg-white/5 text-gray-400 text-xs">+{doc.tags.length - 3}</Badge>
                )}
              </div>
            </div>

            {/* Actions - Always Visible, Better Design */}
            <div className="flex flex-col gap-2 ml-auto">
              <Button
                size="sm"
                className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 hover:border-emerald-500/50 transition-all"
                onClick={() => setSelectedDoc(doc)}
                title="View document"
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                className="bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 hover:border-blue-500/50 transition-all"
                onClick={() => handleDownload(doc)}
                title="Download document"
              >
                <Download className="w-4 h-4" />
              </Button>
              {canDeleteDocument(doc) && (
                <Button
                  size="sm"
                  className="bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 hover:border-red-500/50 transition-all"
                  onClick={() => handleDelete(doc._id)}
                  title="Delete document"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Document Viewer Modal */}
      {selectedDoc && (
        <DocumentViewer
          document={selectedDoc}
          onClose={() => setSelectedDoc(null)}
        />
      )}
    </div>
  );
}

// Enhanced Document Viewer Component
function DocumentViewer({ document, onClose }: { document: any; onClose: () => void }) {
  // For attendance documents, content is in description (no actual file)
  const isAttendanceDoc = document.category === "attendance";
  
  // Use Convex query to get file URL (skip for attendance docs)
  const fileUrl = useQuery(
    api.documents.getFileUrl, 
    isAttendanceDoc ? "skip" : { storageId: document.storageId }
  );
  const loading = !isAttendanceDoc && fileUrl === undefined;

  // Handle ESC key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleDownload = () => {
    if (isAttendanceDoc) {
      // For attendance docs, copy to clipboard or download as text
      const blob = new Blob([document.description], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${document.fileName}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (fileUrl) {
      // Open in new tab (browser will prompt download)
      window.open(fileUrl, '_blank');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
      onClick={onClose}
      data-download-ready
    >
      <div 
        className="bg-gray-900 rounded-xl border border-emerald-500/30 shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-gray-800 to-gray-900">
          <div className="flex-1 mr-4">
            <h3 className="text-white font-semibold text-lg break-words">{document.fileName}</h3>
            <p className="text-gray-400 text-sm mt-1">
              {formatFileSize(document.fileSize)} • {document.mimeType}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleDownload}
              data-download-btn
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={!isAttendanceDoc && (loading || !fileUrl)}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 hover:bg-red-500/20 rounded-lg transition-colors group"
              title="Close"
            >
              <X className="w-5 h-5 text-gray-400 group-hover:text-red-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 bg-gray-950">
          {isAttendanceDoc ? (
            // Show attendance list directly from description
            <div className="bg-gray-900 rounded-lg border border-emerald-500/30 p-6">
              <pre className="text-gray-300 font-mono text-sm whitespace-pre-wrap">
                {document.description}
              </pre>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center p-8">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-400">Loading document...</p>
            </div>
          ) : fileUrl && document.mimeType.startsWith('image/') ? (
            <div className="flex items-center justify-center">
              <img 
                src={fileUrl} 
                alt={document.fileName} 
                className="max-w-full h-auto rounded-lg shadow-2xl border border-white/10" 
              />
            </div>
          ) : fileUrl && document.mimeType.includes('pdf') ? (
            <iframe 
              src={fileUrl} 
              className="w-full h-full min-h-[600px] rounded-lg border border-white/10" 
              title={document.fileName}
            />
          ) : fileUrl && (document.mimeType.includes('text') || document.mimeType.includes('json')) ? (
            <div className="bg-gray-900 rounded-lg border border-white/10 p-4">
              <p className="text-gray-400 text-sm mb-2">Text file preview:</p>
              <iframe 
                src={fileUrl} 
                className="w-full h-96 bg-gray-950 rounded border border-white/10" 
                title={document.fileName}
              />
            </div>
          ) : (
            <div className="text-center p-8">
              <div className="bg-gray-800 rounded-lg p-8 inline-block">
                <File className="w-20 h-20 text-emerald-500 mx-auto mb-4" />
                <h4 className="text-white text-lg font-semibold mb-2">{document.fileName}</h4>
                <p className="text-gray-400 mb-4">
                  Preview not available for {document.mimeType.split('/')[1]?.toUpperCase() || 'this'} files
                </p>
                <Button
                  onClick={handleDownload}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download to View
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
