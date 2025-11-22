"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  GitCompare,
  User,
  Clock,
  X,
  ArrowRight,
  FileText,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useMemo } from "react";

interface DiffViewerProps {
  version1Id: Id<"documentVersions">;
  version2Id: Id<"documentVersions">;
  onClose?: () => void;
}

export function DiffViewer({ version1Id, version2Id, onClose }: DiffViewerProps) {
  const comparison = useQuery(api.documentVersions.compareVersions, {
    versionId1: version1Id,
    versionId2: version2Id,
  });

  // Simple diff algorithm (line-by-line comparison)
  const diff = useMemo(() => {
    if (!comparison) return null;

    const lines1 = comparison.version1.content.split("\n");
    const lines2 = comparison.version2.content.split("\n");

    const maxLines = Math.max(lines1.length, lines2.length);
    const diffLines: Array<{
      line1: string;
      line2: string;
      status: "same" | "modified" | "added" | "removed";
      lineNumber: number;
    }> = [];

    for (let i = 0; i < maxLines; i++) {
      const line1 = lines1[i] || "";
      const line2 = lines2[i] || "";

      let status: "same" | "modified" | "added" | "removed";
      if (!line1 && line2) {
        status = "added";
      } else if (line1 && !line2) {
        status = "removed";
      } else if (line1 !== line2) {
        status = "modified";
      } else {
        status = "same";
      }

      diffLines.push({
        line1,
        line2,
        status,
        lineNumber: i + 1,
      });
    }

    return diffLines;
  }, [comparison]);

  if (!comparison || !diff) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  const stats = {
    added: diff.filter((d) => d.status === "added").length,
    removed: diff.filter((d) => d.status === "removed").length,
    modified: diff.filter((d) => d.status === "modified").length,
    unchanged: diff.filter((d) => d.status === "same").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gray-800/50 border-gray-700/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <GitCompare className="w-5 h-5 text-emerald-500" />
              Version Comparison
            </CardTitle>
            {onClose && (
              <Button
                size="sm"
                variant="outline"
                onClick={onClose}
                className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Version 1 Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-bold">
                  v{comparison.version1.versionNumber}
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold">{comparison.version1.title}</h3>
                  {comparison.version1.createdByUser && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-400">
                      <User className="w-3.5 h-3.5" />
                      <span>{comparison.version1.createdByUser.name}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-400">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {formatDistanceToNow(comparison.version1.createdAt, { addSuffix: true })}
                </span>
              </div>
              {comparison.version1.changeDescription && (
                <p className="text-sm text-gray-400 italic">
                  "{comparison.version1.changeDescription}"
                </p>
              )}
            </div>

            {/* Arrow */}
            <div className="hidden md:flex items-center justify-center">
              <ArrowRight className="w-8 h-8 text-emerald-500" />
            </div>

            {/* Version 2 Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold">
                  v{comparison.version2.versionNumber}
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold">{comparison.version2.title}</h3>
                  {comparison.version2.createdByUser && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-400">
                      <User className="w-3.5 h-3.5" />
                      <span>{comparison.version2.createdByUser.name}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-400">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {formatDistanceToNow(comparison.version2.createdAt, { addSuffix: true })}
                </span>
              </div>
              {comparison.version2.changeDescription && (
                <p className="text-sm text-gray-400 italic">
                  "{comparison.version2.changeDescription}"
                </p>
              )}
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-4 gap-3 mt-6 pt-6 border-t border-gray-700">
            <div className="text-center p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-xl font-bold text-green-400">{stats.added}</p>
              <p className="text-xs text-green-300 mt-1">Added</p>
            </div>
            <div className="text-center p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-xl font-bold text-red-400">{stats.removed}</p>
              <p className="text-xs text-red-300 mt-1">Removed</p>
            </div>
            <div className="text-center p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-xl font-bold text-yellow-400">{stats.modified}</p>
              <p className="text-xs text-yellow-300 mt-1">Modified</p>
            </div>
            <div className="text-center p-3 bg-gray-700/50 border border-gray-600/30 rounded-lg">
              <p className="text-xl font-bold text-gray-400">{stats.unchanged}</p>
              <p className="text-xs text-gray-400 mt-1">Unchanged</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Diff View */}
      <Card className="bg-gray-800/50 border-gray-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <FileText className="w-5 h-5 text-blue-500" />
            Content Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Old Version (Left) */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-700">
                <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                  Version {comparison.version1.versionNumber}
                </Badge>
              </div>
              <div className="font-mono text-sm space-y-1 bg-gray-900/50 rounded-lg p-4 max-h-[600px] overflow-auto">
                {diff.map((line, idx) => {
                  if (line.status === "added") return null;
                  return (
                    <div
                      key={idx}
                      className={`flex gap-2 px-2 py-1 rounded ${
                        line.status === "removed"
                          ? "bg-red-500/20 text-red-300"
                          : line.status === "modified"
                          ? "bg-yellow-500/20 text-yellow-300"
                          : "text-gray-400"
                      }`}
                    >
                      <span className="text-gray-600 select-none w-8 text-right flex-shrink-0">
                        {line.lineNumber}
                      </span>
                      <span className="flex-1 whitespace-pre-wrap break-all">
                        {line.status === "removed" && (
                          <XCircle className="w-3 h-3 inline mr-1" />
                        )}
                        {line.line1 || " "}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* New Version (Right) */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-700">
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                  Version {comparison.version2.versionNumber}
                </Badge>
              </div>
              <div className="font-mono text-sm space-y-1 bg-gray-900/50 rounded-lg p-4 max-h-[600px] overflow-auto">
                {diff.map((line, idx) => {
                  if (line.status === "removed") return null;
                  return (
                    <div
                      key={idx}
                      className={`flex gap-2 px-2 py-1 rounded ${
                        line.status === "added"
                          ? "bg-green-500/20 text-green-300"
                          : line.status === "modified"
                          ? "bg-yellow-500/20 text-yellow-300"
                          : "text-gray-400"
                      }`}
                    >
                      <span className="text-gray-600 select-none w-8 text-right flex-shrink-0">
                        {line.lineNumber}
                      </span>
                      <span className="flex-1 whitespace-pre-wrap break-all">
                        {line.status === "added" && (
                          <CheckCircle className="w-3 h-3 inline mr-1" />
                        )}
                        {line.line2 || " "}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-gray-700">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-green-500/20 border border-green-500/30 rounded" />
              <span className="text-gray-400">Added</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-red-500/20 border border-red-500/30 rounded" />
              <span className="text-gray-400">Removed</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-yellow-500/20 border border-yellow-500/30 rounded" />
              <span className="text-gray-400">Modified</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-gray-700/50 border border-gray-600/30 rounded" />
              <span className="text-gray-400">Unchanged</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
