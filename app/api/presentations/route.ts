import { NextResponse } from "next/server";
import { PraesentationEntry } from "@/lib/types";

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export async function GET() {
  if (!REDIS_URL || !REDIS_TOKEN) {
    return NextResponse.json({ error: "Redis nicht konfiguriert." }, { status: 503 });
  }

  try {
    const res = await fetch(REDIS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(["GET", "praesentationen"]),
      cache: "no-store",
    });
    const json = await res.json();
    const raw: PraesentationEntry[] = json.result ? JSON.parse(json.result) : [];
    // Ältere Log-Einträge ohne id: URL als eindeutige id verwenden
    const list = raw.filter((p) => p && p.url).map((p) => ({ ...p, id: p.id || p.url }));
    list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return NextResponse.json({ items: list });
  } catch (err) {
    console.error("Presentations fetch error:", err);
    return NextResponse.json({ error: "Präsentationen konnten nicht geladen werden." }, { status: 500 });
  }
}
