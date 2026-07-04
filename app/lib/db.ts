import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
const isLocalDb = connectionString?.includes("localhost") || connectionString?.includes("127.0.0.1");

// Pool จะ reuse connections แทนที่จะสร้างใหม่ทุก request
const pool = new Pool({
  connectionString,
  ssl: isLocalDb ? false : { rejectUnauthorized: false }, // SSL ปิดเมื่อใช้ Local DB, เปิดเมื่อใช้ CockroachDB Cloud
});

export default pool;
