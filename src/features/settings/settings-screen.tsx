"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, Bell, Lock, UserX } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { cn } from "@/lib/utils";

export function SettingsScreen() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(localStorage.getItem("versona-theme") === "dark");
  }, []);

  function setTheme(next: boolean) {
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("versona-theme", next ? "dark" : "light");
  }

  return (
    <div className="mx-auto max-w-feed space-y-4">
      <Breadcrumbs items={[{ label: "Settings" }]} />
      <h1 className="font-display text-2xl font-bold tracking-[-0.025em] text-ink-1">Settings</h1>

      {/* Appearance */}
      <Card>
        <CardContent className="p-5">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-3">Appearance</h2>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <div className="text-[14px] font-semibold text-ink-1">Theme</div>
              <div className="text-[13px] text-ink-3">Choose how Versona looks to you.</div>
            </div>
            <div className="flex rounded-full border-1.5 border-line p-0.5">
              <button
                onClick={() => setTheme(false)}
                className={cn("flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium transition-colors", !dark ? "bg-accent text-white" : "text-ink-3 hover:text-ink-1")}
              >
                <Sun className="h-4 w-4" /> Light
              </button>
              <button
                onClick={() => setTheme(true)}
                className={cn("flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium transition-colors", dark ? "bg-accent text-white" : "text-ink-3 hover:text-ink-1")}
              >
                <Moon className="h-4 w-4" /> Dark
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Other settings (scaffolded — wired with the auth/account feature) */}
      <Card>
        <CardContent className="divide-y divide-line p-0">
          {[
            { icon: Bell, title: "Notifications", desc: "Email digest, push, and in-app preferences." },
            { icon: Lock, title: "Privacy", desc: "Profile visibility and what others can see." },
            { icon: UserX, title: "Account", desc: "Connected accounts, data export, deactivation." },
          ].map((s) => (
            <div key={s.title} className="flex items-center gap-3 p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-muted text-ink-3">
                <s.icon className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <div className="text-[14px] font-semibold text-ink-1">{s.title}</div>
                <div className="text-[13px] text-ink-3">{s.desc}</div>
              </div>
              <span className="rounded-full bg-bg-muted px-2.5 py-0.5 text-[11px] font-medium text-ink-3">Soon</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
