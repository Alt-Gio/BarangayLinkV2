import { useState, useRef } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Upload, X, File, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Id } from '../../../convex/_generated/dataModel';

interface DocumentUploadProps {
  projectId?: Id<"projects">;
  taskId?: Id<"tasks">;
  eventId?: Id<"events">;
  onUploadComplete?: (documentId: Id<"documents">) => void;
  onClose?: () => void;
}

export function DocumentUpload({ projectId, taskId, eventId, onUploadComplete, onClose }: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState('General');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [accessLevel, setAccessLevel] = useState<'public' | 'internal' | 'restricted'>('internal');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(api.documents.generateUploadUrl);
  const createDocument = useMutation(api.documents.createDocument);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(10);
      setError(null);

      // Step 1: Get upload URL
      const uploadUrl = await generateUploadUrl();
      setUploadProgress(30);

      // Step 2: Upload file to Convex storage
      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error('Upload failed');
      }

      const { storageId } = await result.json();
      setUploadProgress(70);

      // Step 3: Create document record
      const documentId = await createDocument({
        fileName: file.name,
        originalName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        storageId,
        category,
        tags,
        description: description || undefined,
        isPublic,
        accessLevel,
        projectId,
        taskId,
        eventId,
      });

      setUploadProgress(100);
      setSuccess(true);

      // Reset form
      setTimeout(() => {
        if (onUploadComplete) {
          onUploadComplete(documentId);
        }
        handleReset();
      }, 1500);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setCategory('General');
    setDescription('');
    setTags([]);
    setTagInput('');
    setIsPublic(false);
    setAccessLevel('internal');
    setUploadProgress(0);
    setSuccess(false);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onClose) {
      onClose();
    }
  };

  const categories = [
    'General',
    'Project Documents',
    'Reports',
    'Images',
    'Presentations',
    'Spreadsheets',
    'Contracts',
    'Receipts',
    'Other'
  ];

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <Upload className="w-5 h-5 text-emerald-500" />
          Upload Document
        </h3>
        {onClose && (
          <button
            onClick={handleReset}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        )}
      </div>

      {/* File Selection */}
      <div className="space-y-4">
        {!file ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center cursor-pointer hover:border-emerald-500 hover:bg-white/5 transition-all"
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-white font-medium mb-2">Click to upload or drag and drop</p>
            <p className="text-gray-400 text-sm">PDF, DOC, XLS, PNG, JPG (max 10MB)</p>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.gif"
            />
          </div>
        ) : (
          <div className="bg-white/10 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <File className="w-8 h-8 text-emerald-500" />
              <div>
                <p className="text-white font-medium">{file.name}</p>
                <p className="text-gray-400 text-sm">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
            </div>
            <button
              onClick={handleRemoveFile}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-red-400" />
            </button>
          </div>
        )}

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Description (Optional)</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description..."
            className="bg-white/10 border-white/20 text-white"
            rows={3}
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
          <div className="flex gap-2 mb-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="Add tags..."
              className="flex-1 bg-white/10 border-white/20 text-white"
            />
            <Button onClick={addTag} variant="outline" className="border-white/20">
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <Badge key={tag} className="bg-emerald-600 text-white">
                {tag}
                <button onClick={() => removeTag(tag)} className="ml-2">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        {/* Access Level */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Access Level</label>
          <select
            value={accessLevel}
            onChange={(e) => setAccessLevel(e.target.value as any)}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="public">Public - Anyone can view</option>
            <option value="internal">Internal - Team members only</option>
            <option value="restricted">Restricted - Limited access</option>
          </select>
        </div>

        {/* Public Checkbox */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isPublic"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="w-4 h-4 rounded border-white/20"
          />
          <label htmlFor="isPublic" className="text-sm text-gray-300">
            Make this document publicly accessible
          </label>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">Uploading...</span>
              <span className="text-emerald-400">{uploadProgress}%</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="flex items-center gap-2 p-3 bg-emerald-600/20 border border-emerald-500/30 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span className="text-emerald-400">Document uploaded successfully!</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-600/20 border border-red-500/30 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-400">{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </>
            )}
          </Button>
          {onClose && (
            <Button
              onClick={handleReset}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
