"use client";

import React from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { KanbanColumn } from "./kanban-column";
import { TaskCard } from "./task-card";
import { STATUS_CONFIG } from "@/lib/utils";
import { moveTask } from "@/lib/actions";

interface KanbanBoardProps {
  tasks: any[];
  members: any[];
  projectId: string;
  onTaskClick: (task: any) => void;
}

const COLUMNS = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"] as const;

export function KanbanBoard({ tasks, members, projectId, onTaskClick }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = React.useState<any>(null);
  const [localTasks, setLocalTasks] = React.useState(tasks);

  React.useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const getTasksByStatus = (status: string) =>
    localTasks
      .filter((t) => t.status === status)
      .sort((a, b) => a.orderIndex - b.orderIndex);

  function handleDragStart(event: DragStartEvent) {
    const task = localTasks.find((t) => t.id === event.active.id);
    setActiveTask(task || null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTaskItem = localTasks.find((t) => t.id === activeId);
    if (!activeTaskItem) return;

    // Determine target column
    let targetStatus: string;
    const overTask = localTasks.find((t) => t.id === overId);

    if (overTask) {
      targetStatus = overTask.status;
    } else if (COLUMNS.includes(overId as any)) {
      targetStatus = overId;
    } else {
      return;
    }

    if (activeTaskItem.status !== targetStatus) {
      setLocalTasks((prev) =>
        prev.map((t) =>
          t.id === activeId ? { ...t, status: targetStatus } : t
        )
      );
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const task = localTasks.find((t) => t.id === activeId);
    if (!task) return;

    // Determine final status
    let targetStatus = task.status;
    const overTask = localTasks.find((t) => t.id === overId);

    if (overTask) {
      targetStatus = overTask.status;
    } else if (COLUMNS.includes(overId as any)) {
      targetStatus = overId;
    }

    // Calculate new order index
    const columnTasks = localTasks
      .filter((t) => t.status === targetStatus && t.id !== activeId)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    let newOrderIndex: number;
    if (overTask && overTask.id !== activeId) {
      const overIndex = columnTasks.findIndex((t) => t.id === overId);
      if (overIndex === 0) {
        newOrderIndex = columnTasks[0].orderIndex - 1000;
      } else if (overIndex === columnTasks.length - 1) {
        newOrderIndex = columnTasks[overIndex].orderIndex + 1000;
      } else {
        newOrderIndex = Math.floor(
          (columnTasks[overIndex - 1].orderIndex + columnTasks[overIndex].orderIndex) / 2
        );
      }
    } else {
      newOrderIndex = columnTasks.length > 0
        ? columnTasks[columnTasks.length - 1].orderIndex + 1000
        : 1000;
    }

    // Optimistic update
    setLocalTasks((prev) =>
      prev.map((t) =>
        t.id === activeId
          ? { ...t, status: targetStatus, orderIndex: newOrderIndex }
          : t
      )
    );

    // Persist
    try {
      await moveTask(activeId, targetStatus, newOrderIndex);
    } catch (err) {
      console.error("Failed to move task:", err);
      setLocalTasks(tasks); // Revert on error
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-4 gap-4 mt-4">
        {COLUMNS.map((status) => {
          const columnTasks = getTasksByStatus(status);
          const config = STATUS_CONFIG[status];

          return (
            <KanbanColumn
              key={status}
              id={status}
              title={config.label}
              count={columnTasks.length}
              color={config.color}
            >
              <SortableContext
                items={columnTasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                {columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => onTaskClick(task)}
                  />
                ))}
              </SortableContext>
            </KanbanColumn>
          );
        })}
      </div>

      <DragOverlay>
        {activeTask && (
          <TaskCard task={activeTask} onClick={() => {}} isDragOverlay />
        )}
      </DragOverlay>
    </DndContext>
  );
}
