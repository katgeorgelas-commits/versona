"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Zap, Compass, Heart, Flame, Users, Layers, Repeat, Hammer, Mic, Telescope, Info, Quote, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ProfileView } from "@/types/views";

type Dimension = NonNullable<ProfileView["signature"]>["dimensions"][number];

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  craft: Hammer,
  autonomy: Compass,
  directness: Zap,
  systems: Layers,
  drive: Flame,
  collaboration: Users,
  growth: Telescope,
  communication: Mic,
  adaptability: Repeat,
  consistency: Sparkles,
  community: Users,
  generosity: Heart,
};

export function SignatureScorecard({ profile }: { profile: ProfileView }) {
  const sig = profile.signature;
  const [infoOpen, setInfoOpen] = useState(false);

  if (!sig) return <EmptyScorecard isSelf={profile.isSelf} />;

  const ranked = [...sig.dimensions].sort((a, b) => b.score - a.score);
  const firstName = profile.displayName.split(" ")[0];

  return (
    <Card className="overflow-hidden">
      {/* Hero — persona name + tagline on a brand wash */}
      <div className="relative bg-brand-wash px-6 py-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-accent">
            <Sparkles className="h-3 w-3" /> Signature
          </div>
          <button
            type="button"
            onClick={() => setInfoOpen((v) => !v)}
            aria-label="What is a Signature?"
            aria-expanded={infoOpen}
            className="flex h-6 w-6 items-center justify-center rounded-full border-1.5 border-accent/40 bg-bg/60 text-accent transition-colors hover:border-accent hover:bg-bg"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </div>

        {infoOpen && (
          <div className="mt-3 rounded-md border-1.5 border-accent/30 bg-bg/90 p-3 text-[12px] leading-relaxed text-ink-2">
            A <b className="text-ink-1">Signature</b> is an AI-derived read of how someone works — built from their onboarding answers,
            values, work style, skills, and ongoing activity. There are{" "}
            <b className="text-ink-1">nine Signatures</b> in total, mapped on a focus × mode grid (Craft / People / Systems × Initiating / Sustaining / Evolving).
            Signatures help people find shared ground and help teams see how to complement each other.
            <Link href="/signatures" className="mt-2 inline-flex items-center gap-1 font-semibold text-accent hover:text-accent-hover">
              See all nine Signatures <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}

        <h2 className="mt-3 font-display text-2xl font-bold leading-tight tracking-[-0.02em] text-ink-1">
          {sig.personaName}
        </h2>
        <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-ink-2">
          {sig.personaTagline}
        </p>
        <Link
          href={`/signatures/${sig.slug}`}
          className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-accent hover:text-accent-hover"
        >
          What this means <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <CardContent className="space-y-6 p-6">
        {/* Voice — first-person, makes the scorecard feel like THIS person */}
        {sig.voice.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-ink-3">
              <Quote className="h-3 w-3" /> In {firstName}&apos;s own words
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {sig.voice.map((line, i) => (
                <li
                  key={i}
                  className="rounded-md border-1.5 border-line bg-bg-muted/40 px-3 py-2.5 text-[13px] font-medium leading-snug text-ink-1"
                >
                  &ldquo;{line}&rdquo;
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Radar chart */}
        <RadarChart dimensions={sig.dimensions} />

        {/* Scored tiles */}
        <div>
          <div className="mb-2.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-ink-3">
            <Sparkles className="h-3 w-3" /> Strengths read
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {ranked.map((d) => (
              <DimensionTile key={d.key} dim={d} />
            ))}
          </div>
        </div>

        <p className="text-center text-[11px] text-ink-3">
          Derived from onboarding answers and ongoing activity.{" "}
          <Link href="/signatures" className="font-semibold text-accent hover:text-accent-hover">
            Learn how Signatures work
          </Link>
          .
        </p>
      </CardContent>
    </Card>
  );
}

function EmptyScorecard({ isSelf }: { isSelf: boolean }) {
  return (
    <Card>
      <CardContent className="space-y-2 p-6 text-center">
        <Sparkles className="mx-auto h-6 w-6 text-accent" />
        <h2 className="font-display text-lg font-bold text-ink-1">No signature yet</h2>
        <p className="text-[13px] text-ink-3">
          {isSelf
            ? "Finish onboarding to get your Signature — a strengths-first read of how you work."
            : "This person hasn't completed their Signature yet."}
        </p>
        <Link href="/signatures" className="inline-flex items-center gap-1 text-[12px] font-semibold text-accent hover:text-accent-hover">
          See all nine Signatures <ArrowRight className="h-3 w-3" />
        </Link>
      </CardContent>
    </Card>
  );
}

function DimensionTile({ dim }: { dim: Dimension }) {
  const Icon = ICONS[dim.key] ?? Sparkles;
  const tone = scoreTone(dim.score);
  return (
    <div className={cn("rounded-lg border-1.5 p-3.5 transition-colors", tone.border, tone.bg)}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em]", tone.label)}>
          <Icon className="h-3.5 w-3.5" /> {dim.label}
        </span>
        <span className={cn("text-[13px] font-bold tabular-nums", tone.label)}>{dim.score}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-bg-muted">
        <div className={cn("h-full rounded-full", tone.bar)} style={{ width: `${Math.max(8, dim.score)}%` }} />
      </div>
      {dim.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {dim.tags.slice(0, 3).map((t) => (
            <span key={t} className={cn("rounded-sm px-1.5 py-0.5 text-[11px]", tone.tag)}>{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function scoreTone(score: number) {
  if (score >= 85) {
    return {
      border: "border-energy/40",
      bg: "bg-energy-light",
      label: "text-energy-ink",
      bar: "bg-energy",
      tag: "bg-energy/15 text-energy-ink",
    };
  }
  if (score >= 70) {
    return {
      border: "border-accent/30",
      bg: "bg-accent-light",
      label: "text-accent",
      bar: "bg-accent",
      tag: "bg-accent/10 text-accent",
    };
  }
  return {
    border: "border-line",
    bg: "bg-bg",
    label: "text-ink-2",
    bar: "bg-ink-3/50",
    tag: "bg-bg-muted text-ink-2",
  };
}

function RadarChart({ dimensions }: { dimensions: Dimension[] }) {
  const SIZE = 320;
  const CENTER = SIZE / 2;
  const RADIUS = 110;
  const RINGS = 4;
  const n = dimensions.length;

  function point(i: number, t: number) {
    const angle = -Math.PI / 2 + (i / n) * Math.PI * 2;
    return [CENTER + Math.cos(angle) * RADIUS * t, CENTER + Math.sin(angle) * RADIUS * t] as const;
  }

  const polygon = dimensions
    .map((d, i) => {
      const [x, y] = point(i, Math.max(0.08, d.score / 100));
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="flex justify-center">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width="100%" style={{ maxWidth: SIZE }} className="select-none" aria-hidden>
        {Array.from({ length: RINGS }).map((_, r) => {
          const t = (r + 1) / RINGS;
          const pts = dimensions
            .map((_, i) => {
              const [x, y] = point(i, t);
              return `${x},${y}`;
            })
            .join(" ");
          return (
            <polygon key={r} points={pts} fill="none" stroke="var(--color-border)" strokeWidth={1} opacity={0.5} />
          );
        })}
        {dimensions.map((_, i) => {
          const [x, y] = point(i, 1);
          return <line key={i} x1={CENTER} y1={CENTER} x2={x} y2={y} stroke="var(--color-border)" strokeWidth={1} opacity={0.5} />;
        })}
        <polygon
          points={polygon}
          fill="var(--color-accent)"
          fillOpacity={0.18}
          stroke="var(--color-accent)"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {dimensions.map((d, i) => {
          const [x, y] = point(i, Math.max(0.08, d.score / 100));
          return <circle key={i} cx={x} cy={y} r={3.5} fill="var(--color-accent)" />;
        })}
        {dimensions.map((d, i) => {
          const [x, y] = point(i, 1.18);
          const angle = -Math.PI / 2 + (i / n) * Math.PI * 2;
          const cos = Math.cos(angle);
          const anchor = cos < -0.3 ? "end" : cos > 0.3 ? "start" : "middle";
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor={anchor}
              dominantBaseline="middle"
              fontSize={11}
              fontWeight={600}
              fill="var(--color-text-2)"
            >
              {d.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
