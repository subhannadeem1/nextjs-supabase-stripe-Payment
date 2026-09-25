/**
 * Normalisation helpers used for duplicate detection.
 * "https://www.Dome-Solar.com/en/" and "dome-solar.com" must be the same company.
 */

export function normalizeDomain(input?: string | null): string {
  if (!input) return "";
  let s = input.trim().toLowerCase();
  if (!s) return "";
  s = s.replace(/^[a-z]+:\/\//, ""); // protocol
  s = s.replace(/^www\d*\./, "");
  s = s.split(/[/?#]/)[0]; // path, query, hash
  s = s.split("@").pop() ?? s; // user@host
  s = s.replace(/:\d+$/, ""); // port
  s = s.replace(/\.+$/, "");
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(s)) return "";
  return s;
}

/** Turn whatever was typed into a clickable URL. */
export function toUrl(input?: string | null): string {
  if (!input) return "";
  const s = input.trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
}

const LEGAL_SUFFIXES = [
  "srl",
  "spa",
  "sas",
  "sarl",
  "sa",
  "gmbh",
  "ag",
  "kg",
  "ltd",
  "limited",
  "llc",
  "inc",
  "corp",
  "co",
  "bv",
  "nv",
  "sl",
  "slu",
  "oy",
  "ab",
  "as",
  "aps",
  "sp zoo",
  "spzoo",
  "doo",
  "pty",
  "plc",
];

/** "Sun-Age S.r.l." -> "sunage" */
export function nameKey(name?: string | null): string {
  if (!name) return "";
  let s = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\b([a-z])\.(?=[a-z]\.?)/g, "$1") // "s.r.l." -> "srl."
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  let changed = true;
  while (changed) {
    changed = false;
    for (const suffix of LEGAL_SUFFIXES) {
      if (s.endsWith(" " + suffix)) {
        s = s.slice(0, -suffix.length - 1).trim();
        changed = true;
      }
    }
  }
  return s.replace(/ /g, "");
}

/** First letter bucket for the A–Z index. */
export function letterOf(name?: string | null): string {
  const first = (name ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .charAt(0)
    .toUpperCase();
  return first >= "A" && first <= "Z" ? first : "#";
}

export function normalizeEmail(email?: string | null) {
  return (email ?? "").trim().toLowerCase();
}

/** linkedin.com/in/mattia-vanzo-123/?utm=... -> "in/mattia-vanzo-123" */
export function normalizeLinkedIn(url?: string | null) {
  if (!url) return "";
  const s = url.trim().toLowerCase().replace(/^[a-z]+:\/\//, "").replace(/^([a-z]{2,3}\.)?(www\.)?/, "");
  const m = s.match(/linkedin\.com\/(in|company|pub)\/([^/?#]+)/);
  return m ? `${m[1]}/${decodeURIComponent(m[2])}` : "";
}

export function escapeRegex(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
