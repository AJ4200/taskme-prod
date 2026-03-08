"use client";

import React, { useEffect, useState } from "react";
import OwnedTasks from "./OwnedTasks";
import AssignedTasks from "./AssignedTasks";
import TaskModal from "./TaskModal";
import { motion } from "framer-motion";
import Link from "next/link";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import ProfileOptions from "./ProfileOptions";

const Notepad: React.FC = () => {
  const [isOwnedTasks, setOwnedTasks] = useState<boolean>(false);
  const [isTaskModalOpen, setTaskModalOpen] = useState<boolean>(false);
  const [username, setUsername] = useState<string | null>(null);
  const [options, setOptions] = useState(false);

  useEffect(() => {
    setUsername(sessionStorage.getItem("username"));
  }, []);

  const handleToggle = () => {
    setOwnedTasks(!isOwnedTasks);
  };

  const handleOpenTaskModal = () => {
    setTaskModalOpen(true);
  };

  const handleCloseTaskModal = () => {
    setTaskModalOpen(false);
  };

  return (
    <div className="notepad">
      <div className="top">
        <div className="flex justify-between">
          {username ? (
            <button
              className="flip my-2 ml-2 h-[50%] w-[6rem] bg-gray-400 p-2"
              onClick={handleToggle}
            >
              {isOwnedTasks ? "Assigned" : "Owned"}
            </button>
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
        <button className="box p-2 font-bold" onClick={handleOpenTaskModal}>
          Create Task
        </button>
        {isOwnedTasks ? <OwnedTasks /> : <AssignedTasks />}
      </div>
      {isTaskModalOpen && (
        <TaskModal
          isOpen={isTaskModalOpen}
          onRequestClose={handleCloseTaskModal}
        />
      )}
    </div>
  );
};

export default Notepad;
