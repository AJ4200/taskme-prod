import { NextResponse } from "next/server";
import type { TaskPriority, TaskStatus } from "@prisma/client";
import { db } from "~/server/db";

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");
    const { title, status, priority, dueDate, ownerId, assigneeId } =
      (await request.json()) as {
        title?: string;
        status?: TaskStatus;
        priority?: TaskPriority;
        dueDate?: string;
        ownerId?: string;
        assigneeId?: string;
      };

    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    const updatedTask = await db.task.update({
      where: { id: taskId },
      data: {
        title,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        ownerId,
        assigneeId,
      },
    });

    return NextResponse.json(updatedTask, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
