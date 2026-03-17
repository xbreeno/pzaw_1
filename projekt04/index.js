import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import db from "./database/db.js";
import session from "./models/session.js";
import auth from "./controllers/auth.js";

const APP = express();
const PORT = process.env.PORT || 6767;

const SECRET = process.env.SECRET ?? "dev-secret";

APP.use(express.urlencoded({ extended: true }));
APP.use(morgan("dev"));
APP.use(cookieParser(SECRET));
APP.use(session.sessionHandler);

APP.use(express.static("public"));

APP.set("view engine", "ejs");
APP.set("views", "./views");

function requireLogin(req, res, next) {
  if (!res.locals.currentUser) {
    return res.redirect("/auth/login");
  }
  next();
}

APP.get("/", (req, res) => {
  res.render("home", { title: "Strona główna" });
});

const authRouter = express.Router();
authRouter.get("/signup", auth.signup_get);
authRouter.post("/signup", auth.signup_post);
authRouter.get("/login", auth.login_get);
authRouter.post("/login", auth.login_post);
authRouter.get("/logout", auth.logout);
APP.use("/auth", authRouter);

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

APP.get("/participants", requireLogin, (req, res) => {
  console.log("GET /participants requested");
  try {
    const users = db.getUsers();
    res.render("participants", { title: "Lista uczestników", users });
  } catch (err) {
    console.error("Error while fetching participants:", err);
    res.status(500).send("Błąd serwera przy pobieraniu listy uczestników.");
  }
});

APP.get('/participants/:id/edit', requireLogin, (req, res) => {
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

APP.post('/participants/:id/edit', requireLogin, (req, res) => {
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

APP.post('/participants/:id/delete', requireLogin, (req, res) => {
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
