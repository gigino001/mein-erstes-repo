"use client";

import { useEffect, useRef, useState } from "react";
import { formatDuration, formatPrice, CATEGORY_LABELS } from "@/lib/format";

type Service = {
  id: string;
  name: string;
  category: string;
  durationMinutes: number;
  priceCents: number;
};

const CATEGORY_ORDER = ["neumodellage", "auffuellen", "sonstiges"] as const;

export function ServiceSelect({
  id,
  services,
  value,
  onChange,
}: {
  id?: string;
  services: Service[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = services.find((s) => s.id === value) ?? null;

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        id={id}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 border-2 border-ink/20 rounded-xl px-4 py-3 bg-white focus:border-ocean focus:outline-none transition-colors text-left"
      >
        <span className="truncate">
          {selected
            ? `${selected.name} — ${formatDuration(selected.durationMinutes)} — ${formatPrice(selected.priceCents)}`
            : "Bitte wählen"}
        </span>
        <svg
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
          className={`w-4 h-4 shrink-0 text-ocean transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute z-20 mt-2 w-full max-h-80 overflow-y-auto bg-white border-2 border-ink/10 rounded-xl shadow-xl py-2"
        >
          {CATEGORY_ORDER.map((category) => {
            const items = services.filter((s) => s.category === category);
            if (items.length === 0) return null;
            return (
              <div key={category}>
                <p className="px-4 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
                  {CATEGORY_LABELS[category]}
                </p>
                {items.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    role="option"
                    aria-selected={s.id === value}
                    onClick={() => {
                      onChange(s.id);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-4 px-4 py-2.5 text-left text-sm transition-colors ${
                      s.id === value ? "bg-coral-soft text-ink font-semibold" : "hover:bg-sky-mist"
                    }`}
                  >
                    <span>{s.name}</span>
                    <span className="text-xs text-ink-muted whitespace-nowrap">
                      {formatDuration(s.durationMinutes)} · {formatPrice(s.priceCents)}
                    </span>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
