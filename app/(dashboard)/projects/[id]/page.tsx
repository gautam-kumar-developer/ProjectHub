import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getProject } from "@/lib/actions";
import { ProjectDetailClient } from "./project-detail-client";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const project = await getProject(id);
  if (!project) redirect("/projects");

  const membership = await prisma.workspaceMember.findFirst({
    where: {
      userId: session.user.id,
      workspaceId: project.workspaceId,
    },
  });

  return (
    <ProjectDetailClient
      project={JSON.parse(JSON.stringify(project))}
      currentUserId={session.user.id}
      currentUserRole={membership?.role || "DEVELOPER"}
    />
  );
}
