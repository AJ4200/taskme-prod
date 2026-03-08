"use client";

import { useState } from "react";
import type Task from "~/models/task.model";
import { createTaskAction } from "~/actions/task";

const useCreateTask = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTask = async (taskData: Task) => {
    setLoading(true);
    setError(null);
    try {
      const result = await createTaskAction({
        ...taskData,
        dueDate:
          taskData.dueDate instanceof Date
            ? taskData.dueDate.toISOString()
            : taskData.dueDate,
      });

      if (!result.success) {
        setError(result.error ?? "An error occurred");
        return null;
      }

      return result.data;
    } catch (error) {
      console.error(error);
      setError("An error occurred");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createTask, loading, error };
};

export default useCreateTask;
