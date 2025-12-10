import { DatabaseSync } from "node:sqlite";

const db_path = "./data.sqlite";
const db = new DatabaseSync(db_path);

db.exec(`
CREATE TABLE IF NOT EXISTS Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    lname TEXT NOT NULL,
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

function getUsers() {
    const stmt = db.prepare("SELECT * FROM Users ORDER BY id ASC;");
    return stmt.all();
}

function getUserById(id) {
    const stmt = db.prepare("SELECT * FROM Users WHERE id = ?;");
    return stmt.get(id);
}

function updateUser(id, name, lname, vtype, vbrand, vmodel) {
    const stmt = db.prepare(
        "UPDATE Users SET name = ?, lname = ?, vtype = ?, vbrand = ?, vmodel = ? WHERE id = ?;"
    );
    return stmt.run(name, lname, vtype, vbrand, vmodel, id);
}

function deleteUser(id) {
    const stmt = db.prepare("DELETE FROM Users WHERE id = ?;");
    return stmt.run(id);
}

export default {
    addUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
};
