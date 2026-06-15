"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { requestMission } from "./actions";

export function RequestMissionButton({ kind = "mission" }: { kind?: "mission" | "circle" }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [brief, setBrief] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const label = kind === "circle" ? "circle" : "mission";

  function submit() {
    setError(null);
    start(async () => {
      const res = await requestMission({ name, brief, kind });
      if (res.ok) {
        setOpen(false);
        setName("");
        setBrief("");
        toast(`${kind === "circle" ? "Circle" : "Mission"} request submitted for review`, "success");
      } else {
        setError("Give it a name (3+ chars) and a brief (10+ chars).");
      }
    });
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Request a {label}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Request a new ${label}`}>
        <p className="mb-3 text-[13px] text-ink-3">
          {kind === "circle"
            ? "Circles gather people around an interest, industry, or topic. Tell us what you'd like to see — the Versona team reviews every request."
            : "Missions are shared journeys toward a goal. Tell us what you'd like to see — the Versona team reviews every request."}
        </p>
        <label className="mb-1 block text-sm font-medium">Name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder={kind === "circle" ? "e.g. Government Contracting" : "e.g. Buying My First Home"} />
        <label className="mb-1 mt-3 block text-sm font-medium">What it&apos;s for</label>
        <Textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={3} maxLength={280} placeholder="Who is it for, and what will people talk about?" />
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
          <Button size="sm" onClick={submit} disabled={pending || !name.trim() || !brief.trim()}>Submit request</Button>
        </div>
      </Modal>
    </>
  );
}
