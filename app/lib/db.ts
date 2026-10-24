import { Pool, types } from "pg";

// Parse DATE columns (OID 1082) as raw strings (e.g. "YYYY-MM-DD") instead of
// JS Date objects to prevent timezone offset shifts when serializing to JSON.
types.setTypeParser(1082, (val) => val);

const connectionString = process.env.DATABASE_URL;
const isLocalDb = connectionString?.includes("localhost") || connectionString?.includes("127.0.0.1");

// Pool จะ reuse connections แทนที่จะสร้างใหม่ทุก request
const pool = new Pool({
  connectionString,
  ssl: isLocalDb ? false : { rejectUnauthorized: false }, // SSL ปิดเมื่อใช้ Local DB, เปิดเมื่อใช้ CockroachDB Cloud
  // A serverless deployment can start several instances during a traffic spike.
  // Keep each instance deliberately small so the database is not exhausted by
  // idle pools. Override only when the database capacity is known.
  max: Number(process.env.DB_POOL_MAX || 3),
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 5_000,
});

export default pool;
