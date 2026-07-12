import { NextRequest, NextResponse } from "next/server";
import { verifyUser } from "@/app/lib/verifyUser";
import pool from "@/app/lib/db";
import { uploadFileToDrive, deleteFileFromDrive } from "@/app/lib/googleDrive";

// Helper to check permission
function hasAccess(user: any) {
  if (!user) return false;
  return user.role === "admin" || !!user.is_clerical;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyUser(req);
  if (!hasAccess(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

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
    
    // Attachments to add and delete
    const files = formData.getAll("files") as File[];
    const deleteAttachmentIds = formData.getAll("delete_attachments") as string[];

    if (!book_type || !book_number || !register_number || !date_issued || !sender || !receiver || !title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Update book metadata
      const updateBookQuery = `
        UPDATE correspondence_books 
        SET book_type = $1, book_number = $2, register_number = $3, date_issued = $4, 
            sender = $5, receiver = $6, title = $7, description = $8, updated_at = now()
        WHERE id = $9;
      `;
      await client.query(updateBookQuery, [
        book_type,
        book_number,
        register_number,
        date_issued,
        sender,
        receiver,
        title,
        description,
        id,
      ]);

      // 2. Delete selected attachments
      for (const attachmentId of deleteAttachmentIds) {
        // Fetch drive_file_id first
        const attachRes = await client.query(
          "SELECT drive_file_id FROM book_attachments WHERE id = $1 AND book_id = $2",
          [attachmentId, id]
        );
        if (attachRes.rows.length > 0) {
          const driveFileId = attachRes.rows[0].drive_file_id;
          // Delete from Google Drive
          await deleteFileFromDrive(driveFileId);
          // Delete from database
          await client.query("DELETE FROM book_attachments WHERE id = $1", [attachmentId]);
        }
      }

      // 3. Upload new attachments
      for (const file of files) {
        if (file && file.size > 0) {
          const buffer = Buffer.from(await file.arrayBuffer());
          const driveFileId = await uploadFileToDrive(buffer, file.name, file.type);
          
          await client.query(
            `INSERT INTO book_attachments (book_id, drive_file_id, file_name, file_size, mime_type)
             VALUES ($1, $2, $3, $4, $5)`,
            [id, driveFileId, file.name, file.size, file.type]
          );
        }
      }

      await client.query("COMMIT");
      return NextResponse.json({ success: true });
    } catch (dbErr: any) {
      await client.query("ROLLBACK");
      throw dbErr;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error(`Error updating correspondence book ${id}:`, error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyUser(req);
  if (!hasAccess(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Fetch all drive_file_ids for attachments to delete them from Google Drive
      const attachmentsRes = await client.query(
        "SELECT drive_file_id FROM book_attachments WHERE book_id = $1",
        [id]
      );

      for (const row of attachmentsRes.rows) {
        await deleteFileFromDrive(row.drive_file_id);
      }

      // 2. Delete book (ON DELETE CASCADE will clear database attachment references)
      await client.query("DELETE FROM correspondence_books WHERE id = $1", [id]);

      await client.query("COMMIT");
      return NextResponse.json({ success: true });
    } catch (dbErr: any) {
      await client.query("ROLLBACK");
      throw dbErr;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error(`Error deleting correspondence book ${id}:`, error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
