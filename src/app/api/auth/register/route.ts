import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Prisma } from "@prisma/client";
import { db } from "~/server/db";
import { env } from "~/env";

export async function POST(request: Request) {
  try {
    const { username, email, password } = (await request.json()) as {
      username?: string;
      email?: string;
      password?: string;
    };

    const normalizedUsername = username?.trim();
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedUsername || !normalizedEmail || !password) {
      return NextResponse.json(
        { error: "Username, email and password are required" },
        { status: 400 },
      );
    }

    const existingUser = await db.user.findFirst({
      where: {
        OR: [{ username: normalizedUsername }, { email: normalizedEmail }],
      },
      select: { username: true, email: true },
    });

    if (existingUser) {
      if (existingUser.username === normalizedUsername) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 409 },
        );
      }

      return NextResponse.json(
        { error: "Email is already registered" },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.user.create({
      data: {
        username: normalizedUsername,
        email: normalizedEmail,
        password: hashedPassword,
      },
    });

    const token = jwt.sign({ userId: result.id }, env.JWT_SECRET, {
      expiresIn: "29d",
    });

    return NextResponse.json({ token, user: result }, { status: 201 });
  } catch (error) {
    console.error(error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Username or email already exists" },
        { status: 409 },
      );
    }

    const message =
      env.NODE_ENV === "development" && error instanceof Error
        ? error.message
        : "Internal Server Error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
