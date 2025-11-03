import express from "express";
import multer from "multer";
import fs from "fs";
import { exec } from "child_process";
import path from "path";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 10000;

// ✅ Enable CORS so your frontend can call this server
app.use(cors());
app.use(express.json());
app.use(express.static("uploads"));

// ✅ Ensure uploads folder exists
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

// ✅ Use disk storage with original filenames (optional but clean)
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

// 🔹 Merge shorts
app.post("/merge", async (req, res) => {
  const { files } = req.body;
  if (!files || !files.length) return res.status(400).send("No files provided.");

  const listFile = "uploads/list.txt";
  const content = files.map(f => `file '${path.join("uploads", f)}'`).join("\n");
  fs.writeFileSync(listFile, content);

  const output = `uploads/final_${Date.now()}.mp4`;
  exec(`ffmpeg -f concat -safe 0 -i ${listFile} -c copy ${output}`, (err) => {
    if (err) {
      console.error(err);
      res.status(500).send("Merge failed.");
    } else {
      res.download(output);
    }
  });
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
