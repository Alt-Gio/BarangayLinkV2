"use client";

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Plus,
  CheckCircle,
  Circle,
  AlertCircle,
  Trash2,
  Edit,
  Target,
  Calendar,
  Flag,
} from 'lucide-react';
import { Id } from '../../../convex/_generated/dataModel';

interface MilestoneManagerProps {
  projectId: Id<"projects">;
}

export function MilestoneManager({ projectId }: MilestoneManagerProps) {
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [showAddTask, setShowAddTask] = useState<string | null>(null);
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    description: '',
    targetDate: '',
  });
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    storyPoints: 5,
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    dueDate: '',
  });

  const milestones = useQuery(api.milestones.getProjectMilestones, { projectId });
  const createMilestone = useMutation(api.milestones.createMilestone);
  const deleteMilestone = useMutation(api.milestones.deleteMilestone);
  const addTaskToMilestone = useMutation(api.milestones.addTaskToMilestone);
  const updateMilestoneProgress = useMutation(api.milestones.updateMilestoneProgress);

  const handleCreateMilestone = async () => {
    if (!newMilestone.title.trim()) return;

    await createMilestone({
      projectId,
      title: newMilestone.title,
      description: newMilestone.description,
      targetDate: newMilestone.targetDate ? new Date(newMilestone.targetDate).getTime() : undefined,
    });

    setNewMilestone({ title: '', description: '', targetDate: '' });
    setShowAddMilestone(false);
  };

  const handleAddTask = async (milestoneId: Id<"milestones">) => {
    if (!newTask.title.trim()) return;

    await addTaskToMilestone({
      milestoneId,
      title: newTask.title,
      description: newTask.description,
      storyPoints: newTask.storyPoints,
      priority: newTask.priority,
      dueDate: newTask.dueDate ? new Date(newTask.dueDate).getTime() : undefined,
    });

    setNewTask({
      title: '',
      description: '',
      storyPoints: 5,
      priority: 'medium',
      dueDate: '',
    });
    setShowAddTask(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <Circle className="w-5 h-5 text-blue-500" />;
      case 'blocked':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Circle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'blocked':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (!milestones) {
    return <div className="text-center py-8 text-gray-400">Loading milestones...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Target className="w-6 h-6 text-purple-400" />
            Project Milestones
          </h2>
          <p className="text-gray-400 mt-1">
            Define goals and create sprint tasks for each milestone
          </p>
        </div>
        <Button
          onClick={() => setShowAddMilestone(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Milestone
        </Button>
      </div>

      {/* Add Milestone Form */}
      {showAddMilestone && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Create New Milestone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Milestone Title *</label>
              <Input
                value={newMilestone.title}
                onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                placeholder="e.g., Foundation Complete"
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Description</label>
              <Input
                value={newMilestone.description}
                onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                placeholder="What needs to be accomplished?"
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Target Date</label>
              <Input
                type="date"
                value={newMilestone.targetDate}
                onChange={(e) => setNewMilestone({ ...newMilestone, targetDate: e.target.value })}
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateMilestone} className="flex-1 bg-purple-600 hover:bg-purple-700">
                Create Milestone
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddMilestone(false)}
                className="flex-1 border-gray-600"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Milestones List */}
      {milestones.length === 0 ? (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="text-center py-12">
            <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Milestones Yet</h3>
            <p className="text-gray-400 mb-4">
              Create milestones to break down your project into achievable goals
            </p>
            <Button onClick={() => setShowAddMilestone(true)} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Create First Milestone
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {milestones.map((milestone, index) => (
            <Card key={milestone._id} className={`border-l-4 ${getStatusColor(milestone.status)}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(milestone.status)}
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white">
                          {index + 1}. {milestone.title}
                        </h3>
                        {milestone.description && (
                          <p className="text-sm text-gray-400 mt-1">{milestone.description}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <Badge className={getStatusColor(milestone.status)}>
                        {milestone.status.replace('_', ' ')}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        {milestone.completedTasks} / {milestone.totalTasks} tasks
                      </span>
                      <span className="flex items-center gap-1">
                        <Flag className="w-4 h-4" />
                        {milestone.completedPoints} / {milestone.totalPoints} pts
                      </span>
                      {milestone.targetDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(milestone.targetDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMilestone({ milestoneId: milestone._id })}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Progress</span>
                    <span className="text-sm font-bold text-white">{milestone.progress}%</span>
                  </div>
                  <Progress value={milestone.progress} className="h-2" />
                </div>

                {/* Tasks */}
                <div className="space-y-2">
                  {milestone.tasks.map((task) => (
                    <div
                      key={task._id}
                      className="bg-gray-900/50 rounded-lg p-3 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {task.completed ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Circle className="w-4 h-4 text-gray-500" />
                          )}
                          <span className={`text-sm ${task.completed ? 'text-gray-500 line-through' : 'text-white'}`}>
                            {task.title}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-purple-500/20 text-purple-300 text-xs">
                          {task.storyPoints} pts
                        </Badge>
                        <Badge className="bg-yellow-500/20 text-yellow-300 text-xs">
                          {task.experienceReward} XP
                        </Badge>
                      </div>
                    </div>
                  ))}

                  {/* Add Task Form */}
                  {showAddTask === milestone._id ? (
                    <div className="bg-gray-900/70 rounded-lg p-4 space-y-3 border border-purple-500/30">
                      <Input
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        placeholder="Sprint task title..."
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                      <Input
                        value={newTask.description}
                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                        placeholder="Description..."
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Story Points</label>
                          <select
                            value={newTask.storyPoints}
                            onChange={(e) => setNewTask({ ...newTask, storyPoints: Number(e.target.value) })}
                            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                          >
                            <option value={1}>1 (Trivial)</option>
                            <option value={2}>2 (Simple)</option>
                            <option value={3}>3 (Easy)</option>
                            <option value={5}>5 (Medium)</option>
                            <option value={8}>8 (Complex)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Priority</label>
                          <select
                            value={newTask.priority}
                            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleAddTask(milestone._id)}
                          className="flex-1 bg-purple-600 hover:bg-purple-700"
                          size="sm"
                        >
                          Add Sprint Task
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowAddTask(null)}
                          className="flex-1 border-gray-600"
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setShowAddTask(milestone._id)}
                      variant="outline"
                      size="sm"
                      className="w-full border-gray-600 border-dashed"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Sprint Task to this Milestone
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
