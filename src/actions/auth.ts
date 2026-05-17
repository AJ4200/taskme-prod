"use server";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
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



interface GoogleSignInInput {
  credential: string;
}

function slugifyUsername(seed: string): string {
  const base = seed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 18);
  return base || "user";
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


export async function googleSignInAction(
  input: GoogleSignInInput,
): Promise<AuthActionResult> {
  try {
    const credential = input.credential?.trim();
    if (!credential) {
      return { success: false, status: 400, error: "Google credential is required" };
    }

    const verifyResponse = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
      { cache: "no-store" },
    );

    if (!verifyResponse.ok) {
      return { success: false, status: 401, error: "Invalid Google token" };
    }

    const payload = (await verifyResponse.json()) as {
      aud?: string;
      email?: string;
      email_verified?: string;
      name?: string;
    };

    if (payload.aud !== env.GOOGLE_CLIENT_ID) {
      return { success: false, status: 401, error: "Google token audience mismatch" };
    }

    const email = payload.email?.toLowerCase();

    if (!email || payload.email_verified !== "true") {
      return { success: false, status: 401, error: "Google account email is not verified" };
    }

    const nameSeed = payload.name ?? email.split("@")[0] ?? "user";

    let user = await db.user.findUnique({ where: { email } });

    if (!user) {
      const base = slugifyUsername(nameSeed);
      let username = base;
      let i = 0;
      while (await db.user.findUnique({ where: { username } })) {
        i += 1;
        username = `${base}_${i}`;
      }

      const generatedPassword = await bcrypt.hash(crypto.randomUUID(), 10);
      user = await db.user.create({
        data: {
          email,
          username,
          password: generatedPassword,
        },
      });
    }

    const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, { expiresIn: "1d" });

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
        : "Google sign-in failed";

    return { success: false, status: 500, error: message };
  }
}
