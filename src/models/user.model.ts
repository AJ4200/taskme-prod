//user.model.ts

interface User {
  id?: string;
  username: string;
  email: string;
  priority: string;
  dueDate: Date;
  ownerId: string;
  assigneeId?: string;
}
export default User;
