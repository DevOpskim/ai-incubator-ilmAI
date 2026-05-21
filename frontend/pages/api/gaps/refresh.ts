import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || "http://backend:8000";

export async function POST(request: NextRequest) {
  try {
    const headers: Record<string, string> = {};
    const cookie = request.headers.get("cookie");
    if (cookie) headers["Cookie"] = cookie;

    const response = await fetch(`${BACKEND_URL}/gaps/refresh`, {
      method: "POST", headers,
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Gap refresh error:", error);
    return NextResponse.json({ error: "Failed to refresh report" }, { status: 500 });
  }
}
