"use client";

import { useState } from "react";
import { submitReview } from "@/app/bewertung/[id]/actions";

const fieldClass =
  "border-2 border-ink/20 rounded-xl px-4 py-3 bg-white focus:border-ocean focus:outline-none transition-colors";

export function ReviewForm({ appointmentId, initialName }: { appointmentId: string; initialName: string }) {
  const [name, setName] = useState(initialName);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<
    { type: "idle" } | { type: "submitting" } | { type: "success" } | { type: "error"; message: string }
  >({ type: "idle" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) {
      setStatus({ type: "error", message: "Bitte wähle eine Sternebewertung." });
      return;
    }
    setStatus({ type: "submitting" });
    const result = await submitReview(appointmentId, name, rating, text);
    if (!result.ok) {
      setStatus({ type: "error", message: result.error });
      return;
    }
    setStatus({ type: "success" });
  }

  if (status.type === "success") {
    return (
      <div className="rounded-2xl bg-sky-mist p-10 text-center flex flex-col gap-3">
        <p className="font-poster uppercase text-3xl text-ocean">Danke dir!</p>
        <p className="text-ink-soft">Deine Bewertung ist bei mir angekommen — das freut mich sehr!</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold">Deine Bewertung</span>
        <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHoverRating(n)}
              aria-label={`${n} von 5 Sternen`}
              className="text-4xl leading-none transition-colors"
            >
              <span className={n <= (hoverRating || rating) ? "text-ocean" : "text-ink/20"}>★</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold" htmlFor="name">
          Dein Name
        </label>
        <input
          id="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={fieldClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold" htmlFor="text">
          Deine Erfahrung
        </label>
        <textarea
          id="text"
          required
          rows={5}
          placeholder="Wie war dein Termin bei coco lashes?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className={fieldClass}
        />
      </div>

      <p className="text-xs text-ink-muted">
        Deine Bewertung geht direkt per E-Mail bei mir ein. Mit dem Absenden bist du damit
        einverstanden, dass ich deinen Namen und deinen Text ggf. (nach Rücksprache mit dir) auf der
        Website veröffentliche.
      </p>

      {status.type === "error" && <p className="text-sm text-coral font-semibold">{status.message}</p>}

      <button
        type="submit"
        disabled={status.type === "submitting"}
        className="font-poster uppercase text-lg text-white bg-ocean rounded-full px-8 py-4 disabled:opacity-40 transition self-start"
      >
        {status.type === "submitting" ? "Wird gesendet…" : "Bewertung absenden"}
      </button>
    </form>
  );
}
