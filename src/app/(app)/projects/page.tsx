import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { NewProjectButton } from "@/components/projects/new-project-button";
import { ProjectsView } from "@/components/projects/projects-view";
import { listProjects } from "@/data/projects";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const projects = await listProjects();
  return (
    <>
      <PageHeader
        title="Projects"
        description="Everything you’re building — scope, deadline and money in one glance."
        actions={<NewProjectButton />}
      />
      <ProjectsView projects={projects} />
    </>
  );
}
