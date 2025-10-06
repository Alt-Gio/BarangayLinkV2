"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Save,
  X,
  Calendar,
  DollarSign,
  Users,
  Target,
  Flag,
  MapPin,
  Tag,
  Plus,
  Trash2,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Edit,
} from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";

interface EnhancedProjectEditorProps {
  project: any;
  currentUser: any;
  onClose: () => void;
  onSave: () => void;
}

export function EnhancedProjectEditor({ project, currentUser, onClose, onSave }: EnhancedProjectEditorProps) {
  const [activeTab, setActiveTab] = useState("basic");
  
  const [formData, setFormData] = useState({
    title: project.title || "",
    description: project.description || "",
    status: project.status || "active",
    priority: project.priority || "medium",
    urgency: project.urgency || "normal",
    startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : "",
    endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : "",
    budget: project.budget || 0,
    location: project.location || "",
    estimatedBeneficiaries: project.estimatedBeneficiaries || 0,
    impactArea: project.impactArea || [],
    successCriteria: project.successCriteria || [],
    milestones: project.milestones || [],
    tags: project.tags || [],
    publicVisibility: project.publicVisibility || "internal",
  });

  const [newTag, setNewTag] = useState("");
  const [newCriterion, setNewCriterion] = useState({ criterion: "", targetValue: "" });
  const [newMilestone, setNewMilestone] = useState({ title: "", description: "", dueDate: "" });

  const updateProject = useMutation(api.projects.updateProject);
  const departments = useQuery(api.departments.getAllDepartments);

  const handleSave = async () => {
    try {
      await updateProject({
        projectId: project._id as Id<"projects">,
        updates: {
          title: formData.title,
          description: formData.description,
          status: formData.status as any,
          priority: formData.priority as any,
          urgency: formData.urgency as any,
          startDate: new Date(formData.startDate).getTime(),
          endDate: new Date(formData.endDate).getTime(),
          budget: formData.budget,
          location: formData.location,
          estimatedBeneficiaries: formData.estimatedBeneficiaries,
          impactArea: formData.impactArea,
          successCriteria: formData.successCriteria,
          milestones: formData.milestones,
          tags: formData.tags,
          publicVisibility: formData.publicVisibility as any,
        },
      });
      onSave();
    } catch (error) {
      console.error("Failed to update project:", error);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter((t: string) => t !== tag) });
  };

  const addCriterion = () => {
    if (newCriterion.criterion.trim()) {
      setFormData({
        ...formData,
        successCriteria: [...formData.successCriteria, { ...newCriterion, achieved: false }],
      });
      setNewCriterion({ criterion: "", targetValue: "" });
    }
  };

  const removeCriterion = (index: number) => {
    setFormData({
      ...formData,
      successCriteria: formData.successCriteria.filter((_: any, i: number) => i !== index),
    });
  };

  const addMilestone = () => {
    if (newMilestone.title.trim()) {
      setFormData({
        ...formData,
        milestones: [
          ...formData.milestones,
          {
            id: `milestone_${Date.now()}`,
            ...newMilestone,
            dueDate: new Date(newMilestone.dueDate).getTime(),
            completed: false,
            order: formData.milestones.length + 1,
          },
        ],
      });
      setNewMilestone({ title: "", description: "", dueDate: "" });
    }
  };

  const removeMilestone = (id: string) => {
    setFormData({
      ...formData,
      milestones: formData.milestones.filter((m: any) => m.id !== id),
    });
  };

  const toggleImpactArea = (area: string) => {
    if (formData.impactArea.includes(area)) {
      setFormData({ ...formData, impactArea: formData.impactArea.filter((a: string) => a !== area) });
    } else {
      setFormData({ ...formData, impactArea: [...formData.impactArea, area] });
    }
  };

  const impactAreaOptions = [
    "Infrastructure",
    "Community",
    "Environment",
    "Education",
    "Health",
    "Safety",
    "Economic",
    "Cultural",
  ];

  const statusOptions = [
    { value: "draft", label: "Draft", color: "gray" },
    { value: "pending_approval", label: "Pending Approval", color: "yellow" },
    { value: "approved", label: "Approved", color: "green" },
    { value: "active", label: "Active", color: "blue" },
    { value: "on_hold", label: "On Hold", color: "orange" },
    { value: "completed", label: "Completed", color: "emerald" },
    { value: "cancelled", label: "Cancelled", color: "red" },
    { value: "archived", label: "Archived", color: "gray" },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 overflow-y-auto">
      <Card className="w-full max-w-5xl bg-gray-900 border-gray-800 my-6">
        <CardHeader className="border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-white flex items-center gap-2">
                <Edit className="w-6 h-6 text-blue-400" />
                Edit Project
              </CardTitle>
              <CardDescription className="text-gray-400 mt-1">
                Update project details, milestones, and settings
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 bg-gray-800">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="timeline">Timeline & Budget</TabsTrigger>
              <TabsTrigger value="impact">Impact & Goals</TabsTrigger>
              <TabsTrigger value="milestones">Milestones</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-white">Project Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    rows={5}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-white flex items-center gap-2">
                      <Flag className="w-4 h-4" />
                      Status
                    </Label>
                    <Select value={formData.status} onValueChange={(v) => updateField("status", v)}>
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full bg-${status.color}-500`} />
                              {status.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority" className="text-white flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Priority
                    </Label>
                    <Select value={formData.priority} onValueChange={(v) => updateField("priority", v)}>
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Timeline & Budget Tab */}
            <TabsContent value="timeline" className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Start Date
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => updateField("startDate", e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    End Date
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => updateField("endDate", e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget" className="text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Budget
                </Label>
                <Input
                  id="budget"
                  type="number"
                  value={formData.budget}
                  onChange={(e) => updateField("budget", parseFloat(e.target.value))}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => updateField("location", e.target.value)}
                  placeholder="e.g., Barangay Hall, Zone 1"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </TabsContent>

            {/* Impact & Goals Tab */}
            <TabsContent value="impact" className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white">Impact Areas</Label>
                  <div className="flex flex-wrap gap-2">
                    {impactAreaOptions.map((area) => (
                      <Badge
                        key={area}
                        variant={formData.impactArea.includes(area) ? "default" : "outline"}
                        className={`cursor-pointer ${
                          formData.impactArea.includes(area)
                            ? "bg-purple-600 hover:bg-purple-700"
                            : "hover:bg-gray-800"
                        }`}
                        onClick={() => toggleImpactArea(area)}
                      >
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="beneficiaries" className="text-white flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Estimated Beneficiaries
                  </Label>
                  <Input
                    id="beneficiaries"
                    type="number"
                    value={formData.estimatedBeneficiaries}
                    onChange={(e) => updateField("estimatedBeneficiaries", parseInt(e.target.value))}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-white flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Success Criteria
                  </Label>
                  
                  <div className="flex gap-2">
                    <Input
                      placeholder="Success criterion"
                      value={newCriterion.criterion}
                      onChange={(e) => setNewCriterion({ ...newCriterion, criterion: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-white flex-1"
                    />
                    <Input
                      placeholder="Target (optional)"
                      value={newCriterion.targetValue}
                      onChange={(e) => setNewCriterion({ ...newCriterion, targetValue: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-white w-40"
                    />
                    <Button onClick={addCriterion} size="icon" className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {formData.successCriteria.map((criterion: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="text-white">{criterion.criterion}</p>
                          {criterion.targetValue && (
                            <p className="text-sm text-gray-400">Target: {criterion.targetValue}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeCriterion(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Milestones Tab */}
            <TabsContent value="milestones" className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-white">Add Milestone</Label>
                  <Input
                    placeholder="Milestone title"
                    value={newMilestone.title}
                    onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                  <Textarea
                    placeholder="Description"
                    value={newMilestone.description}
                    onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                    rows={2}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={newMilestone.dueDate}
                      onChange={(e) => setNewMilestone({ ...newMilestone, dueDate: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-white flex-1"
                    />
                    <Button onClick={addMilestone} className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Milestone
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {formData.milestones.map((milestone: any) => (
                    <Card key={milestone.id} className="bg-gray-800 border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-white font-semibold">{milestone.title}</h4>
                            <p className="text-sm text-gray-400 mt-1">{milestone.description}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <Badge variant="outline" className="text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                {new Date(milestone.dueDate).toLocaleDateString()}
                              </Badge>
                              {milestone.completed && (
                                <Badge className="bg-green-600 text-xs">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Completed
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeMilestone(milestone.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white">Visibility</Label>
                  <Select value={formData.publicVisibility} onValueChange={(v) => updateField("publicVisibility", v)}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public - Visible to everyone</SelectItem>
                      <SelectItem value="internal">Internal - Barangay staff only</SelectItem>
                      <SelectItem value="private">Private - Team members only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-white flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Tags
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add tag"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addTag()}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                    <Button onClick={addTag} size="icon" className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="bg-gray-800">
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-2 hover:text-red-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-800">
            <Button variant="outline" onClick={onClose} className="border-gray-700 text-gray-300">
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
