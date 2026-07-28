"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Eraser, PenLine } from "lucide-react";
import { Button } from "@/components/ui";

// Zeichenfläche für die Unterschrift auf dem Tablet. Bewusst ohne externe
// Bibliothek: Pointer-Events decken Maus, Stift und Finger gleichermaßen ab.
export function SignaturePad({
  onSave,
  onCancel,
}: {
  onSave: (dataUrl: string) => Promise<void>;
  onCancel?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const [hasStrokes, setHasStrokes] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Canvas an die tatsächliche Anzeigegröße anpassen, damit die Linie auf
  // hochauflösenden Displays nicht unscharf wird.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0f172a";
  }, []);

  function positionOf(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    const { x, y } = positionOf(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = positionOf(event);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasStrokes(true);
  }

  function handlePointerUp() {
    drawingRef.current = false;
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasStrokes(false);
  }

  function save() {
    const canvas = canvasRef.current;
    if (!canvas || !hasStrokes) return;

    // Transparenter Hintergrund würde im PDF als schwarze Fläche erscheinen,
    // deshalb wird vor dem Export weiß hinterlegt.
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const exportCtx = exportCanvas.getContext("2d");
    if (!exportCtx) return;
    exportCtx.fillStyle = "#ffffff";
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    exportCtx.drawImage(canvas, 0, 0);

    const dataUrl = exportCanvas.toDataURL("image/png");
    startTransition(async () => {
      await onSave(dataUrl);
    });
  }

  return (
    <div className="space-y-3">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="h-40 w-full touch-none rounded-xl border-2 border-dashed border-[var(--border)] bg-white"
        aria-label="Unterschriftsfeld"
      />
      <p className="text-xs text-slate-400">
        Mit Finger oder Stift im Feld unterschreiben.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={save} disabled={!hasStrokes || isPending}>
          <PenLine size={16} />
          {isPending ? "Wird gespeichert…" : "Unterschrift speichern"}
        </Button>
        <Button type="button" variant="secondary" onClick={clear} disabled={isPending}>
          <Eraser size={16} />
          Löschen
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isPending}>
            Abbrechen
          </Button>
        )}
      </div>
    </div>
  );
}
