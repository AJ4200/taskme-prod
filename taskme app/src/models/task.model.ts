//task.model.ts

interface Task {
  id?: string;
  title: string;
  status: string;
  priority: string;
  dueDate: Date;
  ownerId: string;
  assigneeId?: string;
}
export default Task;
