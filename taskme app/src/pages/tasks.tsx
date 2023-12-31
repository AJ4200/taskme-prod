import React from "react";
import Notepad from "~/components/notepad/Notepad";

const Tasks: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <Notepad />
    </div>
  );
};
export default Tasks;
