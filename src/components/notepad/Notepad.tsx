"use client";

import React, { useEffect, useState } from "react";
import AccountabilityBoard from "./AccountabilityBoard";
import { motion } from "framer-motion";
import Link from "next/link";
import { FaBell, FaGithub, FaLinkedin, FaTasks, FaUserFriends } from "react-icons/fa";
import ProfileOptions from "./ProfileOptions";
import TasksBoard from "./TasksBoard";
import multiavatar from "@multiavatar/multiavatar/esm";
import InboxBoard from "./InboxBoard";
import { listFriendConnectionsAction } from "~/actions/accountability";
import { getAllTasksAction } from "~/actions/task";

const Notepad: React.FC = () => {
  const [view, setView] = useState<"tasks" | "accountability" | "inbox">("tasks");
  const [username, setUsername] = useState<string | null>(null);
  const [options, setOptions] = useState(false);
  const [alertText, setAlertText] = useState("");

  useEffect(() => {
    setUsername(sessionStorage.getItem("username"));
  }, []);

  useEffect(() => {
    const userId = sessionStorage.getItem("userId");
    if (!userId) return;

    const poll = async () => {
      const [friendResult, taskResult] = await Promise.all([
        listFriendConnectionsAction(userId),
        getAllTasksAction(undefined, userId),
      ]);

      const incomingRequests = friendResult.success
        ? (
            ((friendResult.data as Array<{ status: string; isIncoming: boolean }> | undefined) ??
              []
            ).filter((row) => row.status === "PENDING" && row.isIncoming).length
          )
        : 0;

      const assignedTasks = taskResult.success
        ? (
            ((taskResult.data as Array<{ ownerId: string; assigneeId: string }> | undefined) ??
              []
            ).filter((task) => task.ownerId !== task.assigneeId).length
          )
        : 0;

      const nextAlertParts: string[] = [];
      if (incomingRequests > 0) {
        nextAlertParts.push(
          `${incomingRequests} friend request${incomingRequests > 1 ? "s" : ""} waiting`,
        );
      }
      if (assignedTasks > 0) {
        nextAlertParts.push(
          `${assignedTasks} assigned task${assignedTasks > 1 ? "s" : ""} in your inbox`,
        );
      }
      setAlertText(nextAlertParts.join(" | "));
    };

    void poll();
    const intervalId = window.setInterval(() => void poll(), 15000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="notepad relative">
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
                  view === "inbox" ? "bg-amber-100" : "bg-gray-100"
                }`}
                onClick={() => setView("inbox")}
              >
                <FaBell className="text-sm" />
                Inbox
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

          <div className="my-2 mr-2 flex items-center">
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
                <svg
                  className="w-8 h-8 rounded-full object-cover"
                  dangerouslySetInnerHTML={{ __html: multiavatar(username || "") }}
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
        ) : view === "accountability" ? (
          <AccountabilityBoard />
        ) : (
          <InboxBoard />
        )}
      </div>
      <div className="pointer-events-none absolute bottom-2 right-3 min-h-5 bg-transparent text-right text-xs text-red-700">
        {alertText && <p>{alertText}</p>}
      </div>
    </div>
  );
};

export default Notepad;
