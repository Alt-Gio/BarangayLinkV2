"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Edit2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Package,
  Users,
  Truck,
  FileText,
  Zap,
  MoreHorizontal,
} from "lucide-react";

interface ProjectBudgetTabProps {
  projectId: Id<"projects">;
  projectBudget: number;
}

export function ProjectBudgetTab({ projectId, projectBudget }: ProjectBudgetTabProps) {
  const expenses = useQuery(api.expenses.getProjectExpenses, { projectId });
  const stats = useQuery(api.expenses.getExpenseStats, { projectId });
  const addExpense = useMutation(api.expenses.addExpense);
  const deleteExpense = useMutation(api.expenses.deleteExpense);

  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "materials" as const,
    date: new Date().toISOString().split('T')[0],
    notes: "",
  });

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await addExpense({
        projectId,
        description: formData.description,
        amount: parseFloat(formData.amount),
        category: formData.category,
        date: new Date(formData.date).getTime(),
        notes: formData.notes || undefined,
      });

      setFormData({
        description: "",
        amount: "",
        category: "materials",
        date: new Date().toISOString().split('T')[0],
        notes: "",
      });
      setShowAddForm(false);
    } catch (error) {
      alert("Failed to add expense. Please try again.");
    }
  };

  const handleDeleteExpense = async (expenseId: Id<"expenses">) => {
    if (confirm("Are you sure you want to delete this expense?")) {
      try {
        await deleteExpense({ expenseId });
      } catch (error) {
        alert("Failed to delete expense.");
      }
    }
  };

  const formatPeso = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const totalExpenses = stats?.totalExpenses || 0;
  const remaining = projectBudget - totalExpenses;
  const percentageUsed = projectBudget > 0 ? (totalExpenses / projectBudget) * 100 : 0;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "materials": return <Package className="w-4 h-4" />;
      case "labor": return <Users className="w-4 h-4" />;
      case "equipment": return <Zap className="w-4 h-4" />;
      case "transportation": return <Truck className="w-4 h-4" />;
      case "permits": return <FileText className="w-4 h-4" />;
      case "utilities": return <Zap className="w-4 h-4" />;
      default: return <MoreHorizontal className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "materials": return "bg-blue-600";
      case "labor": return "bg-green-600";
      case "equipment": return "bg-purple-600";
      case "transportation": return "bg-yellow-600";
      case "permits": return "bg-red-600";
      case "utilities": return "bg-cyan-600";
      default: return "bg-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* Budget Overview */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold opacity-90">Total Budget</h3>
            <p className="text-3xl font-bold">{formatPeso(projectBudget)}</p>
          </div>
          {remaining >= 0 ? (
            <TrendingUp className="w-12 h-12 opacity-50" />
          ) : (
            <TrendingDown className="w-12 h-12 opacity-50" />
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Used: {formatPeso(totalExpenses)}</span>
            <span>{percentageUsed.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                percentageUsed > 100 ? 'bg-red-500' : percentageUsed > 80 ? 'bg-yellow-400' : 'bg-white'
              }`}
              style={{ width: `${Math.min(percentageUsed, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-sm">
            <span>Remaining: {formatPeso(remaining)}</span>
            <span>{stats?.expenseCount || 0} expenses</span>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {stats && (
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-400" />
            Expenses by Category
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(stats.byCategory).map(([category, amount]) => (
              <div
                key={category}
                className="bg-gray-900/50 rounded-lg p-3 border border-gray-700"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`${getCategoryColor(category)} p-2 rounded-lg`}>
                    {getCategoryIcon(category)}
                  </div>
                  <span className="text-xs text-gray-400 capitalize">{category}</span>
                </div>
                <p className="text-white font-semibold">{formatPeso(amount as number)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Expense Button */}
      <Button
        onClick={() => setShowAddForm(!showAddForm)}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
      >
        <Plus className="w-5 h-5 mr-2" />
        Add Expense
      </Button>

      {/* Add Expense Form */}
      {showAddForm && (
        <div className="bg-gray-800/50 rounded-xl p-6 border border-emerald-500/30">
          <h4 className="text-white font-semibold mb-4">New Expense</h4>
          <form onSubmit={handleAddExpense} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description *
              </label>
              <input
                type="text"
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="e.g., Cement bags, Labor wages"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Amount (₱) *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="materials">Materials</option>
                  <option value="labor">Labor</option>
                  <option value="equipment">Equipment</option>
                  <option value="transportation">Transportation</option>
                  <option value="permits">Permits</option>
                  <option value="utilities">Utilities</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Date *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                placeholder="Additional notes..."
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Add Expense
              </Button>
              <Button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Expenses List */}
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <h4 className="text-white font-semibold mb-4">Expense History</h4>
        
        {!expenses || expenses.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No expenses recorded yet</p>
            <p className="text-sm mt-1">Click "Add Expense" to track spending</p>
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map((expense) => (
              <div
                key={expense._id}
                className="bg-gray-900/50 rounded-lg p-4 border border-gray-700 hover:border-emerald-500/50 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`${getCategoryColor(expense.category)} p-2 rounded-lg`}>
                        {getCategoryIcon(expense.category)}
                      </div>
                      <div>
                        <h5 className="text-white font-medium">{expense.description}</h5>
                        <p className="text-sm text-gray-400 capitalize">{expense.category}</p>
                      </div>
                    </div>
                    
                    {expense.notes && (
                      <p className="text-sm text-gray-400 mt-2 ml-12">{expense.notes}</p>
                    )}
                    
                    <div className="flex items-center gap-4 mt-3 ml-12 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(expense.date).toLocaleDateString()}
                      </span>
                      {expense.createdBy && (
                        <span>Added by {expense.createdBy.name}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xl font-bold text-emerald-400">
                        {formatPeso(expense.amount)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleDeleteExpense(expense._id)}
                      className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
