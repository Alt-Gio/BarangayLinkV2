"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProjectFiltersProps {
  filters: {
    status: string;
    department: string;
  };
  onFiltersChange: (filters: any) => void;
  userRole: string;
  userDepartment: string;
}

export function ProjectFilters({ filters, onFiltersChange, userRole, userDepartment }: ProjectFiltersProps) {
  const departments = [
    "Health Services", 
    "Infrastructure", 
    "Education", 
    "Social Services", 
    "Environment", 
    "Governance", 
    "Disaster Management"
  ];

  const showDepartmentFilter = ["ADMIN", "MANAGER"].includes(userRole);

  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
      <div className="flex flex-wrap gap-4 items-center">
        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-300 font-medium">Status:</span>
          <Select 
            value={filters.status} 
            onValueChange={(value) => onFiltersChange({...filters, status: value})}
          >
            <SelectTrigger className="w-40 bg-gray-700 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              <SelectItem value="all" className="text-white hover:bg-gray-700">
                All Status
              </SelectItem>
              <SelectItem value="planning" className="text-white hover:bg-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  Planning
                </div>
              </SelectItem>
              <SelectItem value="active" className="text-white hover:bg-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Active
                </div>
              </SelectItem>
              <SelectItem value="completed" className="text-white hover:bg-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Completed
                </div>
              </SelectItem>
              <SelectItem value="cancelled" className="text-white hover:bg-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  Cancelled
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Department Filter - Only for ADMIN and MANAGER */}
        {showDepartmentFilter && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-300 font-medium">Department:</span>
            <Select 
              value={filters.department} 
              onValueChange={(value) => onFiltersChange({...filters, department: value})}
            >
              <SelectTrigger className="w-48 bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="all" className="text-white hover:bg-gray-700">
                  All Departments
                </SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept} className="text-white hover:bg-gray-700">
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Search Filter */}
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <span className="text-sm text-gray-300 font-medium">Search:</span>
          <input
            type="text"
            placeholder="Search projects..."
            className="flex-1 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            onChange={(e) => onFiltersChange({...filters, search: e.target.value})}
          />
        </div>

        {/* Role indicator */}
        <div className="ml-auto">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Viewing as:</span>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                userRole === 'ADMIN' ? 'bg-purple-500' :
                userRole === 'MANAGER' ? 'bg-blue-500' :
                userRole === 'BUILDER' ? 'bg-green-500' :
                'bg-yellow-500'
              }`}></div>
              <span className="text-green-400 font-medium">{userRole}</span>
              {userRole !== "ADMIN" && userDepartment && (
                <>
                  <span className="text-gray-400">-</span>
                  <span className="text-white">{userDepartment}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="mt-3 pt-3 border-t border-gray-700">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-gray-400">
              Access Level: {userRole === 'ADMIN' ? 'System-wide' : userRole === 'MANAGER' ? 'Department' : userRole === 'BUILDER' ? 'Own Projects' : 'Assigned Projects'}
            </span>
          </div>
          
          {userRole === 'BUILDER' && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-yellow-400 text-xs">
                Projects require manager approval
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
