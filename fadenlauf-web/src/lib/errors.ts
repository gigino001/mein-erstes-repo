export class AppError extends Error {
  code: string;
  constructor(code: string, message?: string) { super(message ?? code); this.code = code; }
}
const TEXTS: Record<string, string> = {
  no_ai: "Die KI ist nicht eingerichtet. Hinterlege unter Profil → KI einen API-Schlüssel.",
  not_granted: "Der Zugriff auf die KI ist nicht erlaubt.",
  rate_limited: "Gerade zu viele Anfragen. Versuch es in einer Minute noch einmal.",
  daily_limit: "Dein Tageslimit für KI-Anfragen ist erreicht. Morgen geht es weiter.",
  invalid_json: "Die Antwort der KI war unvollständig. Bitte noch einmal versuchen.",
  refused: "Diese Anfrage wurde abgelehnt. Formuliere sie bitte anders.",
  image_rejected: "Das Bild konnte nicht gelesen werden. Versuch ein anderes Foto (JPG oder PNG).",
  quota: "Der Speicher ist voll. Lösche alte Einträge.",
  offline: "Keine Verbindung. Prüfe dein Netz und versuche es erneut.",
  auth: "Bitte melde dich neu an.",
};
export const errText = (e: unknown) => TEXTS[(e as AppError)?.code] ?? "Etwas ist schiefgelaufen. Bitte noch einmal versuchen.";
