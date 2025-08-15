import { api } from "encore.dev/api";
import { pomoDB } from "./db";
import type { UserSettings } from "./types";

export interface UpdateSettingsRequest {
  workDuration?: number;
  shortBreakDuration?: number;
  longBreakDuration?: number;
  sessionsUntilLongBreak?: number;
}

// Updates user settings for pomodoro intervals.
export const updateSettings = api<UpdateSettingsRequest, UserSettings>(
  { expose: true, method: "PUT", path: "/settings" },
  async (req) => {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (req.workDuration !== undefined) {
      updates.push(`work_duration = $${paramIndex++}`);
      values.push(req.workDuration);
    }
    if (req.shortBreakDuration !== undefined) {
      updates.push(`short_break_duration = $${paramIndex++}`);
      values.push(req.shortBreakDuration);
    }
    if (req.longBreakDuration !== undefined) {
      updates.push(`long_break_duration = $${paramIndex++}`);
      values.push(req.longBreakDuration);
    }
    if (req.sessionsUntilLongBreak !== undefined) {
      updates.push(`sessions_until_long_break = $${paramIndex++}`);
      values.push(req.sessionsUntilLongBreak);
    }

    if (updates.length === 0) {
      // Return current settings if no updates
      const row = await pomoDB.queryRow<{
        id: number;
        work_duration: number;
        short_break_duration: number;
        long_break_duration: number;
        sessions_until_long_break: number;
        created_at: Date;
        updated_at: Date;
      }>`SELECT * FROM user_settings ORDER BY id LIMIT 1`;

      if (!row) {
        throw new Error("Settings not found");
      }

      return {
        id: row.id,
        workDuration: row.work_duration,
        shortBreakDuration: row.short_break_duration,
        longBreakDuration: row.long_break_duration,
        sessionsUntilLongBreak: row.sessions_until_long_break,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    }

    updates.push(`updated_at = NOW()`);

    const query = `
      UPDATE user_settings 
      SET ${updates.join(', ')}
      WHERE id = (SELECT id FROM user_settings ORDER BY id LIMIT 1)
      RETURNING *
    `;

    const row = await pomoDB.rawQueryRow<{
      id: number;
      work_duration: number;
      short_break_duration: number;
      long_break_duration: number;
      sessions_until_long_break: number;
      created_at: Date;
      updated_at: Date;
    }>(query, ...values);

    if (!row) {
      throw new Error("Failed to update settings");
    }

    return {
      id: row.id,
      workDuration: row.work_duration,
      shortBreakDuration: row.short_break_duration,
      longBreakDuration: row.long_break_duration,
      sessionsUntilLongBreak: row.sessions_until_long_break,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
);
