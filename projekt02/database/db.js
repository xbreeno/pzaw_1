import { DatabaseSync } from "node:sqlite";

const db_path = "./data.sqlite";
const db = new DatabaseSync(db_path);

db.exec(`
CREATE TABLE IF NOT EXISTS Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    lname TEXT NOT NULL,ą
    vtype TEXT NOT NULL,
    vbrand TEXT NOT NULL,
    vmodel TEXT NOT NULL
) STRICT;
`);

function addUser(name, lname, vtype, vbrand, vmodel) {
    const stmt = db.prepare(
        "INSERT INTO Users (name, lname, vtype, vbrand, vmodel) VALUES (?, ?, ?, ?, ?);"
    );
    return stmt.run(name, lname, vtype, vbrand, vmodel);
}

export default {
  addUser,
};
