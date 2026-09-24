/**
 * Abstrakte Wimpern/Augen-Illustration als Platzhalter, solange keine echten
 * Fotos vorhanden sind (siehe PROJECT_PLAN.md). Bewusst als Line-Art
 * erkennbar — keine vorgetäuschte echte Fotografie.
 */
export function EyeIllustration({
  dense = false,
  stroke = "#16232B",
  accent = "#FF9398",
  className,
}: {
  /** true = volleres Wimpernbild ("Nachher"), false = dezenter ("Vorher") */
  dense?: boolean;
  stroke?: string;
  accent?: string;
  className?: string;
}) {
  const anchors = dense
    ? [
        { x: 42, y: 92 }, { x: 58, y: 82 }, { x: 76, y: 73 }, { x: 96, y: 67 },
        { x: 120, y: 64 }, { x: 144, y: 67 }, { x: 164, y: 73 }, { x: 182, y: 82 }, { x: 198, y: 92 },
      ]
    : [
        { x: 55, y: 88 }, { x: 88, y: 74 }, { x: 120, y: 68 }, { x: 152, y: 74 }, { x: 185, y: 88 },
      ];
  const lashLength = dense ? 34 : 22;
  const lashWidth = dense ? 3.2 : 2.4;

  return (
    <svg
      viewBox="0 0 240 160"
      className={className}
      role="img"
      aria-label={dense ? "Illustration: volles Wimpernset" : "Illustration: dezentes Wimpernset"}
    >
      {anchors.map((a, i) => {
        const dx = (a.x - 120) * 0.55;
        const tipX = a.x + dx * (lashLength / 40);
        const tipY = a.y - lashLength;
        const ctrlX = a.x + dx * 0.4;
        const ctrlY = a.y - lashLength * 0.55;
        return (
          <path
            key={i}
            d={`M ${a.x} ${a.y} Q ${ctrlX} ${ctrlY} ${tipX} ${tipY}`}
            fill="none"
            stroke={stroke}
            strokeWidth={lashWidth}
            strokeLinecap="round"
          />
        );
      })}
      <path
        d="M30,95 Q120,38 210,95 Q120,118 30,95 Z"
        fill="none"
        stroke={stroke}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <circle cx={120} cy={92} r={15} fill={stroke} />
      <circle cx={125} cy={87} r={4} fill={accent} />
    </svg>
  );
}
