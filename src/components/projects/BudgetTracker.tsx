"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Settings,
  Wallet
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface BudgetTrackerProps {
  projectId: Id<"projects">;
}

export function BudgetTracker({ projectId }: BudgetTrackerProps) {
  const budget = useQuery(api.projectBudget.getBudget, { projectId });
  const setBudget = useMutation(api.projectBudget.setBudget);
  
  const [isSettingBudget, setIsSettingBudget] = useState(false);
  const [totalBudget, setTotalBudget] = useState("");
  const currency = "PHP"; // Always PHP

  const handleSetBudget = async () => {
    if (!totalBudget || parseFloat(totalBudget) <= 0) return;
    
    await setBudget({
      projectId,
      totalBudget: parseFloat(totalBudget),
      currency: "PHP",
      alertThresholds: [75, 90, 100],
    });
    
    setIsSettingBudget(false);
    setTotalBudget("");
  };

  if (!budget) {
    return (
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader className="border-b border-gray-800/50">
          <CardTitle className="flex items-center gap-2 text-white">
            <Wallet className="h-5 w-5 text-emerald-400" />
            Project Budget
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800/50 flex items-center justify-center">
              <DollarSign className="h-8 w-8 text-gray-600" />
            </div>
            <p className="text-gray-400 mb-6 text-lg">No budget set for this project</p>
            <Dialog open={isSettingBudget} onOpenChange={setIsSettingBudget}>
              <DialogTrigger asChild>
                <Button>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Set Budget
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-800">
                <DialogHeader>
                  <DialogTitle className="text-white">Set Project Budget</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Define the total budget for this project. You'll receive alerts at 75%, 90%, and 100% utilization.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Currency</p>
                    <p className="text-white font-semibold">₱ Philippine Peso (PHP)</p>
                  </div>
                  <div>
                    <Label htmlFor="budget" className="text-gray-300">Total Budget</Label>
                    <Input
                      id="budget"
                      type="number"
                      value={totalBudget}
                      onChange={(e) => setTotalBudget(e.target.value)}
                      placeholder="100000"
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <Button onClick={handleSetBudget} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Set Budget
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-emerald-300 bg-emerald-500/20 border-emerald-500/30";
      case "warning":
        return "text-yellow-300 bg-yellow-500/20 border-yellow-500/30";
      case "critical":
        return "text-orange-300 bg-orange-500/20 border-orange-500/30";
      case "exceeded":
        return "text-red-300 bg-red-500/20 border-red-500/30";
      default:
        return "text-gray-300 bg-gray-500/20 border-gray-500/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-4 w-4" />;
      case "warning":
      case "critical":
        return <AlertTriangle className="h-4 w-4" />;
      case "exceeded":
        return <TrendingUp className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader className="border-b border-gray-800/50">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Wallet className="h-5 w-5 text-emerald-400" />
            Budget Overview
          </div>
          <Dialog open={isSettingBudget} onOpenChange={setIsSettingBudget}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Update
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-800">
              <DialogHeader>
                <DialogTitle className="text-white">Update Project Budget</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Modify the total budget for this project.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Currency</p>
                  <p className="text-white font-semibold">₱ Philippine Peso (PHP)</p>
                  <p className="text-xs text-gray-500 mt-1">Currency is locked to PHP for all projects</p>
                </div>
                <div>
                  <Label htmlFor="budget" className="text-gray-300">Total Budget</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={totalBudget}
                    onChange={(e) => setTotalBudget(e.target.value)}
                    placeholder={budget.totalBudget.toString()}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <Button onClick={handleSetBudget} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Settings className="h-4 w-4 mr-2" />
                  Update Budget
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Badge */}
        <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
          <Badge variant="outline" className={`${getStatusColor(budget.status)} px-3 py-1`}>
            {getStatusIcon(budget.status)}
            <span className="ml-2 capitalize font-semibold">{budget.status}</span>
          </Badge>
          <div className="text-right">
            <p className="text-xs text-gray-400 mb-1">Utilization</p>
            <span className="text-3xl font-bold text-white">
              {budget.utilization.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-3 p-4 bg-gray-800/30 rounded-lg">
          <Progress value={Math.min(budget.utilization, 100)} className="h-3" />
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Spent: <span className="text-red-400 font-semibold">{budget.currency} {budget.spent.toLocaleString()}</span></span>
            <span className="text-gray-400">Budget: <span className="text-emerald-400 font-semibold">{budget.currency} {budget.totalBudget.toLocaleString()}</span></span>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <p className="text-xs text-emerald-300 mb-2 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Remaining
            </p>
            <p className="text-2xl font-bold text-emerald-400">
              {budget.currency} {budget.remaining.toLocaleString()}
            </p>
          </div>
          <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
            <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Total Spent
            </p>
            <p className="text-2xl font-bold text-white">
              {budget.currency} {budget.spent.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Alerts */}
        {budget.alerts && budget.alerts.length > 0 && (
          <div className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg">
            <h4 className="text-sm font-semibold mb-3 text-white flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-400" />
              Budget Alerts
            </h4>
            <div className="space-y-2">
              {budget.alerts.map((alert: any) => (
                <div
                  key={alert.threshold}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    alert.triggered
                      ? "bg-orange-500/10 border-orange-500/30 text-orange-300"
                      : "bg-gray-800/50 border-gray-700 text-gray-400"
                  }`}
                >
                  <span className="text-sm font-medium">{alert.threshold}% Threshold</span>
                  {alert.triggered ? (
                    <Badge variant="outline" className="text-xs bg-orange-500/20 text-orange-300 border-orange-500/30">
                      {alert.sent ? "✓ Notified" : "⚠ Triggered"}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs bg-gray-700/50 text-gray-500 border-gray-600">
                      ○ Not triggered
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
