"use client";

import { useState } from "react";
import { getAllUsersAction } from "~/actions/user";
import type User from "~/models/user.model";

const useGetAllUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAllUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAllUsersAction();
      if (!result.success) {
        setError(result.error ?? "An error occurred");
        setUsers([]);
        return;
      }

      setUsers((result.data as User[] | undefined) ?? []);
    } catch (error) {
      console.error(error);
      setError("An error occurred");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  return { getAllUsers, users, loading, error };
};

export default useGetAllUsers;
