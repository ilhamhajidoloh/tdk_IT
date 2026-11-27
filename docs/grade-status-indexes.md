# Indexes for the grade status API

Apply these once to an existing database after deploying the query change in
`app/api/grades/status/route.ts`. They support filtering subjects by term and
joining students by term and classroom. Index creation is kept out of request
handlers so it cannot delay the first API call on a new server instance.

```sql
CREATE INDEX IF NOT EXISTS idx_classroom_students_setting_classroom
  ON public.classroom_students(setting_id, classroom_id);

CREATE INDEX IF NOT EXISTS idx_subjects_setting_id
  ON public.subjects(setting_id);
```

The existing unique constraint on `grades(student_id, subject, term)` already
provides an index for the grade lookup in this endpoint.
