import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import db from "./database/db.js";
import session from "./models/session.js";
import auth from "./controllers/auth.js";
import { ensureAdminUser } from "./models/user.js";

dotenv.config();

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

function requireOwnerOrAdmin(req, res, next) {
  if (!res.locals.currentUser) {
    return res.redirect("/auth/login");
  }

  const participant = db.getUserById(req.params.id);
  if (!participant) {
    return res.status(404).send("Uczestnik nie znaleziony");
  }

  const currentUser = res.locals.currentUser;
  const isAdmin = !!currentUser.is_admin;
  const isOwner = participant.created_by != null && Number(participant.created_by) === Number(currentUser.id);

  if (!isAdmin && !isOwner) {
    return res.status(403).send("Nie masz uprawnień do edycji/usunięcia tego wpisu");
  }

  res.locals.participant = participant;
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
  const created_by = res.locals.currentUser?.id ?? null;

  db.addUser(name, lname, vtype, vbrand, vmodel, created_by);
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

APP.get('/participants/:id/edit', requireOwnerOrAdmin, (req, res) => {
  const user = res.locals.participant;
  res.render('register', { title: 'Edytuj uczestnika', user, editing: true });
});

APP.post('/participants/:id/edit', requireOwnerOrAdmin, (req, res) => {
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

APP.post('/participants/:id/delete', requireOwnerOrAdmin, (req, res) => {
  const id = req.params.id;
  try {
    db.deleteUser(id);
    res.redirect('/participants');
  } catch (err) {
    console.error('Error while deleting user:', err);
    res.status(500).send('Błąd serwera przy usuwaniu uczestnika.');
  }
});

await ensureAdminUser()
  .then((admin) => {
    if (admin) {
      console.log(`Admin account active: ${admin.username}`);
    } else {
      console.log("No admin account configured. A default admin account will be created.");
    }
  })
  .catch((err) => {
    console.error("Error ensuring admin user:", err);
  });

APP.listen(PORT, () => {
  console.log(`Serwer listening on http://localhost:${PORT}`);
});
