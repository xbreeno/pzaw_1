import express from "express";
import db from "./database/db.js";

const APP = express();
const PORT = 6767;

APP.use(express.static("public"));

APP.set("view engine", "ejs");
APP.set("views", "./views");

APP.use(express.urlencoded({ extended: true }));

APP.get("/register", (req, res) => {
  res.render("register", { title: "Rejestracja", editing: false, user: null });
});

APP.get("/register/success", (req, res) => {
  const { name, lname, vtype, vbrand, vmodel } = req.query;
  res.render("register_success", {
    title: "Rejestracja zakończona",
    name,
    lname,
    vtype,
    vbrand,
    vmodel,
  });
});

APP.post("/register", (req, res) => {
  const { name, lname, vtype, vbrand, vmodel } = req.body;

  db.addUser(name, lname, vtype, vbrand, vmodel);
  const params = new URLSearchParams({ name, lname, vtype, vbrand, vmodel }).toString();
  res.redirect(`/register/success?${params}`);
});

APP.get("/participants", (req, res) => {
  console.log("GET /participants requested");
  try {
    const users = db.getUsers();
    res.render("participants", { title: "Lista uczestników", users });
  } catch (err) {
    console.error("Error while fetching participants:", err);
    res.status(500).send("Błąd serwera przy pobieraniu listy uczestników.");
  }
});

APP.get('/participants/:id/edit', (req, res) => {
  const id = req.params.id;
  try {
    const user = db.getUserById(id);
    if (!user) return res.status(404).send('Uczestnik nie znaleziony');
    res.render('register', { title: 'Edytuj uczestnika', user, editing: true });
  } catch (err) {
    console.error('Error while fetching user for edit:', err);
    res.status(500).send('Błąd serwera przy pobieraniu uczestnika.');
  }
});

APP.post('/participants/:id/edit', (req, res) => {
  const id = req.params.id;
  const { name, lname, vtype, vbrand, vmodel } = req.body;
  try {
    db.updateUser(id, name, lname, vtype, vbrand, vmodel);
    res.redirect('/participants');
  } catch (err) {
    console.error('Error while updating user:', err);
    res.status(500).send('Błąd serwera przy aktualizacji uczestnika.');
  }
});

APP.post('/participants/:id/delete', (req, res) => {
  const id = req.params.id;
  try {
    db.deleteUser(id);
    res.redirect('/participants');
  } catch (err) {
    console.error('Error while deleting user:', err);
    res.status(500).send('Błąd serwera przy usuwaniu uczestnika.');
  }
});


APP.listen(PORT, () => {
  console.log(`Serwer listening on http://localhost:${PORT}`);
});
