export const AUFTRAGSVARIANTEN = [
  { value: "PV", label: "Photovoltaik" },
  { value: "WAERMEPUMPE", label: "Wärmepumpe" },
  { value: "KLIMA", label: "Klimaanlage" },
  { value: "WARTUNG", label: "Wartung" },
  { value: "ELEKTROINSTALLATION", label: "Haus-Elektroinstallation" },
  { value: "HEIZUNG_SANITAER_NEUBAU", label: "Heizung/Sanitär Neubau" },
] as const;

export const AUFTRAGSVARIANTEN_MIT_ASSISTENT = ["PV", "WAERMEPUMPE", "KLIMA"] as const;

export const PIPELINE_STATUS = [
  { value: "INTERESSENT", label: "Interessent" },
  { value: "TERMIN", label: "Termin" },
  { value: "ANGEBOT", label: "Angebot" },
  { value: "WIEDERVORLAGE", label: "Wiedervorlage" },
  { value: "KUNDE", label: "Kunde" },
] as const;

export const BUILDING_TYPES = [
  { value: "EFH", label: "Einfamilienhaus" },
  { value: "DHH", label: "Doppelhaushälfte" },
  { value: "MFH", label: "Mehrfamilienhaus" },
  { value: "GEWERBE", label: "Gewerbe" },
] as const;

export const ORIENTATIONS = [
  { value: "N", label: "Nord" },
  { value: "NO", label: "Nordost" },
  { value: "O", label: "Ost" },
  { value: "SO", label: "Südost" },
  { value: "S", label: "Süd" },
  { value: "SW", label: "Südwest" },
  { value: "W", label: "West" },
  { value: "NW", label: "Nordwest" },
] as const;

export const ROOF_SHAPES = [
  { value: "SATTELDACH", label: "Satteldach" },
  { value: "WALMDACH", label: "Walmdach" },
  { value: "FLACHDACH", label: "Flachdach" },
  { value: "PULTDACH", label: "Pultdach" },
  { value: "ZELTDACH", label: "Zeltdach" },
  { value: "SONSTIGE", label: "Sonstige" },
] as const;

export const SHADING_LEVELS = [
  { value: "KEINE", label: "Keine" },
  { value: "LEICHT", label: "Leicht" },
  { value: "MITTEL", label: "Mittel" },
  { value: "STARK", label: "Stark" },
] as const;

export const INSULATION_STANDARDS = [
  { value: "UNSANIERT", label: "Unsaniert" },
  { value: "TEILSANIERT", label: "Teilsaniert" },
  { value: "SANIERT", label: "Saniert" },
  { value: "NEUBAU", label: "Neubau / KfW-Standard" },
] as const;

export const HEATING_TYPES = [
  { value: "GAS", label: "Gas" },
  { value: "OEL", label: "Öl" },
  { value: "ELEKTRO", label: "Elektro (Nachtspeicher)" },
  { value: "PELLET", label: "Pellet" },
  { value: "FERNWAERME", label: "Fernwärme" },
  { value: "SONSTIGE", label: "Sonstige" },
] as const;

export const HEAT_EMITTER_TYPES = [
  { value: "FUSSBODENHEIZUNG", label: "Fußbodenheizung" },
  { value: "HEIZKOERPER", label: "Heizkörper" },
  { value: "MISCHSYSTEM", label: "Mischsystem" },
] as const;

export const COMPONENT_CATEGORIES = [
  { value: "MODUL", label: "PV-Modul" },
  { value: "WECHSELRICHTER", label: "Wechselrichter" },
  { value: "SPEICHER", label: "Batteriespeicher" },
  { value: "WALLBOX", label: "Wallbox" },
  { value: "ENERGIEMANAGER", label: "Energiemanagement" },
  { value: "MONTAGESYSTEM", label: "Montagesystem" },
  { value: "WAERMEPUMPE", label: "Wärmepumpe" },
  { value: "PUFFERSPEICHER", label: "Pufferspeicher" },
  { value: "KLIMAGERAET", label: "Klimagerät" },
  { value: "MONTAGE", label: "Montage & Installation" },
  { value: "DIENSTLEISTUNG", label: "Dienstleistung" },
  { value: "GARANTIE", label: "Garantie" },
  { value: "SONSTIGES", label: "Sonstiges" },
] as const;

export const COMPONENT_UNITS = [
  { value: "Stück", label: "Stück" },
  { value: "Pauschale", label: "Pauschale" },
  { value: "kWp", label: "kWp" },
  { value: "Stunde", label: "Stunde" },
  { value: "je Feld", label: "je Feld" },
] as const;

export function labelFor(
  options: ReadonlyArray<{ value: string; label: string }>,
  value: string | null | undefined
) {
  return options.find((o) => o.value === value)?.label ?? value ?? "–";
}
