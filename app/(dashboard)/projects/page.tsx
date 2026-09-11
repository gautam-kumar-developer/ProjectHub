import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getProjects } from "@/lib/actions";
import { ProjectsClient } from "./projects-client";

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    include: { workspace: true },
  });

  if (!membership) redirect("/");

  const projects = await getProjects(membership.workspaceId);

  return (
    <ProjectsClient
      projects={JSON.parse(JSON.stringify(projects))}
      workspaceId={membership.workspaceId}
    />
  );
}
