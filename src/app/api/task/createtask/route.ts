import { NextResponse } from "next/server";
import { db } from "~/server/db";

export async function POST(request: Request) {
  try {
    const { title, status, priority, dueDate, ownerId, assigneeId } =
      (await request.json()) as {
        title?: string;
        status?: string;
        priority?: string;
        dueDate?: string;
        ownerId?: string;
        assigneeId?: string;
      };

    if (!title || !status || !priority || !dueDate || !ownerId || !assigneeId) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const result = await db.task.create({
      data: {
        title,
        status,
        priority,
        dueDate: new Date(dueDate),
        ownerId,
        assigneeId,
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
