"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Clock,
  User,
  FileText,
  RotateCcw,
  GitCompare,
  History,
  CheckCircle,
  Edit,
  Save,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface VersionHistoryProps {
  documentId: Id<"documents">;
  onCompare?: (version1Id: Id<"documentVersions">, version2Id: Id<"documentVersions">) => void;
}

export function VersionHistory({ documentId, onCompare }: VersionHistoryProps) {
  const versions = useQuery(api.documentVersions.getVersionHistory, { documentId });
  const stats = useQuery(api.documentVersions.getVersionStats, { documentId });
  const restoreVersion = useMutation(api.documentVersions.restoreVersion);

  const [selectedVersions, setSelectedVersions] = useState<Id<"documentVersions">[]>([]);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestore = async (versionId: Id<"documentVersions">, versionNumber: number) => {
    if (!confirm(`Are you sure you want to restore version ${versionNumber}? This will create a new version with the old content.`)) {
      return;
    }

    setIsRestoring(true);
    try {
      await restoreVersion({
        versionId,
        changeDescription: `Restored from version ${versionNumber}`,
      });
      toast.success(`Version ${versionNumber} restored successfully!`);
    } catch (error) {
      toast.error("Failed to restore version");
      console.error(error);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleSelectVersion = (versionId: Id<"documentVersions">) => {
    if (selectedVersions.includes(versionId)) {
      setSelectedVersions(selectedVersions.filter((id) => id !== versionId));
    } else if (selectedVersions.length < 2) {
      setSelectedVersions([...selectedVersions, versionId]);
    } else {
      // Replace oldest selection
      setSelectedVersions([selectedVersions[1], versionId]);
    }
  };

  const handleCompare = () => {
    if (selectedVersions.length === 2 && onCompare) {
      onCompare(selectedVersions[0], selectedVersions[1]);
      setSelectedVersions([]);
    }
  };

  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType) {
      case "created":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "updated":
        return <Edit className="w-4 h-4 text-blue-500" />;
      case "restored":
        return <RotateCcw className="w-4 h-4 text-purple-500" />;
      case "auto_save":
        return <Save className="w-4 h-4 text-gray-500" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getChangeTypeBadge = (changeType: string) => {
    const styles = {
      created: "bg-green-500/20 text-green-300 border-green-500/30",
      updated: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      restored: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      auto_save: "bg-gray-500/20 text-gray-300 border-gray-500/30",
    };
    return styles[changeType as keyof typeof styles] || "bg-gray-500/20 text-gray-300";
  };

  if (!versions) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Header */}
      {stats && (
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <History className="w-5 h-5 text-emerald-500" />
              Version History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-900/50 rounded-lg">
                <p className="text-2xl font-bold text-emerald-400">{stats.totalVersions}</p>
                <p className="text-xs text-gray-400 mt-1">Total Versions</p>
              </div>
              <div className="text-center p-3 bg-gray-900/50 rounded-lg">
                <p className="text-2xl font-bold text-blue-400">{stats.latestVersionNumber}</p>
                <p className="text-xs text-gray-400 mt-1">Current Version</p>
              </div>
              <div className="text-center p-3 bg-gray-900/50 rounded-lg">
                <p className="text-2xl font-bold text-purple-400">{stats.contributors}</p>
                <p className="text-xs text-gray-400 mt-1">Contributors</p>
              </div>
              <div className="text-center p-3 bg-gray-900/50 rounded-lg">
                <p className="text-2xl font-bold text-orange-400">
                  {stats.changeTypes.updated || 0}
                </p>
                <p className="text-xs text-gray-400 mt-1">Updates</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compare Button */}
      {selectedVersions.length === 2 && (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
          <AlertCircle className="w-5 h-5 text-emerald-400" />
          <p className="text-sm text-emerald-300 flex-1">
            2 versions selected. Click compare to see differences.
          </p>
          <Button
            onClick={handleCompare}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <GitCompare className="w-4 h-4 mr-2" />
            Compare Versions
          </Button>
        </div>
      )}

      {/* Version Timeline */}
      <div className="space-y-3">
        {versions.map((version, index) => {
          const isSelected = selectedVersions.includes(version._id);
          const isCurrent = version.isCurrentVersion;

          return (
            <Card
              key={version._id}
              className={`bg-gray-800/50 border transition-all duration-200 ${
                isSelected
                  ? "border-emerald-500 shadow-lg shadow-emerald-500/20"
                  : "border-gray-700/50 hover:border-gray-600"
              } ${isCurrent ? "ring-2 ring-blue-500/50" : ""}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Version Number Badge */}
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                      isCurrent
                        ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                        : "bg-gray-700 text-gray-300"
                    }`}
                  >
                    v{version.versionNumber}
                  </div>

                  {/* Version Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h4 className="text-white font-semibold truncate">
                          {version.title}
                        </h4>
                        {version.changeDescription && (
                          <p className="text-sm text-gray-400 mt-1">
                            {version.changeDescription}
                          </p>
                        )}
                      </div>
                      {isCurrent && (
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 flex-shrink-0">
                          Current
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 flex-wrap text-sm text-gray-400">
                      <div className="flex items-center gap-1.5">
                        {getChangeTypeIcon(version.changeType)}
                        <Badge
                          variant="outline"
                          className={`${getChangeTypeBadge(version.changeType)} capitalize`}
                        >
                          {version.changeType.replace("_", " ")}
                        </Badge>
                      </div>

                      {version.createdByUser && (
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />
                          <span>{version.createdByUser.name}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {formatDistanceToNow(version.createdAt, { addSuffix: true })}
                        </span>
                      </div>

                      {version.fileSize && (
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          <span>{(version.fileSize / 1024).toFixed(1)} KB</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Select for Compare */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSelectVersion(version._id)}
                      className={`${
                        isSelected
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500"
                          : "bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600"
                      }`}
                    >
                      <GitCompare className="w-4 h-4" />
                    </Button>

                    {/* Restore Button (not for current version) */}
                    {!isCurrent && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border-purple-500/30"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-gray-900 border-gray-700">
                          <DialogHeader>
                            <DialogTitle className="text-white">
                              Restore Version {version.versionNumber}?
                            </DialogTitle>
                            <DialogDescription className="text-gray-400">
                              This will create a new version with the content from version{" "}
                              {version.versionNumber}. The current version will be preserved in
                              history.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex gap-3 mt-4">
                            <Button
                              onClick={() => handleRestore(version._id, version.versionNumber)}
                              disabled={isRestoring}
                              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                            >
                              <RotateCcw className="w-4 h-4 mr-2" />
                              {isRestoring ? "Restoring..." : "Restore"}
                            </Button>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white"
                              >
                                Cancel
                              </Button>
                            </DialogTrigger>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {versions.length === 0 && (
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardContent className="py-12 text-center">
            <History className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-400 mb-2">No Version History</h3>
            <p className="text-sm text-gray-500">
              This document doesn't have any version history yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
