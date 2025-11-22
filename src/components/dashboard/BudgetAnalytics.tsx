"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  Wallet,
  PieChart
} from "lucide-react";

export function BudgetAnalytics() {
  const budgets = useQuery(api.projectBudget.getAllBudgets, {});
  const analytics = useQuery(api.projectBudget.getBudgetAnalytics, {});

  if (!budgets || !analytics) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading budget analytics...
        </CardContent>
      </Card>
    );
  }

  const healthPercentage = analytics.projectCount > 0
    ? (analytics.statusCounts.healthy / analytics.projectCount) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {analytics.currency} {analytics.totalBudgeted.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Across {analytics.projectCount} projects
                </p>
              </div>
              <Wallet className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {analytics.currency} {analytics.totalSpent.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics.avgUtilization.toFixed(1)}% average utilization
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Remaining
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {analytics.currency} {analytics.totalRemaining.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Available for allocation
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Budget Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {healthPercentage.toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics.statusCounts.healthy} healthy projects
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Budget Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-700">Healthy</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-700">
                {analytics.statusCounts.healthy}
              </p>
              <p className="text-xs text-green-600 mt-1">
                Under 75% spent
              </p>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-yellow-700">Warning</span>
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </div>
              <p className="text-2xl font-bold text-yellow-700">
                {analytics.statusCounts.warning}
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                75-90% spent
              </p>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-orange-700">Critical</span>
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-orange-700">
                {analytics.statusCounts.critical}
              </p>
              <p className="text-xs text-orange-600 mt-1">
                90-100% spent
              </p>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-red-700">Exceeded</span>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-700">
                {analytics.statusCounts.exceeded}
              </p>
              <p className="text-xs text-red-600 mt-1">
                Over budget
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Budget List */}
      <Card>
        <CardHeader>
          <CardTitle>Project Budget Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {budgets.slice(0, 10).map((budget: any) => (
              <div key={budget._id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium">{budget.projectName}</h4>
                    <Badge
                      variant="outline"
                      className={
                        budget.status === "healthy"
                          ? "bg-green-50 text-green-700"
                          : budget.status === "warning"
                          ? "bg-yellow-50 text-yellow-700"
                          : budget.status === "critical"
                          ? "bg-orange-50 text-orange-700"
                          : "bg-red-50 text-red-700"
                      }
                    >
                      {budget.status}
                    </Badge>
                  </div>
                  <span className="text-sm font-semibold">
                    {budget.utilization.toFixed(1)}%
                  </span>
                </div>
                <Progress value={Math.min(budget.utilization, 100)} />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>
                    Spent: {budget.currency} {budget.spent.toLocaleString()}
                  </span>
                  <span>
                    Budget: {budget.currency} {budget.totalBudget.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
