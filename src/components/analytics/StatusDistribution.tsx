import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart } from "lucide-react";

interface StatusItem {
  status: string;
  count: number;
  color: string;
  percentage: string;
}

interface StatusDistributionProps {
  data: StatusItem[];
}

export function StatusDistribution({ data }: StatusDistributionProps) {
  return (
    <Card className="bg-white/5 backdrop-blur-md border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <PieChart className="w-5 h-5 text-emerald-500" />
          Project Status Distribution
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map((item) => (
          <div key={item.status}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300 text-sm">{item.status}</span>
              <span className="text-white font-semibold">{item.count} ({item.percentage}%)</span>
            </div>
            <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${item.color} transition-all duration-500`}
                style={{ width: `${item.percentage}%` }}
              ></div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
