import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'circle' | 'text' | 'card';
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className,
  variant = 'default',
  animation = 'pulse',
}: SkeletonProps) {
  const baseClasses = "bg-white/10 rounded";
  
  const variantClasses = {
    default: "",
    circle: "rounded-full",
    text: "h-4 w-full",
    card: "h-32 w-full",
  };

  const animationClasses = {
    pulse: "animate-pulse",
    wave: "animate-shimmer bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%]",
    none: "",
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
    />
  );
}

// Predefined skeleton components
export function SkeletonCard() {
  return (
    <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
      <Skeleton className="h-6 w-3/4 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-5/6 mb-4" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4 p-4 bg-white/5 rounded-lg">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 bg-white/5 rounded-lg">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
          <Skeleton variant="circle" className="h-12 w-12" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton variant="circle" className="h-12 w-12" />
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-32" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonForm() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex gap-3">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <SkeletonStats />
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
      
      {/* Table */}
      <SkeletonTable rows={3} />
    </div>
  );
}
