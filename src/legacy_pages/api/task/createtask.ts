import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "~/server/db";

export default async function handleCreateTask(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const { title, status, priority, dueDate, ownerId, assigneeId } = req.body;

    // Validate required fields
    if (!title || !status || !priority || !dueDate || !ownerId || !assigneeId) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const result = await db.task.create({
      data: {
        title,
        status,
        priority,
        dueDate: new Date(dueDate as Date),
        ownerId,
        assigneeId,
      },
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
