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
    <div className="space-y-6 pb-6">
      {/* Modern Budget Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Budget Card */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl shadow-emerald-500/20 border border-emerald-400/20">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm font-medium opacity-90 mb-1">Total Budget</p>
              <h3 className="text-3xl font-bold tracking-tight">{formatPeso(projectBudget)}</h3>
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm opacity-90">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span>Allocated funds</span>
          </div>
        </div>

        {/* Spent Card */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-500/20 border border-blue-400/20">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm font-medium opacity-90 mb-1">Total Spent</p>
              <h3 className="text-3xl font-bold tracking-tight">{formatPeso(totalExpenses)}</h3>
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              {percentageUsed > 100 ? (
                <TrendingDown className="w-6 h-6" />
              ) : (
                <TrendingUp className="w-6 h-6" />
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm opacity-90">
            <span>{percentageUsed.toFixed(1)}% of budget</span>
          </div>
        </div>

        {/* Remaining Card */}
        <div className={`rounded-2xl p-6 text-white shadow-xl border ${
          remaining < 0 
            ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/20 border-red-400/20' 
            : remaining < projectBudget * 0.2
            ? 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-orange-500/20 border-orange-400/20'
            : 'bg-gradient-to-br from-purple-500 to-purple-600 shadow-purple-500/20 border-purple-400/20'
        }`}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm font-medium opacity-90 mb-1">
                {remaining < 0 ? 'Over Budget' : 'Remaining'}
              </p>
              <h3 className="text-3xl font-bold tracking-tight">{formatPeso(Math.abs(remaining))}</h3>
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              {remaining < 0 ? (
                <TrendingDown className="w-6 h-6" />
              ) : (
                <DollarSign className="w-6 h-6" />
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm opacity-90">
            <span>{stats?.expenseCount || 0} expenses logged</span>
          </div>
        </div>
      </div>

      {/* Modern Progress Bar */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-white font-semibold flex items-center gap-2">
            <div className="w-1.5 h-6 bg-gradient-to-b from-emerald-400 to-blue-500 rounded-full" />
            Budget Usage
          </h4>
          <span className={`text-2xl font-bold ${
            percentageUsed > 100 ? 'text-red-400' : 
            percentageUsed > 80 ? 'text-orange-400' : 
            'text-emerald-400'
          }`}>
            {percentageUsed.toFixed(1)}%
          </span>
        </div>
        
        <div className="relative">
          <div className="w-full bg-gray-700/50 rounded-full h-6 overflow-hidden border border-gray-600/50">
            <div
              className={`h-full transition-all duration-700 ease-out relative overflow-hidden ${
                percentageUsed > 100 
                  ? 'bg-gradient-to-r from-red-500 to-red-600' 
                  : percentageUsed > 80 
                  ? 'bg-gradient-to-r from-orange-400 to-orange-500' 
                  : 'bg-gradient-to-r from-emerald-400 to-blue-500'
              }`}
              style={{ width: `${Math.min(percentageUsed, 100)}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>
          {percentageUsed > 100 && (
            <div className="mt-3 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-300 text-sm flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                <span className="font-medium">Warning:</span> Project is over budget by {formatPeso(Math.abs(remaining))}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modern Category Breakdown */}
      {stats && Object.keys(stats.byCategory).length > 0 && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-white font-semibold flex items-center gap-2">
              <div className="w-1.5 h-6 bg-gradient-to-b from-purple-400 to-pink-500 rounded-full" />
              Spending by Category
            </h4>
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
              {Object.keys(stats.byCategory).length} categories
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Object.entries(stats.byCategory)
              .sort(([,a], [,b]) => (b as number) - (a as number))
              .map(([category, amount]) => {
                const percentage = projectBudget > 0 ? ((amount as number) / projectBudget * 100).toFixed(1) : '0.0';
                return (
                  <div
                    key={category}
                    className="group bg-gradient-to-br from-gray-900/80 to-gray-800/80 rounded-xl p-4 border border-gray-700/50 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-0.5"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`${getCategoryColor(category)} p-2.5 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        {getCategoryIcon(category)}
                      </div>
                      <span className="text-xs font-medium text-gray-400 capitalize bg-gray-700/50 px-2 py-1 rounded-lg">
                        {percentage}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 capitalize mb-1">{category}</p>
                    <p className="text-lg font-bold text-white tracking-tight">{formatPeso(amount as number)}</p>
                    <div className="mt-2 w-full bg-gray-700/50 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full ${getCategoryColor(category)} transition-all duration-700`}
                        style={{ width: `${Math.min(parseFloat(percentage), 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
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

      {/* Modern Expenses List */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-white font-semibold flex items-center gap-2">
            <div className="w-1.5 h-6 bg-gradient-to-b from-blue-400 to-cyan-500 rounded-full" />
            Recent Expenses
          </h4>
          {expenses && expenses.length > 0 && (
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
              {expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'}
            </Badge>
          )}
        </div>
        
        {!expenses || expenses.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gray-700/30 border border-gray-600/50 mb-4">
              <DollarSign className="w-10 h-10 text-gray-500" />
            </div>
            <h5 className="text-lg font-semibold text-gray-400 mb-1">No expenses yet</h5>
            <p className="text-sm text-gray-500">Start tracking your project spending by adding expenses</p>
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.slice(0).reverse().map((expense, index) => (
              <div
                key={expense._id}
                className="group bg-gradient-to-br from-gray-900/60 to-gray-800/60 rounded-xl p-4 border border-gray-700/50 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-4">
                  {/* Category Icon */}
                  <div className={`${getCategoryColor(expense.category)} p-3 rounded-xl shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                    {getCategoryIcon(expense.category)}
                  </div>

                  {/* Expense Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <h5 className="text-white font-semibold text-base mb-1 truncate">{expense.description}</h5>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-xs font-medium text-gray-400 capitalize bg-gray-700/50 px-2 py-1 rounded-lg">
                            {expense.category}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(expense.date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </span>
                          {expense.createdBy && (
                            <span className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Users className="w-3.5 h-3.5" />
                              {expense.createdBy.name}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Amount */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                          {formatPeso(expense.amount)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Notes */}
                    {expense.notes && (
                      <div className="mt-3 p-3 bg-gray-700/30 border border-gray-600/30 rounded-lg">
                        <p className="text-sm text-gray-400 leading-relaxed">{expense.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Delete Button */}
                  <Button
                    size="sm"
                    onClick={() => handleDeleteExpense(expense._id)}
                    className="flex-shrink-0 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 hover:border-red-500/50 transition-all duration-300 opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
