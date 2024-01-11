import { FaGithub, FaLinkedin } from "react-icons/fa";
import { motion } from "framer-motion";
import classnames from "classnames";

const Footer: React.FC = () => {
  return (
    <motion.div
      className={classnames("fixed bottom-0 w-full",
        "flex flex-row justify-center items-center h-[30px] sm:h-[50px] py-2 px-8")}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-gray-900 font-bold">
        © 2023 Task.ME. All rights reserved.
      </div>

      <div className="flex items-center ml-2 space-x-1">
        <motion.a
          href="https://github.com/aj4200"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.1 }}
        >
          <FaGithub className="text-gray-900 text-sm hover:opacity-50" />
        </motion.a>

        <motion.a
          href="https://www.linkedin.com/in/abel-majadibodu-5a0583193/"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.1 }}
        >
          <FaLinkedin className="text-gray-900 text-sm hover:opacity-50" />
        </motion.a>
      </div>
    </motion.div>
  );
};

export default Footer;