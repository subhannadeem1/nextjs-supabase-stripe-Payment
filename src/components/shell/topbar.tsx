"use client";

import { useState } from "react";
import {
  Briefcase,
  Building2,
  CheckSquare,
  FileText,
  LogOut,
  Menu,
  Plus,
  Receipt,
  Search,
  Settings,
} from "lucide-react";
import Link from "next/link";

import { logout } from "@/actions/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { initials } from "@/lib/utils";

import { CommandMenu } from "./command-menu";
import { useQuickActions } from "./quick-actions";
import { SidebarContent, type NavCounts } from "./sidebar";

export function Topbar({
  businessName,
  ownerName,
  email,
  counts,
}: {
  businessName: string;
  ownerName: string;
  email: string;
  counts: NavCounts;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const quick = useQuickActions();

  return (
    <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur-md">
      <div className="flex h-14 items-center gap-2 px-4 sm:px-6">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <Menu />
        </Button>
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <SidebarContent businessName={businessName} counts={counts} onNavigate={() => setMenuOpen(false)} />
          </SheetContent>
        </Sheet>

        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex h-9 w-full max-w-md items-center gap-2 rounded-lg border bg-card px-3 text-sm text-muted-foreground shadow-xs transition-colors hover:bg-accent/60"
        >
          <Search className="size-4" />
          <span className="truncate">Search companies, people, projects…</span>
          <kbd className="ml-auto hidden rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] sm:inline">
            Ctrl K
          </kbd>
        </button>
        <CommandMenu open={searchOpen} onOpenChange={setSearchOpen} />

        <div className="ml-auto flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="size-4" />
                <span className="hidden sm:inline">New</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => quick.open("company")}>
                <Building2 /> Company
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => quick.open("project")}>
                <Briefcase /> Project
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => quick.open("task")}>
                <CheckSquare /> Task
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => quick.open("payment")}>
                <Receipt /> Payment received
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => quick.open("invoice")}>
                <FileText /> Invoice
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="ml-1 grid size-8 place-items-center rounded-full bg-brand text-xs font-semibold text-white shadow-brand"
                aria-label="Account"
              >
                {initials(ownerName || email || "Me")}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="truncate text-sm font-medium text-foreground">{ownerName || "Signed in"}</div>
                <div className="truncate text-xs">{email}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings /> Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => logout()}>
                <LogOut /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
