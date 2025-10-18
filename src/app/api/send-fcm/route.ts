import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK (singleton pattern)
if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      console.error('❌ Missing Firebase Admin credentials');
    } else {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
      console.log('✅ Firebase Admin initialized');
    }
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token, title, body, url, icon, badge, tag, requireInteraction, actions } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Missing FCM token' }, { status: 400 });
    }

    if (!admin.apps.length) {
      return NextResponse.json(
        { error: 'Firebase Admin not initialized. Check environment variables.' },
        { status: 500 }
      );
    }

    // Send FCM message
    const message: admin.messaging.Message = {
      token,
      notification: {
        title: title || 'Notification',
        body: body || '',
      },
      webpush: {
        notification: {
          icon: icon || '/icon-192x192.png',
          badge: badge || '/badge-72x72.png',
          tag: tag,
          requireInteraction: requireInteraction || false,
          actions: actions || [],
        },
        fcmOptions: {
          link: url || '/',
        },
      },
    };

    const response = await admin.messaging().send(message);
    
    console.log('✅ FCM notification sent:', response);

    return NextResponse.json({ 
      success: true, 
      messageId: response 
    });

  } catch (error: any) {
    console.error('❌ FCM send error:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to send notification',
        details: error.code || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
