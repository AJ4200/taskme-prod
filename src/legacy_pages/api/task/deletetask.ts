import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "~/server/db";

export default async function handleDeleteTask(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const taskId = req.query.taskId as string;

    await db.task.delete({
      where: { id: taskId },
    });

    return res.status(204).end();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
