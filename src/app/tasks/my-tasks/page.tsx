"use client";

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sidebar } from '@/components/layout/Sidebar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Check,
  X,
  Flame,
  Trophy,
  Star,
  Zap,
  Calendar,
  Repeat,
  CheckCircle2,
  Circle,
  Target,
  TrendingUp,
  Award,
  Sparkles,
  CheckSquare,
  Menu
} from 'lucide-react';
import { Id } from '../../../../convex/_generated/dataModel';

export default function MyTasksPage() {
  const [activeTab, setActiveTab] = useState('todos');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    type: 'todo' as 'todo' | 'daily' | 'milestone',
    difficulty: 'medium' as 'trivial' | 'easy' | 'medium' | 'hard',
    projectId: '', // Required
    dueDate: '',
  });

  // Get current user
  const currentUser = useQuery(api.users.getCurrentUser);
  
  // Get user's tasks
  const myTasks = useQuery(api.tasks.getMyTasks);
  
  // Get user's projects for linking
  const myProjects = useQuery(api.productivity.getProjects, { limit: 100 });
  
  // Get user stats (streak, level, XP)
  const userStats = useQuery(api.tasks.getUserStats);

  // Mutations
  const createTask = useMutation(api.tasks.createTask);
  const completeTask = useMutation(api.tasks.completeTask);
  const uncompleteTask = useMutation(api.tasks.uncompleteTask);
  const deleteTask = useMutation(api.tasks.deleteTask);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading tasks...</p>
        </div>
      </div>
    );
  }

  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.projectId) {
      alert('Please fill in task title and select a project');
      return;
    }
    
    try {
      await createTask({
        title: newTask.title,
        description: newTask.description,
        type: newTask.type,
        difficulty: newTask.difficulty,
        projectId: newTask.projectId as Id<"projects">,
        dueDate: newTask.dueDate ? new Date(newTask.dueDate).getTime() : undefined,
      });
      
      setNewTask({
        title: '',
        description: '',
        type: 'todo',
        difficulty: 'medium',
        projectId: '',
        dueDate: '',
      });
      setShowCreateTask(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleCompleteTask = async (taskId: Id<"tasks">) => {
    try {
      await completeTask({ taskId });
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  const handleUncompleteTask = async (taskId: Id<"tasks">) => {
    try {
      await uncompleteTask({ taskId });
    } catch (error) {
      console.error('Failed to uncomplete task:', error);
    }
  };

  // Filter tasks by type
  const todos = myTasks?.filter(t => t.type === 'todo') || [];
  const dailies = myTasks?.filter(t => t.type === 'daily') || [];
  const milestones = myTasks?.filter(t => t.type === 'milestone') || [];

  // Calculate stats
  const level = userStats?.level || 1;
  const xp = userStats?.xp || 0;
  const xpToNextLevel = level * 100;
  const xpProgress = (xp / xpToNextLevel) * 100;
  const streak = userStats?.streak || 0;
  const gold = userStats?.gold || 0;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'trivial': return 'bg-gray-500';
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getDifficultyReward = (difficulty: string) => {
    switch (difficulty) {
      case 'trivial': return { xp: 5, gold: 1 };
      case 'easy': return { xp: 10, gold: 2 };
      case 'medium': return { xp: 20, gold: 5 };
      case 'hard': return { xp: 50, gold: 10 };
      default: return { xp: 10, gold: 2 };
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
      <Sidebar 
        userRole={currentUser?.userLevel?.name || "WORKER"}
        dashboardTitle="Tasks"
        dashboardSubtitle="Manage your gamified tasks"
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="flex-1 overflow-y-auto">
        {/* Mobile Header */}
        <div className="md:hidden bg-gray-800 p-4 flex items-center justify-between sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-white">My Tasks</h1>
          <div className="w-9" />
        </div>

        <div className="p-6">
          <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header with Stats */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <CheckSquare className="w-8 h-8 text-emerald-400" />
              My Tasks
            </h1>
            <p className="text-gray-400 mt-1">Track and manage your project tasks</p>
          </div>
          
          <Button
            onClick={() => setShowCreateTask(!showCreateTask)}
            className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>

        {/* Player Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-gray-800/50 border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <Star className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-400">Level</div>
                  <div className="text-2xl font-bold text-white">{level}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Zap className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-400">Experience</div>
                  <div className="text-lg font-bold text-white">{xp} / {xpToNextLevel} XP</div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${xpProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-500/20 rounded-lg">
                  <Flame className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-400">Streak</div>
                  <div className="text-2xl font-bold text-white">{streak} days</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-500/20 rounded-lg">
                  <Sparkles className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-400">Gold</div>
                  <div className="text-2xl font-bold text-white">{gold}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create Task Form */}
        {showCreateTask && (
          <Card className="bg-gray-800/50 border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5" />
                Create New Task
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Task Title *</label>
                  <Input
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="Enter task title"
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Project *</label>
                  <Select value={newTask.projectId} onValueChange={(v) => setNewTask({ ...newTask, projectId: v })} required>
                    <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {myProjects?.map((project) => (
                        <SelectItem key={project._id} value={project._id}>
                          {project.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-400">Description</label>
                <Textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Add more details..."
                  rows={3}
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Task Type *</label>
                  <Select value={newTask.type} onValueChange={(v: any) => setNewTask({ ...newTask, type: v })}>
                    <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          Todo
                        </div>
                      </SelectItem>
                      <SelectItem value="daily">
                        <div className="flex items-center gap-2">
                          <Repeat className="w-4 h-4" />
                          Daily
                        </div>
                      </SelectItem>
                      <SelectItem value="milestone">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Milestone
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Difficulty *</label>
                  <Select value={newTask.difficulty} onValueChange={(v: any) => setNewTask({ ...newTask, difficulty: v })}>
                    <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trivial">Trivial (+5 XP, +1 Gold)</SelectItem>
                      <SelectItem value="easy">Easy (+10 XP, +2 Gold)</SelectItem>
                      <SelectItem value="medium">Medium (+20 XP, +5 Gold)</SelectItem>
                      <SelectItem value="hard">Hard (+50 XP, +10 Gold)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Due Date</label>
                  <Input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateTask(false)}
                  className="border-gray-700 text-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateTask}
                  className="bg-gradient-to-r from-emerald-600 to-blue-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Task Lists */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 bg-gray-800/50 border border-gray-700/50">
            <TabsTrigger value="todos" className="data-[state=active]:bg-blue-600">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Todos ({todos.length})
            </TabsTrigger>
            <TabsTrigger value="dailies" className="data-[state=active]:bg-purple-600">
              <Repeat className="w-4 h-4 mr-2" />
              Dailies ({dailies.length})
            </TabsTrigger>
            <TabsTrigger value="milestones" className="data-[state=active]:bg-emerald-600">
              <Target className="w-4 h-4 mr-2" />
              Milestones ({(myTasks?.filter(t => t.type === 'milestone') || []).length})
            </TabsTrigger>
          </TabsList>

          {/* Todos Tab */}
          <TabsContent value="todos" className="space-y-3 mt-6">
            {todos.length === 0 ? (
              <Card className="bg-gray-800/50 border-gray-700/50">
                <CardContent className="p-12 text-center">
                  <CheckCircle2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No todos yet. Create your first task!</p>
                </CardContent>
              </Card>
            ) : (
              todos.map((task) => {
                const reward = getDifficultyReward(task.difficulty);
                const project = myProjects?.find(p => p._id === task.projectId);
                
                return (
                  <Card key={task._id} className={`bg-gray-800/50 border-gray-700/50 transition-all hover:border-blue-500/50 ${task.completed ? 'opacity-60' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <button
                          onClick={() => task.completed ? handleUncompleteTask(task._id) : handleCompleteTask(task._id)}
                          className={`mt-1 ${task.completed ? 'text-emerald-500' : 'text-gray-600 hover:text-blue-500'}`}
                        >
                          {task.completed ? (
                            <CheckCircle2 className="w-6 h-6" />
                          ) : (
                            <Circle className="w-6 h-6" />
                          )}
                        </button>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className={`font-semibold ${task.completed ? 'line-through text-gray-500' : 'text-white'}`}>
                              {task.title}
                            </h3>
                            <div className={`w-2 h-2 rounded-full ${getDifficultyColor(task.difficulty)}`} />
                            {project && (
                              <Badge variant="outline" className="text-xs">
                                {project.title}
                              </Badge>
                            )}
                          </div>
                          
                          {task.description && (
                            <p className="text-sm text-gray-400 mb-2">{task.description}</p>
                          )}

                          <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-1 text-blue-400">
                              <Zap className="w-3 h-3" />
                              {reward.xp} XP
                            </div>
                            <div className="flex items-center gap-1 text-yellow-400">
                              <Sparkles className="w-3 h-3" />
                              {reward.gold} Gold
                            </div>
                            {task.dueDate && (
                              <div className="flex items-center gap-1 text-gray-400">
                                <Calendar className="w-3 h-3" />
                                {new Date(task.dueDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* Dailies Tab */}
          <TabsContent value="dailies" className="space-y-3 mt-6">
            {dailies.length === 0 ? (
              <Card className="bg-gray-800/50 border-gray-700/50">
                <CardContent className="p-12 text-center">
                  <Repeat className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No daily quests. Build good habits!</p>
                </CardContent>
              </Card>
            ) : (
              dailies.map((task) => {
                const reward = getDifficultyReward(task.difficulty);
                const project = myProjects?.find(p => p._id === task.projectId);
                
                return (
                  <Card key={task._id} className={`bg-gray-800/50 border-gray-700/50 transition-all hover:border-purple-500/50 ${task.completed ? 'opacity-60' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <button
                          onClick={() => task.completed ? handleUncompleteTask(task._id) : handleCompleteTask(task._id)}
                          className={`mt-1 ${task.completed ? 'text-purple-500' : 'text-gray-600 hover:text-purple-500'}`}
                        >
                          {task.completed ? (
                            <CheckCircle2 className="w-6 h-6" />
                          ) : (
                            <Circle className="w-6 h-6" />
                          )}
                        </button>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Repeat className="w-4 h-4 text-purple-400" />
                            <h3 className={`font-semibold ${task.completed ? 'line-through text-gray-500' : 'text-white'}`}>
                              {task.title}
                            </h3>
                            <div className={`w-2 h-2 rounded-full ${getDifficultyColor(task.difficulty)}`} />
                            {project && (
                              <Badge variant="outline" className="text-xs">
                                {project.title}
                              </Badge>
                            )}
                          </div>
                          
                          {task.description && (
                            <p className="text-sm text-gray-400 mb-2">{task.description}</p>
                          )}

                          <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-1 text-blue-400">
                              <Zap className="w-3 h-3" />
                              {reward.xp} XP
                            </div>
                            <div className="flex items-center gap-1 text-yellow-400">
                              <Sparkles className="w-3 h-3" />
                              {reward.gold} Gold
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              Daily
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* Milestones Tab */}
          <TabsContent value="milestones" className="space-y-3 mt-6">
            {milestones.length === 0 ? (
              <Card className="bg-gray-800/50 border-gray-700/50">
                <CardContent className="p-12 text-center">
                  <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No milestones yet. Create your first milestone!</p>
                </CardContent>
              </Card>
            ) : (
              milestones.map((task) => {
                const reward = getDifficultyReward(task.difficulty);
                const project = myProjects?.find(p => p._id === task.projectId);
                
                return (
                  <Card key={task._id} className={`bg-gray-800/50 border-gray-700/50 transition-all hover:border-emerald-500/50 ${task.completed ? 'opacity-60' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <button
                          onClick={() => task.completed ? handleUncompleteTask(task._id) : handleCompleteTask(task._id)}
                          className={`mt-1 ${task.completed ? 'text-emerald-500' : 'text-gray-600 hover:text-emerald-500'}`}
                        >
                          {task.completed ? (
                            <CheckCircle2 className="w-6 h-6" />
                          ) : (
                            <Circle className="w-6 h-6" />
                          )}
                        </button>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="w-4 h-4 text-emerald-400" />
                            <h3 className={`font-semibold ${task.completed ? 'line-through text-gray-500' : 'text-white'}`}>
                              {task.title}
                            </h3>
                            <div className={`w-2 h-2 rounded-full ${getDifficultyColor(task.difficulty)}`} />
                            {project && (
                              <Badge variant="outline" className="text-xs">
                                {project.title}
                              </Badge>
                            )}
                          </div>
                          
                          {task.description && (
                            <p className="text-sm text-gray-400 mb-2">{task.description}</p>
                          )}

                          <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-1 text-blue-400">
                              <Zap className="w-3 h-3" />
                              {reward.xp} XP
                            </div>
                            <div className="flex items-center gap-1 text-yellow-400">
                              <Sparkles className="w-3 h-3" />
                              {reward.gold} Gold
                            </div>
                            {task.dueDate && (
                              <div className="flex items-center gap-1 text-gray-400">
                                <Calendar className="w-3 h-3" />
                                {new Date(task.dueDate).toLocaleDateString()}
                              </div>
                            )}
                            <Badge variant="secondary" className="text-xs">
                              Milestone
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
