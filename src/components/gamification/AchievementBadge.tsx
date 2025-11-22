"use client";

import React from "react";
import { Lock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AchievementBadgeProps {
  achievement: {
    id: string;
    title: string;
    description: string;
    icon: string;
    category: string;
    xpReward: number;
    unlocked: boolean;
    unlockedAt?: number;
  };
  size?: "small" | "medium" | "large";
}

export function AchievementBadge({ achievement, size = "medium" }: AchievementBadgeProps) {
  const sizeClasses = {
    small: "w-16 h-16 text-2xl",
    medium: "w-24 h-24 text-4xl",
    large: "w-32 h-32 text-5xl",
  };

  const containerClasses = {
    small: "p-3",
    medium: "p-4",
    large: "p-6",
  };

  const categories: Record<string, { color: string; gradient: string }> = {
    tasks: { color: "from-blue-500 to-blue-600", gradient: "bg-gradient-to-br from-blue-500 to-blue-600" },
    events: { color: "from-green-500 to-green-600", gradient: "bg-gradient-to-br from-green-500 to-green-600" },
    collaboration: { color: "from-pink-500 to-pink-600", gradient: "bg-gradient-to-br from-pink-500 to-pink-600" },
    engagement: { color: "from-orange-500 to-orange-600", gradient: "bg-gradient-to-br from-orange-500 to-orange-600" },
    milestones: { color: "from-purple-500 to-purple-600", gradient: "bg-gradient-to-br from-purple-500 to-purple-600" },
    documents: { color: "from-yellow-500 to-yellow-600", gradient: "bg-gradient-to-br from-yellow-500 to-yellow-600" },
    level: { color: "from-indigo-500 to-indigo-600", gradient: "bg-gradient-to-br from-indigo-500 to-indigo-600" },
  };

  const categoryStyle = categories[achievement.category] || categories.tasks;

  return (
    <div
      className={`
        ${containerClasses[size]} rounded-xl border-2 transition-all duration-300
        ${achievement.unlocked 
          ? `${categoryStyle.gradient} border-transparent shadow-lg hover:scale-105 hover:shadow-xl`
          : "bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-700 opacity-60 grayscale"
        }
      `}
      title={achievement.unlocked ? `Unlocked ${achievement.unlockedAt ? formatDistanceToNow(achievement.unlockedAt, { addSuffix: true }) : ""}` : "Locked"}
    >
      {/* Icon */}
      <div className={`${sizeClasses[size]} flex items-center justify-center mx-auto mb-2 relative`}>
        {achievement.unlocked ? (
          <span className="animate-bounce-subtle">{achievement.icon}</span>
        ) : (
          <div className="relative">
            <span className="opacity-30">{achievement.icon}</span>
            <Lock className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-gray-600 dark:text-gray-400" />
          </div>
        )}
      </div>

      {/* Title */}
      <h3
        className={`
          text-sm font-bold text-center mb-1
          ${achievement.unlocked ? "text-white" : "text-gray-600 dark:text-gray-400"}
        `}
      >
        {achievement.title}
      </h3>

      {/* Description */}
      <p
        className={`
          text-xs text-center mb-2
          ${achievement.unlocked ? "text-white/90" : "text-gray-500 dark:text-gray-500"}
        `}
      >
        {achievement.description}
      </p>

      {/* XP Reward */}
      {achievement.xpReward > 0 && (
        <div
          className={`
            text-xs text-center font-semibold
            ${achievement.unlocked ? "text-yellow-200" : "text-gray-500"}
          `}
        >
          +{achievement.xpReward} XP
        </div>
      )}

      {/* Unlock Date */}
      {achievement.unlocked && achievement.unlockedAt && (
        <div className="text-xs text-center text-white/70 mt-1">
          {formatDistanceToNow(achievement.unlockedAt, { addSuffix: true })}
        </div>
      )}
    </div>
  );
}

// Grid of achievements
interface AchievementGridProps {
  achievements: any[];
  columns?: 3 | 4 | 5 | 6;
}

export function AchievementGrid({ achievements, columns = 4 }: AchievementGridProps) {
  const gridClasses = {
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
    5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
    6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6",
  };

  return (
    <div className={`grid ${gridClasses[columns]} gap-4`}>
      {achievements.map((achievement) => (
        <AchievementBadge key={achievement.id} achievement={achievement} />
      ))}
    </div>
  );
}
