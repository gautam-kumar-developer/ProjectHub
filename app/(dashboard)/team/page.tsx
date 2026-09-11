import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TeamClient } from "./team-client";

export default async function TeamPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    include: { workspace: true },
  });

  if (!membership) redirect("/");

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: membership.workspaceId },
    include: {
      department: true,
      user: {
        include: {
          assignedTasks: {
            include: { project: true },
          },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  const departments = await prisma.department.findMany({
    where: { workspaceId: membership.workspaceId },
    orderBy: { name: "asc" },
  });

  return (
    <TeamClient
      members={JSON.parse(JSON.stringify(members))}
      departments={JSON.parse(JSON.stringify(departments))}
      workspaceId={membership.workspaceId}
      workspaceName={membership.workspace.name}
      currentUserRole={membership.role}
    />
  );
}
