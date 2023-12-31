import React, { useEffect, useState } from "react";
import useGetAllTasks from "~/hooks/task/useGetAllTasks";
import useGetUserById from "~/hooks/user/useGetUserById";
import Task from "~/models/task.model";
import User from "~/models/user.model";

const AssignedTasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const {
    getAllTasks,
    loading: tasksLoading,
    error: tasksError,
  } = useGetAllTasks();
  const {
    getUserById,
    user,
    loading: userLoading,
    error: userError,
  } = useGetUserById();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        // Extract userId from the token
        const userId = sessionStorage.getItem("userId") || "";
        // Fetch tasks where the user is the assignee
        const assignedTasks = await getAllTasks(undefined, userId);
        setTasks(assignedTasks);

        // Fetch the user by ID
        if (assignedTasks.length > 0) {
          const ownerId = assignedTasks[0].ownerId; // Assuming ownerId is available in tasks
          await getUserById(ownerId);
        }
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    };

    fetchTasks();
  }, []);

  if (tasksLoading || userLoading) {
    // TODO: Add custom loader {a pen paper animation}
    return <div className="loader mt-1" />;
  }

  if (tasksError || userError) {
    return <div className="text-red-700">Error: {tasksError || userError}</div>;
  }

  return (
    <div>
      <h2 className="text-center text-4xl underline">Assigned Tasks</h2>
      <ul>
        {tasks.map((task: Task) => (
          <li key={task.id} className="mb-4 flex flex-col rounded border py-4 box pl-14">
            <p>Title: {task.title}</p>
            <p>Status: {task.status}</p>
            <p>Priority: {task.priority}</p>
            <p>Due Date: {new Date(task.dueDate).toLocaleDateString()}</p>
            {user && <p>Assigned by: {user.username}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AssignedTasks;
