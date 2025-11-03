import express from "express";
import multer from "multer";
import fs from "fs";
import { exec } from "child_process";
import path from "path";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 10000;

// ✅ Enable CORS
app.use(cors());
app.use(express.json());
app.use(express.static("uploads"));

// ✅ Ensure uploads folder exists
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

// ✅ Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// 🔹 Upload short
app.post("/upload", upload.single("video"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded." });
  res.json({ filename: req.file.filename });
});

// 🔹 Merge shorts asynchronously and cleanup
app.post("/merge", async (req, res) => {
  const { files } = req.body;
  if (!files || !files.length) return res.status(400).send("No files provided.");

  const listFile = "uploads/list.txt";
  const content = files.map(f => `file '${path.join("uploads", f)}'`).join("\n");
  fs.writeFileSync(listFile, content);

  const output = `uploads/final_${Date.now()}.mp4`;

  const ffmpegCmd = `ffmpeg -f concat -safe 0 -i ${listFile} -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k ${output}`;

  exec(ffmpegCmd, (err, stdout, stderr) => {
    // Remove temporary list file immediately
    fs.unlink(listFile, e => e && console.error("Failed to remove list.txt:", e));

    if (err) {
      console.error("FFmpeg merge error:", err);
      console.error(stderr);
      return res.status(500).send("Merge failed. See server logs for details.");
    }

    // Optional: remove individual uploaded clips after merge
    files.forEach(f => {
      const filePath = path.join("uploads", f);
      fs.unlink(filePath, e => e && console.error(`Failed to remove ${f}:`, e));
    });

    console.log("FFmpeg merge success:", stdout);
    res.download(output, (downloadErr) => {
      if (downloadErr) console.error("Download error:", downloadErr);

      // Optional: remove merged file after download
      // fs.unlink(output, e => e && console.error("Failed to remove merged file:", e));
    });
  });
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
