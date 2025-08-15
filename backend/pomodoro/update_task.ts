import { api, APIError } from "encore.dev/api";
import { pomoDB } from "./db";
import type { Task } from "./types";

export interface UpdateTaskRequest {
  id: number;
  title?: string;
  description?: string;
  estimatedPomodoros?: number;
  isCompleted?: boolean;
}

// Updates an existing task.
export const updateTask = api<UpdateTaskRequest, Task>(
  { expose: true, method: "PUT", path: "/tasks/:id" },
  async (req) => {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (req.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(req.title);
    }
    if (req.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(req.description || null);
    }
    if (req.estimatedPomodoros !== undefined) {
      updates.push(`estimated_pomodoros = $${paramIndex++}`);
      values.push(req.estimatedPomodoros);
    }
    if (req.isCompleted !== undefined) {
      updates.push(`is_completed = $${paramIndex++}`);
      values.push(req.isCompleted);
    }

    if (updates.length === 0) {
      throw APIError.invalidArgument("No fields to update");
    }

    updates.push(`updated_at = NOW()`);
    values.push(req.id);

    const query = `
      UPDATE tasks 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const row = await pomoDB.rawQueryRow<{
      id: number;
      title: string;
      description: string | null;
      estimated_pomodoros: number;
      completed_pomodoros: number;
      is_completed: boolean;
      created_at: Date;
      updated_at: Date;
    }>(query, ...values);

    if (!row) {
      throw APIError.notFound("Task not found");
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
