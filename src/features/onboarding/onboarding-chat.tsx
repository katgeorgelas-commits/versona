"use client";

import { useEffect, useRef, useState } from "react";
import { SendHorizonal, SkipForward, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ONBOARDING_TOPICS, onboardingProgress } from "./topics";
import { EMPTY_EXTRACTION, type ChatTurn, type OnboardingExtraction } from "./engine";
import { OnboardingReview } from "./onboarding-review";

type MissionOption = {
  slug: string;
  name: string;
  brief: string;
  accent_color: string;
};

/** Merge a turn's partial extraction into the running profile (non-empty wins). */
function mergeExtraction(
  base: OnboardingExtraction,
  patch: Partial<OnboardingExtraction>,
): OnboardingExtraction {
  const next = { ...base };
  for (const [k, v] of Object.entries(patch) as [
    keyof OnboardingExtraction,
    OnboardingExtraction[keyof OnboardingExtraction],
  ][]) {
    if (Array.isArray(v)) {
      if (v.length) (next[k] as string[]) = v as string[];
    } else if (typeof v === "string" && v.trim()) {
      (next[k] as string) = v;
    }
  }
  return next;
}

export function OnboardingChat({
  username,
  missions,
}: {
  username: string;
  missions: MissionOption[];
}) {
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [topicsCovered, setTopicsCovered] = useState<string[]>([]);
  const [extraction, setExtraction] = useState<OnboardingExtraction>(EMPTY_EXTRACTION);
  const [suggestedSlugs, setSuggestedSlugs] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);
  const [mode, setMode] = useState<"ai" | "scripted">("ai");
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  async function turn(history: ChatTurn[]) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setMessages([...history, { role: "assistant", content: data.message }]);
      setMode(data.mode ?? "ai");
      if (data.topics_covered?.length) {
        setTopicsCovered((prev) => Array.from(new Set([...prev, ...data.topics_covered])));
      }
      if (data.extracted) {
        setExtraction((prev) => mergeExtraction(prev, data.extracted));
        if (data.extracted.suggested_mission_slugs?.length) {
          setSuggestedSlugs(data.extracted.suggested_mission_slugs);
        }
      }
      if (data.is_complete) setComplete(true);
    } catch {
      setError("I lost my train of thought for a second. Mind sending that again?");
    } finally {
      setLoading(false);
    }
  }

  // Kick off with the opening message once.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void turn([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const history: ChatTurn[] = [...messages, { role: "user", content: trimmed }];
    setMessages(history);
    setInput("");
    void turn(history);
  }

  const progress = onboardingProgress(topicsCovered);

  if (complete) {
    return (
      <OnboardingReview
        username={username}
        missions={missions}
        extraction={extraction}
        suggestedSlugs={suggestedSlugs}
        transcript={messages}
      />
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-5rem)] max-w-2xl flex-col">
      {/* Progress */}
      <div className="px-4 pb-3">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Building your profile
            {mode === "scripted" && (
              <span className="ml-1 rounded-sm bg-bg-muted px-1.5 py-0.5 text-[10px]">
                demo mode · add an API key for live AI
              </span>
            )}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-muted">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {ONBOARDING_TOPICS.map((t) => {
            const done = topicsCovered.includes(t.key);
            return (
              <span
                key={t.key}
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors",
                  done
                    ? "bg-accent-light text-accent"
                    : "bg-bg-muted text-ink-3",
                )}
                title={t.hint}
              >
                {t.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Conversation */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[85%] whitespace-pre-wrap rounded-xl px-4 py-2.5 text-sm leading-[1.55]",
                m.role === "user"
                  ? "rounded-br-sm bg-accent text-white"
                  : "rounded-bl-sm bg-bg-muted text-ink-1",
              )}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex gap-1 rounded-xl rounded-bl-sm bg-bg-muted px-4 py-3">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-2 w-2 animate-pulse rounded-full bg-accent"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>
        )}
        {error && <p className="text-center text-sm text-destructive">{error}</p>}
      </div>

      {/* Composer */}
      <div className="border-t-1.5 border-line bg-bg px-4 py-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Type your answer…  (Shift+Enter for a new line)"
            rows={1}
            className="max-h-32 min-h-[2.5rem] resize-none"
            disabled={loading || messages.length === 0}
          />
          <Button
            size="icon"
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            aria-label="Send"
          >
            <SendHorizonal className="h-5 w-5" />
          </Button>
        </div>
        <button
          onClick={() => send("Skip — I'd rather not answer that one.")}
          disabled={loading || messages.length === 0}
          className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          <SkipForward className="h-3.5 w-3.5" />
          Skip this one
        </button>
      </div>
    </div>
  );
}
