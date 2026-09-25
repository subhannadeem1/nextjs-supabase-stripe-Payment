import {
  BarChart3,
  BellRing,
  Briefcase,
  Building2,
  CheckSquare,
  FileText,
  Handshake,
  LayoutDashboard,
  MessageSquareText,
  PlayCircle,
  Receipt,
  Repeat,
  Settings,
  Upload,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badgeKey?: "followUps" | "tasks";
  exact?: boolean;
};

export const NAV: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [{ href: "/", label: "Today", icon: LayoutDashboard, exact: true }],
  },
  {
    title: "Marketing",
    items: [
      { href: "/marketing/companies", label: "Client hunting", icon: Building2 },
      { href: "/marketing/follow-ups", label: "Follow-ups", icon: BellRing, badgeKey: "followUps" },
      { href: "/marketing/templates", label: "Message templates", icon: MessageSquareText },
      { href: "/marketing/demos", label: "Demo library", icon: PlayCircle },
      { href: "/marketing/stats", label: "Insights", icon: BarChart3 },
      { href: "/marketing/import", label: "Import CSV", icon: Upload },
    ],
  },
  {
    title: "Clients & projects",
    items: [
      { href: "/clients", label: "Clients", icon: Handshake },
      { href: "/projects", label: "Projects", icon: Briefcase },
      { href: "/services", label: "Monthly services", icon: Repeat },
    ],
  },
  {
    title: "Finance",
    items: [
      { href: "/finance", label: "Overview", icon: Wallet, exact: true },
      { href: "/finance/payments", label: "Payments", icon: Receipt },
      { href: "/finance/invoices", label: "Invoices", icon: FileText },
    ],
  },
  {
    title: "Work",
    items: [{ href: "/tasks", label: "Tasks", icon: CheckSquare, badgeKey: "tasks" }],
  },
];

export const SETTINGS_ITEM: NavItem = { href: "/settings", label: "Settings", icon: Settings };

export function isActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(item.href + "/");
}
