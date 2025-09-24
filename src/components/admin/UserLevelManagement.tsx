'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { AdminOnly } from '@/components/auth/PermissionGuard'
import { Id } from '../../../convex/_generated/dataModel'

export function UserLevelManagement() {
  const [isCreating, setIsCreating] = useState(false)
  const [editingLevel, setEditingLevel] = useState<Id<"userLevels"> | null>(null)
  
  const userLevels = useQuery(api.userLevels.getAll)
  const availablePermissions = useQuery(api.userLevels.getAvailablePermissions)
  const createUserLevel = useMutation(api.userLevels.create)
  const updateUserLevel = useMutation(api.userLevels.update)
  const removeUserLevel = useMutation(api.userLevels.remove)

  const [formData, setFormData] = useState({
    name: '',
    level: 1,
    description: '',
    permissions: [] as string[],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingLevel) {
        await updateUserLevel({
          id: editingLevel,
          ...formData,
        })
        setEditingLevel(null)
      } else {
        await createUserLevel(formData)
        setIsCreating(false)
      }
      setFormData({ name: '', level: 1, description: '', permissions: [] })
    } catch (error) {
      console.error('Failed to save user level:', error)
    }
  }

  const handleEdit = (level: any) => {
    setFormData({
      name: level.name,
      level: level.level,
      description: level.description,
      permissions: level.permissions,
    })
    setEditingLevel(level._id)
    setIsCreating(true)
  }

  const handleDelete = async (id: Id<"userLevels">) => {
    if (confirm('Are you sure you want to delete this user level?')) {
      try {
        await removeUserLevel({ id })
      } catch (error) {
        console.error('Failed to delete user level:', error)
      }
    }
  }

  const togglePermission = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }))
  }

  return (
    <AdminOnly fallback={<div className="text-center text-neutral-500 py-8">Access denied. Admin privileges required.</div>}>
      <div className="bg-white rounded-lg shadow-soft p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-neutral-900">User Level Management</h2>
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Create New Level
          </button>
        </div>

        {isCreating && (
          <div className="mb-6 p-6 border border-neutral-200 rounded-lg bg-neutral-50">
            <h3 className="text-lg font-medium mb-4">
              {editingLevel ? 'Edit User Level' : 'Create New User Level'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., SUPERVISOR"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Level (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
                    className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Brief description"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Permissions
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto border border-neutral-200 rounded-lg p-4">
                  {availablePermissions?.map((permission) => (
                    <label key={permission} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(permission)}
                        onChange={() => togglePermission(permission)}
                        className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-neutral-700">{permission}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  {editingLevel ? 'Update Level' : 'Create Level'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false)
                    setEditingLevel(null)
                    setFormData({ name: '', level: 1, description: '', permissions: [] })
                  }}
                  className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="text-left py-3 px-4 font-medium text-neutral-700">Level</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-700">Name</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-700">Description</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-700">Permissions</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {userLevels?.map((level) => (
                <tr key={level._id} className="border-b border-neutral-100 hover:bg-neutral-50">
                  <td className="py-3 px-4">
                    <span className="font-mono text-lg font-semibold text-primary-600">
                      {level.level}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      level.name === 'ADMIN' ? 'bg-error-100 text-error-800' :
                      level.name === 'MANAGER' ? 'bg-warning-100 text-warning-800' :
                      level.name === 'BUILDER' ? 'bg-secondary-100 text-secondary-800' :
                      'bg-neutral-100 text-neutral-800'
                    }`}>
                      {level.name}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-neutral-700">{level.description}</td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-neutral-600">
                      {level.permissions.length} permissions
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {level.permissions.slice(0, 3).map((permission) => (
                        <span
                          key={permission}
                          className="px-1 py-0.5 text-xs bg-primary-100 text-primary-700 rounded"
                        >
                          {permission}
                        </span>
                      ))}
                      {level.permissions.length > 3 && (
                        <span className="px-1 py-0.5 text-xs bg-neutral-100 text-neutral-600 rounded">
                          +{level.permissions.length - 3} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      level.isActive ? 'bg-success-100 text-success-800' : 'bg-neutral-100 text-neutral-800'
                    }`}>
                      {level.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(level)}
                        className="px-2 py-1 text-xs bg-secondary-100 text-secondary-700 rounded hover:bg-secondary-200 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(level._id)}
                        className="px-2 py-1 text-xs bg-error-100 text-error-700 rounded hover:bg-error-200 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {userLevels?.length === 0 && (
          <div className="text-center py-8 text-neutral-500">
            No user levels found. Create your first user level to get started.
          </div>
        )}
      </div>
    </AdminOnly>
  )
}
