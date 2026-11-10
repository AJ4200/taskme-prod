"use client";

import { useRouter } from "next/navigation";
import React from "react";
import { setPendingNotification } from "../providers/NotificationProvider";

const ProfileOptions: React.FC = () => {
  const router = useRouter();

  const handleLogOut = () => {
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("profilePicture");
    sessionStorage.removeItem("email");
    setPendingNotification("warning", "You have been logged out.");
    router.replace("/");
  };

  return (
    <div
      id="profile-options"
      className="paper absolute right-0 top-full z-50"
      style={{ height: "15rem", width: "min(17rem, 100%)" }}
    >
      <ol>
        <li>
          <button type="button" className="font-semibold" onClick={handleLogOut}>
            Log Out
          </button>
        </li>
      </ol>
    </div>
  );
};

export default ProfileOptions;
