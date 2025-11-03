import express from "express";
import multer from "multer";
import fs from "fs";
import { exec } from "child_process";
import path from "path";

const app = express();
const upload = multer({ dest: "uploads/" });
const PORT = process.env.PORT || 10000;

// Ensure folders exist
fs.mkdirSync("uploads", { recursive: true });
fs.mkdirSync("merged", { recursive: true });

app.use(express.json());
app.use(express.static("public"));

// Upload endpoint
app.post("/upload", upload.single("video"), (req, res) => {
  console.log("📥 Uploaded:", req.file.originalname);
  res.json({ success: true, filename: req.file.filename });
});

// Merge endpoint
app.post("/merge", async (req, res) => {
  try {
    const { order } = req.body; // optional: order of files
    const files = order && Array.isArray(order)
      ? order
      : fs.readdirSync("uploads").filter(f => f.endsWith(".webm") || f.endsWith(".mp4"));

    const listPath = "filelist.txt";
    const listContent = files.map(f => `file '${path.join("uploads", f)}'`).join("\n");
    fs.writeFileSync(listPath, listContent);

    const outputFile = `merged/final_${Date.now()}.mp4`;
    const command = `ffmpeg -f concat -safe 0 -i ${listPath} -c copy ${outputFile}`;

    console.log("🔧 Running:", command);
    await new Promise((resolve, reject) => {
      exec(command, (err, stdout, stderr) => {
        if (err) return reject(err);
        console.log("✅ Merge complete:", outputFile);
        resolve();
      });
    });

    res.download(outputFile, "final_video.mp4");
  } catch (err) {
    console.error("❌ Merge failed:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Shorts backend running on port ${PORT}`));
