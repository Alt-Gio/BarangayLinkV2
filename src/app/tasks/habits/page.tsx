"use client";

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useOfflineData } from '@/contexts/OfflineDataContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sidebar } from '@/components/layout/Sidebar';
import { Input } from '@/components/ui/input';
import {
  Check,
  X,
  Plus,
  Flame,
  Trophy,
  Target,
  Calendar,
  TrendingUp,
  Zap,
  Heart,
  Star,
  Menu,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { Id } from '../../../../convex/_generated/dataModel';

export default function HabitsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [showAddDaily, setShowAddDaily] = useState(false);
  const [showAddTodo, setShowAddTodo] = useState(false);
  
  const [habitForm, setHabitForm] = useState({
    title: '',
    notes: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    positive: true,
    frequency: 'daily' as 'daily' | 'weekly',
  });
  
  const [dailyForm, setDailyForm] = useState({
    title: '',
    notes: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
  });
  
  const [todoForm, setTodoForm] = useState({
    title: '',
    notes: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
  });

  const { currentUser, isOnline } = useOfflineData();
  
  const userStats = useQuery(api.gamifiedTasks.getUserStats, {});

  const habits = useQuery(api.habits.getMyHabits);
  const dailies = useQuery(api.habits.getMyDailies);
  const todos = useQuery(api.habits.getMyTodos);

  const createHabit = useMutation(api.habits.createHabit);
  const completeHabit = useMutation(api.habits.completeHabit);
  const deleteHabit = useMutation(api.habits.deleteHabit);
  const createDaily = useMutation(api.habits.createDaily);
  const toggleDaily = useMutation(api.habits.toggleDaily);
  const deleteDaily = useMutation(api.habits.deleteDaily);
  const createTodo = useMutation(api.habits.createTodo);
  const toggleTodo = useMutation(api.habits.toggleTodo);
  const deleteTodo = useMutation(api.habits.deleteTodo);
  const resetDailies = useMutation(api.habits.resetDailies);

  useEffect(() => {
    if (currentUser) {
      resetDailies();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading habits...</p>
        </div>
      </div>
    );
  }

  const level = currentUser?.level || 1;
  const xp = currentUser?.experience || 0;
  const xpToNextLevel = level * 100;
  const xpProgress = Math.min((xp / xpToNextLevel) * 100, 100);
  const health = currentUser?.health || 50;
  const mana = currentUser?.mana || 50;
  const streak = userStats?.user?.streakCount || 0;
  const gold = currentUser?.gold || 0;

  const handleCreateHabit = async () => {
    if (!habitForm.title.trim()) return;
    try {
      await createHabit(habitForm);
      setHabitForm({ title: '', notes: '', difficulty: 'medium', positive: true, frequency: 'daily' });
      setShowAddHabit(false);
    } catch (error) {
      console.error('Failed to create habit:', error);
    }
  };

  const handleCreateDaily = async () => {
    if (!dailyForm.title.trim()) return;
    try {
      await createDaily(dailyForm);
      setDailyForm({ title: '', notes: '', difficulty: 'medium' });
      setShowAddDaily(false);
    } catch (error) {
      console.error('Failed to create daily:', error);
    }
  };

  const handleCreateTodo = async () => {
    if (!todoForm.title.trim()) return;
    try {
      await createTodo(todoForm);
      setTodoForm({ title: '', notes: '', difficulty: 'medium' });
      setShowAddTodo(false);
    } catch (error) {
      console.error('Failed to create todo:', error);
    }
  };

  const isHabitOnCooldown = (habit: any) => {
    if (!habit.lastCompleted) return false;
    const oneDayMs = 24 * 60 * 60 * 1000;
    const timeSinceLastComplete = Date.now() - habit.lastCompleted;
    return timeSinceLastComplete < oneDayMs;
  };

  const getTimeUntilAvailable = (habit: any) => {
    if (!habit.lastCompleted) return '';
    const oneDayMs = 24 * 60 * 60 * 1000;
    const timeSinceLastComplete = Date.now() - habit.lastCompleted;
    const timeRemaining = oneDayMs - timeSinceLastComplete;
    
    if (timeRemaining <= 0) return '';
    
    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handleCompleteHabit = async (habitId: Id<"habits">, isPositive: boolean) => {
    try {
      await completeHabit({ habitId, isPositive });
    } catch (error: any) {
      if (error?.message?.includes('cooldown')) {
        alert('⏰ Habit is on cooldown! You can only complete this once per day.');
      } else {
        console.error('Failed to complete habit:', error);
        alert('Failed to complete habit. Please try again.');
      }
    }
  };

  const handleToggleDaily = async (dailyId: Id<"dailies">) => {
    try {
      await toggleDaily({ dailyId });
    } catch (error) {
      console.error('Failed to toggle daily:', error);
    }
  };

  const handleToggleTodo = async (todoId: Id<"todos">) => {
    try {
      await toggleTodo({ todoId });
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'hard': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getDifficultyStars = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 1;
      case 'medium': return 2;
      case 'hard': return 3;
      default: return 1;
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
      <Sidebar 
        userRole={currentUser?.userLevel?.name || "WORKER"}
        dashboardTitle="Habits"
        dashboardSubtitle="Track your habits"
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
          <h1 className="text-lg font-semibold text-white">Habits Tracker</h1>
          <div className="w-9" />
        </div>

        <div className="p-6 space-y-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Target className="w-8 h-8 text-purple-400" />
                Habits Tracker
              </h1>
              <p className="text-gray-400 mt-1">Build better habits, one day at a time</p>
            </div>

            {/* Character Stats (Habitica-style) */}
            <Card className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 border-purple-500/30 mb-6">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: Avatar Stats */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-3xl font-bold text-white">
                        {level}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white">{currentUser.name}</h3>
                        <p className="text-purple-300">Level {level} Warrior</p>
                      </div>
                    </div>

                    {/* Health Bar */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Heart className="w-4 h-4 text-red-400" />
                          <span className="text-sm text-gray-300">Health</span>
                        </div>
                        <span className="text-sm font-medium text-white">{health}/100</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-red-500 to-pink-500 h-3 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${health}%` }}
                        />
                      </div>
                    </div>

                    {/* Mana Bar */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-blue-400" />
                          <span className="text-sm text-gray-300">Mana</span>
                        </div>
                        <span className="text-sm font-medium text-white">{mana}/100</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${mana}%` }}
                        />
                      </div>
                    </div>

                    {/* XP Bar */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm text-gray-300">Experience</span>
                        </div>
                        <span className="text-sm font-medium text-white">{xp}/{xpToNextLevel} XP</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-yellow-500 to-orange-500 h-3 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${xpProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{Math.round(xpProgress)}% to Level {level + 1}</p>
                    </div>
                  </div>

                  {/* Right: Quick Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-gray-800/50 border-gray-700/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-orange-500/20 rounded-lg">
                            <Flame className="w-6 h-6 text-orange-400" />
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-white">{streak}</div>
                            <div className="text-xs text-gray-400">Day Streak</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-800/50 border-gray-700/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-yellow-500/20 rounded-lg">
                            <Trophy className="w-6 h-6 text-yellow-400" />
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-white">{gold}</div>
                            <div className="text-xs text-gray-400">Gold</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-800/50 border-gray-700/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-purple-500/20 rounded-lg">
                            <RefreshCw className="w-6 h-6 text-purple-400" />
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-white">{habits?.length || 0}</div>
                            <div className="text-xs text-gray-400">Habits</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-800/50 border-gray-700/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-green-500/20 rounded-lg">
                            <CheckCircle2 className="w-6 h-6 text-green-400" />
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-white">
                              {dailies?.filter(d => d.completed).length || 0}/{dailies?.length || 0}
                            </div>
                            <div className="text-xs text-gray-400">Daily Tasks</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Progress Tracker */}
            <Card className="bg-gray-800/50 border-gray-700/50 mb-6">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-500" />
                  Weekly Progress Tracker
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left p-3 text-gray-300 font-medium">Habit</th>
                        <th className="p-3 text-center text-gray-300 font-medium w-16">M</th>
                        <th className="p-3 text-center text-gray-300 font-medium w-16">T</th>
                        <th className="p-3 text-center text-gray-300 font-medium w-16">W</th>
                        <th className="p-3 text-center text-gray-300 font-medium w-16">Th</th>
                        <th className="p-3 text-center text-gray-300 font-medium w-16">F</th>
                        <th className="p-3 text-center text-gray-300 font-medium w-16">S</th>
                        <th className="p-3 text-center text-gray-300 font-medium w-16">Su</th>
                        <th className="p-3 text-center text-gray-300 font-medium w-20">Streak</th>
                      </tr>
                    </thead>
                    <tbody>
                      {habits && habits.length > 0 ? (
                        habits.map((habit) => (
                          <tr key={habit._id} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <span className="text-white font-medium">{habit.title}</span>
                                <div className="flex items-center gap-1">
                                  {[...Array(getDifficultyStars(habit.difficulty))].map((_, i) => (
                                    <Star key={i} className={`w-3 h-3 ${getDifficultyColor(habit.difficulty)} fill-current`} />
                                  ))}
                                </div>
                              </div>
                            </td>
                            {/* Days of the week - placeholders for now */}
                            {['M', 'T', 'W', 'Th', 'F', 'S', 'Su'].map((day, idx) => (
                              <td key={day} className="p-3 text-center">
                                <button className="w-8 h-8 rounded border border-gray-600 hover:border-emerald-500 transition-colors flex items-center justify-center">
                                  <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                                </button>
                              </td>
                            ))}
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1 text-orange-400">
                                <Flame className="w-4 h-4" />
                                <span className="font-bold">{habit.streak}</span>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-gray-500">
                            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No habits to track yet. Create a habit to start!</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-300">
                    📊 <strong>Track your daily progress:</strong> Check off each day as you complete your habits. Build streaks to earn more rewards!
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Habits Section */}
            <Card className="bg-gray-800/50 border-gray-700/50 mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-purple-500" />
                    Habits
                  </CardTitle>
                  <Button onClick={() => setShowAddHabit(!showAddHabit)} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Habit
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Add Habit Form */}
                {showAddHabit && (
                  <div className="mb-4 p-4 bg-gray-900/50 rounded-lg border border-purple-500/30">
                    <div className="space-y-3">
                      <Input
                        value={habitForm.title}
                        onChange={(e) => setHabitForm({ ...habitForm, title: e.target.value })}
                        placeholder="Habit name (e.g., Exercise, Drink Water)"
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                      <select
                        value={habitForm.difficulty}
                        onChange={(e) => setHabitForm({ ...habitForm, difficulty: e.target.value as any })}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
                      >
                        <option value="easy" className="bg-gray-900 text-white">Easy (5 XP, 2 Gold)</option>
                        <option value="medium" className="bg-gray-900 text-white">Medium (10 XP, 5 Gold)</option>
                        <option value="hard" className="bg-gray-900 text-white">Hard (20 XP, 10 Gold)</option>
                      </select>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-white cursor-pointer">
                          <input
                            type="radio"
                            checked={habitForm.positive}
                            onChange={() => setHabitForm({ ...habitForm, positive: true })}
                            className="text-purple-600"
                          />
                          <span>✅ Positive (Good habit)</span>
                        </label>
                        <label className="flex items-center gap-2 text-white cursor-pointer">
                          <input
                            type="radio"
                            checked={!habitForm.positive}
                            onChange={() => setHabitForm({ ...habitForm, positive: false })}
                            className="text-purple-600"
                          />
                          <span>❌ Negative (Bad habit to avoid)</span>
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleCreateHabit} className="bg-purple-600 hover:bg-purple-700 flex-1">
                          Create Habit
                        </Button>
                        <Button onClick={() => setShowAddHabit(false)} variant="outline" className="border-gray-600">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {habits && habits.length > 0 ? (
                    habits.map((habit) => {
                      const onCooldown = isHabitOnCooldown(habit);
                      const timeUntil = getTimeUntilAvailable(habit);
                      
                      return (
                        <div
                          key={habit._id}
                          className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
                            onCooldown 
                              ? 'bg-gray-900/30 border-gray-700/30 opacity-60' 
                              : 'bg-gray-900/50 border-gray-700/50 hover:border-purple-500/30'
                          }`}
                        >
                          <button 
                            onClick={() => !onCooldown && handleCompleteHabit(habit._id, false)}
                            disabled={onCooldown}
                            className={`p-2 rounded-lg transition-colors ${
                              onCooldown 
                                ? 'bg-gray-700/20 cursor-not-allowed' 
                                : 'bg-red-500/20 hover:bg-red-500/30'
                            }`}
                            title={onCooldown ? `Cooldown: ${timeUntil}` : habit.positive ? "Skip good habit" : "Avoid bad habit"}
                          >
                            <X className={`w-5 h-5 ${onCooldown ? 'text-gray-500' : 'text-red-400'}`} />
                          </button>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className={`font-medium ${onCooldown ? 'text-gray-500' : 'text-white'}`}>
                                {habit.title}
                              </h4>
                              <div className="flex items-center gap-1">
                                {[...Array(getDifficultyStars(habit.difficulty))].map((_, i) => (
                                  <Star key={i} className={`w-3 h-3 ${getDifficultyColor(habit.difficulty)} fill-current`} />
                                ))}
                              </div>
                              {onCooldown && (
                                <Badge className="bg-blue-500/20 text-blue-300 text-xs">
                                  ⏰ {timeUntil}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-1">
                              <div className="flex items-center gap-1 text-orange-400">
                                <Flame className="w-3 h-3" />
                                <span className="text-xs font-medium">{habit.streak} day streak</span>
                              </div>
                              <Badge className={habit.positive ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}>
                                {habit.positive ? 'Positive' : 'Negative'}
                              </Badge>
                            </div>
                          </div>

                          <button 
                            onClick={() => !onCooldown && handleCompleteHabit(habit._id, true)}
                            disabled={onCooldown}
                            className={`p-2 rounded-lg transition-colors ${
                              onCooldown 
                                ? 'bg-gray-700/20 cursor-not-allowed' 
                                : 'bg-green-500/20 hover:bg-green-500/30'
                            }`}
                            title={onCooldown ? `Cooldown: ${timeUntil}` : habit.positive ? "Complete good habit" : "Do bad habit"}
                          >
                            <Check className={`w-5 h-5 ${onCooldown ? 'text-gray-500' : 'text-green-400'}`} />
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <RefreshCw className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No habits yet. Create one to get started!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Dailies and To-Dos Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Dailies */}
              <Card className="bg-gray-800/50 border-gray-700/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-500" />
                      Daily Tasks
                    </CardTitle>
                    <Button onClick={() => setShowAddDaily(!showAddDaily)} size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Add Daily Form */}
                  {showAddDaily && (
                    <div className="mb-3 p-3 bg-gray-900/50 rounded-lg border border-blue-500/30">
                      <div className="space-y-2">
                        <Input
                          value={dailyForm.title}
                          onChange={(e) => setDailyForm({ ...dailyForm, title: e.target.value })}
                          placeholder="Daily task name"
                          className="bg-gray-800 border-gray-700 text-white text-sm"
                        />
                        <select
                          value={dailyForm.difficulty}
                          onChange={(e) => setDailyForm({ ...dailyForm, difficulty: e.target.value as any })}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                        >
                          <option value="easy" className="bg-gray-900 text-white">Easy (5 XP, 2 Gold)</option>
                          <option value="medium" className="bg-gray-900 text-white">Medium (10 XP, 5 Gold)</option>
                          <option value="hard" className="bg-gray-900 text-white">Hard (20 XP, 10 Gold)</option>
                        </select>
                        <div className="flex gap-2">
                          <Button onClick={handleCreateDaily} size="sm" className="bg-blue-600 hover:bg-blue-700 flex-1">
                            Create
                          </Button>
                          <Button onClick={() => setShowAddDaily(false)} size="sm" variant="outline" className="border-gray-600">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {dailies && dailies.length > 0 ? (
                      dailies.map((daily) => (
                        <div
                          key={daily._id}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                            daily.completed
                              ? 'bg-green-900/20 border-green-500/30'
                              : 'bg-gray-900/50 border-gray-700/50 hover:border-blue-500/30'
                          }`}
                        >
                          <button
                            onClick={() => handleToggleDaily(daily._id)}
                            className={`p-1.5 rounded transition-colors ${
                              daily.completed
                                ? 'bg-green-500/20'
                                : 'bg-gray-700/50 hover:bg-gray-600/50'
                            }`}
                          >
                            {daily.completed ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : (
                              <div className="w-4 h-4 border-2 border-gray-500 rounded" />
                            )}
                          </button>
                          
                          <div className="flex-1">
                            <span className={`font-medium ${daily.completed ? 'text-gray-400 line-through' : 'text-white'}`}>
                              {daily.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            {[...Array(getDifficultyStars(daily.difficulty))].map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${getDifficultyColor(daily.difficulty)} fill-current`} />
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No daily tasks yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* To-Dos */}
              <Card className="bg-gray-800/50 border-gray-700/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      To-Do List
                    </CardTitle>
                    <Button onClick={() => setShowAddTodo(!showAddTodo)} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Add Todo Form */}
                  {showAddTodo && (
                    <div className="mb-3 p-3 bg-gray-900/50 rounded-lg border border-emerald-500/30">
                      <div className="space-y-2">
                        <Input
                          value={todoForm.title}
                          onChange={(e) => setTodoForm({ ...todoForm, title: e.target.value })}
                          placeholder="To-do task name"
                          className="bg-gray-800 border-gray-700 text-white text-sm"
                        />
                        <select
                          value={todoForm.difficulty}
                          onChange={(e) => setTodoForm({ ...todoForm, difficulty: e.target.value as any })}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                        >
                          <option value="easy" className="bg-gray-900 text-white">Easy (10 XP, 5 Gold)</option>
                          <option value="medium" className="bg-gray-900 text-white">Medium (20 XP, 10 Gold)</option>
                          <option value="hard" className="bg-gray-900 text-white">Hard (40 XP, 20 Gold)</option>
                        </select>
                        <div className="flex gap-2">
                          <Button onClick={handleCreateTodo} size="sm" className="bg-emerald-600 hover:bg-emerald-700 flex-1">
                            Create
                          </Button>
                          <Button onClick={() => setShowAddTodo(false)} size="sm" variant="outline" className="border-gray-600">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {todos && todos.length > 0 ? (
                      todos.map((todo) => (
                        <div
                          key={todo._id}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                            todo.completed
                              ? 'bg-emerald-900/20 border-emerald-500/30'
                              : 'bg-gray-900/50 border-gray-700/50 hover:border-emerald-500/30'
                          }`}
                        >
                          <button
                            onClick={() => handleToggleTodo(todo._id)}
                            className={`p-1.5 rounded transition-colors ${
                              todo.completed
                                ? 'bg-emerald-500/20'
                                : 'bg-gray-700/50 hover:bg-gray-600/50'
                            }`}
                          >
                            {todo.completed ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <div className="w-4 h-4 border-2 border-gray-500 rounded" />
                            )}
                          </button>
                          
                          <div className="flex-1">
                            <span className={`font-medium ${todo.completed ? 'text-gray-400 line-through' : 'text-white'}`}>
                              {todo.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            {[...Array(getDifficultyStars(todo.difficulty))].map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${getDifficultyColor(todo.difficulty)} fill-current`} />
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No to-dos yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
