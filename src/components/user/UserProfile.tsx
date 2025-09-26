'use client'

import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useCurrentUser } from '@/hooks/useCurrentUser'

export function UserProfile() {
  const user = useCurrentUser()
  const updateProfile = useMutation(api.users.updateUserProfile)
  
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    position: user?.position || '',
    phone: user?.phone || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateProfile(formData)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update profile:', error)
    }
  }

  if (!user) {
    return <div className="animate-pulse bg-neutral-200 h-64 rounded-lg"></div>
  }

  return (
    <div className="bg-white rounded-lg shadow-soft p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-neutral-900">User Profile</h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          {isEditing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Name
            </label>
            <div className="p-3 bg-neutral-50 rounded-lg">
              {user.name}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Email
            </label>
            <div className="p-3 bg-neutral-50 rounded-lg">
              {user.email}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              User Level
            </label>
            <div className="p-3 bg-neutral-50 rounded-lg flex items-center gap-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                user.userLevel?.name === 'ADMIN' ? 'bg-error-100 text-error-800' :
                user.userLevel?.name === 'MANAGER' ? 'bg-warning-100 text-warning-800' :
                user.userLevel?.name === 'BUILDER' ? 'bg-secondary-100 text-secondary-800' :
                'bg-neutral-100 text-neutral-800'
              }`}>
                {user.userLevel?.name}
              </span>
              <span className="text-sm text-neutral-600">
                Level {user.userLevel?.level}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Position
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter position"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter phone number"
                />
              </div>

              <button
                type="submit"
                className="w-full px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                Save Changes
              </button>
            </form>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Barangay
                </label>
                <div className="p-3 bg-neutral-50 rounded-lg">
                  {user.department || 'Not specified'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Position
                </label>
                <div className="p-3 bg-neutral-50 rounded-lg">
                  {user.position || 'Not specified'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Phone
                </label>
                <div className="p-3 bg-neutral-50 rounded-lg">
                  {user.phone || 'Not specified'}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-neutral-200">
        <h3 className="text-lg font-medium text-neutral-900 mb-3">Permissions</h3>
        <div className="flex flex-wrap gap-2">
          {user.userLevel?.permissions.map((permission) => (
            <span
              key={permission}
              className="px-3 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full"
            >
              {permission}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
