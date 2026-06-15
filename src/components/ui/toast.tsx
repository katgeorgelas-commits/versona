"use client";

import {
  createContext, useCallback, useContext, useRef, useState, type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type ToastKind = "default" | "success" | "energy";
type ToastItem = { id: number; msg: string; kind: ToastKind };

type ToastCtx = {
  toast: (msg: string, kind?: ToastKind) => void;
  celebrate: () => void;
};

const Ctx = createContext<ToastCtx | null>(null);

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) return { toast: () => {}, celebrate: () => {} } as ToastCtx;
  return ctx;
}

const CONFETTI_COLORS = ["#5b3fa8", "#ed6c1f", "#7b62c4", "#16a34a", "#a8480c"];

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);
  const confettiRef = useRef<HTMLDivElement>(null);

  const toast = useCallback((msg: string, kind: ToastKind = "default") => {
    const id = ++seq.current;
    setItems((prev) => [...prev, { id, msg, kind }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3200);
  }, []);

  const celebrate = useCallback(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const host = confettiRef.current;
    if (!host) return;
    // Small, gentle burst near the top-right (toward the action area).
    for (let i = 0; i < 12; i++) {
      const piece = document.createElement("span");
      const size = 3 + Math.random() * 2.5;
      piece.style.cssText = `position:absolute;top:14%;left:50%;width:${size}px;height:${size}px;border-radius:1px;background:${CONFETTI_COLORS[i % CONFETTI_COLORS.length]};opacity:.9;will-change:transform,opacity;`;
      host.appendChild(piece);
      const angle = Math.random() * Math.PI * 2;
      const dist = 28 + Math.random() * 46;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist - 24;
      piece
        .animate(
          [
            { transform: "translate(-50%,-50%)", opacity: 0.9 },
            { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy + 90}px)) rotate(${Math.random() * 360}deg)`, opacity: 0 },
          ],
          { duration: 600 + Math.random() * 300, easing: "cubic-bezier(.2,.6,.3,1)" },
        )
        .addEventListener("finish", () => piece.remove());
    }
  }, []);

  return (
    <Ctx.Provider value={{ toast, celebrate }}>
      {children}
      <div ref={confettiRef} className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden />
      <div className="pointer-events-none fixed bottom-4 left-1/2 z-[70] flex -translate-x-1/2 flex-col items-center gap-1.5">
        {items.map((t) => (
          <div
            key={t.id}
            className="animate-rise-in inline-flex items-center gap-1.5 rounded-full border-1.5 border-line bg-bg px-2.5 py-1 text-[11px] font-medium text-ink-1"
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                t.kind === "success" && "bg-success",
                t.kind === "energy" && "bg-energy",
                t.kind === "default" && "bg-ink-3",
              )}
            />
            {t.msg}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
