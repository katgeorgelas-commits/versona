"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { searchMentionable, type Mentionable } from "@/features/mentions/actions";

/**
 * Text field with @mention autocomplete. Renders an <input> (single-line) or
 * <textarea> (multiline). Typing "@" + letters opens a people dropdown; selecting
 * inserts "@username ". Enter submits only when the dropdown is closed.
 */
export function MentionInput({
  value,
  onChange,
  onSubmit,
  placeholder,
  multiline = false,
  rows = 3,
  autoFocus,
  className,
  inputRef: externalRef,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  autoFocus?: boolean;
  className?: string;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const internalRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const ref = (externalRef ?? internalRef) as React.RefObject<HTMLInputElement & HTMLTextAreaElement>;
  const [suggestions, setSuggestions] = useState<Mentionable[]>([]);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const tokenStart = useRef<number | null>(null);

  // Detect an @token ending at the caret.
  function checkToken(text: string, caret: number) {
    const upTo = text.slice(0, caret);
    const m = upTo.match(/(^|\s)@(\w{0,30})$/);
    if (m) {
      tokenStart.current = caret - m[2].length - 1; // index of '@'
      void searchMentionable(m[2]).then((s) => {
        setSuggestions(s);
        setOpen(s.length > 0);
        setActive(0);
      });
    } else {
      setOpen(false);
      tokenStart.current = null;
    }
  }

  function handleChange(v: string) {
    onChange(v);
    const caret = ref.current?.selectionStart ?? v.length;
    checkToken(v, caret);
  }

  function pick(s: Mentionable) {
    if (tokenStart.current == null) return;
    const caret = ref.current?.selectionStart ?? value.length;
    const before = value.slice(0, tokenStart.current);
    const after = value.slice(caret);
    const next = `${before}@${s.username} ${after}`;
    onChange(next);
    setOpen(false);
    tokenStart.current = null;
    // Restore focus + caret after the inserted mention.
    requestAnimationFrame(() => {
      const pos = before.length + s.username.length + 2;
      ref.current?.focus();
      ref.current?.setSelectionRange(pos, pos);
    });
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (open && suggestions.length) {
      if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % suggestions.length); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a - 1 + suggestions.length) % suggestions.length); return; }
      if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); pick(suggestions[active]); return; }
      if (e.key === "Escape") { setOpen(false); return; }
    }
    if (e.key === "Enter" && !e.shiftKey && onSubmit && (!multiline || !open)) {
      if (!multiline) { e.preventDefault(); onSubmit(); }
    }
  }

  useEffect(() => {
    function onDocClick() { setOpen(false); }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const shared = {
    ref,
    value,
    autoFocus,
    placeholder,
    spellCheck: true,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => handleChange(e.target.value),
    onKeyDown,
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
    className: cn(
      "w-full border-1.5 border-line bg-bg text-ink-1 placeholder:text-ink-3 focus:border-accent focus:outline-none",
      className,
    ),
  };

  return (
    <div className="relative">
      {multiline ? (
        <textarea {...shared} rows={rows} />
      ) : (
        <input {...shared} type="text" />
      )}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-lg border-1.5 border-line bg-bg" onClick={(e) => e.stopPropagation()}>
          {suggestions.map((s, i) => (
            <button
              key={s.username}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(s)}
              className={cn("flex w-full items-center gap-2 px-3 py-2 text-left", i === active ? "bg-bg-muted" : "")}
            >
              <Avatar name={s.displayName} src={s.avatarUrl} size={26} online={s.online} />
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-semibold text-ink-1">{s.displayName}</span>
                <span className="block truncate text-[11px] text-ink-3">@{s.username}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
