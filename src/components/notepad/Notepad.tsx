"use client";

import React, { useEffect, useState } from "react";
import { ConnectionStatus } from "@prisma/client";
import AccountabilityBoard from "./AccountabilityBoard";
import { motion } from "framer-motion";
import Link from "next/link";
import { FaBell, FaGithub, FaLinkedin, FaTasks } from "react-icons/fa";
import ProfileOptions from "./ProfileOptions";
import TasksBoard from "./TasksBoard";
import multiavatar from "@multiavatar/multiavatar/esm";
import InboxBoard from "./InboxBoard";
import { listFriendConnectionsAction } from "~/actions/accountability";
import { getAllTasksAction } from "~/actions/task";
import { useNotifications } from "../providers/NotificationProvider";

const Notepad: React.FC = () => {
  const [view, setView] = useState<"tasks" | "accountability" | "inbox">("tasks");
  const [username, setUsername] = useState<string | null>(null);
  const [options, setOptions] = useState(false);
  const { request: notifyRequest, warning: notifyWarning } = useNotifications();

  useEffect(() => {
    setUsername(sessionStorage.getItem("username"));
  }, []);

  useEffect(() => {
    const userId = sessionStorage.getItem("userId");
    if (!userId) return;
    let previousIncomingRequests = 0;
    let previousAssignedTasks = 0;

    const poll = async () => {
      const [friendResult, taskResult] = await Promise.all([
        listFriendConnectionsAction(userId),
        getAllTasksAction(undefined, userId),
      ]);

      const incomingRequests = friendResult.success
        ? (
            ((
              friendResult.data as Array<{
                status: ConnectionStatus;
                isIncoming: boolean;
              }> | undefined
            ) ??
              []
            ).filter((row) => row.status === ConnectionStatus.PENDING && row.isIncoming).length
          )
        : 0;

      const assignedTasks = taskResult.success
        ? (
            ((taskResult.data as Array<{ ownerId: string; assigneeId: string }> | undefined) ??
              []
            ).filter((task) => task.ownerId !== task.assigneeId).length
          )
        : 0;

      if (incomingRequests > previousIncomingRequests) {
        const diff = incomingRequests - previousIncomingRequests;
        notifyRequest(`${diff} new friend request${diff > 1 ? "s" : ""}.`);
      }
      if (assignedTasks > previousAssignedTasks) {
        const diff = assignedTasks - previousAssignedTasks;
        notifyWarning(`${diff} new assigned task${diff > 1 ? "s" : ""}.`);
      }
      previousIncomingRequests = incomingRequests;
      previousAssignedTasks = assignedTasks;
    };

    void poll();
    const intervalId = window.setInterval(() => void poll(), 15000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="notepad relative">
      <header className="top notepad-header">
        <div className="notepad-header-layout">
          {username ? (
            <nav className="notepad-header-nav" aria-label="Notepad views">
              <button
                type="button"
                className={`box flex min-h-11 items-center gap-2 px-3 ${
                  view === "tasks" ? "bg-amber-100" : "bg-gray-100"
                }`}
                aria-pressed={view === "tasks"}
                onClick={() => setView("tasks")}
              >
                <FaTasks className="text-sm" />
                Tasks
              </button>
              <button
                type="button"
                className={`box flex min-h-11 items-center gap-2 px-3 ${
                  view === "inbox" ? "bg-amber-100" : "bg-gray-100"
                }`}
                aria-pressed={view === "inbox"}
                onClick={() => setView("inbox")}
              >
                <FaBell className="text-sm" />
                Inbox
              </button>
            </nav>
          ) : (
            <div className="notepad-header-nav">
              <Link className="flip" href="/register">
                Register
              </Link>
            </div>
          )}

          <div className="notepad-header-brand">
            <div className="flex items-center gap-2">
              <motion.a
                href="https://github.com/aj4200"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                whileHover={{ scale: 1.1 }}
              >
                <FaGithub className="text-lg text-gray-300 hover:opacity-50" />
              </motion.a>

              <motion.a
                href="https://www.linkedin.com/in/abel-majadibodu-5a0583193/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                whileHover={{ scale: 1.1 }}
              >
                <FaLinkedin className="text-lg text-gray-300 hover:opacity-50" />
              </motion.a>
            </div>
            <Link href="/">
              <h1 className="whitespace-nowrap text-center text-3xl text-gray-300">
                Task.Me<span className="text-xs">alpha 1.2</span>
              </h1>
            </Link>
          </div>

          <div className="notepad-header-profile">
            {username ? (
              <motion.button
                type="button"
                className="flex min-h-11 min-w-0 items-center gap-2"
                aria-label={`Profile options for ${username}`}
                aria-expanded={options}
                aria-controls={options ? "profile-options" : undefined}
                title={username}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setOptions((isOpen) => !isOpen);
                }}
              >
                <span className="min-w-0 truncate text-lg font-bold text-gray-200">
                  {username}
                </span>
                <svg
                  className="h-8 w-8 shrink-0 rounded-full object-cover"
                  aria-hidden="true"
                  dangerouslySetInnerHTML={{ __html: multiavatar(username) }}
                />
              </motion.button>
            ) : (
              <Link className="flip" href="/login">
                Login
              </Link>
            )}
          </div>
        </div>
        {options && <ProfileOptions />}
      </header>
      <div className="paper">
        {view === "tasks" ? (
          <TasksBoard onOpenAccountability={() => setView("accountability")} />
        ) : view === "accountability" ? (
          <AccountabilityBoard />
        ) : (
          <InboxBoard />
        )}
      </div>
      <div id="notepad-notification-host" className="pointer-events-none absolute inset-0" />
    </div>
  );
};

export default Notepad;
