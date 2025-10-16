"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { X, Plus, Target, Calendar, Repeat, TrendingUp, Gift, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProjectId?: Id<"projects">;
}

export function CreateTaskModal({ isOpen, onClose, defaultProjectId }: CreateTaskModalProps) {
  const createTask = useMutation(api.gamifiedTasks.createTask);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "todo" as "todo" | "daily" | "habit" | "reward",
    difficulty: "medium" as "trivial" | "easy" | "medium" | "hard",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    dueDate: "",
    estimatedHours: 1,
    tags: [] as string[],
    habitFrequency: "daily" as "daily" | "weekly" | "monthly",
    positiveHabit: true,
    isBlocking: false,
    projectId: defaultProjectId || undefined,
    assignedTo: [] as Id<"users">[],
  });

  const [newTag, setNewTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Get current user and team members if project is selected
  const currentUser = useQuery(api.users.getCurrentUser);
  const teamMembers = useQuery(
    api.users.getProjectTeamMembers,
    formData.projectId ? { projectId: formData.projectId } : "skip"
  );

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (!formData.title.trim()) {
        throw new Error("Please enter a task title");
      }

      if (!currentUser) throw new Error("Not authenticated");

      // Use selected team members or default to current user
      const assignedUsers = formData.assignedTo.length > 0
        ? formData.assignedTo
        : [currentUser._id];

      await createTask({
        title: formData.title,
        description: formData.description,
        type: formData.type,
        difficulty: formData.difficulty,
        priority: formData.priority,
        assignedTo: assignedUsers,
        dueDate: formData.dueDate ? new Date(formData.dueDate).getTime() : undefined,
        estimatedHours: formData.estimatedHours,
        tags: formData.tags,
        isBlocking: formData.isBlocking,
        habitFrequency: formData.type === "habit" ? formData.habitFrequency : undefined,
        positiveHabit: formData.type === "habit" ? formData.positiveHabit : undefined,
        projectId: formData.projectId,
        eventId: undefined,
        projectImpactScore: undefined,
      });

      onClose();
      setFormData({
        title: "",
        description: "",
        type: "todo",
        difficulty: "medium",
        priority: "medium",
        dueDate: "",
        estimatedHours: 1,
        tags: [],
        habitFrequency: "daily",
        positiveHabit: true,
        isBlocking: false,
        projectId: defaultProjectId || undefined,
        assignedTo: [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const taskTypes = [
    { value: "todo", label: "To-Do", icon: Target, desc: "One-time task" },
    { value: "daily", label: "Daily", icon: Calendar, desc: "Repeats daily" },
    { value: "habit", label: "Habit", icon: TrendingUp, desc: "Track behaviors" },
    { value: "reward", label: "Reward", icon: Gift, desc: "Purchase with gold" },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-white/10 p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Plus className="w-6 h-6 text-emerald-500" />
            Create New Task
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Task Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Task Type</label>
            <div className="grid grid-cols-2 gap-3">
              {taskTypes.map(({ value, label, icon: Icon, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: value as any })}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    formData.type === value
                      ? "border-emerald-500 bg-emerald-600/20"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-2 ${formData.type === value ? "text-emerald-400" : "text-gray-400"}`} />
                  <div className="font-medium text-white">{label}</div>
                  <div className="text-xs text-gray-400 mt-1">{desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g., Complete project documentation"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              placeholder="Add details..."
            />
          </div>

          {/* Difficulty & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="trivial" className="bg-gray-900 text-white">Trivial (5 XP, 2 Gold)</option>
                <option value="easy" className="bg-gray-900 text-white">Easy (10 XP, 5 Gold)</option>
                <option value="medium" className="bg-gray-900 text-white">Medium (20 XP, 10 Gold)</option>
                <option value="hard" className="bg-gray-900 text-white">Hard (40 XP, 20 Gold)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="low" className="bg-gray-900 text-white">Low</option>
                <option value="medium" className="bg-gray-900 text-white">Medium</option>
                <option value="high" className="bg-gray-900 text-white">High</option>
                <option value="urgent" className="bg-gray-900 text-white">Urgent</option>
              </select>
            </div>
          </div>

          {/* Due Date (not for habits) */}
          {formData.type !== "habit" && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          {/* Habit-specific options */}
          {formData.type === "habit" && (
            <div className="space-y-4 p-4 bg-purple-600/10 rounded-lg border border-purple-500/20">
              <h3 className="font-medium text-white">Habit Settings</h3>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Frequency</label>
                <select
                  value={formData.habitFrequency}
                  onChange={(e) => setFormData({ ...formData, habitFrequency: e.target.value as any })}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="daily" className="bg-gray-900 text-white">Daily</option>
                  <option value="weekly" className="bg-gray-900 text-white">Weekly</option>
                  <option value="monthly" className="bg-gray-900 text-white">Monthly</option>
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.positiveHabit}
                  onChange={(e) => setFormData({ ...formData, positiveHabit: e.target.checked })}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-emerald-600"
                />
                <span className="text-sm text-gray-300">Positive habit (rewards for doing it)</span>
              </label>
            </div>
          )}

          {/* Team Member Assignment (for project tasks) */}
          {formData.projectId && teamMembers && teamMembers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                <Users className="w-4 h-4 inline mr-2" />
                Assign to Team Members
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                {teamMembers.map((member) => (
                  <label
                    key={member._id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700/50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={formData.assignedTo.includes(member._id)}
                      onChange={(e) => {
                        const newAssigned = e.target.checked
                          ? [...formData.assignedTo, member._id]
                          : formData.assignedTo.filter(id => id !== member._id);
                        setFormData({ ...formData, assignedTo: newAssigned });
                      }}
                      className="w-4 h-4 rounded border-gray-600 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-gray-900"
                    />
                    <img
                      src={member.imageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`}
                      alt={member.name}
                      className="w-8 h-8 rounded-full border-2 border-gray-700"
                    />
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">{member.name}</p>
                      <p className="text-gray-400 text-xs">{member.position || member.department}</p>
                    </div>
                  </label>
                ))}
              </div>
              {formData.assignedTo.length > 0 && (
                <p className="text-sm text-emerald-400 mt-2">
                  ✓ {formData.assignedTo.length} team member(s) selected
                </p>
              )}
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Add a tag..."
              />
              <Button type="button" onClick={addTag} className="bg-emerald-600 hover:bg-emerald-700">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-emerald-600/20 border border-emerald-500/30 rounded-full text-emerald-400 text-sm flex items-center gap-2"
                >
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-emerald-300">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
