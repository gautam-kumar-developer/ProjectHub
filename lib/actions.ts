"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import {
  projectSchema,
  taskSchema,
  commentSchema,
  subtaskSchema,
  workspaceSchema,
} from "@/lib/validations";
import { slugify } from "@/lib/utils";
import bcrypt from "bcryptjs";

// ─── Auth Actions ────────────────────────────────────────────

export async function registerUser(data: { name: string; email: string; password: string }) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new Error("User already exists");

  const hashedPassword = await bcrypt.hash(data.password, 12);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      hashedPassword,
    },
  });

  // Create a default workspace for the user
  const workspace = await prisma.workspace.create({
    data: {
      name: `${data.name}'s Workspace`,
      slug: slugify(data.name) + "-workspace",
      members: {
        create: {
          userId: user.id,
          role: "ADMIN",
        },
      },
    },
  });

  return { user, workspace };
}

// ─── Workspace Actions ───────────────────────────────────────

export async function getWorkspaces() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: session.user.id },
    include: {
      workspace: {
        include: {
          members: { include: { user: true } },
          projects: true,
        },
      },
    },
  });

  return memberships.map((m) => m.workspace);
}

export async function createWorkspace(data: { name: string; description?: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const parsed = workspaceSchema.parse(data);
  const workspace = await prisma.workspace.create({
    data: {
      name: parsed.name,
      slug: slugify(parsed.name) + "-" + Date.now().toString(36),
      description: parsed.description,
      members: {
        create: {
          userId: session.user.id,
          role: "ADMIN",
        },
      },
    },
  });

  revalidatePath("/");
  return workspace;
}

// ─── Project Actions ─────────────────────────────────────────

export async function getProjects(workspaceId: string) {
  return prisma.project.findMany({
    where: { workspaceId },
    include: {
      tasks: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProject(projectId: string) {
  return prisma.project.findUnique({
    where: { id: projectId },
    include: {
      tasks: {
        include: {
          assignee: true,
          subtasks: true,
          comments: { include: { author: true }, orderBy: { createdAt: "desc" } },
        },
        orderBy: { orderIndex: "asc" },
      },
      workspace: {
        include: {
          members: { include: { user: true } },
        },
      },
    },
  });
}

export async function createProject(workspaceId: string, data: any) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const parsed = projectSchema.parse(data);
  const project = await prisma.project.create({
    data: {
      name: parsed.name,
      slug: slugify(parsed.name) + "-" + Date.now().toString(36),
      description: parsed.description,
      status: parsed.status,
      color: parsed.color,
      budget: parsed.budget,
      targetDate: parsed.targetDate ? new Date(parsed.targetDate) : null,
      workspaceId,
    },
  });

  await prisma.activityLog.create({
    data: {
      action: "PROJECT_CREATED",
      details: `Created project "${project.name}"`,
      userId: session.user.id,
      workspaceId,
      projectId: project.id,
    },
  });

  revalidatePath("/");
  revalidatePath("/projects");
  return project;
}

export async function updateProject(projectId: string, data: any) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const project = await prisma.project.update({
    where: { id: projectId },
    data: {
      ...data,
      targetDate: data.targetDate ? new Date(data.targetDate) : null,
    },
  });

  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  return project;
}

export async function deleteProject(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.project.delete({ where: { id: projectId } });
  revalidatePath("/");
  revalidatePath("/projects");
}

// ─── Task Actions ────────────────────────────────────────────

export async function getTasks(projectId?: string) {
  const where = projectId ? { projectId } : {};
  return prisma.task.findMany({
    where,
    include: {
      assignee: true,
      subtasks: true,
      project: true,
      comments: true,
    },
    orderBy: { orderIndex: "asc" },
  });
}

export async function createTask(data: any) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const parsed = taskSchema.parse(data);

  const maxOrder = await prisma.task.findFirst({
    where: { projectId: parsed.projectId, status: parsed.status },
    orderBy: { orderIndex: "desc" },
    select: { orderIndex: true },
  });

  const task = await prisma.task.create({
    data: {
      title: parsed.title,
      description: parsed.description,
      status: parsed.status,
      priority: parsed.priority,
      dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
      assigneeId: parsed.assigneeId,
      projectId: parsed.projectId,
      tags: parsed.tags,
      orderIndex: (maxOrder?.orderIndex ?? 0) + 1000,
    },
    include: { assignee: true, subtasks: true, project: true },
  });

  const project = await prisma.project.findUnique({
    where: { id: parsed.projectId },
    select: { workspaceId: true },
  });

  await prisma.activityLog.create({
    data: {
      action: "TASK_CREATED",
      details: `Created task "${task.title}"`,
      userId: session.user.id,
      workspaceId: project?.workspaceId,
      projectId: parsed.projectId,
      taskId: task.id,
    },
  });

  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath(`/projects/${parsed.projectId}`);
  return task;
}

export async function updateTask(taskId: string, data: any) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : data.dueDate === null ? null : undefined,
    },
    include: { assignee: true, subtasks: true, project: true },
  });

  if (data.status) {
    const project = await prisma.project.findUnique({
      where: { id: task.projectId },
      select: { workspaceId: true },
    });

    await prisma.activityLog.create({
      data: {
        action: "TASK_STATUS_CHANGED",
        details: `Changed task "${task.title}" status to ${data.status}`,
        userId: session.user.id,
        workspaceId: project?.workspaceId,
        projectId: task.projectId,
        taskId: task.id,
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath(`/projects/${task.projectId}`);
  return task;
}

export async function deleteTask(taskId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  await prisma.task.delete({ where: { id: taskId } });

  revalidatePath("/");
  revalidatePath("/tasks");
  if (task) revalidatePath(`/projects/${task.projectId}`);
}

export async function moveTask(taskId: string, newStatus: string, newOrderIndex: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const task = await prisma.task.update({
    where: { id: taskId },
    data: { status: newStatus, orderIndex: newOrderIndex },
    include: { project: true },
  });

  await prisma.activityLog.create({
    data: {
      action: "TASK_MOVED",
      details: `Moved task "${task.title}" to ${newStatus}`,
      userId: session.user.id,
      workspaceId: task.project.workspaceId,
      projectId: task.projectId,
      taskId: task.id,
    },
  });

  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath(`/projects/${task.projectId}`);
  return task;
}

// ─── Comment Actions ─────────────────────────────────────────

export async function addComment(data: { content: string; taskId: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const parsed = commentSchema.parse(data);
  const comment = await prisma.comment.create({
    data: {
      content: parsed.content,
      taskId: parsed.taskId,
      authorId: session.user.id,
    },
    include: { author: true },
  });

  revalidatePath("/");
  revalidatePath("/tasks");
  return comment;
}

export async function deleteComment(commentId: string) {
  await prisma.comment.delete({ where: { id: commentId } });
  revalidatePath("/");
  revalidatePath("/tasks");
}

// ─── Subtask Actions ─────────────────────────────────────────

export async function addSubtask(data: { title: string; taskId: string }) {
  const parsed = subtaskSchema.parse(data);
  const subtask = await prisma.subtask.create({
    data: {
      title: parsed.title,
      taskId: parsed.taskId,
    },
  });

  revalidatePath("/");
  revalidatePath("/tasks");
  return subtask;
}

export async function toggleSubtask(subtaskId: string) {
  const subtask = await prisma.subtask.findUnique({ where: { id: subtaskId } });
  if (!subtask) throw new Error("Subtask not found");

  const updated = await prisma.subtask.update({
    where: { id: subtaskId },
    data: { isCompleted: !subtask.isCompleted },
  });

  revalidatePath("/");
  revalidatePath("/tasks");
  return updated;
}

export async function deleteSubtask(subtaskId: string) {
  await prisma.subtask.delete({ where: { id: subtaskId } });
  revalidatePath("/");
  revalidatePath("/tasks");
}

// ─── Team / Member Actions ───────────────────────────────────

export async function getWorkspaceMembers(workspaceId: string) {
  return prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: {
      user: {
        include: {
          assignedTasks: true,
        },
      },
    },
  });
}

export async function addMember(workspaceId: string, data: { email: string; role: string }) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) throw new Error("User not found with that email");

  const existing = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId } },
  });
  if (existing) throw new Error("User is already a member");

  const member = await prisma.workspaceMember.create({
    data: {
      userId: user.id,
      workspaceId,
      role: data.role,
    },
    include: { user: true },
  });

  revalidatePath("/");
  revalidatePath("/team");
  return member;
}

export async function removeMember(memberId: string) {
  await prisma.workspaceMember.delete({ where: { id: memberId } });
  revalidatePath("/");
  revalidatePath("/team");
}

export async function updateMemberRole(memberId: string, role: string) {
  const member = await prisma.workspaceMember.update({
    where: { id: memberId },
    data: { role },
  });
  revalidatePath("/");
  revalidatePath("/team");
  return member;
}

// ─── Activity Log Actions ────────────────────────────────────

export async function getActivities(workspaceId: string, limit = 20) {
  return prisma.activityLog.findMany({
    where: { workspaceId },
    include: {
      user: true,
      project: true,
      task: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

// ─── Dashboard Stats ─────────────────────────────────────────

export async function getDashboardStats(workspaceId: string) {
  const [projects, tasks, members] = await Promise.all([
    prisma.project.findMany({ where: { workspaceId }, include: { tasks: true } }),
    prisma.task.findMany({ where: { project: { workspaceId } } }),
    prisma.workspaceMember.findMany({ where: { workspaceId } }),
  ]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "DONE").length;
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const todoTasks = tasks.filter((t) => t.status === "TODO").length;
  const reviewTasks = tasks.filter((t) => t.status === "REVIEW").length;
  const overdueTasks = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "DONE"
  ).length;

  const urgentTasks = tasks.filter((t) => t.priority === "URGENT" && t.status !== "DONE").length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const projectStats = projects.map((p) => {
    const projectTasks = p.tasks;
    const done = projectTasks.filter((t) => t.status === "DONE").length;
    const total = projectTasks.length;
    return {
      id: p.id,
      name: p.name,
      color: p.color,
      status: p.status,
      total,
      done,
      progress: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  });

  return {
    totalProjects: projects.length,
    totalTasks,
    completedTasks,
    inProgressTasks,
    todoTasks,
    reviewTasks,
    overdueTasks,
    urgentTasks,
    totalMembers: members.length,
    completionRate,
    projectStats,
  };
}
