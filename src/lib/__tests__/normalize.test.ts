import { describe, expect, it } from "vitest";

import { letterOf, nameKey, normalizeDomain, normalizeLinkedIn } from "@/lib/normalize";

describe("duplicate detection", () => {
  it("treats legal suffixes and punctuation as the same company", () => {
    expect(nameKey("SUN-AGE")).toBe("sunage");
    expect(nameKey("Sun Age S.r.l.")).toBe("sunage");
    expect(nameKey("Sun-Age SRL")).toBe("sunage");
    expect(nameKey("Mounting Systems S.p.A.")).toBe("mountingsystems");
    expect(nameKey("K2 Systems GmbH")).toBe("k2systems");
    expect(nameKey("Évolution Énergie")).toBe("evolutionenergie");
  });

  it("reduces any website form to the bare domain", () => {
    expect(normalizeDomain("https://www.sun-age.it/it/home")).toBe("sun-age.it");
    expect(normalizeDomain("dome-solar.com/en/")).toBe("dome-solar.com");
    expect(normalizeDomain("WWW.Grace-Solar.IT:8080?x=1")).toBe("grace-solar.it");
    expect(normalizeDomain("not a url")).toBe("");
  });

  it("buckets names for the A–Z index", () => {
    expect(letterOf("émerald")).toBe("E");
    expect(letterOf("3D Solar")).toBe("#");
  });

  it("normalises LinkedIn profile URLs", () => {
    expect(normalizeLinkedIn("https://it.linkedin.com/in/mattia-vanzo-123/?trk=x")).toBe("in/mattia-vanzo-123");
  });
});
