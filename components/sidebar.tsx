"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { canAttempt, ROLE_CONFIG, type Role } from "@/lib/rbac";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Layers,
  Shield,
  FileText,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, action: null },
  { href: "/projects", label: "Projects", icon: FolderKanban, action: null },
  { href: "/tasks", label: "Tasks", icon: CheckSquare, action: null },
  { href: "/documents", label: "Documents", icon: FileText, action: "UPLOAD_DOCUMENT" as const },
  { href: "/team", label: "Team", icon: Users, action: null },
  { href: "/analytics", label: "Analytics", icon: BarChart3, action: "VIEW_REPORTS" as const },
];

interface SidebarProps {
  currentUserRole?: string;
}

export function Sidebar({ currentUserRole }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);

  const role = currentUserRole || "DEVELOPER";
  const roleConfig = ROLE_CONFIG[role as Role];

  const visibleItems = navItems.filter((item) => {
    if (!item.action) return true;
    return canAttempt(role, item.action);
  });

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
          <Layers className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <span className="text-base font-bold tracking-tight text-sidebar-foreground">
            ProjectHub
          </span>
        )}
      </div>

      {/* Role Badge */}
      {!collapsed && roleConfig && (
        <div className="px-3 pt-3">
          <div className={cn("flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium", roleConfig.color)}>
            <Shield className="h-3 w-3" />
            {roleConfig.label}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {visibleItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className={cn("h-4.5 w-4.5 shrink-0", isActive && "text-primary")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-sidebar-border p-3">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-accent-foreground"
        >
          <Settings className="h-4.5 w-4.5 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:text-foreground cursor-pointer"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>
    </aside>
  );
}
