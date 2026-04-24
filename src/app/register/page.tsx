"use client";

import React, { useEffect, useState } from "react";
import { IoMdPersonAdd } from "react-icons/io";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { registerAction } from "~/actions/auth";
import { setPendingNotification, useNotifications } from "~/components/providers/NotificationProvider";

interface RegisterForm {
  username: string;
  email: string;
  password: string;
}

export default function RegisterPage() {
  const {
    register,
    handleSubmit,
  } = useForm<RegisterForm>();
  const router = useRouter();
  const { error: notifyError, warning: notifyWarning } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

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
      const result = await registerAction(data);
      if (!result.success || !result.user || !result.token) {
        const message = result.error ?? "Registration failed. Please try again.";
        notifyError(message);
        return;
      }

      const { user } = result;
      sessionStorage.setItem("userId", result.user.id);
      sessionStorage.setItem("token", result.token);
      sessionStorage.setItem("username", result.user.username);
      console.log("Registration successful:", user);

      setPendingNotification("success", "Account created successfully.");
      router.push("/tasks");
    } catch (error) {
      const message = "Registration failed. Please try again.";
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
      <form
        onSubmit={handleSubmit(onSubmit, (formErrors) => {
          const firstError =
            formErrors.username?.message ??
            formErrors.email?.message ??
            formErrors.password?.message ??
            "Please check the form.";
          notifyWarning(firstError);
        })}
        className="notepad relative"
      >
        <div className="top">
          <h1 className="text-center text-4xl text-gray-300">Task.Me---Register</h1>
        </div>
        <div className="paper">
          <p className="mb-4 text-center text-lg font-semibold">
            Create your workspace and start shipping tasks.
          </p>
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
          <label htmlFor="email" className="mt-2 text-sm font-semibold">
            Email
          </label>
          <input
            id="email"
            type="email"
            {...register("email", { required: "Email is required" })}
            placeholder="________"
            autoComplete="email"
          />
          <label htmlFor="password" className="mt-2 text-sm font-semibold">
            Password
          </label>
          <input
            id="password"
            type="password"
            {...register("password", { required: "Password is required" })}
            placeholder="________"
            autoComplete="new-password"
          />
          <motion.button
            type="submit"
            className="relative mx-auto mt-3 flex w-1/2 box items-center justify-center bg-gray-700/50 text-2xl"
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
          <p className="mt-3 flex items-center justify-center text-base">
            Already have an account?{" "}
            <Link className="underline underline-offset-4" href="/login">
              Login instead
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
