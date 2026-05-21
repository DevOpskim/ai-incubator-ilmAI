import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || "http://backend:8000";

export async function GET(request: NextRequest) {
  try {
    const headers: Record<string, string> = {};
    const cookie = request.headers.get("cookie");
    if (cookie) headers["Cookie"] = cookie;

    const response = await fetch(`${BACKEND_URL}/flashcards/due`, { headers });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Flashcard due error:", error);
    return NextResponse.json({ error: "Failed to fetch due cards" }, { status: 500 });
  }
}
