"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

import { NAV, SETTINGS_ITEM, isActive, type NavItem } from "./nav";

export type NavCounts = { followUps: number; tasks: number };

function NavLink({
  item,
  counts,
  onNavigate,
}: {
  item: NavItem;
  counts: NavCounts;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = isActive(pathname, item);
  const count = item.badgeKey ? counts[item.badgeKey] : 0;
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group relative flex h-9 items-center gap-3 rounded-lg px-3 text-[13.5px] font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        active && "bg-sidebar-accent text-sidebar-accent-foreground",
      )}
    >
      {active ? (
        <span className="absolute top-1.5 bottom-1.5 left-0 w-[3px] rounded-full bg-brand" />
      ) : null}
      <Icon
        className={cn(
          "size-[18px] shrink-0 text-muted-foreground transition-colors group-hover:text-sidebar-accent-foreground",
          active && "text-primary",
        )}
      />
      <span className="truncate">{item.label}</span>
      {count > 0 ? (
        <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1.5 text-[11px] font-semibold text-white">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}

export function SidebarContent({
  businessName,
  counts,
  onNavigate,
}: {
  businessName: string;
  counts: NavCounts;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pt-5 pb-4">
        <Link href="/" onClick={onNavigate}>
          <Logo name={businessName || "Business OS"} subtitle="Business OS" />
        </Link>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4 scrollbar-thin">
        {NAV.map((group) => (
          <div key={group.title}>
            <div className="px-3 pb-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground/80 uppercase">
              {group.title}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink key={item.href} item={item} counts={counts} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <NavLink item={SETTINGS_ITEM} counts={counts} onNavigate={onNavigate} />
      </div>
    </div>
  );
}

export function Sidebar(props: { businessName: string; counts: NavCounts }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border bg-sidebar lg:block">
      <SidebarContent {...props} />
    </aside>
  );
}
