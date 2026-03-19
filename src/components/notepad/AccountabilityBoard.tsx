"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaBullseye,
  FaCalendarCheck,
  FaCheckCircle,
  FaHandshake,
  FaPlus,
  FaSyncAlt,
  FaUserFriends,
} from "react-icons/fa";
import type { GoalCadence, GoalStatus, PartnershipKind } from "@prisma/client";
import {
  createDailyCheckInAction,
  createGoalAction,
  createPartnershipAction,
  createWeeklyReviewAction,
  getAccountabilityOverviewAction,
  listDailyCheckInsAction,
  listFriendConnectionsAction,
  listGoalsAction,
  listPartnershipsAction,
  listWeeklyReviewsAction,
  respondFriendRequestAction,
  respondPartnershipInviteAction,
  sendFriendRequestAction,
  updateGoalAction,
} from "~/actions/accountability";
import { getAllUsersAction, getUserByUsernameAction } from "~/actions/user";
import { useNotifications } from "../providers/NotificationProvider";

type Tab = "overview" | "friends" | "partners" | "goals" | "checkins" | "reviews";

interface SimpleUser {
  id: string;
  username: string;
}

interface FriendRow {
  friendshipId: string;
  isIncoming: boolean;
  status: string;
  createdAt: string | Date;
  friend: SimpleUser;
}

interface PartnerRow {
  id: string;
  initiatorId: string;
  partnerId: string;
  kind: string;
  status: string;
  createdAt: string | Date;
  initiator: SimpleUser;
  partner: SimpleUser;
}

interface GoalRow {
  id: string;
  title: string;
  status: GoalStatus;
  cadence: GoalCadence;
  progress: number;
  targetDate?: string | Date | null;
}

interface CheckInRow {
  id: string;
  checkInDate: string | Date;
  summary: string;
  progressScore?: number | null;
}

interface ReviewRow {
  id: string;
  weekStartDate: string | Date;
  wins?: string | null;
  challenges?: string | null;
  completionScore?: number | null;
}

interface Overview {
  friends: number;
  activePartnerships: number;
  activeGoals: number;
  completedGoals: number;
  taskCompletionRate: number;
  currentCheckInStreak: number;
}

const tabs: Array<{ id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "overview", label: "Overview", icon: FaSyncAlt },
  { id: "friends", label: "Friends", icon: FaUserFriends },
  { id: "partners", label: "Partners", icon: FaHandshake },
  { id: "goals", label: "Goals", icon: FaBullseye },
  { id: "checkins", label: "Daily", icon: FaCalendarCheck },
  { id: "reviews", label: "Weekly", icon: FaCheckCircle },
];

const kinds: PartnershipKind[] = ["ACCOUNTABILITY", "FRIEND", "PROFESSIONAL"];
const cadences: GoalCadence[] = ["DAILY", "WEEKLY", "MONTHLY", "CUSTOM"];
const statuses: GoalStatus[] = ["ACTIVE", "COMPLETED", "PAUSED", "ARCHIVED"];

const fmt = (value?: string | Date | null) =>
  value ? new Date(value).toLocaleDateString() : "-";

const AccountabilityBoard: React.FC = () => {
  const { success: notifySuccess, error: notifyError } = useNotifications();
  const [tab, setTab] = useState<Tab>("overview");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [overview, setOverview] = useState<Overview | null>(null);
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [goals, setGoals] = useState<GoalRow[]>([]);
  const [checkIns, setCheckIns] = useState<CheckInRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [goalDraft, setGoalDraft] = useState<Record<string, number>>({});

  const [friendUsername, setFriendUsername] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [kind, setKind] = useState<PartnershipKind>("ACCOUNTABILITY");
  const [goalTitle, setGoalTitle] = useState("");
  const [goalCadence, setGoalCadence] = useState<GoalCadence>("WEEKLY");
  const [goalTargetDate, setGoalTargetDate] = useState("");
  const [checkInSummary, setCheckInSummary] = useState("");
  const [checkInGoalId, setCheckInGoalId] = useState("");
  const [checkInScore, setCheckInScore] = useState("");
  const [reviewGoalId, setReviewGoalId] = useState("");
  const [reviewWins, setReviewWins] = useState("");
  const [reviewChallenges, setReviewChallenges] = useState("");
  const [reviewScore, setReviewScore] = useState("");

  const availableUsers = useMemo(
    () => users.filter((user) => user.id !== userId),
    [users, userId],
  );

  const refresh = useCallback(async (uid: string) => {
    setLoading(true);
    const [ov, us, fr, pr, gl, ch, wr] = await Promise.all([
      getAccountabilityOverviewAction(uid),
      getAllUsersAction(),
      listFriendConnectionsAction(uid),
      listPartnershipsAction(uid),
      listGoalsAction({ userId: uid, includePartnerGoals: true }),
      listDailyCheckInsAction({ userId: uid }),
      listWeeklyReviewsAction({ userId: uid }),
    ]);

    if (ov.success) setOverview((ov.data as Overview | undefined) ?? null);
    if (us.success) setUsers((us.data as SimpleUser[] | undefined) ?? []);
    if (fr.success) setFriends((fr.data as FriendRow[] | undefined) ?? []);
    if (pr.success) setPartners((pr.data as PartnerRow[] | undefined) ?? []);
    if (gl.success) setGoals((gl.data as GoalRow[] | undefined) ?? []);
    if (ch.success) setCheckIns((ch.data as CheckInRow[] | undefined) ?? []);
    if (wr.success) setReviews((wr.data as ReviewRow[] | undefined) ?? []);

    const firstError = [ov, us, fr, pr, gl, ch, wr].find((result) => !result.success);
    setError(firstError?.error ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    const uid = sessionStorage.getItem("userId") ?? "";
    setUserId(uid);
    if (!uid) {
      setError("Please log in to manage accountability.");
      setLoading(false);
      return;
    }
    void refresh(uid);
  }, [refresh]);

  useEffect(() => {
    if (notice) notifySuccess(notice);
  }, [notice, notifySuccess]);

  useEffect(() => {
    if (error) notifyError(error);
  }, [error, notifyError]);

  const run = async (
    action: () => Promise<{ success: boolean; error?: string }>,
    successText: string,
  ) => {
    if (!userId) return;
    setBusy(true);
    setNotice(null);
    setError(null);
    const result = await action();
    if (!result.success) {
      setError(result.error ?? "Action failed.");
      setBusy(false);
      return;
    }
    setNotice(successText);
    await refresh(userId);
    setBusy(false);
  };

  if (loading) return <div className="loader mt-4" />;

  return (
    <div>
      <div className="mb-3 mt-2 flex flex-wrap gap-2">
        {tabs.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className={`box flex items-center gap-2 px-3 text-sm font-semibold ${
                tab === item.id ? "bg-amber-100" : "bg-white/60"
              }`}
              onClick={() => setTab(item.id)}
            >
              <Icon className="text-xs" />
              {item.label}
            </button>
          );
        })}
      </div>

      {notice && <p className="mb-2 text-green-700">{notice}</p>}
      {error && <p className="mb-2 text-red-700">{error}</p>}

      {tab === "overview" && (
        <div className="space-y-3">
          <h2 className="text-center text-4xl underline">Accountability Dashboard</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="box bg-yellow-50 p-3">Friends: {overview?.friends ?? 0}</div>
            <div className="box bg-orange-50 p-3">Active Partnerships: {overview?.activePartnerships ?? 0}</div>
            <div className="box bg-sky-50 p-3">Active Goals: {overview?.activeGoals ?? 0}</div>
            <div className="box bg-emerald-50 p-3">Completed Goals: {overview?.completedGoals ?? 0}</div>
            <div className="box bg-violet-50 p-3">Task Completion: {overview?.taskCompletionRate ?? 0}%</div>
            <div className="box bg-pink-50 p-3">Check-In Streak: {overview?.currentCheckInStreak ?? 0}</div>
          </div>
        </div>
      )}

      {tab === "friends" && (
        <div className="space-y-3">
          <h2 className="text-center text-4xl underline">Friends</h2>
          <form
            className="box bg-yellow-50 p-3"
            onSubmit={(event) => {
              event.preventDefault();
              void (async () => {
                const username = friendUsername.trim();
                if (!username) {
                  setError("Enter a username.");
                  return;
                }
                const user = await getUserByUsernameAction(username);
                if (!user.success || !user.data?.id) {
                  setError(user.error ?? "User not found.");
                  return;
                }
                await run(
                  () =>
                    sendFriendRequestAction({
                      requesterId: userId,
                      addresseeId: user.data.id,
                    }),
                  `Friend request sent to ${username}.`,
                );
                setFriendUsername("");
              })();
            }}
          >
            <input
              value={friendUsername}
              onChange={(event) => setFriendUsername(event.target.value)}
              placeholder="Username"
              className="mb-2 w-full border px-2"
            />
            <button type="submit" className="box px-3" disabled={busy}>
              Send Request
            </button>
          </form>
          {friends.map((friend) => (
            <div key={friend.friendshipId} className="box bg-white/70 p-3">
              <p>
                <span className="font-bold">{friend.friend.username}</span> - {friend.status}
              </p>
              <p className="text-sm">Created: {fmt(friend.createdAt)}</p>
              {friend.status === "PENDING" && friend.isIncoming && (
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className="box bg-green-100 px-2"
                    onClick={() =>
                      void run(
                        () =>
                          respondFriendRequestAction({
                            friendshipId: friend.friendshipId,
                            responderId: userId,
                            accept: true,
                          }),
                        "Friend request accepted.",
                      )
                    }
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="box bg-red-100 px-2"
                    onClick={() =>
                      void run(
                        () =>
                          respondFriendRequestAction({
                            friendshipId: friend.friendshipId,
                            responderId: userId,
                            accept: false,
                          }),
                        "Friend request declined.",
                      )
                    }
                  >
                    Decline
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "partners" && (
        <div className="space-y-3">
          <h2 className="text-center text-4xl underline">Partnerships</h2>
          <form
            className="box bg-orange-50 p-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (!partnerId) {
                setError("Choose a user.");
                return;
              }
              void run(
                () =>
                  createPartnershipAction({
                    initiatorId: userId,
                    partnerId,
                    kind,
                  }),
                "Partnership invite sent.",
              );
              setPartnerId("");
              setKind("ACCOUNTABILITY");
            }}
          >
            <select
              value={partnerId}
              onChange={(event) => setPartnerId(event.target.value)}
              className="mb-2 w-full border bg-transparent px-2"
            >
              <option value="">Select user</option>
              {availableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username}
                </option>
              ))}
            </select>
            <select
              value={kind}
              onChange={(event) => setKind(event.target.value as PartnershipKind)}
              className="mb-2 w-full border bg-transparent px-2"
            >
              {kinds.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <button type="submit" className="box px-3" disabled={busy}>
              Invite Partner
            </button>
          </form>
          {partners.map((partnership) => {
            const other =
              partnership.initiatorId === userId
                ? partnership.partner.username
                : partnership.initiator.username;
            const canRespond =
              partnership.partnerId === userId && partnership.status === "PENDING";
            return (
              <div key={partnership.id} className="box bg-white/70 p-3">
                <p>
                  {partnership.kind} with <span className="font-bold">{other}</span>
                </p>
                <p>Status: {partnership.status}</p>
                {canRespond && (
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      className="box bg-green-100 px-2"
                      onClick={() =>
                        void run(
                          () =>
                            respondPartnershipInviteAction({
                              partnershipId: partnership.id,
                              responderId: userId,
                              accept: true,
                            }),
                          "Partnership accepted.",
                        )
                      }
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      className="box bg-red-100 px-2"
                      onClick={() =>
                        void run(
                          () =>
                            respondPartnershipInviteAction({
                              partnershipId: partnership.id,
                              responderId: userId,
                              accept: false,
                            }),
                          "Partnership declined.",
                        )
                      }
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === "goals" && (
        <div className="space-y-3">
          <h2 className="text-center text-4xl underline">Goals</h2>
          <form
            className="box bg-cyan-50 p-3"
            onSubmit={(event) => {
              event.preventDefault();
              const title = goalTitle.trim();
              if (!title) {
                setError("Goal title is required.");
                return;
              }
              void run(
                () =>
                  createGoalAction({
                    title,
                    ownerId: userId,
                    cadence: goalCadence,
                    targetDate: goalTargetDate || undefined,
                  }),
                "Goal created.",
              );
              setGoalTitle("");
              setGoalCadence("WEEKLY");
              setGoalTargetDate("");
            }}
          >
            <input
              value={goalTitle}
              onChange={(event) => setGoalTitle(event.target.value)}
              placeholder="Goal title"
              className="mb-2 w-full border px-2"
            />
            <select
              value={goalCadence}
              onChange={(event) => setGoalCadence(event.target.value as GoalCadence)}
              className="mb-2 w-full border bg-transparent px-2"
            >
              {cadences.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={goalTargetDate}
              onChange={(event) => setGoalTargetDate(event.target.value)}
              className="mb-2 w-full border px-2"
            />
            <button type="submit" className="box flex items-center gap-2 px-3" disabled={busy}>
              <FaPlus />
              Add Goal
            </button>
          </form>
          {goals.map((goal) => (
            <div key={goal.id} className="box bg-white/70 p-3">
              <p className="font-bold">{goal.title}</p>
              <p>
                {goal.status} | {goal.cadence} | {goal.progress}%
              </p>
              <p className="text-sm">Target: {fmt(goal.targetDate)}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={goalDraft[goal.id] ?? goal.progress}
                  onChange={(event) =>
                    setGoalDraft((prev) => ({
                      ...prev,
                      [goal.id]: Number(event.target.value),
                    }))
                  }
                  className="w-20 border bg-transparent px-2"
                />
                <button
                  type="button"
                  className="box bg-emerald-100 px-2"
                  onClick={() =>
                    void run(
                      () =>
                        updateGoalAction(goal.id, {
                          progress: goalDraft[goal.id] ?? goal.progress,
                        }),
                      `Progress updated for ${goal.title}.`,
                    )
                  }
                >
                  Save
                </button>
                <select
                  value={goal.status}
                  onChange={(event) =>
                    void run(
                      () =>
                        updateGoalAction(goal.id, {
                          status: event.target.value as GoalStatus,
                        }),
                      `${goal.title} status updated.`,
                    )
                  }
                  className="border bg-transparent px-2"
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "checkins" && (
        <div className="space-y-3">
          <h2 className="text-center text-4xl underline">Daily Check-Ins</h2>
          <form
            className="box bg-lime-50 p-3"
            onSubmit={(event) => {
              event.preventDefault();
              const summary = checkInSummary.trim();
              if (!summary) {
                setError("Summary is required.");
                return;
              }
              void run(
                () =>
                  createDailyCheckInAction({
                    userId,
                    goalId: checkInGoalId || undefined,
                    summary,
                    progressScore: checkInScore ? Number(checkInScore) : undefined,
                  }),
                "Daily check-in saved.",
              );
              setCheckInSummary("");
              setCheckInGoalId("");
              setCheckInScore("");
            }}
          >
            <select
              value={checkInGoalId}
              onChange={(event) => setCheckInGoalId(event.target.value)}
              className="mb-2 w-full border bg-transparent px-2"
            >
              <option value="">Optional goal</option>
              {goals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.title}
                </option>
              ))}
            </select>
            <input
              value={checkInSummary}
              onChange={(event) => setCheckInSummary(event.target.value)}
              placeholder="Summary"
              className="mb-2 w-full border px-2"
            />
            <input
              type="number"
              min={0}
              max={100}
              value={checkInScore}
              onChange={(event) => setCheckInScore(event.target.value)}
              placeholder="Score 0-100"
              className="mb-2 w-full border px-2"
            />
            <button type="submit" className="box px-3" disabled={busy}>
              Save Check-In
            </button>
          </form>
          {checkIns.slice(0, 10).map((checkIn) => (
            <div key={checkIn.id} className="box bg-white/70 p-3">
              <p className="font-bold">{fmt(checkIn.checkInDate)}</p>
              <p>{checkIn.summary}</p>
              {checkIn.progressScore !== undefined && checkIn.progressScore !== null && (
                <p>Score: {checkIn.progressScore}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "reviews" && (
        <div className="space-y-3">
          <h2 className="text-center text-4xl underline">Weekly Reviews</h2>
          <form
            className="box bg-indigo-50 p-3"
            onSubmit={(event) => {
              event.preventDefault();
              void run(
                () =>
                  createWeeklyReviewAction({
                    userId,
                    goalId: reviewGoalId || undefined,
                    wins: reviewWins.trim() || undefined,
                    challenges: reviewChallenges.trim() || undefined,
                    completionScore: reviewScore ? Number(reviewScore) : undefined,
                  }),
                "Weekly review saved.",
              );
              setReviewGoalId("");
              setReviewWins("");
              setReviewChallenges("");
              setReviewScore("");
            }}
          >
            <select
              value={reviewGoalId}
              onChange={(event) => setReviewGoalId(event.target.value)}
              className="mb-2 w-full border bg-transparent px-2"
            >
              <option value="">Optional goal</option>
              {goals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.title}
                </option>
              ))}
            </select>
            <input
              value={reviewWins}
              onChange={(event) => setReviewWins(event.target.value)}
              placeholder="Wins"
              className="mb-2 w-full border px-2"
            />
            <input
              value={reviewChallenges}
              onChange={(event) => setReviewChallenges(event.target.value)}
              placeholder="Challenges"
              className="mb-2 w-full border px-2"
            />
            <input
              type="number"
              min={0}
              max={100}
              value={reviewScore}
              onChange={(event) => setReviewScore(event.target.value)}
              placeholder="Score 0-100"
              className="mb-2 w-full border px-2"
            />
            <button type="submit" className="box px-3" disabled={busy}>
              Save Weekly Review
            </button>
          </form>
          {reviews.slice(0, 10).map((review) => (
            <div key={review.id} className="box bg-white/70 p-3">
              <p className="font-bold">Week of {fmt(review.weekStartDate)}</p>
              {review.wins && <p>Wins: {review.wins}</p>}
              {review.challenges && <p>Challenges: {review.challenges}</p>}
              {review.completionScore !== undefined && review.completionScore !== null && (
                <p>Score: {review.completionScore}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AccountabilityBoard;
