import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getDashboardStats } from "@/lib/actions";
import { AnalyticsClient } from "./analytics-client";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    include: { workspace: true },
  });

  if (!membership) redirect("/");

  const stats = await getDashboardStats(membership.workspaceId, session.user.id);

  // Get per-member workload data
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: membership.workspaceId },
    include: {
      user: {
        include: {
          assignedTasks: {
            where: { project: { workspaceId: membership.workspaceId } },
          },
        },
      },
    },
  });

  const memberWorkload = members.map((m) => ({
    name: m.user.name,
    tasks: m.user.assignedTasks.length,
    completed: m.user.assignedTasks.filter((t) => t.status === "DONE").length,
    inProgress: m.user.assignedTasks.filter((t) => t.status === "IN_PROGRESS").length,
  }));

  return (
    <AnalyticsClient
      stats={stats}
      memberWorkload={memberWorkload}
    />
  );
}
