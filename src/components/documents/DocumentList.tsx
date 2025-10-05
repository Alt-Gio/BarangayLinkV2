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
    eventId,
    category,
    limit
  });

  const deleteDocument = useMutation(api.documents.deleteDocument);

  const [selectedDoc, setSelectedDoc] = useState<any>(null);

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

  const handleDownload = async (doc: any) => {
    try {
      // Fetch the download URL from Convex storage
      const response = await fetch(`${process.env.NEXT_PUBLIC_CONVEX_URL}/api/storage/${doc.storageId}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download file');
    }
  };

  const handleDelete = async (documentId: Id<"documents">) => {
    if (confirm('Are you sure you want to delete this document?')) {
      try {
        await deleteDocument({ documentId });
      } catch (error) {
        alert('Failed to delete document');
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
    <div className="space-y-3">
      {documents.map((doc: any) => (
        <div
          key={doc._id}
          className="bg-white/5 backdrop-blur-md rounded-lg border border-white/10 p-4 hover:bg-white/10 transition-all group"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              {/* File Icon */}
              <div className="p-2 bg-emerald-600/20 rounded-lg text-emerald-500">
                {getFileIcon(doc.mimeType)}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-medium truncate">{doc.fileName}</h4>
                
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {doc.uploaderName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(doc._creationTime).toLocaleDateString()}
                  </span>
                  <span>{formatFileSize(doc.fileSize)}</span>
                </div>

                {doc.description && (
                  <p className="text-gray-400 text-sm mt-2">{doc.description}</p>
                )}

                {/* Tags */}
                {doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {doc.tags.map((tag: string) => (
                      <Badge key={tag} className="bg-blue-600/20 text-blue-400 text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Category */}
                <Badge className="bg-purple-600/20 text-purple-400 text-xs mt-2">
                  {doc.category}
                </Badge>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
                onClick={() => handleDownload(doc)}
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
                onClick={() => setSelectedDoc(doc)}
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                onClick={() => handleDelete(doc._id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
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

// Simple Document Viewer Component
function DocumentViewer({ document, onClose }: { document: any; onClose: () => void }) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Get file URL on mount
  useEffect(() => {
    const getUrl = async () => {
      try {
        const url = `${process.env.NEXT_PUBLIC_CONVEX_URL}/api/storage/${document.storageId}`;
        setFileUrl(url);
      } catch (error) {
        console.error('Failed to get file URL:', error);
      } finally {
        setLoading(false);
      }
    };
    getUrl();
  }, [document.storageId]);

  const handleDownload = () => {
    if (fileUrl) {
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = document.fileName;
      a.click();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-gray-900 rounded-xl border border-white/10 max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-white font-semibold">{document.fileName}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : fileUrl && document.mimeType.startsWith('image/') ? (
            <img src={fileUrl} alt={document.fileName} className="max-w-full h-auto mx-auto" />
          ) : fileUrl && document.mimeType.includes('pdf') ? (
            <iframe src={fileUrl} className="w-full h-full min-h-[600px]" title={document.fileName} />
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}
