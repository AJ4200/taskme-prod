import type { GoalStatus, TaskPriority, TaskStatus } from "@prisma/client";

// task.model.ts

export interface TaskGoalLink {
  goalId: string;
  goal?: {
    id: string;
    title: string;
    status?: GoalStatus;
    progress?: number;
  } | null;
}

interface Task {
  id?: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | string;
  ownerId: string;
  assigneeId?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  goalLinks?: TaskGoalLink[];
}

export default Task;
