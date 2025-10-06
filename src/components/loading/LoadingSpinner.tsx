import { RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'primary' | 'white';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export function LoadingSpinner({
  size = 'md',
  variant = 'default',
  text,
  fullScreen = false,
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const variantClasses = {
    default: 'text-gray-400',
    primary: 'text-emerald-500',
    white: 'text-white',
  };

  const spinner = (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 className={cn(sizeClasses[size], variantClasses[variant], 'animate-spin')} />
      {text && (
        <p className={cn('text-sm', variantClasses[variant])}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
}

export function LoadingOverlay({ text }: { text?: string }) {
  return (
    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
      <LoadingSpinner size="lg" variant="white" text={text} />
    </div>
  );
}

export function LoadingButton({ loading, children, ...props }: any) {
  return (
    <button {...props} disabled={loading || props.disabled}>
      {loading ? (
        <span className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          {typeof children === 'string' ? 'Loading...' : children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <LoadingSpinner size="lg" variant="primary" text="Loading..." />
    </div>
  );
}

export function InlineLoader({ text }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 text-gray-400">
      <Loader2 className="w-4 h-4 animate-spin" />
      {text && <span className="text-sm">{text}</span>}
    </div>
  );
}
