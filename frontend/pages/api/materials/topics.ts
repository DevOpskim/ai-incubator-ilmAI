import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
  // TODO: Implement topics endpoint when topics backend route exists.
  // For now, return empty list — the materials page handles this gracefully.
  return NextResponse.json([]);
}
