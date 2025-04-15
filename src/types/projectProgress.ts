export interface Subtask {
  title: string;
  completed: boolean;
}

export interface Task {
  title: string;
  subtasks: Subtask[];
}

export interface ProjectProgress {
  _id: string;
  title: string;
  modalImage?: {
    asset: {
      _ref: string;
      url: string;
    }
  };
  tasks: Task[];
}

export interface TaskWithStatus extends Task {
  status: 'completed' | 'inProgress' | 'notStarted';
  completedCount: number;
  totalCount: number;
}

export interface ProjectProgressWithStats extends ProjectProgress {
  tasks: TaskWithStatus[];
  progressPercentage: number;
  completedTaskCount: number;
  totalTaskCount: number;
} 