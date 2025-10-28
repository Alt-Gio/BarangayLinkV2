"use client";

import { X, ChevronLeft } from 'lucide-react';
import { ReactNode } from 'react';

interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  showBackButton?: boolean;
  onBack?: () => void;
  className?: string;
}

export function MobileModal({ 
  isOpen, 
  onClose, 
  title, 
  children,
  showBackButton = false,
  onBack,
  className = ''
}: MobileModalProps) {
  if (!isOpen) return null;
  
  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] md:block"
        onClick={onClose}
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      
      {/* Modal */}
      <div className={`
        fixed z-[101]
        
        /* Mobile: Full screen */
        inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900
        
        /* Desktop: Centered modal */
        md:inset-auto md:w-full md:max-w-2xl md:max-h-[90vh]
        md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2
        md:rounded-xl md:border md:border-gray-700 md:shadow-2xl
        
        ${className}
      `}>
        {/* Header - Sticky on mobile */}
        <div className="
          sticky top-0 z-10 
          bg-gray-900/95 backdrop-blur-lg
          border-b border-gray-800
          p-4 flex items-center gap-3
          md:bg-transparent md:backdrop-blur-none md:border-gray-700
        ">
          {/* Back button (mobile only, if provided) */}
          {showBackButton && onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-400" />
            </button>
          )}
          
          {/* Title */}
          <h2 className="flex-1 text-xl md:text-2xl font-bold text-white truncate">
            {title}
          </h2>
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors touch-manipulation"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        {/* Content - Scrollable */}
        <div className="
          h-[calc(100vh-64px)] md:h-auto md:max-h-[calc(90vh-64px)]
          overflow-y-auto overflow-x-hidden
          mobile-scroll
          p-4 md:p-6
        ">
          {children}
        </div>
      </div>
    </>
  );
}

/**
 * Compact Mobile Modal - For smaller forms/dialogs
 */
export function MobileModalCompact({ 
  isOpen, 
  onClose, 
  title, 
  children 
}: Omit<MobileModalProps, 'showBackButton' | 'onBack' | 'className'>) {
  if (!isOpen) return null;
  
  return (
    <>
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]"
        onClick={onClose}
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      
      <div 
        className="
          fixed z-[101]
          
          /* Mobile: Bottom sheet */
          bottom-0 left-0 right-0 
          bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900
          rounded-t-2xl
          max-h-[85vh]
          
          /* Desktop: Small centered modal */
          md:inset-auto md:w-full md:max-w-md
          md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2
          md:rounded-xl md:border md:border-gray-700 md:shadow-2xl
          md:max-h-[70vh]
          
          border border-gray-700
        "
        style={{ position: 'fixed' }}
      >
        {/* Handle bar (mobile only) */}
        <div className="md:hidden flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-700 rounded-full" />
        </div>
        
        {/* Header */}
        <div className="border-b border-gray-800 px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        {/* Content */}
        <div className="overflow-y-auto p-4 pb-safe">
          {children}
        </div>
      </div>
    </>
  );
}
