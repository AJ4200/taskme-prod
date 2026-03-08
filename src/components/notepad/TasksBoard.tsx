"use client";

import type { GoalStatus } from "@prisma/client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaBullseye,
  FaCheckCircle,
  FaLink,
  FaPlus,
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
import type Task from "~/models/task.model";

type TaskScope = "owned" | "assigned";

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
  status: GoalStatus;
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
  status: string;
  priority: string;
  dueDate: string;
  assigneeId: string;
}

const statusOptions = ["Todo", "In Progress", "Blocked", "Completed"];
const priorityOptions = ["Low", "Medium", "High", "Critical"];

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

const isCompletedStatus = (status: string) => {
  const normalized = status.trim().toLowerCase();
  return normalized === "completed" || normalized === "done";
};

const TasksBoard: React.FC<TasksBoardProps> = ({ onOpenAccountability }) => {
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
  const [goalSelection, setGoalSelection] = useState<Record<string, string>>({});
  const [createDraft, setCreateDraft] = useState<TaskDraft>({
    title: "",
    status: "Todo",
    priority: "Medium",
    dueDate: toInputDate(new Date()),
    assigneeId: "",
  });

  const usernameById = useMemo(
    () => new Map(users.map((user) => [user.id, user.username] as const)),
    [users],
  );

  const refresh = useCallback(async (activeUserId: string, activeScope: TaskScope) => {
    setLoading(true);

    const [taskResult, usersResult, goalsResult, overviewResult] = await Promise.all([
      activeScope === "owned"
        ? getAllTasksAction(activeUserId, undefined)
        : getAllTasksAction(undefined, activeUserId),
      getAllUsersAction(),
      listGoalsAction({ userId: activeUserId, includePartnerGoals: true }),
      getAccountabilityOverviewAction(activeUserId),
    ]);

    setTasks(taskResult.success ? ((taskResult.data as TaskRow[] | undefined) ?? []) : []);
    setUsers(usersResult.success ? ((usersResult.data as SimpleUser[] | undefined) ?? []) : []);
    setGoals(goalsResult.success ? ((goalsResult.data as GoalRow[] | undefined) ?? []) : []);
    setOverview(
      overviewResult.success
        ? ((overviewResult.data as Overview | undefined) ?? null)
        : null,
    );

    const firstError = [taskResult, usersResult, goalsResult, overviewResult].find(
      (result) => !result.success,
    );
    setError(firstError?.error ?? null);
    setLoading(false);
  }, []);

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
      status: "Todo",
      priority: "Medium",
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
      assigneeId: scope === "owned" ? editDraft.assigneeId || userId : undefined,
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
      status: "Completed",
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
        <div className="grid grid-cols-1 gap-2 text-base md:grid-cols-3">
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

      {notice && <p className="text-base text-green-700">{notice}</p>}
      {error && <p className="text-base text-red-700">{error}</p>}

      <form className="box bg-white/70 p-3 text-base" onSubmit={handleCreateTask}>
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
              setCreateDraft((prev) => ({ ...prev, status: event.target.value }))
            }
            className="border bg-transparent px-2"
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <select
            value={createDraft.priority}
            onChange={(event) =>
              setCreateDraft((prev) => ({ ...prev, priority: event.target.value }))
            }
            className="border bg-transparent px-2"
          >
            {priorityOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={createDraft.dueDate}
            onChange={(event) =>
              setCreateDraft((prev) => ({ ...prev, dueDate: event.target.value }))
            }
            className="border px-2"
            required
          />
        </div>
        {scope === "owned" && (
          <select
            value={createDraft.assigneeId}
            onChange={(event) =>
              setCreateDraft((prev) => ({ ...prev, assigneeId: event.target.value }))
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
        {tasks.length === 0 ? (
          <div className="box bg-white/70 p-3">
            No {scope === "owned" ? "owned" : "assigned"} tasks found.
          </div>
        ) : (
          tasks.map((task) => {
            const isEditing = editingTaskId === task.id;
            const linkedGoals = (task.goalLinks ?? [])
              .map((link) => link.goal)
              .filter((goal): goal is NonNullable<typeof goal> => Boolean(goal));

            return (
              <article key={task.id} className="box bg-white/80 p-3">
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
                            prev ? { ...prev, status: event.target.value } : prev,
                          )
                        }
                        className="border bg-transparent px-2"
                      >
                        {statusOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <select
                        value={editDraft.priority}
                        onChange={(event) =>
                          setEditDraft((prev) =>
                            prev ? { ...prev, priority: event.target.value } : prev,
                          )
                        }
                        className="border bg-transparent px-2"
                      >
                        {priorityOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <input
                        type="date"
                        value={editDraft.dueDate}
                        onChange={(event) =>
                          setEditDraft((prev) =>
                            prev ? { ...prev, dueDate: event.target.value } : prev,
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
                            prev ? { ...prev, assigneeId: event.target.value } : prev,
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
                    <h3 className="text-2xl font-semibold">{task.title}</h3>
                    <p>Status: {task.status}</p>
                    <p>Priority: {task.priority}</p>
                    <p>Due: {toDisplayDate(task.dueDate)}</p>
                    <p>Owner: {usernameById.get(task.ownerId) ?? "Unknown"}</p>
                    <p>Assigned to: {usernameById.get(task.assigneeId) ?? "Unknown"}</p>
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
