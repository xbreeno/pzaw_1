import { DatabaseSync } from "node:sqlite";

const db_path = "./data.sqlite";
const db = new DatabaseSync(db_path);

const LEGACY_USERS_TABLE = "Users";
const PARTICIPANTS_TABLE = "participants";

db.exec(`
CREATE TABLE IF NOT EXISTS ${PARTICIPANTS_TABLE} (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    lname TEXT NOT NULL,
    vtype TEXT NOT NULL,
    vbrand TEXT NOT NULL,
    vmodel TEXT NOT NULL,
    created_by INTEGER
) STRICT;
`);

function tableExists(name) {
  return db.prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?;"
  ).get(name) != null;
}

if (tableExists(LEGACY_USERS_TABLE) && tableExists(PARTICIPANTS_TABLE)) {
  const count = db.prepare(`SELECT COUNT(*) as count FROM ${PARTICIPANTS_TABLE};`).get()?.count ?? 0;
  if (count === 0) {
    db.exec(`
      INSERT INTO ${PARTICIPANTS_TABLE} (name, lname, vtype, vbrand, vmodel, created_by)
      SELECT name, lname, vtype, vbrand, vmodel, created_by FROM ${LEGACY_USERS_TABLE};
    `);
  }
}

function addUser(name, lname, vtype, vbrand, vmodel, created_by = null) {
    const stmt = db.prepare(
        `INSERT INTO ${PARTICIPANTS_TABLE} (name, lname, vtype, vbrand, vmodel, created_by) VALUES (?, ?, ?, ?, ?, ?);`
    );
    return stmt.run(name, lname, vtype, vbrand, vmodel, created_by);
}

function getUsers() {
    const stmt = db.prepare(`SELECT * FROM ${PARTICIPANTS_TABLE} ORDER BY id ASC;`);
    return stmt.all();
}

function getUserById(id) {
    const stmt = db.prepare(`SELECT * FROM ${PARTICIPANTS_TABLE} WHERE id = ?;`);
    return stmt.get(id);
}

function updateUser(id, name, lname, vtype, vbrand, vmodel) {
    const stmt = db.prepare(
        `UPDATE ${PARTICIPANTS_TABLE} SET name = ?, lname = ?, vtype = ?, vbrand = ?, vmodel = ? WHERE id = ?;`
    );
    return stmt.run(name, lname, vtype, vbrand, vmodel, id);
}

function deleteUser(id) {
    const stmt = db.prepare(`DELETE FROM ${PARTICIPANTS_TABLE} WHERE id = ?;`);
    return stmt.run(id);
}

export default {
    addUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
};
