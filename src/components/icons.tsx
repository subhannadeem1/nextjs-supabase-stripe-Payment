import type { SVGProps } from "react";

import type { Channel } from "@/lib/constants";
import {
  CalendarDays,
  Globe,
  Mail,
  MessageCircle,
  NotebookPen,
  Phone,
  RefreshCw,
  Send,
} from "lucide-react";

/** Lucide dropped brand icons, so LinkedIn is drawn here. */
export function LinkedInIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}

export function ChannelIcon({ channel, className }: { channel: Channel | "" | "status" | "note"; className?: string }) {
  switch (channel) {
    case "linkedin_connect":
    case "linkedin_message":
      return <LinkedInIcon className={className} />;
    case "email":
      return <Mail className={className} />;
    case "whatsapp":
      return <MessageCircle className={className} />;
    case "call":
      return <Phone className={className} />;
    case "meeting":
      return <CalendarDays className={className} />;
    case "contact_form":
      return <Globe className={className} />;
    case "status":
      return <RefreshCw className={className} />;
    case "note":
      return <NotebookPen className={className} />;
    default:
      return <Send className={className} />;
  }
}

/** Brand-ish tint per channel for timeline dots. */
export const CHANNEL_TINT: Record<string, string> = {
  linkedin_connect: "bg-[#0a66c2]/12 text-[#0a66c2] dark:text-[#5aa9ff]",
  linkedin_message: "bg-[#0a66c2]/12 text-[#0a66c2] dark:text-[#5aa9ff]",
  email: "bg-rose-500/12 text-rose-600 dark:text-rose-300",
  whatsapp: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-300",
  call: "bg-amber-500/14 text-amber-600 dark:text-amber-300",
  meeting: "bg-violet-500/12 text-violet-600 dark:text-violet-300",
  contact_form: "bg-sky-500/12 text-sky-600 dark:text-sky-300",
  other: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
  status: "bg-accent text-accent-foreground",
  note: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
};
