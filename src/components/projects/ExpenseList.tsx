"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Receipt, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ExternalLink,
  Filter
} from "lucide-react";
import { toast } from "sonner";
import { formatDistance } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ExpenseListProps {
  projectId: Id<"projects">;
  currentUser?: any;
}

export function ExpenseList({ projectId, currentUser }: ExpenseListProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const expenses = useQuery(api.projectExpenses.getProjectExpenses, {
    projectId,
    status: statusFilter === "all" ? undefined : statusFilter,
  });
  const summary = useQuery(api.projectExpenses.getExpenseSummary, { projectId });
  
  const approveExpense = useMutation(api.projectExpenses.approveExpense);
  const rejectExpense = useMutation(api.projectExpenses.rejectExpense);
  
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleApprove = async (expenseId: Id<"projectExpenses">) => {
    if (!canApprove) {
      toast.error("Only Admin and Captain can approve expenses");
      return;
    }

    setLoading(true);
    try {
      await approveExpense({ expenseId });
      toast.success("Expense approved");
      setSelectedExpense(null);
    } catch (error) {
      toast.error("Failed to approve expense");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Permission check: Only Admin, Captain (Manager) can approve/reject
  const canApprove = 
    currentUser?.userLevel?.name === "ADMIN" ||
    currentUser?.userLevel?.name === "MANAGER";

  const handleReject = async () => {
    if (!canApprove) {
      toast.error("Only Admin and Captain can reject expenses");
      return;
    }

    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    
    setLoading(true);
    try {
      await rejectExpense({
        expenseId: selectedExpense._id,
        reason: rejectReason.trim(),
      });
      toast.success("Expense rejected");
      setSelectedExpense(null);
      setRejectReason("");
    } catch (error) {
      toast.error("Failed to reject expense");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return null;
    }
  };

  if (!expenses || !summary) {
    return (
      <Card className="bg-gray-900/50 border-gray-800">
        <CardContent className="py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-3" />
          <p className="text-gray-400">Loading expenses...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader className="border-b border-gray-800/50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <Receipt className="h-5 w-5 text-blue-400" />
              Project Expenses
            </CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px] bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all" className="text-white">All ({summary.total})</SelectItem>
                  <SelectItem value="pending" className="text-yellow-300">Pending ({summary.pending})</SelectItem>
                  <SelectItem value="approved" className="text-emerald-300">Approved ({summary.approved})</SelectItem>
                  <SelectItem value="rejected" className="text-red-300">Rejected ({summary.rejected})</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-lg">
              <p className="text-xs text-emerald-300 mb-1 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Total Approved
              </p>
              <p className="text-2xl font-bold text-emerald-400">
                ₱{summary.totalApproved.toLocaleString()}
              </p>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg">
              <p className="text-xs text-yellow-300 mb-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Pending
              </p>
              <p className="text-2xl font-bold text-yellow-400">
                ₱{summary.totalPending.toLocaleString()}
              </p>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg">
              <p className="text-xs text-blue-300 mb-1 flex items-center gap-1">
                <Receipt className="h-3 w-3" />
                Total Submitted
              </p>
              <p className="text-2xl font-bold text-blue-400">
                {summary.total}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">
                No expenses {statusFilter !== "all" && `with status: ${statusFilter}`}
              </p>
            </div>
          ) : (
            <div className="border border-gray-800 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-800/50 border-b border-gray-700 hover:bg-gray-800/50">
                  <TableHead className="text-gray-300 font-semibold">Date</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Category</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Description</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Amount</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Submitted By</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Status</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense: any) => (
                  <TableRow key={expense._id} className="border-b border-gray-800 hover:bg-gray-800/30">
                    <TableCell className="text-sm text-gray-400">
                      {formatDistance(new Date(expense.expenseDate), new Date(), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize bg-gray-800 border-gray-700 text-gray-300">
                        {expense.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="truncate text-white">{expense.description}</p>
                      {expense.vendor && (
                        <p className="text-xs text-gray-500">
                          Vendor: <span className="text-gray-400">{expense.vendor}</span>
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="font-bold text-white">
                      ₱{expense.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-gray-300">{expense.submitterName}</TableCell>
                    <TableCell>{getStatusBadge(expense.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {expense.status === "pending" && canApprove && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                              onClick={() => handleApprove(expense._id)}
                              disabled={loading}
                              title="Approve expense"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                              onClick={() => setSelectedExpense(expense)}
                              disabled={loading}
                              title="Reject expense"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {expense.status === "pending" && !canApprove && (
                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-300 border-yellow-500/30 text-xs">
                            Awaiting Approval
                          </Badge>
                        )}
                        {expense.receiptUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                            asChild
                          >
                            <a
                              href={expense.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog
        open={selectedExpense !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedExpense(null);
            setRejectReason("");
          }
        }}
      >
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-400" />
              Reject Expense
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Please provide a reason for rejecting this expense.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection..."
                rows={4}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                onClick={() => {
                  setSelectedExpense(null);
                  setRejectReason("");
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={handleReject}
                disabled={loading}
              >
                <XCircle className="h-4 w-4 mr-2" />
                {loading ? "Rejecting..." : "Reject Expense"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
