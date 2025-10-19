'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useOfflineData } from '@/contexts/OfflineDataContext';

interface TaskFormData {
  title: string;
  description: string;
  type: 'habit' | 'daily' | 'todo' | 'reward';
  difficulty: 'trivial' | 'easy' | 'medium' | 'hard';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedHours: number;
  projectId?: string;
  eventId?: string;
  tags: string[];
  projectImpactScore: number;
  isBlocking: boolean;
  habitFrequency?: 'daily' | 'weekly' | 'monthly';
  positiveHabit?: boolean;
}

export default function HabiticaTaskBoard() {
  const [activeTab, setActiveTab] = useState<'habits' | 'dailies' | 'todos' | 'rewards'>('todos');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [logHoursTaskId, setLogHoursTaskId] = useState<string | null>(null);
  const [hoursToLog, setHoursToLog] = useState('');
  const [hoursDescription, setHoursDescription] = useState('');

  // Get current user from offline context (cached!)
  const { currentUser, isOnline } = useOfflineData();
  
  // Queries
  const userStats = useQuery(api.gamifiedTasks.getUserStats, {});
  const habits = useQuery(api.gamifiedTasks.getGamifiedTasks, { type: 'habit' });
  const dailies = useQuery(api.gamifiedTasks.getGamifiedTasks, { type: 'daily' });
  const todos = useQuery(api.gamifiedTasks.getGamifiedTasks, { type: 'todo', status: 'todo' });
  const rewards = useQuery(api.gamifiedTasks.getGamifiedTasks, { type: 'reward' });

  // Mutations
  const createTask = useMutation(api.gamifiedTasks.createTask);
  const completeTask = useMutation(api.gamifiedTasks.completeTask);
  const logHours = useMutation(api.gamifiedTasks.logHours);

  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    type: 'todo',
    difficulty: 'easy',
    priority: 'medium',
    estimatedHours: 1,
    tags: [],
    projectImpactScore: 5,
    isBlocking: false,
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'trivial': return 'text-gray-500 bg-gray-100';
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'habit': return '🔄';
      case 'daily': return '📅';
      case 'todo': return '✅';
      case 'reward': return '🎁';
      default: return '📝';
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      console.error('User not authenticated');
      return;
    }
    
    try {
      await createTask({
        ...formData,
        assignedTo: currentUser._id,
        dueDate: Date.now() + (7 * 24 * 60 * 60 * 1000), // Default 1 week from now
        projectId: formData.projectId ? formData.projectId as any : undefined,
        eventId: formData.eventId ? formData.eventId as any : undefined,
      });
      setShowCreateForm(false);
      setFormData({
        title: '',
        description: '',
        type: 'todo',
        difficulty: 'easy',
        priority: 'medium',
        estimatedHours: 1,
        tags: [],
        projectImpactScore: 5,
        isBlocking: false,
      });
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const result = await completeTask({ taskId: taskId as any });
      if (result.leveledUp) {
        alert(`🎉 Level Up! You're now level ${result.newLevel}!`);
      }
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  const handleLogHours = async () => {
    if (!logHoursTaskId || !hoursToLog) return;
    
    try {
      await logHours({
        taskId: logHoursTaskId as any,
        hours: parseFloat(hoursToLog),
        description: hoursDescription,
      });
      setLogHoursTaskId(null);
      setHoursToLog('');
      setHoursDescription('');
    } catch (error) {
      console.error('Failed to log hours:', error);
    }
  };

  const renderTaskCard = (task: any) => (
    <div key={task._id} className="bg-white rounded-lg border shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getTypeIcon(task.type)}</span>
          <h3 className="font-semibold text-gray-900">{task.title}</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(task.difficulty)}`}>
            {task.difficulty}
          </span>
          {task.isBlocking && (
            <span className="px-2 py-1 rounded-full text-xs font-medium text-orange-600 bg-orange-100">
              🚫 Blocking
            </span>
          )}
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-3">{task.description}</p>

      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
        <div className="flex items-center space-x-4">
          <span>💰 {task.goldReward}g</span>
          <span>⭐ {task.experienceReward}xp</span>
          {task.estimatedHours && <span>⏱️ {task.estimatedHours}h est.</span>}
          {task.totalLoggedHours > 0 && <span>📊 {task.totalLoggedHours}h logged</span>}
        </div>
        {task.streak && <span className="text-orange-500">🔥 {task.streak} streak</span>}
      </div>

      {task.project && (
        <div className="mb-3">
          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
            📁 {task.project.title}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            onClick={() => handleCompleteTask(task._id)}
            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
            disabled={task.status === 'completed'}
          >
            {task.status === 'completed' ? '✅ Done' : '✅ Complete'}
          </button>
          <button
            onClick={() => setLogHoursTaskId(task._id)}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
          >
            ⏱️ Log Hours
          </button>
        </div>
        <div className="text-xs text-gray-400">
          Impact: {task.projectImpactScore}/10
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* User Stats Header */}
      {userStats && (
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{userStats.user.name}</h1>
              <p className="text-purple-100">Level {userStats.user.level} Barangay Hero</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-purple-100">Next Level</div>
              <div className="text-lg font-semibold">{userStats.nextLevelXP} XP to go</div>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold">⭐ {userStats.user.experience}</div>
              <div className="text-sm text-purple-100">Experience</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">💰 {userStats.user.gold}</div>
              <div className="text-sm text-purple-100">Gold</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">✅ {userStats.tasks.completed}</div>
              <div className="text-sm text-purple-100">Tasks Done</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">⏱️ {userStats.user.totalHoursLogged}</div>
              <div className="text-sm text-purple-100">Hours Logged</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-purple-100 mb-1">
              <span>Level {userStats.user.level}</span>
              <span>Level {userStats.user.level + 1}</span>
            </div>
            <div className="w-full bg-purple-800 rounded-full h-2">
              <div 
                className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((userStats.user.experience % 100) / 100) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Task Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {(['habits', 'dailies', 'todos', 'rewards'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-colors ${
              activeTab === tab
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Create Task Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold capitalize">{activeTab}</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          + Add {activeTab.slice(0, -1)}
        </button>
      </div>

      {/* Task Lists */}
      <div className="grid gap-4">
        {activeTab === 'habits' && habits?.map(renderTaskCard)}
        {activeTab === 'dailies' && dailies?.map(renderTaskCard)}
        {activeTab === 'todos' && todos?.map(renderTaskCard)}
        {activeTab === 'rewards' && rewards?.map(renderTaskCard)}
      </div>

      {/* Create Task Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Create New {formData.type}</h3>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="habit">🔄 Habit</option>
                    <option value="daily">📅 Daily</option>
                    <option value="todo">✅ To-Do</option>
                    <option value="reward">🎁 Reward</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="trivial">Trivial</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Hours</label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={formData.estimatedHours}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimatedHours: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Impact (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.projectImpactScore}
                    onChange={(e) => setFormData(prev => ({ ...prev, projectImpactScore: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="flex items-center pt-6">
                  <input
                    type="checkbox"
                    id="isBlocking"
                    checked={formData.isBlocking}
                    onChange={(e) => setFormData(prev => ({ ...prev, isBlocking: e.target.checked }))}
                    className="mr-2"
                  />
                  <label htmlFor="isBlocking" className="text-sm text-gray-700">Blocking Task</label>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Hours Modal */}
      {logHoursTaskId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Log Hours</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hours Worked</label>
                <input
                  type="number"
                  min="0.25"
                  step="0.25"
                  value={hoursToLog}
                  onChange={(e) => setHoursToLog(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., 2.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <textarea
                  value={hoursDescription}
                  onChange={(e) => setHoursDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={2}
                  placeholder="What did you work on?"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setLogHoursTaskId(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogHours}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Log Hours
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
