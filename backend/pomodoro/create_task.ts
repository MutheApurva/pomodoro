import { api } from "encore.dev/api";
import { pomoDB } from "./db";
import type { Task } from "./types";

export interface CreateTaskRequest {
  title: string;
  description?: string;
  estimatedPomodoros: number;
}

// Creates a new task.
export const createTask = api<CreateTaskRequest, Task>(
  { expose: true, method: "POST", path: "/tasks" },
  async (req) => {
    const row = await pomoDB.queryRow<{
      id: number;
      title: string;
      description: string | null;
      estimated_pomodoros: number;
      completed_pomodoros: number;
      is_completed: boolean;
      created_at: Date;
      updated_at: Date;
    }>`
      INSERT INTO tasks (title, description, estimated_pomodoros)
      VALUES (${req.title}, ${req.description || null}, ${req.estimatedPomodoros})
      RETURNING *
    `;

    if (!row) {
      throw new Error("Failed to create task");
    }

    return {
      id: row.id,
      title: row.title,
      description: row.description || undefined,
      estimatedPomodoros: row.estimated_pomodoros,
      completedPomodoros: row.completed_pomodoros,
      isCompleted: row.is_completed,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
);
