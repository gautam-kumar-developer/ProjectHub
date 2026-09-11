import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getProject } from "@/lib/actions";
import { ProjectDetailClient } from "./project-detail-client";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const project = await getProject(id);
  if (!project) redirect("/projects");

  return (
    <ProjectDetailClient
      project={JSON.parse(JSON.stringify(project))}
      currentUserId={session.user.id}
    />
  );
}
