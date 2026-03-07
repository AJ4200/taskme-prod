import React from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { IoMdLogIn } from "react-icons/io";
import { useRouter } from "next/router";
import { useForm, SubmitHandler } from "react-hook-form";

interface LoginForm {
  username: string;
  password: string;
}

const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const onSubmit: SubmitHandler<LoginForm> = async (data) => {
    try {
      setLoading(true);

      const response = await axios.post("/api/auth/login", data);

      if (response.status === 200) {
        console.log("Login successful:", response.data.user);
        sessionStorage.setItem("userId", response.data.user.id);
        sessionStorage.setItem("token", response.data.token);
        sessionStorage.setItem("username", response.data.user.username);
        router.push("/tasks");
      }
    } catch (error) {
      console.error(error);
      // Handle login error here
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <form className="notepad" onSubmit={handleSubmit(onSubmit)}>
        <div className="top">
          <h1 className="text-center text-4xl text-gray-300">
            Task.Me---Login
          </h1>
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
};

export default Login;
