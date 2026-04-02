"use client";

import type { TaskPriority, TaskStatus } from "@prisma/client";
import React, { useState } from "react";
import useCreateTask from "~/hooks/task/useCreateTask";
import type Task from "~/models/task.model";

interface TaskModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onRequestClose }) => {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<TaskStatus>("TODO");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [dueDate, setDueDate] = useState("");

  const { createTask, loading, error } = useCreateTask();
  const ownerId = sessionStorage.getItem("userId");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ownerId) {
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

      await createTask(newTask);

      setTitle("");
      setStatus("TODO");
      setPriority("MEDIUM");
      setDueDate("");

      onRequestClose();
    } catch (createError) {
      console.error("Error creating task:", createError);
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
            <option value="TODO">Todo</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="BLOCKED">Blocked</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <label className="mb-2 block">Priority:</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className="mb-4 w-full border px-3 py-2"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
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

          {error && <p className="mt-2 text-red-500">{error}</p>}
          {!ownerId && (
            <p className="mt-2 text-red-500">You need to log in to create tasks.</p>
          )}
        </div>
      </form>
    </dialog>
  );
};

export default TaskModal;
