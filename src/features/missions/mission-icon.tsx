import {
  Rocket, Route, Users, Terminal, LifeBuoy, Briefcase, Megaphone,
  CalendarClock, Undo2, HeartHandshake, Compass, type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  rocket: Rocket,
  route: Route,
  users: Users,
  terminal: Terminal,
  "life-buoy": LifeBuoy,
  briefcase: Briefcase,
  megaphone: Megaphone,
  "calendar-clock": CalendarClock,
  "undo-2": Undo2,
  "heart-handshake": HeartHandshake,
  compass: Compass,
};

export function MissionIcon({ name, className }: { name: string; className?: string }) {
  const Icon = MAP[name] ?? Compass;
  return <Icon className={className} />;
}

/** Bold, on-brand cover gradient for a mission (its accent → brand purple). */
export function missionCover(accent: string): string {
  return `linear-gradient(135deg, ${accent}, #6d28d9)`;
}
