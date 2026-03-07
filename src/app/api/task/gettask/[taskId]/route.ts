import { NextResponse } from "next/server";
import { db } from "~/server/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const { taskId } = await params;
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get("ownerId") ?? undefined;
    const assigneeId = searchParams.get("assigneeId") ?? undefined;

    if (taskId) {
      const task = await db.task.findUnique({ where: { id: taskId } });

      if (!task) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }

      return NextResponse.json(task, { status: 200 });
    }

    const tasks = await db.task.findMany({
      where: {
        ownerId,
        assigneeId,
      },
    });

    return NextResponse.json(tasks, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
