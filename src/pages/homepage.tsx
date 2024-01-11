import React, { useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import { useRouter } from "next/router";
import { FaArrowLeft, FaGithub, FaHandPointLeft, FaLinkedin, FaRegHandPointDown } from "react-icons/fa";

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
        <div className="flex justify-center">
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

        </div>
      </div>
      <div className="paper">
        <div className="flex justify-evenly">
          <div>
            <p className="mb-4 text-lg font-semibold">Get to tasking</p>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleLoginClick}
              className="ml-8 underline underline-offset-[10px]"
            >
              <FaRegHandPointDown /> Login
            </motion.button>
          </div>
          <br />
          <br />
          <br />
          <div>
            <p
              className="mb-4 text-lg
            font-semibold"
            >
              New to Task.Me?
            </p>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleRegisterClick}
              className="ml-8 underline underline-offset-[10px]"
            >
              <FaRegHandPointDown /> Register
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Homepage;
