'use client'

import { ReactNode } from 'react'
import { useHasPermission, useCanAccess, useCanAccessAny } from '@/hooks/usePermissions'

interface PermissionGuardProps {
  children: ReactNode
  permission?: string
  permissions?: string[]
  requireAll?: boolean
  fallback?: ReactNode
}

export function PermissionGuard({ 
  children, 
  permission, 
  permissions, 
  requireAll = true,
  fallback = null 
}: PermissionGuardProps) {
  // Always call all hooks to avoid conditional hook calls
  const singlePermissionAccess = useHasPermission(permission || '') ?? false
  const allPermissionsAccess = useCanAccess(permissions || []) ?? false
  const anyPermissionAccess = useCanAccessAny(permissions || []) ?? false

  // Determine access based on props
  let hasAccess = false
  if (permission) {
    hasAccess = singlePermissionAccess
  } else if (permissions) {
    if (requireAll) {
      hasAccess = allPermissionsAccess
    } else {
      hasAccess = anyPermissionAccess
    }
  }

  if (!hasAccess) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

interface AdminOnlyProps {
  children: ReactNode
  fallback?: ReactNode
}

export function AdminOnly({ children, fallback = null }: AdminOnlyProps) {
  return (
    <PermissionGuard permission="system:manage" fallback={fallback}>
      {children}
    </PermissionGuard>
  )
}

interface ManagerOnlyProps {
  children: ReactNode
  fallback?: ReactNode
}

export function ManagerOnly({ children, fallback = null }: ManagerOnlyProps) {
  return (
    <PermissionGuard 
      permissions={["system:manage", "users:update"]} 
      requireAll={false}
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  )
}
