import { NextRequest, NextResponse } from "next/server";
import { verifyUser } from "@/app/lib/verifyUser";
import pool from "@/app/lib/db";
import { uploadFileToDrive } from "@/app/lib/googleDrive";

// Helper to check permission
function hasAccess(user: any) {
  if (!user) return false;
  return user.role === "admin" || !!user.is_clerical;
}

export async function GET(req: NextRequest) {
  const user = await verifyUser(req);
  if (!hasAccess(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // inward or outward
  const search = searchParams.get("search");

  let queryText = `
    SELECT 
      b.id,
      b.book_type,
      b.book_number,
      b.register_number,
      b.date_issued,
      b.date_registered,
      b.sender,
      b.receiver,
      b.title,
      b.description,
      u.username as created_by_name,
      COALESCE(
        json_agg(
          json_build_object(
            'id', a.id,
            'file_name', a.file_name,
            'file_size', a.file_size,
            'mime_type', a.mime_type
          )
        ) FILTER (WHERE a.id IS NOT NULL),
        '[]'::json
      ) as attachments
    FROM correspondence_books b
    LEFT JOIN book_attachments a ON a.book_id = b.id
    LEFT JOIN users u ON u.id = b.created_by
  `;

  const queryParams: any[] = [];
  const clauses: string[] = [];

  if (type) {
    queryParams.push(type);
    clauses.push(`b.book_type = $${queryParams.length}`);
  }

  if (search && search.trim() !== "") {
    queryParams.push(`%${search.trim()}%`);
    const idx = queryParams.length;
    clauses.push(`(
      b.book_number ILIKE $${idx} OR 
      b.register_number ILIKE $${idx} OR 
      b.sender ILIKE $${idx} OR 
      b.receiver ILIKE $${idx} OR 
      b.title ILIKE $${idx} OR 
      b.description ILIKE $${idx}
    )`);
  }

  if (clauses.length > 0) {
    queryText += ` WHERE ` + clauses.join(" AND ");
  }

  queryText += `
    GROUP BY b.id, u.username
    ORDER BY b.date_registered DESC
  `;

  try {
    const result = await pool.query(queryText, queryParams);
    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error("Error fetching correspondence books:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await verifyUser(req);
  if (!user || !hasAccess(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const book_type = formData.get("book_type") as string;
    const book_number = formData.get("book_number") as string;
    const register_number = formData.get("register_number") as string;
    const date_issued = formData.get("date_issued") as string;
    const sender = formData.get("sender") as string;
    const receiver = formData.get("receiver") as string;
    const title = formData.get("title") as string;
    const description = (formData.get("description") as string) || null;
    
    // Get all files
    const files = formData.getAll("files") as File[];

    if (!book_type || !book_number || !register_number || !date_issued || !sender || !receiver || !title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Insert book metadata
      const insertBookQuery = `
        INSERT INTO correspondence_books (book_type, book_number, register_number, date_issued, sender, receiver, title, description, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id;
      `;
      const bookRes = await client.query(insertBookQuery, [
        book_type,
        book_number,
        register_number,
        date_issued,
        sender,
        receiver,
        title,
        description,
        user.id,
      ]);
      const bookId = bookRes.rows[0].id;

      // 2. Upload files to Google Drive & save attachments references
      for (const file of files) {
        if (file && file.size > 0) {
          const buffer = Buffer.from(await file.arrayBuffer());
          const driveFileId = await uploadFileToDrive(buffer, file.name, file.type);
          
          await client.query(
            `INSERT INTO book_attachments (book_id, drive_file_id, file_name, file_size, mime_type)
             VALUES ($1, $2, $3, $4, $5)`,
            [bookId, driveFileId, file.name, file.size, file.type]
          );
        }
      }

      await client.query("COMMIT");
      return NextResponse.json({ success: true, id: bookId }, { status: 201 });
    } catch (dbErr: any) {
      await client.query("ROLLBACK");
      throw dbErr;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Error creating correspondence book:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
