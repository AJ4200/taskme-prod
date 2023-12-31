import { useState } from "react";
import axios from "axios";

const useDeleteTask = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteTask = async (taskId: string) => {
    setLoading(true);
    try {
      await axios.delete(`/api/task/deletetask/${taskId}`);
    } catch (error: any) {
      setError(error.response.data.error || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return { deleteTask, loading, error };
};

export default useDeleteTask;
