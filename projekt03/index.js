import express from "express";
import db from "./database/db.js";

const APP = express();
const PORT = 6767;

APP.use(express.static("public"));

APP.set("view engine", "ejs");
APP.set("views", "./views");

APP.use(express.urlencoded({ extended: true }));

APP.get("/register", (req, res) => {
  res.render("register", { title: "Rejestracja" });
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


APP.listen(PORT, () => {
  console.log(`Serwer listening on http://localhost:${PORT}`);
});
