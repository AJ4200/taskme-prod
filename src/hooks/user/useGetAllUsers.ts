import { useState } from "react";
import axios from "axios";

const useGetAllUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAllUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/user/getallusers");
      setUsers(response.data);
    } catch (error: any) {
      setError(error.response?.data?.error || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return { getAllUsers, users, loading, error };
};

export default useGetAllUsers;
