import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { randomBytes } from "node:crypto";
import db from "./database/db.js";
import session from "./models/session.js";
import auth from "./controllers/auth.js";
import { ensureAdminUser } from "./models/user.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: join(__dirname, ".env") });

const APP = express();
const PORT = process.env.PORT || 6767;

const SECRET = process.env.SECRET ?? "dev-secret";

APP.use(express.urlencoded({ extended: true }));
APP.use(morgan("dev"));
APP.use(cookieParser(SECRET));
APP.use(session.sessionHandler);

function ensureCsrfToken(req, res, next) {
  const CSRF_COOKIE = "csrf_token";
  let token = req.signedCookies[CSRF_COOKIE];
  if (typeof token !== "string" || token.length !== 32) {
    token = randomBytes(16).toString("hex");
    res.cookie(CSRF_COOKIE, token, {
      signed: true,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
  }
  res.locals.csrfToken = token;

  if (req.method === "POST") {
    if (req.body.csrf_token !== token) {
      return res.status(403).send("Próba wysłania formularza bez ważnego tokenu CSRF.");
    }
  }
  next();
}

APP.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});

APP.use(ensureCsrfToken);

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

const PARTICIPANT_TYPES = ["Cross", "Quad"];

function getParticipantData(req) {
  return {
    name: req.body.name?.trim() ?? "",
    lname: req.body.lname?.trim() ?? "",
    vtype: req.body.vtype ?? "",
    vbrand: req.body.vbrand?.trim() ?? "",
    vmodel: req.body.vmodel?.trim() ?? "",
  };
}

function validateParticipant(data) {
  const errors = {};

  if (!data.name) {
    errors.name = "Podaj imię";
  } else if (data.name.length < 2) {
    errors.name = "Imię musi mieć przynajmniej 2 znaki";
  }

  if (!data.lname) {
    errors.lname = "Podaj nazwisko";
  } else if (data.lname.length < 2) {
    errors.lname = "Nazwisko musi mieć przynajmniej 2 znaki";
  }

  if (!PARTICIPANT_TYPES.includes(data.vtype)) {
    errors.vtype = "Wybierz typ pojazdu";
  }

  if (!data.vbrand) {
    errors.vbrand = "Podaj markę pojazdu";
  } else if (data.vbrand.length < 2) {
    errors.vbrand = "Marka musi mieć przynajmniej 2 znaki";
  }

  if (!data.vmodel) {
    errors.vmodel = "Podaj model pojazdu";
  } else if (data.vmodel.length < 2) {
    errors.vmodel = "Model musi mieć przynajmniej 2 znaki";
  }

  return errors;
}

function renderParticipantForm(res, { title, editing, form }) {
  res.render("register", { title, editing, form });
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

APP.get("/register", requireLogin, (req, res) => {
  renderParticipantForm(res, {
    title: "Rejestracja uczestnika",
    editing: false,
    form: {
      data: { name: "", lname: "", vtype: "", vbrand: "", vmodel: "" },
      errors: {},
      action: "/register",
    },
  });
});

APP.get("/register/success", (req, res) => {
  res.redirect("/register");
});

APP.post("/register", requireLogin, (req, res) => {
  const formData = getParticipantData(req);
  const errors = validateParticipant(formData);

  if (Object.keys(errors).length > 0) {
    renderParticipantForm(res, {
      title: "Rejestracja uczestnika",
      editing: false,
      form: {
        data: formData,
        errors,
        action: "/register",
      },
    });
    return;
  }

  db.addUser(
    formData.name,
    formData.lname,
    formData.vtype,
    formData.vbrand,
    formData.vmodel,
    res.locals.currentUser.id,
  );

  res.render("register_success", {
    title: "Rejestracja zakończona",
    name: formData.name,
    lname: formData.lname,
    vtype: formData.vtype,
    vbrand: formData.vbrand,
    vmodel: formData.vmodel,
  });
});

APP.get("/participants", (req, res) => {
  console.log("GET /participants requested");
  try {
    const users = db.getUsers();
    res.render("participants", { title: "Lista uczestników", users, currentPath: req.path });
  } catch (err) {
    console.error("Error while fetching participants:", err);
    res.status(500).send("Błąd serwera przy pobieraniu listy uczestników.");
  }
});

APP.get('/participants/:id/edit', requireOwnerOrAdmin, (req, res) => {
  const user = res.locals.participant;
  renderParticipantForm(res, {
    title: 'Edytuj uczestnika',
    editing: true,
    form: {
      data: {
        name: user.name,
        lname: user.lname,
        vtype: user.vtype,
        vbrand: user.vbrand,
        vmodel: user.vmodel,
      },
      errors: {},
      action: `/participants/${user.id}/edit`,
    },
  });
});

APP.post('/participants/:id/edit', requireOwnerOrAdmin, (req, res) => {
  const id = req.params.id;
  const formData = getParticipantData(req);
  const errors = validateParticipant(formData);

  if (Object.keys(errors).length > 0) {
    renderParticipantForm(res, {
      title: 'Edytuj uczestnika',
      editing: true,
      form: {
        data: formData,
        errors,
        action: `/participants/${id}/edit`,
      },
    });
    return;
  }

  try {
    db.updateUser(id, formData.name, formData.lname, formData.vtype, formData.vbrand, formData.vmodel);
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
      console.log("Brak konta administratora. Upewnij się, że zdefiniowano ADMIN_USERNAME i ADMIN_PASSWORD.");
    }
  })
  .catch((err) => {
    console.error("Error ensuring admin user:", err);
  });

APP.listen(PORT, () => {
  console.log(`Serwer listening on http://localhost:${PORT}`);
});
