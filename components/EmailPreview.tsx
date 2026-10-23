"use client";

import { useState } from "react";

interface Props {
  betreff: string;
  text: string;
  onAdjusted: (newText: string) => void;
}

// ── Formatting helpers ────────────────────────────────────────────────────────

const BOLD_HEADERS = new Set([
  "Ihr Berufsmedium",
  "Euer Berufsmedium",
  "Unsere Schulvermarktung",
  "Nutzungsrechte",
  "Kosten (netto)",
  "Ihre Präsentation",
  "Deine Präsentation",
  "Eure Präsentation",
]);

const BOLD_ITALIC_NAMES = new Set([
  "Sprachnachricht",
  "#kurzerklärt",
  "360-Grad-Rundgang",
  "Augmented Reality-Avatar",
]);

// Combined regex: [text](url) | word (url) | **bold**
const INLINE_REGEX =
  /\[([^\]]+)\]\((https?:\/\/[^)]+)\)|(\S+)\s*\((https?:\/\/[^)]+)\)|\*\*([^*]+)\*\*/g;

function parseInlineReact(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  const re = new RegExp(INLINE_REGEX.source, "g");
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      // [text](url)
      parts.push(
        <a key={m.index} href={m[2]} target="_blank" rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800">
          {m[1]}
        </a>
      );
    } else if (m[3] !== undefined) {
      // word (url)
      parts.push(
        <a key={m.index} href={m[4]} target="_blank" rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800">
          {m[3]}
        </a>
      );
    } else if (m[5] !== undefined) {
      // **bold**
      parts.push(<strong key={m.index}>{m[5]}</strong>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 0 ? text : <>{parts}</>;
}

function renderEmailLines(text: string): React.ReactNode[] {
  return text.split("\n").map((line, i) => {
    if (!line) return <div key={i} className="h-3" />;
    const trimmed = line.trim();
    if (BOLD_HEADERS.has(trimmed)) {
      return <div key={i} className="font-bold text-base">{line}</div>;
    }
    if (BOLD_ITALIC_NAMES.has(trimmed)) {
      return <div key={i}><strong><em>{line}</em></strong></div>;
    }
    return <div key={i}>{parseInlineReact(line)}</div>;
  });
}

// ── HTML generation for formatted copy (Outlook-compatible) ───────────────────

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inlineToHtml(line: string): string {
  let result = "";
  let last = 0;
  let m: RegExpExecArray | null;
  const re = new RegExp(INLINE_REGEX.source, "g");
  while ((m = re.exec(line)) !== null) {
    result += escHtml(line.slice(last, m.index));
    if (m[1] !== undefined) {
      result += `<a href="${m[2]}" style="color:#1d4ed8;text-decoration:underline">${escHtml(m[1])}</a>`;
    } else if (m[3] !== undefined) {
      result += `<a href="${m[4]}" style="color:#1d4ed8;text-decoration:underline">${escHtml(m[3])}</a>`;
    } else if (m[5] !== undefined) {
      result += `<strong>${escHtml(m[5])}</strong>`;
    }
    last = m.index + m[0].length;
  }
  result += escHtml(line.slice(last));
  return result;
}

function formatHtmlLine(line: string): string {
  const trimmed = line.trim();
  if (BOLD_HEADERS.has(trimmed)) return `<strong style="font-size:16px">${escHtml(line)}</strong>`;
  if (BOLD_ITALIC_NAMES.has(trimmed)) return `<strong><em>${escHtml(line)}</em></strong>`;
  return inlineToHtml(line);
}

// Each non-empty line gets a trailing <br>; empty lines become a lone <br>.
// Result: one blank line in source → exactly <br><br> in HTML → one paragraph
// break in Outlook (no double spacing, no missing spacing).
function generateHtml(text: string): string {
  const body = text
    .split("\n")
    .map((line) => (line ? formatHtmlLine(line) + "<br>" : "<br>"))
    .join("");
  return `<div style="font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.5; color: #000000;">${body}</div>`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function EmailPreview({ betreff, text, onAdjusted }: Props) {
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedBetreff, setCopiedBetreff] = useState(false);

  const isEmpty = !text.trim();

  async function handleAdjust() {
    if (!instruction.trim() || !text) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailText: text, instruction }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fehler");
      onAdjusted(data.text);
      setInstruction("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }

  async function copyEmail() {
    try {
      const html = generateHtml(text);
      if (typeof ClipboardItem !== "undefined") {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([text], { type: "text/plain" }),
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(text);
      }
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } catch {
      await navigator.clipboard.writeText(text);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  }

  function copyBetreff() {
    navigator.clipboard.writeText(betreff).then(() => {
      setCopiedBetreff(true);
      setTimeout(() => setCopiedBetreff(false), 2000);
    });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-300 bg-gray-50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
          <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" />
          <span className="w-3 h-3 rounded-full bg-green-400 inline-block" />
          <span className="text-xs font-bold tracking-widest text-gray-500 ml-2">VORSCHAU</span>
        </div>
        {!isEmpty && (
          <button
            onClick={copyEmail}
            className="text-xs px-3 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
          >
            {copiedEmail ? "✓ Kopiert!" : "E-Mail kopieren"}
          </button>
        )}
      </div>

      {/* Email content */}
      <div className="flex-1 overflow-y-auto p-5 bg-gray-100">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-40">
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">Hier erscheint deine E-Mail</p>
            <p className="text-xs mt-1 opacity-70">Formular ausfüllen und E-Mail wird live generiert</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm max-w-2xl mx-auto overflow-hidden">
            {/* Betreff */}
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <span className="text-xs text-gray-400 uppercase tracking-wide font-medium block mb-0.5">Betreff</span>
                <span className="text-sm text-gray-800 font-medium">{betreff}</span>
              </div>
              <button
                onClick={copyBetreff}
                className="text-xs px-2 py-1 rounded border border-gray-200 bg-white hover:bg-gray-50 transition-colors whitespace-nowrap flex-shrink-0"
              >
                {copiedBetreff ? "✓" : "Betreff kopieren"}
              </button>
            </div>

            {/* Body header with E-Mail kopieren */}
            <div className="px-5 pt-3 pb-1 border-b border-gray-100 flex items-center justify-end">
              <button
                onClick={copyEmail}
                className="text-xs px-2 py-1 rounded border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
              >
                {copiedEmail ? "✓ Kopiert!" : "E-Mail kopieren"}
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 text-sm text-gray-800 leading-relaxed">
              {renderEmailLines(text)}
            </div>
          </div>
        )}
      </div>

      {/* KI-Korrektur */}
      <div className="border-t border-gray-300 bg-white p-3 flex-shrink-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-bold uppercase tracking-wide text-gray-500">KI-Anpassung</span>
        </div>
        <div className="flex gap-2">
          <textarea
            rows={2}
            className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 resize-none outline-none focus:border-gray-500"
            placeholder='z.B. "Ändere den Ton zu informeller" oder "Füge einen Satz über unser Jubiläum hinzu"'
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAdjust();
            }}
            disabled={isEmpty || loading}
          />
          <button
            onClick={handleAdjust}
            disabled={!instruction.trim() || isEmpty || loading}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "#00afd6", color: "#fff" }}
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Lädt…
              </span>
            ) : (
              "Anpassen"
            )}
          </button>
        </div>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        {!isEmpty && (
          <p className="text-xs text-gray-400 mt-1">Tipp: Strg+Enter zum Absenden</p>
        )}
      </div>
    </div>
  );
}
