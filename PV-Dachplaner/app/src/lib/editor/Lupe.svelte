<script lang="ts">
  import type maplibregl from "maplibre-gl";
  import type { EditorZustand } from "./zustand.svelte";

  let { z, karte }: { z: EditorZustand; karte: maplibregl.Map | undefined } = $props();
  const GROESSE = 120; // CSS-Pixel
  const AUSSCHNITT = 48; // CSS-Pixel der Karte, die in die Lupe passen (2,5-fache Vergrößerung)
  let canvas = $state<HTMLCanvasElement>();

  const ort = $derived.by(() => {
    if (!z.lupe) return null;
    const breite = typeof window === "undefined" ? 390 : window.innerWidth;
    // links oben neben den Finger, bei Nähe zum oberen Rand nach unten ausweichen
    const x = Math.min(Math.max(GROESSE / 2 + 8, z.lupe.x), breite - GROESSE / 2 - 8);
    const y = z.lupe.y - GROESSE - 40 < 70 ? z.lupe.y + 70 : z.lupe.y - GROESSE - 40;
    return { x, y };
  });

  $effect(() => {
    const l = z.lupe;
    if (!l || !karte || !canvas) return;
    const quelle = karte.getCanvas();
    const faktor = quelle.width / quelle.clientWidth;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = GROESSE * dpr;
    canvas.height = GROESSE * dpr;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(quelle, (l.x - AUSSCHNITT / 2) * faktor, (l.y - AUSSCHNITT / 2) * faktor, AUSSCHNITT * faktor, AUSSCHNITT * faktor, 0, 0, canvas.width, canvas.height);
  });
</script>

<div class="lupe" style="display:{ort ? "block" : "none"}; left:{(ort?.x ?? 0) - GROESSE / 2}px; top:{ort?.y ?? 0}px; width:{GROESSE}px; height:{GROESSE}px" data-testid="lupe">
  <canvas bind:this={canvas} style="width:{GROESSE}px; height:{GROESSE}px"></canvas>
  <span class="kreuz"></span>
</div>

<style>
  .lupe { position: absolute; z-index: 6; border-radius: 50%; overflow: hidden; border: 3px solid #fff; box-shadow: 0 2px 12px rgba(0,0,0,.5); pointer-events: none; background: #222; }
  canvas { display: block; }
  .kreuz { position: absolute; inset: 0; pointer-events: none;
    background: linear-gradient(#fff, #fff) center / 2px 28px no-repeat, linear-gradient(#fff, #fff) center / 28px 2px no-repeat; filter: drop-shadow(0 0 1px #000); }
</style>
