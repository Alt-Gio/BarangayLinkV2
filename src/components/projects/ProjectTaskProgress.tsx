"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Trophy, Coins, CheckCircle, Clock, Zap, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProjectTaskProgressProps {
  projectId: Id<"projects">;
}

export function ProjectTaskProgress({ projectId }: ProjectTaskProgressProps) {
  const stats = useQuery(api.gamifiedTasks.getProjectStats, { projectId });

  if (!stats) {
    return (
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/10 rounded w-1/2"></div>
          <div className="h-20 bg-white/10 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-xl p-6 border border-purple-500/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-400" />
          Gamification Progress
        </h3>
        <Badge className={`${
          stats.completionRate >= 100 ? "bg-green-600" :
          stats.completionRate >= 75 ? "bg-blue-600" :
          stats.completionRate >= 50 ? "bg-yellow-600" :
          "bg-gray-600"
        } text-white`}>
          {Math.round(stats.completionRate)}% Complete
        </Badge>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Total Tasks */}
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400">Tasks</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {stats.completed}/{stats.total}
          </div>
        </div>

        {/* XP Earned */}
        <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 rounded-lg p-4 border border-blue-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-blue-300">XP Earned</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {stats.xpEarned}
          </div>
          <div className="w-full bg-blue-900/30 rounded-full h-1.5 mt-2">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all"
              style={{ width: `${stats.xpProgress}%` }}
            ></div>
          </div>
          <div className="text-xs text-blue-300 mt-1">
            of {stats.xpPossible} XP
          </div>
        </div>

        {/* Gold Earned */}
        <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-700/20 rounded-lg p-4 border border-yellow-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-yellow-300">Gold Earned</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {stats.goldEarned} 🪙
          </div>
          <div className="w-full bg-yellow-900/30 rounded-full h-1.5 mt-2">
            <div
              className="bg-yellow-500 h-1.5 rounded-full transition-all"
              style={{ width: `${stats.goldProgress}%` }}
            ></div>
          </div>
          <div className="text-xs text-yellow-300 mt-1">
            of {stats.goldPossible} Gold
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-orange-400" />
            <span className="text-xs text-gray-400">Pending</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {stats.pending}
          </div>
        </div>
      </div>

      {/* Difficulty Breakdown */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Tasks by Difficulty</h4>
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(stats.byDifficulty).map(([difficulty, data]) => (
            <div key={difficulty} className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="text-xs text-gray-400 capitalize mb-1">{difficulty}</div>
              <div className="text-lg font-bold text-white">
                {data.completed}/{data.total}
              </div>
              <div className={`w-full rounded-full h-1 mt-2 ${
                difficulty === "hard" ? "bg-red-900/30" :
                difficulty === "medium" ? "bg-yellow-900/30" :
                difficulty === "easy" ? "bg-green-900/30" :
                "bg-gray-900/30"
              }`}>
                <div
                  className={`h-1 rounded-full ${
                    difficulty === "hard" ? "bg-red-500" :
                    difficulty === "medium" ? "bg-yellow-500" :
                    difficulty === "easy" ? "bg-green-500" :
                    "bg-gray-500"
                  }`}
                  style={{ width: `${data.total > 0 ? (data.completed / data.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Type Breakdown */}
      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-3">Tasks by Type</h4>
        <div className="flex flex-wrap gap-2">
          {Object.entries(stats.byType).map(([type, count]) => (
            count > 0 && (
              <Badge key={type} className="bg-purple-600/20 text-purple-300 border-purple-500/30">
                {type}: {count}
              </Badge>
            )
          ))}
        </div>
      </div>
    </div>
  );
}
