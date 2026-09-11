import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-");
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatRelativeDate(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export const STATUS_CONFIG = {
  TODO: { label: "To Do", color: "bg-slate-500", textColor: "text-slate-400" },
  IN_PROGRESS: { label: "In Progress", color: "bg-blue-500", textColor: "text-blue-400" },
  REVIEW: { label: "Review", color: "bg-amber-500", textColor: "text-amber-400" },
  DONE: { label: "Done", color: "bg-emerald-500", textColor: "text-emerald-400" },
} as const;

export const PRIORITY_CONFIG = {
  URGENT: { label: "Urgent", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  HIGH: { label: "High", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  MEDIUM: { label: "Medium", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  LOW: { label: "Low", color: "bg-green-500/20 text-green-400 border-green-500/30" },
} as const;

export const PROJECT_STATUS_CONFIG = {
  PLANNING: { label: "Planning", color: "bg-purple-500/20 text-purple-400" },
  ACTIVE: { label: "Active", color: "bg-blue-500/20 text-blue-400" },
  ON_HOLD: { label: "On Hold", color: "bg-amber-500/20 text-amber-400" },
  COMPLETED: { label: "Completed", color: "bg-emerald-500/20 text-emerald-400" },
} as const;

export type TaskStatus = keyof typeof STATUS_CONFIG;
export type TaskPriority = keyof typeof PRIORITY_CONFIG;
export type ProjectStatus = keyof typeof PROJECT_STATUS_CONFIG;
