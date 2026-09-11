import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// Allowed MIME types
const ALLOWED_TYPES = new Set([
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "application/rtf",
  // Images
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  // Archives
  "application/zip",
  "application/x-rar-compressed",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const projectId = formData.get("projectId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!projectId) {
      return NextResponse.json({ error: "No project specified" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `File type "${file.type}" is not allowed` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds maximum size of 10MB" },
        { status: 400 }
      );
    }

    // Check project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { workspaceId: true },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check RBAC permission
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: project.workspaceId,
        },
      },
    });
    if (!membership) {
      return NextResponse.json({ error: "Not a workspace member" }, { status: 403 });
    }

    // For limited roles, check project membership
    const isProjectMember = !!(await prisma.task.findFirst({
      where: { projectId, assigneeId: session.user.id },
    }));

    const allowed = hasPermission(membership.role, "UPLOAD_DOCUMENT", {
      userId: session.user.id,
      isProjectMember,
    });

    if (!allowed) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Save file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `${uniqueId}-${sanitizedName}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", projectId);

    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // Create DB record
    const document = await prisma.document.create({
      data: {
        name: file.name,
        storagePath: `/uploads/${projectId}/${fileName}`,
        mimeType: file.type,
        sizeBytes: file.size,
        projectId,
        uploadedById: session.user.id,
      },
      include: {
        uploadedBy: { select: { id: true, name: true, image: true } },
        project: { select: { id: true, name: true, color: true } },
      },
    });

    // Log the activity
    await prisma.activityLog.create({
      data: {
        action: "DOCUMENT_UPLOADED",
        details: `Uploaded document "${file.name}"`,
        userId: session.user.id,
        workspaceId: project.workspaceId,
        projectId,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 }
    );
  }
}
