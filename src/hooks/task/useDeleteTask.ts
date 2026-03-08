"use client";

import { useState } from "react";
import { deleteTaskAction } from "~/actions/task";

const useDeleteTask = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteTask = async (taskId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await deleteTaskAction(taskId);
      if (!result.success) {
        setError(result.error ?? "An error occurred");
      }
    } catch (error) {
      console.error(error);
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return { deleteTask, loading, error };
};

export default useDeleteTask;
