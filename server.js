import express from "express";
import multer from "multer";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";

const app = express();
const upload = multer({ dest: "uploads/" });
const PORT = process.env.PORT || 10000;

// Serve static frontend if you want
app.use(express.static("public"));

// API endpoint to combine videos
app.post("/combine", upload.array("videos"), async (req, res) => {
  const outputPath = `combined_${Date.now()}.mp4`;
  const files = req.files.map(f => f.path);

  if (files.length === 0) return res.status(400).send("No files uploaded");

  const command = ffmpeg();

  files.forEach(f => command.input(f));

  command
    .on("error", err => {
      console.error("FFmpeg error:", err);
      res.status(500).send("Failed to combine videos");
    })
    .on("end", () => {
      const fileData = fs.readFileSync(outputPath);
      res.setHeader("Content-Type", "video/mp4");
      res.send(fileData);
      fs.unlinkSync(outputPath);
      files.forEach(f => fs.unlinkSync(f));
    })
    .mergeToFile(outputPath, "tmp");
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
