import { roleOf, type Role } from "../lib/logic";
import { defaultAvatar, type AvatarSettings, type Item } from "../lib/types";
import { useBlob } from "./ui";

const SCALE = { slim: 0.9, normal: 1, strong: 1.1 } as const;

/** Wo welche Rolle auf der Figur liegt (Prozent der Bühne). Entspricht den Proportionen von FIGURE unten. */
const ZONES: Record<Exclude<Role, "acc">, { l: number; t: number; w: number; h: number; z: number }> = {
  bottom: { l: 27, t: 47, w: 46, h: 46, z: 2 },
  shoes: { l: 24, t: 90, w: 52, h: 9, z: 3 },
  top: { l: 15, t: 16.5, w: 70, h: 37, z: 4 },
  mid: { l: 14, t: 16, w: 72, h: 39, z: 5 },
  outer: { l: 11, t: 15.5, w: 78, h: 44, z: 6 },
};

/** Schlichte, gesichtslose Figur im Stil einer Modezeichnung. */
function Figure({ skin }: { skin: string }) {
  return (
    <svg viewBox="0 0 200 480" className="absolute inset-0 h-full w-full" aria-hidden>
      <g fill={skin} stroke="rgba(0,0,0,.18)" strokeWidth="1">
        <ellipse cx="100" cy="30" rx="19" ry="23" />
        <path d="M91 50h18v16c0 4 14 8 36 12 9 2 13 9 14 18l4 70c0 6-9 7-10 1l-4-52-4 52c-1 12-3 24-3 36l2 22-76 0 2-22c0-12-2-24-3-36l-4-52-4 52c-1 6-10 5-10-1l4-70c1-9 5-16 14-18 22-4 36-8 36-12z" />
        <path d="M62 224h76l-2 120-8 118c0 6-8 6-9 0l-9-110-9 110c-1 6-9 6-9 0l-8-118z" />
      </g>
    </svg>
  );
}

function Piece({ item, zone }: { item: Item; zone: { l: number; t: number; w: number; h: number; z: number } }) {
  const url = useBlob(item.imageId);
  return url ? <img src={url} alt={item.name} className="absolute object-contain drop-shadow-[0_3px_5px_rgba(0,0,0,.18)]" style={{ left: `${zone.l}%`, top: `${zone.t}%`, width: `${zone.w}%`, height: `${zone.h}%`, zIndex: zone.z }} /> : null;
}

/** Ob sich ein Outfit sinnvoll auf der Figur zeigen lässt: mindestens zwei Teile, die meisten freigestellt. */
export const avatarPossible = (items: Item[]) => items.length >= 2 && items.filter((i) => i.cutId && i.imageId === i.cutId).length >= items.length / 2;

export function AvatarStage({ items, settings = defaultAvatar }: { items: Item[]; settings?: AvatarSettings }) {
  const by: Record<Role, Item[]> = { outer: [], mid: [], top: [], bottom: [], shoes: [], acc: [] };
  items.forEach((i) => by[roleOf(i.category)].push(i));
  // Pro Rolle trägt die Figur ein Teil; Rest (zweite Hose, Uhr, Tasche …) liegt als Zubehör daneben.
  const worn = (["bottom", "shoes", "top", "mid", "outer"] as const).flatMap((r) => (by[r][0] ? [[by[r][0], ZONES[r]] as const] : []));
  const extra = [...by.acc, ...(["outer", "mid", "top", "bottom", "shoes"] as const).flatMap((r) => by[r].slice(1))];
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
