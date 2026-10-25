export const CATS = ["T-Shirts & Polos","Hemden","Pullover & Strick","Sweatshirts & Hoodies","Hosen & Jeans","Shorts","Anzüge & Sakkos","Jacken & Mäntel","Schuhe & Sneaker","Gürtel","Uhren & Schmuck","Taschen","Weitere Accessoires"] as const;
export const SEASONS = ["Frühling","Sommer","Herbst","Winter"] as const;
export const FITS = ["Slim","Regular","Relaxed","Oversized","Tailored"] as const;
export const STYLES = [
  { k: "Klassisch", d: "Zeitlose Schnitte, harmonische Farben, hochwertige Kombinationen." },
  { k: "Lässig", d: "Entspannte, moderne Alltagslooks." },
  { k: "Elegant", d: "Stilvoll für gehobene Anlässe und besondere Momente." },
  { k: "Sportlich", d: "Bequem, dynamisch, sportlich inspiriert." },
] as const;
export const ADJUSTMENTS = ["Lässiger","Eleganter","Weniger elegant","Sportlicher","Klassischer","Moderner","Auffälliger","Dezenter","Andere Schuhe","Andere Hose","Anderes Oberteil","Alternative Farben"];
export const REJECT_REASONS = ["Zu elegant","Zu lässig","Farben passen nicht","Passt nicht zum Anlass","Ein Teil gefällt mir nicht"];
export const WEATHER_CONDITIONS = ["Sonnig","Bewölkt","Regen","Wind","Schnee"] as const;

export type Palette = { name: string; hex: string }[];
export type Analysis = { features: string; palette: Palette; styles: string[]; cuts: string; combos: string; tryLooks: string[]; createdAt?: number };
export type Learned = { general: string[]; occasions: Record<string, string[]>; updatedAt?: number };

export type Profile = {
  name: string; age: string; height: string; measures: string; fits: string[];
  likeColors: string; dislikeColors: string; brands: string; goals: string;
  styles: string[]; styleText: string; analysis: Analysis | null; learned: Learned;
  inspoSummary: string[]; customCats: string[]; fbCount: number; onboarded: boolean;
  hemisphere: "north" | "south"; createdAt: number; avatar?: AvatarSettings;
};
export type AvatarSettings = { build: "slim" | "normal" | "strong"; skin: string };
export const SKIN_TONES = ["#f3d9c4", "#e8bf9e", "#d3a07a", "#b27a55", "#8a5a3c", "#5e3b27"];
export const defaultAvatar: AvatarSettings = { build: "normal", skin: SKIN_TONES[1] };

export type Item = {
  id: string; imageId: string; origId: string | null; cutId: string | null; cutTried?: boolean;
  status: "pending" | "ready" | "manual"; createdAt: number; archived?: boolean;
  name: string; category: string; color: string; colorHex?: string; pattern: string; material: string;
  details: string; fit: string; styles: string[]; seasons: string[]; weather: string; formality: number;
  occasions: string[]; uncertain: string[]; brand?: string; price?: string; notes?: string;
};

export type InspoAnalysis = { title?: string; style?: string; palette?: Palette; pieces?: string[]; fits?: string; shoes?: string; accessories?: string; elegance?: number; layering?: string; summary?: string; tags?: string[]; error?: string };
export type Inspo = { id: string; imageId: string; status: "pending" | "ready"; createdAt: number; fav: boolean; comment: string; tags: string[]; analysis?: InspoAnalysis };

export type Outfit = {
  id: string; label: string; itemIds: string[]; reason: string; effect: string; formality: number; tips: string; context: string;
  request: string; assumptions?: string; createdAt: number; rating: -1 | 0 | 1; fav: boolean; rejectReason?: string | null;
  itemFeedback?: Record<string, -1 | 0 | 1>; adjustments?: string[]; parent?: string; replaced?: boolean;
};
export type WearEntry = { id: string; outfitId: string | null; itemIds: string[]; date: number };
export type Trip = {
  id: string; title: string; dest: string; days: number; weather: string; plans: string; bag: string; itemIds: string[];
  plan: { label: string; itemIds: string[]; note: string }[]; tips: string; missing: string[]; packed: Record<string, boolean>; createdAt: number;
};

export type Collections = { items: Item; inspo: Inspo; outfits: Outfit; trips: Trip; wear: WearEntry };
export type Col = keyof Collections;

export const emptyProfile = (name = ""): Profile => ({
  name, age: "", height: "", measures: "", fits: [], likeColors: "", dislikeColors: "", brands: "", goals: "",
  styles: [], styleText: "", analysis: null, learned: { general: [], occasions: {} }, inspoSummary: [], customCats: [],
  fbCount: 0, onboarded: false, hemisphere: "north", createdAt: Date.now(),
});
