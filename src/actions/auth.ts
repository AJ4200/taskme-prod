"use server";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Prisma } from "@prisma/client";
import { db } from "~/server/db";
import { env } from "~/env";

interface LoginInput {
  username: string;
  password: string;
}

interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

interface PublicUser {
  id: string;
  username: string;
  email: string;
}

interface AuthActionResult {
  success: boolean;
  status: number;
  error?: string;
  token?: string;
  user?: PublicUser;
}

export async function loginAction(input: LoginInput): Promise<AuthActionResult> {
  try {
    const username = input.username?.trim();
    const password = input.password;

    if (!username || !password) {
      return {
        success: false,
        status: 400,
        error: "Username and password are required",
      };
    }

    const user = await db.user.findUnique({ where: { username } });

    if (!user) {
      return { success: false, status: 404, error: "User not found" };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return { success: false, status: 401, error: "Invalid password" };
    }

    const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, {
      expiresIn: "1d",
    });

    return {
      success: true,
      status: 200,
      token,
      user: { id: user.id, username: user.username, email: user.email },
    };
  } catch (error) {
    console.error(error);

    const message =
      env.NODE_ENV === "development" && error instanceof Error
        ? error.message
        : "Internal Server Error";

    return { success: false, status: 500, error: message };
  }
}

export async function registerAction(
  input: RegisterInput,
): Promise<AuthActionResult> {
  try {
    const username = input.username?.trim();
    const email = input.email?.trim().toLowerCase();
    const password = input.password;

    if (!username || !email || !password) {
      return {
        success: false,
        status: 400,
        error: "Username, email and password are required",
      };
    }

    const existingUser = await db.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
      select: { username: true, email: true },
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return { success: false, status: 409, error: "Username is already taken" };
      }

      return { success: false, status: 409, error: "Email is already registered" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const createdUser = await db.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    const token = jwt.sign({ userId: createdUser.id }, env.JWT_SECRET, {
      expiresIn: "29d",
    });

    return {
      success: true,
      status: 201,
      token,
      user: {
        id: createdUser.id,
        username: createdUser.username,
        email: createdUser.email,
      },
    };
  } catch (error) {
    console.error(error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { success: false, status: 409, error: "Username or email already exists" };
    }

    const message =
      env.NODE_ENV === "development" && error instanceof Error
        ? error.message
        : "Internal Server Error";

    return { success: false, status: 500, error: message };
  }
}
