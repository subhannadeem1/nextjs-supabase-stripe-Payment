/** Saved views for the companies list (shared by server + client). */
export const VIEWS = [
  { key: "all", label: "All" },
  { key: "priority", label: "Priority A" },
  { key: "ready", label: "Ready to contact" },
  { key: "contacted", label: "Contacted" },
  { key: "talks", label: "In talks" },
  { key: "followups", label: "Follow-up due" },
  { key: "clients", label: "Clients" },
  { key: "closed", label: "Lost / not a fit" },
] as const;
export type ViewKey = (typeof VIEWS)[number]["key"];
