export interface User {
  id: number;
  username: string;
  email: string;
  createdAt: string;
  fullName?: string | null;
  profilePic?: string | null;
}

export type TaskPriority = 'Low' | 'Medium' | 'High';
export type TaskStatus = 'Pending' | 'Completed';

export interface Task {
  id: number;
  userId: number;
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
  category: string;
  status: TaskStatus;
  createdAt: string;
  orderIndex: number;
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  progress: number; // percentage
  todayCount: number; // count of today's tasks
  upcomingCount: number; // count of tasks due in the next 3 days
  priorityDistribution: {
    Low: number;
    Medium: number;
    High: number;
  };
  categoryDistribution: {
    [category: string]: number;
  };
  completionTrend: {
    date: string;
    completed: number;
    created: number;
  }[];
}
