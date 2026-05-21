import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || "http://backend:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headers: Record<string, string> = { "Content-Type": "application/json" };

    const response = await fetch(`${BACKEND_URL}/auth/verify-registration`, {
      method: "POST", headers, body: JSON.stringify(body),
    });

    const data = await response.json();
    const nextResponse = NextResponse.json(data, { status: response.status });

    const setCookie = response.headers.get("set-cookie");
    if (setCookie) nextResponse.headers.set("Set-Cookie", setCookie);

    return nextResponse;
  } catch (error) {
    console.error("Verify registration error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
