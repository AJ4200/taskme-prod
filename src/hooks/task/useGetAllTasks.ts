"use client";

import { useState } from "react";
import { getAllTasksAction } from "~/actions/task";

const useGetAllTasks = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAllTasks = async (ownerId?: string, assigneeId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAllTasksAction(ownerId, assigneeId);
      if (!result.success) {
        setError(result.error ?? "An error occurred");
        return [];
      }

      return result.data ?? [];
    } catch (error) {
      console.error(error);
      setError("An error occurred");
      return [];
    } finally {
      setLoading(false);
    }
  };

  return { getAllTasks, loading, error };
};

export default useGetAllTasks;
