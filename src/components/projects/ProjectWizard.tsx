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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  Calendar,
  DollarSign,
  Users,
  Target,
  Flag,
  Sparkles,
  MapPin,
  Tag,
  Eye,
  EyeOff,
  Plus,
  X,
} from "lucide-react";
import { LocationPickerModal } from "@/components/shared/LocationPickerModal";
import { format } from "date-fns";

interface ProjectWizardProps {
  onComplete: (projectId: string) => void;
  onCancel: () => void;
}

export function ProjectWizard({ onComplete, onCancel }: ProjectWizardProps) {
  const [step, setStep] = useState(1);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  
  // Get current user to determine role and department
  const currentUser = useQuery(api.users.getCurrentUser);
  const userRole = currentUser?.userLevel?.name;
  const userDepartment = (currentUser as any)?.department;
  
  // ADMIN/CAPTAIN can choose any department, MANAGER/BUILDER locked to their own
  const canChooseDepartment = userRole === "ADMIN" || userRole === "CAPTAIN";
  
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    title: "",
    description: "",
    department: canChooseDepartment ? "" : (userDepartment || ""),
    
    // Step 2: Timeline & Priority
    startDate: "",
    endDate: "",
    priority: "medium" as "low" | "medium" | "high" | "critical",
    urgency: "normal" as "normal" | "urgent" | "emergency",
    
    // Step 3: Budget & Impact
    budget: 0,
    location: "",
    coordinates: null as { latitude: number; longitude: number } | null,
    estimatedBeneficiaries: 0,
    impactAreas: [] as string[],
    
    // Step 4: Assign Team Members
    assignedTo: [] as string[],
    
    // Step 5: Success Criteria
    successCriteria: [] as Array<{ criterion: string; targetValue: string }>,
    
    // Step 6: Visibility & Settings
    isPublic: true,
    publicVisibility: "internal" as "public" | "internal" | "private",
    projectLevel: 5,
    tags: [] as string[],
  });

  const [currentCriterion, setCurrentCriterion] = useState({ criterion: "", targetValue: "" });
  const [currentTag, setCurrentTag] = useState("");

  const departmentsFromDB = useQuery(api.departments.getAllDepartments);
  const allUsers = useQuery(api.users.getAllUsers); // Get all users for team assignment
  
  // Fallback departments - ALWAYS show these if DB is empty or loading
  const fallbackDepartments = [
    { _id: "health" as any, name: "Health Services", description: "Health and wellness programs" },
    { _id: "infra" as any, name: "Infrastructure", description: "Infrastructure projects" },
    { _id: "edu" as any, name: "Education", description: "Education programs" },
    { _id: "social" as any, name: "Social Welfare", description: "Social welfare services" },
    { _id: "agriculture" as any, name: "Agriculture", description: "Agriculture and farming" },
  ];
  
  // Use DB departments if available, otherwise use fallback
  const departments = (departmentsFromDB?.length ?? 0) > 0 ? departmentsFromDB : fallbackDepartments;
  
  const createProject = useMutation(api.projects.createProject);
  
  // Toggle team member assignment
  const toggleTeamMember = (userId: string) => {
    if (formData.assignedTo.includes(userId)) {
      updateField("assignedTo", formData.assignedTo.filter(id => id !== userId));
    } else {
      updateField("assignedTo", [...formData.assignedTo, userId]);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const addSuccessCriterion = () => {
    if (currentCriterion.criterion.trim()) {
      setFormData({
        ...formData,
        successCriteria: [...formData.successCriteria, currentCriterion],
      });
      setCurrentCriterion({ criterion: "", targetValue: "" });
    }
  };

  const removeCriterion = (index: number) => {
    setFormData({
      ...formData,
      successCriteria: formData.successCriteria.filter((_, i) => i !== index),
    });
  };

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, currentTag.trim()],
      });
      setCurrentTag("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag),
    });
  };

  const addImpactArea = (area: string) => {
    if (!formData.impactAreas.includes(area)) {
      updateField("impactAreas", [...formData.impactAreas, area]);
    } else {
      updateField("impactAreas", formData.impactAreas.filter(a => a !== area));
    }
  };

  const handleSubmit = async () => {
    try {
      const projectId = await createProject({
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        urgency: formData.urgency,
        budget: formData.budget,
        startDate: new Date(formData.startDate).getTime(),
        endDate: new Date(formData.endDate).getTime(),
        location: formData.location,
        coordinates: formData.coordinates || undefined,
        department: formData.department,
        tags: formData.tags,
        isPublic: formData.isPublic,
        publicVisibility: formData.publicVisibility,
        projectLevel: formData.projectLevel,
        impactArea: formData.impactAreas,
        estimatedBeneficiaries: formData.estimatedBeneficiaries,
        successCriteria: formData.successCriteria,
        assignedTo: formData.assignedTo, // Add team members
        milestones: [], // Empty for now
      });
      
      onComplete(String(projectId));
    } catch (error) {
      console.error("Failed to create project:", error);
      alert("Failed to create project. Please try again.");
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.title && formData.description && formData.department;
      case 2:
        // Validate dates: end date must be after start date
        if (!formData.startDate || !formData.endDate) return false;
        return new Date(formData.endDate) > new Date(formData.startDate);
      case 3:
        return formData.budget > 0;
      case 4:
        return formData.assignedTo.length > 0; // At least one team member
      case 5:
        return formData.successCriteria.length > 0;
      case 6:
        return true;
      default:
        return false;
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        {/* Progress Indicator */}
        <div className="flex justify-between mb-4">
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <div
              key={s}
              className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all ${
                s < step
                  ? "bg-emerald-600 text-white"
                  : s === step
                  ? "bg-blue-600 text-white ring-4 ring-blue-200"
                  : "bg-gray-700 text-gray-400"
              }`}
            >
              {s < step ? <Check className="w-5 h-5" /> : s}
            </div>
          ))}
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-emerald-600 transition-all duration-300"
            style={{ width: `${(step / 6) * 100}%` }}
          />
        </div>
      </div>

      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-2xl text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-400" />
            {step === 1 && "Basic Information"}
            {step === 2 && "Timeline & Priority"}
            {step === 3 && "Budget & Impact"}
            {step === 4 && "Assign Team Members"}
            {step === 5 && "Success Criteria"}
            {step === 6 && "Visibility & Settings"}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {step === 1 && "Let's start with the basics"}
            {step === 2 && "When will this project take place?"}
            {step === 3 && "Define the resources and impact"}
            {step === 4 && "Who will work on this project?"}
            {step === 5 && "What defines success?"}
            {step === 6 && "Final touches"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="title" className="text-white">Project Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="e.g., Community Park Renovation"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Describe the project goals, scope, and expected outcomes..."
                  rows={5}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department" className="text-white">
                  Department *
                  {canChooseDepartment ? (
                    <Badge variant="outline" className="ml-2 bg-green-500/10 text-green-400 border-green-500/30">
                      You can select any department
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="ml-2 bg-blue-500/10 text-blue-400 border-blue-500/30">
                      Locked to your department
                    </Badge>
                  )}
                </Label>
                
                {canChooseDepartment ? (
                  // ADMIN/MANAGER: Can choose from all departments - NATIVE SELECT (WORKS RELIABLY)
                  <select
                    value={formData.department}
                    onChange={(e) => updateField("department", e.target.value)}
                    className="flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white ring-offset-background focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="" disabled className="bg-gray-800 text-gray-400">
                      Select department
                    </option>
                    {departments && departments.length > 0 ? (
                      departments.map((dept) => (
                        <option 
                          key={dept._id || dept.name} 
                          value={dept.name}
                          className="bg-gray-800 text-white"
                        >
                          {dept.name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled className="bg-gray-800 text-gray-400">
                        Loading departments...
                      </option>
                    )}
                  </select>
                ) : (
                  // BUILDER: Locked to their department
                  <div className="relative">
                    <Input
                      value={formData.department}
                      readOnly
                      disabled
                      className="bg-gray-800/50 border-gray-700 text-white cursor-not-allowed"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <EyeOff className="w-4 h-4 text-gray-500" />
                    </div>
                  </div>
                )}
                
                {canChooseDepartment ? (
                  <div className="space-y-1">
                    <p className="text-xs text-green-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Your projects are automatically approved. You can select any department.
                    </p>
                    <p className="text-xs text-blue-400">
                      {departments.length} department{departments.length !== 1 ? 's' : ''} available
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 mt-1">
                    As a Builder, you can only create projects in your assigned department
                  </p>
                )}
              </div>
            </>
          )}

          {/* Step 2: Timeline & Priority */}
          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Start Date *
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
                    End Date *
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    min={formData.startDate || undefined}
                    onChange={(e) => updateField("endDate", e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                  {formData.startDate && formData.endDate && new Date(formData.endDate) <= new Date(formData.startDate) && (
                    <p className="text-xs text-red-400">End date must be after start date</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white flex items-center gap-2">
                  <Flag className="w-4 h-4" />
                  Priority Level
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {(["low", "medium", "high", "critical"] as const).map((p) => (
                    <Button
                      key={p}
                      type="button"
                      variant={formData.priority === p ? "default" : "outline"}
                      onClick={() => updateField("priority", p)}
                      className={`${
                        formData.priority === p
                          ? p === "critical"
                            ? "bg-red-600 hover:bg-red-700"
                            : p === "high"
                            ? "bg-orange-600 hover:bg-orange-700"
                            : p === "medium"
                            ? "bg-yellow-600 hover:bg-yellow-700"
                            : "bg-green-600 hover:bg-green-700"
                          : ""
                      }`}
                    >
                      {p}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Urgency</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["normal", "urgent", "emergency"] as const).map((u) => (
                    <Button
                      key={u}
                      type="button"
                      variant={formData.urgency === u ? "default" : "outline"}
                      onClick={() => updateField("urgency", u)}
                      className={formData.urgency === u ? "bg-blue-600 hover:bg-blue-700" : ""}
                    >
                      {u}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Step 3: Budget & Impact */}
          {step === 3 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="budget" className="text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Budget (PHP) *
                </Label>
                <Input
                  id="budget"
                  type="number"
                  value={formData.budget || ""}
                  onChange={(e) => updateField("budget", parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location
                </Label>
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

              <div className="space-y-2">
                <Label htmlFor="beneficiaries" className="text-white flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Estimated Beneficiaries
                </Label>
                <Input
                  id="beneficiaries"
                  type="number"
                  value={formData.estimatedBeneficiaries || ""}
                  onChange={(e) => updateField("estimatedBeneficiaries", parseInt(e.target.value) || 0)}
                  placeholder="Number of people who will benefit"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Impact Areas</Label>
                <div className="grid grid-cols-2 gap-2">
                  {impactAreaOptions.map((area) => (
                    <Button
                      key={area}
                      type="button"
                      variant={formData.impactAreas.includes(area) ? "default" : "outline"}
                      onClick={() => addImpactArea(area)}
                      className={formData.impactAreas.includes(area) ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                    >
                      {area}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Step 4: Assign Team Members */}
          {step === 4 && (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-white flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Select Team Members *
                  </Label>
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                    {formData.assignedTo.length} selected
                  </Badge>
                </div>
                
                <div className="max-h-96 overflow-y-auto space-y-2 bg-gray-800/30 rounded-lg p-4">
                  {allUsers && allUsers.length > 0 ? (
                    allUsers.map((user: any) => {
                      const isSelected = formData.assignedTo.includes(user._id);
                      const isCurrentUser = user._id === currentUser?._id;
                      
                      return (
                        <div
                          key={user._id}
                          onClick={() => toggleTeamMember(user._id)}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            isSelected
                              ? "bg-emerald-600/20 border-emerald-500 ring-2 ring-emerald-500/50"
                              : "bg-gray-800/50 border-gray-700 hover:bg-gray-700/50"
                          }`}
                        >
                          <div className="relative">
                            <img
                              src={user.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                              alt={user.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            {isSelected && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">
                              {user.name} {isCurrentUser && "(You)"}
                            </p>
                            <p className="text-xs text-gray-400">{user.position || "Team Member"}</p>
                            <p className="text-xs text-gray-500">{user.department || "Unassigned"}</p>
                          </div>
                          
                          <div>
                            <Badge variant="outline" className={`text-xs ${
                              user.userLevel?.name === "ADMIN" ? "bg-red-500/10 text-red-400 border-red-500/30" :
                              user.userLevel?.name === "CAPTAIN" ? "bg-orange-500/10 text-orange-400 border-orange-500/30" :
                              user.userLevel?.name === "MANAGER" ? "bg-purple-500/10 text-purple-400 border-purple-500/30" :
                              user.userLevel?.name === "BUILDER" ? "bg-blue-500/10 text-blue-400 border-blue-500/30" :
                              "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            }`}>
                              {user.userLevel?.name || "WORKER"}
                            </Badge>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-center text-gray-400 py-8">Loading users...</p>
                  )}
                </div>
                
                {formData.assignedTo.length === 0 && (
                  <p className="text-xs text-yellow-400">Please select at least one team member</p>
                )}
              </div>
            </>
          )}

          {/* Step 5: Success Criteria */}
          {step === 5 && (
            <>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={currentCriterion.criterion}
                    onChange={(e) => setCurrentCriterion({ ...currentCriterion, criterion: e.target.value })}
                    placeholder="Success criterion (e.g., Reduce pollution)"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                  <div className="flex gap-2">
                    <Input
                      value={currentCriterion.targetValue}
                      onChange={(e) => setCurrentCriterion({ ...currentCriterion, targetValue: e.target.value })}
                      placeholder="Target (e.g., by 30%)"
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                    <Button onClick={addSuccessCriterion} size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {formData.successCriteria.map((sc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{sc.criterion}</p>
                        {sc.targetValue && <p className="text-sm text-gray-400">Target: {sc.targetValue}</p>}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCriterion(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {formData.successCriteria.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    Add at least one success criterion to continue
                  </p>
                )}
              </div>
            </>
          )}

          {/* Step 6: Visibility & Settings */}
          {step === 6 && (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white">Project Difficulty Level (1-10)</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      type="range"
                      min="1"
                      max="10"
                      value={formData.projectLevel}
                      onChange={(e) => updateField("projectLevel", parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <Badge className="bg-blue-600 text-white px-4 py-2 text-lg font-bold">
                      {formData.projectLevel}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400">
                    Higher difficulty = More XP rewards for team members
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Visibility</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["public", "internal", "private"] as const).map((v) => (
                      <Button
                        key={v}
                        type="button"
                        variant={formData.publicVisibility === v ? "default" : "outline"}
                        onClick={() => updateField("publicVisibility", v)}
                        className={formData.publicVisibility === v ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                      >
                        {v === "public" && <Eye className="w-4 h-4 mr-2" />}
                        {v === "private" && <EyeOff className="w-4 h-4 mr-2" />}
                        {v}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags" className="text-white flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Tags
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="tags"
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                      placeholder="Add tags..."
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                    <Button onClick={addTag} size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="bg-gray-700 text-white">
                        {tag}
                        <button onClick={() => removeTag(tag)} className="ml-2">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t border-gray-800">
            <Button
              onClick={step === 1 ? onCancel : () => setStep(step - 1)}
              variant="outline"
              className="border-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {step === 1 ? "Cancel" : "Back"}
            </Button>

            {step < 6 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed()}
                className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
              >
                <Check className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Location Picker Modal */}
      <LocationPickerModal
        isOpen={isLocationPickerOpen}
        onClose={() => setIsLocationPickerOpen(false)}
        onSelectLocation={(location) => {
          updateField("location", location.address);
          updateField("coordinates", { latitude: location.lat, longitude: location.lng });
          setCoordinates({ lat: location.lat, lng: location.lng });
        }}
        initialLocation={coordinates || undefined}
      />
    </div>
  );
}
