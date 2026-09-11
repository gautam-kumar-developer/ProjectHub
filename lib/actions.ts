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
import { hasPermission, canAttempt } from "@/lib/rbac";
import bcrypt from "bcryptjs";

// ─── Helpers ─────────────────────────────────────────────────

async function getSessionUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

async function getMembership(userId: string, workspaceId: string) {
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  if (!membership) throw new Error("Not a workspace member");
  return membership;
}

async function getMembershipByUser(userId: string) {
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
    include: { workspace: true },
  });
  return membership;
}

function requirePermission(role: string, action: Parameters<typeof hasPermission>[1], context?: Parameters<typeof hasPermission>[2]) {
  if (!hasPermission(role, action, context)) {
    throw new Error(`Permission denied: ${action}`);
  }
}

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
  const user = await getSessionUser();

  const parsed = workspaceSchema.parse(data);
  const workspace = await prisma.workspace.create({
    data: {
      name: parsed.name,
      slug: slugify(parsed.name) + "-" + Date.now().toString(36),
      description: parsed.description,
      members: {
        create: {
          userId: user.id!,
          role: "ADMIN",
        },
      },
    },
  });

  revalidatePath("/dashboard");
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
  const user = await getSessionUser();
  const membership = await getMembership(user.id!, workspaceId);
  requirePermission(membership.role, "CREATE_PROJECT");

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
      userId: user.id!,
      workspaceId,
      projectId: project.id,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/projects");
  return project;
}

export async function updateProject(projectId: string, data: any) {
  const user = await getSessionUser();

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error("Project not found");

  const membership = await getMembership(user.id!, project.workspaceId);

  // Check if user is a member of this project (has tasks assigned)
  const isProjectMember = await prisma.task.findFirst({
    where: { projectId, assigneeId: user.id! },
  });

  requirePermission(membership.role, "MANAGE_PROJECT", {
    userId: user.id!,
    isProjectMember: !!isProjectMember,
  });

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: {
      ...data,
      targetDate: data.targetDate ? new Date(data.targetDate) : null,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  return updated;
}

export async function deleteProject(projectId: string) {
  const user = await getSessionUser();

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error("Project not found");

  const membership = await getMembership(user.id!, project.workspaceId);

  // For PM — check activity log to see if they created the project
  const createdBy = await prisma.activityLog.findFirst({
    where: { projectId, action: "PROJECT_CREATED" },
    select: { userId: true },
  });

  requirePermission(membership.role, "DELETE_PROJECT", {
    userId: user.id!,
    resourceOwnerId: createdBy?.userId,
  });

  await prisma.project.delete({ where: { id: projectId } });
  revalidatePath("/dashboard");
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
  const user = await getSessionUser();

  const parsed = taskSchema.parse(data);

  // Get the project to find the workspace
  const project = await prisma.project.findUnique({
    where: { id: parsed.projectId },
    select: { workspaceId: true },
  });
  if (!project) throw new Error("Project not found");

  const membership = await getMembership(user.id!, project.workspaceId);

  // Developer: can only create tasks in projects they're assigned to
  const isProjectMember = await prisma.task.findFirst({
    where: { projectId: parsed.projectId, assigneeId: user.id! },
  });

  requirePermission(membership.role, "CREATE_TASK", {
    userId: user.id!,
    isProjectMember: !!isProjectMember,
  });

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

  await prisma.activityLog.create({
    data: {
      action: "TASK_CREATED",
      details: `Created task "${task.title}"`,
      userId: user.id!,
      workspaceId: project.workspaceId,
      projectId: parsed.projectId,
      taskId: task.id,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath(`/projects/${parsed.projectId}`);
  return task;
}

export async function updateTask(taskId: string, data: any) {
  const user = await getSessionUser();

  const existingTask = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: true },
  });
  if (!existingTask) throw new Error("Task not found");

  const membership = await getMembership(user.id!, existingTask.project.workspaceId);

  // Check if changing assignee — requires ASSIGN_TASK permission
  if (data.assigneeId !== undefined && data.assigneeId !== existingTask.assigneeId) {
    requirePermission(membership.role, "ASSIGN_TASK");
  }

  // Check general update permission
  const isOwnTask = existingTask.assigneeId === user.id!;
  const isProjectMember = !!(await prisma.task.findFirst({
    where: { projectId: existingTask.projectId, assigneeId: user.id! },
  }));

  const canManage = hasPermission(membership.role, "MANAGE_PROJECT", { userId: user.id!, isProjectMember });
  
  let allowed = isOwnTask || canManage;

  if (!allowed && data.status) {
    if (data.status === "DONE" && (hasPermission(membership.role, "APPROVE_TASK") || hasPermission(membership.role, "QA_TASK"))) {
      allowed = true;
    }
    if (data.status === "REVIEW" && hasPermission(membership.role, "REVIEW_CODE")) {
      allowed = true;
    }
  }

  if (!allowed) {
    // fallback to checking UPDATE_OWN_TASK context
    requirePermission(membership.role, "UPDATE_OWN_TASK", {
      userId: user.id!,
      resourceOwnerId: existingTask.assigneeId || undefined,
    });
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : data.dueDate === null ? null : undefined,
    },
    include: { assignee: true, subtasks: true, project: true },
  });

  if (data.status) {
    await prisma.activityLog.create({
      data: {
        action: "TASK_STATUS_CHANGED",
        details: `Changed task "${task.title}" status to ${data.status}`,
        userId: user.id!,
        workspaceId: existingTask.project.workspaceId,
        projectId: task.projectId,
        taskId: task.id,
      },
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath(`/projects/${task.projectId}`);
  return task;
}

export async function deleteTask(taskId: string) {
  const user = await getSessionUser();

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: true },
  });
  if (!task) throw new Error("Task not found");

  const membership = await getMembership(user.id!, task.project.workspaceId);
  requirePermission(membership.role, "MANAGE_PROJECT", {
    userId: user.id!,
    isProjectMember: true,
  });

  await prisma.task.delete({ where: { id: taskId } });

  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath(`/projects/${task.projectId}`);
}

export async function moveTask(taskId: string, newStatus: string, newOrderIndex: number) {
  const user = await getSessionUser();

  const existingTask = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: true },
  });
  if (!existingTask) throw new Error("Task not found");

  const membership = await getMembership(user.id!, existingTask.project.workspaceId);

  const isOwnTask = existingTask.assigneeId === user.id!;
  const isProjectMember = !!(await prisma.task.findFirst({
    where: { projectId: existingTask.projectId, assigneeId: user.id! },
  }));

  const canManage = hasPermission(membership.role, "MANAGE_PROJECT", { userId: user.id!, isProjectMember });
  
  let allowed = isOwnTask || canManage;

  if (!allowed && newStatus) {
    if (newStatus === "DONE" && (hasPermission(membership.role, "APPROVE_TASK") || hasPermission(membership.role, "QA_TASK"))) {
      allowed = true;
    }
    if (newStatus === "REVIEW" && hasPermission(membership.role, "REVIEW_CODE")) {
      allowed = true;
    }
  }

  if (!allowed) {
    requirePermission(membership.role, "UPDATE_OWN_TASK", {
      userId: user.id!,
      resourceOwnerId: existingTask.assigneeId || undefined,
    });
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data: { status: newStatus, orderIndex: newOrderIndex },
    include: { project: true },
  });

  await prisma.activityLog.create({
    data: {
      action: "TASK_MOVED",
      details: `Moved task "${task.title}" to ${newStatus}`,
      userId: user.id!,
      workspaceId: task.project.workspaceId,
      projectId: task.projectId,
      taskId: task.id,
    },
  });

  revalidatePath("/dashboard");
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

  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  return comment;
}

export async function deleteComment(commentId: string) {
  await prisma.comment.delete({ where: { id: commentId } });
  revalidatePath("/dashboard");
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

  revalidatePath("/dashboard");
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

  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  return updated;
}

export async function deleteSubtask(subtaskId: string) {
  await prisma.subtask.delete({ where: { id: subtaskId } });
  revalidatePath("/dashboard");
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
  const currentUser = await getSessionUser();
  const membership = await getMembership(currentUser.id!, workspaceId);
  requirePermission(membership.role, "MANAGE_MEMBERS");

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

  revalidatePath("/dashboard");
  revalidatePath("/team");
  return member;
}

export async function removeMember(memberId: string) {
  const currentUser = await getSessionUser();

  const target = await prisma.workspaceMember.findUnique({ where: { id: memberId } });
  if (!target) throw new Error("Member not found");

  const membership = await getMembership(currentUser.id!, target.workspaceId);
  requirePermission(membership.role, "MANAGE_MEMBERS");

  await prisma.workspaceMember.delete({ where: { id: memberId } });
  revalidatePath("/dashboard");
  revalidatePath("/team");
}

export async function updateMemberRole(memberId: string, role: string) {
  const currentUser = await getSessionUser();

  const target = await prisma.workspaceMember.findUnique({ where: { id: memberId } });
  if (!target) throw new Error("Member not found");

  const membership = await getMembership(currentUser.id!, target.workspaceId);
  requirePermission(membership.role, "MANAGE_MEMBERS");

  const member = await prisma.workspaceMember.update({
    where: { id: memberId },
    data: { role },
  });
  revalidatePath("/dashboard");
  revalidatePath("/team");
  return member;
}

export async function createDepartment(workspaceId: string, data: { name: string; description?: string }) {
  const currentUser = await getSessionUser();
  const membership = await getMembership(currentUser.id!, workspaceId);
  
  requirePermission(membership.role, "CREATE_DEPARTMENT");
  
  const department = await prisma.department.create({
    data: {
      name: data.name,
      description: data.description,
      workspaceId,
    },
  });
  
  revalidatePath("/dashboard");
  revalidatePath("/team");
  return department;
}

export async function getDepartments(workspaceId: string) {
  return prisma.department.findMany({
    where: { workspaceId },
    orderBy: { name: "asc" },
  });
}

export async function createWorkspaceUser(workspaceId: string, data: { name: string; email: string; role: string; departmentId?: string }) {
  const currentUser = await getSessionUser();
  const membership = await getMembership(currentUser.id!, workspaceId);
  
  requirePermission(membership.role, "CREATE_USER");
  
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) throw new Error("A user with this email already exists");

  // Default password "password123"
  const hashedPassword = await bcrypt.hash("password123", 12);
  
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      hashedPassword,
    },
  });

  const member = await prisma.workspaceMember.create({
    data: {
      userId: user.id,
      workspaceId,
      role: data.role,
      departmentId: data.departmentId || null,
    },
    include: { user: true, department: true },
  });

  revalidatePath("/dashboard");
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

export async function getDashboardStats(workspaceId: string, userId: string) {
  const membership = await getMembership(userId, workspaceId);
  const role = membership.role;

  // View Reports gating
  if (!canAttempt(role, "VIEW_REPORTS")) {
    throw new Error("Permission denied: VIEW_REPORTS");
  }

  // Base queries
  let projectWhere: any = { workspaceId };
  let taskWhere: any = { project: { workspaceId } };

  // Scope data based on limited access
  if (role === "DEVELOPER") {
    // DEVELOPER: Own reports only
    taskWhere = { assigneeId: userId, project: { workspaceId } };
    projectWhere = { workspaceId, tasks: { some: { assigneeId: userId } } };
  } else if (role === "TEAM_LEAD") {
    // TEAM_LEAD: Team reports (projects they are a part of, and tasks within those projects)
    projectWhere = { workspaceId, tasks: { some: { assigneeId: userId } } };
    const userProjects = await prisma.project.findMany({
      where: projectWhere,
      select: { id: true },
    });
    const projectIds = userProjects.map(p => p.id);
    taskWhere = { projectId: { in: projectIds } };
  } else if (role === "QA") {
    // QA: QA reports (mostly concerned with REVIEW tasks and projects that have review tasks)
    taskWhere = { project: { workspaceId }, status: { in: ["REVIEW", "DONE"] } };
    projectWhere = { workspaceId, tasks: { some: { status: { in: ["REVIEW", "DONE"] } } } };
  }

  const [projects, tasks, members] = await Promise.all([
    prisma.project.findMany({ where: projectWhere, include: { tasks: true } }),
    prisma.task.findMany({ where: taskWhere }),
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

// ─── Document Actions ────────────────────────────────────────

export async function getDocuments(workspaceId: string) {
  const user = await getSessionUser();
  const membership = await getMembership(user.id!, workspaceId);

  // Build query based on role
  let where: any = { project: { workspaceId } };

  if (membership.role === "DEVELOPER") {
    // Only see documents in projects they are assigned to
    const assignedProjects = await prisma.task.findMany({
      where: { assigneeId: user.id!, project: { workspaceId } },
      select: { projectId: true },
      distinct: ["projectId"],
    });
    const projectIds = assignedProjects.map((t) => t.projectId);
    where = { projectId: { in: projectIds } };
  } else if (membership.role === "QA") {
    // See documents in projects that have review/done tasks
    const qaProjects = await prisma.project.findMany({
      where: { workspaceId, tasks: { some: { status: { in: ["REVIEW", "DONE"] } } } },
      select: { id: true },
    });
    const projectIds = qaProjects.map((p) => p.id);
    where = { projectId: { in: projectIds } };
  }

  return prisma.document.findMany({
    where,
    include: {
      uploadedBy: { select: { id: true, name: true, image: true } },
      project: { select: { id: true, name: true, color: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
