import { describe, expect, it } from "vitest";

import { billablePeriods, computeProjectFinance, invoiceTotals } from "@/lib/finance";
import { autoMap, mapRow } from "@/lib/import-map";
import { statusAfterActivity, statusAfterResearch } from "@/lib/pipeline";
import { missingVars, renderTemplate } from "@/lib/templates";

const now = new Date(2026, 8, 25); // 25 Sep 2026

describe("project money", () => {
  it("one-time: pending is contract minus received", () => {
    expect(computeProjectFinance({ billing: "one_time", status: "in_progress", value: 6000 }, [{ amount: 3000 }], now)).toEqual({
      expected: 6000,
      received: 3000,
      pending: 3000,
      unpaidPeriods: [],
    });
    expect(computeProjectFinance({ billing: "one_time", status: "cancelled", value: 6000 }, [], now).pending).toBe(0);
  });

  it("monthly: bills each month from start, current month from its billing day", () => {
    const base = { billing: "monthly", status: "in_progress", startDate: new Date(2026, 5, 1) };
    expect(billablePeriods({ ...base, billingDay: 1 }, now)).toEqual(["2026-06", "2026-07", "2026-08", "2026-09"]);
    expect(billablePeriods({ ...base, billingDay: 28 }, now)).toEqual(["2026-06", "2026-07", "2026-08"]);
    expect(billablePeriods({ ...base, status: "completed", endDate: new Date(2026, 6, 15) }, now)).toEqual(["2026-06", "2026-07"]);
    expect(
      computeProjectFinance({ ...base, monthlyAmount: 250, billingDay: 1 }, [{ amount: 250, period: "2026-07" }], now),
    ).toEqual({ expected: 1000, received: 250, pending: 750, unpaidPeriods: ["2026-06", "2026-08", "2026-09"] });
  });

  it("invoice totals apply discount before tax", () => {
    expect(
      invoiceTotals({ items: [{ quantity: 1, unitPrice: 3000 }, { quantity: 2, unitPrice: 50 }], taxRate: 22, discount: 100 }),
    ).toEqual({ subtotal: 3100, discount: 100, tax: 660, total: 3660 });
  });
});

describe("pipeline automation", () => {
  it("moves companies forward only", () => {
    expect(statusAfterActivity("researching", "intro", "pending")).toBe("contacted");
    expect(statusAfterActivity("contacted", "reply", "replied")).toBe("replied");
    expect(statusAfterActivity("contacted", "follow_up", "interested")).toBe("interested");
    expect(statusAfterActivity("replied", "proposal", "pending")).toBe("proposal");
    expect(statusAfterActivity("proposal", "intro", "pending")).toBeNull();
  });

  it("never touches decisions you made", () => {
    expect(statusAfterActivity("won", "reply", "replied")).toBeNull();
    expect(statusAfterActivity("not_fit", "intro", "pending")).toBeNull();
    expect(statusAfterActivity("researching", "note", "")).toBeNull();
  });

  it("finished research means ready to contact", () => {
    expect(statusAfterResearch("researching", { a: true, b: true })).toBe("ready");
    expect(statusAfterResearch("researching", { a: true, b: false })).toBeNull();
  });
});

describe("templates", () => {
  it("fills variables and keeps missing ones visible", () => {
    const vars = { firstName: "Mattia", company: "SUN-AGE", myName: "" };
    expect(renderTemplate("Hi {{firstName}} at {{ company }} {{myName}}", vars)).toBe("Hi Mattia at SUN-AGE {{myName}}");
    expect(missingVars("{{firstName}} {{myName}}", vars)).toEqual(["myName"]);
  });
});

describe("Notion CSV import", () => {
  const headers = ["Company Name", "Website", "Country", "Company Type", "Priority", "Target Status", "Potential Software Opportunity", "Contacts", "Last Contacted"];
  const mapping = autoMap(headers);

  it("maps Notion column names", () => {
    expect(mapping).toMatchObject({
      name: "Company Name",
      website: "Website",
      status: "Target Status",
      opportunities: "Potential Software Opportunity",
      contactName: "Contacts",
    });
  });

  it("cleans a Notion row", () => {
    const row = mapRow(
      {
        "Company Name": "SUN-AGE",
        Website: "sun-age.it/",
        Country: "Italy, Colceresa, Vicenza",
        "Company Type": "Manufacturer",
        Priority: "A",
        "Target Status": "Engaged",
        "Potential Software Opportunity": "3D Configurator, 2D Configurator, AR viewer",
        Contacts: "Mattia Vanzo (https://www.notion.so/x), Luca (https://www.notion.so/y)",
        "Last Contacted": "August 25, 2026",
      },
      mapping,
    )!;
    expect(row).toMatchObject({ country: "IT", city: "Colceresa, Vicenza", type: "manufacturer", priority: "A", status: "replied" });
    expect(row.opportunities).toEqual(["3D Configurator", "2D Configurator"]);
    expect(row.tags).toEqual(["AR viewer"]);
    expect(row.contacts.map((c) => c.name)).toEqual(["Mattia Vanzo", "Luca"]);
    expect(row.lastContactedAt?.slice(0, 7)).toBe("2026-08");
  });
});
