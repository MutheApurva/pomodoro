import { SQLDatabase } from "encore.dev/storage/sqldb";

export const pomoDB = new SQLDatabase("pomodoro", {
  migrations: "./migrations",
});
