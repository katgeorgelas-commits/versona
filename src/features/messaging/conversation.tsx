"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, SendHorizonal } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn, timeAgo } from "@/lib/utils";
import { sendMessage, acceptThread, markThreadRead } from "./actions";
import type { ThreadView, MessageView } from "@/types/views";

export function Conversation({
  thread,
  initialMessages,
  viewerId,
}: {
  thread: ThreadView;
  initialMessages: MessageView[];
  viewerId: string;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [state, setState] = useState(thread.state);
  const [text, setText] = useState("");
  const [, startTransition] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);

  // Mark the thread read on open.
  useEffect(() => {
    void markThreadRead(thread.id);
  }, [thread.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // A request the viewer received and hasn't accepted yet.
  const pendingIncoming = state === "request" && !thread.initiatedByMe;

  function send() {
    const body = text.trim();
    if (!body) return;
    setText("");
    setMessages((prev) => [
      ...prev,
      {
        id: `local-${prev.length}`,
        threadId: thread.id,
        senderId: viewerId,
        mine: true,
        body,
        createdAt: new Date().toISOString(),
        readAt: null,
        reactions: [],
      },
    ]);
    startTransition(async () => {
      await sendMessage(thread.id, body);
      router.refresh();
    });
  }

  function accept() {
    setState("accepted");
    startTransition(() => {
      void acceptThread(thread.id);
    });
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border pb-3">
        <Link href="/messages" className="md:hidden">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Link href={`/${thread.other.username}`} className="flex items-center gap-2">
          <Avatar name={thread.other.displayName} src={thread.other.avatarUrl} size={36} />
          <div>
            <div className="font-semibold leading-tight">{thread.other.displayName}</div>
            <div className="text-xs text-muted-foreground">@{thread.other.username}</div>
          </div>
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-2 overflow-y-auto py-4">
        {messages.map((m) => (
          <div key={m.id} className={cn("flex", m.mine ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm",
                m.mine
                  ? "rounded-br-sm bg-primary text-primary-foreground"
                  : "rounded-bl-sm bg-muted",
              )}
            >
              <p className="whitespace-pre-wrap">{m.body}</p>
              <span className={cn("mt-0.5 block text-[10px]", m.mine ? "text-white/70" : "text-ink-3")}>
                {timeAgo(m.createdAt)}
                {m.mine && m.readAt ? " · Read" : ""}
              </span>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Composer / request gate */}
      {pendingIncoming ? (
        <div className="border-t border-border pt-3 text-center">
          <p className="mb-2 text-sm text-muted-foreground">
            {thread.other.displayName} sent you a message request.
          </p>
          <Button size="sm" onClick={accept}>Accept &amp; reply</Button>
        </div>
      ) : (
        <div className="flex items-end gap-2 border-t border-border pt-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            maxLength={4000}
            placeholder={state === "request" ? "Message sent — waiting for them to accept…" : "Message…"}
            className="h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm"
          />
          <Button size="icon" onClick={send} disabled={!text.trim()} aria-label="Send">
            <SendHorizonal className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
