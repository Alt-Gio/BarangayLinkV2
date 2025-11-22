"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Trophy, Medal, Crown, TrendingUp, Flame, Coins } from "lucide-react";

interface LeaderboardProps {
  limit?: number;
  showDepartments?: boolean;
}

export function Leaderboard({ limit = 10, showDepartments = false }: LeaderboardProps) {
  const [metric, setMetric] = useState<"xp" | "gold" | "level">("xp");
  
  const leaderboard = useQuery(api.services.gamificationService.getLeaderboard, {
    limit,
    metric,
  });

  if (!leaderboard) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  const metrics = [
    { value: "xp", label: "XP", icon: TrendingUp, color: "text-blue-600" },
    { value: "gold", label: "Gold", icon: Coins, color: "text-yellow-600" },
    { value: "level", label: "Level", icon: Flame, color: "text-orange-600" },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Leaderboard
          </h2>
        </div>

        {/* Metric Selector */}
        <div className="flex gap-2">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.value}
                onClick={() => setMetric(m.value as any)}
                className={`
                  px-4 py-2 rounded-lg flex items-center gap-2 font-medium text-sm
                  transition-all duration-200
                  ${
                    metric === m.value
                      ? "bg-purple-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="space-y-3">
        {leaderboard.map((entry, index) => {
          const isTop3 = index < 3;
          const rankIcons = [
            <Crown className="w-6 h-6 text-yellow-500" />,
            <Medal className="w-6 h-6 text-gray-400" />,
            <Medal className="w-6 h-6 text-orange-600" />,
          ];

          return (
            <div
              key={entry.userId}
              className={`
                flex items-center gap-4 p-4 rounded-lg transition-all duration-200
                ${
                  isTop3
                    ? "bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-700"
                    : "bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800"
                }
              `}
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-10 flex items-center justify-center">
                {isTop3 ? (
                  rankIcons[index]
                ) : (
                  <span className="text-xl font-bold text-gray-500 dark:text-gray-400">
                    {entry.rank}
                  </span>
                )}
              </div>

              {/* Avatar */}
              <img
                src={entry.profilePicture || "/default-avatar.png"}
                alt={entry.name}
                className="w-12 h-12 rounded-full border-2 border-white dark:border-gray-700 shadow-md"
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {entry.name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">{entry.role}</span>
                  {showDepartments && entry.department && (
                    <>
                      <span>•</span>
                      <span>{entry.department}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6">
                {/* XP */}
                <div className="text-center">
                  <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold">
                    <TrendingUp className="w-4 h-4" />
                    <span>{entry.xp.toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-gray-500">XP</div>
                </div>

                {/* Gold */}
                <div className="text-center">
                  <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 font-bold">
                    <Coins className="w-4 h-4" />
                    <span>{entry.gold.toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-gray-500">Gold</div>
                </div>

                {/* Level */}
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-lg shadow-lg">
                  {entry.level}
                </div>
              </div>

              {/* Streak */}
              {entry.loginStreak > 0 && (
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-semibold text-sm">
                  <Flame className="w-4 h-4" />
                  <span>{entry.loginStreak}d</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {leaderboard.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Trophy className="w-16 h-16 mx-auto mb-3 opacity-50" />
          <p>No rankings yet. Be the first to earn points!</p>
        </div>
      )}
    </div>
  );
}
