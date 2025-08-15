import { api } from "encore.dev/api";
import { pomoDB } from "./db";
import type { PomodoroSession } from "./types";

export interface CompleteSessionRequest {
  taskId?: number;
  sessionType: 'work' | 'short_break' | 'long_break';
  durationMinutes: number;
}

// Records a completed pomodoro session.
export const completeSession = api<CompleteSessionRequest, PomodoroSession>(
  { expose: true, method: "POST", path: "/sessions" },
  async (req) => {
    await pomoDB.begin().then(async (tx) => {
      try {
        // Insert the session
        const sessionRow = await tx.queryRow<{
          id: number;
          task_id: number | null;
          session_type: string;
          duration_minutes: number;
          completed_at: Date;
        }>`
          INSERT INTO pomodoro_sessions (task_id, session_type, duration_minutes)
          VALUES (${req.taskId || null}, ${req.sessionType}, ${req.durationMinutes})
          RETURNING *
        `;

        if (!sessionRow) {
          throw new Error("Failed to create session");
        }

        // If it's a work session and has a task, increment the completed pomodoros
        if (req.sessionType === 'work' && req.taskId) {
          await tx.exec`
            UPDATE tasks 
            SET completed_pomodoros = completed_pomodoros + 1,
                updated_at = NOW()
            WHERE id = ${req.taskId}
          `;
        }

        await tx.commit();

        return {
          id: sessionRow.id,
          taskId: sessionRow.task_id || undefined,
          sessionType: sessionRow.session_type as 'work' | 'short_break' | 'long_break',
          durationMinutes: sessionRow.duration_minutes,
          completedAt: sessionRow.completed_at,
        };
      } catch (error) {
        await tx.rollback();
        throw error;
      }
    });

    // This should never be reached due to the transaction handling above
    throw new Error("Transaction failed");
  }
);
