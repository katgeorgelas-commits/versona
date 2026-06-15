"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Award, Plus, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { PROFILE_PROMPTS, MIN_PROMPTS, MAX_PROMPTS } from "@/config/prompts";
import { updateProfile } from "./actions";
import type { ProfileView } from "@/types/views";

type Exp = { id: string; kind: "work" | "education"; title: string; org: string; period: string };
type Cert = { id: string; name: string; issuer: string; year: string };
const uid = () => Math.random().toString(36).slice(2, 9);

export function ProfileEditor({ profile, onDone }: { profile: ProfileView; onDone: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [headline, setHeadline] = useState(profile.headline ?? "");
  const [identity, setIdentity] = useState(profile.identitySnapshot ?? "");
  const [location, setLocation] = useState(profile.location ?? "");
  const [industry, setIndustry] = useState(profile.industry ?? "");
  const [values, setValues] = useState(profile.values.join(", "));
  const [workStyle, setWorkStyle] = useState(profile.workStyle.join(", "));
  const [skills, setSkills] = useState(profile.skills.join(", "));
  const [prompts, setPrompts] = useState<{ id: string; answer: string }[]>(
    profile.prompts.map((p) => ({ id: p.id, answer: p.answer })),
  );
  const [experience, setExperience] = useState<Exp[]>(profile.experience);
  const [links, setLinks] = useState(profile.links.length ? profile.links : [{ label: "", url: "" }]);
  const [certifications, setCertifications] = useState<Cert[]>(profile.certifications);

  const toArr = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
  const usedPromptIds = new Set(prompts.map((p) => p.id));

  function save() {
    setError(null);
    const filledPrompts = prompts.filter((p) => p.answer.trim());
    if (filledPrompts.length > 0 && filledPrompts.length < MIN_PROMPTS) {
      setError(`Add at least ${MIN_PROMPTS} prompts (or remove them all).`);
      return;
    }
    startTransition(async () => {
      const res = await updateProfile({
        headline,
        identitySnapshot: identity,
        location,
        industry,
        values: toArr(values),
        workStyle: toArr(workStyle),
        skills: toArr(skills),
        prompts: filledPrompts,
        experience: experience.filter((x) => x.title.trim() && x.org.trim()),
        certifications: certifications.filter((c) => c.name.trim()),
        links: links.filter((l) => l.label.trim() && l.url.trim()),
        currentFocus: profile.currentFocus ?? "",
        currentStruggle: profile.currentStruggle ?? "",
        ambitions: profile.ambitions ?? "",
      });
      if (res.ok) {
        router.refresh();
        onDone();
      } else {
        setError(res.error === "invalid" ? "Please check your links are valid URLs." : "Couldn't save. Try again.");
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold">Edit profile</h1>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onDone} disabled={pending}>Cancel</Button>
          <Button size="sm" onClick={save} disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
        </div>
      </div>

      {/* Basics */}
      <Card>
        <CardContent className="space-y-4 p-5">
          <Field label="Headline"><Input value={headline} onChange={(e) => setHeadline(e.target.value)} maxLength={200} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Industry"><Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Design / Product" maxLength={80} /></Field>
            <Field label="Location"><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Washington, DC" maxLength={80} /></Field>
          </div>
          <Field label="Identity snapshot"><Textarea value={identity} onChange={(e) => setIdentity(e.target.value)} rows={3} maxLength={600} /></Field>
          <Field label="Values (comma-separated)"><Input value={values} onChange={(e) => setValues(e.target.value)} /></Field>
          <Field label="Work style (comma-separated)"><Input value={workStyle} onChange={(e) => setWorkStyle(e.target.value)} /></Field>
          <Field label="Skills (comma-separated)"><Input value={skills} onChange={(e) => setSkills(e.target.value)} /></Field>
        </CardContent>
      </Card>

      {/* Prompts */}
      <Card>
        <CardContent className="space-y-3 p-5">
          <div>
            <div className="text-sm font-semibold">Prompts</div>
            <p className="text-[12px] text-ink-3">Pick {MIN_PROMPTS}–{MAX_PROMPTS} to showcase something about you.</p>
          </div>
          {prompts.map((p, i) => {
            const options = PROFILE_PROMPTS.filter((pp) => pp.id === p.id || !usedPromptIds.has(pp.id)).map((pp) => ({ value: pp.id, label: pp.question }));
            return (
              <div key={i} className="rounded-md border-1.5 border-line p-3">
                <div className="flex items-center gap-2">
                  <Select className="flex-1" value={p.id} onChange={(v) => setPrompts((arr) => arr.map((x, j) => (j === i ? { ...x, id: v } : x)))} options={options} placeholder="Choose a prompt" />
                  <button onClick={() => setPrompts((arr) => arr.filter((_, j) => j !== i))} className="text-ink-3 hover:text-ink-1"><X className="h-4 w-4" /></button>
                </div>
                <Textarea value={p.answer} onChange={(e) => setPrompts((arr) => arr.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)))} rows={2} maxLength={280} placeholder="Your answer…" className="mt-2" />
              </div>
            );
          })}
          {prompts.length < MAX_PROMPTS && (
            <button
              onClick={() => {
                const next = PROFILE_PROMPTS.find((pp) => !usedPromptIds.has(pp.id));
                if (next) setPrompts((arr) => [...arr, { id: next.id, answer: "" }]);
              }}
              className="inline-flex items-center gap-1 text-[13px] font-semibold text-accent hover:text-accent-hover"
            >
              <Plus className="h-4 w-4" /> Add prompt
            </button>
          )}
        </CardContent>
      </Card>

      {/* Experience */}
      <Card>
        <CardContent className="space-y-3 p-5">
          <div className="text-sm font-semibold">Work &amp; education</div>
          {experience.map((x, i) => (
            <div key={x.id} className="space-y-2 rounded-md border-1.5 border-line p-3">
              <div className="flex items-center gap-2">
                <Select className="w-36" value={x.kind} onChange={(v) => setExperience((arr) => arr.map((e, j) => (j === i ? { ...e, kind: v as Exp["kind"] } : e)))} options={[{ value: "work", label: "Work" }, { value: "education", label: "Education" }]} />
                <button onClick={() => setExperience((arr) => arr.filter((_, j) => j !== i))} className="ml-auto text-ink-3 hover:text-ink-1"><X className="h-4 w-4" /></button>
              </div>
              <Input value={x.title} onChange={(e) => setExperience((arr) => arr.map((it, j) => (j === i ? { ...it, title: e.target.value } : it)))} placeholder={x.kind === "education" ? "Degree / program" : "Role / title"} />
              <Input value={x.org} onChange={(e) => setExperience((arr) => arr.map((it, j) => (j === i ? { ...it, org: e.target.value } : it)))} placeholder={x.kind === "education" ? "School" : "Company / org"} />
              <Input value={x.period} onChange={(e) => setExperience((arr) => arr.map((it, j) => (j === i ? { ...it, period: e.target.value } : it)))} placeholder="2022 — now" />
            </div>
          ))}
          <button onClick={() => setExperience((arr) => [...arr, { id: uid(), kind: "work", title: "", org: "", period: "" }])} className="inline-flex items-center gap-1 text-[13px] font-semibold text-accent hover:text-accent-hover">
            <Plus className="h-4 w-4" /> Add experience
          </button>
        </CardContent>
      </Card>

      {/* Certifications */}
      <Card>
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Award className="h-4 w-4 text-accent" /> Certifications
          </div>
          {certifications.map((c, i) => (
            <div key={c.id} className="space-y-2 rounded-md border-1.5 border-line p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-3">Certification {i + 1}</span>
                <button onClick={() => setCertifications((arr) => arr.filter((_, j) => j !== i))} className="text-ink-3 hover:text-ink-1"><X className="h-4 w-4" /></button>
              </div>
              <Input value={c.name} onChange={(e) => setCertifications((arr) => arr.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} placeholder="Certification name" />
              <div className="grid gap-2 sm:grid-cols-2">
                <Input value={c.issuer} onChange={(e) => setCertifications((arr) => arr.map((x, j) => (j === i ? { ...x, issuer: e.target.value } : x)))} placeholder="Issuing organization" />
                <Input value={c.year} onChange={(e) => setCertifications((arr) => arr.map((x, j) => (j === i ? { ...x, year: e.target.value } : x)))} placeholder="Year" maxLength={10} />
              </div>
            </div>
          ))}
          {certifications.length < 10 && (
            <button onClick={() => setCertifications((arr) => [...arr, { id: uid(), name: "", issuer: "", year: "" }])} className="inline-flex items-center gap-1 text-[13px] font-semibold text-accent hover:text-accent-hover">
              <Plus className="h-4 w-4" /> Add certification
            </button>
          )}
        </CardContent>
      </Card>

      {/* Links */}
      <Card>
        <CardContent className="space-y-3 p-5">
          <div className="text-sm font-semibold">Work &amp; links</div>
          <div className="space-y-2">
            {links.map((l, i) => (
              <div key={i} className="flex gap-2">
                <Input placeholder="Label" value={l.label} onChange={(e) => setLinks((prev) => prev.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} className="w-1/3" />
                <Input placeholder="https://…" value={l.url} onChange={(e) => setLinks((prev) => prev.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
              </div>
            ))}
            <button onClick={() => setLinks((p) => [...p, { label: "", url: "" }])} className="inline-flex items-center gap-1 text-[13px] font-semibold text-accent hover:text-accent-hover">
              <Plus className="h-4 w-4" /> Add link
            </button>
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
