import React, { useState } from "react";
import OwnedTasks from "./OwnedTasks";
import AssignedTasks from "./AssignedTasks";
import TaskModal from "./TaskModal";
import { motion } from "framer-motion";
import { FaGithub, FaLinkedin } from "react-icons/fa";

const Notepad: React.FC = () => {
  const [isOwnedTasks, setOwnedTasks] = useState<boolean>(false);
  const [isTaskModalOpen, setTaskModalOpen] = useState<boolean>(false);
  const username =
    typeof window !== "undefined" ? sessionStorage.getItem("username") : null;
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
          <button
            className="flip my-2 ml-2 h-[50%] bg-gray-400 p-2 w-[6rem]"
            onClick={handleToggle}
          >
            {isOwnedTasks ? "Assigned" : "Owned"}
          </button>
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
            <a href="/">
              <h1 className="text-center text-4xl text-gray-300">
                Task.Me<span className="text-xs">alpha</span>
              </h1>
            </a>
          </div>

          <div className="my-2 mr-2 flex">
            {username != null ? (
              <p className="mt-2 mr-2 text-lg font-bold text-gray-200">{username}</p>
            ) : (
              "Login"
            )}
            <img
              className=" w-10 rounded-full object-cover"
              src={`https://api.multiavatar.com/${username}.svg`}
            />
          </div>
        </div>
      </div>
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
