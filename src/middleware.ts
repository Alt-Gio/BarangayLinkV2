import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/login(.*)',
  '/register(.*)',
  '/complete-profile(.*)',
  '/pending-approval(.*)',
  '/api/test-email(.*)',
  '/test-email(.*)',
]);

// Offline-aware middleware that doesn't enforce auth
// This allows cached pages to work offline
export default clerkMiddleware((auth, request) => {
  // Don't protect public routes
  if (isPublicRoute(request)) {
    return;
  }
  
  // For all other routes, auth is available but not enforced
  // Individual pages handle their own auth checks
  // This allows offline mode to work with cached data
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};