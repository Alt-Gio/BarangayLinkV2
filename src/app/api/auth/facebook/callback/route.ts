import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.redirect(
        new URL("/login?error=unauthorized", request.url)
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      console.error("Facebook OAuth error:", error);
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head><title>Facebook Login Error</title></head>
          <body>
            <script>
              window.opener.postMessage(
                { type: 'FACEBOOK_AUTH_ERROR', error: '${error}' },
                window.location.origin
              );
              window.close();
            </script>
          </body>
        </html>
        `,
        { headers: { "Content-Type": "text/html" } }
      );
    }

    if (!code) {
      return new NextResponse("Missing authorization code", { status: 400 });
    }

    // Exchange code for access token
    const fbAppId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    const fbAppSecret = process.env.FACEBOOK_APP_SECRET;
    const redirectUri = `${request.nextUrl.origin}/api/auth/facebook/callback`;

    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${fbAppId}&` +
      `client_secret=${fbAppSecret}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `code=${code}`
    );

    if (!tokenResponse.ok) {
      throw new Error("Failed to exchange code for token");
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get user info from Facebook
    const userResponse = await fetch(
      `https://graph.facebook.com/me?fields=id,name,picture&access_token=${accessToken}`
    );

    if (!userResponse.ok) {
      throw new Error("Failed to get user info");
    }

    const userData = await userResponse.json();

    // Get pages managed by the user (optional, for page messaging)
    const pagesResponse = await fetch(
      `https://graph.facebook.com/me/accounts?access_token=${accessToken}`
    );

    let pageAccessToken = null;
    let pageId = null;

    if (pagesResponse.ok) {
      const pagesData = await pagesResponse.json();
      if (pagesData.data && pagesData.data.length > 0) {
        // Use the first page
        pageAccessToken = pagesData.data[0].access_token;
        pageId = pagesData.data[0].id;
      }
    }

    // Store connection in Convex
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    const convexResponse = await fetch(`${convexUrl}/api/facebook/connect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: userId,
        facebookUserId: userData.id,
        facebookName: userData.name,
        facebookProfilePic: userData.picture?.data?.url,
        accessToken: accessToken,
        pageAccessToken: pageAccessToken,
        pageId: pageId,
        tokenExpiresAt: tokenData.expires_in 
          ? Date.now() + tokenData.expires_in * 1000 
          : undefined,
      }),
    });

    if (!convexResponse.ok) {
      throw new Error("Failed to store Facebook connection");
    }

    // Close popup and notify parent window
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head><title>Facebook Connected</title></head>
        <body>
          <script>
            window.opener.postMessage(
              { type: 'FACEBOOK_AUTH_SUCCESS' },
              window.location.origin
            );
            window.close();
          </script>
          <p>Facebook connected successfully! You can close this window.</p>
        </body>
      </html>
      `,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (error) {
    console.error("Facebook callback error:", error);
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head><title>Facebook Login Error</title></head>
        <body>
          <script>
            window.opener.postMessage(
              { type: 'FACEBOOK_AUTH_ERROR', error: 'Connection failed' },
              window.location.origin
            );
            window.close();
          </script>
          <p>Failed to connect Facebook. Please try again.</p>
        </body>
      </html>
      `,
      { headers: { "Content-Type": "text/html" } }
    );
  }
}
