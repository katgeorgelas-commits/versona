import { NextResponse } from "next/server";

/** Liveness probe — confirms the app and its env wiring are present. */
export function GET() {
  return NextResponse.json({
    ok: true,
    service: "versona",
    mockAuth: process.env.NEXT_PUBLIC_USE_MOCK_AUTH === "true",
    model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
  });
}
