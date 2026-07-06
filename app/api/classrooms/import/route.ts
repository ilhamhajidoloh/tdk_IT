import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/app/lib/verifyAdmin";
import pool from "@/app/lib/db";

export async function POST(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { setting_id, items } = await req.json();
  if (!setting_id || !items || !Array.isArray(items)) {
    return NextResponse.json({ error: "Missing required fields: setting_id, items" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Extract unique classroom names
    const classroomNames = Array.from(new Set(
      items
        .map(i => i.classroom_name ? String(i.classroom_name).trim() : null)
        .filter(Boolean)
    )) as string[];

    const classroomMap = new Map<string, number>();

    let existingCount = 0;

    if (classroomNames.length > 0) {
      // Find existing classrooms for this setting
      const existingRes = await client.query(
        "SELECT id, name FROM classrooms WHERE setting_id = $1 AND name = ANY($2)",
        [setting_id, classroomNames]
      );
      
      existingCount = existingRes.rows.length;
      for (const row of existingRes.rows) {
        classroomMap.set(row.name, row.id);
      }

      // Insert missing classrooms
      const missingNames = classroomNames.filter(name => !classroomMap.has(name));
      if (missingNames.length > 0) {
        for (const name of missingNames) {
          const insertRes = await client.query(
            "INSERT INTO classrooms (name, setting_id) VALUES ($1, $2) RETURNING id",
            [name, setting_id]
          );
          classroomMap.set(name, insertRes.rows[0].id);
        }
      }
    }

    // Assign students to classrooms
    let updatedCount = 0;
    for (const item of items) {
      const studentId = item.student_id ? String(item.student_id).trim() : null;
      const studentName = item.name ? String(item.name).trim() : null;
      const classroomName = item.classroom_name ? String(item.classroom_name).trim() : null;

      if ((studentId || studentName) && classroomName) {
        const classId = classroomMap.get(classroomName);
        if (classId) {
          const studentRes = studentId
            ? await client.query("SELECT id FROM students WHERE student_id = $1", [studentId])
            : await client.query("SELECT id FROM students WHERE name = $1", [studentName]);

          for (const row of studentRes.rows) {
            await client.query(
              `INSERT INTO classroom_students (student_id, classroom_id, setting_id)
               VALUES ($1, $2, $3)
               ON CONFLICT (student_id, setting_id) DO UPDATE SET classroom_id = excluded.classroom_id`,
              [row.id, classId, setting_id]
            );
            updatedCount++;
          }
        }
      }
    }

    await client.query("COMMIT");
    return NextResponse.json({ 
      success: true, 
      classroomsCreated: classroomNames.length - existingCount,
      studentsAssigned: updatedCount 
    }, { status: 200 });

  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("Classroom import error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
