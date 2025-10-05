import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

interface BudgetOverviewProps {
  totalBudget: number;
  completedBudget: number;
}

export function BudgetOverview({ totalBudget, completedBudget }: BudgetOverviewProps) {
  const utilizationRate = totalBudget > 0 ? ((completedBudget / totalBudget) * 100).toFixed(1) : 0;

  return (
    <Card className="bg-white/5 backdrop-blur-md border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-500" />
          Budget Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-300 text-sm">Total Budget</span>
            <span className="text-white font-bold text-lg">₱{totalBudget.toLocaleString()}</span>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-300 text-sm">Completed Projects Budget</span>
            <span className="text-emerald-400 font-semibold">₱{completedBudget.toLocaleString()}</span>
          </div>
          <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all duration-500"
              style={{ width: `${utilizationRate}%` }}
            ></div>
          </div>
        </div>
        <div className="pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-gray-300 text-sm">Budget Utilization</span>
            <span className="text-white font-semibold">{utilizationRate}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
