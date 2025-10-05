"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectContextValue {
  value?: string
  onValueChange?: (value: string) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SelectContext = React.createContext<SelectContextValue | null>(null)

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

const Select = ({ value, onValueChange, children }: SelectProps) => {
  const [open, setOpen] = React.useState(false)

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, onOpenChange: setOpen }}>
      {children}
    </SelectContext.Provider>
  )
}

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const context = React.useContext(SelectContext)
    if (!context) throw new Error("SelectTrigger must be used within Select")

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        onClick={() => context.onOpenChange(!context.open)}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
    )
  }
)
SelectTrigger.displayName = "SelectTrigger"

interface SelectValueProps {
  placeholder?: string
}

const SelectValue = ({ placeholder }: SelectValueProps) => {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error("SelectValue must be used within Select")

  const displayValue = context.value || placeholder || "Select..."

  return <span className="truncate">{displayValue}</span>
}

interface SelectContentProps {
  children: React.ReactNode
  className?: string
  position?: string
  sideOffset?: number
}

const SelectContent = ({ children, className, position, sideOffset }: SelectContentProps) => {
  const context = React.useContext(SelectContext)
  const [triggerRect, setTriggerRect] = React.useState<DOMRect | null>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)
  
  if (!context) throw new Error("SelectContent must be used within Select")

  React.useEffect(() => {
    if (context.open && contentRef.current) {
      const trigger = contentRef.current.parentElement?.querySelector('button')
      if (trigger) {
        setTriggerRect(trigger.getBoundingClientRect())
      }
    }
  }, [context.open])

  if (!context.open) return null

  const offset = sideOffset || 4

  return (
    <div className="fixed inset-0 z-50" onClick={() => context.onOpenChange(false)}>
      <div
        ref={contentRef}
        className={cn(
          "absolute z-50 min-w-[8rem] max-h-96 overflow-auto rounded-md border bg-white p-1 shadow-md",
          className
        )}
        onClick={(e) => e.stopPropagation()}
        style={{
          top: triggerRect ? `${triggerRect.bottom + offset}px` : '100%',
          left: triggerRect ? `${triggerRect.left}px` : 0,
          width: triggerRect ? `${triggerRect.width}px` : '100%',
        }}
      >
        {children}
      </div>
    </div>
  )
}

interface SelectItemProps {
  value: string
  children: React.ReactNode
  className?: string
}

const SelectItem = ({ value, children, className }: SelectItemProps) => {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error("SelectItem must be used within Select")

  const handleClick = () => {
    context.onValueChange?.(value)
    context.onOpenChange(false)
  }

  return (
    <div
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100",
        className
      )}
      onClick={handleClick}
    >
      {children}
    </div>
  )
}

const SelectLabel = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
)

const SelectSeparator = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("-mx-1 my-1 h-px bg-gray-200", className)}
    {...props}
  />
)

export {
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
}
