import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { Activity } from "@/models/Activity";
import { Company } from "@/models/Company";
import { Demo } from "@/models/Demo";
import { Invoice } from "@/models/Invoice";
import { Payment } from "@/models/Payment";
import { Project } from "@/models/Project";
import { Settings } from "@/models/Settings";
import { Task } from "@/models/Task";
import { Template } from "@/models/Template";

export const dynamic = "force-dynamic";

/** Full JSON backup of everything — download it from Settings. */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  await dbConnect();
  const [companies, activities, templates, demos, projects, payments, invoices, tasks, settings] = await Promise.all([
    Company.find().lean(),
    Activity.find().lean(),
    Template.find().lean(),
    Demo.find().lean(),
    Project.find().lean(),
    Payment.find().lean(),
    Invoice.find().lean(),
    Task.find().lean(),
    Settings.find().lean(),
  ]);
  const body = JSON.stringify(
    { exportedAt: new Date().toISOString(), companies, activities, templates, demos, projects, payments, invoices, tasks, settings },
    null,
    2,
  );
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="business-os-backup-${stamp}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
