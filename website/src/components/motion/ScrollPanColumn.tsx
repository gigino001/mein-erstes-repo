"use client";

import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/**
 * Vertikale Spalte, die sich an die Scroll-Position koppelt: man scrollt
 * normal nach unten, der Inhalt wandert dabei innerhalb eines Sichtfensters
 * nach oben durch — kein Klicken/Wischen nötig. Vertikales Gegenstück zu
 * ScrollPanRow, siehe PROJECT_PLAN.md, "Bewegung im Design".
 */
export function ScrollPanColumn({
  children,
  heightVh = 220,
  shiftPercent = 45,
  windowHeight = "64vh",
}: {
  children: ReactNode;
  heightVh?: number;
  shiftPercent?: number;
  windowHeight?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", `-${shiftPercent}%`]);

  return (
    <div ref={ref} style={{ height: `${heightVh}vh` }} className="relative">
      <div className="sticky top-0 overflow-hidden" style={{ height: windowHeight }}>
        <motion.div style={{ y }} className="flex flex-col gap-6 px-6 md:px-18 will-change-transform">
          {children}
        </motion.div>
      </div>
    </div>
  );
}
