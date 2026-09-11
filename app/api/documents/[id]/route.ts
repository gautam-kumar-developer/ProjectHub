import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import { unlink } from "fs/promises";
import path from "path";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        project: { select: { workspaceId: true } },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Check RBAC permission
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: document.project.workspaceId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Not a workspace member" }, { status: 403 });
    }

    const allowed = hasPermission(membership.role, "DELETE_DOCUMENT", {
      userId: session.user.id,
      resourceOwnerId: document.uploadedById,
    });

    if (!allowed) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Delete file from disk
    try {
      const filePath = path.join(process.cwd(), "public", document.storagePath);
      await unlink(filePath);
    } catch {
      // File might already be deleted, continue with DB cleanup
      console.warn(`File not found on disk: ${document.storagePath}`);
    }

    // Delete DB record
    await prisma.document.delete({ where: { id } });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "DOCUMENT_DELETED",
        details: `Deleted document "${document.name}"`,
        userId: session.user.id,
        workspaceId: document.project.workspaceId,
        projectId: document.projectId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
