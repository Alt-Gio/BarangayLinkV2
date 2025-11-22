"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { BudgetTracker } from "./BudgetTracker";
import { ExpenseList } from "./ExpenseList";
import { ExpenseModal } from "./ExpenseModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, DollarSign, Lock } from "lucide-react";
import { toast } from "sonner";

interface ProjectBudgetTabProps {
  projectId: Id<"projects">;
  projectBudget: number;
  project: any;
  currentUser: any;
}

export function ProjectBudgetTab({ projectId, projectBudget, project, currentUser }: ProjectBudgetTabProps) {
  const [budgetAmount, setBudgetAmount] = useState(projectBudget || 0);
  const updateProject = useMutation(api.projects.updateProject);

  // Permission check: Only Admin, Captain (Manager), or project creator can manage budget
  const canManageBudget = 
    currentUser?.userLevel?.name === "ADMIN" ||
    currentUser?.userLevel?.name === "MANAGER" ||
    project?.createdBy === currentUser?._id;

  const handleSaveBudget = async () => {
    if (!canManageBudget) {
      toast.error("You don't have permission to update the budget");
      return;
    }

    if (budgetAmount <= 0) {
      toast.error("Budget must be greater than zero");
      return;
    }

    try {
      await updateProject({
        projectId,
        updates: {
          budget: budgetAmount,
        },
      });
      
      // Show detailed success message
      const isInitial = projectBudget === 0;
      const changeText = isInitial 
        ? `Initial budget set to ₱${budgetAmount.toLocaleString()}`
        : `Budget ${budgetAmount > projectBudget ? 'increased' : 'decreased'} to ₱${budgetAmount.toLocaleString()}`;
      
      toast.success(changeText, {
        description: "The yellow 'Budget Used' card above has been updated!",
        duration: 4000,
      });
    } catch (error) {
      console.error("Error saving budget:", error);
      toast.error("Failed to update budget");
    }
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 rounded-lg border border-gray-800/50">
      {/* Header with Add Expense Button */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-800/50">
        <div>
          <h2 className="text-2xl font-bold text-white">Budget & Expenses</h2>
          <p className="text-sm text-gray-400 mt-1">Track project finances and manage expenses</p>
        </div>
        <ExpenseModal projectId={projectId} />
      </div>

      {/* Budget Management Section */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader className="border-b border-gray-800/50">
          <CardTitle className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-400" />
              Budget Management
            </div>
            {projectBudget > 0 && (
              <div className="text-sm font-normal text-gray-400">
                Current: ₱{projectBudget.toLocaleString()}
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {canManageBudget ? (
            <>
              {/* Info box */}
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-sm text-yellow-200 flex items-center gap-2">
                  <span className="text-lg">💡</span>
                  <span>
                    This budget connects to the <strong className="text-yellow-400">yellow "Budget Used" card</strong> above. 
                    Set it once and track expenses below.
                  </span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Total Project Budget (₱)
                </label>
                <Input
                  type="number"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(parseFloat(e.target.value) || 0)}
                  className="bg-gray-800 border-gray-700 text-white text-lg font-semibold"
                  placeholder="Enter total budget"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {projectBudget === 0 
                    ? "Set your initial project budget" 
                    : `Current budget: ₱${projectBudget.toLocaleString()}`
                  }
                </p>
              </div>

              {/* Live Preview */}
              <div className="p-4 bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border border-yellow-700/50 rounded-lg">
                <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">Live Preview</p>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-300">Budget Used</span>
                  <span className="text-white font-semibold text-lg">
                    ₱{project.spent?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-300">Remaining</span>
                  <span className="text-emerald-400 font-semibold text-lg">
                    ₱{((budgetAmount || 0) - (project.spent || 0)).toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${budgetAmount > 0 ? Math.min((project.spent / budgetAmount) * 100, 100) : 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>{budgetAmount > 0 ? `${Math.round((project.spent / budgetAmount) * 100)}%` : '0%'} used</span>
                  <span>100%</span>
                </div>
              </div>

              {budgetAmount !== projectBudget && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-200">
                    💰 You're {budgetAmount > projectBudget ? 'increasing' : budgetAmount < projectBudget ? 'decreasing' : 'updating'} the budget 
                    from ₱{projectBudget.toLocaleString()} to ₱{budgetAmount.toLocaleString()}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                {budgetAmount !== projectBudget && (
                  <Button
                    variant="outline"
                    onClick={() => setBudgetAmount(projectBudget)}
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    Reset
                  </Button>
                )}
                <Button
                  onClick={handleSaveBudget}
                  disabled={budgetAmount === projectBudget || budgetAmount <= 0}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {projectBudget === 0 ? 'Set Initial Budget' : 'Update Budget'}
                </Button>
              </div>
            </>
          ) : (
            <div className="p-8 text-center">
              <Lock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">You don't have permission to manage the budget</p>
              <p className="text-sm text-gray-500 mt-1">Only Admin, Captain, or project lead can update budget</p>
              <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
                <p className="text-sm text-gray-400">Current Budget</p>
                <p className="text-2xl font-bold text-white mt-1">₱{projectBudget.toLocaleString()}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Budget Tracker */}
      <BudgetTracker projectId={projectId} />

      {/* Expense List with Approval */}
      <ExpenseList projectId={projectId} currentUser={currentUser} />
    </div>
  );
}
