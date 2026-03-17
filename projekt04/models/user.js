import { DatabaseSync } from "node:sqlite";
import argon2 from "argon2";

const PEPPER = process.env.PEPPER ?? null;
if (PEPPER == null) {
  console.warn(
    "PEPPER environment variable missing. Password hashing will still work, but it is recommended to set PEPPER for better security."
  );
}

const HASH_PARAMS = {
  secret: PEPPER != null ? Buffer.from(PEPPER, "hex") : undefined,
};

const db_path = "./data.sqlite";
const db = new DatabaseSync(db_path);

db.exec(`
  CREATE TABLE IF NOT EXISTS users_auth (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE,
    passhash TEXT,
    created_at INTEGER
  ) STRICT;
`);

const db_ops = {
  create_user: db.prepare(
    "INSERT INTO users_auth (username, passhash, created_at) VALUES (?, ?, ?) RETURNING id;"
  ),
  get_user: db.prepare(
    "SELECT id, username, created_at FROM users_auth WHERE id = ?;"
  ),
  find_by_username: db.prepare(
    "SELECT id, username, created_at FROM users_auth WHERE username = ?;"
  ),
  get_auth_data: db.prepare(
    "SELECT id, passhash FROM users_auth WHERE username = ?;"
  ),
};

export async function createUser(username, password) {
  let existing_user = db_ops.find_by_username.get(username);
  if (existing_user != null) {
    return null;
  }
  let createdAt = Date.now();
  let passhash = await argon2.hash(password, HASH_PARAMS);
  return db_ops.create_user.get(username, passhash, createdAt);
}

export async function validatePassword(username, password) {
  let auth_data = db_ops.get_auth_data.get(username);
  if (auth_data != null) {
    if (await argon2.verify(auth_data.passhash, password, HASH_PARAMS)) {
      return auth_data.id;
    }
  }
  return null;
}

export function getUser(user_id) {
  return db_ops.get_user.get(user_id);
}

export default {
  createUser,
  validatePassword,
  getUser,
};
