"use client";

import { Check, Clock, Calendar, Trash2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TaskCardProps {
  task: any;
  onComplete: () => void;
  onDelete: () => void;
}

export function TaskCard({ task, onComplete, onDelete }: TaskCardProps) {
  const difficultyColors = {
    trivial: "bg-gray-500",
    easy: "bg-green-500",
    medium: "bg-yellow-500",
    hard: "bg-red-500",
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
  const completedToday = task.lastCompleted && 
    new Date(task.lastCompleted).toDateString() === new Date().toDateString();

  return (
    <div className={`bg-white/5 backdrop-blur-md rounded-xl border transition-all hover:scale-[1.02] ${
      task.completed ? "border-white/10 opacity-60" : 
      isOverdue ? "border-red-500/30 bg-red-600/10" :
      "border-white/10 hover:border-emerald-500/30"
    }`}>
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={onComplete}
                disabled={completedToday && task.type === "daily"}
                className={`p-2 rounded-lg transition-all ${
                  task.completed || completedToday
                    ? "bg-emerald-600 text-white"
                    : "bg-white/10 hover:bg-emerald-600/20 text-gray-400 hover:text-emerald-400"
                }`}
              >
                <Check className="w-5 h-5" />
              </button>
              <div className="flex-1">
                <h3 className={`text-lg font-semibold ${
                  task.completed ? "line-through text-gray-500" : "text-white"
                }`}>
                  {task.title}
                </h3>
                {task.description && (
                  <p className="text-gray-400 text-sm mt-1">{task.description}</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 ml-12">
              <Badge className={`${difficultyColors[task.difficulty as keyof typeof difficultyColors]} text-white`}>
                {task.difficulty}
              </Badge>
              <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30">
                {task.experienceReward} XP
              </Badge>
              <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-500/30">
                {task.goldReward} 🪙
              </Badge>
              
              {task.type === "daily" && task.streak > 0 && (
                <Badge className="bg-orange-600/20 text-orange-400 border-orange-500/30">
                  🔥 {task.streak} day streak
                </Badge>
              )}

              {task.dueDate && (
                <div className={`flex items-center gap-1 text-sm ${
                  isOverdue ? "text-red-400" : "text-gray-400"
                }`}>
                  <Calendar className="w-4 h-4" />
                  {new Date(task.dueDate).toLocaleDateString()}
                  {isOverdue && <AlertCircle className="w-4 h-4" />}
                </div>
              )}

              {completedToday && task.type === "daily" && (
                <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-500/30">
                  ✓ Completed today
                </Badge>
              )}
            </div>
          </div>

          <button
            onClick={onDelete}
            className="p-2 bg-white/10 hover:bg-red-600/20 rounded-lg transition-colors"
          >
            <Trash2 className="w-5 h-5 text-gray-400 hover:text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
