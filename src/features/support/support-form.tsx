"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { submitFeedback } from "./actions";

const CATEGORIES = [
  { value: "feature", label: "Feature request" },
  { value: "bug", label: "Bug report" },
  { value: "idea", label: "Idea / suggestion" },
  { value: "other", label: "Other" },
];

export function SupportForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [category, setCategory] = useState<"feature" | "bug" | "idea" | "other">("feature");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!subject.trim() || !body.trim()) return;
    startTransition(async () => {
      const res = await submitFeedback({ category, subject: subject.trim(), body: body.trim() });
      if (res.ok) {
        toast("Thanks! Your feedback has been submitted.", "success");
        setSubject("");
        setBody("");
        setCategory("feature");
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div>
          <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-ink-3">
            What are you sending?
          </label>
          <Select value={category} onChange={(v) => setCategory(v as typeof category)} options={CATEGORIES} className="w-full" />
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-ink-3">
            Subject
          </label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={120}
            placeholder="Brief summary"
            className="h-10 w-full rounded-md border-1.5 border-line bg-bg px-3 text-[14px] focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-ink-3">
            Details
          </label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            maxLength={2000}
            placeholder="Tell us more — the more detail, the better."
            className="resize-none"
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={submit} disabled={pending || !subject.trim() || !body.trim()}>
            Submit feedback
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
