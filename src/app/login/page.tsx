"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { IoMdLogIn } from "react-icons/io";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { type SubmitHandler, useForm } from "react-hook-form";
import { loginAction } from "~/actions/auth";
import { setPendingNotification, useNotifications } from "~/components/providers/NotificationProvider";

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
  const { error: notifyError } = useNotifications();
  const [loading, setLoading] = React.useState(false);
  const [isReady, setIsReady] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

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
      setErrorMessage(null);
      const result = await loginAction(data);

      if (result.success && result.user && result.token) {
        sessionStorage.setItem("userId", result.user.id);
        sessionStorage.setItem("token", result.token);
        sessionStorage.setItem("username", result.user.username);
        setPendingNotification("success", "Logged in successfully.");
        router.push("/tasks");
      } else {
        const message = result.error ?? "Login failed. Please try again.";
        setErrorMessage(message);
        notifyError(message);
      }
    } catch (error) {
      const message = "Login failed. Please try again.";
      setErrorMessage(message);
      notifyError(message);
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
      <form className="notepad relative" onSubmit={handleSubmit(onSubmit)}>
        <div className="top">
          <h1 className="text-center text-4xl text-gray-300">Task.Me---Login</h1>
        </div>
        <div className="paper">
          <p className="mb-4 text-center text-lg font-semibold">
            Welcome back. Pick up right where you left off.
          </p>
          <div className="mb-4 flex flex-col gap-2">
            <div className="flex gap-2">
              <label htmlFor="username" className="text-sm font-semibold">
              Username
              </label>
              <input
                id="username"
                type="text"
                {...register("username", { required: "Username is required" })}
                placeholder="_______"
                autoComplete="username"
              />
            </div>

            <div className="flex gap-2">
              <label htmlFor="password" className="mt-2 text-sm font-semibold">
                Password
              </label>
              <input
                id="password"
                type="password"
                {...register("password", { required: "Password is required" })}
                placeholder="________"
                autoComplete="current-password"
              />
            </div>
            <motion.button
              type="submit"
              className="box relative mx-auto mt-3 flex w-1/2 items-center justify-center bg-gray-700/50 text-2xl"
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
            <p className="mt-3 flex items-center justify-center text-base">
              New here?{" "}
              <Link className="underline underline-offset-4" href="/register">
                Create an account
              </Link>
            </p>
          </div>

        </div>
        <div className="pointer-events-none absolute bottom-2 right-3 min-h-5 bg-transparent text-right text-xs text-red-700">
          {errors.username?.message && <p>{errors.username.message}</p>}
          {errors.password?.message && <p>{errors.password.message}</p>}
          {errorMessage && <p>{errorMessage}</p>}
        </div>
      </form>
    </div>
  );
}
