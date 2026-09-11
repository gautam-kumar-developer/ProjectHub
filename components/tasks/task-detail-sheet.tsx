"use client";

import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Select, SelectOption } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  formatRelativeDate,
  getInitials,
} from "@/lib/utils";
import {
  updateTask,
  deleteTask,
  addComment,
  addSubtask,
  toggleSubtask,
  deleteSubtask,
} from "@/lib/actions";
import { canAttempt } from "@/lib/rbac";
import {
  Calendar,
  MessageSquare,
  CheckSquare,
  Plus,
  Trash2,
  Send,
  Square,
  CheckSquare2,
  Lock,
} from "lucide-react";

interface TaskDetailSheetProps {
  task: any;
  members: any[];
  currentUserId: string;
  currentUserRole: string;
  open: boolean;
  onClose: () => void;
}

export function TaskDetailSheet({
  task,
  members,
  currentUserId,
  currentUserRole,
  open,
  onClose,
}: TaskDetailSheetProps) {
  const [status, setStatus] = React.useState(task.status);
  const [priority, setPriority] = React.useState(task.priority);
  const [assigneeId, setAssigneeId] = React.useState(task.assigneeId || "");
  const [comment, setComment] = React.useState("");
  const [subtaskTitle, setSubtaskTitle] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  const subtasks = task.subtasks || [];
  const comments = task.comments || [];
  const completedSubtasks = subtasks.filter((s: any) => s.isCompleted).length;
  const subtaskProgress = subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;
  const priorityConfig = PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG];

  // RBAC checks
  const isOwnTask = task.assigneeId === currentUserId;
  const canManageProject = canAttempt(currentUserRole, "MANAGE_PROJECT");
  const canAssign = canAttempt(currentUserRole, "ASSIGN_TASK");
  const canUpdateStatus = canAttempt(currentUserRole, "UPDATE_OWN_TASK");
  const canEditFields = isOwnTask || canManageProject;
  const canDeleteThisTask = canManageProject;
  const isQA = currentUserRole === "QA";

  const canReview = canAttempt(currentUserRole, "REVIEW_CODE");
  const canQA = canAttempt(currentUserRole, "QA_TASK");
  const canApprove = canAttempt(currentUserRole, "APPROVE_TASK");

  async function handleStatusChange(newStatus: string) {
    setStatus(newStatus);
    setError("");
    try {
      await updateTask(task.id, { status: newStatus });
    } catch (err: any) {
      setError(err.message || "Permission denied");
      setStatus(task.status); // revert
    }
  }

  async function handlePriorityChange(newPriority: string) {
    setPriority(newPriority);
    setError("");
    try {
      await updateTask(task.id, { priority: newPriority });
    } catch (err: any) {
      setError(err.message || "Permission denied");
      setPriority(task.priority); // revert
    }
  }

  async function handleAssigneeChange(newAssigneeId: string) {
    setAssigneeId(newAssigneeId);
    setError("");
    try {
      await updateTask(task.id, { assigneeId: newAssigneeId || null });
    } catch (err: any) {
      setError(err.message || "Permission denied");
      setAssigneeId(task.assigneeId || ""); // revert
    }
  }

  async function handleAddComment() {
    if (!comment.trim()) return;
    setSaving(true);
    try {
      await addComment({ content: comment, taskId: task.id });
      setComment("");
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  }

  async function handleAddSubtask() {
    if (!subtaskTitle.trim()) return;
    try {
      await addSubtask({ title: subtaskTitle, taskId: task.id });
      setSubtaskTitle("");
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete() {
    if (confirm("Delete this task?")) {
      try {
        await deleteTask(task.id);
        onClose();
      } catch (err: any) {
        setError(err.message || "Permission denied");
      }
    }
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent onClose={onClose} className="overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-2 mb-2 pr-8">
            <Badge className={priorityConfig?.color || ""} variant="outline">
              {priorityConfig?.label || priority}
            </Badge>
            <Badge variant="secondary">
              {STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label || status}
            </Badge>
          </div>
          <SheetTitle className="text-xl pr-8">{task.title}</SheetTitle>
          {task.description && (
            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
          )}

          {/* RBAC Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            {status === "IN_PROGRESS" && canReview && (
              <Button size="sm" onClick={() => handleStatusChange("REVIEW")} className="bg-blue-600 hover:bg-blue-700">
                <CheckSquare className="h-4 w-4 mr-2" />
                Submit for Review
              </Button>
            )}
            {status === "REVIEW" && canQA && (
              <Button size="sm" onClick={() => handleStatusChange("DONE")} className="bg-purple-600 hover:bg-purple-700">
                <CheckSquare2 className="h-4 w-4 mr-2" />
                QA Pass
              </Button>
            )}
            {status === "REVIEW" && canApprove && !isQA && (
              <Button size="sm" onClick={() => handleStatusChange("DONE")} className="bg-emerald-600 hover:bg-emerald-700">
                <CheckSquare2 className="h-4 w-4 mr-2" />
                Approve Task
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="space-y-6 p-6 pt-2">
          {/* Permission Error */}
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive flex items-center gap-2">
              <Lock className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Properties */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase">Status</label>
              {canUpdateStatus ? (
                <Select value={status} onValueChange={handleStatusChange}>
                  <SelectOption value="TODO">To Do</SelectOption>
                  <SelectOption value="IN_PROGRESS">In Progress</SelectOption>
                  <SelectOption value="REVIEW">Review</SelectOption>
                  <SelectOption value="DONE">Done</SelectOption>
                </Select>
              ) : (
                <Badge variant="secondary">
                  {STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label || status}
                </Badge>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase">Priority</label>
              {canEditFields && !isQA ? (
                <Select value={priority} onValueChange={handlePriorityChange}>
                  <SelectOption value="LOW">Low</SelectOption>
                  <SelectOption value="MEDIUM">Medium</SelectOption>
                  <SelectOption value="HIGH">High</SelectOption>
                  <SelectOption value="URGENT">Urgent</SelectOption>
                </Select>
              ) : (
                <Badge className={priorityConfig?.color || ""} variant="outline">
                  {priorityConfig?.label || priority}
                </Badge>
              )}
            </div>
          </div>

          {/* Assignee */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase">Assignee</label>
            {canAssign ? (
              <Select value={assigneeId} onValueChange={handleAssigneeChange}>
                <SelectOption value="">Unassigned</SelectOption>
                {members.map((m: any) => (
                  <SelectOption key={m.user.id} value={m.user.id}>
                    {m.user.name}
                  </SelectOption>
                ))}
              </Select>
            ) : (
              <div className="flex items-center gap-2 py-1">
                {task.assignee ? (
                  <>
                    <Avatar
                      src={task.assignee.image}
                      fallback={getInitials(task.assignee.name)}
                      size="sm"
                    />
                    <span className="text-sm">{task.assignee.name}</span>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">Unassigned</span>
                )}
              </div>
            )}
          </div>

          {/* Due Date */}
          {task.dueDate && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Due:</span>
              <span>{new Date(task.dueDate).toLocaleDateString()}</span>
            </div>
          )}

          {/* Subtasks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Subtasks
                {subtasks.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({completedSubtasks}/{subtasks.length})
                  </span>
                )}
              </h4>
            </div>

            {subtasks.length > 0 && (
              <Progress value={subtaskProgress} className="h-1.5" />
            )}

            <div className="space-y-1">
              {subtasks.map((subtask: any) => (
                <div
                  key={subtask.id}
                  className="flex items-center gap-2 group py-1 px-2 rounded-md hover:bg-muted/50"
                >
                  <button
                    onClick={() => toggleSubtask(subtask.id)}
                    className="shrink-0 cursor-pointer"
                  >
                    {subtask.isCompleted ? (
                      <CheckSquare2 className="h-4 w-4 text-primary" />
                    ) : (
                      <Square className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  <span
                    className={`text-sm flex-1 ${
                      subtask.isCompleted ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    {subtask.title}
                  </span>
                  {canEditFields && (
                    <button
                      onClick={() => deleteSubtask(subtask.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {canEditFields && (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Add subtask..."
                  value={subtaskTitle}
                  onChange={(e) => setSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
                  className="text-sm h-8"
                />
                <Button size="sm" variant="outline" onClick={handleAddSubtask} disabled={!subtaskTitle.trim()}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comments
              {comments.length > 0 && (
                <span className="text-xs text-muted-foreground">({comments.length})</span>
              )}
            </h4>

            {/* Add Comment — all roles can comment */}
            <div className="flex items-start gap-2">
              <Textarea
                placeholder="Write a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="text-sm min-h-[60px]"
              />
              <Button
                size="icon"
                onClick={handleAddComment}
                disabled={saving || !comment.trim()}
                className="shrink-0 mt-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {/* Comment List */}
            <div className="space-y-3">
              {comments.map((c: any) => (
                <div key={c.id} className="flex items-start gap-2.5">
                  <Avatar
                    src={c.author?.image}
                    fallback={getInitials(c.author?.name || "U")}
                    size="sm"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{c.author?.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeDate(c.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delete */}
          {canDeleteThisTask && (
            <div className="pt-4 border-t border-border">
              <Button variant="destructive" size="sm" onClick={handleDelete} className="w-full">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Task
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
