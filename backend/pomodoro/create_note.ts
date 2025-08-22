import { api } from "encore.dev/api";
import { pomoDB } from "./db";
import type { Note } from "./types";

export interface CreateNoteRequest {
  title: string;
  content: string;
  type: 'text' | 'drawing';
}

// Creates a new note.
export const createNote = api<CreateNoteRequest, Note>(
  { expose: true, method: "POST", path: "/notes" },
  async (req) => {
    const row = await pomoDB.queryRow<{
      id: number;
      title: string;
      content: string;
      type: string;
      created_at: Date;
      updated_at: Date;
    }>`
      INSERT INTO notes (title, content, type)
      VALUES (${req.title}, ${req.content}, ${req.type})
      RETURNING *
    `;

    if (!row) {
      throw new Error("Failed to create note");
    }

    return {
      id: row.id,
      title: row.title,
      content: row.content,
      type: row.type as 'text' | 'drawing',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
);
