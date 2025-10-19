"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Filter,
  X,
  User,
  Flag,
  Tag,
  Search,
  Clock,
} from 'lucide-react';

interface QuickFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  currentUser: any;
}

export interface FilterState {
  search: string;
  assignedToMe: boolean;
  priorities: string[];
  types: string[];
  showOverdue: boolean;
}

const taskTypeIcons: Record<string, string> = {
  story: '📖',
  bug: '🐛',
  task: '✅',
  epic: '🎯',
  feature: '⭐',
};

export function QuickFilters({ onFilterChange, currentUser }: QuickFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    assignedToMe: false,
    priorities: [],
    types: [],
    showOverdue: false,
  });
  const [isOpen, setIsOpen] = useState(false);

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFilterChange(updated);
  };

  const togglePriority = (priority: string) => {
    const priorities = filters.priorities.includes(priority)
      ? filters.priorities.filter(p => p !== priority)
      : [...filters.priorities, priority];
    updateFilters({ priorities });
  };

  const toggleType = (type: string) => {
    const types = filters.types.includes(type)
      ? filters.types.filter(t => t !== type)
      : [...filters.types, type];
    updateFilters({ types });
  };

  const clearAllFilters = () => {
    const cleared: FilterState = {
      search: '',
      assignedToMe: false,
      priorities: [],
      types: [],
      showOverdue: false,
    };
    setFilters(cleared);
    onFilterChange(cleared);
  };

  const activeFilterCount = 
    (filters.assignedToMe ? 1 : 0) +
    filters.priorities.length +
    filters.types.length +
    (filters.showOverdue ? 1 : 0);

  return (
    <div className="flex items-center gap-2">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search tasks..."
          value={filters.search}
          onChange={(e) => updateFilters({ search: e.target.value })}
          className="pl-10 w-64 bg-gray-800 border-gray-700 text-white"
        />
      </div>

      {/* Quick: My Tasks */}
      <Button
        variant={filters.assignedToMe ? 'default' : 'outline'}
        size="sm"
        onClick={() => updateFilters({ assignedToMe: !filters.assignedToMe })}
        className={filters.assignedToMe ? 'bg-blue-600' : 'border-gray-600'}
      >
        <User className="w-4 h-4 mr-2" />
        My Tasks
      </Button>

      {/* Quick: Overdue */}
      <Button
        variant={filters.showOverdue ? 'default' : 'outline'}
        size="sm"
        onClick={() => updateFilters({ showOverdue: !filters.showOverdue })}
        className={filters.showOverdue ? 'bg-red-600' : 'border-gray-600'}
      >
        <Clock className="w-4 h-4 mr-2" />
        Overdue
      </Button>

      {/* Advanced Filters */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="border-gray-600 relative"
          >
            <Filter className="w-4 h-4 mr-2" />
            More Filters
            {activeFilterCount > 0 && (
              <Badge className="ml-2 bg-purple-600 text-white">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 bg-gray-800 border-gray-700 p-4" align="end">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Advanced Filters
              </h3>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-red-400 hover:text-red-300"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>

            {/* Priority Filters */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-1">
                <Flag className="w-4 h-4" />
                Priority
              </label>
              <div className="space-y-2">
                {[
                  { value: 'critical', label: 'Critical', color: 'text-red-400' },
                  { value: 'high', label: 'High', color: 'text-orange-400' },
                  { value: 'medium', label: 'Medium', color: 'text-yellow-400' },
                  { value: 'low', label: 'Low', color: 'text-blue-400' },
                ].map((priority) => (
                  <div key={priority.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`priority-${priority.value}`}
                      checked={filters.priorities.includes(priority.value)}
                      onCheckedChange={() => togglePriority(priority.value)}
                      className="border-gray-600"
                    />
                    <label
                      htmlFor={`priority-${priority.value}`}
                      className={`text-sm cursor-pointer ${priority.color}`}
                    >
                      {priority.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Type Filters */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-1">
                <Tag className="w-4 h-4" />
                Type
              </label>
              <div className="space-y-2">
                {[
                  { value: 'story', label: 'Story', icon: '📖' },
                  { value: 'bug', label: 'Bug', icon: '🐛' },
                  { value: 'task', label: 'Task', icon: '✅' },
                  { value: 'epic', label: 'Epic', icon: '🎯' },
                ].map((type) => (
                  <div key={type.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`type-${type.value}`}
                      checked={filters.types.includes(type.value)}
                      onCheckedChange={() => toggleType(type.value)}
                      className="border-gray-600"
                    />
                    <label
                      htmlFor={`type-${type.value}`}
                      className="text-sm text-gray-300 cursor-pointer flex items-center gap-1"
                    >
                      <span>{type.icon}</span>
                      {type.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Filters Summary */}
            {activeFilterCount > 0 && (
              <div className="pt-3 border-t border-gray-700">
                <div className="text-xs text-gray-400 mb-2">Active Filters:</div>
                <div className="flex flex-wrap gap-1">
                  {filters.assignedToMe && (
                    <Badge className="bg-blue-600 text-white text-xs">My Tasks</Badge>
                  )}
                  {filters.showOverdue && (
                    <Badge className="bg-red-600 text-white text-xs">Overdue</Badge>
                  )}
                  {filters.priorities.map(p => (
                    <Badge key={p} className="bg-purple-600 text-white text-xs capitalize">
                      {p}
                    </Badge>
                  ))}
                  {filters.types.map(t => (
                    <Badge key={t} className="bg-gray-600 text-white text-xs">
                      {taskTypeIcons[t]} {t}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Active Filter Count */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-400">{activeFilterCount} active</span>
          <button
            onClick={clearAllFilters}
            className="text-red-400 hover:text-red-300 transition-colors"
            title="Clear all filters"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
