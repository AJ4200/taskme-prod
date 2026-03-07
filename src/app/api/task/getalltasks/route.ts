import { NextResponse } from "next/server";
import { db } from "~/server/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get("ownerId") ?? undefined;
    const assigneeId = searchParams.get("assigneeId") ?? undefined;

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
