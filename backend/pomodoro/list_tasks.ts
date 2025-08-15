import { api } from "encore.dev/api";
import { pomoDB } from "./db";
import type { Task } from "./types";

export interface ListTasksResponse {
  tasks: Task[];
}

// Retrieves all tasks, ordered by creation date (latest first).
export const listTasks = api<void, ListTasksResponse>(
  { expose: true, method: "GET", path: "/tasks" },
  async () => {
    const rows = await pomoDB.queryAll<{
      id: number;
      title: string;
      description: string | null;
      estimated_pomodoros: number;
      completed_pomodoros: number;
      is_completed: boolean;
      created_at: Date;
      updated_at: Date;
    }>`
      SELECT * FROM tasks 
      ORDER BY is_completed ASC, created_at DESC
    `;

    const tasks: Task[] = rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description || undefined,
      estimatedPomodoros: row.estimated_pomodoros,
      completedPomodoros: row.completed_pomodoros,
      isCompleted: row.is_completed,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return { tasks };
  }
);
