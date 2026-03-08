"use client";

import { useState } from "react";
import type User from "~/models/user.model";
import { getUserByIdAction } from "~/actions/user";

const useGetUserById = () => {
const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getUserById = async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getUserByIdAction(userId);
      if (!result.success) {
        setError(result.error ?? "An error occurred");
        setUser(null);
        return;
      }

      setUser(result.data ?? null);
    } catch (error) {
      console.error(error);
      setError("An error occurred");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return { getUserById, user, loading, error };
};

export default useGetUserById;
