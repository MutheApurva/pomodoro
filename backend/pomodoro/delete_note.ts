import { api } from "encore.dev/api";
import { pomoDB } from "./db";

export interface DeleteNoteRequest {
  id: number;
}

// Deletes a note.
export const deleteNote = api<DeleteNoteRequest, void>(
  { expose: true, method: "DELETE", path: "/notes/:id" },
  async (req) => {
    await pomoDB.exec`
      DELETE FROM notes WHERE id = ${req.id}
    `;
  }
);
