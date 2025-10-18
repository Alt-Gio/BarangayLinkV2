import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { valid: false, message: "Invitation code is required" },
        { status: 400 }
      );
    }

    // Validate invitation using Convex query
    const result = await convex.query(api.userApproval.validateInvitation, {
      token,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error validating invitation:", error);
    return NextResponse.json(
      { valid: false, message: "Failed to validate invitation" },
      { status: 500 }
    );
  }
}
