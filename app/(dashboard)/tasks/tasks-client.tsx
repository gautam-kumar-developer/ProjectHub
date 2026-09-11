"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectOption } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { TaskDetailSheet } from "@/components/tasks/task-detail-sheet";
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Filter,
} from "lucide-react";
import { PRIORITY_CONFIG, STATUS_CONFIG, formatDate, getInitials } from "@/lib/utils";
import { createTask } from "@/lib/actions";
import { canAttempt } from "@/lib/rbac";

interface TasksClientProps {
  tasks: any[];
  projects: any[];
  members: any[];
  currentUserRole: string;
}

export function TasksClient({ tasks, projects, members, currentUserRole }: TasksClientProps) {
  const [search, setSearch] = React.useState("");
  const [priorityFilter, setPriorityFilter] = React.useState("ALL");
  const [projectFilter, setProjectFilter] = React.useState("ALL");
  const [selectedTask, setSelectedTask] = React.useState<any>(null);
  const [showCreate, setShowCreate] = React.useState(false);
  const [taskTitle, setTaskTitle] = React.useState("");
  const [taskProjectId, setTaskProjectId] = React.useState(projects[0]?.id || "");
  const [taskPriority, setTaskPriority] = React.useState("MEDIUM");
  const [taskStatus, setTaskStatus] = React.useState("TODO");
  const [creating, setCreating] = React.useState(false);

  const filtered = tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchesPriority = priorityFilter === "ALL" || t.priority === priorityFilter;
    const matchesProject = projectFilter === "ALL" || t.projectId === projectFilter;
    return matchesSearch && matchesPriority && matchesProject;
  });

  async function handleCreate() {
    if (!taskTitle.trim() || !taskProjectId) return;
    setCreating(true);
    try {
      await createTask({
        title: taskTitle,
        projectId: taskProjectId,
        priority: taskPriority,
        status: taskStatus,
      });
      setShowCreate(false);
      setTaskTitle("");
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
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-muted-foreground mt-1">
            {tasks.length} total tasks across all projects
          </p>
        </div>
        {canAttempt(currentUserRole, "CREATE_TASK") && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectOption value="ALL">All Priorities</SelectOption>
          <SelectOption value="URGENT">Urgent</SelectOption>
          <SelectOption value="HIGH">High</SelectOption>
          <SelectOption value="MEDIUM">Medium</SelectOption>
          <SelectOption value="LOW">Low</SelectOption>
        </Select>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectOption value="ALL">All Projects</SelectOption>
          {projects.map((p: any) => (
            <SelectOption key={p.id} value={p.id}>{p.name}</SelectOption>
          ))}
        </Select>
      </div>

      {/* Views */}
      <Tabs defaultValue="board">
        <TabsList>
          <TabsTrigger value="board">
            <LayoutGrid className="h-4 w-4 mr-1.5" />
            Board
          </TabsTrigger>
          <TabsTrigger value="list">
            <List className="h-4 w-4 mr-1.5" />
            List
          </TabsTrigger>
        </TabsList>

        <TabsContent value="board">
          {taskProjectId || projects[0]?.id ? (
            <KanbanBoard
              tasks={filtered}
              members={members}
              projectId={projects[0]?.id || ""}
              onTaskClick={(task) => setSelectedTask(task)}
            />
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              Create a project first to use the Kanban board
            </div>
          )}
        </TabsContent>

        <TabsContent value="list">
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Task</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Project</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Priority</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Assignee</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No tasks found
                    </td>
                  </tr>
                ) : (
                  filtered.map((task) => {
                    const priorityConfig = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG];
                    const statusConfig = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG];
                    return (
                      <tr
                        key={task.id}
                        className="border-b border-border hover:bg-muted/30 cursor-pointer transition-colors"
                        onClick={() => setSelectedTask(task)}
                      >
                        <td className="p-3">
                          <span className="font-medium text-sm">{task.title}</span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <div
                              className="h-2.5 w-2.5 rounded-sm"
                              style={{ backgroundColor: task.project?.color || "#6366f1" }}
                            />
                            <span className="text-sm text-muted-foreground">{task.project?.name}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <div className={`h-2 w-2 rounded-full ${statusConfig?.color || ""}`} />
                            <span className="text-sm">{statusConfig?.label || task.status}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge className={priorityConfig?.color || ""} variant="outline">
                            {priorityConfig?.label || task.priority}
                          </Badge>
                        </td>
                        <td className="p-3">
                          {task.assignee ? (
                            <div className="flex items-center gap-2">
                              <Avatar
                                src={task.assignee.image}
                                fallback={getInitials(task.assignee.name)}
                                size="sm"
                              />
                              <span className="text-sm">{task.assignee.name}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {task.dueDate ? formatDate(task.dueDate) : "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Task Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent onClose={() => setShowCreate(false)}>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Task Title</label>
              <Input
                placeholder="e.g., Fix login bug"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Project</label>
              <Select value={taskProjectId} onValueChange={setTaskProjectId}>
                {projects.map((p: any) => (
                  <SelectOption key={p.id} value={p.id}>{p.name}</SelectOption>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={taskStatus} onValueChange={setTaskStatus}>
                  <SelectOption value="TODO">To Do</SelectOption>
                  <SelectOption value="IN_PROGRESS">In Progress</SelectOption>
                  <SelectOption value="REVIEW">Review</SelectOption>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select value={taskPriority} onValueChange={setTaskPriority}>
                  <SelectOption value="LOW">Low</SelectOption>
                  <SelectOption value="MEDIUM">Medium</SelectOption>
                  <SelectOption value="HIGH">High</SelectOption>
                  <SelectOption value="URGENT">Urgent</SelectOption>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating || !taskTitle.trim()}>
              {creating ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Detail */}
      {selectedTask && (
        <TaskDetailSheet
          task={selectedTask}
          members={members}
          currentUserId=""
          currentUserRole={currentUserRole}
          open={!!selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}
