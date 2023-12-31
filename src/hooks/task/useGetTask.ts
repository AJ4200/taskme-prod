import { useState } from "react";
import axios from "axios";

const useGetTask = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTask = async (
    taskId: string,
    ownerId?: string,
    assigneeId?: string,
  ) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/task/gettask/${taskId}`, {
        params: { ownerId, assigneeId },
      });
      return response.data;
    } catch (error: any) {
      setError(error.response.data.error || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return { getTask, loading, error };
};

export default useGetTask;
