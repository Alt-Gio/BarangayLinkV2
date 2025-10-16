"use client"

import * as React from "react"
import { useState, useRef, useEffect } from "react"

interface DropdownMenuProps {
  children: React.ReactNode
}

export function DropdownMenu({ children }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div className="relative inline-block">
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            isOpen,
            setIsOpen
          })
        }
        return child
      })}
    </div>
  )
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode
  asChild?: boolean
  isOpen?: boolean
  setIsOpen?: (open: boolean) => void
}

export function DropdownMenuTrigger({ children, asChild, isOpen, setIsOpen }: DropdownMenuTriggerProps) {
  if (asChild && React.isValidElement(children)) {
    const childElement = children as React.ReactElement<any>;
    return React.cloneElement(childElement, {
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation()
        setIsOpen?.(!isOpen)
        childElement.props.onClick?.(e)
      }
    })
  }
  
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        setIsOpen?.(!isOpen)
      }}
    >
      {children}
    </button>
  )
}

interface DropdownMenuContentProps {
  children: React.ReactNode
  className?: string
  align?: "start" | "end"
  isOpen?: boolean
  setIsOpen?: (open: boolean) => void
}

export function DropdownMenuContent({ children, className = "", align = "start", isOpen, setIsOpen }: DropdownMenuContentProps) {
  const ref = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen?.(false)
      }
    }
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, setIsOpen])
  
  if (!isOpen) return null
  
  const alignClass = align === "end" ? "right-0" : "left-0"
  
  return (
    <div
      ref={ref}
      className={`absolute ${alignClass} mt-2 z-50 min-w-[12rem] overflow-hidden rounded-lg border border-white/10 bg-gray-900 p-1 shadow-2xl animate-in fade-in-0 zoom-in-95 ${className}`}
    >
      {children}
    </div>
  )
}

interface DropdownMenuItemProps {
  children: React.ReactNode
  className?: string
  onClick?: (e: React.MouseEvent) => void
}

export function DropdownMenuItem({ children, className = "", onClick }: DropdownMenuItemProps) {
  return (
    <div
      className={`relative flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm outline-none transition-colors hover:bg-white/10 ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
