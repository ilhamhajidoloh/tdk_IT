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
    // Ranking visibility is deliberately separate from grade publication.
    await pool.query("ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS is_ranking_released BOOLEAN DEFAULT false");
    // Attendance is recorded as yearly totals, not a daily log.  This value is
    // deliberately shared by every term in the same academic year.
    await pool.query("ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS attendance_total_weeks INTEGER DEFAULT 0");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance_yearly_summaries (
        id BIGSERIAL PRIMARY KEY,
        school_id UUID NOT NULL,
        academic_year VARCHAR NOT NULL,
        subject_id TEXT NOT NULL,
        classroom_id TEXT NOT NULL,
        student_id VARCHAR NOT NULL,
        present_days INTEGER NOT NULL DEFAULT 0 CHECK (present_days >= 0),
        sick_leave_days INTEGER NOT NULL DEFAULT 0 CHECK (sick_leave_days >= 0),
        personal_leave_days INTEGER NOT NULL DEFAULT 0 CHECK (personal_leave_days >= 0),
        recorded_by TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT unique_yearly_attendance_summary
          UNIQUE (school_id, academic_year, subject_id, classroom_id, student_id)
      );
    `);

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
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_co_admin BOOLEAN DEFAULT FALSE");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_permissions JSONB DEFAULT NULL");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_users_is_co_admin ON users(is_co_admin) WHERE is_co_admin = TRUE");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_users_permissions ON users USING GIN (admin_permissions)");

    // Subject ordering was added after the initial schema. Keep older schools compatible.
    await pool.query("ALTER TABLE subjects ADD COLUMN IF NOT EXISTS sort_order INTEGER");
    await pool.query("ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS name_jawi TEXT");

    // A classroom belongs to one academic term, so its homeroom teacher must
    // be stored on the classroom rather than on the teacher's global profile.
    await pool.query("ALTER TABLE classrooms ADD COLUMN IF NOT EXISTS homeroom_teacher_id UUID REFERENCES users(id) ON DELETE SET NULL");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_classrooms_homeroom_teacher ON classrooms(homeroom_teacher_id)");
    await pool.query(`
      UPDATE classrooms
         SET homeroom_teacher_id = (
           SELECT u.id
             FROM users u
            WHERE u.role = 'teacher'
              AND u.homeroom_classroom_id = classrooms.id::text
            ORDER BY u.id
            LIMIT 1
         )
       WHERE homeroom_teacher_id IS NULL
         AND EXISTS (
           SELECT 1
             FROM users u
            WHERE u.role = 'teacher'
              AND u.homeroom_classroom_id = classrooms.id::text
         )
    `);

    // A classroom may have several homeroom teachers, but a teacher may only be
    // homeroom teacher of one classroom per term. setting_id is copied from the
    // classroom so the database can enforce that rule with a unique constraint.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS classroom_homeroom_teachers (
        classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
        teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        setting_id BIGINT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now(),
        PRIMARY KEY (classroom_id, teacher_id),
        CONSTRAINT unique_homeroom_teacher_per_term UNIQUE (teacher_id, setting_id)
      )
    `);
    // classrooms.homeroom_teacher_id is the previous single-teacher column; it
    // is kept only as a migration source and is no longer read by the app.
    await pool.query(`
      INSERT INTO classroom_homeroom_teachers (classroom_id, teacher_id, setting_id)
      SELECT c.id, c.homeroom_teacher_id, c.setting_id
        FROM classrooms c
       WHERE c.homeroom_teacher_id IS NOT NULL
         AND c.setting_id IS NOT NULL
      ON CONFLICT DO NOTHING
    `);

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
