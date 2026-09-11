"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  id: string;
  title: string;
  count: number;
  color: string;
  children: React.ReactNode;
}

export function KanbanColumn({ id, title, count, color, children }: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-xl bg-muted/30 border border-border transition-all duration-200 min-h-[400px]",
        isOver && "border-primary/50 bg-primary/5 shadow-sm"
      )}
    >
      {/* Column Header */}
      <div className="flex items-center gap-2 p-3 pb-2">
        <div className={cn("h-2.5 w-2.5 rounded-full", color)} />
        <span className="text-sm font-semibold">{title}</span>
        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
          {count}
        </span>
      </div>

      {/* Task List */}
      <div className="flex-1 space-y-2 p-2 pt-0 overflow-y-auto">
        {children}
        {count === 0 && (
          <div className="flex items-center justify-center h-24 text-xs text-muted-foreground border border-dashed border-border rounded-lg">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}
