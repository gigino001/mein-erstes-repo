export function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  });
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  if (rest === 0) return `${hours} Std.`;
  return `${hours} Std. ${rest}`;
}

export const CATEGORY_LABELS: Record<string, string> = {
  neumodellage: "Neumodellage",
  auffuellen: "Auffülltermine",
  sonstiges: "Sonstiges",
};
