import React, { useEffect, useState } from "react";
import useGetAllTasks from "~/hooks/task/useGetAllTasks";
import Task from "~/models/task.model";
import AssignTask from "./AssignTask";
import useGetUserById from "~/hooks/user/useGetUserById";

const OwnedTasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const { getAllTasks, loading, error } = useGetAllTasks();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isAssignDialogOpen, setAssignDialogOpen] = useState(false);
  const {
    getUserById,
    user: assignee,
    loading: assigneeLoading,
    error: assigneeError,
  } = useGetUserById();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const userId = sessionStorage.getItem("userId") || "";
        // Fetch tasks assigned to the user (using ownerId)
        const userTasks = await getAllTasks(userId);
        setTasks(userTasks);

        // Fetch assignee details for each task
        const assigneePromises = userTasks.map(async (task: Task) => {
          if (task.assigneeId) {
            await getUserById(task.assigneeId);
          }
        });

        // Wait for all assignee details to be fetched
        await Promise.all(assigneePromises);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    };

    fetchTasks();
  }, []);

  const handleAssignClick = (task: Task) => {
    setSelectedTask(task);
    setAssignDialogOpen(true);
  };

  const handleCloseAssignDialog = () => {
    setAssignDialogOpen(false);
  };

  if (loading || assigneeLoading) {
    // TODO: Add custom loader {a pen paper animation}
    return <div className="loader mt-1" />;
  }

  if (error || assigneeError) {
    return <div className="text-red-700">Error: {error || assigneeError}</div>;
  }

  return (
    <div>
      <h2 className="text-center text-4xl underline">Your Tasks</h2>
      <ul>
        {tasks.map((task: Task) => (
          <li key={task.id} className=" flex flex-col rounded border p-4">
            <div className="box py-4 pl-12">
              <p>
                Assigned To:{" "}
                <span className="font-semibold">
                  {assignee?.username === "taskmaster"
                    ? "Unassigned"
                    : assignee?.username}
                </span>
              </p>
              <p>
                Title: <span className="font-semibold">{task.title}</span>
              </p>
              <p>
                Status: <span className="font-semibold">{task.status}</span>
              </p>
              <p>
                Priority: <span className="font-semibold">{task.priority}</span>
              </p>
              <p>
                Due Date:{" "}
                <span className="font-semibold">
                  {new Date(task.dueDate).toLocaleDateString()}
                </span>
              </p>
              <button
                className="box px-2 text-lg font-semibold"
                onClick={() => handleAssignClick(task)}
              >
                Assign
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* AssignTask dialog */}
      {isAssignDialogOpen && (
        <AssignTask task={selectedTask} onClose={handleCloseAssignDialog} />
      )}
    </div>
  );
};

export default OwnedTasks;
