/**
 * Lazy-loaded Components
 * Heavy components with code-splitting for better performance
 * Reduces initial bundle size significantly
 */

import dynamic from 'next/dynamic';
import { SkeletonCard, SkeletonDashboard } from '../loading/Skeleton';
import { PageLoader } from '../loading/LoadingSpinner';

// ============================================
// MAP COMPONENTS (~500KB)
// ============================================

export const MapView = dynamic(() => import('../map/MapView').catch(() => ({
  default: () => <div className="p-4 text-center text-gray-500">Map not available</div>
})), {
  loading: () => <SkeletonCard className="h-96" />,
  ssr: false, // Disable SSR for map components
});

// ============================================
// PDF EXPORT (~200KB)
// ============================================

export const PDFExporter = dynamic(() => import('../exports/PDFExporter').catch(() => ({
  default: () => <div>PDF export not available</div>
})), {
  loading: () => <PageLoader />,
  ssr: false,
});

// ============================================
// EXCEL EXPORT (~800KB!)
// ============================================

export const ExcelExporter = dynamic(() => import('../exports/ExcelExporter').catch(() => ({
  default: () => <div>Excel export not available</div>
})), {
  loading: () => <PageLoader />,
  ssr: false,
});

// ============================================
// LIVEBLOCKS COLLABORATION
// ============================================

export const CollaborativeEditor = dynamic(() => import('../liveblocks/CollaborativeEditor').catch(() => ({
  default: () => <div>Collaborative editing not available</div>
})), {
  loading: () => <SkeletonCard className="h-96" />,
  ssr: false,
});

export const CollaborativeRoom = dynamic(() => import('../liveblocks/CollaborativeRoom').catch(() => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>
})), {
  loading: () => <PageLoader />,
  ssr: false,
});

// ============================================
// DOCUMENT VIEWER
// ============================================

export const DocumentViewer = dynamic(() => import('../documents/DocumentViewer').catch(() => ({
  default: () => <div>Document viewer not available</div>
})), {
  loading: () => <SkeletonCard className="h-screen" />,
  ssr: false,
});

export const PDFViewer = dynamic(() => import('../documents/PDFViewer').catch(() => ({
  default: () => <div>PDF viewer not available</div>
})), {
  loading: () => <SkeletonCard className="h-screen" />,
  ssr: false,
});

// ============================================
// CHARTS & ANALYTICS
// ============================================

export const AnalyticsDashboard = dynamic(() => import('../analytics/AnalyticsDashboard').catch(() => ({
  default: () => <div>Analytics not available</div>
})), {
  loading: () => <SkeletonDashboard />,
});

export const ChartsSection = dynamic(() => import('../analytics/ChartsSection').catch(() => ({
  default: () => <div>Charts not available</div>
})), {
  loading: () => <SkeletonCard />,
});

// ============================================
// RICH TEXT EDITOR
// ============================================

export const RichTextEditor = dynamic(() => import('../editor/RichTextEditor').catch(() => ({
  default: () => <textarea className="w-full h-64 p-4 border rounded" placeholder="Text editor loading..." />
})), {
  loading: () => <SkeletonCard className="h-64" />,
  ssr: false,
});

// ============================================
// IMAGE EDITOR
// ============================================

export const ImageEditor = dynamic(() => import('../editor/ImageEditor').catch(() => ({
  default: () => <div>Image editor not available</div>
})), {
  loading: () => <SkeletonCard className="h-96" />,
  ssr: false,
});

// ============================================
// CALENDAR & SCHEDULER
// ============================================

export const CalendarView = dynamic(() => import('../calendar/CalendarView').catch(() => ({
  default: () => <div>Calendar not available</div>
})), {
  loading: () => <SkeletonCard className="h-screen" />,
});

export const Scheduler = dynamic(() => import('../scheduler/Scheduler').catch(() => ({
  default: () => <div>Scheduler not available</div>
})), {
  loading: () => <SkeletonCard className="h-96" />,
});

// ============================================
// GANTT CHART (Heavy!)
// ============================================

export const GanttChart = dynamic(() => import('../projects/GanttChart').catch(() => ({
  default: () => <div className="p-4 border rounded">Gantt chart not available</div>
})), {
  loading: () => <SkeletonCard className="h-96" />,
  ssr: false,
});

// ============================================
// VIDEO PLAYER
// ============================================

export const VideoPlayer = dynamic(() => import('../media/VideoPlayer').catch(() => ({
  default: () => <video controls className="w-full" />
})), {
  loading: () => <SkeletonCard className="h-64" />,
  ssr: false,
});

// ============================================
// USAGE EXAMPLES
// ============================================

/*
// Basic usage:
import { MapView, PDFExporter } from '@/components/lazy';

function MyComponent() {
  return (
    <div>
      <MapView coordinates={{ lat: 0, lng: 0 }} />
      <PDFExporter data={myData} />
    </div>
  );
}

// Conditional loading:
function ConditionalComponent() {
  const [showMap, setShowMap] = useState(false);
  
  return (
    <div>
      <button onClick={() => setShowMap(true)}>
        Show Map
      </button>
      {showMap && <MapView />}
    </div>
  );
}

// Benefits:
// 1. Reduces initial bundle by ~2MB
// 2. Components only load when needed
// 3. Better First Contentful Paint (FCP)
// 4. Improved Lighthouse scores
// 5. Graceful fallbacks with loading states
*/
