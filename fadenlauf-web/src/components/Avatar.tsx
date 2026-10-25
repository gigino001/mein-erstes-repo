import { roleOf, type Role } from "../lib/logic";
import { defaultAvatar, type AvatarSettings, type Item } from "../lib/types";
import { useBlob } from "./ui";

const SCALE = { slim: 0.9, normal: 1, strong: 1.1 } as const;

/**
 * Zonen in Prozent der Bühne (Figur: viewBox 200×480). Wichtige Linien der Figur:
 * Schultern y≈13 %, Hüfte y≈45 %, Schritt y≈52 %, Knöchel y≈94 %, Fußsohle y≈98 %.
 * Kleidung wird in ihre Zone eingepasst (Seitenverhältnis bleibt), oben bündig, damit Säume an der richtigen Stelle landen.
 */
const ZONES: Record<Exclude<Role, "acc">, { l: number; t: number; w: number; h: number; z: number }> = {
  bottom: { l: 15, t: 43.5, w: 70, h: 50, z: 2 },
  shoes: { l: 20, t: 89.5, w: 60, h: 9.5, z: 3 },
  top: { l: 7, t: 12.5, w: 86, h: 38, z: 4 },
  mid: { l: 6, t: 12.3, w: 88, h: 40, z: 5 },
  outer: { l: 3, t: 12, w: 94, h: 48, z: 6 },
};

/** Schlichte, gesichtslose Figur im Stil einer Modezeichnung. Streng symmetrisch (rechte Hälfte = Spiegelung der linken). */
function Figure({ skin }: { skin: string }) {
  // Linke Körperhälfte von Halsansatz abwärts; die rechte entsteht durch Spiegelung an x=100.
  const left: [number, number][] = [[93, 62], [78, 66], [64, 72], [60, 84], [62, 130], [66, 170], [65, 215], [64, 250], [69, 335], [78, 452], [76, 468], [93, 468], [92, 452], [92, 335], [100, 255]];
  const mirror = left.slice(0, -1).reverse().map(([x, y]) => [200 - x, y] as [number, number]);
  const body = [...left, ...mirror].map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ") + "Z";
  const arm = (side: 1 | -1) => {
    const X = (x: number) => (side === 1 ? x : 200 - x);
    return `M${X(62)} 76 C${X(54)} 82 ${X(52)} 96 ${X(52)} 110 L${X(48)} 200 C${X(46)} 214 ${X(47)} 230 ${X(52)} 232 C${X(58)} 233 ${X(59)} 222 ${X(59)} 212 L${X(66)} 120 L${X(68)} 90Z`;
  };
  return (
    <svg viewBox="0 0 200 480" className="absolute inset-0 h-full w-full" aria-hidden>
      <g fill={skin} stroke="rgba(0,0,0,.2)" strokeWidth="1" strokeLinejoin="round">
        <path d={arm(1)} />
        <path d={arm(-1)} />
        <rect x="92" y="48" width="16" height="22" rx="4" />
        <path d={body} />
        <ellipse cx="100" cy="32" rx="17" ry="21" />
      </g>
    </svg>
  );
}

function Piece({ item, zone }: { item: Item; zone: { l: number; t: number; w: number; h: number; z: number } }) {
  const url = useBlob(item.imageId);
  return url ? <img src={url} alt={item.name} className="absolute drop-shadow-[0_3px_5px_rgba(0,0,0,.2)]" style={{ left: `${zone.l}%`, top: `${zone.t}%`, width: `${zone.w}%`, height: `${zone.h}%`, zIndex: zone.z, objectFit: "contain", objectPosition: "center top" }} /> : null;
}

/** Ob sich ein Outfit sinnvoll auf der Figur zeigen lässt: mindestens zwei Teile, die meisten freigestellt. */
export const avatarPossible = (items: Item[]) => items.length >= 2 && items.filter((i) => i.cutId && i.imageId === i.cutId).length >= items.length / 2;

export function AvatarStage({ items, settings = defaultAvatar }: { items: Item[]; settings?: AvatarSettings }) {
  // Nur freigestellte Teile liegen auf der Figur. Ein Foto mit Hintergrund würde als Rechteck auf dem Körper sitzen.
  const isCut = (i: Item) => !!i.cutId && i.imageId === i.cutId;
  const cut = items.filter(isCut), uncut = items.filter((i) => !isCut(i));
  const by: Record<Role, Item[]> = { outer: [], mid: [], top: [], bottom: [], shoes: [], acc: [] };
  cut.forEach((i) => by[roleOf(i.category)].push(i));
  // Pro Rolle trägt die Figur ein Teil; Rest (zweite Hose, Uhr, Tasche …) liegt als Zubehör daneben.
  const worn = (["bottom", "shoes", "top", "mid", "outer"] as const).flatMap((r) => (by[r][0] ? [[by[r][0], ZONES[r]] as const] : []));
  const extra = [...uncut, ...by.acc, ...(["outer", "mid", "top", "bottom", "shoes"] as const).flatMap((r) => by[r].slice(1))];
  return (
    <div className="relative flex items-stretch justify-center bg-tile px-4 py-5">
      <div className="relative aspect-[5/12] w-[52%] max-w-xs origin-bottom transition-transform" style={{ transform: `scaleX(${SCALE[settings.build]})` }}>
        <Figure skin={settings.skin} />
        {worn.map(([it, z]) => <Piece key={it.id} item={it} zone={z} />)}
      </div>
      {extra.length > 0 && (
        <div className="absolute right-3 top-4 flex w-[18%] flex-col gap-2">
          {extra.slice(0, 4).map((i) => <ExtraPiece key={i.id} item={i} />)}
        </div>
      )}
    </div>
  );
}
function ExtraPiece({ item }: { item: Item }) {
  const url = useBlob(item.imageId);
  return url ? <img src={url} alt={item.name} title={item.name} className="aspect-square w-full object-contain" /> : null;
}
