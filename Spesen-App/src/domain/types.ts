export type DayType = 'arbeit' | 'urlaub' | 'krank' | 'abbau' | 'feiertag'

/** Ein erfasster Tag. `date` ist 'YYYY-MM-DD'. Zeiten sind 'HH:MM'. */
export interface DayEntry {
  date: string
  type: DayType
  /** Halber Tag Abwesenheit (Urlaub, Krank, Abfeiern). Die andere Hälfte wird gearbeitet. */
  half: boolean
  start?: string
  end?: string
  /** null/undefined = automatisch, sonst fester Betrag in Euro (z. B. 0). */
  verpOverride?: number | null
  note?: string
}

export const TYPE_LABEL: Record<DayType, string> = {
  arbeit: 'Arbeit',
  urlaub: 'Urlaub',
  krank: 'Krank',
  abbau: 'Abfeiern',
  feiertag: 'Feiertag',
}

/** Manuelle Eingaben für ein Jahr. Fehlt ein Wert, rechnet die App automatisch. */
export interface VacationYear {
  /** Urlaubsanspruch des Jahres in Tagen (Halbe erlaubt), z. B. bei Eintritt mitten im Jahr. */
  days?: number
  /** Resturlaub aus dem Vorjahr. Ohne Eingabe: automatisch der Rest des Vorjahres. */
  carryOver?: number
}

export interface Settings {
  /** Name auf der Abrechnung. */
  name: string
  /** Soll pro Arbeitstag (Mo–Fr) in Minuten. */
  sollMinutes: number
  /** Verpflegungspauschale überhaupt verwenden? Aus: keine Pauschale, nirgends. */
  verpEnabled: boolean
  /** Verpflegungspauschale in Euro. */
  verpRate: number
  /** Nur Arbeitstage mit mehr Arbeitszeit (Minuten) als dieser Wert bekommen die Pauschale. */
  verpThresholdMinutes: number // Pauschale nur bei MEHR Arbeitszeit als diesem Wert
  /** Zeiten werden auf dieses Raster gerundet. */
  roundMinutes: number
  /** Startsaldo des Stundenkontos in Minuten. */
  openingBalance: number
  /** Ab diesem Datum (inkl.) zählen Tage zum Konto. */
  openingDate: string
  mailTo: string
  mailSubject: string
  /** Urlaubstage, die am 1. Januar jedes Jahres dazukommen. */
  vacationDefaultDays: number
  /** Manuelle Eingaben je Jahr ('2026' → Anspruch und/oder Resturlaub). Alles andere rechnet die App. */
  vacation?: Record<string, VacationYear>
  /** 2 = Eingaben bedeuten „manuell, sonst automatisch". Ältere Daten werden beim Laden umgestellt. */
  vacationVersion?: number
  /** Zeitpunkt der letzten Sicherung (Epoch-ms). */
  lastBackupAt?: number
  /** Erinnerung an die Sicherung bis dahin ausblenden (Epoch-ms). */
  backupSnoozeUntil?: number
}

export const DEFAULT_SETTINGS: Settings = {
  name: 'Adriano Falcone',
  sollMinutes: 480,
  verpEnabled: true,
  verpRate: 14,
  verpThresholdMinutes: 480,
  roundMinutes: 15,
  openingBalance: 0,
  openingDate: '2026-01-01',
  mailTo: '',
  mailSubject: 'Spesen Adriano Falcone',
  vacationDefaultDays: 30,
  vacationVersion: 2,
}

export type Category = 'sprit' | 'parken' | 'hotel' | 'bewirtung' | 'material' | 'sonstiges'

export const CATEGORY_LABEL: Record<Category, string> = {
  sprit: 'Sprit / Strom',
  parken: 'Parken',
  hotel: 'Hotel',
  bewirtung: 'Bewirtung',
  material: 'Material',
  sonstiges: 'Sonstiges',
}
