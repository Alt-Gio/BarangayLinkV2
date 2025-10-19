import { auth, currentUser } from '@clerk/nextjs/server'
import { Liveblocks } from '@liveblocks/node'

export async function POST(req: Request) {
  console.log('🔐 Liveblocks auth request received');
  console.log('📋 Request headers:', Object.fromEntries(req.headers.entries()));
  
  // Check if Liveblocks secret key is configured
  if (!process.env.LIVEBLOCKS_SECRET_KEY) {
    console.error('❌ LIVEBLOCKS_SECRET_KEY environment variable is not set');
    return new Response('Liveblocks not configured', { status: 500 })
  }
  
  try {
    // Use Clerk to get the session for the current user.
    // Return a 401 response if not authenticated
    console.log('🔍 Attempting to get auth from Clerk...');
    const authResult = await auth()
    console.log('🔍 Auth result:', authResult);
    const userId = authResult?.userId
    console.log('👤 Clerk userId:', userId);
    
    if (!userId) {
      console.log('❌ No userId from Clerk auth');
      console.log('💡 Tip: Make sure you are logged in and the session is active');
      return new Response('Not authorized', { status: 401 })
    }

    // Use Clerk to get more details about the current user.
    console.log('🔍 Getting current user details...');
    const user = await currentUser()
    console.log('👤 Current user:', user?.id, user?.fullName);
    
    if (!user) {
      console.log('❌ No user from Clerk currentUser');
      return new Response('Not authorized', { status: 401 })
    }

    // Parse the room ID from the request
    let room;
    try {
      const body = await req.json()
      room = body.room
      console.log('🏠 Room ID:', room);
    } catch (error) {
      console.error('❌ Error parsing request body:', error);
      return new Response('Invalid request body', { status: 400 })
    }
    
    if (!room) {
      console.log('❌ No room ID provided');
      return new Response('Room ID required', { status: 400 })
    }

    // Basic room access validation - you can add more specific logic here
    // For now, we'll allow authenticated users to access rooms
    
    // All security checks passed so create the session and include the name and
    // avatar of the user, which will be shown within Liveblocks components
    console.log('🔧 Creating Liveblocks session for user:', user.id);
    
    const liveblocks = new Liveblocks({
      secret: process.env.LIVEBLOCKS_SECRET_KEY as string,
    })
    
    const session = liveblocks.prepareSession(user.id, {
      userInfo: {
        name: user.fullName || user.firstName || user.emailAddresses?.[0]?.emailAddress || 'Anonymous',
        avatar: user.imageUrl || '',
        role: 'user', // Add role for comments
      },
    })
    
    // Allow full access including comments/threads
    session.allow(room, session.FULL_ACCESS)
    
    // Explicitly allow comments permissions (required for threads)
    session.allow(room, ['room:write', 'comments:write'])
    
    console.log('✅ Session prepared with comments permissions, authorizing...');
    
    const { body: responseBody, status } = await session.authorize()
    console.log('✅ Liveblocks session authorized with status:', status);

    // Return the response
    return new Response(responseBody, { status })
  } catch (error) {
    console.error('❌ Error creating Liveblocks session:', error);
    return new Response('Internal server error', { status: 500 })
  }
}