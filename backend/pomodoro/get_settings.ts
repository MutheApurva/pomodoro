import { api } from "encore.dev/api";
import { pomoDB } from "./db";
import type { UserSettings } from "./types";

// Retrieves user settings for pomodoro intervals.
export const getSettings = api<void, UserSettings>(
  { expose: true, method: "GET", path: "/settings" },
  async () => {
    const row = await pomoDB.queryRow<{
      id: number;
      work_duration: number;
      short_break_duration: number;
      long_break_duration: number;
      sessions_until_long_break: number;
      created_at: Date;
      updated_at: Date;
    }>`
      SELECT * FROM user_settings ORDER BY id LIMIT 1
    `;

    if (!row) {
      // Create default settings if none exist
      const defaultRow = await pomoDB.queryRow<{
        id: number;
        work_duration: number;
        short_break_duration: number;
        long_break_duration: number;
        sessions_until_long_break: number;
        created_at: Date;
        updated_at: Date;
      }>`
        INSERT INTO user_settings (work_duration, short_break_duration, long_break_duration, sessions_until_long_break)
        VALUES (25, 5, 15, 4)
        RETURNING *
      `;

      if (!defaultRow) {
        throw new Error("Failed to create default settings");
      }

      return {
        id: defaultRow.id,
        workDuration: defaultRow.work_duration,
        shortBreakDuration: defaultRow.short_break_duration,
        longBreakDuration: defaultRow.long_break_duration,
        sessionsUntilLongBreak: defaultRow.sessions_until_long_break,
        createdAt: defaultRow.created_at,
        updatedAt: defaultRow.updated_at,
      };
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
