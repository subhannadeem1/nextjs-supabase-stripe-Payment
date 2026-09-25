/** ISO 3166-1 alpha-2 codes. Names come from Intl so they stay correct. */
const CODES =
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW".split(
    " ",
  );

let displayNames: Intl.DisplayNames | null = null;
function names() {
  if (!displayNames) displayNames = new Intl.DisplayNames(["en"], { type: "region" });
  return displayNames;
}

export function countryName(code?: string | null) {
  if (!code) return "";
  try {
    return names().of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

export function flagEmoji(code?: string | null) {
  if (!code || code.length !== 2) return "";
  const base = 0x1f1e6;
  const upper = code.toUpperCase();
  return String.fromCodePoint(base + upper.charCodeAt(0) - 65, base + upper.charCodeAt(1) - 65);
}

export type CountryOption = { code: string; name: string; flag: string };

let cached: CountryOption[] | null = null;
export function countryOptions(): CountryOption[] {
  if (!cached) {
    cached = CODES.map((code) => ({ code, name: countryName(code), flag: flagEmoji(code) })).sort(
      (a, b) => a.name.localeCompare(b.name),
    );
  }
  return cached;
}

/** Best-effort match of free text ("italy", "IT", "Italia") to a code — used by CSV import. */
export function guessCountryCode(text?: string | null): string {
  if (!text) return "";
  const raw = text.split(/[,/|]/)[0].trim();
  if (!raw) return "";
  const t = raw.toLowerCase();
  if (t.length === 2 && CODES.includes(t.toUpperCase())) return t.toUpperCase();
  const aliases: Record<string, string> = {
    uk: "GB",
    "united kingdom": "GB",
    england: "GB",
    usa: "US",
    "united states": "US",
    america: "US",
    uae: "AE",
    italia: "IT",
    deutschland: "DE",
    espana: "ES",
    españa: "ES",
    holland: "NL",
    "the netherlands": "NL",
    turkiye: "TR",
    türkiye: "TR",
    "czech republic": "CZ",
    schweiz: "CH",
    suisse: "CH",
    österreich: "AT",
    osterreich: "AT",
  };
  if (aliases[t]) return aliases[t];
  const hit = countryOptions().find((c) => c.name.toLowerCase() === t);
  return hit?.code ?? "";
}
