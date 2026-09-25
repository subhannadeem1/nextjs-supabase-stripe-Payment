import { STATUS_RANK, type ActivityKind, type CompanyStatus, type Outcome } from "@/lib/constants";

const OUTBOUND: ActivityKind[] = ["intro", "proposal", "demo", "follow_up", "meeting"];

/**
 * Where should the company move after this activity? Only ever moves forward,
 * and never touches won / lost / not-a-fit — those are always your call.
 */
export function statusAfterActivity(
  current: CompanyStatus,
  kind: ActivityKind,
  outcome: Outcome | "" | null | undefined,
): CompanyStatus | null {
  if (current === "won" || current === "lost" || current === "not_fit") return null;
  if (kind === "note" || kind === "status") return null;

  let target: CompanyStatus | null = null;
  const bump = (s: CompanyStatus) => {
    if (!target || STATUS_RANK[s] > STATUS_RANK[target]) target = s;
  };

  if (OUTBOUND.includes(kind)) bump("contacted");
  if (kind === "reply" || outcome === "replied" || outcome === "not_interested") bump("replied");
  if (outcome === "interested" || outcome === "meeting" || kind === "meeting") bump("interested");
  if (kind === "proposal") bump("proposal");

  if (!target) return null;
  return STATUS_RANK[target] > STATUS_RANK[current] ? target : null;
}

export function directionOf(kind: ActivityKind): "out" | "in" | "none" {
  if (kind === "reply") return "in";
  if (kind === "note" || kind === "status") return "none";
  return "out";
}

/** Research checklist complete -> company is ready to contact. */
export function statusAfterResearch(
  current: CompanyStatus,
  research: Record<string, boolean>,
): CompanyStatus | null {
  if (current !== "researching") return null;
  const done = Object.values(research).every(Boolean);
  return done ? "ready" : null;
}
