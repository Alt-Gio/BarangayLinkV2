import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

export async function GET() {
  try {
    // Check if already initialized
    if (admin.apps.length > 0) {
      return NextResponse.json({
        status: 'success',
        initialized: true,
        appName: admin.apps[0]?.name,
        message: '✅ Firebase Admin is initialized and ready!',
      });
    }

    // Try to initialize
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      return NextResponse.json({
        status: 'error',
        initialized: false,
        message: '❌ Missing Firebase Admin credentials',
        hasProjectId: !!projectId,
        hasClientEmail: !!clientEmail,
        hasPrivateKey: !!privateKey,
      });
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });

    return NextResponse.json({
      status: 'success',
      initialized: true,
      message: '✅ Firebase Admin initialized successfully!',
    });

  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      initialized: false,
      message: '❌ Firebase Admin initialization failed',
      error: error.message,
    });
  }
}
