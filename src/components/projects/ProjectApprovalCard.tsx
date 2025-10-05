"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  MessageCircle,
  Clock,
  User,
  DollarSign,
  Calendar,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProjectApprovalCardProps {
  project: any;
  currentUser: any;
  onApprovalComplete?: () => void;
}

export function ProjectApprovalCard({ project, currentUser, onApprovalComplete }: ProjectApprovalCardProps) {
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedbackFor, setShowFeedbackFor] = useState<string | null>(null);

  const reviewProject = useMutation(api.projectsEnhanced.reviewProject);

  const handleReview = async (action: "approve" | "reject" | "request_revision") => {
    if (action !== "approve" && !feedback.trim()) {
      alert(`Please provide ${action === "reject" ? "rejection reason" : "revision notes"}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await reviewProject({
        projectId: project._id,
        action,
        feedback: feedback.trim() || undefined,
      });

      setFeedback("");
      setShowFeedbackFor(null);
      onApprovalComplete?.();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to review project");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canReview = 
    currentUser.userLevel.name === "ADMIN" ||
    (currentUser.userLevel.name === "MANAGER" && project.department === currentUser.department);

  if (project.approvalStatus !== "pending") {
    return (
      <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            {project.approvalStatus === "approved" ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : project.approvalStatus === "rejected" ? (
              <XCircle className="w-5 h-5 text-red-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-500" />
            )}
            Approval Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Status:</span>
              <Badge className={`
                ${project.approvalStatus === "approved" ? "bg-green-600" : ""}
                ${project.approvalStatus === "rejected" ? "bg-red-600" : ""}
                ${project.approvalStatus === "revision_requested" ? "bg-yellow-600" : ""}
                text-white capitalize
              `}>
                {project.approvalStatus.replace("_", " ")}
              </Badge>
            </div>

            {project.approvedBy && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Reviewed by:</span>
                <span className="text-white">{project.approvedBy.name || "Manager"}</span>
              </div>
            )}

            {project.approvedAt && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Reviewed on:</span>
                <span className="text-white">
                  {new Date(project.approvedAt).toLocaleDateString()}
                </span>
              </div>
            )}

            {project.rejectionReason && (
              <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <XCircle className="w-5 h-5 text-red-400 mt-0.5" />
                  <div>
                    <h4 className="text-red-400 font-medium mb-1">Rejection Reason</h4>
                    <p className="text-gray-300 text-sm">{project.rejectionReason}</p>
                  </div>
                </div>
              </div>
            )}

            {project.revisionNotes && (
              <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <div>
                    <h4 className="text-yellow-400 font-medium mb-1">Revision Requested</h4>
                    <p className="text-gray-300 text-sm">{project.revisionNotes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-orange-900/20 to-red-900/20 border-orange-500/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-orange-400 animate-pulse" />
          Pending Approval
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Project Info Summary */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-white/5 rounded-lg">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            <div>
              <div className="text-xs text-gray-400">Created by</div>
              <div className="text-sm text-white">{project.creator?.name || "Unknown"}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div>
              <div className="text-xs text-gray-400">Submitted</div>
              <div className="text-sm text-white">
                {new Date(project.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          {project.budget && (
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <div>
                <div className="text-xs text-gray-400">Budget</div>
                <div className="text-sm text-white">₱{project.budget.toLocaleString()}</div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-400" />
            <div>
              <div className="text-xs text-gray-400">Priority</div>
              <Badge className={`text-xs ${
                project.priority === "urgent" ? "bg-red-600" :
                project.priority === "high" ? "bg-orange-600" :
                project.priority === "medium" ? "bg-yellow-600" :
                "bg-green-600"
              } text-white capitalize`}>
                {project.priority}
              </Badge>
            </div>
          </div>
        </div>

        {!canReview ? (
          <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
            <p className="text-blue-300 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Waiting for {project.department} manager approval
            </p>
          </div>
        ) : (
          <>
            {/* Action Buttons */}
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <Button
                  onClick={() => setShowFeedbackFor("approve")}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={isSubmitting}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>

                <Button
                  onClick={() => setShowFeedbackFor("request_revision")}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  disabled={isSubmitting}
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Revise
                </Button>

                <Button
                  onClick={() => setShowFeedbackFor("reject")}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={isSubmitting}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>

              {/* Feedback Section */}
              {showFeedbackFor && (
                <div className="bg-white/5 rounded-lg p-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300">
                      {showFeedbackFor === "approve" ? "Approval notes (optional)" :
                       showFeedbackFor === "reject" ? "Rejection reason (required)" :
                       "Revision notes (required)"}
                    </span>
                  </div>

                  <Textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder={
                      showFeedbackFor === "approve" ? "Add any notes or congratulations..." :
                      showFeedbackFor === "reject" ? "Explain why this project is being rejected..." :
                      "Describe what needs to be revised..."
                    }
                    rows={3}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleReview(showFeedbackFor as any)}
                      disabled={isSubmitting || (showFeedbackFor !== "approve" && !feedback.trim())}
                      className={`flex-1 ${
                        showFeedbackFor === "approve" ? "bg-green-600 hover:bg-green-700" :
                        showFeedbackFor === "reject" ? "bg-red-600 hover:bg-red-700" :
                        "bg-yellow-600 hover:bg-yellow-700"
                      } text-white`}
                    >
                      {isSubmitting ? "Processing..." : `Confirm ${showFeedbackFor === "request_revision" ? "Revision Request" : showFeedbackFor.charAt(0).toUpperCase() + showFeedbackFor.slice(1)}`}
                    </Button>

                    <Button
                      onClick={() => {
                        setShowFeedbackFor(null);
                        setFeedback("");
                      }}
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-white/10"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3">
              <p className="text-blue-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-3 h-3" />
                Review carefully. Your decision will notify the project creator immediately.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
