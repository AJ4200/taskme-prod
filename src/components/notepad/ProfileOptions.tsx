"use client";

import { useRouter } from "next/navigation";
import React from "react";

const ProfileOptions: React.FC = () => {
  const router = useRouter();

  const handleLogOut = () => {
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("email");
    router.replace("/");
  };

  return (
    <div
      className="paper absolute right-[3rem] top-10 z-50"
      style={{
        height: "15rem",
        width: "17rem",
      }}
    >
      <ol>
        <li className="cursor-pointer font-semibold" onClick={handleLogOut}>
          Log Out
        </li>
      </ol>
    </div>
  );
};

export default ProfileOptions;
