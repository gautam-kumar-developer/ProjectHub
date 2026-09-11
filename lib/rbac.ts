// ─── RBAC — Role-Based Access Control ─────────────────────────
// Single source of truth for all permission checks in the app.
// Used by both server actions (enforcement) and UI components (visibility).

export const ROLES = [
  "ADMIN",
  "DEPT_HEAD",
  "PM",
  "TEAM_LEAD",
  "DEVELOPER",
  "QA",
] as const;

export type Role = (typeof ROLES)[number];

// ─── Role Hierarchy ──────────────────────────────────────────
// Higher number = more authority. Used for comparisons like
// "can this user manage that user?"
export const ROLE_HIERARCHY: Record<Role, number> = {
  ADMIN: 100,
  DEPT_HEAD: 80,
  PM: 60,
  TEAM_LEAD: 40,
  DEVELOPER: 20,
  QA: 20,
};

// ─── Role Display Config ─────────────────────────────────────
export const ROLE_CONFIG: Record<
  Role,
  { label: string; color: string; description: string }
> = {
  ADMIN: {
    label: "Admin",
    color: "bg-red-500/20 text-red-400 border-red-500/30",
    description: "Full system access",
  },
  DEPT_HEAD: {
    label: "Dept Head",
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    description: "Department-level management",
  },
  PM: {
    label: "Project Manager",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    description: "Project-level management",
  },
  TEAM_LEAD: {
    label: "Team Lead",
    color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    description: "Team-level task management",
  },
  DEVELOPER: {
    label: "Developer",
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    description: "Development and task execution",
  },
  QA: {
    label: "QA",
    color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    description: "Quality assurance and testing",
  },
};

// ─── Actions ─────────────────────────────────────────────────
export type Action =
  | "CREATE_USER"
  | "CREATE_DEPARTMENT"
  | "CREATE_PROJECT"
  | "MANAGE_PROJECT"
  | "DELETE_PROJECT"
  | "CREATE_TASK"
  | "ASSIGN_TASK"
  | "UPDATE_OWN_TASK"
  | "REVIEW_CODE"
  | "QA_TASK"
  | "APPROVE_TASK"
  | "VIEW_REPORTS"
  | "MANAGE_MEMBERS"
  | "UPLOAD_DOCUMENT"
  | "DELETE_DOCUMENT";

// ─── Permission Context ──────────────────────────────────────
// Extra context for "Limited", "Own", "Team" style checks.
export interface PermissionContext {
  /** The ID of the user performing the action */
  userId?: string;
  /** The ID of the resource owner (e.g., task assignee, project creator) */
  resourceOwnerId?: string;
  /** Whether the user is a member/assignee of the related project */
  isProjectMember?: boolean;
  /** Team member IDs (for Team Lead's "Team" scoped reports) */
  teamMemberIds?: string[];
}

// ─── Core Permission Matrix ──────────────────────────────────
// Maps (Role, Action) → true | false | "limited"
// "limited" means permission depends on context (checked separately).

type PermissionValue = true | false | "limited";

const PERMISSION_MATRIX: Record<Role, Record<Action, PermissionValue>> = {
  ADMIN: {
    CREATE_USER: true,
    CREATE_DEPARTMENT: true,
    CREATE_PROJECT: true,
    MANAGE_PROJECT: true,
    DELETE_PROJECT: true,
    CREATE_TASK: true,
    ASSIGN_TASK: true,
    UPDATE_OWN_TASK: true,
    REVIEW_CODE: false,
    QA_TASK: false,
    APPROVE_TASK: true,
    VIEW_REPORTS: true,
    MANAGE_MEMBERS: true,
    UPLOAD_DOCUMENT: true,
    DELETE_DOCUMENT: true,
  },
  DEPT_HEAD: {
    CREATE_USER: false,
    CREATE_DEPARTMENT: false,
    CREATE_PROJECT: true,
    MANAGE_PROJECT: true,
    DELETE_PROJECT: false,
    CREATE_TASK: true,
    ASSIGN_TASK: true,
    UPDATE_OWN_TASK: true,
    REVIEW_CODE: false,
    QA_TASK: false,
    APPROVE_TASK: true,
    VIEW_REPORTS: true,
    MANAGE_MEMBERS: false,
    UPLOAD_DOCUMENT: true,
    DELETE_DOCUMENT: true,
  },
  PM: {
    CREATE_USER: false,
    CREATE_DEPARTMENT: false,
    CREATE_PROJECT: true,
    MANAGE_PROJECT: true,
    DELETE_PROJECT: "limited", // Only projects they manage
    CREATE_TASK: true,
    ASSIGN_TASK: true,
    UPDATE_OWN_TASK: true,
    REVIEW_CODE: true,
    QA_TASK: false,
    APPROVE_TASK: true,
    VIEW_REPORTS: true,
    MANAGE_MEMBERS: false,
    UPLOAD_DOCUMENT: true,
    DELETE_DOCUMENT: "limited", // Own documents only
  },
  TEAM_LEAD: {
    CREATE_USER: false,
    CREATE_DEPARTMENT: false,
    CREATE_PROJECT: false,
    MANAGE_PROJECT: "limited", // Only projects their team is assigned to
    DELETE_PROJECT: false,
    CREATE_TASK: true,
    ASSIGN_TASK: true,
    UPDATE_OWN_TASK: true,
    REVIEW_CODE: true,
    QA_TASK: false,
    APPROVE_TASK: true,
    VIEW_REPORTS: "limited", // Team-scoped reports
    MANAGE_MEMBERS: false,
    UPLOAD_DOCUMENT: true,
    DELETE_DOCUMENT: "limited", // Own documents only
  },
  DEVELOPER: {
    CREATE_USER: false,
    CREATE_DEPARTMENT: false,
    CREATE_PROJECT: false,
    MANAGE_PROJECT: false,
    DELETE_PROJECT: false,
    CREATE_TASK: "limited", // Only in assigned projects
    ASSIGN_TASK: false,
    UPDATE_OWN_TASK: true,
    REVIEW_CODE: false,
    QA_TASK: false,
    APPROVE_TASK: false,
    VIEW_REPORTS: "limited", // Own reports only
    MANAGE_MEMBERS: false,
    UPLOAD_DOCUMENT: "limited", // Only in assigned projects
    DELETE_DOCUMENT: "limited", // Own documents only
  },
  QA: {
    CREATE_USER: false,
    CREATE_DEPARTMENT: false,
    CREATE_PROJECT: false,
    MANAGE_PROJECT: false,
    DELETE_PROJECT: false,
    CREATE_TASK: false,
    ASSIGN_TASK: false,
    UPDATE_OWN_TASK: "limited", // Can update status only (not other fields)
    REVIEW_CODE: false,
    QA_TASK: true,
    APPROVE_TASK: true,
    VIEW_REPORTS: "limited", // QA-scoped reports
    MANAGE_MEMBERS: false,
    UPLOAD_DOCUMENT: "limited", // Only in assigned projects
    DELETE_DOCUMENT: "limited", // Own documents only
  },
};

// ─── Permission Check ────────────────────────────────────────

/**
 * Check if a role has permission to perform an action.
 *
 * Returns `true` for full access, `false` for no access.
 * For "limited" permissions, applies contextual checks when
 * a PermissionContext is provided; otherwise returns `true`
 * (optimistic — the UI shows the button, server enforces).
 */
export function hasPermission(
  role: string,
  action: Action,
  context?: PermissionContext
): boolean {
  const r = role as Role;
  const matrix = PERMISSION_MATRIX[r];
  if (!matrix) return false;

  const value = matrix[action];

  if (value === true) return true;
  if (value === false) return false;

  // "limited" — apply contextual logic
  if (value === "limited") {
    if (!context) return true; // No context → optimistic (show UI, server enforces)

    switch (action) {
      case "DELETE_PROJECT":
        // PM can delete only projects they own/manage
        return context.userId === context.resourceOwnerId;

      case "MANAGE_PROJECT":
        // Team Lead can manage projects they are a member of
        return !!context.isProjectMember;

      case "CREATE_TASK":
        // Developer can create tasks only in projects they're assigned to
        return !!context.isProjectMember;

      case "UPDATE_OWN_TASK":
        // QA can update only status (handled at the UI/action layer),
        // but they can update tasks assigned to them
        return context.userId === context.resourceOwnerId;

      case "VIEW_REPORTS":
        // Team Lead: team-scoped, Developer: own, QA: QA-scoped
        // These are handled at the query layer, so grant access here
        return true;

      case "UPLOAD_DOCUMENT":
        // Developer/QA can upload only in projects they're assigned to
        return !!context.isProjectMember;

      case "DELETE_DOCUMENT":
        // PM/TEAM_LEAD/DEVELOPER/QA can delete only their own documents
        return context.userId === context.resourceOwnerId;

      default:
        return false;
    }
  }

  return false;
}

/**
 * Quick check: does this role have ANY access (full or limited) to the action?
 * Useful for UI — show the button if the user might be allowed.
 */
export function canAttempt(role: string, action: Action): boolean {
  const r = role as Role;
  const matrix = PERMISSION_MATRIX[r];
  if (!matrix) return false;
  return matrix[action] !== false;
}

/**
 * Check if roleA outranks roleB in the hierarchy.
 * Used for "can this user change another user's role" checks.
 */
export function outranks(roleA: string, roleB: string): boolean {
  return (ROLE_HIERARCHY[roleA as Role] ?? 0) > (ROLE_HIERARCHY[roleB as Role] ?? 0);
}

/**
 * Get all roles that the given role is allowed to assign to others.
 * A user can only assign roles below their own level.
 */
export function getAssignableRoles(role: string): Role[] {
  const level = ROLE_HIERARCHY[role as Role] ?? 0;
  return ROLES.filter((r) => ROLE_HIERARCHY[r] < level);
}
