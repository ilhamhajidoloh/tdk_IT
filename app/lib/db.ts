import { Pool } from "pg";

// Pool จะ reuse connections แทนที่จะสร้างใหม่ทุก request
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // จำเป็นสำหรับ CockroachDB Cloud
});

export default pool;
