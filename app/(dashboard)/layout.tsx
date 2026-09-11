import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
  });

  const role = membership?.role || "DEVELOPER";

  return (
    <div className="flex h-screen">
      <Sidebar currentUserRole={role} />
      <div className="flex flex-1 flex-col ml-[240px] transition-all duration-300">
        <Header currentUserRole={role} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
