import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProjectDetail } from "@/components/projects/project-detail";
import { getProjectDetail } from "@/data/projects";
import { getSettings } from "@/data/settings";

export async function generateMetadata({ params }: PageProps<"/projects/[id]">): Promise<Metadata> {
  const { id } = await params;
  const data = await getProjectDetail(id);
  return { title: data?.project.title ?? "Project" };
}

export default async function ProjectPage({ params }: PageProps<"/projects/[id]">) {
  const { id } = await params;
  const [data, settings] = await Promise.all([getProjectDetail(id), getSettings()]);
  if (!data) notFound();
  return <ProjectDetail data={data} settings={settings} />;
}
