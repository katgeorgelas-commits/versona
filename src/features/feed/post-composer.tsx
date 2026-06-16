"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Bold, ImagePlus, Italic, List, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MentionInput } from "@/components/ui/mention-input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { POST_TYPES } from "@/config/reactions";
import { POST_MAX } from "@/lib/utils";
import type { PostType } from "@/types/app";
import type { SessionUser } from "@/types/app";
import { createPost } from "./actions";

const TYPES: PostType[] = ["discussion", "question", "update", "prompt_response"];

/** Card box by default; a plain padded div when flush (inside a feed column). */
function ComposerShell({
  flush,
  pad,
  children,
}: {
  flush: boolean;
  pad: string;
  children: React.ReactNode;
}) {
  if (flush) return <div className={pad}>{children}</div>;
  return (
    <Card>
      <CardContent className={pad}>{children}</CardContent>
    </Card>
  );
}

export function PostComposer({
  user,
  missions,
  defaultMissionSlug,
  weeklyPromptId,
  lockMission = false,
  flush = false,
}: {
  user: SessionUser;
  missions: { slug: string; name: string }[];
  defaultMissionSlug?: string;
  weeklyPromptId?: string;
  lockMission?: boolean;
  /** Drop the Card box so the composer sits flush inside a feed column. */
  flush?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [type, setType] = useState<PostType>(weeklyPromptId ? "prompt_response" : "discussion");
  const [body, setBody] = useState("");
  const [missionSlug, setMissionSlug] = useState(defaultMissionSlug ?? "");
  const [_topics] = useState("");
  const [pollOn, setPollOn] = useState(false);
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [expanded, setExpanded] = useState(false);
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function wrapSelection(prefix: string, suffix: string) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = body.slice(start, end);
    const wrapped = prefix + (selected || "text") + suffix;
    const next = body.slice(0, start) + wrapped + body.slice(end);
    setBody(next.slice(0, POST_MAX));
    requestAnimationFrame(() => {
      el.focus();
      const newCursorStart = start + prefix.length;
      const newCursorEnd = newCursorStart + (selected || "text").length;
      el.setSelectionRange(newCursorStart, newCursorEnd);
    });
  }

  function insertList() {
    const el = textareaRef.current;
    if (!el) return;
    const pos = el.selectionStart;
    const before = body.slice(0, pos);
    const after = body.slice(pos);
    const prefix = before.length > 0 && !before.endsWith("\n") ? "\n" : "";
    const insert = prefix + "- ";
    const next = before + insert + after;
    setBody(next.slice(0, POST_MAX));
    requestAnimationFrame(() => {
      el.focus();
      const newPos = pos + insert.length;
      el.setSelectionRange(newPos, newPos);
    });
  }

  function submit() {
    const text = body.trim();
    if (!text) return;
    const opts = pollOn ? pollOptions.map((o) => o.trim()).filter(Boolean) : [];
    startTransition(async () => {
      const res = await createPost({
        type,
        body: text,
        missionSlug: missionSlug || undefined,
        weeklyPromptId: type === "prompt_response" ? weeklyPromptId : undefined,
        pollOptions: opts.length >= 2 ? opts : undefined,
        topics: [],
        imageUrl: imagePreview ?? undefined,
      });
      if (res.ok) {
        setBody("");
        setPollOn(false);
        setPollOptions(["", ""]);
        setImagePreview(null);
        setExpanded(false);
        toast("Posted", "success");
        setNotice(
          res.aiFlagged
            ? "Posted — heads up: this read as AI-generated, so it'll rank lower."
            : null,
        );
        router.refresh();
      }
    });
  }

  if (!expanded) {
    return (
      <ComposerShell flush={flush} pad="p-3">
        <button onClick={() => setExpanded(true)} className="flex w-full items-center gap-3 text-left">
          <Avatar name={user.displayName} src={user.avatarUrl} size={40} />
          <span className="flex-1 rounded-full border-1.5 border-line bg-bg-muted px-4 py-2.5 text-[14px] text-ink-3">
            Share something with the community…
          </span>
        </button>
      </ComposerShell>
    );
  }

  return (
    <ComposerShell flush={flush} pad="p-4">
        <div className="flex gap-3">
          <Avatar name={user.displayName} src={user.avatarUrl} size={40} />
          <div className="flex-1">
            {/* Type selector */}
            <div className="mb-2 flex flex-wrap gap-1.5">
              {TYPES.filter((t) => t !== "prompt_response" || weeklyPromptId).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[12px] font-semibold transition-colors",
                    type === t
                      ? "bg-accent-light text-accent"
                      : "text-ink-3 hover:bg-bg-muted hover:text-ink-1",
                  )}
                >
                  {POST_TYPES[t].label}
                </button>
              ))}
            </div>

            <div className="mb-1 flex items-center gap-0.5">
              <button type="button" onClick={() => wrapSelection("**", "**")} title="Bold" className="flex h-7 w-7 items-center justify-center rounded text-ink-3 transition-colors hover:bg-bg-muted hover:text-ink-1">
                <Bold className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={() => wrapSelection("*", "*")} title="Italic" className="flex h-7 w-7 items-center justify-center rounded text-ink-3 transition-colors hover:bg-bg-muted hover:text-ink-1">
                <Italic className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={insertList} title="Bullet list" className="flex h-7 w-7 items-center justify-center rounded text-ink-3 transition-colors hover:bg-bg-muted hover:text-ink-1">
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
            <MentionInput
              value={body}
              onChange={(v) => setBody(v.slice(0, POST_MAX))}
              inputRef={textareaRef}
              multiline
              autoFocus
              rows={3}
              placeholder={`${POST_TYPES[type].hint}  Use @ to mention, # to tag.`}
              className="resize-none rounded-md px-3.5 py-2.5 text-sm"
            />

            {/* Poll builder */}
            {pollOn && (
              <div className="mt-2 space-y-1.5">
                {pollOptions.map((o, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={o}
                      onChange={(e) => setPollOptions((p) => p.map((x, j) => (j === i ? e.target.value : x)))}
                      placeholder={`Option ${i + 1}`}
                      maxLength={80}
                      className="h-9 flex-1 rounded-md border-1.5 border-line bg-bg px-3 text-[13px] focus:border-accent focus:outline-none"
                    />
                    {pollOptions.length > 2 && (
                      <button onClick={() => setPollOptions((p) => p.filter((_, j) => j !== i))} className="text-ink-3 hover:text-ink-1"><X className="h-4 w-4" /></button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 4 && (
                  <button onClick={() => setPollOptions((p) => [...p, ""])} className="text-[12px] font-semibold text-accent hover:text-accent-hover">+ Add option</button>
                )}
              </div>
            )}

            {imagePreview && (
              <div className="relative mt-2 inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Upload preview" className="max-h-40 rounded-lg border-1.5 border-line object-cover" />
                <button onClick={() => { setImagePreview(null); if (fileRef.current) fileRef.current.value = ""; }} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                onClick={() => setPollOn((v) => !v)}
                title="Add a poll"
                className={cn("flex h-9 w-9 items-center justify-center rounded-md border-1.5 transition-colors", pollOn ? "border-accent text-accent" : "border-line text-ink-3 hover:text-ink-1")}
              >
                <BarChart3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                title="Add an image"
                className={cn("flex h-9 w-9 items-center justify-center rounded-md border-1.5 transition-colors", imagePreview ? "border-accent text-accent" : "border-line text-ink-3 hover:text-ink-1")}
              >
                <ImagePlus className="h-4 w-4" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
              {!lockMission && (
                <Select
                  value={missionSlug}
                  onChange={setMissionSlug}
                  placeholder="No mission"
                  className="w-40"
                  options={[
                    { value: "", label: "No mission" },
                    ...missions.map((m) => ({ value: m.slug, label: m.name })),
                  ]}
                />
              )}
              <span className="text-[11px] text-ink-3">
                {body.length}/{POST_MAX}
              </span>
              <Button size="sm" variant="ghost" onClick={() => { setExpanded(false); setBody(""); setPollOn(false); }}>
                Cancel
              </Button>
              <Button size="sm" onClick={submit} disabled={pending || !body.trim()}>
                {POST_TYPES[type].verb}
              </Button>
            </div>
            {notice && <p className="mt-2 text-xs text-muted-foreground">{notice}</p>}
          </div>
        </div>
    </ComposerShell>
  );
}
