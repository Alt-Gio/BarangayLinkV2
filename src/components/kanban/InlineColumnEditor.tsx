"use client";

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, X, Check } from 'lucide-react';
import { Id } from '../../../convex/_generated/dataModel';

interface InlineColumnEditorProps {
  milestoneId: string;
  columnId?: Id<"kanbanColumns">;
  isDefault?: boolean;
  insertAfterId?: Id<"kanbanColumns">; // Insert after this column
  onClose: () => void;
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

const ruleTemplates = [
  {
    name: 'No Rules',
    description: 'Anyone can move tasks here',
    rules: {},
  },
  {
    name: 'Needs Assignment',
    description: 'Task must have someone assigned',
    rules: { requiresAssignment: true },
  },
  {
    name: 'Needs Description',
    description: 'Task must have a description',
    rules: { requiresDescription: true },
  },
  {
    name: 'Ready for Review',
    description: 'Must have assignee + description',
    rules: { requiresAssignment: true, requiresDescription: true },
  },
  {
    name: 'Production Ready',
    description: 'Must have all fields + priority + due date',
    rules: {
      requiresAssignment: true,
      requiresDescription: true,
      requiresPriority: true,
      requiresDueDate: true,
    },
  },
  {
    name: 'Custom',
    description: 'Choose your own rules',
    rules: {},
  },
];

export function InlineColumnEditor({ 
  milestoneId, 
  columnId, 
  isDefault,
  insertAfterId,
  onClose, 
  onRefresh 
}: InlineColumnEditorProps) {
  const [title, setTitle] = useState('');
  const [color, setColor] = useState('blue');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('No Rules');
  const [showCustomRules, setShowCustomRules] = useState(false);
  const [customRules, setCustomRules] = useState({
    requiresAssignment: false,
    requiresDescription: false,
    requiresStoryPoints: false,
    minStoryPoints: 0,
    requiresPriority: false,
    requiresDueDate: false,
  });

  const createColumn = useMutation(api.kanbanColumns.createColumn);
  const deleteColumn = useMutation(api.kanbanColumns.deleteColumn);

  const handleCreate = async () => {
    if (!title.trim()) {
      alert('Please enter a column name');
      return;
    }

    // Get rules from template or custom
    const template = ruleTemplates.find(t => t.name === selectedTemplate);
    const rules = selectedTemplate === 'Custom' ? customRules : template?.rules || {};

    try {
      await createColumn({
        milestoneId: milestoneId as Id<"milestones">,
        title: title.trim(),
        color,
        insertAfterId, // Insert after the column where + was clicked
        rules,
      });
      onRefresh();
      onClose();
    } catch (error: any) {
      alert(error.message || 'Failed to create column');
    }
  };

  const handleDelete = async () => {
    if (!columnId) return;
    
    if (!confirm('Are you sure you want to delete this column?\n\nTasks in this column will be moved to the nearest default column on the left.')) {
      return;
    }

    try {
      const result = await deleteColumn({ columnId });
      if (result.taskCount > 0) {
        alert(`✅ Column deleted!\n\n${result.taskCount} task(s) moved to "${result.movedTasksTo}"`);
      } else {
        alert('✅ Column deleted!');
      }
      onRefresh();
      onClose();
    } catch (error: any) {
      alert(error.message || 'Failed to delete column');
    }
  };

  // If columnId exists, show delete option
  if (columnId) {
    return (
      <div className="absolute top-12 right-0 z-50 bg-gray-900 border-2 border-gray-700 rounded-lg shadow-2xl p-4 min-w-[280px]">
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-gray-700 pb-2">
            <span className="text-sm font-semibold text-white">Column Actions</span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {!isDefault ? (
            <>
              <Button
                onClick={handleDelete}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                size="sm"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete This Column
              </Button>
              <p className="text-xs text-gray-400 text-center">
                Tasks will remain but need to be moved
              </p>
            </>
          ) : (
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
              <p className="text-xs text-blue-300 text-center">
                Default columns cannot be deleted
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Otherwise, show create new column form
  return (
    <div className="absolute top-12 right-0 z-50 bg-gray-900 border-2 border-gray-700 rounded-lg shadow-2xl p-4 min-w-[320px]">
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-gray-700 pb-2">
          <span className="text-sm font-semibold text-white">Add New Column</span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title Input */}
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Column Name</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Testing, Blocked, QA"
            className="bg-gray-950 border-gray-700 text-white h-9"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCreate();
              }
            }}
          />
        </div>

        {/* Color Picker */}
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Color</label>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded ${colorOptions.find(c => c.value === color)?.class}`} />
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              {showColorPicker ? 'Hide colors' : 'Change color'}
            </button>
          </div>
          
          {showColorPicker && (
            <div className="grid grid-cols-5 gap-2 mt-2">
              {colorOptions.map((c) => (
                <button
                  key={c.value}
                  onClick={() => {
                    setColor(c.value);
                    setShowColorPicker(false);
                  }}
                  className={`h-8 rounded ${c.class} ${
                    color === c.value ? 'ring-2 ring-white' : ''
                  } hover:ring-2 hover:ring-gray-400 transition-all`}
                  title={c.name}
                />
              ))}
            </div>
          )}
        </div>

        {/* Rule Templates */}
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Validation Rules</label>
          <select
            value={selectedTemplate}
            onChange={(e) => {
              setSelectedTemplate(e.target.value);
              setShowCustomRules(e.target.value === 'Custom');
            }}
            className="w-full bg-gray-950 border border-gray-700 text-white h-9 rounded-md px-2 text-sm"
          >
            {ruleTemplates.map((template) => (
              <option key={template.name} value={template.name}>
                {template.name} - {template.description}
              </option>
            ))}
          </select>
        </div>

        {/* Custom Rules */}
        {showCustomRules && (
          <div className="bg-gray-950 border border-gray-700 rounded-md p-2 space-y-1">
            <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={customRules.requiresAssignment}
                onChange={(e) => setCustomRules({ ...customRules, requiresAssignment: e.target.checked })}
                className="w-3 h-3"
              />
              Requires assignment
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={customRules.requiresDescription}
                onChange={(e) => setCustomRules({ ...customRules, requiresDescription: e.target.checked })}
                className="w-3 h-3"
              />
              Requires description
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={customRules.requiresStoryPoints}
                onChange={(e) => setCustomRules({ ...customRules, requiresStoryPoints: e.target.checked })}
                className="w-3 h-3"
              />
              Requires story points
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={customRules.requiresPriority}
                onChange={(e) => setCustomRules({ ...customRules, requiresPriority: e.target.checked })}
                className="w-3 h-3"
              />
              Requires priority
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={customRules.requiresDueDate}
                onChange={(e) => setCustomRules({ ...customRules, requiresDueDate: e.target.checked })}
                className="w-3 h-3"
              />
              Requires due date
            </label>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleCreate}
            className="flex-1 bg-blue-600 hover:bg-blue-700 h-9"
            size="sm"
          >
            <Check className="w-4 h-4 mr-2" />
            Create
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="border-gray-600 h-9"
            size="sm"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
