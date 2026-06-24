"use client";

import { TaskPriority, TaskStatus } from "@prisma/client";
import type { GoalStatus as GoalStatusType } from "@prisma/client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaBolt,
  FaBullseye,
  FaCheckCircle,
  FaClock,
  FaFire,
  FaLink,
  FaMagic,
  FaPlus,
  FaSearch,
  FaSyncAlt,
  FaTrashAlt,
  FaUserCheck,
} from "react-icons/fa";
import {
  attachTaskToGoalAction,
  getAccountabilityOverviewAction,
  listGoalsAction,
} from "~/actions/accountability";
import {
  createTaskAction,
  deleteTaskAction,
  getAllTasksAction,
  updateTaskAction,
} from "~/actions/task";
import { getAllUsersAction } from "~/actions/user";
import { useNotifications } from "../providers/NotificationProvider";
import type Task from "~/models/task.model";

type TaskScope = "owned" | "assigned";
type TaskFilter =
  | "all"
  | "today"
  | "overdue"
  | "high"
  | "blocked"
  | "completed";
type TaskSort = "impact" | "due" | "priority";

interface TasksBoardProps {
  onOpenAccountability: () => void;
}

interface TaskRow extends Task {
  id: string;
  ownerId: string;
  assigneeId: string;
}

interface SimpleUser {
  id: string;
  username: string;
}

interface GoalRow {
  id: string;
  title: string;
  status: GoalStatusType;
  progress: number;
}

interface Overview {
  taskCompletionRate: number;
  activeGoals: number;
  activePartnerships: number;
  currentCheckInStreak: number;
}

interface TaskDraft {
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assigneeId: string;
}

const statusOptions: Array<{ label: string; value: TaskStatus }> = [
  { label: "Todo", value: TaskStatus.TODO },
  { label: "In Progress", value: TaskStatus.IN_PROGRESS },
  { label: "Blocked", value: TaskStatus.BLOCKED },
  { label: "Completed", value: TaskStatus.COMPLETED },
];
const priorityOptions: Array<{ label: string; value: TaskPriority }> = [
  { label: "Low", value: TaskPriority.LOW },
  { label: "Medium", value: TaskPriority.MEDIUM },
  { label: "High", value: TaskPriority.HIGH },
  { label: "Critical", value: TaskPriority.CRITICAL },
];

const toInputDate = (value: string | Date) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toDisplayDate = (value: string | Date) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString();
};

const isCompletedStatus = (status: TaskStatus) =>
  status === TaskStatus.COMPLETED;
const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};
const daysUntil = (value: string | Date) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 999;
  const today = startOfToday();
  date.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - today.getTime()) / 86_400_000);
};
const priorityScore: Record<TaskPriority, number> = {
  [TaskPriority.LOW]: 1,
  [TaskPriority.MEDIUM]: 2,
  [TaskPriority.HIGH]: 3,
  [TaskPriority.CRITICAL]: 4,
};
const statusScore: Record<TaskStatus, number> = {
  [TaskStatus.TODO]: 2,
  [TaskStatus.IN_PROGRESS]: 3,
  [TaskStatus.BLOCKED]: 4,
  [TaskStatus.COMPLETED]: 0,
};
const urgencyScore = (task: TaskRow) => {
  const dueIn = daysUntil(task.dueDate);
  const dueScore = dueIn < 0 ? 40 : Math.max(0, 20 - dueIn * 2);
  return (
    priorityScore[task.priority] * 12 + statusScore[task.status] * 8 + dueScore
  );
};
const toTaskLabel = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");

const TasksBoard: React.FC<TasksBoardProps> = ({ onOpenAccountability }) => {
  const { success: notifySuccess, error: notifyError } = useNotifications();
  const [scope, setScope] = useState<TaskScope>("owned");
  const [userId, setUserId] = useState("");
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [goals, setGoals] = useState<GoalRow[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<TaskDraft | null>(null);
  const [goalSelection, setGoalSelection] = useState<Record<string, string>>(
    {},
  );
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [sortBy, setSortBy] = useState<TaskSort>("impact");
  const [searchTerm, setSearchTerm] = useState("");
  const [focusTaskId, setFocusTaskId] = useState<string | null>(null);
  const [createDraft, setCreateDraft] = useState<TaskDraft>({
    title: "",
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    dueDate: toInputDate(new Date()),
    assigneeId: "",
  });

  const usernameById = useMemo(
    () => new Map(users.map((user) => [user.id, user.username] as const)),
    [users],
  );

  const taskIntelligence = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) =>
      isCompletedStatus(task.status),
    ).length;
    const overdue = tasks.filter(
      (task) => !isCompletedStatus(task.status) && daysUntil(task.dueDate) < 0,
    ).length;
    const dueToday = tasks.filter(
      (task) =>
        !isCompletedStatus(task.status) && daysUntil(task.dueDate) === 0,
    ).length;
    const highImpact = tasks.filter(
      (task) =>
        (task.priority === TaskPriority.HIGH ||
          task.priority === TaskPriority.CRITICAL) &&
        !isCompletedStatus(task.status),
    ).length;
    const momentum = total === 0 ? 0 : Math.round((completed / total) * 100);
    const openTasks = tasks.filter((task) => !isCompletedStatus(task.status));
    const nextBestTask =
      [...openTasks].sort((a, b) => urgencyScore(b) - urgencyScore(a))[0] ??
      null;

    return {
      total,
      completed,
      overdue,
      dueToday,
      highImpact,
      momentum,
      nextBestTask,
    };
  }, [tasks]);

  const visibleTasks = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return tasks
      .filter((task) => {
        const linkedGoals = (task.goalLinks ?? [])
          .map((link) => link.goal?.title ?? "")
          .join(" ")
          .toLowerCase();
        const haystack =
          `${task.title} ${task.status} ${task.priority} ${linkedGoals}`.toLowerCase();
        if (normalizedSearch && !haystack.includes(normalizedSearch))
          return false;

        const dueIn = daysUntil(task.dueDate);
        switch (filter) {
          case "today":
            return !isCompletedStatus(task.status) && dueIn === 0;
          case "overdue":
            return !isCompletedStatus(task.status) && dueIn < 0;
          case "high":
            return (
              (task.priority === TaskPriority.HIGH ||
                task.priority === TaskPriority.CRITICAL) &&
              !isCompletedStatus(task.status)
            );
          case "blocked":
            return task.status === TaskStatus.BLOCKED;
          case "completed":
            return isCompletedStatus(task.status);
          default:
            return true;
        }
      })
      .sort((a, b) => {
        if (sortBy === "due")
          return daysUntil(a.dueDate) - daysUntil(b.dueDate);
        if (sortBy === "priority")
          return priorityScore[b.priority] - priorityScore[a.priority];
        return urgencyScore(b) - urgencyScore(a);
      });
  }, [filter, searchTerm, sortBy, tasks]);

  const filterOptions: Array<{
    label: string;
    value: TaskFilter;
    count?: number;
  }> = [
    { label: "All", value: "all", count: taskIntelligence.total },
    { label: "Today", value: "today", count: taskIntelligence.dueToday },
    { label: "Overdue", value: "overdue", count: taskIntelligence.overdue },
    { label: "High impact", value: "high", count: taskIntelligence.highImpact },
    { label: "Blocked", value: "blocked" },
    {
      label: "Completed",
      value: "completed",
      count: taskIntelligence.completed,
    },
  ];

  const triggerFocusSprint = () => {
    const nextBestTask = taskIntelligence.nextBestTask;
    if (!nextBestTask) {
      setNotice(
        "Your board is clear. Create a mission to keep momentum alive.",
      );
      return;
    }

    setFocusTaskId(nextBestTask.id);
    setFilter("all");
    setSearchTerm("");
    setNotice(`Focus sprint armed: ${nextBestTask.title}`);
  };

  const refresh = useCallback(
    async (activeUserId: string, activeScope: TaskScope) => {
      setLoading(true);

      const [taskResult, usersResult, goalsResult, overviewResult] =
        await Promise.all([
          activeScope === "owned"
            ? getAllTasksAction(activeUserId, undefined)
            : getAllTasksAction(undefined, activeUserId),
          getAllUsersAction(),
          listGoalsAction({ userId: activeUserId, includePartnerGoals: true }),
          getAccountabilityOverviewAction(activeUserId),
        ]);

      setTasks(
        taskResult.success
          ? ((taskResult.data as TaskRow[] | undefined) ?? [])
          : [],
      );
      setUsers(
        usersResult.success
          ? ((usersResult.data as SimpleUser[] | undefined) ?? [])
          : [],
      );
      setGoals(
        goalsResult.success
          ? ((goalsResult.data as GoalRow[] | undefined) ?? [])
          : [],
      );
      setOverview(
        overviewResult.success
          ? ((overviewResult.data as Overview | undefined) ?? null)
          : null,
      );

      const firstError = [
        taskResult,
        usersResult,
        goalsResult,
        overviewResult,
      ].find((result) => !result.success);
      setError(firstError?.error ?? null);
      setLoading(false);
    },
    [],
  );

  useEffect(() => {
    const currentUserId = sessionStorage.getItem("userId") ?? "";
    setUserId(currentUserId);
    setCreateDraft((prev) => ({ ...prev, assigneeId: currentUserId }));

    if (!currentUserId) {
      setLoading(false);
      setError("Please log in to manage tasks.");
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    void refresh(userId, scope);
  }, [refresh, scope, userId]);

  useEffect(() => {
    if (notice) notifySuccess(notice);
  }, [notice, notifySuccess]);

  useEffect(() => {
    if (error) notifyError(error);
  }, [error, notifyError]);

  const resetMessages = () => {
    setNotice(null);
    setError(null);
  };

  const finishAndRefresh = async (nextNotice: string) => {
    if (!userId) return;
    setNotice(nextNotice);
    await refresh(userId, scope);
  };

  const handleCreateTask = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userId) return;

    const title = createDraft.title.trim();
    if (!title) {
      setError("Task title is required.");
      return;
    }

    if (!createDraft.dueDate) {
      setError("Due date is required.");
      return;
    }

    resetMessages();
    setBusyId("create");

    const result = await createTaskAction({
      title,
      status: createDraft.status,
      priority: createDraft.priority,
      dueDate: createDraft.dueDate,
      ownerId: userId,
      assigneeId: createDraft.assigneeId || userId,
    });

    if (!result.success) {
      setError(result.error ?? "Failed to create task.");
      setBusyId(null);
      return;
    }

    setCreateDraft((prev) => ({
      ...prev,
      title: "",
      dueDate: toInputDate(new Date()),
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
    }));
    await finishAndRefresh(`Task "${title}" created.`);
    setBusyId(null);
  };

  const beginEdit = (task: TaskRow) => {
    setEditingTaskId(task.id);
    setEditDraft({
      title: task.title,
      status: task.status,
      priority: task.priority,
      dueDate: toInputDate(task.dueDate),
      assigneeId: task.assigneeId,
    });
    resetMessages();
  };

  const cancelEdit = () => {
    setEditingTaskId(null);
    setEditDraft(null);
  };

  const handleSaveEdit = async (taskId: string) => {
    if (!userId || !editDraft) return;

    const title = editDraft.title.trim();
    if (!title) {
      setError("Task title is required.");
      return;
    }

    if (!editDraft.dueDate) {
      setError("Due date is required.");
      return;
    }

    resetMessages();
    setBusyId(taskId);

    const result = await updateTaskAction(taskId, {
      title,
      status: editDraft.status,
      priority: editDraft.priority,
      dueDate: editDraft.dueDate,
      assigneeId:
        scope === "owned" ? editDraft.assigneeId || userId : undefined,
    });

    if (!result.success) {
      setError(result.error ?? "Failed to update task.");
      setBusyId(null);
      return;
    }

    cancelEdit();
    await finishAndRefresh(`Task "${title}" updated.`);
    setBusyId(null);
  };

  const handleMarkComplete = async (task: TaskRow) => {
    resetMessages();
    setBusyId(task.id);
    const result = await updateTaskAction(task.id, {
      status: TaskStatus.COMPLETED,
    });

    if (!result.success) {
      setError(result.error ?? "Failed to mark task as complete.");
      setBusyId(null);
      return;
    }

    await finishAndRefresh(`Task "${task.title}" marked completed.`);
    setBusyId(null);
  };

  const handleDelete = async (task: TaskRow) => {
    const shouldDelete = window.confirm(`Delete task "${task.title}"?`);
    if (!shouldDelete) return;

    resetMessages();
    setBusyId(task.id);

    const result = await deleteTaskAction(task.id);
    if (!result.success) {
      setError(result.error ?? "Failed to delete task.");
      setBusyId(null);
      return;
    }

    if (editingTaskId === task.id) {
      cancelEdit();
    }

    await finishAndRefresh(`Task "${task.title}" deleted.`);
    setBusyId(null);
  };

  const handleAttachGoal = async (task: TaskRow) => {
    const goalId = goalSelection[task.id];
    if (!goalId) {
      setError("Select a goal first.");
      return;
    }

    resetMessages();
    setBusyId(task.id);

    const result = await attachTaskToGoalAction(goalId, task.id);
    if (!result.success) {
      setError(result.error ?? "Failed to link goal.");
      setBusyId(null);
      return;
    }

    setGoalSelection((prev) => ({ ...prev, [task.id]: "" }));
    await finishAndRefresh(`Task "${task.title}" linked to a goal.`);
    setBusyId(null);
  };

  if (loading) {
    return <div className="loader mt-2" />;
  }

  return (
    <div className="space-y-3">
      <div className="box bg-yellow-50/80 p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-3xl underline">
            <FaSyncAlt className="text-lg" />
            Task Command Center
          </h2>
          <button
            type="button"
            className="box bg-white px-3 text-base font-semibold"
            onClick={onOpenAccountability}
          >
            Open Accountability
          </button>
        </div>
        <div className="grid grid-cols-1 gap-2 text-base md:grid-cols-4">
          <p className="box bg-emerald-50 px-3">
            <FaCheckCircle className="mr-2 inline" />
            Completion {overview?.taskCompletionRate ?? 0}%
          </p>
          <p className="box bg-sky-50 px-3">
            <FaBullseye className="mr-2 inline" />
            Active Goals {overview?.activeGoals ?? 0}
          </p>
          <p className="box bg-orange-50 px-3">
            <FaUserCheck className="mr-2 inline" />
            Partnerships {overview?.activePartnerships ?? 0}
          </p>
          <p className="box bg-fuchsia-50 px-3">
            <FaFire className="mr-2 inline" />
            Momentum {taskIntelligence.momentum}%
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-lg font-semibold">View:</span>
        <button
          type="button"
          className={`box px-3 text-base font-semibold ${
            scope === "owned" ? "bg-amber-100" : "bg-white/70"
          }`}
          onClick={() => setScope("owned")}
        >
          Owned
        </button>
        <button
          type="button"
          className={`box px-3 text-base font-semibold ${
            scope === "assigned" ? "bg-amber-100" : "bg-white/70"
          }`}
          onClick={() => setScope("assigned")}
        >
          Assigned
        </button>
      </div>

      <section className="box task-orbit bg-slate-950/90 p-3 text-base text-white">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-2xl underline">
            <FaMagic className="text-sm text-yellow-200" />
            Mission Control
          </h3>
          <button
            type="button"
            className="box bg-yellow-200 px-3 font-semibold text-slate-950"
            onClick={triggerFocusSprint}
          >
            <FaBolt className="mr-1 inline" />
            Launch Focus Sprint
          </button>
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <div className="rounded-xl border border-white/20 bg-white/10 p-3">
            <p className="text-sm uppercase tracking-[0.2em] text-yellow-100">
              Next best action
            </p>
            <p className="font-semibold">
              {taskIntelligence.nextBestTask?.title ??
                "Nothing urgent. Invent the next win."}
            </p>
          </div>
          <div className="rounded-xl border border-white/20 bg-white/10 p-3">
            <p className="text-sm uppercase tracking-[0.2em] text-rose-100">
              Risk radar
            </p>
            <p className="font-semibold">
              {taskIntelligence.overdue} overdue · {taskIntelligence.dueToday}{" "}
              due today
            </p>
          </div>
          <div className="rounded-xl border border-white/20 bg-white/10 p-3">
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-100">
              Wins logged
            </p>
            <p className="font-semibold">
              {taskIntelligence.completed}/{taskIntelligence.total} complete
            </p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto]">
          <label className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3">
            <FaSearch />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search titles, goals, status, priority..."
              className="w-full py-1 text-white placeholder:text-white/60"
            />
          </label>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as TaskSort)}
            className="rounded-xl border border-white/20 bg-slate-900 px-3 py-1 text-white"
          >
            <option value="impact">Sort by impact</option>
            <option value="due">Sort by due date</option>
            <option value="priority">Sort by priority</option>
          </select>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`box px-3 ${filter === option.value ? "bg-cyan-200 text-slate-950" : "bg-white/10 text-white"}`}
              onClick={() => setFilter(option.value)}
            >
              {option.label}
              {typeof option.count === "number" ? ` · ${option.count}` : ""}
            </button>
          ))}
        </div>
      </section>

      <form
        className="box bg-white/70 p-3 text-base"
        onSubmit={handleCreateTask}
      >
        <h3 className="mb-2 flex items-center gap-2 text-2xl underline">
          <FaPlus className="text-sm" />
          Create Task
        </h3>
        <input
          value={createDraft.title}
          onChange={(event) =>
            setCreateDraft((prev) => ({ ...prev, title: event.target.value }))
          }
          placeholder="Task title"
          className="mb-2 w-full border px-2"
          maxLength={120}
          required
        />
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <select
            value={createDraft.status}
            onChange={(event) =>
              setCreateDraft((prev) => ({
                ...prev,
                status: event.target.value as TaskStatus,
              }))
            }
            className="border bg-transparent px-2"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={createDraft.priority}
            onChange={(event) =>
              setCreateDraft((prev) => ({
                ...prev,
                priority: event.target.value as TaskPriority,
              }))
            }
            className="border bg-transparent px-2"
          >
            {priorityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={createDraft.dueDate}
            onChange={(event) =>
              setCreateDraft((prev) => ({
                ...prev,
                dueDate: event.target.value,
              }))
            }
            className="border px-2"
            required
          />
        </div>
        {scope === "owned" && (
          <select
            value={createDraft.assigneeId}
            onChange={(event) =>
              setCreateDraft((prev) => ({
                ...prev,
                assigneeId: event.target.value,
              }))
            }
            className="mt-2 w-full border bg-transparent px-2"
          >
            <option value="">Assign to me</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.username}
              </option>
            ))}
          </select>
        )}
        <button
          type="submit"
          className="box mt-2 px-3 font-semibold"
          disabled={busyId === "create"}
        >
          {busyId === "create" ? "Saving..." : "Add Task"}
        </button>
      </form>

      <div className="space-y-3 text-base">
        {visibleTasks.length === 0 ? (
          <div className="box bg-white/70 p-3">
            No missions match this signal. Change filters or create a new task.
          </div>
        ) : (
          visibleTasks.map((task) => {
            const isEditing = editingTaskId === task.id;
            const linkedGoals = (task.goalLinks ?? [])
              .map((link) => link.goal)
              .filter((goal): goal is NonNullable<typeof goal> =>
                Boolean(goal),
              );

            return (
              <article
                key={task.id}
                className={`box bg-white/80 p-3 ${focusTaskId === task.id ? "focus-sprint" : ""}`}
              >
                {isEditing && editDraft ? (
                  <div className="space-y-2">
                    <input
                      value={editDraft.title}
                      onChange={(event) =>
                        setEditDraft((prev) =>
                          prev ? { ...prev, title: event.target.value } : prev,
                        )
                      }
                      className="w-full border px-2"
                      maxLength={120}
                    />
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                      <select
                        value={editDraft.status}
                        onChange={(event) =>
                          setEditDraft((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  status: event.target.value as TaskStatus,
                                }
                              : prev,
                          )
                        }
                        className="border bg-transparent px-2"
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={editDraft.priority}
                        onChange={(event) =>
                          setEditDraft((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  priority: event.target.value as TaskPriority,
                                }
                              : prev,
                          )
                        }
                        className="border bg-transparent px-2"
                      >
                        {priorityOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="date"
                        value={editDraft.dueDate}
                        onChange={(event) =>
                          setEditDraft((prev) =>
                            prev
                              ? { ...prev, dueDate: event.target.value }
                              : prev,
                          )
                        }
                        className="border px-2"
                      />
                    </div>
                    {scope === "owned" && (
                      <select
                        value={editDraft.assigneeId}
                        onChange={(event) =>
                          setEditDraft((prev) =>
                            prev
                              ? { ...prev, assigneeId: event.target.value }
                              : prev,
                          )
                        }
                        className="w-full border bg-transparent px-2"
                      >
                        <option value={userId}>Assign to me</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.username}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ) : (
                  <div>
                    <h3 className="flex flex-wrap items-center gap-2 text-2xl font-semibold">
                      {task.title}
                      {focusTaskId === task.id && (
                        <span className="rounded-full bg-yellow-200 px-2 text-sm text-slate-950">
                          Focus sprint
                        </span>
                      )}
                    </h3>
                    <p>
                      <FaClock className="mr-1 inline" />
                      Impact score: {urgencyScore(task)} ·{" "}
                      {daysUntil(task.dueDate) < 0
                        ? "Overdue"
                        : `${daysUntil(task.dueDate)} day(s) left`}
                    </p>
                    <p>Status: {toTaskLabel(task.status)}</p>
                    <p>Priority: {toTaskLabel(task.priority)}</p>
                    <p>Due: {toDisplayDate(task.dueDate)}</p>
                    <p>Owner: {usernameById.get(task.ownerId) ?? "Unknown"}</p>
                    <p>
                      Assigned to:{" "}
                      {usernameById.get(task.assigneeId) ?? "Unknown"}
                    </p>
                    {linkedGoals.length > 0 && (
                      <p>
                        Linked goals:{" "}
                        {linkedGoals
                          .map((goal) => `${goal.title} (${goal.progress}%)`)
                          .join(", ")}
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        className="box bg-emerald-100 px-3"
                        onClick={() => void handleSaveEdit(task.id)}
                        disabled={busyId === task.id}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="box bg-gray-200 px-3"
                        onClick={cancelEdit}
                        disabled={busyId === task.id}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      {!isCompletedStatus(task.status) && (
                        <button
                          type="button"
                          className="box bg-emerald-100 px-3"
                          onClick={() => void handleMarkComplete(task)}
                          disabled={busyId === task.id}
                        >
                          Complete
                        </button>
                      )}
                      <button
                        type="button"
                        className="box bg-blue-100 px-3"
                        onClick={() => beginEdit(task)}
                        disabled={busyId === task.id}
                      >
                        Edit
                      </button>
                      {scope === "owned" && (
                        <button
                          type="button"
                          className="box bg-red-100 px-3"
                          onClick={() => void handleDelete(task)}
                          disabled={busyId === task.id}
                        >
                          <FaTrashAlt className="mr-1 inline" />
                          Delete
                        </button>
                      )}
                    </>
                  )}
                </div>

                {!isEditing && scope === "owned" && goals.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <select
                      value={goalSelection[task.id] ?? ""}
                      onChange={(event) =>
                        setGoalSelection((prev) => ({
                          ...prev,
                          [task.id]: event.target.value,
                        }))
                      }
                      className="border bg-transparent px-2"
                    >
                      <option value="">Link to accountability goal</option>
                      {goals.map((goal) => (
                        <option key={goal.id} value={goal.id}>
                          {goal.title} ({goal.status})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="box bg-cyan-100 px-3"
                      onClick={() => void handleAttachGoal(task)}
                      disabled={busyId === task.id}
                    >
                      <FaLink className="mr-1 inline" />
                      Link Goal
                    </button>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TasksBoard;
