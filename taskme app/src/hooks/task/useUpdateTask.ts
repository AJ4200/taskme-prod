import { useState } from "react";
import axios from "axios";

const useUpdateTask = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateTask = async (taskId: string, taskData: any) => {
    setLoading(true);
    try {
      const response = await axios.put(
        `/api/task/updatetask?taskId=${taskId}`,
        taskData,
      );
      return response.data;
    } catch (error: any) {
      setError(error.response.data.error || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return { updateTask, loading, error };
};

export default useUpdateTask;
