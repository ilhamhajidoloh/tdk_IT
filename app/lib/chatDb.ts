import pool from "@/app/lib/db";

let initialized = false;

export async function ensureChatTables() {
  if (initialized) return;

  try {
    await pool.query(`SELECT 1 FROM chat_messages LIMIT 0`);
    initialized = true;
    return;
  } catch {
    // tables don't exist yet, create them
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_conversations (
      id SERIAL PRIMARY KEY,
      type VARCHAR(20) NOT NULL DEFAULT 'direct',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_participants (
      id SERIAL PRIMARY KEY,
      conversation_id INT NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      guest_name VARCHAR(100),
      guest_session_id VARCHAR(255),
      joined_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id SERIAL PRIMARY KEY,
      conversation_id INT NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
      sender_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      sender_guest_session_id VARCHAR(255),
      content TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  try {
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_chat_participants_conv ON chat_participants(conversation_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_chat_participants_user ON chat_participants(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_chat_messages_conv ON chat_messages(conversation_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_chat_participants_guest ON chat_participants(guest_session_id)`);
  } catch {
    // indexes may already exist
  }

  initialized = true;
}
