import express from "express";
import multer from "multer";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import fs from "fs";
import path from "path";
import cors from "cors";

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

// Create upload folders if missing
const UPLOADS_DIR = path.resolve("./uploads");
const TMP_DIR = path.join(UPLOADS_DIR, "tmp");

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

const app = express();
const PORT = process.env.PORT || 10000;

// Enable CORS
app.use(cors());

// Multer setup
const upload = multer({ dest: UPLOADS_DIR });

// Combine videos endpoint
app.post("/combine", upload.array("videos"), (req, res) => {
  if (!req.files || req.files.length === 0)
    return res.status(400).send("No files uploaded");

  const outputPath = path.join(UPLOADS_DIR, `combined_${Date.now()}.mp4`);
  const command = ffmpeg();
  req.files.forEach(file => command.input(file.path));

  command
    .on("error", err => {
      console.error("FFmpeg error:", err);
      req.files.forEach(f => fs.unlinkSync(f.path));
      res.status(500).send("Failed to combine videos");
    })
    .on("end", () => {
      res.sendFile(outputPath, err => {
        if (err) console.error(err);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        req.files.forEach(f => fs.unlinkSync(f.path));
      });
    })
    .mergeToFile(outputPath, TMP_DIR);
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
