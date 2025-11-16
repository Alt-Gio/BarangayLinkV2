"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Home, X } from "lucide-react";

interface AddHouseholdModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddHouseholdModal({
  open,
  onClose,
  onSuccess,
}: AddHouseholdModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mutation
  const createHousehold = useMutation(api.households.createHousehold);

  // Form state
  const [formData, setFormData] = useState({
    houseNumber: "",
    street: "",
    purok: "Purok 1",
    barangay: "Barangay 37 - Bitano",
    city: "Legazpi City",
    province: "Albay",
    zipCode: "4500",
    yearEstablished: new Date().getFullYear(),
    monthlyIncome: "",
    isIndigent: false,
    is4PsBeneficiary: false,
    hasElectricity: true,
    hasWater: true,
    hasInternet: false,
    notes: "",
  });

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Validate required fields
      if (!formData.houseNumber || !formData.street || !formData.purok) {
        alert("Please fill in all required fields");
        return;
      }

      await createHousehold({
        houseNumber: formData.houseNumber,
        street: formData.street,
        purok: formData.purok,
        barangay: formData.barangay,
        city: formData.city,
        province: formData.province,
        zipCode: formData.zipCode,
        yearEstablished: formData.yearEstablished,
        monthlyIncome: formData.monthlyIncome || undefined,
        isIndigent: formData.isIndigent,
        is4PsBeneficiary: formData.is4PsBeneficiary,
        hasElectricity: formData.hasElectricity,
        hasWater: formData.hasWater,
        hasInternet: formData.hasInternet,
        notes: formData.notes || undefined,
      });

      alert("✅ Household created successfully!");
      onSuccess?.();
      onClose();
      resetForm();
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      houseNumber: "",
      street: "",
      purok: "Purok 1",
      barangay: "Barangay 37 - Bitano",
      city: "Legazpi City",
      province: "Albay",
      zipCode: "4500",
      yearEstablished: new Date().getFullYear(),
      monthlyIncome: "",
      isIndigent: false,
      is4PsBeneficiary: false,
      hasElectricity: true,
      hasWater: true,
      hasInternet: false,
      notes: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Home className="w-6 h-6 text-emerald-500" />
            Add New Household
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Register a new household in the barangay
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emerald-400">Address Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>House Number *</Label>
                <Input
                  value={formData.houseNumber}
                  onChange={(e) => setFormData({ ...formData, houseNumber: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                  placeholder="123"
                />
              </div>
              <div>
                <Label>Street *</Label>
                <Input
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                  placeholder="Rizal Street"
                />
              </div>
              <div>
                <Label>Purok/Zone *</Label>
                <select
                  value={formData.purok}
                  onChange={(e) => setFormData({ ...formData, purok: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
                >
                  {Array.from({ length: 10 }, (_, i) => `Purok ${i + 1}`).map((purok) => (
                    <option key={purok} value={purok}>
                      {purok}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Barangay</Label>
                <Input
                  value={formData.barangay}
                  onChange={(e) => setFormData({ ...formData, barangay: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <Label>City</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <Label>Province</Label>
                <Input
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <Label>ZIP Code</Label>
                <Input
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <Label>Year Established</Label>
                <Input
                  type="number"
                  value={formData.yearEstablished}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      yearEstablished: parseInt(e.target.value) || new Date().getFullYear(),
                    })
                  }
                  className="bg-gray-800 border-gray-700"
                />
              </div>
            </div>
          </div>

          {/* Economic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emerald-400">Economic Information</h3>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label>Monthly Household Income</Label>
                <select
                  value={formData.monthlyIncome}
                  onChange={(e) => setFormData({ ...formData, monthlyIncome: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
                >
                  <option value="">Select Income Range</option>
                  <option value="<5000">Less than ₱5,000</option>
                  <option value="5000-10000">₱5,000 - ₱10,000</option>
                  <option value="10000-15000">₱10,000 - ₱15,000</option>
                  <option value="15000-20000">₱15,000 - ₱20,000</option>
                  <option value="20000-30000">₱20,000 - ₱30,000</option>
                  <option value=">30000">More than ₱30,000</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isIndigent}
                    onChange={(e) =>
                      setFormData({ ...formData, isIndigent: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-300">Indigent Family</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is4PsBeneficiary}
                    onChange={(e) =>
                      setFormData({ ...formData, is4PsBeneficiary: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-300">4Ps Beneficiary</span>
                </label>
              </div>
            </div>
          </div>

          {/* Utilities */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emerald-400">Utilities & Services</h3>

            <div className="grid grid-cols-3 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hasElectricity}
                  onChange={(e) =>
                    setFormData({ ...formData, hasElectricity: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-300">⚡ Electricity</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hasWater}
                  onChange={(e) =>
                    setFormData({ ...formData, hasWater: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-300">💧 Water</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hasInternet}
                  onChange={(e) =>
                    setFormData({ ...formData, hasInternet: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-300">📡 Internet</span>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label>Notes (Optional)</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="bg-gray-800 border-gray-700 text-white resize-none"
              rows={3}
              placeholder="Additional information about this household..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isSubmitting ? "Creating..." : <>✅ Create Household</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
