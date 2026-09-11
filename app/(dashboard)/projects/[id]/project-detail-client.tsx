"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectOption } from "@/components/ui/select";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { TaskDetailSheet } from "@/components/tasks/task-detail-sheet";
import {
  ArrowLeft,
  Plus,
  Calendar,
  Users,
} from "lucide-react";
import {
  PROJECT_STATUS_CONFIG,
  PRIORITY_CONFIG,
  formatDate,
  getInitials,
} from "@/lib/utils";
import { createTask } from "@/lib/actions";

interface ProjectDetailClientProps {
  project: any;
  currentUserId: string;
}

export function ProjectDetailClient({ project, currentUserId }: ProjectDetailClientProps) {
  const [showCreateTask, setShowCreateTask] = React.useState(false);
  const [selectedTask, setSelectedTask] = React.useState<any>(null);
  const [taskTitle, setTaskTitle] = React.useState("");
  const [taskPriority, setTaskPriority] = React.useState("MEDIUM");
  const [taskStatus, setTaskStatus] = React.useState("TODO");
  const [taskAssigneeId, setTaskAssigneeId] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  const tasks = project.tasks || [];
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t: any) => t.status === "DONE").length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const members = project.workspace?.members || [];
  const statusConfig = PROJECT_STATUS_CONFIG[project.status as keyof typeof PROJECT_STATUS_CONFIG];

  async function handleCreateTask() {
    if (!taskTitle.trim()) return;
    setCreating(true);
    try {
      await createTask({
        title: taskTitle,
        projectId: project.id,
        priority: taskPriority,
        status: taskStatus,
        assigneeId: taskAssigneeId || null,
      });
      setShowCreateTask(false);
      setTaskTitle("");
      setTaskPriority("MEDIUM");
      setTaskStatus("TODO");
      setTaskAssigneeId("");
    } catch (err) {
      console.error(err);
    }
    setCreating(false);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/projects" className="hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Projects
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{project.name}</span>
      </div>

      {/* Project Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 rounded-sm" style={{ backgroundColor: project.color }} />
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <Badge className={statusConfig?.color || ""} variant="secondary">
              {statusConfig?.label || project.status}
            </Badge>
          </div>
          {project.description && (
            <p className="text-muted-foreground max-w-xl">{project.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {project.targetDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Due {formatDate(project.targetDate)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {members.length} members
            </span>
          </div>
        </div>
        <Button onClick={() => setShowCreateTask(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Overall Progress</span>
          <span className="font-medium">{progress}% · {doneTasks}/{totalTasks} tasks</span>
        </div>
        <Progress value={progress} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="board">
        <TabsList>
          <TabsTrigger value="board">Kanban Board</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        <TabsContent value="board">
          <KanbanBoard
            tasks={tasks}
            members={members}
            projectId={project.id}
            onTaskClick={(task: any) => setSelectedTask(task)}
          />
        </TabsContent>

        <TabsContent value="list">
          <div className="rounded-lg border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Task</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Priority</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Assignee</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No tasks yet. Create your first task to get started.
                    </td>
                  </tr>
                ) : (
                  tasks.map((task: any) => {
                    const priorityConfig = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG];
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
                          <Badge variant="secondary" className="text-xs">
                            {task.status.replace("_", " ")}
                          </Badge>
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
                            <span className="text-sm text-muted-foreground">Unassigned</span>
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

        <TabsContent value="members">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member: any) => {
              const memberTasks = tasks.filter((t: any) => t.assigneeId === member.user.id);
              return (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/30 transition-colors"
                >
                  <Avatar
                    src={member.user.image}
                    fallback={getInitials(member.user.name)}
                    size="lg"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{member.user.name}</p>
                    <p className="text-xs text-muted-foreground">{member.user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">{member.role}</Badge>
                      <span className="text-xs text-muted-foreground">{memberTasks.length} tasks</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Task Dialog */}
      <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
        <DialogContent onClose={() => setShowCreateTask(false)}>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Task Title</label>
              <Input
                placeholder="e.g., Design homepage mockup"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={taskStatus} onValueChange={setTaskStatus}>
                  <SelectOption value="TODO">To Do</SelectOption>
                  <SelectOption value="IN_PROGRESS">In Progress</SelectOption>
                  <SelectOption value="REVIEW">Review</SelectOption>
                  <SelectOption value="DONE">Done</SelectOption>
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
            {members.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Assignee</label>
                <Select value={taskAssigneeId} onValueChange={setTaskAssigneeId}>
                  <SelectOption value="">Unassigned</SelectOption>
                  {members.map((m: any) => (
                    <SelectOption key={m.user.id} value={m.user.id}>
                      {m.user.name}
                    </SelectOption>
                  ))}
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateTask(false)}>Cancel</Button>
            <Button onClick={handleCreateTask} disabled={creating || !taskTitle.trim()}>
              {creating ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Detail Sheet */}
      {selectedTask && (
        <TaskDetailSheet
          task={selectedTask}
          members={members}
          currentUserId={currentUserId}
          open={!!selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}
