"use server";

import { db } from "~/server/db";

interface UserActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function getAllUsersAction(): Promise<UserActionResult<any[]>> {
  try {
    const users = await db.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
      },
      orderBy: { username: "asc" },
    });

    return { success: true, data: users };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to load users" };
  }
}

export async function getUserByIdAction(
  userId: string,
): Promise<UserActionResult<any>> {
  try {
    if (!userId) {
      return { success: false, error: "userId is required" };
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    return { success: true, data: user };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to load user" };
  }
}

export async function getUserByUsernameAction(
  username: string,
): Promise<UserActionResult<any>> {
  try {
    const normalizedUsername = username?.trim();

    if (!normalizedUsername) {
      return { success: false, error: "username is required" };
    }

    const user = await db.user.findUnique({
      where: { username: normalizedUsername },
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    return { success: true, data: user };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to load user" };
  }
}
