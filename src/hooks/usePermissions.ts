'use client'

import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'

export function usePermissions() {
  return useQuery(api.users.getUserPermissions)
}

export function useHasPermission(permission: string) {
  return useQuery(api.users.hasPermission, { permission })
}

export function useCanAccess(requiredPermissions: string[]) {
  const permissions = usePermissions()
  
  if (!permissions) return false
  
  // Check if user has admin permissions (wildcard)
  if (permissions.includes('*')) return true
  
  // Check if user has all required permissions
  return requiredPermissions.every(permission => 
    permissions.includes(permission)
  )
}

export function useCanAccessAny(requiredPermissions: string[]) {
  const permissions = usePermissions()
  
  if (!permissions) return false
  
  // Check if user has admin permissions (wildcard)
  if (permissions.includes('*')) return true
  
  // Check if user has any of the required permissions
  return requiredPermissions.some(permission => 
    permissions.includes(permission)
  )
}
