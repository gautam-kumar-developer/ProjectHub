import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DocumentsClient } from "./documents-client";

export default async function DocumentsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    include: { workspace: true },
  });

  if (!membership) redirect("/");

  // Build document query based on role
  let documentWhere: any = { project: { workspaceId: membership.workspaceId } };

  if (membership.role === "DEVELOPER") {
    const assignedProjects = await prisma.task.findMany({
      where: { assigneeId: session.user.id, project: { workspaceId: membership.workspaceId } },
      select: { projectId: true },
      distinct: ["projectId"],
    });
    const projectIds = assignedProjects.map((t) => t.projectId);
    documentWhere = { projectId: { in: projectIds } };
  } else if (membership.role === "QA") {
    const qaProjects = await prisma.project.findMany({
      where: { workspaceId: membership.workspaceId, tasks: { some: { status: { in: ["REVIEW", "DONE"] } } } },
      select: { id: true },
    });
    const projectIds = qaProjects.map((p) => p.id);
    documentWhere = { projectId: { in: projectIds } };
  }

  const [documents, projects] = await Promise.all([
    prisma.document.findMany({
      where: documentWhere,
      include: {
        uploadedBy: { select: { id: true, name: true, image: true } },
        project: { select: { id: true, name: true, color: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.project.findMany({
      where: { workspaceId: membership.workspaceId },
      select: { id: true, name: true, color: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <DocumentsClient
      documents={JSON.parse(JSON.stringify(documents))}
      projects={JSON.parse(JSON.stringify(projects))}
      currentUserRole={membership.role}
      currentUserId={session.user.id}
      workspaceId={membership.workspaceId}
    />
  );
}
