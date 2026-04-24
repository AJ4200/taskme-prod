"use client";

import { TaskPriority, TaskStatus } from "@prisma/client";
import React, { useState } from "react";
import useCreateTask from "~/hooks/task/useCreateTask";
import type Task from "~/models/task.model";
import { useNotifications } from "../providers/NotificationProvider";

interface TaskModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onRequestClose }) => {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.TODO);
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [dueDate, setDueDate] = useState("");

  const { createTask, loading, error } = useCreateTask();
  const { success: notifySuccess, error: notifyError, warning: notifyWarning } = useNotifications();
  const ownerId = sessionStorage.getItem("userId");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ownerId) {
      notifyWarning("You need to log in to create tasks.");
      return;
    }

    try {
      const newTask: Task = {
        title,
        status,
        priority,
        dueDate: new Date(dueDate),
        ownerId,
        assigneeId: ownerId,
      };

      const created = await createTask(newTask);
      if (!created) {
        notifyError(error ?? "Failed to create task.");
        return;
      }

      setTitle("");
      setStatus(TaskStatus.TODO);
      setPriority(TaskPriority.MEDIUM);
      setDueDate("");

      notifySuccess(`Task "${title}" created.`);
      onRequestClose();
    } catch (createError) {
      console.error("Error creating task:", createError);
      notifyError("Failed to create task.");
    }
  };

  return (
    <dialog
      open={isOpen}
      className="fixed top-0 flex h-full w-full items-center justify-center bg-transparent p-4"
    >
      <form onSubmit={handleSubmit} className="notepad">
        <div className="top flex items-center justify-between">
          <span className="px-2 text-sm text-gray-300">+</span>
          <h1 className="text-center text-4xl text-gray-300">Create Task</h1>
          <button
            type="button"
            className="text-8xl text-gray-500 hover:text-gray-700"
            onClick={onRequestClose}
          >
            &times;
          </button>
        </div>
        <div className="paper">
          <label className="mb-2 block">Title:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mb-4 w-full border border-b-inherit px-3 py-2"
            required
          />

          <label className="mb-2 block">Status:</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            className="mb-4 w-full border px-3 py-2"
          >
            <option value={TaskStatus.TODO}>Todo</option>
            <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
            <option value={TaskStatus.BLOCKED}>Blocked</option>
            <option value={TaskStatus.COMPLETED}>Completed</option>
          </select>

          <label className="mb-2 block">Priority:</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className="mb-4 w-full border px-3 py-2"
          >
            <option value={TaskPriority.LOW}>Low</option>
            <option value={TaskPriority.MEDIUM}>Medium</option>
            <option value={TaskPriority.HIGH}>High</option>
          </select>

          <label className="mb-2 block">Due Date:</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="mb-4 w-full border px-3 py-2"
            required
          />

          <button
            type="submit"
            className="flip text-lg text-white text-shadow opacity-70"
            disabled={!ownerId}
          >
            {loading ? "Creating..." : "Create Task"}
          </button>
        </div>
      </form>
    </dialog>
  );
};

export default TaskModal;
