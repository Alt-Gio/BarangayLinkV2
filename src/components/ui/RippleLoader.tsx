"use client";

import React from 'react';

interface RippleLoaderProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'emerald' | 'blue' | 'purple' | 'white';
}

export const RippleLoader: React.FC<RippleLoaderProps> = ({ 
  text, 
  size = 'md',
  color = 'emerald' 
}) => {
  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-32 h-32',
    lg: 'w-48 h-48'
  };

  const colorClasses = {
    emerald: 'border-emerald-500',
    blue: 'border-blue-500',
    purple: 'border-purple-500',
    white: 'border-white'
  };

  const dotColorClasses = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    white: 'bg-white'
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      {/* Ripple Effect Container */}
      <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
        {/* Central Water Drop */}
        <div className={`absolute w-3 h-3 ${dotColorClasses[color]} rounded-full z-10 animate-pulse`}></div>
        
        {/* Ripple 1 - Innermost */}
        <div 
          className={`absolute rounded-full border-2 ${colorClasses[color]} opacity-0`}
          style={{
            width: '20%',
            height: '20%',
            animation: 'ripple 2s ease-out infinite'
          }}
        ></div>
        
        {/* Ripple 2 */}
        <div 
          className={`absolute rounded-full border-2 ${colorClasses[color]} opacity-0`}
          style={{
            width: '40%',
            height: '40%',
            animation: 'ripple 2s ease-out 0.4s infinite'
          }}
        ></div>
        
        {/* Ripple 3 */}
        <div 
          className={`absolute rounded-full border-2 ${colorClasses[color]} opacity-0`}
          style={{
            width: '60%',
            height: '60%',
            animation: 'ripple 2s ease-out 0.8s infinite'
          }}
        ></div>
        
        {/* Ripple 4 */}
        <div 
          className={`absolute rounded-full border-2 ${colorClasses[color]} opacity-0`}
          style={{
            width: '80%',
            height: '80%',
            animation: 'ripple 2s ease-out 1.2s infinite'
          }}
        ></div>
        
        {/* Ripple 5 - Outermost */}
        <div 
          className={`absolute rounded-full border-2 ${colorClasses[color]} opacity-0`}
          style={{
            width: '100%',
            height: '100%',
            animation: 'ripple 2s ease-out 1.6s infinite'
          }}
        ></div>
      </div>

      {/* Loading Text (Optional) */}
      {text && (
        <div className="text-center">
          <p className="text-gray-300 text-lg font-medium animate-pulse">
            {text}
          </p>
        </div>
      )}

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes ripple {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default RippleLoader;
