"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react";

interface AnalyticsClientProps {
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
  memberWorkload: {
    name: string;
    tasks: number;
    completed: number;
    inProgress: number;
  }[];
}

const STATUS_COLORS = ["#64748b", "#3b82f6", "#f59e0b", "#10b981"];
const PRIORITY_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e"];

export function AnalyticsClient({ stats, memberWorkload }: AnalyticsClientProps) {
  const statusData = [
    { name: "To Do", value: stats.todoTasks, color: "#64748b" },
    { name: "In Progress", value: stats.inProgressTasks, color: "#3b82f6" },
    { name: "Review", value: stats.reviewTasks, color: "#f59e0b" },
    { name: "Done", value: stats.completedTasks, color: "#10b981" },
  ];

  const projectData = stats.projectStats.map((p) => ({
    name: p.name.length > 15 ? p.name.slice(0, 15) + "..." : p.name,
    total: p.total,
    completed: p.done,
    progress: p.progress,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Performance insights and project metrics
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Tasks", value: stats.totalTasks, icon: BarChart3, color: "text-blue-500" },
          { label: "Completion Rate", value: `${stats.completionRate}%`, icon: TrendingUp, color: "text-emerald-500" },
          { label: "Team Members", value: stats.totalMembers, icon: Users, color: "text-purple-500" },
          { label: "Overdue", value: stats.overdueTasks, icon: Clock, color: "text-red-500" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Task Status Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <PieChartIcon className="h-4 w-4" />
              Task Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(224 71% 4%)",
                      border: "1px solid hsl(216 34% 17%)",
                      borderRadius: "8px",
                      fontSize: "13px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Team Workload */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Workload
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {memberWorkload.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={memberWorkload} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(216 34% 17%)" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "hsl(215 16% 47%)", fontSize: 12 }}
                      tickFormatter={(v) => v.split(" ")[0]}
                    />
                    <YAxis tick={{ fill: "hsl(215 16% 47%)", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(224 71% 4%)",
                        border: "1px solid hsl(216 34% 17%)",
                        borderRadius: "8px",
                        fontSize: "13px",
                      }}
                    />
                    <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="inProgress" name="In Progress" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  No team workload data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Project Completion Rates
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.projectStats.length > 0 ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectData} layout="vertical" barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(216 34% 17%)" />
                  <XAxis type="number" tick={{ fill: "hsl(215 16% 47%)", fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    tick={{ fill: "hsl(215 16% 47%)", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(224 71% 4%)",
                      border: "1px solid hsl(216 34% 17%)",
                      borderRadius: "8px",
                      fontSize: "13px",
                    }}
                  />
                  <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="total" name="Total" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
              No project data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Per-member Workload Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Individual Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {memberWorkload.map((member) => {
              const rate = member.tasks > 0 ? Math.round((member.completed / member.tasks) * 100) : 0;
              return (
                <div key={member.name} className="flex items-center gap-4">
                  <div className="w-32 truncate text-sm font-medium">{member.name}</div>
                  <div className="flex-1">
                    <Progress value={rate} />
                  </div>
                  <div className="text-sm text-muted-foreground w-20 text-right">
                    {member.completed}/{member.tasks} ({rate}%)
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
