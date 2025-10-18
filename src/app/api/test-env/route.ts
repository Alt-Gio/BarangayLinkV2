import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
    hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
    hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
    projectId: process.env.FIREBASE_PROJECT_ID || 'MISSING',
    clientEmailPreview: process.env.FIREBASE_CLIENT_EMAIL?.substring(0, 20) + '...' || 'MISSING',
    privateKeyPreview: process.env.FIREBASE_PRIVATE_KEY?.substring(0, 30) + '...' || 'MISSING',
  });
}
