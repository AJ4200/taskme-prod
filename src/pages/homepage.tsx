import React, { useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import { useRouter } from "next/router";

const Homepage: React.FC = () => {
  const router = useRouter();
  const controls = useAnimation();

  useEffect(() => {

const tokenCookie = sessionStorage.getItem("token");

    if (tokenCookie) {
      // Redirect to tasks page
      router.push("/tasks");
    } else {
      // Animate when the component mounts
      controls.start({ opacity: 1, y: 0 });
    }
  }, [router, controls]);

  const handleLoginClick = () => {
    // Redirect to the login page
    router.push("/login");
  };

  const handleRegisterClick = () => {
    // Redirect to the registration page
    router.push("/register");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={controls}
      transition={{ duration: 0.5 }}
      className="notepad"
    >
      <div className="top">
        <h1 className="text-center text-4xl text-gray-300">Task.Me---Home</h1>
      </div>
      <div className="paper">
        <div className="flex justify-evenly">
          <div>
            <p className="text-lg">Get to tasking</p>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleLoginClick}
              className="ml-8"
            >
              Login
            </motion.button>
          </div>
          <br />
          <br />
          <br />
          <div>
            <p className="text-lg">New to Task.Me?</p>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleRegisterClick}
              className="ml-8"
            >
              Register
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>

  );
};

export default Homepage;
