import React, { useState } from "react";
import useCreateTask from "~/hooks/task/useCreateTask";
import Task from "~/models/task.model";

interface TaskModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onRequestClose }) => {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [dueDate, setDueDate] = useState("");

  const { createTask, loading, error } = useCreateTask();

  const ownerId = sessionStorage.getItem("userId");
  console.log("OwnerId:", ownerId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const newTask: Task = {
        title,
        status,
        priority,
        dueDate: new Date(dueDate),
        ownerId: ownerId || "",
        assigneeId: "65857e398d21712cc0b34ef1",
      };
      console.log(newTask);
      await createTask(newTask);

      setTitle("");
      setStatus("");
      setPriority("");
      setDueDate("");

      onRequestClose();
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

  return (
    <dialog
      open={isOpen}
      className="fixed top-0 flex h-full w-full items-center justify-center bg-transparent p-4"
    >
      <form onSubmit={handleSubmit} className="notepad">
        <div className="top flex items-center justify-between">
          <h1 className="text-4xl text-gray-300">
            Task.Me<span className="text-sm">create task</span>
          </h1>
          <button
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
            className="mb-4 w-full border px-3 py-2"
            required
          />

          <label className="mb-2 block">Status:</label>
          <input
            type="text"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mb-4 w-full border px-3 py-2"
            required
          />

          <label className="mb-2 block">Priority:</label>
          <input
            type="text"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="mb-4 w-full border px-3 py-2"
            required
          />

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
            className="rounded bg-gray-500 px-4 py-2 text-white"
          >
            {loading ? "Creating..." : "Create Task"}
          </button>

          {error && <p className="mt-2 text-red-500">{error}</p>}
        </div>
      </form>
    </dialog>
  );
};

export default TaskModal;
