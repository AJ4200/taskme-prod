import React, { useEffect, useState } from "react";
import useGetAllUsers from "~/hooks/user/useGetAllUsers";
import useUpdateTask from "~/hooks/task/useUpdateTask";
import User from "~/models/user.model";
import Task from "~/models/task.model";

interface AssignTaskProps {
  task: Task | null;
  onClose: () => void;
}

const AssignTask: React.FC<AssignTaskProps> = ({ task, onClose }) => {
  const {
    getAllUsers,
    users,
    loading: usersLoading,
    error: usersError,
  } = useGetAllUsers();
  const {
    updateTask,
    loading: updateTaskLoading,
    error: updateTaskError,
  } = useUpdateTask();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [localTaskData, setLocalTaskData] = useState<Task | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  useEffect(() => {
    // Fetch all users when the component mounts
    getAllUsers();

    if (task) {
      setLocalTaskData(task);
    }
  }, []);

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
  };

  const handleAssignTask = async () => {
    if (localTaskData && selectedUserId) {
      try {
        const updatedTaskData = {
          ...localTaskData,
          assigneeId: selectedUserId,
        };

        // Update task with the new data
        await updateTask(localTaskData.id || "", updatedTaskData);

setConfirmation(
  `Task "${localTaskData.title}" assigned to ${
    (users.find((user: User) => user.id === selectedUserId) as User | undefined)
      ?.username || "Unknown User"
  }`,
);
        // Close the modal after a delay
        setTimeout(() => {
          onClose();
        }, 3000);
      } catch (error) {
        console.error("Error assigning task:", error);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="paper max-w-md rounded bg-white p-8">
        <h2 className="mb-6 text-center text-4xl underline">Assign Task</h2>
        <div>
          <p>
            Task: <span className="font-semibold">{localTaskData?.title}</span>
          </p>
          <p className="text-center">Choose Assignee:</p>
          <ul>
            {users.map((user: User) => (
              <li
                key={user.id}
                onClick={() => handleUserSelect(user.id || "")}
                className={`cursor-pointer font-semibold ${
                  selectedUserId === user.id ? "underline" : ""
                }`}
              >
                {user.username}
              </li>
            ))}
          </ul>

          <br />

          <div className="box flex w-full justify-center divide-x divide-gray-700">
            <button
              onClick={handleAssignTask}
              disabled={!selectedUserId}
              className="mr-2 rounded  px-4 py-2 text-gray-700 disabled:text-red-950"
            >
              Assign
            </button>
            <button
              onClick={onClose}
              className="rounded  px-4 py-2 text-gray-700"
            >
              Cancel
            </button>
          </div>

          {/* Confirmation message */}
          {confirmation && (
            <div className="mt-4 text-green-700">{confirmation}</div>
          )}
        </div>
        {usersLoading && <div className="loader" />}
        {updateTaskLoading && <div className="loader" />}
        {usersError && (
          <div className="text-red-700">Error loading users: {usersError}</div>
        )}
        {updateTaskError && (
          <div className="text-red-700">
            Error assigning task: {updateTaskError}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignTask;
