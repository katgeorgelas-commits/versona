"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { HEADLINE_TEMPLATES, renderHeadline } from "@/config/headlines";
import { saveOnboarding } from "./actions";
import type { ChatTurn, OnboardingExtraction } from "./engine";

type MissionOption = {
  slug: string;
  name: string;
  brief: string;
  accent_color: string;
};

/** Comma-separated tag editor used for values / work style / skills. */
function TagField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  const [text, setText] = useState(value.join(", "));
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() =>
          onChange(
            text
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          )
        }
        placeholder={placeholder}
      />
      {value.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {value.map((v) => (
            <span
              key={v}
              className="rounded-sm bg-accent-light px-2 py-0.5 text-[12px] font-medium text-accent"
            >
              {v}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function OnboardingReview({
  username,
  missions,
  extraction,
  suggestedSlugs,
  transcript,
}: {
  username: string;
  missions: MissionOption[];
  extraction: OnboardingExtraction;
  suggestedSlugs: string[];
  transcript: ChatTurn[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);

  // Headline: default to the "currently / struggling" template, prefilled.
  const [templateId, setTemplateId] = useState("currently-struggling");
  const [slots, setSlots] = useState<Record<string, string>>({
    doing: extraction.current_focus || "",
    struggle: extraction.current_struggle || "",
  });

  const [identity, setIdentity] = useState("");
  const [values, setValues] = useState(extraction.values);
  const [workStyle, setWorkStyle] = useState(extraction.work_style);
  const [skills, setSkills] = useState(extraction.skills);
  const [focus, setFocus] = useState(extraction.current_focus);
  const [struggle, setStruggle] = useState(extraction.current_struggle);
  const [ambitions, setAmbitions] = useState(extraction.ambitions);
  const [selectedMissions, setSelectedMissions] = useState<string[]>(
    suggestedSlugs.length ? suggestedSlugs : [],
  );

  const template = HEADLINE_TEMPLATES.find((t) => t.id === templateId)!;
  const headlinePreview = useMemo(
    () => renderHeadline(templateId, slots),
    [templateId, slots],
  );

  function toggleMission(slug: string) {
    setSelectedMissions((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  }

  function save() {
    setSaveError(null);
    startTransition(async () => {
      const res = await saveOnboarding({
        headline: headlinePreview,
        headlineTemplate: templateId,
        identitySnapshot: identity,
        values,
        workStyle,
        skills,
        currentFocus: focus,
        currentStruggle: struggle,
        ambitions,
        missionSlugs: selectedMissions,
        transcript,
      });
      if (res.ok) {
        router.push(`/${res.username}`);
      } else {
        setSaveError(
          res.error === "unauthenticated"
            ? "Your session expired — please sign in again."
            : "Something went wrong saving your profile. Try again.",
        );
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold">Here&apos;s you, so far.</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          I drafted this from our conversation. Make it yours — edit anything, then
          save. Nothing is public until you say so.
        </p>
      </div>

      {/* Headline */}
      <Card>
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Pencil className="h-4 w-4 text-accent" /> Your headline
          </div>
          <div className="flex flex-wrap gap-1.5">
            {HEADLINE_TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTemplateId(t.id)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs",
                  templateId === t.id
                    ? "border-accent bg-accent-light text-accent"
                    : "border-line text-ink-3 hover:bg-bg-muted",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {template.slots.map((slot) => (
              <Input
                key={slot.key}
                value={slots[slot.key] ?? ""}
                onChange={(e) =>
                  setSlots((s) => ({ ...s, [slot.key]: e.target.value }))
                }
                placeholder={slot.placeholder}
              />
            ))}
          </div>
          <p className="rounded-lg bg-muted px-3 py-2 text-sm">
            <span className="text-muted-foreground">Preview: </span>
            {headlinePreview}
          </p>
        </CardContent>
      </Card>

      {/* Identity snapshot */}
      <Card>
        <CardContent className="space-y-2 p-5">
          <label className="text-sm font-semibold">Identity snapshot</label>
          <p className="text-xs text-muted-foreground">
            Two or three sentences on who you are. Optional — you (or Versona&apos;s
            AI, later) can refine this anytime.
          </p>
          <Textarea
            value={identity}
            onChange={(e) => setIdentity(e.target.value)}
            rows={3}
            maxLength={600}
            placeholder="e.g. A former analyst turned founder who cares about honest work…"
          />
        </CardContent>
      </Card>

      {/* Signals */}
      <Card>
        <CardContent className="space-y-4 p-5">
          <TagField
            label="Values"
            value={values}
            onChange={setValues}
            placeholder="Honesty, Impact, Autonomy"
          />
          <TagField
            label="Work style"
            value={workStyle}
            onChange={setWorkStyle}
            placeholder="Deep focus over meetings, Direct communicator"
          />
          <TagField
            label="Skills"
            value={skills}
            onChange={setSkills}
            placeholder="Product strategy, Storytelling, Data analysis"
          />
        </CardContent>
      </Card>

      {/* Current reality + ambitions */}
      <Card>
        <CardContent className="space-y-4 p-5">
          <div>
            <label className="mb-1 block text-sm font-medium">
              What you&apos;re working on
            </label>
            <Textarea value={focus} onChange={(e) => setFocus(e.target.value)} rows={2} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              What you&apos;re figuring out
            </label>
            <Textarea
              value={struggle}
              onChange={(e) => setStruggle(e.target.value)}
              rows={2}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Where you&apos;re headed</label>
            <Textarea
              value={ambitions}
              onChange={(e) => setAmbitions(e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Missions */}
      <Card>
        <CardContent className="space-y-3 p-5">
          <div className="text-sm font-semibold">Missions to join</div>
          <p className="text-xs text-muted-foreground">
            {suggestedSlugs.length
              ? "Suggested for you based on our chat. Tap to add or remove."
              : "Pick the journeys that resonate."}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {missions.map((m) => {
              const on = selectedMissions.includes(m.slug);
              return (
                <button
                  key={m.slug}
                  onClick={() => toggleMission(m.slug)}
                  className={cn(
                    "flex items-start gap-2 rounded-md border-1.5 p-3 text-left text-[13px] transition-colors",
                    on
                      ? "border-accent bg-accent-light"
                      : "border-line hover:border-accent-hover",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                      on ? "bg-accent" : "border-1.5 border-ink-3",
                    )}
                  >
                    {on && <Check className="h-3 w-3 text-white" />}
                  </span>
                  <span className="font-medium text-ink-1">{m.name}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {saveError && (
        <p className="text-center text-sm text-destructive">{saveError}</p>
      )}
      <div className="flex justify-end gap-2 pb-8">
        <Button onClick={save} size="lg" disabled={pending}>
          {pending ? "Saving…" : "Save & see my profile"}
        </Button>
      </div>
    </div>
  );
}
