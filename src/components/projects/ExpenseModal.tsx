"use client";

import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Receipt, Upload, X, FileText, Image } from "lucide-react";
import { toast } from "sonner";

interface ExpenseModalProps {
  projectId: Id<"projects">;
  trigger?: React.ReactNode;
}

const EXPENSE_CATEGORIES = [
  { value: "supplies", label: "Supplies" },
  { value: "labor", label: "Labor" },
  { value: "equipment", label: "Equipment" },
  { value: "transportation", label: "Transportation" },
  { value: "food", label: "Food & Refreshments" },
  { value: "other", label: "Other" },
];

export function ExpenseModal({ projectId, trigger }: ExpenseModalProps) {
  const createExpense = useMutation(api.projectExpenses.createExpense);
  const generateUploadUrl = useMutation(api.documents.generateUploadUrl);
  const createDocument = useMutation(api.documents.createDocument);
  
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [category, setCategory] = useState("supplies");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [vendor, setVendor] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setReceiptFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    if (!description.trim()) {
      toast.error("Please provide a description");
      return;
    }

    setLoading(true);
    
    try {
      let receiptDocumentId: Id<"documents"> | undefined;

      // Upload receipt as private document if file is provided
      if (receiptFile) {
        try {
          const uploadUrl = await generateUploadUrl();
          const result = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": receiptFile.type },
            body: receiptFile,
          });
          const { storageId } = await result.json();
          
          receiptDocumentId = await createDocument({
            title: `Receipt - ${description.trim().substring(0, 50)}`,
            description: `Expense receipt for ${category} - ${description.trim()}`,
            category: "Expense Receipt",
            fileUrl: storageId,
            fileName: receiptFile.name,
            fileSize: receiptFile.size,
            mimeType: receiptFile.type,
            projectId,
            accessLevel: "restricted",
            tags: ["expense", "receipt", category.toLowerCase()],
          });
        } catch (uploadError) {
          console.error("Receipt upload failed:", uploadError);
          toast.error("Receipt upload failed, but expense will still be submitted");
        }
      }

      await createExpense({
        projectId,
        category,
        amount: parseFloat(amount),
        description: description.trim(),
        vendor: vendor.trim(),
        receiptUrl: receiptDocumentId ? `document:${receiptDocumentId}` : "",
        date: Date.now(),
      });
      
      toast.success("Expense submitted for approval");
      
      // Reset form
      setCategory("supplies");
      setAmount("");
      setDescription("");
      setVendor("");
      setReceiptFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setIsOpen(false);
    } catch (error) {
      toast.error("Failed to submit expense");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Receipt className="h-5 w-5 text-blue-400" />
            Submit Expense
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Add a new expense for this project. It will be sent for approval.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Category */}
          <div>
            <Label htmlFor="category" className="text-gray-300">Category *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category" className="bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {EXPENSE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value} className="text-white">
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div>
            <Label htmlFor="amount" className="text-gray-300">Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1000.00"
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-gray-300">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this expense is for..."
              rows={3}
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>

          {/* Vendor */}
          <div>
            <Label htmlFor="vendor" className="text-gray-300">Vendor/Supplier</Label>
            <Input
              id="vendor"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              placeholder="Store or supplier name"
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>

          {/* Receipt Upload */}
          <div>
            <Label className="text-gray-300 mb-2 block">
              Receipt Upload (Optional)
            </Label>
            {!receiptFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center cursor-pointer hover:border-gray-600 transition-colors bg-gray-800/50"
              >
                <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="text-sm text-gray-400 mb-1">Click to upload receipt</p>
                <p className="text-xs text-gray-600">PDF, PNG, JPG (max 5MB)</p>
                <p className="text-xs text-yellow-500 mt-2">
                  🔒 Private - Only Admin/Captain can view
                </p>
              </div>
            ) : (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {receiptFile.type.startsWith("image/") ? (
                      <Image className="w-8 h-8 text-blue-400" />
                    ) : (
                      <FileText className="w-8 h-8 text-gray-400" />
                    )}
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium truncate">
                        {receiptFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(receiptFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setReceiptFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <Badge variant="outline" className="mt-2 bg-yellow-500/10 text-yellow-300 border-yellow-500/30 text-xs">
                  🔒 Restricted Access
                </Badge>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1 bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
              onClick={() => setIsOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleSubmit}
              disabled={loading}
            >
              <Receipt className="h-4 w-4 mr-2" />
              {loading ? "Submitting..." : "Submit for Approval"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
