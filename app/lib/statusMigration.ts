import pool from "./db";

let migrationDone = false;

export async function ensureStatusSchema() {
  if (migrationDone) return;
  try {
    // system_settings columns
    await pool.query("ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS academic_head VARCHAR");
    await pool.query("ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS highest_grade_level VARCHAR");
    await pool.query("ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS data_retention_years INT DEFAULT 5");
    await pool.query("ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS auto_cleanup_enabled BOOLEAN DEFAULT true");
    await pool.query("ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS is_grade_released BOOLEAN DEFAULT true");
    await pool.query("ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS grade_release_date VARCHAR DEFAULT NULL");

    // students columns
    await pool.query("ALTER TABLE students ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'active'");
    await pool.query("ALTER TABLE students ADD COLUMN IF NOT EXISTS graduation_year VARCHAR");
    await pool.query("ALTER TABLE students ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMP");
    await pool.query("ALTER TABLE students ADD COLUMN IF NOT EXISTS status_note TEXT");
    await pool.query("ALTER TABLE students ADD COLUMN IF NOT EXISTS enrollment_date DATE");
    await pool.query("ALTER TABLE students ADD COLUMN IF NOT EXISTS graduation_date DATE");

    // users columns
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'active'");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS resigned_at TIMESTAMP");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS resignation_reason TEXT");

    // student_gpa_digests table for long-term retention
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_gpa_digests (
        id SERIAL PRIMARY KEY,
        student_id BIGINT NOT NULL,
        academic_year VARCHAR NOT NULL,
        term VARCHAR NOT NULL,
        gpa NUMERIC DEFAULT 0,
        total_credits NUMERIC DEFAULT 0,
        grade_summary_json JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    migrationDone = true;
  } catch (err) {
    console.error("Error in ensureStatusSchema migration:", err);
  }
}
