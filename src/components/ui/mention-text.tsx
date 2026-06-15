import Link from "next/link";

const MENTION = /@([a-z0-9_]{2,30})/gi;

/** Renders plain text with @mentions linked to profiles. */
export function MentionText({ text, className }: { text: string; className?: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  MENTION.lastIndex = 0;
  while ((m = MENTION.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const username = m[1];
    parts.push(
      <Link key={`${m.index}-${username}`} href={`/${username}`} className="font-medium text-accent hover:underline">
        @{username}
      </Link>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <span className={className}>{parts}</span>;
}
