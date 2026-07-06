import { NextRequest, NextResponse } from "next/server";
import { verifyUser } from "@/app/lib/verifyUser";
import pool from "@/app/lib/db";
import { ensureChatTables } from "@/app/lib/chatDb";

export async function GET(req: NextRequest) {
  const currentUser = await verifyUser(req);
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureChatTables();

  const { id, role } = currentUser;

  if (role === "admin") {
    const result = await pool.query(
      `SELECT u.id, u.username, u.role, u.student_id, u.homeroom_classroom_id, u.email, s.name as student_name
       FROM users u
       LEFT JOIN students s ON s.student_id = u.student_id
       WHERE u.id != $1 ORDER BY u.role, u.username`,
      [id]
    );
    return NextResponse.json(result.rows);
  }

  if (role === "teacher") {
    const me = await pool.query(
      `SELECT id, homeroom_classroom_id FROM users WHERE id = $1`,
      [id]
    );
    const teacher = me.rows[0];
    if (!teacher) return NextResponse.json([]);

    const homeroomId = teacher.homeroom_classroom_id;

    // students in homeroom
    let homeroomStudentIds: string[] = [];
    if (homeroomId) {
      const hr = await pool.query(
        `SELECT u.id FROM users u
         JOIN students s ON s.student_id = u.student_id
         JOIN classroom_students cs ON cs.student_id = s.id
         WHERE cs.classroom_id = $1 AND u.role = 'student'`,
        [homeroomId]
      );
      homeroomStudentIds = hr.rows.map((r: any) => r.id.toString());
    }

    // students in subject classrooms
    const subjectClassrooms = await pool.query(
      `SELECT DISTINCT sc.classroom_id
       FROM subject_classrooms sc
       JOIN subjects s ON s.id = sc.subject_id
       LEFT JOIN subject_teachers st ON st.subject_id = s.id
       WHERE s.teacher_id = $1 OR st.user_id = $1`,
      [id]
    );
    const classroomIds = subjectClassrooms.rows.map((r: any) => r.classroom_id);

    let subjectStudentIds: string[] = [];
    if (classroomIds.length > 0) {
      const ss = await pool.query(
        `SELECT u.id FROM users u
         JOIN students s ON s.student_id = u.student_id
         JOIN classroom_students cs ON cs.student_id = s.id
         WHERE cs.classroom_id = ANY($1) AND u.role = 'student'`,
        [classroomIds]
      );
      subjectStudentIds = ss.rows.map((r: any) => r.id.toString());
    }

    const allStudentIds = [...new Set([...homeroomStudentIds, ...subjectStudentIds])];

    // admins (for support)
    const admins = await pool.query(
      `SELECT id, username, role, email FROM users WHERE role = 'admin'`
    );

    let students: any[] = [];
    if (allStudentIds.length > 0) {
      const st = await pool.query(
        `SELECT u.id, u.username, u.role, u.student_id, u.email,
                s.name as student_name, cs.classroom_id, c.name as classroom_name
         FROM users u
         LEFT JOIN students s ON s.student_id = u.student_id
         LEFT JOIN classroom_students cs ON cs.student_id = s.id
           AND cs.setting_id = (SELECT id FROM system_settings WHERE CURRENT_DATE BETWEEN start_date AND end_date ORDER BY id DESC LIMIT 1)
         LEFT JOIN classrooms c ON c.id = cs.classroom_id
         WHERE u.id = ANY($1)
         ORDER BY c.name, cs.student_number, u.username`,
        [allStudentIds]
      );
      students = st.rows;
    }

    const contacts = [
      ...admins.rows.map((a: any) => ({ ...a, contact_type: "admin" })),
      ...students.map((s: any) => ({
        ...s,
        contact_type: homeroomStudentIds.includes(s.id.toString()) ? "homeroom" : "subject",
      })),
    ];

    return NextResponse.json(contacts);
  }

  if (role === "student") {
    const me = await pool.query(
      `SELECT u.id, u.student_id FROM users u WHERE u.id = $1`,
      [id]
    );
    const student = me.rows[0];
    if (!student) return NextResponse.json([]);

    const studentInfo = await pool.query(
      `SELECT cs.classroom_id
       FROM students s
       LEFT JOIN classroom_students cs ON cs.student_id = s.id
         AND cs.setting_id = (SELECT id FROM system_settings WHERE CURRENT_DATE BETWEEN start_date AND end_date ORDER BY id DESC LIMIT 1)
       WHERE s.student_id = $1`,
      [student.student_id]
    );
    const classroomId = studentInfo.rows[0]?.classroom_id;

    // homeroom teacher
    let homeroomTeachers: any[] = [];
    if (classroomId) {
      const ht = await pool.query(
        `SELECT u.id, u.username, u.role, u.email
         FROM users u
         WHERE u.homeroom_classroom_id = $1 AND u.role = 'teacher'`,
        [classroomId]
      );
      homeroomTeachers = ht.rows.map((r: any) => ({ ...r, contact_type: "homeroom_teacher" }));
    }

    // subject teachers
    let subjectTeachers: any[] = [];
    if (classroomId) {
      const st = await pool.query(
        `SELECT DISTINCT u.id, u.username, u.role, u.email, s.name as subject_name
         FROM subjects s
         JOIN subject_classrooms sc ON sc.subject_id = s.id
         LEFT JOIN subject_teachers stt ON stt.subject_id = s.id
         JOIN users u ON (u.id = s.teacher_id OR u.id = stt.user_id)
         WHERE sc.classroom_id = $1 AND u.role = 'teacher'`,
        [classroomId]
      );
      subjectTeachers = st.rows.map((r: any) => ({ ...r, contact_type: "subject_teacher" }));
    }

    // admins (for support)
    const admins = await pool.query(
      `SELECT id, username, role, email FROM users WHERE role = 'admin'`
    );

    const seenIds = new Set<string>();
    const contacts: any[] = [];

    for (const a of admins.rows) {
      if (!seenIds.has(a.id.toString())) {
        seenIds.add(a.id.toString());
        contacts.push({ ...a, contact_type: "admin" });
      }
    }
    for (const t of homeroomTeachers) {
      if (!seenIds.has(t.id.toString())) {
        seenIds.add(t.id.toString());
        contacts.push(t);
      }
    }
    for (const t of subjectTeachers) {
      if (!seenIds.has(t.id.toString())) {
        seenIds.add(t.id.toString());
        contacts.push(t);
      }
    }

    return NextResponse.json(contacts);
  }

  return NextResponse.json([]);
}
