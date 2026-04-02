"use server";

import type { ConnectionStatus, NotificationType } from "@prisma/client";
import { db } from "~/server/db";

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface CreateNotificationInput {
  userId: string;
  type?: NotificationType;
  title: string;
  body?: string;
  link?: string;
}

interface SendMessageInput {
  senderId: string;
  recipientId: string;
  content: string;
}

const hasMessageDelegate = () => Boolean(db.message?.findMany);

export async function createNotificationAction(
  input: CreateNotificationInput,
): Promise<ActionResult<any>> {
  try {
    const userId = input.userId?.trim();
    const title = input.title?.trim();
    if (!userId || !title) {
      return { success: false, error: "userId and title are required" };
    }

    const notification = await db.notification.create({
      data: {
        userId,
        type: input.type ?? "SYSTEM",
        title,
        body: input.body?.trim() || undefined,
        link: input.link?.trim() || undefined,
      },
    });

    return { success: true, data: notification };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to create notification" };
  }
}

export async function listNotificationsAction(
  userId: string,
  unreadOnly = false,
): Promise<ActionResult<any[]>> {
  try {
    if (!userId) {
      return { success: false, error: "userId is required" };
    }

    const notifications = await db.notification.findMany({
      where: {
        userId,
        isRead: unreadOnly ? false : undefined,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return { success: true, data: notifications };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to load notifications" };
  }
}

export async function markNotificationReadAction(
  userId: string,
  notificationId: string,
): Promise<ActionResult<any>> {
  try {
    if (!userId || !notificationId) {
      return { success: false, error: "userId and notificationId are required" };
    }

    const updated = await db.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: { isRead: true },
    });

    return { success: true, data: updated };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to mark notification read" };
  }
}

export async function markAllNotificationsReadAction(
  userId: string,
): Promise<ActionResult<any>> {
  try {
    if (!userId) return { success: false, error: "userId is required" };

    const updated = await db.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { success: true, data: updated };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to mark notifications read" };
  }
}

export async function sendMessageAction(
  input: SendMessageInput,
): Promise<ActionResult<any>> {
  try {
    const senderId = input.senderId?.trim();
    const recipientId = input.recipientId?.trim();
    const content = input.content?.trim();

    if (!senderId || !recipientId || !content) {
      return { success: false, error: "senderId, recipientId and content are required" };
    }

    if (senderId === recipientId) {
      return { success: false, error: "You cannot message yourself" };
    }

    const friendship = await db.friendship.findFirst({
      where: {
        status: "ACCEPTED" satisfies ConnectionStatus,
        OR: [
          { requesterId: senderId, addresseeId: recipientId },
          { requesterId: recipientId, addresseeId: senderId },
        ],
      },
      select: { id: true },
    });

    if (!friendship) {
      return { success: false, error: "You can only message accepted friends" };
    }

    let message: {
      id: string;
      senderId: string;
      recipientId: string;
      content: string;
      sender: { id: string; username: string };
    };

    if (hasMessageDelegate()) {
      const created = await db.message.create({
        data: {
          senderId,
          recipientId,
          content,
        },
        include: {
          sender: { select: { id: true, username: true } },
          recipient: { select: { id: true, username: true } },
        },
      });
      message = {
        id: created.id,
        senderId: created.senderId,
        recipientId: created.recipientId,
        content: created.content,
        sender: created.sender,
      };
    } else {
      const insertedId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await db.$executeRawUnsafe(
        'INSERT INTO "Message" (id, senderId, recipientId, content, isRead, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
        insertedId,
        senderId,
        recipientId,
        content,
        false,
      );

      const senderRows = await db.$queryRawUnsafe<Array<{ id: string; username: string }>>(
        'SELECT id, username FROM "User" WHERE id = ? LIMIT 1',
        senderId,
      );
      message = {
        id: insertedId,
        senderId,
        recipientId,
        content,
        sender: senderRows[0] ?? { id: senderId, username: "Friend" },
      };
    }

    await createNotificationAction({
      userId: recipientId,
      type: "MESSAGE" satisfies NotificationType,
      title: `New message from ${message.sender.username}`,
      body: content.length > 90 ? `${content.slice(0, 90)}...` : content,
      link: "/tasks",
    });

    return { success: true, data: message };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to send message" };
  }
}

export async function listConversationAction(
  userId: string,
  friendId: string,
): Promise<ActionResult<any[]>> {
  try {
    if (!userId || !friendId) {
      return { success: false, error: "userId and friendId are required" };
    }

    if (hasMessageDelegate()) {
      const messages = await db.message.findMany({
        where: {
          OR: [
            { senderId: userId, recipientId: friendId },
            { senderId: friendId, recipientId: userId },
          ],
        },
        orderBy: { createdAt: "asc" },
        take: 300,
        include: {
          sender: { select: { id: true, username: true } },
          recipient: { select: { id: true, username: true } },
        },
      });

      await db.message.updateMany({
        where: {
          senderId: friendId,
          recipientId: userId,
          isRead: false,
        },
        data: { isRead: true },
      });

      return { success: true, data: messages };
    }

    const rows = await db.$queryRawUnsafe<
      Array<{
        id: string;
        senderId: string;
        recipientId: string;
        content: string;
        createdAt: string;
        senderUsername: string;
      }>
    >(
      'SELECT m.id, m.senderId, m.recipientId, m.content, m.createdAt, u.username as senderUsername FROM "Message" m JOIN "User" u ON u.id = m.senderId WHERE (m.senderId = ? AND m.recipientId = ?) OR (m.senderId = ? AND m.recipientId = ?) ORDER BY m.createdAt ASC LIMIT 300',
      userId,
      friendId,
      friendId,
      userId,
    );

    await db.$executeRawUnsafe(
      'UPDATE "Message" SET isRead = ?, updatedAt = CURRENT_TIMESTAMP WHERE senderId = ? AND recipientId = ? AND isRead = ?',
      true,
      friendId,
      userId,
      false,
    );

    return {
      success: true,
      data: rows.map((row) => ({
        id: row.id,
        senderId: row.senderId,
        recipientId: row.recipientId,
        content: row.content,
        createdAt: row.createdAt,
        sender: { username: row.senderUsername },
      })),
    };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to load conversation" };
  }
}
