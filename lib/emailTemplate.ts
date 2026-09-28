import {
  FormData,
  FormatData,
  FORMAT_LABELS,
  Person,
  PRODUKTION_PREISE,
  SV_PREISE_SPRACHNACHRICHT,
  SV_PREISE_ANDERE,
  SvGebiet,
  CALENDLY_LINKS,
} from "./types";


interface P {
  IhrEuer: string;
  IhnenDir: string;
  SieIhr: string;
  IhreEure: string;
  IhrerEurer: string;
  IhremEurem: string;
  IhrenEuren: string;
  erhaltenErhaltet: string;
  gebenGebt: string;
  findenFindet: string;
  sendeZu: string;
  ueberzeugtSelbst: string;
  gebtBescheid: string;
}

function pron(siezen: boolean, mehrzahl = false): P {
  if (siezen) {
    return {
      IhrEuer: "Ihr",
      IhnenDir: "Ihnen",
      SieIhr: "Sie",
      IhreEure: "Ihre",
      IhrerEurer: "Ihrer",
      IhremEurem: "Ihrem",
      IhrenEuren: "Ihren",
      erhaltenErhaltet: "erhalten",
      gebenGebt: "geben",
      findenFindet: "finden Sie",
      sendeZu: "sende ich Ihnen",
      ueberzeugtSelbst: "Überzeugen Sie sich",
      gebtBescheid: "geben Sie mir",
    };
  }
  return {
    IhrEuer: "Euer",
    IhnenDir: mehrzahl ? "euch" : "dir",
    SieIhr: "ihr",
    IhreEure: "Eure",
    IhrerEurer: "eurer",
    IhremEurem: "eurem",
    IhrenEuren: "euren",
    erhaltenErhaltet: "erhaltet",
    gebenGebt: "gebt",
    findenFindet: "findet ihr",
    sendeZu: mehrzahl ? "sende ich euch" : "sende ich dir",
    ueberzeugtSelbst: mehrzahl ? "Überzeugt euch" : "Überzeug dich",
    gebtBescheid: mehrzahl ? "gebt mir" : "gib mir",
  };
}

function buildAnrede(personen: Person[], siezen: boolean): string {
  const active = personen.filter((p) => p.vorname.trim() || p.nachname.trim());
  if (active.length === 0) return "";
  const parts = active.map((p, i) => {
    let phrase: string;
    if (siezen) {
      phrase =
        p.geschlecht === "maennlich"
          ? `Sehr geehrter Herr ${p.nachname}`
          : `Sehr geehrte Frau ${p.nachname}`;
    } else {
      phrase = p.geschlecht === "maennlich" ? `Lieber ${p.vorname}` : `Liebe ${p.vorname}`;
    }
    return i > 0 ? phrase.charAt(0).toLowerCase() + phrase.slice(1) : phrase;
  });
  return parts.join(", ") + ",";
}

function gebietPhrase(gebiet: SvGebiet, p: P): string {
  if (gebiet === "regional") return `in ${p.IhrerEurer} Region`;
  if (gebiet === "bundesland") return `in ${p.IhremEurem} Bundesland`;
  return "bundesweit";
}

function formatPreis(n: number): string {
  return n.toLocaleString("de-DE");
}

function buildBerufsmediumSection(formate: FormatData[], p: P): string {
  const bullet = formate.length > 1 ? "▪ " : "";
  const lines: string[] = [];
  lines.push(`${p.IhrEuer} Berufsmedium`);
  lines.push("");

  formate.forEach((f) => {
    if (f.type === "sprachnachricht") {
      lines.push(
        `${bullet}Durch eine **Sprachnachricht** wird ${p.IhrEuer} Beruf bei uns lebendig und authentisch dargestellt. Die Vertonung kann entweder direkt durch eine oder einen ${p.IhrerEurer} Auszubildenden erfolgen oder alternativ KI-gestützt produziert werden. Darüber hinaus wird ${p.IhrEuer} Beruf in unseren **Mini-Games** und im **Azubi-Chat** erkundet und entdeckt.`
      );
      lines.push("");
    }
    if (f.type === "kurzerklart") {
      lines.push(
        `${bullet}Mit **#kurzerklärt** präsentieren wir einen Ausbildungsberuf auf unterhaltsame, moderne und kompakte Weise. Wir begleiten den gesamten Produktionsprozess – vom Kickoff über das Drehbuch bis hin zu Schnitt und Vertonung.`
      );
      if (f.beispielTitel) {
        const url = f.beispielLink
          ? (f.beispielLink.startsWith("http") ? f.beispielLink : `https://${f.beispielLink}`)
          : "";
        const ex = url ? `[${f.beispielTitel}](${url})` : f.beispielTitel;
        lines.push(`--> Hier eine Beispielproduktion: ${ex}`);
      }
      lines.push("");
    }
    if (f.type === "360grad") {
      lines.push(
        `${bullet}Mit einem aufregenden **360-Grad-Rundgang** ${p.gebenGebt} ${p.SieIhr} Schüler*innen authentische Einblicke in ${p.IhreEure} Ausbildungs- und Betriebsräume. ${p.ueberzeugtSelbst} selbst von der Wirkung unserer 360°-Filme: ${p.gebtBescheid} einfach kurz Bescheid, dann ${p.sendeZu} unsere VR-Brille für 2–3 Wochen zum unverbindlichen Ausprobieren zu.`
      );
      if (f.beispielTitel) {
        const url = f.beispielLink
          ? (f.beispielLink.startsWith("http") ? f.beispielLink : `https://${f.beispielLink}`)
          : "";
        const ex = url ? `[${f.beispielTitel}](${url})` : f.beispielTitel;
        lines.push(`--> Hier eine Beispielproduktion: ${ex}`);
      }
      lines.push("");
    }
    if (f.type === "ar-avatar") {
      lines.push(
        `${bullet}Mit einem **Augmented-Reality-Avatar** lassen wir aus einer GameCard in ${p.IhremEurem} CI und ${p.IhrerEurer} Arbeitskleidung ein 3D-Avatar ${p.IhrerEurer} Azubis „auferstehen" – Schüler*innen können mit diesem Avatar interagieren: in der Schule, auf Messen oder zu Hause, denn die GameCard funktioniert zugleich als Visitenkarte.`
      );
      lines.push(
        `--> Den allerersten Prototyp gibt es [hier](https://youtube.com/shorts/qoy8ReZhoMY) zu sehen (Hinweis: Der Prototyp befindet sich noch in der Konzeptionsphase und wird in den nächsten Wochen weiterentwickelt.)`
      );
      lines.push("");
    }
  });

  // trim trailing blank lines so no extra spacing before next section
  return lines.join("\n").replace(/\n+$/, "");
}

function buildSVSection(gebiet: SvGebiet, p: P, partnerschulenText: string): string {
  const medienboxLink = "https://www.deinerstertag.de/schulen/medienbox/";
  const videostundeLink = "https://www.deinerstertag.de/schulen/videostunde/";
  const schulsuche = "https://www.deinerstertag.de/schulsuche/";
  const phrase = gebietPhrase(gebiet, p);
  const zugang =
    gebiet === "bundesweit"
      ? "einen bundesweiten Zugang zu Schüler*innen"
      : `einen direkten Zugang zu Schüler*innen ${phrase}`;

  const lines: string[] = [];
  lines.push("Unsere Schulvermarktung");
  lines.push("");
  lines.push(
    `${p.IhreEure} Medien erreichen Schulen ${phrase} über drei zentrale Wege: unsere kostenfrei ausleihbare Medienbox (${medienboxLink}), unsere Videostunde (${videostundeLink}) mit praxisnahen Berufseinblicken direkt im Klassenzimmer sowie die Berufsberatung der Arbeitsagenturen. Mehr als die Hälfte aller deutschen Arbeitsagenturen nutzt unsere Formate bereits an Schulen und auf Messen.`
  );
  lines.push("");
  lines.push(
    `So ermöglichen wir ${p.IhnenDir} ${zugang} – mit einem Schülerkontakt, der bis zu 90 % günstiger ist als auf Schülermessen.`
  );
  if (partnerschulenText) {
    lines.push("");
    lines.push(partnerschulenText);
  }
  lines.push("");
  lines.push(
    `Auf unserer Schulsuche (${schulsuche}) ${p.findenFindet}, welche Schulen und Arbeitsagenturen derzeit ${phrase} bei uns aktiv sind.`
  );
  return lines.join("\n");
}

// Unbefristete Nutzungsrechte: #kurzerklärt / 360-Grad.
// Befristete Nutzungsrechte (bis Ende Vertragslaufzeit): Sprachnachricht / AR-Avatar.
const UNBEFRISTET_TYPES: FormatData["type"][] = ["kurzerklart", "360grad"];

const FORMAT_PHRASE_DATIV: Record<FormatData["type"], string> = {
  kurzerklart: "#kurzerklärt",
  "360grad": "den 360-Grad-Rundgängen",
  sprachnachricht: "den Sprachnachrichten und den Mini-Games",
  "ar-avatar": "dem AR-Avatar",
};

function joinNatural(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return items.slice(0, -1).join(", ") + " und " + items[items.length - 1];
}

function buildNutzungsrechteSection(formate: FormatData[], p: P): string {
  const unbefristet = formate
    .filter((f) => UNBEFRISTET_TYPES.includes(f.type))
    .map((f) => FORMAT_PHRASE_DATIV[f.type]);
  const befristet = formate
    .filter((f) => !UNBEFRISTET_TYPES.includes(f.type))
    .map((f) => FORMAT_PHRASE_DATIV[f.type]);
  const medium = formate.length === 1 ? `${p.IhremEurem} Medium` : `${p.IhrenEuren} Medien`;

  let suffix: string;
  if (befristet.length === 0) {
    suffix =
      "zur unbefristeten freien Nutzung auf Messen, der Website, Social Media oder Events – auch über den Vertragszeitraum hinaus.";
  } else if (unbefristet.length === 0) {
    suffix =
      "zur freien Nutzung auf Messen, der Website, Social Media oder Events – bis zum Ende der Vertragslaufzeit.";
  } else {
    suffix = `zur freien Nutzung auf Messen, der Website, Social Media oder Events. Bei ${joinNatural(unbefristet)} gelten die Rechte unbefristet, bei ${joinNatural(befristet)} bis zum Ende der Vertragslaufzeit.`;
  }

  const sieIhrCap = p.SieIhr.charAt(0).toUpperCase() + p.SieIhr.slice(1);
  return `Nutzungsrechte\n\n${sieIhrCap} ${p.erhaltenErhaltet} die Rechte an ${medium} ${suffix}`;
}

function buildPartnerschulenText(data: FormData, siezen: boolean, mehrzahl: boolean): string {
  if (data.partnerschulenModus === "regional") {
    const umkreis = data.partnerschulenUmkreis || "??";
    const ort = data.partnerschulenOrt || "??";
    const anzahl = data.partnerschulenAnzahl || "??";
    const standortGen = siezen ? "Ihres" : mehrzahl ? "eures" : "deines";
    return `Im ${umkreis} km Umkreis ${standortGen} Standorts in ${ort} sind das bereits über **${anzahl}** **Partnerschulen**.`;
  }
  if (data.partnerschulenModus === "bundesland") {
    const bl = data.partnerschulenBundesland || "??";
    const anzahl = data.partnerschulenBundeslandAnzahl || "??";
    return `In ${bl} arbeiten wir derzeit mit **${anzahl}** **Schulen** zusammen.`;
  }
  if (data.partnerschulenModus === "deutschlandweit") {
    return "In Deutschland arbeiten wir mit **8.800 Schulen** (von insgesamt **13.000 Oberschulen**) zusammen.";
  }
  return "";
}

function svPreisFuerFormat(type: FormatData["type"], svGebiet: SvGebiet): number {
  return type === "sprachnachricht"
    ? SV_PREISE_SPRACHNACHRICHT[svGebiet]
    : SV_PREISE_ANDERE[svGebiet];
}

function buildKostenSection(formate: FormatData[], svGebiet: SvGebiet): string {
  const showFormatName = formate.length > 1;
  const lines: string[] = [];
  lines.push("Kosten (netto)");
  lines.push("");

  formate.forEach((f, i) => {
    if (i > 0) lines.push("");
    if (showFormatName) lines.push(FORMAT_LABELS[f.type]);
    const prod = PRODUKTION_PREISE[f.type];
    lines.push(
      `Konzeption & Produktion: ${formatPreis(prod)} €${prod > 0 ? " einmalig" : ""}`
    );
    lines.push(`Schulvermarktung: ${formatPreis(svPreisFuerFormat(f.type, svGebiet))} € jährlich`);
  });

  lines.push("");
  lines.push("Die Laufzeit der Schulvermarktung beträgt 12 Monate.");
  return lines.join("\n");
}

export function generateEmail(data: FormData): { betreff: string; text: string } {
  const active = data.personen.filter((person) => person.vorname.trim() || person.nachname.trim());
  const mehrzahl = active.length > 1;
  const p = pron(data.anredeSiezen, mehrzahl);
  const anrede = buildAnrede(data.personen, data.anredeSiezen);
  const hasFormate = data.formate.length > 0;
  const lines: string[] = [];

  if (anrede) lines.push(anrede);
  lines.push("");
  lines.push(
    `vielen Dank für ${p.IhrEuer} Interesse an DEIN ERSTER TAG – dem größten Schulprogramm für Berufsorientierung in Deutschland.`
  );
  lines.push("");
  lines.push(
    `Ich freue mich sehr, ${p.IhnenDir} im Folgenden weitere Informationen zu unseren Angeboten zukommen zu lassen:`
  );

  if (hasFormate) {
    lines.push("");
    lines.push(buildBerufsmediumSection(data.formate, p));
  }

  const partnerschulenText = buildPartnerschulenText(data, data.anredeSiezen, mehrzahl);
  lines.push("");
  lines.push(buildSVSection(data.svGebiet, p, partnerschulenText));

  if (hasFormate) {
    lines.push("");
    lines.push(buildNutzungsrechteSection(data.formate, p));
    lines.push("");
    lines.push(buildKostenSection(data.formate, data.svGebiet));
  }

  if (data.formalAngebot) {
    lines.push("");
    lines.push(`Auf Wunsch erstelle ich ${p.IhnenDir} gerne auch ein formelles, unverbindliches Angebot.`);
  }

  if (data.anhang) {
    lines.push("");
    lines.push(`Anbei erhalten ${p.SieIhr} auch die formellen Angebote zu den o.g. Leistungen.`);
  }

  if (data.abschluss === "followup" && (data.followUpDatum || data.followUpUhrzeit)) {
    const termin = [
      data.followUpDatum,
      data.followUpUhrzeit ? `um ${data.followUpUhrzeit} Uhr` : "",
    ]
      .filter(Boolean)
      .join(" ");
    lines.push("");
    lines.push(`Ich freue mich auf unser Follow-up am ${termin}.`);
  } else if (data.abschluss === "nachhaken") {
    lines.push("");
    const zeitraum = data.nachhakenZeitraum || "demnächst";
    let nachhakenSatz: string;
    if (data.anredeSiezen) {
      nachhakenSatz = `Ich freue mich auf Ihr Feedback. Bitte wenden Sie sich bei Fragen gerne an mich. Ansonsten melde ich mich ${zeitraum} wieder bei Ihnen.`;
    } else if (mehrzahl) {
      nachhakenSatz = `Ich freue mich auf euer Feedback. Bitte wendet euch bei Fragen gerne an mich. Ansonsten melde ich mich ${zeitraum} wieder bei euch.`;
    } else {
      nachhakenSatz = `Ich freue mich auf dein Feedback. Bitte wende dich bei Fragen gerne an mich. Ansonsten melde ich mich ${zeitraum} wieder bei dir.`;
    }
    lines.push(nachhakenSatz);
  } else {
    lines.push("");
    const calendlyLink = CALENDLY_LINKS[data.unterschrift];
    let calendlySatz: string;
    if (data.anredeSiezen) {
      calendlySatz = `Gerne stehe ich Ihnen für ein Gespräch zur Verfügung. Buchen Sie sich dazu einfach einen Termin in meinem [KALENDER](${calendlyLink}).`;
    } else if (mehrzahl) {
      calendlySatz = `Gerne stehe ich euch für ein Gespräch zur Verfügung. Bucht euch dazu einfach einen Termin in meinem [KALENDER](${calendlyLink}).`;
    } else {
      calendlySatz = `Gerne stehe ich dir für ein Gespräch zur Verfügung. Buch dir dazu einfach einen Termin in meinem [KALENDER](${calendlyLink}).`;
    }
    lines.push(calendlySatz);
  }

  lines.push("");
  if (data.unterschrift === "Ann-Kathrin Fees") {
    if (data.anredeSiezen) {
      lines.push("Herzliche Grüße, Anna Fees");
    } else {
      lines.push("Herzliche Grüße, Anna");
    }
  } else {
    lines.push("Mit besten Grüßen");
    lines.push("");
    lines.push(data.anredeSiezen ? data.unterschrift : data.unterschrift.split(" ")[0]);
  }

  return {
    betreff: "Ihr Angebot von DEIN ERSTER TAG",
    text: lines.join("\n"),
  };
}
