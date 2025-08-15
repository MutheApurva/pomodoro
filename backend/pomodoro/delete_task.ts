import { api, APIError } from "encore.dev/api";
import { pomoDB } from "./db";

export interface DeleteTaskRequest {
  id: number;
}

// Deletes a task.
export const deleteTask = api<DeleteTaskRequest, void>(
  { expose: true, method: "DELETE", path: "/tasks/:id" },
  async (req) => {
    const result = await pomoDB.exec`
      DELETE FROM tasks WHERE id = ${req.id}
    `;
    
    // Note: We can't check affected rows with the current API, 
    // but the operation will succeed even if the task doesn't exist
  }
);
