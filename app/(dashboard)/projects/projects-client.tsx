"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectOption } from "@/components/ui/select";
import {
  Plus,
  Search,
  FolderKanban,
  Calendar,
  MoreHorizontal,
  ArrowUpRight,
} from "lucide-react";
import { PROJECT_STATUS_CONFIG, formatDate } from "@/lib/utils";
import { createProject } from "@/lib/actions";

interface ProjectsClientProps {
  projects: any[];
  workspaceId: string;
}

export function ProjectsClient({ projects, workspaceId }: ProjectsClientProps) {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [showCreate, setShowCreate] = React.useState(false);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [status, setStatus] = React.useState("ACTIVE");
  const [color, setColor] = React.useState("#6366f1");
  const [creating, setCreating] = React.useState(false);

  const colors = [
    "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
    "#f97316", "#eab308", "#22c55e", "#06b6d4",
  ];

  const filtered = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  async function handleCreate() {
    if (!name.trim()) return;
    setCreating(true);
    try {
      await createProject(workspaceId, { name, description, status, color });
      setShowCreate(false);
      setName("");
      setDescription("");
    } catch (err) {
      console.error(err);
    }
    setCreating(false);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-muted-foreground mt-1">
            {projects.length} project{projects.length !== 1 ? "s" : ""} in your workspace
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectOption value="ALL">All Status</SelectOption>
          <SelectOption value="PLANNING">Planning</SelectOption>
          <SelectOption value="ACTIVE">Active</SelectOption>
          <SelectOption value="ON_HOLD">On Hold</SelectOption>
          <SelectOption value="COMPLETED">Completed</SelectOption>
        </Select>
      </div>

      {/* Project Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FolderKanban className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">No projects found</h3>
          <p className="text-muted-foreground mt-1">
            {search || statusFilter !== "ALL"
              ? "Try adjusting your filters"
              : "Create your first project to get started"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => {
            const totalTasks = project.tasks?.length || 0;
            const doneTasks = project.tasks?.filter((t: any) => t.status === "DONE").length || 0;
            const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
            const statusConfig =
              PROJECT_STATUS_CONFIG[project.status as keyof typeof PROJECT_STATUS_CONFIG];

            return (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="group hover:shadow-lg hover:border-primary/30 transition-all duration-200 cursor-pointer h-full">
                  <CardContent className="p-5">
                    {/* Color Bar */}
                    <div
                      className="h-1.5 w-12 rounded-full mb-4"
                      style={{ backgroundColor: project.color }}
                    />

                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
                          {project.name}
                        </h3>
                        {project.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {project.description}
                          </p>
                        )}
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    {/* Status Badge */}
                    <Badge className={statusConfig?.color || ""} variant="secondary">
                      {statusConfig?.label || project.status}
                    </Badge>

                    {/* Progress */}
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <Progress value={progress} />
                      <p className="text-xs text-muted-foreground">
                        {doneTasks} of {totalTasks} tasks completed
                      </p>
                    </div>

                    {/* Footer */}
                    {project.targetDate && (
                      <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Due {formatDate(project.targetDate)}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Create Project Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent onClose={() => setShowCreate(false)}>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Project Name</label>
              <Input
                placeholder="e.g., Website Redesign"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                placeholder="Brief project description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectOption value="PLANNING">Planning</SelectOption>
                <SelectOption value="ACTIVE">Active</SelectOption>
                <SelectOption value="ON_HOLD">On Hold</SelectOption>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Color</label>
              <div className="flex gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`h-8 w-8 rounded-full transition-all cursor-pointer ${
                      color === c ? "ring-2 ring-offset-2 ring-primary ring-offset-background scale-110" : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating || !name.trim()}>
              {creating ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
