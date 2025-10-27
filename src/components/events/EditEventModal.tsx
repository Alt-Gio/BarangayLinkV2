"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { X, Calendar, Clock, MapPin, Users, AlertTriangle, Briefcase, MessageSquare, Globe, Upload, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocationPickerModal } from "@/components/shared/LocationPickerModal";

interface EditEventModalProps {
  event: any;
  isOpen: boolean;
  onClose: () => void;
}

export function EditEventModal({ event, isOpen, onClose }: EditEventModalProps) {
  const updateEvent = useMutation(api.events.updateEvent);
  const generateUploadUrl = useMutation(api.documents.generateUploadUrl);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "community" as "meeting" | "community" | "project" | "emergency" | "milestone",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    location: "",
    coordinates: null as { latitude: number; longitude: number } | null,
    maxAttendees: "",
    isPublic: true,
    requiresApproval: false,
    allowPublicRSVP: false,
    allowDocumentUpload: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  // Pre-fill form with event data
  useEffect(() => {
    if (event) {
      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);
      
      setFormData({
        title: event.title || "",
        description: event.description || "",
        type: event.type || "community",
        startDate: startDate.toISOString().split('T')[0],
        startTime: startDate.toTimeString().slice(0, 5),
        endDate: endDate.toISOString().split('T')[0],
        endTime: endDate.toTimeString().slice(0, 5),
        location: event.location || "",
        coordinates: event.coordinates || null,
        maxAttendees: event.maxAttendees?.toString() || "",
        isPublic: event.isPublic ?? true,
        requiresApproval: event.requiresApproval ?? false,
        allowPublicRSVP: event.allowPublicRSVP ?? false,
        allowDocumentUpload: event.allowDocumentUpload ?? false,
      });
      
      // Set coordinates for location picker
      if (event.coordinates) {
        setCoordinates({ lat: event.coordinates.latitude, lng: event.coordinates.longitude });
      }
      
      // Set existing image preview
      if (event.imageUrl) {
        setImagePreview(event.imageUrl);
      }
    }
  }, [event]);

  if (!isOpen || !event) return null;

  const eventTypes = [
    { value: "meeting" as const, label: "Meeting", icon: MessageSquare, color: "bg-blue-600" },
    { value: "community" as const, label: "Community", icon: Users, color: "bg-emerald-600" },
    { value: "project" as const, label: "Project", icon: Briefcase, color: "bg-purple-600" },
    { value: "milestone" as const, label: "🎯 Milestone", icon: Briefcase, color: "bg-purple-600" },
    { value: "emergency" as const, label: "⚠️ Emergency", icon: AlertTriangle, color: "bg-red-600" },
  ];

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (!formData.title || !formData.description || !formData.startDate || !formData.startTime || !formData.location) {
        throw new Error("Please fill in all required fields");
      }

      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`).getTime();
      const endDateTime = formData.endDate && formData.endTime
        ? new Date(`${formData.endDate}T${formData.endTime}`).getTime()
        : startDateTime + (2 * 60 * 60 * 1000);

      if (endDateTime <= startDateTime) {
        throw new Error("End time must be after start time");
      }

      // Upload new image if provided
      let imageUrl = event.imageUrl; // Keep existing image by default
      
      if (imageFile) {
        // Step 1: Get upload URL
        const uploadUrl = await generateUploadUrl();
        
        // Step 2: Upload file to Convex storage
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": imageFile.type },
          body: imageFile,
        });
        
        const { storageId } = await result.json();
        
        // Step 3: Use storageId as imageUrl
        imageUrl = storageId;
      }

      await updateEvent({
        eventId: event._id,
        title: formData.title,
        description: formData.description,
        type: formData.type,
        startDate: startDateTime,
        endDate: endDateTime,
        location: formData.location,
        coordinates: formData.coordinates || undefined,
        maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : undefined,
        imageUrl: imageUrl,
        isPublic: formData.isPublic,
        requiresApproval: formData.requiresApproval,
        allowPublicRSVP: formData.allowPublicRSVP,
        allowDocumentUpload: formData.allowDocumentUpload,
      });

      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update event";
      setError(errorMessage);
      
      // Show alert for permission errors
      if (errorMessage.includes("not the organizer")) {
        alert("❌ Access Denied\n\nYou cannot edit this event because you are not the organizer.\n\nOnly the event creator or administrators can edit events.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 p-6 flex items-center justify-between border-b border-white/10 z-10">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Calendar className="w-7 h-7" />
            Edit Event
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-600/20 border border-red-500/30 rounded-lg p-4 text-red-400">
              {error}
            </div>
          )}

          {/* Event Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3">Event Type</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {eventTypes.map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: value })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.type === value
                      ? `${color} border-white/30 shadow-lg`
                      : "bg-gray-700/30 border-gray-600 hover:border-gray-500"
                  }`}
                >
                  <Icon className="w-5 h-5 mx-auto mb-2 text-white" />
                  <span className="text-sm font-medium text-white">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Event Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter event title"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe your event"
              required
            />
          </div>

          {/* Event Image */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Event Image (Optional)
            </label>
            <div className="space-y-3">
              {imagePreview && (
                <div className="relative aspect-video w-full max-w-md mx-auto rounded-lg overflow-hidden border border-gray-600">
                  <img
                    src={imagePreview}
                    alt="Event preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview("");
                      setImageFile(null);
                    }}
                    className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700/30 hover:bg-gray-700/50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-400">
                      <span className="font-semibold">{imagePreview ? 'Change image' : 'Click to upload'}</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Start Time *
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                End Time
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Location *</label>
            {formData.location ? (
              <div className="bg-emerald-600/20 border border-emerald-600/30 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <MapPin className="w-5 h-5 text-emerald-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-white font-medium mb-1">{formData.location}</p>
                      {formData.coordinates && (
                        <p className="text-gray-400 text-xs">
                          {formData.coordinates.latitude.toFixed(6)}, {formData.coordinates.longitude.toFixed(6)}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={() => setIsLocationPickerOpen(true)}
                    variant="ghost"
                    className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-600/20"
                  >
                    Change
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                onClick={() => setIsLocationPickerOpen(true)}
                className="w-full bg-gray-700/50 border border-gray-600 hover:bg-gray-700 text-white py-6 flex items-center justify-center gap-2"
              >
                <MapPin className="w-5 h-5" />
                <span>Pick Location on Map</span>
              </Button>
            )}
          </div>

          {/* Max Attendees */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Max Attendees (Optional)
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                value={formData.maxAttendees}
                onChange={(e) => setFormData({ ...formData, maxAttendees: e.target.value })}
                className="w-full pl-11 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Unlimited"
                min="1"
              />
            </div>
          </div>

          {/* Event Settings */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Event Settings</h3>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                className="w-5 h-5 rounded border-white/20 bg-white/5 text-emerald-600 focus:ring-2 focus:ring-emerald-500"
              />
              <div className="flex-1">
                <span className="text-white font-medium flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Public Event
                </span>
                <p className="text-gray-400 text-xs mt-1">Anyone in the community can see this event</p>
              </div>
            </label>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.requiresApproval}
                onChange={(e) => setFormData({ ...formData, requiresApproval: e.target.checked })}
                className="w-5 h-5 rounded border-white/20 bg-white/5 text-emerald-600 focus:ring-2 focus:ring-emerald-500"
              />
              <div className="flex-1">
                <span className="text-white font-medium">Require Approval</span>
                <p className="text-gray-400 text-xs mt-1">Users need approval to join this event</p>
              </div>
            </label>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allowPublicRSVP}
                onChange={(e) => setFormData({ ...formData, allowPublicRSVP: e.target.checked })}
                className="w-5 h-5 rounded border-white/20 bg-white/5 text-emerald-600 focus:ring-2 focus:ring-emerald-500"
              />
              <div className="flex-1">
                <span className="text-white font-medium">Allow Public RSVP</span>
                <p className="text-gray-400 text-xs mt-1">Non-logged-in users can join with email verification</p>
              </div>
            </label>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allowDocumentUpload}
                onChange={(e) => setFormData({ ...formData, allowDocumentUpload: e.target.checked })}
                className="w-5 h-5 rounded border-white/20 bg-white/5 text-purple-600 focus:ring-2 focus:ring-purple-500"
              />
              <div className="flex-1">
                <span className="text-white font-medium flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Require Document Upload
                </span>
                <p className="text-gray-400 text-xs mt-1">Attendees must upload proof of citizenship/residency (max 5MB)</p>
              </div>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Updating..." : "Update Event"}
            </Button>
          </div>
        </form>
      </div>
      
      {/* Location Picker Modal */}
      <LocationPickerModal
        isOpen={isLocationPickerOpen}
        onClose={() => setIsLocationPickerOpen(false)}
        onSelectLocation={(location) => {
          setFormData({
            ...formData,
            location: location.address,
            coordinates: { latitude: location.lat, longitude: location.lng }
          });
          setCoordinates({ lat: location.lat, lng: location.lng });
        }}
        initialLocation={coordinates || undefined}
      />
    </div>
  );
}
