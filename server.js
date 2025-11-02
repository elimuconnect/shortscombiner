import express from "express";
import multer from "multer";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";

const app = express();
const upload = multer({ dest: "uploads/" });
const PORT = process.env.PORT || 10000;

// Serve static frontend from root
app.use(express.static(path.resolve("./")));  // <-- serve root folder

// Optional fallback
app.get("*", (req, res) => {
  res.sendFile(path.resolve("./index.html"));
});
