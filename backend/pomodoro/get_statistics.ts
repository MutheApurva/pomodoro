import { api } from "encore.dev/api";
import { pomoDB } from "./db";
import type { Statistics } from "./types";

// Retrieves user statistics for completed sessions and tasks.
export const getStatistics = api<void, Statistics>(
  { expose: true, method: "GET", path: "/statistics" },
  async () => {
    // Get total sessions
    const totalSessionsRow = await pomoDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM pomodoro_sessions
    `;

    // Get work sessions
    const workSessionsRow = await pomoDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM pomodoro_sessions WHERE session_type = 'work'
    `;

    // Get break sessions
    const breakSessionsRow = await pomoDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM pomodoro_sessions WHERE session_type IN ('short_break', 'long_break')
    `;

    // Get total minutes
    const totalMinutesRow = await pomoDB.queryRow<{ total: number | null }>`
      SELECT SUM(duration_minutes) as total FROM pomodoro_sessions
    `;

    // Get completed tasks
    const completedTasksRow = await pomoDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM tasks WHERE is_completed = true
    `;

    // Get sessions per day (last 30 days)
    const sessionsPerDayRow = await pomoDB.queryRow<{ avg: number | null }>`
      SELECT AVG(daily_count) as avg FROM (
        SELECT DATE(completed_at) as session_date, COUNT(*) as daily_count
        FROM pomodoro_sessions 
        WHERE completed_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(completed_at)
      ) daily_sessions
    `;

    // Calculate streak (consecutive days with at least one session)
    const streakRows = await pomoDB.queryAll<{ session_date: string }>`
      SELECT DISTINCT DATE(completed_at) as session_date
      FROM pomodoro_sessions 
      WHERE completed_at >= NOW() - INTERVAL '365 days'
      ORDER BY session_date DESC
    `;

    let streakDays = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < streakRows.length; i++) {
      const sessionDate = new Date(streakRows[i].session_date);
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      expectedDate.setHours(0, 0, 0, 0);

      if (sessionDate.getTime() === expectedDate.getTime()) {
        streakDays++;
      } else {
        break;
      }
    }

    return {
      totalSessions: totalSessionsRow?.count || 0,
      totalWorkSessions: workSessionsRow?.count || 0,
      totalBreakSessions: breakSessionsRow?.count || 0,
      totalMinutes: totalMinutesRow?.total || 0,
      completedTasks: completedTasksRow?.count || 0,
      averageSessionsPerDay: Math.round((sessionsPerDayRow?.avg || 0) * 10) / 10,
      streakDays,
    };
  }
);
