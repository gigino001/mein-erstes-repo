import { z } from "zod";

const str = z.string().catch("");
const strs = z.array(z.string()).catch([]);
const palette = z.array(z.object({ name: str, hex: str })).catch([]);

export const GenerateResponse = z.object({
  greeting: str, assumptions: str, question: z.string().nullable().catch(null),
  outfits: z.array(z.any()).catch([]), missing: strs,
});
export const AdjustResponse = z.object({ outfit: z.any().catch(null), changed: str });
export const ItemAnalysis = z.object({
  error: z.string().optional(), name: str, category: str, color: str, colorHex: str, pattern: str, material: str, details: str, fit: str,
  styles: strs, seasons: strs, weather: str, formality: z.coerce.number().catch(3), occasions: strs, uncertain: strs,
});
export const InspoAnalysisSchema = z.object({
  error: z.string().optional(), title: str, style: str, palette, pieces: strs, fits: str, shoes: str, accessories: str,
  elegance: z.coerce.number().catch(3), layering: str, summary: str, tags: strs,
});
export const StyleAnalysisSchema = z.object({ features: str, palette, styles: strs, cuts: str, combos: str, tryLooks: strs });
export const LearnResponse = z.object({ general: strs, occasions: z.record(z.string(), z.union([z.array(z.string()), z.string()])).catch({}) });
export const PatternsResponse = z.object({ recurring: strs });
export const TripResponse = z.object({
  title: str, itemIds: strs, tips: str, missing: strs,
  days: z.array(z.object({ label: str, itemIds: strs, note: str })).catch([]),
});
export type ItemAnalysisT = import("zod").infer<typeof ItemAnalysis>;
