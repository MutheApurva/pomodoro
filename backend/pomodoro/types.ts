export interface Task {
  id: number;
  title: string;
  description?: string;
  estimatedPomodoros: number;
  completedPomodoros: number;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PomodoroSession {
  id: number;
  taskId?: number;
  sessionType: 'work' | 'short_break' | 'long_break';
  durationMinutes: number;
  completedAt: Date;
}

export interface UserSettings {
  id: number;
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Statistics {
  totalSessions: number;
  totalWorkSessions: number;
  totalBreakSessions: number;
  totalMinutes: number;
  completedTasks: number;
  averageSessionsPerDay: number;
  streakDays: number;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  type: 'text' | 'drawing';
  createdAt: Date;
  updatedAt: Date;
}
