"use client";

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Settings,
  GripVertical,
} from 'lucide-react';
import { Id } from '../../../convex/_generated/dataModel';

interface Column {
  _id: Id<"kanbanColumns">;
  title: string;
  statusKey: string;
  color: string;
  order: number;
  isDefault: boolean;
  rules: {
    requiresAssignment?: boolean;
    requiresDescription?: boolean;
    requiresStoryPoints?: boolean;
    minStoryPoints?: number;
    requiresPriority?: boolean;
    requiresDueDate?: boolean;
    requiresReviewer?: boolean;
  };
}

interface ColumnManagerProps {
  milestoneId: string;
  columns: Column[];
  onRefresh: () => void;
}

const colorOptions = [
  { name: 'Gray', value: 'gray', class: 'bg-gray-600' },
  { name: 'Red', value: 'red', class: 'bg-red-600' },
  { name: 'Orange', value: 'orange', class: 'bg-orange-600' },
  { name: 'Yellow', value: 'yellow', class: 'bg-yellow-600' },
  { name: 'Green', value: 'green', class: 'bg-green-600' },
  { name: 'Teal', value: 'teal', class: 'bg-teal-600' },
  { name: 'Blue', value: 'blue', class: 'bg-blue-600' },
  { name: 'Indigo', value: 'indigo', class: 'bg-indigo-600' },
  { name: 'Purple', value: 'purple', class: 'bg-purple-600' },
  { name: 'Pink', value: 'pink', class: 'bg-pink-600' },
];

export function ColumnManager({ milestoneId, columns, onRefresh }: ColumnManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<Column | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    color: 'blue',
    rules: {
      requiresAssignment: false,
      requiresDescription: false,
      requiresStoryPoints: false,
      minStoryPoints: 0,
      requiresPriority: false,
      requiresDueDate: false,
      requiresReviewer: false,
    },
  });

  const createColumn = useMutation(api.kanbanColumns.createColumn);
  const updateColumn = useMutation(api.kanbanColumns.updateColumn);
  const deleteColumn = useMutation(api.kanbanColumns.deleteColumn);

  const handleCreate = async () => {
    try {
      await createColumn({
        milestoneId: milestoneId as Id<"milestones">,
        title: formData.title,
        color: formData.color,
        rules: formData.rules,
      });
      setIsCreating(false);
      setFormData({
        title: '',
        color: 'blue',
        rules: {
          requiresAssignment: false,
          requiresDescription: false,
          requiresStoryPoints: false,
          minStoryPoints: 0,
          requiresPriority: false,
          requiresDueDate: false,
          requiresReviewer: false,
        },
      });
      onRefresh();
    } catch (error: any) {
      alert(error.message || 'Failed to create column');
    }
  };

  const handleUpdate = async () => {
    if (!editingColumn) return;

    try {
      await updateColumn({
        columnId: editingColumn._id,
        title: formData.title,
        color: formData.color,
        rules: formData.rules,
      });
      setEditingColumn(null);
      onRefresh();
    } catch (error: any) {
      alert(error.message || 'Failed to update column');
    }
  };

  const handleDelete = async (columnId: Id<"kanbanColumns">) => {
    if (!confirm('Are you sure you want to delete this column?')) return;

    try {
      await deleteColumn({ columnId });
      onRefresh();
    } catch (error: any) {
      alert(error.message || 'Failed to delete column');
    }
  };

  const startEditing = (column: Column) => {
    setEditingColumn(column);
    setFormData({
      title: column.title,
      color: column.color,
      rules: column.rules,
    });
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="border-gray-600 hover:bg-gray-700"
      >
        <Settings className="w-4 h-4 mr-2" />
        Manage Columns
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-gray-700 pb-4">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Settings className="w-6 h-6 text-blue-400" />
              Manage Kanban Columns
            </DialogTitle>
            <p className="text-sm text-gray-400 mt-2">
              Add custom columns, set colors, and define rules for task progression
            </p>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {/* Existing Columns */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Current Columns</h3>
              <div className="space-y-2">
                {columns.map((column) => (
                  <div
                    key={column._id}
                    className="bg-gray-900 border border-gray-700 rounded-lg p-4"
                  >
                    {editingColumn?._id === column._id ? (
                      // Edit Mode
                      <div className="space-y-4">
                        <div>
                          <Label className="text-white">Column Title</Label>
                          <Input
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="bg-gray-950 border-gray-700 text-white mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-white">Color</Label>
                          <div className="grid grid-cols-5 gap-2 mt-2">
                            {colorOptions.map((color) => (
                              <button
                                key={color.value}
                                onClick={() => setFormData({ ...formData, color: color.value })}
                                className={`h-10 rounded-md ${color.class} ${
                                  formData.color === color.value ? 'ring-2 ring-white' : ''
                                }`}
                              >
                                {formData.color === color.value && (
                                  <span className="text-white font-bold">✓</span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <Label className="text-white font-semibold mb-2 block">Validation Rules</Label>
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm text-gray-300">
                              <input
                                type="checkbox"
                                checked={formData.rules.requiresAssignment}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  rules: { ...formData.rules, requiresAssignment: e.target.checked }
                                })}
                                className="w-4 h-4"
                              />
                              Requires assignment (must have assignee)
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-300">
                              <input
                                type="checkbox"
                                checked={formData.rules.requiresDescription}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  rules: { ...formData.rules, requiresDescription: e.target.checked }
                                })}
                                className="w-4 h-4"
                              />
                              Requires description
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-300">
                              <input
                                type="checkbox"
                                checked={formData.rules.requiresStoryPoints}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  rules: { ...formData.rules, requiresStoryPoints: e.target.checked }
                                })}
                                className="w-4 h-4"
                              />
                              Requires story points
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-300">
                              <input
                                type="checkbox"
                                checked={formData.rules.requiresPriority}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  rules: { ...formData.rules, requiresPriority: e.target.checked }
                                })}
                                className="w-4 h-4"
                              />
                              Requires priority
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-300">
                              <input
                                type="checkbox"
                                checked={formData.rules.requiresDueDate}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  rules: { ...formData.rules, requiresDueDate: e.target.checked }
                                })}
                                className="w-4 h-4"
                              />
                              Requires due date
                            </label>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={handleUpdate}
                            className="bg-green-600 hover:bg-green-700"
                            size="sm"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Save
                          </Button>
                          <Button
                            onClick={() => setEditingColumn(null)}
                            variant="outline"
                            className="border-gray-600"
                            size="sm"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-5 h-5 text-gray-500" />
                          <div className={`w-4 h-4 rounded ${colorOptions.find(c => c.value === column.color)?.class}`} />
                          <div>
                            <div className="font-semibold text-white">{column.title}</div>
                            <div className="text-xs text-gray-400">
                              {column.isDefault && <Badge className="bg-blue-600 text-white text-xs">Default</Badge>}
                              {Object.values(column.rules).some(r => r) && (
                                <span className="ml-2 text-yellow-400">Has rules</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => startEditing(column)}
                            size="sm"
                            variant="outline"
                            className="border-gray-600"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          {!column.isDefault && (
                            <Button
                              onClick={() => handleDelete(column._id)}
                              size="sm"
                              variant="outline"
                              className="border-red-600 text-red-400 hover:bg-red-600/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Add New Column */}
            <div className="border-t border-gray-700 pt-4">
              {isCreating ? (
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-4">
                  <h3 className="text-lg font-semibold text-white">Create New Column</h3>
                  
                  <div>
                    <Label className="text-white">Column Title</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Code Review, Testing, Blocked"
                      className="bg-gray-950 border-gray-700 text-white mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-white">Color</Label>
                    <div className="grid grid-cols-5 gap-2 mt-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => setFormData({ ...formData, color: color.value })}
                          className={`h-10 rounded-md ${color.class} ${
                            formData.color === color.value ? 'ring-2 ring-white' : ''
                          }`}
                        >
                          {formData.color === color.value && (
                            <span className="text-white font-bold">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-white font-semibold mb-2 block">Validation Rules (Optional)</Label>
                    <div className="space-y-2 bg-gray-950 p-3 rounded-md">
                      <label className="flex items-center gap-2 text-sm text-gray-300">
                        <input
                          type="checkbox"
                          checked={formData.rules.requiresAssignment}
                          onChange={(e) => setFormData({
                            ...formData,
                            rules: { ...formData.rules, requiresAssignment: e.target.checked }
                          })}
                          className="w-4 h-4"
                        />
                        Requires assignment
                      </label>
                      <label className="flex items-center gap-2 text-sm text-gray-300">
                        <input
                          type="checkbox"
                          checked={formData.rules.requiresDescription}
                          onChange={(e) => setFormData({
                            ...formData,
                            rules: { ...formData.rules, requiresDescription: e.target.checked }
                          })}
                          className="w-4 h-4"
                        />
                        Requires description
                      </label>
                      <label className="flex items-center gap-2 text-sm text-gray-300">
                        <input
                          type="checkbox"
                          checked={formData.rules.requiresStoryPoints}
                          onChange={(e) => setFormData({
                            ...formData,
                            rules: { ...formData.rules, requiresStoryPoints: e.target.checked }
                          })}
                          className="w-4 h-4"
                        />
                        Requires story points
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleCreate}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Column
                    </Button>
                    <Button
                      onClick={() => {
                        setIsCreating(false);
                        setFormData({
                          title: '',
                          color: 'blue',
                          rules: {
                            requiresAssignment: false,
                            requiresDescription: false,
                            requiresStoryPoints: false,
                            minStoryPoints: 0,
                            requiresPriority: false,
                            requiresDueDate: false,
                            requiresReviewer: false,
                          },
                        });
                      }}
                      variant="outline"
                      className="border-gray-600"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => setIsCreating(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Column
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
