"use client";

import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/**
 * Horizontale Reihe, die sich an die Scroll-Position koppelt: man scrollt
 * normal nach unten, der Inhalt wandert dabei seitlich durch — kein
 * Klicken/Swipen nötig. Siehe PROJECT_PLAN.md, "Bewegung im Design".
 */
export function ScrollPanRow({
  children,
  heightVh = 220,
  shiftPercent = 45,
}: {
  children: ReactNode;
  heightVh?: number;
  shiftPercent?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const x = useTransform(scrollYProgress, [0, 1], ["0%", `-${shiftPercent}%`]);

  return (
    <div ref={ref} style={{ height: `${heightVh}vh` }} className="relative">
      <div className="sticky top-0 py-24 overflow-hidden">
        <motion.div style={{ x }} className="flex gap-6 px-6 md:px-18 will-change-transform">
          {children}
        </motion.div>
      </div>
    </div>
  );
}
