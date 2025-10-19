"use client";

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Rocket,
  Calendar,
  Target,
  Zap,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
} from 'lucide-react';

interface SprintPlanningWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projects?: any[];
}

export function SprintPlanningWizard({ isOpen, onClose, onSuccess, projects }: SprintPlanningWizardProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    goal: '',
    startDate: '',
    endDate: '',
    capacity: 40,
    projectId: '',
  });

  const createSprint = useMutation(api.sprintsEnhanced.createSprint);

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.startDate || !formData.endDate) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const sprintId = await createSprint({
        name: formData.name,
        goal: formData.goal,
        startDate: new Date(formData.startDate).getTime(),
        endDate: new Date(formData.endDate).getTime(),
        capacity: formData.capacity,
        projectId: formData.projectId ? (formData.projectId as any) : undefined,
      });
      
      setStep(1);
      setFormData({
        name: '',
        goal: '',
        startDate: '',
        endDate: '',
        capacity: 40,
        projectId: '',
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.message || 'Failed to create sprint');
    }
  };

  const getDuration = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const isStepValid = () => {
    switch (step) {
      case 1: return formData.name.length > 0;
      case 2: return formData.startDate && formData.endDate;
      case 3: return formData.capacity > 0;
      case 4: return true;
      default: return false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl flex items-center gap-2">
            <Rocket className="w-6 h-6 text-blue-400" />
            Create New Sprint
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {[
            { num: 1, label: 'Details', icon: Target },
            { num: 2, label: 'Dates', icon: Calendar },
            { num: 3, label: 'Capacity', icon: Zap },
            { num: 4, label: 'Review', icon: CheckCircle },
          ].map((s, index) => (
            <div key={s.num} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  step >= s.num
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-gray-700 border-gray-600 text-gray-400'
                }`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <span className="text-xs text-gray-400 mt-1">{s.label}</span>
              </div>
              {index < 3 && (
                <div className={`flex-1 h-0.5 ${
                  step > s.num ? 'bg-blue-500' : 'bg-gray-600'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[300px]">
          {/* Step 1: Sprint Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Sprint Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Sprint 1, Q1 Planning Sprint"
                  className="bg-gray-900 border-gray-700 text-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Give your sprint a memorable name
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Sprint Goal
                </label>
                <Textarea
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                  placeholder="What does this sprint aim to achieve?"
                  rows={4}
                  className="bg-gray-900 border-gray-700 text-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Define the main objective for this sprint
                </p>
              </div>

              {projects && projects.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    Link to Project (Optional)
                  </label>
                  <Select
                    value={formData.projectId}
                    onValueChange={(v) => setFormData({ ...formData, projectId: v })}
                  >
                    <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      <SelectItem value="">No project</SelectItem>
                      {projects.map((project: any) => (
                        <SelectItem key={project._id} value={project._id}>
                          {project.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Sprint Dates */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    Start Date *
                  </label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    End Date *
                  </label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>
              </div>

              {formData.startDate && formData.endDate && (
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                  <h4 className="text-blue-300 font-semibold mb-2">Sprint Duration</h4>
                  <div className="text-3xl font-bold text-white mb-1">
                    {getDuration()} days
                  </div>
                  <p className="text-sm text-gray-400">
                    {getDuration() === 7 && '1 week sprint (fast iteration)'}
                    {getDuration() === 14 && '2 weeks sprint (industry standard)'}
                    {getDuration() === 21 && '3 weeks sprint (larger projects)'}
                    {getDuration() > 0 && getDuration() !== 7 && getDuration() !== 14 && getDuration() !== 21 && 
                      'Custom duration sprint'}
                  </p>
                </div>
              )}

              <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                <h4 className="text-gray-300 font-medium mb-2">Recommended Sprint Length:</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• 1 week: Quick iterations, small teams</li>
                  <li>• 2 weeks: Standard, most teams</li>
                  <li>• 3 weeks: Complex projects, large scope</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 3: Capacity */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Sprint Capacity (Story Points)
                </label>
                <Input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                  min="1"
                  className="bg-gray-900 border-gray-700 text-white text-2xl font-bold"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Total story points the team can complete in this sprint
                </p>
              </div>

              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                <h4 className="text-purple-300 font-semibold mb-3">Capacity Guidelines:</h4>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setFormData({ ...formData, capacity: 25 })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.capacity === 25
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-gray-700 bg-gray-900 hover:border-gray-600'
                    }`}
                  >
                    <div className="text-lg font-bold text-white">25</div>
                    <div className="text-xs text-gray-400">Small Team</div>
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, capacity: 40 })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.capacity === 40
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-gray-700 bg-gray-900 hover:border-gray-600'
                    }`}
                  >
                    <div className="text-lg font-bold text-white">40</div>
                    <div className="text-xs text-gray-400">Medium Team</div>
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, capacity: 60 })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.capacity === 60
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-gray-700 bg-gray-900 hover:border-gray-600'
                    }`}
                  >
                    <div className="text-lg font-bold text-white">60</div>
                    <div className="text-xs text-gray-400">Large Team</div>
                  </button>
                </div>
              </div>

              <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                <h4 className="text-gray-300 font-medium mb-2">💡 Pro Tips:</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Base capacity on past sprint velocity</li>
                  <li>• Account for holidays and time off</li>
                  <li>• Leave buffer for unexpected work</li>
                  <li>• Start conservative, increase over time</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-400" />
                  Sprint Summary
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-gray-400">Sprint Name</div>
                    <div className="text-lg font-semibold text-white">{formData.name}</div>
                  </div>
                  
                  {formData.goal && (
                    <div>
                      <div className="text-xs text-gray-400">Sprint Goal</div>
                      <div className="text-sm text-gray-300">{formData.goal}</div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-gray-400">Duration</div>
                      <div className="text-sm font-medium text-white">
                        {getDuration()} days
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(formData.startDate).toLocaleDateString()} - {new Date(formData.endDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Capacity</div>
                      <div className="text-sm font-medium text-white">
                        {formData.capacity} story points
                      </div>
                    </div>
                  </div>

                  {formData.projectId && projects && (
                    <div>
                      <div className="text-xs text-gray-400">Linked Project</div>
                      <Badge className="bg-purple-500/20 text-purple-300">
                        📁 {projects.find(p => p._id === formData.projectId)?.title}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                <h4 className="text-green-300 font-semibold mb-2">✅ Ready to Launch!</h4>
                <p className="text-sm text-gray-300">
                  Your sprint is configured and ready to start. After creation, you can add tasks from the backlog and begin tracking progress.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-700">
          <Button
            onClick={handleBack}
            disabled={step === 1}
            variant="outline"
            className="border-gray-600"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="flex gap-2">
            <Button
              onClick={onClose}
              variant="outline"
              className="border-gray-600"
            >
              Cancel
            </Button>
            
            {step < 4 ? (
              <Button
                onClick={handleNext}
                disabled={!isStepValid()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleCreate}
                className="bg-green-600 hover:bg-green-700"
              >
                <Rocket className="w-4 h-4 mr-2" />
                Create Sprint
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
