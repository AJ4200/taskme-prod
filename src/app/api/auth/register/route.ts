import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "~/server/db";
import { env } from "~/env";

export async function POST(request: Request) {
  try {
    const { username, email, password } = (await request.json()) as {
      username?: string;
      email?: string;
      password?: string;
    };

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Username, email and password are required" },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    const token = jwt.sign({ userId: result.id }, env.JWT_SECRET, {
      expiresIn: "29d",
    });

    return NextResponse.json({ token, user: result }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
