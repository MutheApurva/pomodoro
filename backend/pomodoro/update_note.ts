import { api, APIError } from "encore.dev/api";
import { pomoDB } from "./db";
import type { Note } from "./types";

export interface UpdateNoteRequest {
  id: number;
  title?: string;
  content?: string;
}

// Updates an existing note.
export const updateNote = api<UpdateNoteRequest, Note>(
  { expose: true, method: "PUT", path: "/notes/:id" },
  async (req) => {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (req.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(req.title);
    }
    if (req.content !== undefined) {
      updates.push(`content = $${paramIndex++}`);
      values.push(req.content);
    }

    if (updates.length === 0) {
      throw APIError.invalidArgument("No fields to update");
    }

    updates.push(`updated_at = NOW()`);
    values.push(req.id);

    const query = `
      UPDATE notes 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const row = await pomoDB.rawQueryRow<{
      id: number;
      title: string;
      content: string;
      type: string;
      created_at: Date;
      updated_at: Date;
    }>(query, ...values);

    if (!row) {
      throw APIError.notFound("Note not found");
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
