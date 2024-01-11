import React, { useState } from "react";
import axios from "axios";
import { IoMdPersonAdd } from "react-icons/io";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";

const Register = () => {
  const { register, handleSubmit } = useForm();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);
      const response = await axios.post("/api/auth/register", data);
      const { token, user } = response.data;

      // Set the token as an HttpOnly cookie
      document.cookie = `token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict`;
      sessionStorage.setItem("userId", response.data.user.id);
      sessionStorage.setItem("token", response.data.token);
      sessionStorage.setItem("username", response.data.user.username);
      console.log("Registration successful:", user);

      // Redirect
      router.push("/tasks");
    } catch (error) {
      console.error(error);
      // Handle registration error here
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center  ">
      <form onSubmit={handleSubmit(onSubmit)} className="notepad">
        <div className="top">
          <h1 className="text-center text-4xl text-gray-300">
            Task.Me---Register
          </h1>
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
};

export default Register;
