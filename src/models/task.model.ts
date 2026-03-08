// task.model.ts

export interface TaskGoalLink {
  goalId: string;
  goal?: {
    id: string;
    title: string;
    status?: string;
    progress?: number;
  } | null;
}

interface Task {
  id?: string;
  title: string;
  status: string;
  priority: string;
  dueDate: Date | string;
  ownerId: string;
  assigneeId?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  goalLinks?: TaskGoalLink[];
}

export default Task;
