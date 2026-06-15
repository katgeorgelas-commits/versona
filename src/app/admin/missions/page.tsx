import { listMissions } from "@/features/admin/data";
import { MissionPromptEditor } from "@/features/admin/mission-prompt-editor";

export default async function AdminMissionsPage() {
  const missions = await listMissions();
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Missions</h1>
      <p className="text-sm text-muted-foreground">
        Curate spaces and set each mission&apos;s weekly prompt (overrides the AI-generated one).
      </p>
      <div className="space-y-3">
        {missions.map((m) => (
          <MissionPromptEditor key={m.id} mission={m} />
        ))}
      </div>
    </div>
  );
}
