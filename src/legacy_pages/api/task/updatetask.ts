import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "~/server/db";

export default async function handleUpdateTask(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const taskId = req.query.taskId as string;
    const { title, status, priority, dueDate, ownerId, assigneeId } = req.body;

    const updatedTask = await db.task.update({
      where: { id: taskId },
      data: {
        title,
        status,
        priority,
        dueDate: new Date(dueDate as Date),
        ownerId,
        assigneeId,
      },
    });

    return res.status(200).json(updatedTask);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
