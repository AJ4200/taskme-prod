"use server";

import {
  type ConnectionStatus,
  type GoalCadence,
  type GoalStatus,
  type PartnershipKind,
  type PartnershipStatus,
  type TaskStatus,
} from "@prisma/client";
import { db } from "~/server/db";
import { createNotificationAction } from "./social";

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface SendFriendRequestInput {
  requesterId: string;
  addresseeId: string;
  message?: string;
}

interface RespondFriendRequestInput {
  friendshipId: string;
  responderId: string;
  accept: boolean;
}

interface FriendListItem {
  friendshipId: string;
  requesterId: string;
  addresseeId: string;
  isIncoming: boolean;
  status: ConnectionStatus;
  createdAt: Date;
  friend: {
    id: string;
    username: string;
    email: string;
  };
}

interface CreatePartnershipInput {
  initiatorId: string;
  partnerId: string;
  kind: PartnershipKind;
  notes?: string;
}

interface RespondPartnershipInput {
  partnershipId: string;
  responderId: string;
  accept: boolean;
}

interface CreateGoalInput {
  title: string;
  description?: string;
  ownerId: string;
  partnerId?: string;
  partnershipId?: string;
  cadence?: GoalCadence;
  targetDate?: string | Date;
}

interface UpdateGoalInput {
  title?: string;
  description?: string;
  status?: GoalStatus;
  cadence?: GoalCadence;
  progress?: number;
  targetDate?: string | Date | null;
  partnerId?: string | null;
  partnershipId?: string | null;
}

interface CreateDailyCheckInInput {
  userId: string;
  partnerId?: string;
  goalId?: string;
  partnershipId?: string;
  checkInDate?: string | Date;
  mood?: string;
  summary: string;
  wins?: string;
  blockers?: string;
  commitment?: string;
  progressScore?: number;
}

interface CreateWeeklyReviewInput {
  userId: string;
  partnerId?: string;
  goalId?: string;
  partnershipId?: string;
  weekStartDate?: string | Date;
  wins?: string;
  challenges?: string;
  lessonsLearned?: string;
  nextWeekPlan?: string;
  completionScore?: number;
}

interface AccountabilityOverview {
  friends: number;
  activePartnerships: number;
  activeGoals: number;
  completedGoals: number;
  taskCompletionRate: number;
  currentCheckInStreak: number;
}

function normalizeDate(date?: string | Date): Date {
  const parsed = date ? new Date(date) : new Date();
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function clampScore(value: number, min = 0, max = 100): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function getWeekStart(date?: string | Date): Date {
  const base = normalizeDate(date);
  const day = base.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  base.setDate(base.getDate() + diff);
  return base;
}

export async function sendFriendRequestAction(
  input: SendFriendRequestInput,
): Promise<ActionResult<any>> {
  try {
    const requesterId = input.requesterId?.trim();
    const addresseeId = input.addresseeId?.trim();

    if (!requesterId || !addresseeId) {
      return { success: false, error: "requesterId and addresseeId are required" };
    }

    if (requesterId === addresseeId) {
      return { success: false, error: "You cannot send a friend request to yourself" };
    }

    const existing = await db.friendship.findFirst({
      where: {
        OR: [
          { requesterId, addresseeId },
          { requesterId: addresseeId, addresseeId: requesterId },
        ],
      },
    });

    if (existing) {
      if (existing.status === "ACCEPTED") {
        return { success: false, error: "You are already friends" };
      }

      if (existing.status === "PENDING") {
        return { success: false, error: "A pending friend request already exists" };
      }

      const renewedRequest = await db.friendship.update({
        where: { id: existing.id },
        data: {
          requesterId,
          addresseeId,
          status: "PENDING",
          message: input.message,
        },
        include: {
          requester: { select: { id: true, username: true, email: true } },
          addressee: { select: { id: true, username: true, email: true } },
        },
      });

      return { success: true, data: renewedRequest };
    }

    const request = await db.friendship.create({
      data: {
        requesterId,
        addresseeId,
        message: input.message,
      },
      include: {
        requester: { select: { id: true, username: true, email: true } },
        addressee: { select: { id: true, username: true, email: true } },
      },
    });

    await createNotificationAction({
      userId: addresseeId,
      type: "FRIEND_REQUEST",
      title: "New friend request",
      body: "You received a new friend request.",
      link: "/tasks",
    });

    return { success: true, data: request };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to send friend request" };
  }
}

export async function respondFriendRequestAction(
  input: RespondFriendRequestInput,
): Promise<ActionResult<any>> {
  try {
    if (!input.friendshipId || !input.responderId) {
      return { success: false, error: "friendshipId and responderId are required" };
    }

    const friendship = await db.friendship.findUnique({
      where: { id: input.friendshipId },
    });

    if (!friendship) {
      return { success: false, error: "Friend request not found" };
    }

    if (friendship.addresseeId !== input.responderId) {
      return { success: false, error: "Only the addressee can respond to this request" };
    }

    if (friendship.status !== "PENDING") {
      return { success: false, error: "This friend request is no longer pending" };
    }

    const updated = await db.friendship.update({
      where: { id: input.friendshipId },
      data: { status: input.accept ? "ACCEPTED" : "DECLINED" },
    });

    if (input.accept) {
      await createNotificationAction({
        userId: friendship.requesterId,
        type: "FRIEND_REQUEST_ACCEPTED",
        title: "Friend request accepted",
        body: "Your friend request was accepted.",
        link: "/tasks",
      });
    }

    return { success: true, data: updated };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to respond to friend request" };
  }
}

export async function listFriendConnectionsAction(
  userId: string,
  status?: ConnectionStatus,
): Promise<ActionResult<FriendListItem[]>> {
  try {
    if (!userId) {
      return { success: false, error: "userId is required" };
    }

    const rows = await db.friendship.findMany({
      where: {
        OR: [{ requesterId: userId }, { addresseeId: userId }],
        status,
      },
      include: {
        requester: { select: { id: true, username: true, email: true } },
        addressee: { select: { id: true, username: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const data: FriendListItem[] = rows.map((row) => {
      const friend = row.requesterId === userId ? row.addressee : row.requester;
      return {
        friendshipId: row.id,
        requesterId: row.requesterId,
        addresseeId: row.addresseeId,
        isIncoming: row.addresseeId === userId,
        status: row.status,
        createdAt: row.createdAt,
        friend,
      };
    });

    return { success: true, data };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to load friend connections" };
  }
}

export async function createPartnershipAction(
  input: CreatePartnershipInput,
): Promise<ActionResult<any>> {
  try {
    const initiatorId = input.initiatorId?.trim();
    const partnerId = input.partnerId?.trim();

    if (!initiatorId || !partnerId || !input.kind) {
      return { success: false, error: "initiatorId, partnerId and kind are required" };
    }

    if (initiatorId === partnerId) {
      return { success: false, error: "You cannot create a partnership with yourself" };
    }

    const existing = await db.partnership.findFirst({
      where: {
        kind: input.kind,
        OR: [
          { initiatorId, partnerId },
          { initiatorId: partnerId, partnerId: initiatorId },
        ],
      },
    });

    if (existing && (existing.status === "PENDING" || existing.status === "ACTIVE")) {
      return { success: false, error: "An active or pending partnership already exists" };
    }

    if (existing) {
      const restarted = await db.partnership.update({
        where: { id: existing.id },
        data: {
          initiatorId,
          partnerId,
          kind: input.kind,
          status: "PENDING",
          notes: input.notes,
          startedAt: null,
          endedAt: null,
        },
      });

      return { success: true, data: restarted };
    }

    const partnership = await db.partnership.create({
      data: {
        initiatorId,
        partnerId,
        kind: input.kind,
        notes: input.notes,
      },
    });

    return { success: true, data: partnership };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to create partnership" };
  }
}

export async function respondPartnershipInviteAction(
  input: RespondPartnershipInput,
): Promise<ActionResult<any>> {
  try {
    if (!input.partnershipId || !input.responderId) {
      return { success: false, error: "partnershipId and responderId are required" };
    }

    const partnership = await db.partnership.findUnique({
      where: { id: input.partnershipId },
    });

    if (!partnership) {
      return { success: false, error: "Partnership request not found" };
    }

    if (partnership.partnerId !== input.responderId) {
      return { success: false, error: "Only the invited partner can respond" };
    }

    if (partnership.status !== "PENDING") {
      return { success: false, error: "Partnership request is no longer pending" };
    }

    const updated = await db.partnership.update({
      where: { id: input.partnershipId },
      data: input.accept
        ? { status: "ACTIVE", startedAt: new Date(), endedAt: null }
        : { status: "DECLINED", endedAt: new Date() },
    });

    return { success: true, data: updated };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to respond to partnership invite" };
  }
}

export async function listPartnershipsAction(
  userId: string,
  status?: PartnershipStatus,
): Promise<ActionResult<any[]>> {
  try {
    if (!userId) {
      return { success: false, error: "userId is required" };
    }

    const partnerships = await db.partnership.findMany({
      where: {
        OR: [{ initiatorId: userId }, { partnerId: userId }],
        status,
      },
      include: {
        initiator: { select: { id: true, username: true, email: true } },
        partner: { select: { id: true, username: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: partnerships };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to load partnerships" };
  }
}

export async function createGoalAction(
  input: CreateGoalInput,
): Promise<ActionResult<any>> {
  try {
    const ownerId = input.ownerId?.trim();
    const title = input.title?.trim();

    if (!ownerId || !title) {
      return { success: false, error: "ownerId and title are required" };
    }

    const goal = await db.goal.create({
      data: {
        ownerId,
        title,
        description: input.description,
        partnerId: input.partnerId,
        partnershipId: input.partnershipId,
        cadence: input.cadence ?? "WEEKLY",
        targetDate: input.targetDate ? new Date(input.targetDate) : undefined,
      },
    });

    return { success: true, data: goal };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to create goal" };
  }
}

export async function listGoalsAction(input: {
  userId: string;
  includePartnerGoals?: boolean;
  status?: GoalStatus;
}): Promise<ActionResult<any[]>> {
  try {
    if (!input.userId) {
      return { success: false, error: "userId is required" };
    }

    const goals = await db.goal.findMany({
      where: {
        status: input.status,
        OR: input.includePartnerGoals === false
          ? [{ ownerId: input.userId }]
          : [{ ownerId: input.userId }, { partnerId: input.userId }],
      },
      include: {
        owner: { select: { id: true, username: true, email: true } },
        partner: { select: { id: true, username: true, email: true } },
      },
      orderBy: [{ status: "asc" }, { targetDate: "asc" }, { createdAt: "desc" }],
    });

    return { success: true, data: goals };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to load goals" };
  }
}

export async function updateGoalAction(
  goalId: string,
  changes: UpdateGoalInput,
): Promise<ActionResult<any>> {
  try {
    if (!goalId) {
      return { success: false, error: "goalId is required" };
    }

    const progress =
      typeof changes.progress === "number"
        ? clampScore(Math.round(changes.progress))
        : undefined;

    const updated = await db.goal.update({
      where: { id: goalId },
      data: {
        title: changes.title?.trim(),
        description: changes.description,
        status: changes.status,
        cadence: changes.cadence,
        progress,
        targetDate:
          changes.targetDate === null
            ? null
            : changes.targetDate
              ? new Date(changes.targetDate)
              : undefined,
        partnerId: changes.partnerId === undefined ? undefined : changes.partnerId,
        partnershipId:
          changes.partnershipId === undefined ? undefined : changes.partnershipId,
      },
    });

    return { success: true, data: updated };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to update goal" };
  }
}

export async function attachTaskToGoalAction(
  goalId: string,
  taskId: string,
): Promise<ActionResult<any>> {
  try {
    if (!goalId || !taskId) {
      return { success: false, error: "goalId and taskId are required" };
    }

    const link = await db.goalTask.upsert({
      where: { goalId_taskId: { goalId, taskId } },
      update: {},
      create: { goalId, taskId },
    });

    return { success: true, data: link };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to link task to goal" };
  }
}

export async function createDailyCheckInAction(
  input: CreateDailyCheckInInput,
): Promise<ActionResult<any>> {
  try {
    if (!input.userId || !input.summary?.trim()) {
      return { success: false, error: "userId and summary are required" };
    }

    const checkInDate = normalizeDate(input.checkInDate);

    const existing = await db.dailyCheckIn.findFirst({
      where: {
        userId: input.userId,
        goalId: input.goalId,
        checkInDate,
      },
    });

    if (existing) {
      const updated = await db.dailyCheckIn.update({
        where: { id: existing.id },
        data: {
          partnerId: input.partnerId,
          partnershipId: input.partnershipId,
          mood: input.mood,
          summary: input.summary,
          wins: input.wins,
          blockers: input.blockers,
          commitment: input.commitment,
          progressScore:
            input.progressScore === undefined
              ? undefined
              : clampScore(Math.round(input.progressScore)),
        },
      });

      return { success: true, data: updated };
    }

    const created = await db.dailyCheckIn.create({
      data: {
        userId: input.userId,
        partnerId: input.partnerId,
        goalId: input.goalId,
        partnershipId: input.partnershipId,
        checkInDate,
        mood: input.mood,
        summary: input.summary,
        wins: input.wins,
        blockers: input.blockers,
        commitment: input.commitment,
        progressScore:
          input.progressScore === undefined
            ? undefined
            : clampScore(Math.round(input.progressScore)),
      },
    });

    return { success: true, data: created };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to save daily check-in" };
  }
}

export async function listDailyCheckInsAction(input: {
  userId: string;
  goalId?: string;
  partnerId?: string;
  from?: string | Date;
  to?: string | Date;
}): Promise<ActionResult<any[]>> {
  try {
    if (!input.userId) {
      return { success: false, error: "userId is required" };
    }

    const checkIns = await db.dailyCheckIn.findMany({
      where: {
        userId: input.userId,
        goalId: input.goalId,
        partnerId: input.partnerId,
        checkInDate: {
          gte: input.from ? normalizeDate(input.from) : undefined,
          lte: input.to ? normalizeDate(input.to) : undefined,
        },
      },
      orderBy: { checkInDate: "desc" },
    });

    return { success: true, data: checkIns };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to load daily check-ins" };
  }
}

export async function createWeeklyReviewAction(
  input: CreateWeeklyReviewInput,
): Promise<ActionResult<any>> {
  try {
    if (!input.userId) {
      return { success: false, error: "userId is required" };
    }

    const weekStartDate = getWeekStart(input.weekStartDate);

    const existing = await db.weeklyReview.findFirst({
      where: {
        userId: input.userId,
        goalId: input.goalId,
        weekStartDate,
      },
    });

    if (existing) {
      const updated = await db.weeklyReview.update({
        where: { id: existing.id },
        data: {
          partnerId: input.partnerId,
          partnershipId: input.partnershipId,
          wins: input.wins,
          challenges: input.challenges,
          lessonsLearned: input.lessonsLearned,
          nextWeekPlan: input.nextWeekPlan,
          completionScore:
            input.completionScore === undefined
              ? undefined
              : clampScore(Math.round(input.completionScore)),
        },
      });

      return { success: true, data: updated };
    }

    const created = await db.weeklyReview.create({
      data: {
        userId: input.userId,
        partnerId: input.partnerId,
        goalId: input.goalId,
        partnershipId: input.partnershipId,
        weekStartDate,
        wins: input.wins,
        challenges: input.challenges,
        lessonsLearned: input.lessonsLearned,
        nextWeekPlan: input.nextWeekPlan,
        completionScore:
          input.completionScore === undefined
            ? undefined
            : clampScore(Math.round(input.completionScore)),
      },
    });

    return { success: true, data: created };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to save weekly review" };
  }
}

export async function listWeeklyReviewsAction(input: {
  userId: string;
  goalId?: string;
  partnerId?: string;
  from?: string | Date;
  to?: string | Date;
}): Promise<ActionResult<any[]>> {
  try {
    if (!input.userId) {
      return { success: false, error: "userId is required" };
    }

    const reviews = await db.weeklyReview.findMany({
      where: {
        userId: input.userId,
        goalId: input.goalId,
        partnerId: input.partnerId,
        weekStartDate: {
          gte: input.from ? getWeekStart(input.from) : undefined,
          lte: input.to ? getWeekStart(input.to) : undefined,
        },
      },
      orderBy: { weekStartDate: "desc" },
    });

    return { success: true, data: reviews };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to load weekly reviews" };
  }
}

export async function getAccountabilityOverviewAction(
  userId: string,
): Promise<ActionResult<AccountabilityOverview>> {
  try {
    if (!userId) {
      return { success: false, error: "userId is required" };
    }

    const [
      friendCountResult,
      activePartnershipsResult,
      activeGoalsResult,
      completedGoalsResult,
      totalOwnedTasksResult,
      completedOwnedTasksResult,
      recentCheckInsResult,
    ] = await Promise.allSettled([
      db.friendship.count({
        where: {
          status: "ACCEPTED",
          OR: [{ requesterId: userId }, { addresseeId: userId }],
        },
      }),
      db.partnership.count({
        where: {
          status: "ACTIVE",
          OR: [{ initiatorId: userId }, { partnerId: userId }],
        },
      }),
      db.goal.count({ where: { ownerId: userId, status: "ACTIVE" } }),
      db.goal.count({ where: { ownerId: userId, status: "COMPLETED" } }),
      db.task.count({ where: { ownerId: userId } }),
      db.task.count({
        where: {
          ownerId: userId,
          status: "COMPLETED" satisfies TaskStatus,
        },
      }),
      db.dailyCheckIn.findMany({
        where: { userId },
        orderBy: { checkInDate: "desc" },
        select: { checkInDate: true },
        take: 365,
      }),
    ]);

    const friendCount = friendCountResult.status === "fulfilled" ? friendCountResult.value : 0;
    const activePartnerships =
      activePartnershipsResult.status === "fulfilled" ? activePartnershipsResult.value : 0;
    const activeGoals = activeGoalsResult.status === "fulfilled" ? activeGoalsResult.value : 0;
    const completedGoals =
      completedGoalsResult.status === "fulfilled" ? completedGoalsResult.value : 0;
    const totalOwnedTasks =
      totalOwnedTasksResult.status === "fulfilled" ? totalOwnedTasksResult.value : 0;
    const completedOwnedTasks =
      completedOwnedTasksResult.status === "fulfilled" ? completedOwnedTasksResult.value : 0;
    const recentCheckIns =
      recentCheckInsResult.status === "fulfilled" ? recentCheckInsResult.value : [];

    const taskCompletionRate =
      totalOwnedTasks === 0
        ? 0
        : Math.round((completedOwnedTasks / totalOwnedTasks) * 100);

    let currentCheckInStreak = 0;
    const currentDate = normalizeDate();

    const availableDates = new Set(
      recentCheckIns.map((checkIn) => normalizeDate(checkIn.checkInDate).toISOString()),
    );

    while (availableDates.has(currentDate.toISOString())) {
      currentCheckInStreak += 1;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    return {
      success: true,
      data: {
        friends: friendCount,
        activePartnerships,
        activeGoals,
        completedGoals,
        taskCompletionRate,
        currentCheckInStreak,
      },
    };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to load accountability overview" };
  }
}
