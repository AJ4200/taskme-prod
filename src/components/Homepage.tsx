"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaGithub, FaLinkedin, FaRegHandPointDown } from "react-icons/fa";

const Homepage: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const userId = sessionStorage.getItem("userId");

    if (token && userId) {
      router.replace("/tasks");
    }
  }, [router]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="notepad"
    >
      <div className="top">
        <div className="flex justify-center">
          <div className="flex items-center">
            <div className="ml-2 flex items-center space-x-1">
              <motion.a
                href="https://github.com/aj4200"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1 }}
              >
                <FaGithub className="text-lg text-gray-300 hover:opacity-50" />
              </motion.a>

              <motion.a
                href="https://www.linkedin.com/in/abel-majadibodu-5a0583193/"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1 }}
              >
                <FaLinkedin className="text-lg text-gray-300 hover:opacity-50" />
              </motion.a>
            </div>{" "}
            <Link href="/">
              <h1 className="text-center text-4xl text-gray-300">
                Task.Me<span className="text-xs">alpha 1.2</span>
              </h1>
            </Link>
          </div>
        </div>
      </div>
      <div className="paper">
        <h1 className="mb-10 text-center text-6xl underline">Welcome!!!</h1>
        <div className="flex justify-evenly">
          <div>
            <p className="mb-4 text-lg font-semibold">Get to tasking</p>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => router.push("/login")}
              className="ml-8 flex flex-col items-center underline underline-offset-[10px]"
            >
              <FaRegHandPointDown />Login
            </motion.button>
          </div>
          <div>
            <p className="mb-4 text-lg font-semibold">New to Task.Me?</p>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => router.push("/register")}
              className="ml-8 flex flex-col items-center underline underline-offset-[10px]"
            >
              <FaRegHandPointDown /> Register
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Homepage;
