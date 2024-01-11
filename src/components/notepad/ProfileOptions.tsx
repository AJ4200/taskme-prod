import { useRouter } from "next/router";
import React from "react";
const ProfileOtions: React.FC = () => {

    const router = useRouter();

    const handleLogOut = () => {
        sessionStorage.setItem("userId", "")
        sessionStorage.setItem("token", "");
        sessionStorage.setItem("email", "");
        router.push("/")
}

    return (
      <div
        className="paper z-99 absolute right-[3rem] top-10"
        style={{
          height: "15rem",
          width: "17rem",
        }}
        > 
        <ol className="">
          <li onClick={handleLogOut}>Log Out</li>
          <li></li>
        </ol>
      </div>
    );
};
export default ProfileOtions;
