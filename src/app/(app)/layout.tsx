import { QuickActionsProvider } from "@/components/shell/quick-actions";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { getNavCounts } from "@/data/dashboard";
import { getSettings } from "@/data/settings";
import { requirePageAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const session = await requirePageAuth();
  const [settings, counts] = await Promise.all([getSettings(), getNavCounts()]);

  return (
    <QuickActionsProvider defaultCurrency={settings.defaultCurrency}>
      <Sidebar businessName={settings.businessName} counts={counts} />
      <div className="flex min-h-dvh flex-col lg:pl-64">
        <Topbar
          businessName={settings.businessName}
          ownerName={settings.ownerName}
          email={session.email}
          counts={counts}
        />
        <main className="mx-auto w-full max-w-[1400px] min-w-0 flex-1 px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </QuickActionsProvider>
  );
}
