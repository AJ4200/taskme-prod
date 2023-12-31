import { useState } from "react";
import axios from "axios";

const useGetAllTasks = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAllTasks = async (ownerId?: string, assigneeId?: string) => {
    setLoading(true);
    try {
      const response = await axios.get("/api/task/getalltasks", {
        params: { ownerId, assigneeId },
      });
      return response.data;
    } catch (error: any) {
      setError(error.response?.data?.error || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return { getAllTasks, loading, error };
};

export default useGetAllTasks;
