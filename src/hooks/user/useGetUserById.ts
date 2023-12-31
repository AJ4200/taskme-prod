import { useState } from "react";
import axios from "axios";
import User from "~/models/user.model";

const useGetUserById = () => {
const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getUserById = async (userId: string) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/user/getuserbyid?userId=${userId}`);
      setUser(response.data);
    } catch (error: any) {
      setError(error.response?.data?.error || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return { getUserById, user, loading, error };
};

export default useGetUserById;
