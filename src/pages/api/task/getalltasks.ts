import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "~/server/db";

export default async function handleGetAllTasks(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const ownerId = req.query.ownerId as string;
    const assigneeId = req.query.assigneeId as string;

    // Fetch tasks by ownerId and/or assigneeId if provided
    const tasks = await db.task.findMany({
      where: {
        ownerId: ownerId ? ownerId : undefined,
        assigneeId: assigneeId ? assigneeId : undefined,
      },
    });

    return res.status(200).json(tasks);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
