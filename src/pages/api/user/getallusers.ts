import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "~/server/db";

// GET /api/user/getallusers
export default async function handleGetAllUsers(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const allUsers = await db.user.findMany();

    return res.status(200).json(allUsers);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
