"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Plus, Users, Edit, Trash2, CheckCircle, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreateTaskModal } from "@/components/tasks/CreateTaskModal";

interface ProjectTaskManagerProps {
  projectId: Id<"projects">;
}

export function ProjectTaskManager({ projectId }: ProjectTaskManagerProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingDifficulty, setEditingDifficulty] = useState<string | null>(null);

  const tasks = useQuery(api.gamifiedTasks.getProjectTasks, { projectId });
  const completeTask = useMutation(api.gamifiedTasks.completeTask);
  const updateDifficulty = useMutation(api.gamifiedTasks.updateTaskDifficulty);

  const handleCompleteTask = async (taskId: Id<"tasks">) => {
    try {
      await completeTask({ taskId });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to complete task");
    }
  };

  const handleChangeDifficulty = async (taskId: Id<"tasks">, difficulty: "trivial" | "easy" | "medium" | "hard") => {
    try {
      const result = await updateDifficulty({ taskId, difficulty });
      alert(`Difficulty updated! New rewards: ${result.newXP} XP, ${result.newGold} Gold`);
      setEditingDifficulty(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update difficulty");
    }
  };

  const difficultyColors = {
    trivial: "bg-gray-500",
    easy: "bg-green-500",
    medium: "bg-yellow-500",
    hard: "bg-red-500",
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Project Tasks</h3>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {!tasks || tasks.length === 0 ? (
          <div className="bg-white/5 rounded-xl p-12 border border-white/10 text-center">
            <p className="text-gray-400">No tasks yet. Create your first task!</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task._id}
              className={`bg-white/5 rounded-xl p-4 border transition-all ${
                task.completed ? "border-white/10 opacity-60" : "border-white/10 hover:border-emerald-500/30"
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Complete Button */}
                <button
                  onClick={() => handleCompleteTask(task._id)}
                  disabled={task.completed}
                  className={`mt-1 ${
                    task.completed
                      ? "text-emerald-500"
                      : "text-gray-600 hover:text-emerald-500"
                  }`}
                >
                  {task.completed ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <Circle className="w-6 h-6" />
                  )}
                </button>

                {/* Task Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className={`font-semibold ${task.completed ? "line-through text-gray-500" : "text-white"}`}>
                      {task.title}
                    </h4>
                    {task.assignedUser && (
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Users className="w-3 h-3" />
                        {task.assignedUser.name}
                      </div>
                    )}
                  </div>

                  {task.description && (
                    <p className="text-sm text-gray-400 mb-3">{task.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Difficulty Badge - Clickable to change */}
                    {editingDifficulty === task._id ? (
                      <div className="flex gap-1">
                        {(["trivial", "easy", "medium", "hard"] as const).map((diff) => (
                          <button
                            key={diff}
                            onClick={() => handleChangeDifficulty(task._id, diff)}
                            className={`px-2 py-1 text-xs rounded ${difficultyColors[diff]} text-white`}
                          >
                            {diff}
                          </button>
                        ))}
                        <button
                          onClick={() => setEditingDifficulty(null)}
                          className="px-2 py-1 text-xs rounded bg-gray-600 text-white"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingDifficulty(task._id)}
                        className="group"
                      >
                        <Badge className={`${difficultyColors[task.difficulty]} text-white group-hover:ring-2 ring-white/50`}>
                          {task.difficulty}
                          <Edit className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Badge>
                      </button>
                    )}

                    <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30">
                      {task.experienceReward} XP
                    </Badge>
                    <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-500/30">
                      {task.goldReward} 🪙
                    </Badge>

                    {task.type && (
                      <Badge className="bg-purple-600/20 text-purple-400 border-purple-500/30">
                        {task.type}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Task Modal */}
      {isCreateModalOpen && (
        <CreateTaskModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          defaultProjectId={projectId}
        />
      )}
    </div>
  );
}