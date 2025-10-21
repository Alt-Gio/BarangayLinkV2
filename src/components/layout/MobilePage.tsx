"use client";

import { useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sidebar } from '@/components/layout/Sidebar';
import { Toaster } from 'sonner';

interface MobilePageProps {
  /** Page title - centered and prominent */
  title: string;
  
  /** Optional subtitle shown below title */
  subtitle?: string;
  
  /** User role for sidebar permissions */
  userRole?: string;
  
  /** Show back button in header */
  showBack?: boolean;
  
  /** Custom back action (overrides default router.back()) */
  onBack?: () => void;
  
  /** Actions buttons in top-right corner */
  headerActions?: ReactNode;
  
  /** Collapsible section below title (stats, filters, etc.) */
  collapsibleHeader?: ReactNode;
  
  /** Main page content */
  children: ReactNode;
  
  /** Start with header collapsed */
  defaultCollapsed?: boolean;
  
  /** Custom padding for content area */
  contentPadding?: string;
  
  /** Additional className for main container */
  className?: string;
  
  /** Hide the collapsible toggle button */
  hideCollapseButton?: boolean;
  
  /** Show toaster notifications */
  showToaster?: boolean;
  
  /** Custom dashboard title for sidebar */
  dashboardTitle?: string;
  
  /** Custom dashboard subtitle for sidebar */
  dashboardSubtitle?: string;
}

/**
 * Mobile-First Page Wrapper
 * 
 * Provides consistent mobile-friendly layout across all pages:
 * - Collapsible sidebar (hidden on mobile by default)
 * - Responsive header with menu button
 * - Centered, prominent page title
 * - Optional collapsible section for filters/stats
 * - Touch-friendly buttons and spacing
 * 
 * @example
 * ```tsx
 * <MobilePage
 *   title="Projects"
 *   subtitle="Manage your projects"
 *   userRole="WORKER"
 *   headerActions={
 *     <Button size="sm">
 *       <Plus className="w-4 h-4" />
 *     </Button>
 *   }
 *   collapsibleHeader={
 *     <div>Stats and filters</div>
 *   }
 * >
 *   <div className="p-4">Your content</div>
 * </MobilePage>
 * ```
 */
export function MobilePage({
  title,
  subtitle,
  userRole = "WORKER",
  showBack = true,
  onBack,
  headerActions,
  collapsibleHeader,
  children,
  defaultCollapsed = false,
  contentPadding,
  className = "",
  hideCollapseButton = false,
  showToaster = true,
  dashboardTitle,
  dashboardSubtitle,
}: MobilePageProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(defaultCollapsed);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <div className={`flex h-screen bg-gray-900 overflow-hidden ${className}`}>
      {/* Toast Notifications */}
      {showToaster && <Toaster position="top-right" />}
      
      {/* Sidebar - Hidden on mobile by default */}
      <Sidebar
        userRole={userRole}
        dashboardTitle={dashboardTitle || title}
        dashboardSubtitle={dashboardSubtitle || subtitle || ""}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile-First Header */}
        <header className="bg-gray-800 border-b border-gray-700 flex-shrink-0">
          {/* Top Action Bar - Always Visible */}
          <div className="px-3 py-2 flex items-center justify-between">
            {/* Left Actions */}
            <div className="flex items-center gap-2">
              {/* Mobile Menu Button - Hidden on desktop */}
              <Button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                variant="ghost"
                size="sm"
                className="md:hidden p-2 hover:bg-gray-700"
                aria-label="Toggle menu"
              >
                <Menu className="w-5 h-5" />
              </Button>
              
              {/* Back Button */}
              {showBack && (
                <Button
                  onClick={handleBack}
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-gray-700"
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              )}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Collapse Toggle - Only show if there's collapsible content */}
              {collapsibleHeader && !hideCollapseButton && (
                <Button
                  onClick={() => setHeaderCollapsed(!headerCollapsed)}
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-gray-700"
                  aria-label={headerCollapsed ? "Show details" : "Hide details"}
                  title={headerCollapsed ? "Show details" : "Hide details"}
                >
                  {headerCollapsed ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronUp className="w-5 h-5" />
                  )}
                </Button>
              )}
              
              {/* Custom Header Actions */}
              {headerActions}
            </div>
          </div>

          {/* Page Title - Centered, Always Visible */}
          <div className="text-center px-4 py-3 border-t border-gray-700/50">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight">
              {title}
            </h1>
            {!headerCollapsed && subtitle && (
              <p className="text-xs sm:text-sm text-gray-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>

          {/* Collapsible Header Section (Stats, Filters, etc.) */}
          {collapsibleHeader && !headerCollapsed && (
            <div className="px-3 py-4 space-y-4 border-t border-gray-700/50">
              {collapsibleHeader}
            </div>
          )}
        </header>

        {/* Page Content - Scrollable */}
        <main 
          className={`flex-1 overflow-y-auto ${
            contentPadding || 'p-3 sm:p-4 md:p-6'
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

/**
 * Variant: MobilePageSimple
 * 
 * Simplified version without collapsible sections.
 * Best for simple pages that don't need filters or stats.
 */
export function MobilePageSimple({
  title,
  subtitle,
  userRole = "WORKER",
  showBack = true,
  onBack,
  headerActions,
  children,
  contentPadding,
  className = "",
  showToaster = true,
}: Omit<MobilePageProps, 'collapsibleHeader' | 'defaultCollapsed' | 'hideCollapseButton'>) {
  return (
    <MobilePage
      title={title}
      subtitle={subtitle}
      userRole={userRole}
      showBack={showBack}
      onBack={onBack}
      headerActions={headerActions}
      hideCollapseButton={true}
      contentPadding={contentPadding}
      className={className}
      showToaster={showToaster}
    >
      {children}
    </MobilePage>
  );
}
