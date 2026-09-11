import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TasksClient } from "./tasks-client";

export default async function TasksPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    include: { workspace: true },
  });

  if (!membership) redirect("/");

  const [tasks, projects, members] = await Promise.all([
    prisma.task.findMany({
      where: { project: { workspaceId: membership.workspaceId } },
      include: {
        assignee: true,
        subtasks: true,
        project: true,
        comments: { include: { author: true }, orderBy: { createdAt: "desc" } },
      },
      orderBy: { orderIndex: "asc" },
    }),
    prisma.project.findMany({
      where: { workspaceId: membership.workspaceId },
    }),
    prisma.workspaceMember.findMany({
      where: { workspaceId: membership.workspaceId },
      include: { user: true },
    }),
  ]);

  return (
    <TasksClient
      tasks={JSON.parse(JSON.stringify(tasks))}
      projects={JSON.parse(JSON.stringify(projects))}
      members={JSON.parse(JSON.stringify(members))}
    />
  );
}
