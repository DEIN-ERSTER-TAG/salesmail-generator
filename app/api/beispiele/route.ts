import { NextResponse } from "next/server";
import { BeispielMedium } from "@/lib/types";

// Beispielmedien für #kurzerklärt / 360-Grad-Rundgang, live von deinerstertag.de.
// Gleiche Abfrage wie die Website-Suche "Erweiterte Suche → Umkreis überall → Nach Videoformaten".
// media_labels ist der hex-codierte Labeltext ("#kurzerklärt" bzw. "360° Film").
const API = "https://app.deinerstertag.de/api/v1/offers";
const MEDIA_LABELS: Record<string, string> = {
  kurzerklart: Buffer.from("#kurzerklärt", "utf8").toString("hex"),
  "360grad": Buffer.from("360° Film", "utf8").toString("hex"),
};

interface Offer {
  id: number;
  company?: { display_name?: string; name?: string };
  job?: { title?: string };
  location?: { city?: string };
}

export const revalidate = 3600; // Liste max. 1 Std. cachen

export async function GET(req: Request) {
  const format = new URL(req.url).searchParams.get("format") || "";
  const label = MEDIA_LABELS[format];
  if (!label) return NextResponse.json({ error: "Unbekanntes Format." }, { status: 400 });

  try {
    const offers: Offer[] = [];
    for (let page = 1; page <= 20; page++) {
      const url = `${API}?page=${page}&request_type=feed&lat=51.16&lng=10.45&dist=6000&sorting=relevance&media_labels=${label}`;
      const res = await fetch(url, { next: { revalidate } });
      if (!res.ok) throw new Error(`deinerstertag.de antwortet mit ${res.status}`);
      const json = await res.json();
      offers.push(...(json.data || []));
      if (!json.meta || page >= json.meta.last_page) break;
    }

    const items: BeispielMedium[] = offers
      .map((o) => ({
        id: String(o.id),
        beruf: (o.job?.title || "").trim(),
        unternehmen: (o.company?.display_name || o.company?.name || "").trim(),
        ort: (o.location?.city || "").trim(),
        url: `https://www.deinerstertag.de/ausschreibung/${o.id}/`,
      }))
      .filter((b) => b.beruf)
      .sort((a, b) => a.beruf.localeCompare(b.beruf, "de") || a.unternehmen.localeCompare(b.unternehmen, "de"));

    return NextResponse.json({ items });
  } catch (err) {
    console.error("Beispiele fetch error:", err);
    return NextResponse.json({ error: "Beispielmedien konnten nicht geladen werden." }, { status: 502 });
  }
}
