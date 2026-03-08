"use server";

import { db } from "~/server/db";

interface TaskPayload {
  title: string;
  status: string;
  priority: string;
  dueDate: string | Date;
  ownerId: string;
  assigneeId?: string;
}

interface TaskActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

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
    const task = await db.task.findUnique({ where: { id: taskId } });

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
    });

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
    });

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
