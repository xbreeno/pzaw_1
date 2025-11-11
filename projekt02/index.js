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

APP.post("/register", (req, res) => {
  const { name, lname, vtype, vbrand, vmodel } = req.body;

  db.addUser(name, lname, vtype, vbrand, vmodel);

  res.send(`Zapisano: ${name} ${lname}, pojazd: ${vtype}, ${vbrand} ${vmodel}`);
});


APP.listen(PORT, () => {
  console.log(`Serwer listening on http://localhost:${PORT}`);
});
