export type FormatType = "kurzerklart" | "360grad" | "sprachnachricht" | "ar-avatar";

export const FORMAT_LABELS: Record<FormatType, string> = {
  kurzerklart: "#kurzerklärt",
  "360grad": "360-Grad-Rundgang",
  sprachnachricht: "Sprachnachricht",
  "ar-avatar": "Augmented Reality-Avatar",
};

export const PRODUKTION_PREISE: Record<FormatType, number> = {
  kurzerklart: 4900,
  "360grad": 14900,
  sprachnachricht: 0,
  "ar-avatar": 0,
};

export type SvGebiet = "regional" | "bundesland" | "bundesweit";

// Schulvermarktung wird pro Format einzeln ausgewiesen: Sprachnachricht hat
// einen eigenen (günstigeren) Preis, alle anderen Formate (#kurzerklärt /
// 360-Grad / AR-Avatar) teilen sich denselben Preis.
export const SV_PREISE_SPRACHNACHRICHT: Record<SvGebiet, number> = {
  regional: 3000,
  bundesland: 4500,
  bundesweit: 6000,
};

export const SV_PREISE_ANDERE: Record<SvGebiet, number> = {
  regional: 4500,
  bundesland: 7500,
  bundesweit: 10500,
};

export const SV_GEBIET_LABELS: Record<SvGebiet, string> = {
  regional: "Regional – 50 km Umkreis",
  bundesland: "Bundesland",
  bundesweit: "Deutschlandweit",
};

export type PartnerschulenModus = "keine" | "regional" | "bundesland" | "deutschlandweit";

export const PARTNERSCHULEN_MODUS_LABELS: Record<PartnerschulenModus, string> = {
  keine: "Keine Angabe",
  regional: "Regional",
  bundesland: "Bundesland",
  deutschlandweit: "Deutschlandweit",
};

export const BUNDESLAENDER = [
  "Baden-Württemberg",
  "Bayern",
  "Berlin",
  "Brandenburg",
  "Bremen",
  "Hamburg",
  "Hessen",
  "Mecklenburg-Vorpommern",
  "Niedersachsen",
  "Nordrhein-Westfalen",
  "Rheinland-Pfalz",
  "Saarland",
  "Sachsen",
  "Sachsen-Anhalt",
  "Schleswig-Holstein",
  "Thüringen",
] as const;

export type Bundesland = (typeof BUNDESLAENDER)[number];

export const UNTERSCHRIFTEN = [
  "Franziska Miodek",
  "Ferdinand Sieglin",
  "Marie Hemmis",
  "Ann-Kathrin Fees",
  "Robert Greve",
] as const;

export type Unterschrift = (typeof UNTERSCHRIFTEN)[number];

export const CALENDLY_LINKS: Record<Unterschrift, string> = {
  "Franziska Miodek": "https://calendly.com/franziska-miodek-deinerstertag/30min",
  "Ferdinand Sieglin": "https://calendly.com/ferdinand-sieglin/30min?back=1",
  "Marie Hemmis": "https://calendly.com/marie-hemmis/dein-erster-tag-follow-up?back=1",
  "Ann-Kathrin Fees": "https://calendly.com/ann-kathrin-fees/dein-erster-tag-follow-up-30-min",
  "Robert Greve": "https://calendly.com/robert-greve/termin-mit-robert?back=1",
};

export interface Person {
  vorname: string;
  nachname: string;
  geschlecht: "maennlich" | "weiblich";
}

// Live veröffentlichte Präsentation aus dem Präsentations-Generator
// (kommt aus dem gemeinsamen Redis-Store, Key "praesentationen").
export interface PraesentationEntry {
  id: string;
  companyName: string;
  url: string;
  password: string;
  createdAt: string;
}

// Beispielmedium (#kurzerklärt / 360-Grad) aus der Angebotssuche auf deinerstertag.de
export interface BeispielMedium {
  id: string;
  beruf: string;
  unternehmen: string;
  ort: string;
  url: string;
}

export interface FormatData {
  type: FormatType;
  beispielTitel: string;
  beispielLink: string;
  beispielId: string; // gewähltes Angebot aus der deinerstertag.de-Liste ("" = manuell/keins)
}

export interface FormData {
  anredeSiezen: boolean;
  personen: Person[];

  formate: FormatData[];

  svGebiet: SvGebiet;

  partnerschulenModus: PartnerschulenModus;
  partnerschulenUmkreis: string;
  partnerschulenOrt: string;
  partnerschulenAnzahl: string;
  partnerschulenBundesland: Bundesland | "";
  partnerschulenBundeslandAnzahl: string;

  anhang: boolean;
  formalAngebot: boolean;
  abschluss: "nachhaken" | "followup";
  followUpDatum: string;
  followUpUhrzeit: string;
  nachhakenZeitraum: string;

  unterschrift: Unterschrift;

  praesentation: PraesentationEntry | null; // null = kein Präsentations-Block in der Mail
}

export const DEFAULT_FORM: FormData = {
  anredeSiezen: true,
  personen: [{ vorname: "", nachname: "", geschlecht: "weiblich" }],

  formate: [
    { type: "sprachnachricht", beispielTitel: "", beispielLink: "", beispielId: "" },
  ],

  svGebiet: "regional",

  partnerschulenModus: "keine",
  partnerschulenUmkreis: "",
  partnerschulenOrt: "",
  partnerschulenAnzahl: "",
  partnerschulenBundesland: "",
  partnerschulenBundeslandAnzahl: "",

  anhang: false,
  formalAngebot: true,
  abschluss: "nachhaken",
  followUpDatum: "",
  followUpUhrzeit: "",
  nachhakenZeitraum: "",

  unterschrift: "Robert Greve",

  praesentation: null,
};
