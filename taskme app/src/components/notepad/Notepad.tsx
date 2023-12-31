import React, { useState } from "react";
import OwnedTasks from "./OwnedTasks";
import AssignedTasks from "./AssignedTasks";
import TaskModal from "./TaskModal";

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
          <button className="h-[50%] bg-gray-400 p-2" onClick={handleToggle}>
            {isOwnedTasks ? "assignedtasks" : "OwnedTasks"}
          </button>
          <a href="/">
            <h1 className="text-center text-4xl text-gray-300">
              Task.Me<span className="text-xs">alpha</span>
            </h1>
          </a>

          <div className="my-2 mr-2 flex">
            {username != null ? (
              <p className="m-1 text-lg font-bold text-gray-200">{username}</p>
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
