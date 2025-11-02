import express from "express";
import multer from "multer";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";

// Create uploads folders if missing
const UPLOADS_DIR = path.resolve("./uploads");
const TMP_DIR = path.join(UPLOADS_DIR, "tmp");

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

const app = express();
const upload = multer({ dest: UPLOADS_DIR });
const PORT = process.env.PORT || 10000;

// Serve static frontend from root folder
app.use(express.static(path.resolve("./")));

// API endpoint to combine videos
app.post("/combine", upload.array("videos"), (req, res) => {
  if (!req.files || req.files.length === 0) return res.status(400).send("No files uploaded");

  const outputPath = path.join(UPLOADS_DIR, `combined_${Date.now()}.mp4`);
  const command = ffmpeg();

  req.files.forEach(file => command.input(file.path));

  command
    .on("error", err => {
      console.error("FFmpeg error:", err);
      // Clean up uploaded files on error
      req.files.forEach(f => fs.unlinkSync(f.path));
      res.status(500).send("Failed to combine videos");
    })
    .on("end", () => {
      res.download(outputPath, err => {
        if (err) console.error("Download error:", err);
        // Clean up output and uploaded files
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        req.files.forEach(f => fs.unlinkSync(f.path));
      });
    })
    .mergeToFile(outputPath, TMP_DIR);
});

// Fallback for all other routes: serve index.html
app.get("*", (req, res) => {
  res.sendFile(path.resolve("./index.html"));
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
