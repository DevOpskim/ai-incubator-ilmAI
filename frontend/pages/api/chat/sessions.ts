import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || "http://backend:8000";

export async function GET(request: NextRequest) {
  try {
    const headers: Record<string, string> = {};
    const cookie = request.headers.get("cookie");
    if (cookie) headers["Cookie"] = cookie;

    const response = await fetch(`${BACKEND_URL}/chat/sessions`, { headers });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Chat sessions list error:", error);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const cookie = request.headers.get("cookie");
    if (cookie) headers["Cookie"] = cookie;

    const response = await fetch(`${BACKEND_URL}/chat/sessions`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();
    const nextResponse = NextResponse.json(data, { status: response.status });

    const setCookie = response.headers.get("set-cookie");
    if (setCookie) nextResponse.headers.set("Set-Cookie", setCookie);

    return nextResponse;
  } catch (error) {
    console.error("Chat session create error:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
