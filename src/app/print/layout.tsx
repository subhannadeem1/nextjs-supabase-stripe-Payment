import { requirePageAuth } from "@/lib/auth";

export default async function PrintLayout({ children }: LayoutProps<"/print">) {
  await requirePageAuth();
  return children;
}
