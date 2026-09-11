import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getDashboardStats, getActivities } from "@/lib/actions";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Get user's first workspace
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    include: { workspace: true },
  });

  if (!membership) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Welcome to ProjectHub!</h2>
          <p className="text-muted-foreground">Setting up your workspace...</p>
        </div>
      </div>
    );
  }

  const workspaceId = membership.workspaceId;
  const [stats, activities] = await Promise.all([
    getDashboardStats(workspaceId),
    getActivities(workspaceId, 10),
  ]);

  return (
    <DashboardClient
      stats={stats}
      activities={JSON.parse(JSON.stringify(activities))}
      workspaceName={membership.workspace.name}
      userName={session.user.name || "User"}
    />
  );
}
