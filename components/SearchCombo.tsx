"use client";

import { useEffect, useRef, useState } from "react";

// Suchfeld mit Live-Filter und nach Anfangsbuchstabe gruppierter Trefferliste –
// gleiches Verhalten wie die #kurzerklärt-/360°-Auswahl im Präsentations-Generator.
export interface ComboOption {
  id: string;
  label: string; // angezeigter Text, bestimmt auch Sortierung + Buchstabengruppe
  search: string; // Text, in dem gesucht wird (kleingeschrieben)
}

interface Props {
  options: ComboOption[];
  value: string | null; // id der gewählten Option
  onSelect: (id: string | null) => void;
  placeholder: string;
  loading?: boolean;
  error?: string | null;
}

export default function SearchCombo({ options, value, onSelect, placeholder, loading, error }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.id === value) || null;

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = q ? options.filter((o) => o.search.includes(q)) : options;

  const groups: { letter: string; items: ComboOption[] }[] = [];
  filtered.forEach((o) => {
    const letter = o.label.charAt(0).toUpperCase();
    const last = groups[groups.length - 1];
    if (last && last.letter === letter) last.items.push(o);
    else groups.push({ letter, items: [o] });
  });

  return (
    <div ref={ref} className="relative">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder={loading ? "Wird geladen…" : placeholder}
          autoComplete="off"
          disabled={loading}
          value={open ? query : selected?.label ?? ""}
          onFocus={() => {
            setQuery("");
            setOpen(true);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
        />
        {selected && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="text-xs px-2 rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-500 shrink-0"
            title="Auswahl entfernen"
          >
            ✕
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-500 italic mt-1">{error}</p>}

      {open && !loading && (
        <div className="absolute left-0 right-0 top-full mt-1 max-h-80 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg z-50">
          {groups.length === 0 ? (
            <div className="px-3 py-3 text-xs text-gray-400 text-center">Keine Treffer</div>
          ) : (
            groups.map((g) => (
              <div key={g.letter}>
                <div className="sticky top-0 bg-gray-50 px-3 py-1 text-[10px] font-bold tracking-wide text-gray-400 uppercase">
                  {g.letter}
                </div>
                {g.items.map((o) => (
                  <div
                    key={o.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onSelect(o.id);
                      setOpen(false);
                    }}
                    className="px-3 py-2 text-[13px] text-gray-700 cursor-pointer hover:bg-[#f0fbfd] hover:text-[#00afd6]"
                  >
                    {o.label}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
