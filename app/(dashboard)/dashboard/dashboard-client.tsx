"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Users,
  Activity,
  ArrowUpRight,
} from "lucide-react";
import { formatRelativeDate, getInitials, PROJECT_STATUS_CONFIG } from "@/lib/utils";

interface DashboardClientProps {
  stats: {
    totalProjects: number;
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    todoTasks: number;
    reviewTasks: number;
    overdueTasks: number;
    urgentTasks: number;
    totalMembers: number;
    completionRate: number;
    projectStats: {
      id: string;
      name: string;
      color: string;
      status: string;
      total: number;
      done: number;
      progress: number;
    }[];
  };
  activities: any[];
  workspaceName: string;
  userName: string;
}

export function DashboardClient({ stats, activities, workspaceName, userName }: DashboardClientProps) {
  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const metricCards = [
    {
      title: "Total Projects",
      value: stats.totalProjects,
      icon: FolderKanban,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Tasks Completed",
      value: stats.completedTasks,
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      subtitle: `of ${stats.totalTasks} total`,
    },
    {
      title: "In Progress",
      value: stats.inProgressTasks,
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      title: "Overdue Tasks",
      value: stats.overdueTasks,
      icon: AlertTriangle,
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold">
          {greeting()}, {userName.split(" ")[0]} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening in <span className="font-medium text-foreground">{workspaceName}</span>
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card) => (
          <Card key={card.title} className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-bold">{card.value}</span>
                    {card.subtitle && (
                      <span className="text-xs text-muted-foreground">{card.subtitle}</span>
                    )}
                  </div>
                </div>
                <div className={`${card.bg} p-3 rounded-xl`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Completion Rate + Team Size Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Completion Rate */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20">
                <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0-31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-muted"
                  />
                  <path
                    d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0-31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray={`${stats.completionRate}, 100`}
                    className="text-primary transition-all duration-1000"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">
                  {stats.completionRate}%
                </span>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Done: {stats.completedTasks}
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  In Progress: {stats.inProgressTasks}
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  Review: {stats.reviewTasks}
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-500" />
                  To Do: {stats.todoTasks}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Progress */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FolderKanban className="h-4 w-4" />
              Project Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.projectStats.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No projects yet</p>
              ) : (
                stats.projectStats.slice(0, 5).map((project) => (
                  <div key={project.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-sm"
                          style={{ backgroundColor: project.color }}
                        />
                        <span className="font-medium">{project.name}</span>
                        <Badge
                          className={
                            PROJECT_STATUS_CONFIG[project.status as keyof typeof PROJECT_STATUS_CONFIG]?.color || ""
                          }
                          variant="secondary"
                        >
                          {PROJECT_STATUS_CONFIG[project.status as keyof typeof PROJECT_STATUS_CONFIG]?.label || project.status}
                        </Badge>
                      </div>
                      <span className="text-muted-foreground">
                        {project.done}/{project.total} tasks
                      </span>
                    </div>
                    <Progress
                      value={project.progress}
                      indicatorClassName={project.progress === 100 ? "bg-emerald-500" : ""}
                    />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed + Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Activity Feed */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No recent activity</p>
              ) : (
                activities.map((activity: any) => (
                  <div key={activity.id} className="flex items-start gap-3 group">
                    <Avatar
                      src={activity.user?.image}
                      fallback={getInitials(activity.user?.name || "U")}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user?.name}</span>{" "}
                        <span className="text-muted-foreground">{activity.details}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatRelativeDate(activity.createdAt)}
                        {activity.project && (
                          <> · <span className="text-foreground">{activity.project.name}</span></>
                        )}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm">Team Members</span>
              <span className="text-lg font-bold">{stats.totalMembers}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm">Urgent Tasks</span>
              <span className="text-lg font-bold text-red-500">{stats.urgentTasks}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm">Active Projects</span>
              <span className="text-lg font-bold">
                {stats.projectStats.filter((p) => p.status === "ACTIVE").length}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm">Completion Rate</span>
              <span className="text-lg font-bold text-emerald-500">{stats.completionRate}%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
