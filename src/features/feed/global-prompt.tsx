"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { createPost } from "./actions";

/** Community-wide weekly prompt — shown on the Versona Asks circle page. */
export function GlobalPromptCard({ prompt }: { prompt: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();

  function submit() {
    const text = body.trim();
    if (!text) return;
    start(async () => {
      const res = await createPost({ type: "prompt_response", body: text, topics: [] });
      if (res.ok) {
        setBody("");
        setOpen(false);
        toast("Answer shared", "success");
        router.refresh();
      }
    });
  }

  return (
    <div className="rounded-lg border-1.5 border-line bg-bg p-5">
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-accent">
        <Sparkles className="h-3.5 w-3.5" /> This week&apos;s prompt
      </div>
      <p className="text-[16px] font-semibold leading-snug text-ink-1">{prompt}</p>

      {open ? (
        <div className="mt-3">
          <Textarea
            autoFocus
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            maxLength={1500}
            placeholder="Share your answer with the community…"
            className="resize-none"
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => { setOpen(false); setBody(""); }}>Cancel</Button>
            <Button size="sm" onClick={submit} disabled={pending || !body.trim()}>Share answer</Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="outline" className="mt-3" onClick={() => setOpen(true)}>
          Share your answer
        </Button>
      )}
    </div>
  );
}
