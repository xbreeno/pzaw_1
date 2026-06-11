import { DatabaseSync } from "node:sqlite";
import argon2 from "argon2";

function getPepper() {
  return process.env.PEPPER ?? null;
}

function getHashParams() {
  const pepper = getPepper();
  return pepper != null ? { secret: Buffer.from(pepper, "hex") } : {};
}

const db_path = "./data.sqlite";
const db = new DatabaseSync(db_path);

db.exec(`
  CREATE TABLE IF NOT EXISTS users_auth (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE,
    passhash TEXT,
    created_at INTEGER,
    is_admin INTEGER DEFAULT 0
  ) STRICT;
`);

try {
  db.exec("ALTER TABLE users_auth ADD COLUMN is_admin INTEGER DEFAULT 0;");
} catch (err) {
}

const db_ops = {
  create_user: db.prepare(
    "INSERT INTO users_auth (username, passhash, created_at, is_admin) VALUES (?, ?, ?, ?) RETURNING id, username, created_at, is_admin;"
  ),
  get_user: db.prepare(
    "SELECT id, username, created_at, is_admin FROM users_auth WHERE id = ?;"
  ),
  find_by_username: db.prepare(
    "SELECT id, username, created_at, is_admin FROM users_auth WHERE username = ?;"
  ),
  get_auth_data: db.prepare(
    "SELECT id, passhash FROM users_auth WHERE username = ?;"
  ),
  find_admin: db.prepare(
    "SELECT id, username, created_at, is_admin FROM users_auth WHERE is_admin = 1 LIMIT 1;"
  ),
  promote_user: db.prepare(
    "UPDATE users_auth SET is_admin = 1 WHERE id = ?;"
  ),
  update_password: db.prepare(
    "UPDATE users_auth SET passhash = ? WHERE id = ?;"
  ),
};

export async function createUser(username, password, isAdmin = 0) {
  let existing_user = db_ops.find_by_username.get(username);
  if (existing_user != null) {
    return null;
  }
  let createdAt = Date.now();
  let passhash = await argon2.hash(password, getHashParams());
  return db_ops.create_user.get(username, passhash, createdAt, isAdmin);
}

export async function validatePassword(username, password) {
  let auth_data = db_ops.get_auth_data.get(username);
  if (auth_data != null) {
    if (await argon2.verify(auth_data.passhash, password, getHashParams())) {
      return auth_data.id;
    }
  }
  return null;
}

export function getUser(user_id) {
  return db_ops.get_user.get(user_id);
}

export function getAdminUser() {
  return db_ops.find_admin.get();
}

export async function updateUserPassword(userId, password) {
  const passhash = await argon2.hash(password, getHashParams());
  db_ops.update_password.run(passhash, userId);
}

export async function ensureAdminUser() {
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUsername || !adminPassword) {
    console.warn(
      "Brak danych administratora w zmiennych środowiskowych. Skonfiguruj ADMIN_USERNAME i ADMIN_PASSWORD w pliku .env."
    );
    return null;
  }

  let existing = db_ops.find_by_username.get(adminUsername);
  if (existing) {
    if (existing.is_admin !== 1) {
      db_ops.promote_user.run(existing.id);
      console.log(`Promoted existing user '${adminUsername}' to admin.`);
    }

    const authData = db_ops.get_auth_data.get(adminUsername);
    const validPassword = authData
      ? await argon2.verify(authData.passhash, adminPassword, getHashParams())
      : false;
    if (!validPassword) {
      await updateUserPassword(existing.id, adminPassword);
      console.log(`Updated password for admin user '${adminUsername}'.`);
    }

    return getUser(existing.id);
  }

  let newAdmin = await createUser(adminUsername, adminPassword, 1);
  if (newAdmin) {
    console.log(`Created default admin user '${adminUsername}'.`);
  }
  return newAdmin;
}

export default {
  createUser,
  validatePassword,
  getUser,
  getAdminUser,
  ensureAdminUser,
};
