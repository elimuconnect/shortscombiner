import express from "express";
import multer from "multer";
import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(express.static(path.join(__dirname, "public")));

app.post("/combine", upload.array("videos", 100), async (req, res) => {
  try {
    const files = req.files.map(f => path.resolve(f.path));
    const listFile = "uploads/list.txt";
    fs.writeFileSync(listFile, files.map(f => `file '${f}'`).join("\n"));

    const outputPath = `uploads/combined_${Date.now()}.mp4`;

    ffmpeg()
      .input(listFile)
      .inputOptions(["-f concat", "-safe 0"])
      .outputOptions(["-c copy"])
      .save(outputPath)
      .on("end", () => {
        res.download(outputPath, err => {
          if (err) console.error(err);
          // cleanup
          files.forEach(f => fs.unlinkSync(f));
          fs.unlinkSync(listFile);
          fs.unlinkSync(outputPath);
        });
      })
      .on("error", err => {
        console.error(err);
        res.status(500).send("Error combining videos.");
      });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error.");
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
