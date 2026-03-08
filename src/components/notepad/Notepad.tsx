"use client";

import React, { useEffect, useState } from "react";
import AccountabilityBoard from "./AccountabilityBoard";
import { motion } from "framer-motion";
import Link from "next/link";
import { FaGithub, FaLinkedin, FaTasks, FaUserFriends } from "react-icons/fa";
import ProfileOptions from "./ProfileOptions";
import TasksBoard from "./TasksBoard";

const Notepad: React.FC = () => {
  const [view, setView] = useState<"tasks" | "accountability">("tasks");
  const [username, setUsername] = useState<string | null>(null);
  const [options, setOptions] = useState(false);

  useEffect(() => {
    setUsername(sessionStorage.getItem("username"));
  }, []);

  return (
    <div className="notepad">
      <div className="top">
        <div className="flex justify-between">
          {username ? (
            <div className="my-2 ml-2 flex items-center gap-2">
              <button
                className={`box flex items-center gap-2 px-3 ${
                  view === "tasks" ? "bg-amber-100" : "bg-gray-100"
                }`}
                onClick={() => setView("tasks")}
              >
                <FaTasks className="text-sm" />
                Tasks
              </button>
              <button
                className={`box flex items-center gap-2 px-3 ${
                  view === "accountability" ? "bg-amber-100" : "bg-gray-100"
                }`}
                onClick={() => setView("accountability")}
              >
                <FaUserFriends className="text-sm" />
                Partners
              </button>
            </div>
          ) : (
            <Link className="flip m-2" href="/register">
              Register
            </Link>
          )}

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

          <div className="my-2 mr-2 flex">
            {username ? (
              <motion.button
                type="button"
                className="flex"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setOptions(!options);
                }}
              >
                <p className="mr-2 mt-2 text-lg font-bold text-gray-200">
                  {username}
                </p>
                <img
                  className="w-10 rounded-full object-cover"
                  src={`https://api.multiavatar.com/${username}.svg`}
                  alt={`${username} avatar`}
                />
              </motion.button>
            ) : (
              <Link className="flip" href="/login">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
      {options && <ProfileOptions />}
      <div className="paper">
        {view === "tasks" ? (
          <TasksBoard onOpenAccountability={() => setView("accountability")} />
        ) : (
          <AccountabilityBoard />
        )}
      </div>
    </div>
  );
};

export default Notepad;
