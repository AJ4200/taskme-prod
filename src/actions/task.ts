"use server";

import type { NotificationType, TaskPriority, TaskStatus } from "@prisma/client";
import { db } from "~/server/db";
import { createNotificationAction } from "./social";

interface TaskPayload {
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | Date;
  ownerId: string;
  assigneeId?: string;
}

interface TaskActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const taskInclude = {
  owner: {
    select: {
      id: true,
      username: true,
      email: true,
    },
  },
  assignee: {
    select: {
      id: true,
      username: true,
      email: true,
    },
  },
  goalLinks: {
    include: {
      goal: {
        select: {
          id: true,
          title: true,
          status: true,
          progress: true,
        },
      },
    },
  },
} as const;

export async function getAllTasksAction(
  ownerId?: string,
  assigneeId?: string,
): Promise<TaskActionResult<any[]>> {
  try {
    const tasks = await db.task.findMany({
      where: {
        ownerId: ownerId || undefined,
        assigneeId: assigneeId || undefined,
      },
      include: taskInclude,
      orderBy: { dueDate: "asc" },
    });

    return { success: true, data: tasks };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to load tasks" };
  }
}

export async function getTaskAction(
  taskId: string,
): Promise<TaskActionResult<any>> {
  try {
    const task = await db.task.findUnique({
      where: { id: taskId },
      include: taskInclude,
    });

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    return { success: true, data: task };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to load task" };
  }
}

export async function createTaskAction(
  taskData: TaskPayload,
): Promise<TaskActionResult<any>> {
  try {
    const { title, status, priority, dueDate, ownerId, assigneeId } = taskData;

    if (!title || !status || !priority || !dueDate || !ownerId) {
      return { success: false, error: "All fields are required" };
    }

    const createdTask = await db.task.create({
      data: {
        title,
        status,
        priority,
        dueDate: new Date(dueDate),
        ownerId,
        assigneeId: assigneeId ?? ownerId,
      },
      include: taskInclude,
    });

    if (createdTask.assigneeId && createdTask.assigneeId !== createdTask.ownerId) {
      await createNotificationAction({
        userId: createdTask.assigneeId,
        type: "TASK_ASSIGNED" satisfies NotificationType,
        title: "New task assigned",
        body: `"${createdTask.title}" has been assigned to you.`,
        link: "/tasks",
      });
    }

    return { success: true, data: createdTask };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to create task" };
  }
}

export async function updateTaskAction(
  taskId: string,
  taskData: Partial<TaskPayload>,
): Promise<TaskActionResult<any>> {
  try {
    if (!taskId) {
      return { success: false, error: "taskId is required" };
    }

    const existingTask = await db.task.findUnique({
      where: { id: taskId },
      select: { title: true, assigneeId: true, ownerId: true },
    });

    if (!existingTask) {
      return { success: false, error: "Task not found" };
    }

    const updatedTask = await db.task.update({
      where: { id: taskId },
      data: {
        title: taskData.title,
        status: taskData.status,
        priority: taskData.priority,
        dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined,
        ownerId: taskData.ownerId,
        assigneeId: taskData.assigneeId,
      },
      include: taskInclude,
    });

    if (
      taskData.assigneeId &&
      taskData.assigneeId !== existingTask.assigneeId &&
      taskData.assigneeId !== existingTask.ownerId
    ) {
      await createNotificationAction({
        userId: taskData.assigneeId,
        type: "TASK_ASSIGNED" satisfies NotificationType,
        title: "Task assigned to you",
        body: `"${updatedTask.title}" has been assigned to you.`,
        link: "/tasks",
      });
    } else if (
      updatedTask.assigneeId &&
      updatedTask.assigneeId !== updatedTask.ownerId &&
      (taskData.status !== undefined ||
        taskData.priority !== undefined ||
        taskData.dueDate !== undefined)
    ) {
      await createNotificationAction({
        userId: updatedTask.assigneeId,
        type: "TASK_UPDATED" satisfies NotificationType,
        title: "Assigned task updated",
        body: `Task "${updatedTask.title}" has new updates.`,
        link: "/tasks",
      });
    }

    return { success: true, data: updatedTask };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to update task" };
  }
}

export async function deleteTaskAction(
  taskId: string,
): Promise<TaskActionResult<null>> {
  try {
    if (!taskId) {
      return { success: false, error: "taskId is required" };
    }

    await db.task.delete({ where: { id: taskId } });
    return { success: true, data: null };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to delete task" };
  }
}
