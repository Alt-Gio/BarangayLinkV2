"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function PageTransition() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Start loading animation
    setIsLoading(true);
    setProgress(20);

    // Simulate progress
    const timer1 = setTimeout(() => setProgress(50), 100);
    const timer2 = setTimeout(() => setProgress(80), 200);
    const timer3 = setTimeout(() => {
      setProgress(100);
      setTimeout(() => setIsLoading(false), 400);
    }, 400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [pathname]);

  if (!isLoading && progress === 100) return null;

  return (
    <>
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 transition-all duration-300 ease-out shadow-lg shadow-emerald-500/50"
          style={{
            width: `${progress}%`,
            opacity: isLoading ? 1 : 0,
          }}
        >
          {/* Shimmer effect */}
          <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        </div>
      </div>

      {/* Global shimmer animation */}
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </>
  );
}
