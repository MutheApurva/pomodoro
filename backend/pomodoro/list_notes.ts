import { api } from "encore.dev/api";
import { pomoDB } from "./db";
import type { Note } from "./types";

export interface ListNotesResponse {
  notes: Note[];
}

// Retrieves all notes, ordered by creation date (latest first).
export const listNotes = api<void, ListNotesResponse>(
  { expose: true, method: "GET", path: "/notes" },
  async () => {
    const rows = await pomoDB.queryAll<{
      id: number;
      title: string;
      content: string;
      type: string;
      created_at: Date;
      updated_at: Date;
    }>`
      SELECT * FROM notes 
      ORDER BY updated_at DESC
    `;

    const notes: Note[] = rows.map(row => ({
      id: row.id,
      title: row.title,
      content: row.content,
      type: row.type as 'text' | 'drawing',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return { notes };
  }
);
