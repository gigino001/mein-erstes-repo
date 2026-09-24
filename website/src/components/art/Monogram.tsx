/**
 * Abstraktes Monogramm als Platzhalter für Claudias Porträt — bewusst kein
 * generiertes/gestelltes Gesicht, um keine Fotografie vorzutäuschen.
 */
export function Monogram({
  initials = "CG",
  className,
}: {
  initials?: string;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 240 240" className={className} role="img" aria-label={`Monogramm ${initials}`}>
      <circle cx={120} cy={120} r={92} fill="none" stroke="#16232B" strokeWidth={2} strokeDasharray="2 10" strokeLinecap="round" />
      <text
        x="120"
        y="138"
        textAnchor="middle"
        fontFamily="Fraunces, serif"
        fontStyle="italic"
        fontWeight={500}
        fontSize="72"
        fill="#16232B"
      >
        {initials}
      </text>
    </svg>
  );
}
