"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { cn, PRIORITY_CONFIG, formatDate, getInitials } from "@/lib/utils";
import { Calendar, MessageSquare, CheckSquare, GripVertical } from "lucide-react";

interface TaskCardProps {
  task: any;
  onClick: () => void;
  isDragOverlay?: boolean;
}

export function TaskCard({ task, onClick, isDragOverlay }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityConfig = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG];
  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s: any) => s.isCompleted).length;
  const commentCount = task.comments?.length || 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        "group rounded-lg border border-border bg-card p-3 shadow-sm transition-all duration-200 cursor-pointer",
        isDragging && "opacity-50 shadow-lg scale-105",
        isDragOverlay && "shadow-xl scale-105 rotate-2 border-primary/50",
        !isDragging && !isDragOverlay && "hover:shadow-md hover:border-primary/20"
      )}
      onClick={(e) => {
        if (!(e.target as HTMLElement).closest("[data-drag-handle]")) {
          onClick();
        }
      }}
    >
      {/* Drag Handle + Priority */}
      <div className="flex items-center justify-between mb-2">
        <Badge className={cn("text-[10px]", priorityConfig?.color || "")} variant="outline">
          {priorityConfig?.label || task.priority}
        </Badge>
        <div
          {...listeners}
          data-drag-handle
          className="cursor-grab opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
        >
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>

      {/* Title */}
      <h4 className="text-sm font-medium leading-snug mb-2 line-clamp-2">{task.title}</h4>

      {/* Tags */}
      {task.tags && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.split(",").map((tag: string) => (
            <span
              key={tag}
              className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
            >
              {tag.trim()}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {task.dueDate && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(task.dueDate)}
            </span>
          )}
          {subtasks.length > 0 && (
            <span className="flex items-center gap-1">
              <CheckSquare className="h-3 w-3" />
              {completedSubtasks}/{subtasks.length}
            </span>
          )}
          {commentCount > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {commentCount}
            </span>
          )}
        </div>
        {task.assignee && (
          <Avatar
            src={task.assignee.image}
            fallback={getInitials(task.assignee.name)}
            size="sm"
          />
        )}
      </div>
    </div>
  );
}
