import React, { useState } from "react";
import axios from "axios";
import { IoMdPersonAdd } from "react-icons/io";
import { motion } from "framer-motion";
import { useRouter } from "next/router";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post("/api/auth/register", {
        username,
        email,
        password,
      });
      const { token, user } = response.data;

      // Set the token as an HttpOnly cookie
      document.cookie = `token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict`;
        sessionStorage.setItem("userId", response.data.user.id);
        sessionStorage.setItem("token", response.data.token);
        sessionStorage.setItem("username", response.data.user.username);
      console.log("Registration successful:", user);

      // redirect
      router.push("/tasks");
    } catch (error) {
      console.error(error);
      // Handle registration error here
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center  ">
      <form onSubmit={handleSubmit} className="notepad">
        <div className="top">
          <h1 className="text-center text-4xl text-gray-300">
            Task.Me---Register
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
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
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
            <IoMdPersonAdd className="mr-2" />
          </motion.div>
          Register
        </motion.button>
      </form>
    </div>
  );
};

export default Register;
