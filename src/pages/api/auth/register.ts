import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "~/server/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "~/env";

// POST /api/auth/register
const handleRegister = async (
  req: NextApiRequest,
  res: NextApiResponse,
) => {
  try {
    const { username, email, password } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ error: "Username, email and password are required" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in the database
    const result = await db.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    // Generate JWT token
    const token = jwt.sign({ userId: result.id }, env.JWT_SECRET, {
      expiresIn: "29d", // Set the expiration time as needed
    });

    // Send the token and user data back to the client
    return res.status(201).json({ token, user: result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export default handleRegister;
