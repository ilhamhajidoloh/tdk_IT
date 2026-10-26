import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/app/lib/verifyAdmin";
import pool from "@/app/lib/db";
import { getSchoolContext } from "@/app/lib/schoolContext";

type ImportedTopic = { name_th: string; name_rumi?: string; name_jawi?: string };

function parseTopics(value: unknown): ImportedTopic[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const topics: ImportedTopic[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const name_th = typeof row.name_th === "string" ? row.name_th.trim() : "";
    if (!name_th || seen.has(name_th.toLocaleLowerCase())) continue;
    seen.add(name_th.toLocaleLowerCase());
    topics.push({
      name_th,
      name_rumi: typeof row.name_rumi === "string" ? row.name_rumi.trim() : "",
      name_jawi: typeof row.name_jawi === "string" ? row.name_jawi.trim() : "",
    });
  }
  return topics.slice(0, 200);
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized / Forbidden" }, { status: 401 });
  }

  const context = await getSchoolContext(req);
  let schoolId = context?.schoolId;
  if (context?.isSuperAdmin) {
    schoolId = req.nextUrl.searchParams.get("schoolId") || req.nextUrl.searchParams.get("school_id") || schoolId;
  }
  if (!schoolId) schoolId = "00000000-0000-0000-0000-000000000001";

  const { topics: rawTopics } = await req.json();
  const topics = parseTopics(rawTopics);
  if (topics.length === 0) {
    return NextResponse.json({ error: "No valid topics found in the import file" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const existing = await client.query(
      "SELECT LOWER(name_th) AS name FROM evaluation_topics WHERE school_id = $1",
      [schoolId]
    );
    const existingNames = new Set(existing.rows.map((row: { name: string }) => row.name));
    const newTopics = topics.filter(topic => !existingNames.has(topic.name_th.toLocaleLowerCase()));

    if (newTopics.length > 0) {
      const maxOrder = await client.query(
        "SELECT COALESCE(MAX(sort_order), -1) AS max_order FROM evaluation_topics WHERE school_id = $1",
        [schoolId]
      );
      const startOrder = Number(maxOrder.rows[0].max_order) + 1;
      const values: unknown[] = [];
      const rows = newTopics.map((topic, index) => {
        const offset = index * 5;
        values.push(topic.name_th, topic.name_rumi || null, topic.name_jawi || null, startOrder + index, schoolId);
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`;
      });
      await client.query(
        `INSERT INTO evaluation_topics (name_th, name_rumi, name_jawi, sort_order, school_id)
         VALUES ${rows.join(", ")}`,
        values
      );
    }

    await client.query("COMMIT");
    return NextResponse.json({ created: newTopics.length, skipped: topics.length - newTopics.length });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("POST /api/evaluations/topics/import error:", error);
    return NextResponse.json({ error: "Failed to import evaluation topics" }, { status: 500 });
  } finally {
    client.release();
  }
}
