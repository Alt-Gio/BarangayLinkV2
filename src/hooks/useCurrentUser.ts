'use client'

import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'

export function useCurrentUser() {
  return useQuery(api.users.getCurrentUser)
}

export function useUserPermissions() {
  return useQuery(api.users.getUserPermissions)
}

export function useHasPermission(permission: string) {
  return useQuery(api.users.hasPermission, { permission })
}
