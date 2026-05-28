import { DatabaseSync } from "node:sqlite";
import { randomBytes } from "node:crypto";
import { getUser } from "./user.js";

const db_path = "./data.sqlite";
const db = new DatabaseSync(db_path, { readBigInts: true });

const SESSION_COOKIE = "session_id";
const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    created_at INTEGER
  ) STRICT;
`);

db.exec("DELETE FROM sessions WHERE user_id IS NULL;");

const db_ops = {
  create_session: db.prepare(
    `INSERT INTO sessions (id, user_id, created_at) VALUES (?, ?, ?) RETURNING id, user_id, created_at;`
  ),
  get_session: db.prepare(
    `SELECT id, user_id, created_at FROM sessions WHERE id = ?;`
  ),
  delete_session: db.prepare(`DELETE FROM sessions WHERE id = ?;`),
};

function parseSessionId(sessionId) {
  if (sessionId == null) return null;
  if (!sessionId.match(/^-?[0-9]+$/)) return null;
  try {
    return BigInt(sessionId);
  } catch {
    return null;
  }
}

export function createSession(userId, res) {
  if (userId == null) {
    return null;
  }

  let sessionId = randomBytes(8).readBigInt64BE();
  let createdAt = Date.now();

  let session = db_ops.create_session.get(sessionId, userId, createdAt);
  if (session == null) return null;

  res.locals.session = session;
  res.locals.currentUser = getUser(userId);

  res.cookie(SESSION_COOKIE, session.id.toString(), {
    maxAge: ONE_WEEK,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return session;
}

export function deleteSession(res) {
  const session = res.locals.session;
  if (session?.id != null) {
    db_ops.delete_session.run(session.id);
  }
  res.clearCookie(SESSION_COOKIE, { path: "/" });
  res.locals.session = null;
  res.locals.currentUser = null;
}

export function sessionHandler(req, res, next) {
  let sessionId = parseSessionId(req.cookies[SESSION_COOKIE]);
  let session = null;

  if (sessionId != null) {
    session = db_ops.get_session.get(sessionId);
  }

  if (session != null && session.user_id != null) {
    res.locals.session = session;
    res.locals.currentUser = getUser(session.user_id);
    res.cookie(SESSION_COOKIE, session.id.toString(), {
      maxAge: ONE_WEEK,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
  } else {
    if (session != null) {
      db_ops.delete_session.run(session.id);
    }
    if (sessionId != null) {
      res.clearCookie(SESSION_COOKIE, { path: "/" });
    }
    res.locals.session = null;
    res.locals.currentUser = null;
  }

  next();
}

export default {
  createSession,
  deleteSession,
  sessionHandler,
};
