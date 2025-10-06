/**
 * Environment Variable Validation
 * Validates all required environment variables at startup
 * Fails fast with clear error messages
 */

import { z } from 'zod';

// Define environment variable schema
const envSchema = z.object({
  // Clerk Authentication
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, 'Clerk publishable key is required'),
  CLERK_SECRET_KEY: z.string().min(1, 'Clerk secret key is required').optional(),
  CLERK_WEBHOOK_SECRET: z.string().optional(),
  
  // Convex Backend
  NEXT_PUBLIC_CONVEX_URL: z.string().url('Convex URL must be a valid URL'),
  CONVEX_DEPLOYMENT: z.string().optional(),
  
  // Liveblocks (Real-time collaboration)
  LIVEBLOCKS_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY: z.string().optional(),
  
  // Email Service
  RESEND_API_KEY: z.string().optional(),
  
  // Mapbox (Optional for maps)
  NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: z.string().optional(),
  
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Type for validated environment variables
export type Env = z.infer<typeof envSchema>;

/**
 * Validates environment variables
 * Throws an error with details if validation fails
 */
function validateEnv(): Env {
  const env = {
    // Client-side variables
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
    NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY: process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY,
    NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
    
    // Server-side variables (only available on server)
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
    CONVEX_DEPLOYMENT: process.env.CONVEX_DEPLOYMENT,
    LIVEBLOCKS_SECRET_KEY: process.env.LIVEBLOCKS_SECRET_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    
    // System
    NODE_ENV: process.env.NODE_ENV || 'development',
  };

  try {
    return envSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues
        .map((err: z.ZodIssue) => `  ❌ ${err.path.join('.')}: ${err.message}`)
        .join('\n');
      
      throw new Error(
        `\n❌ Invalid environment variables:\n\n${missingVars}\n\nPlease check your .env.local file.\nSee ENVIRONMENT_VARIABLES.md for required variables.\n`
      );
    }
    throw error;
  }
}

// Validate on module load (server-side only)
let validatedEnv: Env;

if (typeof window === 'undefined') {
  // Server-side validation
  validatedEnv = validateEnv();
} else {
  // Client-side: only validate public variables
  const clientEnv = {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
    NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY: process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY,
    NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
    NODE_ENV: process.env.NODE_ENV || 'development',
  };
  
  const clientSchema = envSchema.pick({
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: true,
    NEXT_PUBLIC_CONVEX_URL: true,
    NODE_ENV: true,
  }).extend({
    NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY: z.string().optional(),
    NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: z.string().optional(),
  });
  
  try {
    validatedEnv = clientSchema.parse(clientEnv) as Env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid public environment variables:', error.issues);
    }
    throw error;
  }
}

// Export validated environment variables
export const env = validatedEnv;

// Helper function to check if running on server
export const isServer = typeof window === 'undefined';

// Helper to safely get server-only env vars
export function getServerEnv<K extends keyof Env>(key: K): Env[K] | undefined {
  if (!isServer) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`⚠️ Attempted to access server-only env var "${key}" on client`);
    }
    return undefined;
  }
  return env[key];
}
