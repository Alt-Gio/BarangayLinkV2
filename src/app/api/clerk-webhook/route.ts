import { WebhookEvent } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../../../convex/_generated/api'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function POST(req: Request) {
  try {
    // Get the body
    const payload = await req.text()
    const body = JSON.parse(payload)

    // For development, we'll skip webhook verification
    // In production, you should implement proper webhook verification
    const evt = body as WebhookEvent

  // Handle the webhook
  const eventType = evt.type

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data

    try {
      // Create user in Convex database
      await convex.mutation(api.databaseManager.syncUserFromClerk, {
        clerkId: id,
        email: email_addresses[0]?.email_address || '',
        name: `${first_name || ''} ${last_name || ''}`.trim() || 'Unknown User',
        imageUrl: image_url || '',
      })

      console.log(`✅ User ${email_addresses[0]?.email_address} synced to Convex`)
    } catch (error) {
      console.error('❌ Failed to sync user to Convex:', error)
      return new Response('Error syncing user', { status: 500 })
    }
  }

  if (eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data

    try {
      // Update user in Convex database
      await convex.mutation(api.databaseManager.syncUserFromClerk, {
        clerkId: id,
        email: email_addresses[0]?.email_address || '',
        name: `${first_name || ''} ${last_name || ''}`.trim() || 'Unknown User',
        imageUrl: image_url || '',
      })

      console.log(`✅ User ${email_addresses[0]?.email_address} updated in Convex`)
    } catch (error) {
      console.error('❌ Failed to update user in Convex:', error)
      return new Response('Error updating user', { status: 500 })
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data

    try {
      // Note: You might want to soft-delete or archive users instead of hard delete
      // For now, we'll just log it
      console.log(`🗑️ User ${id} deleted from Clerk (consider implementing soft delete in Convex)`)
    } catch (error) {
      console.error('❌ Failed to handle user deletion:', error)
    }
  }

  return new Response('', { status: 200 })
  } catch (error) {
    console.error('❌ Webhook error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}
