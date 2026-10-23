"use client";

import { useEffect, useState } from "react";
import {
  FormData,
  FormatData,
  FormatType,
  FORMAT_LABELS,
  Person,
  SV_GEBIET_LABELS,
  SvGebiet,
  PartnerschulenModus,
  PARTNERSCHULEN_MODUS_LABELS,
  BUNDESLAENDER,
  Bundesland,
  PraesentationEntry,
  BeispielMedium,
} from "@/lib/types";
import SearchCombo, { ComboOption } from "@/components/SearchCombo";


const FORMAT_OPTIONS: FormatType[] = ["sprachnachricht", "ar-avatar", "kurzerklart", "360grad"];

interface Props {
  data: FormData;
  onChange: (data: FormData) => void;
}

function SectionHeader({ num, label }: { num: number; label: string }) {
  return (
    <div className="flex items-center mb-3">
      <span className="section-number">{num}</span>
      <span className="text-xs font-bold uppercase tracking-wider text-gray-600">{label}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label>{label}</label>
      {children}
    </div>
  );
}

export default function EmailForm({ data, onChange }: Props) {
  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    onChange({ ...data, [key]: value });
  }

  // Präsentationen (aus dem Präsentations-Generator, gemeinsamer Redis-Store)
  const [praesentationen, setPraesentationen] = useState<PraesentationEntry[]>([]);
  const [praesentationenLoading, setPraesentationenLoading] = useState(true);
  const [praesentationenError, setPraesentationenError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/presentations")
      .then((res) => res.json())
      .then((json) => {
        if (json.error) setPraesentationenError(json.error);
        else setPraesentationen(json.items || []);
      })
      .catch(() => setPraesentationenError("Präsentationen konnten nicht geladen werden."))
      .finally(() => setPraesentationenLoading(false));
  }, []);

  // Pro Firma sortiert, bei gleicher Firma neueste zuerst
  const praesentationOptions: ComboOption[] = [...praesentationen]
    .sort(
      (x, y) =>
        (x.companyName || "").localeCompare(y.companyName || "", "de") ||
        new Date(y.createdAt || 0).getTime() - new Date(x.createdAt || 0).getTime()
    )
    .map((p) => ({
      id: p.id,
      label: `${p.companyName || "–"} (${formatDate(p.createdAt)})`,
      search: (p.companyName || "").toLowerCase(),
    }));

  function selectPraesentation(id: string | null) {
    set("praesentation", praesentationen.find((p) => p.id === id) || null);
  }

  // Beispielmedien #kurzerklärt / 360-Grad (live von deinerstertag.de, je Format einmal geladen)
  const [beispiele, setBeispiele] = useState<Partial<Record<FormatType, BeispielMedium[]>>>({});
  const [beispieleError, setBeispieleError] = useState<Partial<Record<FormatType, string>>>({});
  const beispielFormate = data.formate.map((f) => f.type).filter((t) => t === "kurzerklart" || t === "360grad");

  useEffect(() => {
    beispielFormate.forEach((type) => {
      if (beispiele[type] || beispieleError[type]) return;
      fetch(`/api/beispiele?format=${type}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.error) setBeispieleError((prev) => ({ ...prev, [type]: json.error }));
          else setBeispiele((prev) => ({ ...prev, [type]: json.items || [] }));
        })
        .catch(() =>
          setBeispieleError((prev) => ({ ...prev, [type]: "Beispielmedien konnten nicht geladen werden." }))
        );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beispielFormate.join(",")]);

  function beispielOptions(type: FormatType): ComboOption[] {
    return (beispiele[type] || []).map((b) => ({
      id: b.id,
      label: `${b.beruf} (${b.unternehmen}${b.ort ? ", " + b.ort : ""})`,
      search: `${b.beruf} ${b.unternehmen} ${b.ort}`.toLowerCase(),
    }));
  }

  function selectBeispiel(type: FormatType, id: string | null) {
    const b = (beispiele[type] || []).find((x) => x.id === id) || null;
    set(
      "formate",
      data.formate.map((f) =>
        f.type === type
          ? {
              ...f,
              beispielId: b ? b.id : "",
              beispielTitel: b ? `${b.beruf} (${b.unternehmen})` : "",
              beispielLink: b ? b.url : "",
            }
          : f
      )
    );
  }

  // Personen
  function addPerson() {
    if (data.personen.length >= 5) return;
    set("personen", [
      ...data.personen,
      { vorname: "", nachname: "", geschlecht: "weiblich" },
    ]);
  }

  function removePerson(idx: number) {
    set("personen", data.personen.filter((_, i) => i !== idx));
  }

  function updatePerson(idx: number, key: keyof Person, value: string) {
    set(
      "personen",
      data.personen.map((p, i) => (i === idx ? { ...p, [key]: value } : p))
    );
  }

  // Formate
  function toggleFormat(type: FormatType) {
    const exists = data.formate.find((f) => f.type === type);
    if (exists) {
      set("formate", data.formate.filter((f) => f.type !== type));
    } else {
      const newFormat: FormatData = { type, beispielTitel: "", beispielLink: "", beispielId: "" };
      const ordered = FORMAT_OPTIONS.map(
        (t) => data.formate.find((f) => f.type === t) || (t === type ? newFormat : null)
      ).filter(Boolean) as FormatData[];
      set("formate", ordered);
    }
  }

  function updateFormat(type: FormatType, key: keyof FormatData, value: string) {
    set(
      "formate",
      data.formate.map((f) => (f.type === type ? { ...f, [key]: value } : f))
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4">

      {/* Sektion 1: Präsentation */}
      <div className="bg-white rounded-lg p-4 mb-3 shadow-sm">
        <SectionHeader num={1} label="Präsentation" />
        <Field label="Präsentation zum Termin (Unternehmen suchen)">
          <SearchCombo
            options={praesentationOptions}
            value={data.praesentation?.id ?? null}
            onSelect={selectPraesentation}
            placeholder="Unternehmen suchen…"
            loading={praesentationenLoading}
            error={praesentationenError}
          />
        </Field>
        {data.praesentation ? (
          <p className="text-xs text-gray-500">
            Link + Passwort werden unter „Ihre Präsentation“ in die Mail eingefügt.
          </p>
        ) : (
          <p className="text-xs text-gray-400 italic">Ohne Auswahl enthält die Mail keinen Präsentations-Block.</p>
        )}
      </div>

      {/* Sektion 2: Ansprache */}
      <div className="bg-white rounded-lg p-4 mb-3 shadow-sm">
        <SectionHeader num={2} label="Ansprache" />

        <Field label="Anrede">
          <div className="flex gap-2">
            {(["Siezen", "Duzen"] as const).map((opt) => (
              <label key={opt} className="flex items-center gap-1.5 cursor-pointer" style={{ marginBottom: 0 }}>
                <input
                  type="radio"
                  name="anrede"
                  checked={opt === "Siezen" ? data.anredeSiezen : !data.anredeSiezen}
                  onChange={() => set("anredeSiezen", opt === "Siezen")}
                />
                <span className="text-sm">{opt}</span>
              </label>
            ))}
          </div>
        </Field>

        <div className="space-y-3">
          {data.personen.map((person, idx) => (
            <div key={idx} className="border border-gray-200 rounded-md p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Person {idx + 1}
                </span>
                {data.personen.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePerson(idx)}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                  >
                    Entfernen
                  </button>
                )}
              </div>

              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Vorname"
                  value={person.vorname}
                  onChange={(e) => updatePerson(idx, "vorname", e.target.value)}
                  style={{ width: "50%" }}
                />
                <input
                  type="text"
                  placeholder="Nachname"
                  value={person.nachname}
                  onChange={(e) => updatePerson(idx, "nachname", e.target.value)}
                  style={{ width: "50%" }}
                />
              </div>

              <div className="flex gap-3">
                {(["weiblich", "maennlich"] as const).map((g) => (
                  <label key={g} className="flex items-center gap-1.5 cursor-pointer" style={{ marginBottom: 0 }}>
                    <input
                      type="radio"
                      name={`geschlecht-${idx}`}
                      checked={person.geschlecht === g}
                      onChange={() => updatePerson(idx, "geschlecht", g)}
                    />
                    <span className="text-sm">{g === "weiblich" ? "Weiblich" : "Männlich"}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {data.personen.length < 5 && (
          <button
            type="button"
            onClick={addPerson}
            className="mt-2 text-xs px-3 py-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-600 transition-colors"
          >
            + Person hinzufügen
          </button>
        )}
      </div>

      {/* Sektion 3: Formate */}
      <div className="bg-white rounded-lg p-4 mb-3 shadow-sm">
        <SectionHeader num={3} label="Formate" />

        <div className="flex flex-wrap gap-2 mb-3">
          {FORMAT_OPTIONS.map((type) => {
            const active = data.formate.some((f) => f.type === type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleFormat(type)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  active
                    ? "bg-[#00afd6] text-white border-[#00afd6]"
                    : "bg-white text-gray-600 border-gray-300 hover:border-gray-500"
                }`}
              >
                {FORMAT_LABELS[type]}
              </button>
            );
          })}
        </div>

        {data.formate.map((format) => (
          <div key={format.type} className="border border-gray-200 rounded-md p-3 mb-2">
            <div className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">
              {FORMAT_LABELS[format.type]}
            </div>

            {format.type !== "sprachnachricht" && format.type !== "ar-avatar" && (
              <>
                <Field label="Beispielmedium von deinerstertag.de auswählen">
                  <SearchCombo
                    options={beispielOptions(format.type)}
                    value={format.beispielId || null}
                    onSelect={(id) => selectBeispiel(format.type, id)}
                    placeholder="Berufsbezeichnung suchen…"
                    loading={!beispiele[format.type] && !beispieleError[format.type]}
                    error={beispieleError[format.type] || null}
                  />
                  <p className="mt-2 text-xs rounded px-2 py-1.5 bg-[#fff8c2] text-[#6b5a00]">
                    Bitte Link auf Aktualität prüfen
                  </p>
                </Field>
                <Field label="Beispielmedium – Berufsbezeichnung / Titel">
                  <input
                    type="text"
                    placeholder="z.B. Fachkraft für Lagerlogistik (DSV)"
                    value={format.beispielTitel}
                    onChange={(e) => updateFormat(format.type, "beispielTitel", e.target.value)}
                  />
                </Field>
                <Field label="Link (URL) von DET einfügen">
                  <input
                    type="url"
                    placeholder="https://..."
                    value={format.beispielLink}
                    onChange={(e) => updateFormat(format.type, "beispielLink", e.target.value)}
                  />
                </Field>
              </>
            )}
          </div>
        ))}

        {data.formate.length === 0 && (
          <p className="text-xs text-gray-400 italic">Bitte mindestens ein Format auswählen.</p>
        )}
      </div>

      {/* Sektion 4: Schulvermarktung */}
      <div className="bg-white rounded-lg p-4 mb-3 shadow-sm">
        <SectionHeader num={4} label="Schulvermarktung" />

        <Field label="Gebiet">
          <div className="space-y-1.5 mt-1">
            {(Object.keys(SV_GEBIET_LABELS) as SvGebiet[]).map((gebiet) => (
              <label key={gebiet} className="flex items-center gap-2 cursor-pointer" style={{ marginBottom: 0 }}>
                <input
                  type="radio"
                  name="svGebiet"
                  checked={data.svGebiet === gebiet}
                  onChange={() => set("svGebiet", gebiet)}
                />
                <span className="text-sm">{SV_GEBIET_LABELS[gebiet]}</span>
              </label>
            ))}
          </div>
        </Field>
      </div>

      {/* Sektion 5: Partnerschulen */}
      <div className="bg-white rounded-lg p-4 mb-3 shadow-sm">
        <SectionHeader num={5} label="Partnerschulen" />

        <div className="space-y-1.5 mb-3">
          {(Object.keys(PARTNERSCHULEN_MODUS_LABELS) as PartnerschulenModus[]).map((modus) => (
            <label key={modus} className="flex items-center gap-2 cursor-pointer" style={{ marginBottom: 0 }}>
              <input
                type="radio"
                name="partnerschulenModus"
                checked={data.partnerschulenModus === modus}
                onChange={() => set("partnerschulenModus", modus)}
              />
              <span className="text-sm">{PARTNERSCHULEN_MODUS_LABELS[modus]}</span>
            </label>
          ))}
        </div>

        {data.partnerschulenModus === "regional" && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Umkreis in km (z.B. 50)"
                value={data.partnerschulenUmkreis}
                onChange={(e) => set("partnerschulenUmkreis", e.target.value)}
                style={{ width: "50%" }}
              />
              <input
                type="text"
                placeholder="Ort (z.B. Dresden)"
                value={data.partnerschulenOrt}
                onChange={(e) => set("partnerschulenOrt", e.target.value)}
                style={{ width: "50%" }}
              />
            </div>
            <input
              type="text"
              placeholder="Anzahl der Schulen (z.B. 245)"
              value={data.partnerschulenAnzahl}
              onChange={(e) => set("partnerschulenAnzahl", e.target.value)}
            />
          </div>
        )}

        {data.partnerschulenModus === "bundesland" && (
          <div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-3">
              {BUNDESLAENDER.map((bl) => (
                <label key={bl} className="flex items-center gap-1.5 cursor-pointer" style={{ marginBottom: 0 }}>
                  <input
                    type="radio"
                    name="partnerschulenBundesland"
                    checked={data.partnerschulenBundesland === bl}
                    onChange={() => set("partnerschulenBundesland", bl as Bundesland)}
                  />
                  <span className="text-xs">{bl}</span>
                </label>
              ))}
            </div>
            <input
              type="text"
              placeholder="Anzahl Partnerschulen (z.B. 320)"
              value={data.partnerschulenBundeslandAnzahl}
              onChange={(e) => set("partnerschulenBundeslandAnzahl", e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Sektion 6: Zusätze */}
      <div className="bg-white rounded-lg p-4 mb-3 shadow-sm">
        <SectionHeader num={6} label="Zusätze" />

        <div className="mb-3">
          <label className="flex items-center gap-2 cursor-pointer" style={{ marginBottom: 0 }}>
            <input
              type="checkbox"
              checked={data.anhang}
              onChange={(e) =>
                onChange({ ...data, anhang: e.target.checked, formalAngebot: e.target.checked ? false : data.formalAngebot })
              }
            />
            <span className="text-sm font-medium">Angebot im Anhang</span>
          </label>
        </div>

        <div className="mb-3">
          <label className="flex items-center gap-2 cursor-pointer" style={{ marginBottom: 0 }}>
            <input
              type="checkbox"
              checked={data.formalAngebot}
              onChange={(e) =>
                onChange({ ...data, formalAngebot: e.target.checked, anhang: e.target.checked ? false : data.anhang })
              }
            />
            <span className="text-sm font-medium">Kein Angebot im Anhang. Anbieten.</span>
          </label>
        </div>

        <div>
          <div className="flex gap-4 mb-2">
            {(["nachhaken", "followup"] as const).map((opt) => (
              <label key={opt} className="flex items-center gap-1.5 cursor-pointer" style={{ marginBottom: 0 }}>
                <input
                  type="radio"
                  name="abschluss"
                  checked={data.abschluss === opt}
                  onChange={() => set("abschluss", opt)}
                />
                <span className="text-sm font-medium">{opt === "nachhaken" ? "Nachhaken" : "Follow-up Termin"}</span>
              </label>
            ))}
          </div>
          {data.abschluss === "nachhaken" && (
            <input
              type="text"
              placeholder="Zeitraum (z.B. Ende Juli)"
              value={data.nachhakenZeitraum}
              onChange={(e) => set("nachhakenZeitraum", e.target.value)}
            />
          )}
          {data.abschluss === "followup" && (
            <div className="flex gap-2 mt-1.5">
              <input
                type="text"
                placeholder="Datum (z.B. 6.7.)"
                value={data.followUpDatum}
                onChange={(e) => set("followUpDatum", e.target.value)}
                style={{ width: "50%" }}
              />
              <input
                type="text"
                placeholder="Uhrzeit (z.B. 10:00)"
                value={data.followUpUhrzeit}
                onChange={(e) => set("followUpUhrzeit", e.target.value)}
                style={{ width: "50%" }}
              />
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}
