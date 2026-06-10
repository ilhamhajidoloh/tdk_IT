import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";

function formatRow(row: any) {
  if (!row) return row;
  return {
    ...row,
    midterm_score: row.midterm_score !== null ? Number(row.midterm_score) : null,
    final_score: row.final_score !== null ? Number(row.final_score) : null,
  };
}

export async function GET(req: NextRequest) {
  const token = req.headers.get("Authorization")?.split("Bearer ")[1];
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const studentId = req.nextUrl.searchParams.get("studentId");
  const term = req.nextUrl.searchParams.get("term");

  let query = "SELECT * FROM grades WHERE 1=1";
  const params: string[] = [];

  if (studentId) {
    params.push(studentId);
    query += ` AND student_id = $${params.length}`;
  }
  if (term) {
    params.push(term);
    query += ` AND term = $${params.length}`;
  }

  query += " ORDER BY student_id, subject";
  const result = await pool.query(query, params);
  return NextResponse.json(result.rows.map(formatRow));
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization")?.split("Bearer ")[1];
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { student_id, subject, midterm_score, final_score, term } = await req.json();

  if (!student_id || !subject || !term) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Upsert — ถ้ามีอยู่แล้ว (student+subject+term) ให้ update แทน insert
  const result = await pool.query(
    `INSERT INTO grades (student_id, subject, midterm_score, final_score, term)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT ON CONSTRAINT unique_student_subject_term
     DO UPDATE SET midterm_score = EXCLUDED.midterm_score, final_score = EXCLUDED.final_score
     RETURNING *`,
    [student_id, subject, midterm_score ?? null, final_score ?? null, term]
  );

  return NextResponse.json(formatRow(result.rows[0]), { status: 201 });
}
