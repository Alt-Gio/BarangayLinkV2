'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { AdminOnly } from '@/components/auth/PermissionGuard'
import { Id } from '../../../convex/_generated/dataModel'

export function UserManagement() {
  const [selectedBarangay, setSelectedBarangay] = useState<string>('')
  const [selectedUserLevel, setSelectedUserLevel] = useState<Id<"userLevels"> | ''>('')
  
  const users = useQuery(api.users.getAllUsers, {
    department: selectedBarangay || undefined,
    userLevelId: selectedUserLevel || undefined,
  })
  const userLevels = useQuery(api.userLevels.getAll)
  const assignUserLevel = useMutation(api.users.assignUserLevel)

  const handleLevelChange = async (userId: Id<"users">, newLevelId: Id<"userLevels">) => {
    try {
      await assignUserLevel({
        userId,
        newUserLevelId: newLevelId,
        reason: "Level changed via admin interface"
      })
    } catch (error) {
      console.error('Failed to update user level:', error)
    }
  }

  return (
    <AdminOnly fallback={<div className="text-center text-neutral-500 py-8">Access denied. Admin privileges required.</div>}>
      <div className="bg-white rounded-lg shadow-soft p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-neutral-900">User Management</h2>
          <div className="flex gap-4">
            <select
              value={selectedBarangay}
              onChange={(e) => setSelectedBarangay(e.target.value)}
              className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Barangays</option>
              <option value="Barangay 1">Barangay 1</option>
              <option value="Barangay 2">Barangay 2</option>
              <option value="Barangay 3">Barangay 3</option>
            </select>
            
            <select
              value={selectedUserLevel}
              onChange={(e) => setSelectedUserLevel(e.target.value as Id<"userLevels"> | '')}
              className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Levels</option>
              {userLevels?.map((level) => (
                <option key={level._id} value={level._id}>
                  {level.name} (Level {level.level})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="text-left py-3 px-4 font-medium text-neutral-700">User</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-700">Email</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-700">Barangay</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-700">Position</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-700">Current Level</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((user) => (
                <tr key={user._id} className="border-b border-neutral-100 hover:bg-neutral-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {user.imageUrl && (
                        <img
                          src={user.imageUrl}
                          alt={`${user.firstName} ${user.lastName}`}
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <div>
                        <div className="font-medium text-neutral-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-neutral-500">
                          ID: {user._id.slice(-8)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-neutral-700">{user.email}</td>
                  <td className="py-3 px-4 text-neutral-700">{user.barangay || 'Not set'}</td>
                  <td className="py-3 px-4 text-neutral-700">{user.position || 'Not set'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.userLevel?.name === 'ADMIN' ? 'bg-error-100 text-error-800' :
                      user.userLevel?.name === 'MANAGER' ? 'bg-warning-100 text-warning-800' :
                      user.userLevel?.name === 'BUILDER' ? 'bg-secondary-100 text-secondary-800' :
                      'bg-neutral-100 text-neutral-800'
                    }`}>
                      {user.userLevel?.name} (L{user.userLevel?.level})
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={user.userLevelId}
                      onChange={(e) => handleLevelChange(user._id, e.target.value as Id<"userLevels">)}
                      className="px-2 py-1 text-sm border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500"
                    >
                      {userLevels?.map((level) => (
                        <option key={level._id} value={level._id}>
                          {level.name} (L{level.level})
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users?.length === 0 && (
          <div className="text-center py-8 text-neutral-500">
            No users found matching the current filters.
          </div>
        )}
      </div>
    </AdminOnly>
  )
}
