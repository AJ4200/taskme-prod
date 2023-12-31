import { useState } from "react";
import axios from "axios";
import Task from "~/models/task.model";

const useCreateTask = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTask = async (taskData: Task) => {
    setLoading(true);
    try {
      const response = await axios.post("/api/task/createtask", taskData); 
      return response.data;
    } catch (error: any) {
      setError(error.response.data.error || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return { createTask, loading, error };
};

export default useCreateTask;
