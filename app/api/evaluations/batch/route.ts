import { NextRequest, NextResponse } from "next/server";
import { verifyUser } from "@/app/lib/verifyUser";
import pool from "@/app/lib/db";
import { RWT_TOPICS } from "@/app/lib/evaluation";

async function ownsSubject(userId: string, subjectId: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT 1 FROM subjects s
     LEFT JOIN subject_teachers st ON st.subject_id = s.id
     WHERE s.id = $1 AND (s.teacher_id = $2 OR st.user_id = $2)
     LIMIT 1`,
    [subjectId, userId]
  );
  return result.rows.length > 0;
}

const RWT_KEYS = new Set(RWT_TOPICS.map((t) => t.key as string));

export async function POST(req: NextRequest) {
  const user = await verifyUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studentId, subjectId, term, records } = await req.json();

  if (!studentId || !subjectId || !term || !Array.isArray(records)) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (user.role !== "admin" && !(await ownsSubject(user.id, subjectId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  for (const r of records) {
    if (r.category !== "character" && r.category !== "rwt") {
      return NextResponse.json({ error: `Invalid category: ${r.category}` }, { status: 400 });
    }
    if (r.category === "rwt" && !RWT_KEYS.has(r.topicKey)) {
      return NextResponse.json({ error: `Invalid RWT topic_key: ${r.topicKey}` }, { status: 400 });
    }
    if (!Number.isInteger(r.rating) || r.rating < 0 || r.rating > 3) {
      return NextResponse.json({ error: `Invalid rating: ${r.rating}` }, { status: 400 });
    }
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const saved = [];
    for (const r of records) {
      const result = await client.query(
        `INSERT INTO evaluation_records (student_id, subject_id, category, topic_key, rating, term)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT ON CONSTRAINT unique_evaluation_record
         DO UPDATE SET rating = EXCLUDED.rating, updated_at = now()
         RETURNING id, student_id, subject_id, category, topic_key, rating, term`,
        [studentId, subjectId, r.category, r.topicKey, r.rating, term]
      );
      saved.push(result.rows[0]);
    }
    await client.query("COMMIT");
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("POST /api/evaluations/batch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    client.release();
  }
}
