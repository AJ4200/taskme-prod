"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { IoMdLogIn } from "react-icons/io";
import { useRouter } from "next/navigation";
import { type SubmitHandler, useForm } from "react-hook-form";
import { loginAction } from "~/actions/auth";

interface LoginForm {
  username: string;
  password: string;
}

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [isReady, setIsReady] = React.useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const userId = sessionStorage.getItem("userId");

    if (token && userId) {
      router.replace("/tasks");
      return;
    }

    setIsReady(true);
  }, [router]);

  const onSubmit: SubmitHandler<LoginForm> = async (data) => {
    try {
      setLoading(true);
      const result = await loginAction(data);

      if (result.success && result.user && result.token) {
        sessionStorage.setItem("userId", result.user.id);
        sessionStorage.setItem("token", result.token);
        sessionStorage.setItem("username", result.user.username);
        router.push("/tasks");
      } else {
        console.error(result.error ?? "Login failed");
      }
    } catch (error) {
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
      <form className="notepad" onSubmit={handleSubmit(onSubmit)}>
        <div className="top">
          <h1 className="text-center text-4xl text-gray-300">Task.Me---Login</h1>
        </div>
        <div className="paper">
          <input
            type="text"
            {...register("username", { required: "Username is required" })}
            placeholder="Username"
          />
          {errors.username && (
            <span className="text-red-500">{errors.username.message}</span>
          )}

          <input
            type="password"
            {...register("password", { required: "Password is required" })}
            placeholder="Password"
          />
          {errors.password && (
            <span className="text-red-500">{errors.password.message}</span>
          )}
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
            <IoMdLogIn className="mr-2" />
          </motion.div>
          Login
        </motion.button>
      </form>
    </div>
  );
}
