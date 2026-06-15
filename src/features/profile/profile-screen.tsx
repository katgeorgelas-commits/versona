"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Camera, Pencil, UserPlus, UserCheck, Clock, MessageCircle, Lock, Link2, Sparkles, ThumbsUp, GraduationCap, Briefcase, Award, Grid3X3, User,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tag } from "@/components/ui/tag";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { CompletenessRing } from "@/components/ui/completeness-ring";
import { cn, timeAgo, spacePath } from "@/lib/utils";
import { POST_TYPES } from "@/config/reactions";
import type { ProfileView } from "@/types/views";
import type { ContributionItem } from "./data";
import { ProfileEditor } from "./profile-editor";
import { useToast } from "@/components/ui/toast";
import { toggleFollow, requestConnection, endorseSkill, getFollowListAction, updateAvatar, updateCoverImage } from "./actions";
import { startConversation } from "@/features/messaging/actions";
import { SignatureScorecard } from "./signature-scorecard";

export function ProfileScreen({
  profile,
  contributions,
}: {
  profile: ProfileView;
  contributions: ContributionItem[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [tab, setTab] = useState<"posts" | "about">("posts");
  const [editing, setEditing] = useState(false);
  const [following, setFollowing] = useState(profile.isFollowing);
  const [connState, setConnState] = useState(profile.connectionStatus);
  const [connectOpen, setConnectOpen] = useState(false);
  const [note, setNote] = useState("");
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [messageError, setMessageError] = useState<string | null>(null);
  const [followModalKind, setFollowModalKind] = useState<"followers" | "following" | null>(null);
  const [followList, setFollowList] = useState<{ id: string; username: string; displayName: string; avatarUrl: string | null }[]>([]);
  const [followLoading, setFollowLoading] = useState(false);
  const [pending, startTransition] = useTransition();
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);

  function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      startTransition(async () => {
        await updateAvatar(reader.result as string);
        router.refresh();
      });
    };
    reader.readAsDataURL(file);
  }

  function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      startTransition(async () => {
        await updateCoverImage(reader.result as string);
        router.refresh();
      });
    };
    reader.readAsDataURL(file);
  }

  if (editing) {
    return (
      <ProfileEditor
        profile={profile}
        onDone={() => setEditing(false)}
      />
    );
  }

  function onFollow() {
    setFollowing((f) => !f);
    startTransition(() => {
      void toggleFollow(profile.id);
    });
  }

  function submitConnect() {
    if (!note.trim()) return;
    startTransition(async () => {
      const res = await requestConnection({ targetId: profile.id, note });
      if (res.ok) {
        setConnState("pending");
        setConnectOpen(false);
        setNote("");
        toast("Connection request sent", "success");
      }
    });
  }

  function submitMessage() {
    const body = messageText.trim();
    if (!body) return;
    setMessageError(null);
    startTransition(async () => {
      const res = await startConversation({ targetId: profile.id, body });
      if (res.ok) {
        setMessageOpen(false);
        setMessageText("");
        router.push(`/messages/${res.threadId}`);
      } else {
        setMessageError(
          res.error === "rate_limited"
            ? "You've hit the daily limit for message requests (5). Try again tomorrow."
            : "Couldn't send. Try again.",
        );
      }
    });
  }

  async function openFollowModal(kind: "followers" | "following") {
    setFollowModalKind(kind);
    setFollowLoading(true);
    const res = await getFollowListAction(profile.username, kind);
    setFollowList(res.people);
    setFollowLoading(false);
  }

  const connected = connState === "connected";

  return (
    <div className="mx-auto max-w-content pb-10">
      {/* Cover banner */}
      <div className="relative -mx-6 -mt-8 h-48 bg-brand-gradient md:-mx-10 md:h-56">
        {profile.isSelf && (
          <>
            <button onClick={() => coverFileRef.current?.click()} className="absolute bottom-3 right-3 flex h-9 items-center gap-1.5 rounded-full bg-black/40 px-3 text-[13px] font-medium text-white transition-colors hover:bg-black/60">
              <Camera className="h-4 w-4" /> Edit cover
            </button>
            <input ref={coverFileRef} type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
          </>
        )}
      </div>

      {/* Profile header — Instagram-style: avatar left, info right */}
      <div className="flex flex-col items-center gap-6 pb-6 pt-0 sm:flex-row sm:items-start sm:gap-10 sm:px-6">
        {/* Avatar — overlaps the banner */}
        <div className="relative -mt-16 shrink-0 sm:-mt-12">
          <Avatar name={profile.displayName} src={profile.avatarUrl} size={140} className="ring-4 ring-canvas" />
          {profile.isSelf && (
            <>
              <button onClick={() => avatarFileRef.current?.click()} className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white ring-3 ring-canvas transition-colors hover:bg-black/70">
                <Camera className="h-4 w-4" />
              </button>
              <input ref={avatarFileRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </>
          )}
        </div>

        {/* Info block */}
        <div className="flex-1 text-center sm:pt-4 sm:text-left">
          {/* Name row + actions */}
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <h1 className="font-display text-xl font-bold leading-tight tracking-[-0.02em]">
              {profile.displayName}
            </h1>
            {profile.isSelf ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Pencil className="h-3.5 w-3.5" /> Edit profile
                </Button>
                <CompletenessRing value={profile.completeness} />
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={following ? "subtle" : "primary"}
                  onClick={onFollow}
                  disabled={pending}
                >
                  {following ? <><UserCheck className="h-3.5 w-3.5" /> Following</> : <><UserPlus className="h-3.5 w-3.5" /> Follow</>}
                </Button>
                {connState === "pending" ? (
                  <Button size="sm" variant="subtle" disabled><Clock className="h-3.5 w-3.5" /> Requested</Button>
                ) : connState === "incoming" ? (
                  <Link href="/connections">
                    <Button size="sm" variant="accent">Respond</Button>
                  </Link>
                ) : connState === "none" ? (
                  <Button size="sm" variant="outline" onClick={() => setConnectOpen(true)}>Connect</Button>
                ) : null}
                <Button size="sm" variant="outline" onClick={() => setMessageOpen(true)}>
                  <MessageCircle className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>

          <p className="mt-0.5 text-[14px] text-ink-3">@{profile.username}</p>

          {/* Stats row — Instagram-style bold numbers */}
          <div className="mt-3 flex justify-center gap-8 sm:justify-start">
            <span className="text-[14px]"><b className="font-bold">{profile.postCount}</b> <span className="text-ink-3">posts</span></span>
            <button onClick={() => openFollowModal("followers")} className="text-[14px] hover:underline"><b className="font-bold">{profile.followerCount}</b> <span className="text-ink-3">followers</span></button>
            <button onClick={() => openFollowModal("following")} className="text-[14px] hover:underline"><b className="font-bold">{profile.followingCount}</b> <span className="text-ink-3">following</span></button>
          </div>

          {/* Bio */}
          {profile.headline && (
            <p className="mt-3 max-w-lg text-[14px] font-medium leading-snug">{profile.headline}</p>
          )}
          {(profile.location || profile.industry) && (
            <p className="mt-1 text-[13px] text-ink-2">
              {[profile.industry, profile.location].filter(Boolean).join(" · ")}
            </p>
          )}
          {!profile.isSelf && profile.mutuals > 0 && (
            <p className="mt-1 text-[12px] text-ink-3">{profile.mutuals} mutual connection{profile.mutuals > 1 ? "s" : ""}</p>
          )}
        </div>
      </div>

      {/* Gap nudge (self only) */}
      {profile.isSelf && profile.completeness < 100 && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border-1.5 border-line bg-accent-light p-3 text-[13px] text-ink-2">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <span>
            Your profile is <b className="text-ink-1">{profile.completeness}%</b> complete.{" "}
            <button onClick={() => setEditing(true)} className="font-semibold text-accent underline">
              Fill the gaps
            </button>
          </span>
        </div>
      )}

      {/* Tab bar — Instagram-style centered icons */}
      <div className="flex items-center justify-center gap-0 border-b-1.5 border-t-1.5 border-line">
        <ProfileTab active={tab === "posts"} onClick={() => setTab("posts")}>
          <Grid3X3 className="h-3.5 w-3.5" /> Posts
        </ProfileTab>
        <ProfileTab active={tab === "about"} onClick={() => setTab("about")}>
          <User className="h-3.5 w-3.5" /> About
        </ProfileTab>
      </div>

      {/* Posts tab — grid layout */}
      {tab === "posts" && (
        <div className="pt-4">
          {contributions.length === 0 ? (
            <div className="py-16 text-center">
              <Grid3X3 className="mx-auto mb-3 h-10 w-10 text-ink-3/40" />
              <p className="text-[15px] font-semibold text-ink-1">No posts yet</p>
              <p className="mt-1 text-[13px] text-ink-3">When {profile.isSelf ? "you share" : `${profile.displayName.split(" ")[0]} shares`} posts, they&apos;ll show up here.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {contributions.map((c) => (
                <Link key={c.id} href={`/post/${c.id}`} className="group">
                  <div className="rounded-lg border-1.5 border-line p-4 transition-colors group-hover:border-accent/40">
                    <div className="mb-2 flex items-center gap-2 text-[11px] text-ink-3">
                      <span className="font-bold uppercase tracking-[0.06em]">{POST_TYPES[c.type].label}</span>
                      <span>· {timeAgo(c.createdAt)}</span>
                    </div>
                    <p className="line-clamp-4 text-[13px] leading-relaxed text-ink-1">{c.bodyText}</p>
                    <div className="mt-3 flex items-center gap-3 text-[12px] text-ink-3">
                      <span>{c.reactionCount} reactions</span>
                      <span>{c.replyCount} replies</span>
                      {c.missionName && <span className="ml-auto truncate text-accent">{c.missionName}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* About tab */}
      {tab === "about" && (
        <div className="mx-auto max-w-2xl space-y-4 pt-6">
          {profile.identitySnapshot && (
            <Card>
              <CardContent className="p-5">
                <SectionLabel>Identity</SectionLabel>
                <p className="text-[15px] leading-relaxed text-foreground/90">
                  {profile.identitySnapshot}
                </p>
              </CardContent>
            </Card>
          )}

          {/* AI-derived Signature scorecard — replaces raw values/work-style/skills tag rows */}
          <SignatureScorecard profile={profile} />

          {/* Endorseable skills — kept separately so peers can still react */}
          {profile.skills.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <SkillsBlock profile={profile} />
              </CardContent>
            </Card>
          )}

          {profile.prompts.length > 0 && (
            <div className="space-y-3">
              {profile.prompts.map((pr) => (
                <Card key={pr.id}>
                  <CardContent className="p-5">
                    <div className="text-[12px] font-medium text-ink-3">{pr.question}</div>
                    <p className="mt-1 font-display text-[17px] font-semibold leading-snug text-ink-1">{pr.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <ExperienceSection label="Experience" icon="work" items={profile.experience.filter((x) => x.kind === "work")} />
          <ExperienceSection label="Education" icon="education" items={profile.experience.filter((x) => x.kind === "education")} />

          {profile.certifications.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <SectionLabel>Certifications</SectionLabel>
                <div className="space-y-3">
                  {profile.certifications.map((c) => (
                    <div key={c.id} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-bg-muted text-ink-3">
                        <Award className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-[14px] font-semibold text-ink-1">{c.name}</div>
                        <div className="text-[13px] text-ink-2">{c.issuer}</div>
                        {c.year && <div className="text-[12px] text-ink-3">{c.year}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {profile.missions.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <SectionLabel>Missions &amp; Circles</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {profile.missions.map((m) => (
                    <Link
                      key={m.id}
                      href={spacePath(m.kind, m.slug)}
                      className="inline-flex items-center gap-1.5 rounded-full border-1.5 border-line px-3 py-1 text-[12px] font-medium text-ink-1 transition-colors hover:border-accent-hover hover:text-accent"
                    >
                      {m.name}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {profile.links.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <SectionLabel>Work &amp; links</SectionLabel>
                <div className="flex flex-col gap-2">
                  {profile.links.map((l) => (
                    <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-accent hover:underline">
                      <Link2 className="h-4 w-4" /> {l.label}
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <SectionLabel>Career Identity Score</SectionLabel>
                <p className="text-sm text-muted-foreground">
                  A signal of who you are professionally. Coming soon.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                <Lock className="h-3.5 w-3.5" /> Soon
              </span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Connect modal */}
      <Modal open={connectOpen} onClose={() => setConnectOpen(false)} title={`Connect with ${profile.displayName}`}>
        <p className="mb-2 text-sm text-muted-foreground">
          Connections start with a real note — no blank requests.
        </p>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder={`Hi ${profile.displayName.split(" ")[0]} — I'd love to connect because…`}
        />
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setConnectOpen(false)}>Cancel</Button>
          <Button size="sm" onClick={submitConnect} disabled={!note.trim() || pending}>Send request</Button>
        </div>
      </Modal>

      {/* Followers / following modal */}
      <Modal
        open={!!followModalKind}
        onClose={() => setFollowModalKind(null)}
        title={followModalKind === "followers" ? "Followers" : "Following"}
      >
        {followLoading ? (
          <p className="py-6 text-center text-[13px] text-ink-3">Loading…</p>
        ) : followList.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-ink-3">
            {followModalKind === "followers" ? "No followers yet." : "Not following anyone yet."}
          </p>
        ) : (
          <div className="max-h-[360px] space-y-1 overflow-y-auto">
            {followList.map((p) => (
              <Link
                key={p.id}
                href={`/${p.username}`}
                onClick={() => setFollowModalKind(null)}
                className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-bg-muted"
              >
                <Avatar name={p.displayName} src={p.avatarUrl} size={36} />
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-semibold text-ink-1">{p.displayName}</div>
                  <div className="truncate text-[12px] text-ink-3">@{p.username}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Modal>

      {/* Message modal */}
      <Modal open={messageOpen} onClose={() => setMessageOpen(false)} title={`Message ${profile.displayName}`}>
        {!connected && (
          <p className="mb-2 text-sm text-muted-foreground">
            You&apos;re not connected, so this goes as a message request.
          </p>
        )}
        <Textarea
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          rows={3}
          maxLength={4000}
          placeholder="Say hello…"
        />
        {messageError && <p className="mt-2 text-sm text-destructive">{messageError}</p>}
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setMessageOpen(false)}>Cancel</Button>
          <Button size="sm" onClick={submitMessage} disabled={!messageText.trim() || pending}>
            {connected ? "Send" : "Send request"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function ExperienceSection({
  label,
  icon,
  items,
}: {
  label: string;
  icon: "work" | "education";
  items: ProfileView["experience"];
}) {
  if (items.length === 0) return null;
  const Icon = icon === "education" ? GraduationCap : Briefcase;
  return (
    <Card>
      <CardContent className="p-5">
        <SectionLabel>{label}</SectionLabel>
        <div className="space-y-3">
          {items.map((x) => (
            <div key={x.id} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-bg-muted text-ink-3">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <div className="text-[14px] font-semibold text-ink-1">{x.title}</div>
                <div className="text-[13px] text-ink-2">{x.org}</div>
                {x.period && <div className="text-[12px] text-ink-3">{x.period}</div>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "-mb-[1.5px] inline-flex items-center gap-1.5 border-b-2 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors",
        active ? "border-accent text-accent" : "border-transparent text-ink-3 hover:text-ink-1",
      )}
    >
      {children}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h2>
  );
}

function SkillsBlock({ profile }: { profile: ProfileView }) {
  const [counts, setCounts] = useState(profile.endorsements);
  const [mine, setMine] = useState<string[]>(profile.endorsedByMe);
  const [, start] = useTransition();

  function toggle(skill: string) {
    const has = mine.includes(skill);
    setMine((m) => (has ? m.filter((s) => s !== skill) : [...m, skill]));
    setCounts((c) => ({ ...c, [skill]: Math.max(0, (c[skill] ?? 0) + (has ? -1 : 1)) }));
    start(() => { void endorseSkill(profile.id, skill); });
  }

  return (
    <div>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Skills</h2>
      <div className="flex flex-wrap gap-1.5">
        {profile.skills.map((s) => {
          const count = counts[s] ?? 0;
          const endorsed = mine.includes(s);
          return (
            <span key={s} className="inline-flex items-center gap-1 rounded-sm bg-bg-muted py-0.5 pl-2.5 pr-1 text-[12px] text-ink-2">
              {s}
              {count > 0 && <span className="font-semibold text-ink-1">{count}</span>}
              {!profile.isSelf && (
                <button
                  onClick={() => toggle(s)}
                  title={endorsed ? "Remove endorsement" : `Endorse ${s}`}
                  className={cn("flex h-5 w-5 items-center justify-center rounded-sm transition-colors", endorsed ? "bg-accent text-white" : "text-ink-3 hover:bg-bg hover:text-accent")}
                >
                  <ThumbsUp className="h-3 w-3" />
                </button>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function TagRow({
  label,
  items,
  variant,
}: {
  label: string;
  items: string[];
  variant: "value" | "skill" | "workstyle";
}) {
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <div className="flex flex-wrap gap-1.5">
        {items.map((it) => (
          <Tag key={it} variant={variant}>{it}</Tag>
        ))}
      </div>
    </div>
  );
}
