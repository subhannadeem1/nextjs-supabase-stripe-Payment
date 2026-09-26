import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { TasksView } from "@/components/tasks/tasks-view";
import { listTasks } from "@/data/tasks";

export const metadata: Metadata = { title: "Tasks" };

export default async function TasksPage() {
  const tasks = await listTasks();
  return (
    <>
      <PageHeader title="Tasks" description="Your to-do list — linked to companies and projects when it helps." />
      <TasksView tasks={tasks} />
    </>
  );
}
