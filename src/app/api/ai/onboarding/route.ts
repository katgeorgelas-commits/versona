import { NextResponse } from "next/server";
import { z } from "zod";
import { anthropic, VERSONA_MODEL } from "@/lib/anthropic/client";
import { createServiceClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import {
  OPENING_MESSAGE,
  hasAnthropicKey,
  onboardingTool,
  scriptedTurn,
  systemPrompt,
  type ChatTurn,
  type OnboardingTurnResult,
} from "@/features/onboarding/engine";

export const runtime = "nodejs";

const Body = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["assistant", "user"]),
        content: z.string().max(4000),
      }),
    )
    .max(60),
});

/**
 * POST /api/ai/onboarding — conversational onboarding engine (PRD §3.1, §3.6).
 * Stateless: the client sends the full transcript each turn; we return the next
 * assistant message + cumulative extraction + progress. AI never posts for the
 * user; everything extracted is reviewed before it becomes their profile.
 */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const history = parsed.data.messages as ChatTurn[];

  // First turn: deterministic warm opening (no model call).
  if (!history.some((t) => t.role === "user")) {
    const opening: OnboardingTurnResult = {
      message: OPENING_MESSAGE,
      topics_covered: [],
      extracted: {},
      is_complete: false,
      mode: hasAnthropicKey() ? "ai" : "scripted",
    };
    return NextResponse.json(opening);
  }

  // Scripted fallback when no real key is configured — keeps the flow demoable.
  if (!hasAnthropicKey()) {
    return NextResponse.json(scriptedTurn(history));
  }

  // ── Claude mode ──────────────────────────────────────────────────────────
  const db = createServiceClient();
  const { data: missions } = await db
    .from("missions")
    .select("slug, name")
    .eq("is_active", true)
    .order("display_order");
  const missionList = missions ?? [];

  try {
    const res = await anthropic.messages.create({
      model: VERSONA_MODEL,
      max_tokens: 1024,
      system: systemPrompt(missionList),
      tools: [onboardingTool(missionList)],
      tool_choice: { type: "tool", name: "onboarding_turn" },
      messages: history.map((t) => ({ role: t.role, content: t.content })),
    });

    const toolUse = res.content.find(
      (b): b is Extract<typeof b, { type: "tool_use" }> => b.type === "tool_use",
    );
    if (!toolUse) {
      return NextResponse.json({ error: "no_tool_output" }, { status: 502 });
    }

    const input = toolUse.input as {
      message: string;
      topics_covered?: string[];
      extracted?: Record<string, unknown>;
      is_complete?: boolean;
    };

    const result: OnboardingTurnResult = {
      message: input.message,
      topics_covered: (input.topics_covered ??
        []) as OnboardingTurnResult["topics_covered"],
      extracted: (input.extracted ?? {}) as OnboardingTurnResult["extracted"],
      is_complete: !!input.is_complete,
      mode: "ai",
    };
    return NextResponse.json(result);
  } catch (err) {
    console.error("[onboarding] anthropic error", err);
    return NextResponse.json({ error: "ai_unavailable" }, { status: 502 });
  }
}
