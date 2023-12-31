import React, { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { IoMdLogIn } from "react-icons/io";
import { useRouter } from "next/router";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post("/api/auth/login", {
        username,
        password,
      });

      // Redirect if login successful
      if (response.status === 200) {
        console.log("Login successful:", response.data.user);
        sessionStorage.setItem("userId", response.data.user.id);
        sessionStorage.setItem("token", response.data.token);
        sessionStorage.setItem("username", response.data.user.username);
        // Redirect to the tasks page
        router.push("/tasks");
      }
    } catch (error) {
      console.error(error);
      // Handle login error here
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <form className="notepad" onSubmit={handleSubmit}>
        <div className="top">
          <h1 className="text-center text-4xl text-gray-300">
            Task.Me---Login
          </h1>
        </div>
        <div className="paper">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
        </div>
        <motion.button
          type="submit"
          className="flex w-full items-center justify-center bg-white text-2xl"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
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
