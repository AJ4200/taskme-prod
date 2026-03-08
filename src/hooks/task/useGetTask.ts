"use client";

import { useState } from "react";
import { getTaskAction } from "~/actions/task";

const useGetTask = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTask = async (
    taskId: string,
    _ownerId?: string,
    _assigneeId?: string,
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getTaskAction(taskId);
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

  return { getTask, loading, error };
};

export default useGetTask;
