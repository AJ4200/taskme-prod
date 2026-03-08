"use client";

import { useState } from "react";
import { updateTaskAction } from "~/actions/task";

const useUpdateTask = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateTask = async (taskId: string, taskData: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await updateTaskAction(taskId, {
        ...taskData,
        dueDate:
          taskData?.dueDate instanceof Date
            ? taskData.dueDate.toISOString()
            : taskData?.dueDate,
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

  return { updateTask, loading, error };
};

export default useUpdateTask;
