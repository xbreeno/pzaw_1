import express from "express";

const APP = express();
const PORT = 8000;

APP.listen(PORT, () => {
    console.log(`Serwer listening on http://localhost:${PORT}`);
})