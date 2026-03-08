"use client";

import React, { useEffect, useState } from "react";
import { IoMdPersonAdd } from "react-icons/io";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { registerAction } from "~/actions/auth";

interface RegisterForm {
  username: string;
  email: string;
  password: string;
}

export default function RegisterPage() {
  const { register, handleSubmit } = useForm<RegisterForm>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const userId = sessionStorage.getItem("userId");

    if (token && userId) {
      router.replace("/tasks");
      return;
    }

    setIsReady(true);
  }, [router]);

  const onSubmit = async (data: RegisterForm) => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const result = await registerAction(data);
      if (!result.success || !result.user || !result.token) {
        setErrorMessage(result.error ?? "Registration failed. Please try again.");
        return;
      }

      const { user } = result;
      sessionStorage.setItem("userId", result.user.id);
      sessionStorage.setItem("token", result.token);
      sessionStorage.setItem("username", result.user.username);
      console.log("Registration successful:", user);

      router.push("/tasks");
    } catch (error) {
      setErrorMessage("Registration failed. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!isReady) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <form onSubmit={handleSubmit(onSubmit)} className="notepad">
        <div className="top">
          <h1 className="text-center text-4xl text-gray-300">Task.Me---Register</h1>
        </div>
        <div className="paper">
          <input
            type="text"
            {...register("username", { required: true })}
            placeholder="Username"
          />
          <input
            type="email"
            {...register("email", { required: true })}
            placeholder="Email"
          />
          <input
            type="password"
            {...register("password", { required: true })}
            placeholder="Password"
          />
          {errorMessage && <p className="mt-2 text-red-600">{errorMessage}</p>}
        </div>

        <motion.button
          type="submit"
          className="relative flex w-full items-center justify-center bg-white text-2xl"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          {loading && <div className="loader absolute" />}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <IoMdPersonAdd className="mr-2" />
          </motion.div>
          Register
        </motion.button>
      </form>
    </div>
  );
}
