import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "~/server/db";

// GET /api/user/getuserbyid/[userId]
export default async function handleGetUserById(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const userId = req.query.userId as string;

    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
