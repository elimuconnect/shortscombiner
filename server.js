const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static frontend
app.use(express.static('public'));

// Upload folder
const upload = multer({ dest: 'uploads/' });

// Handle file uploads
app.post('/combine', upload.array('videos', 100), async (req, res) => {
  const files = req.files;
  if (!files || files.length === 0) return res.status(400).send('No files uploaded');

  const outputName = `combined_${Date.now()}.mp4`;
  const outputPath = path.join(__dirname, 'public', outputName);

  try {
    // Create a text file for ffmpeg concat
    const concatList = files.map(f => `file '${f.path}'`).join('\n');
    const listPath = path.join(__dirname, 'uploads', 'list.txt');
    fs.writeFileSync(listPath, concatList);

    // Run ffmpeg concat
    ffmpeg()
      .input(listPath)
      .inputOptions(['-f concat', '-safe 0'])
      .outputOptions(['-c copy'])
      .output(outputPath)
      .on('end', () => {
        // Cleanup uploaded files
        files.forEach(f => fs.unlinkSync(f.path));
        fs.unlinkSync(listPath);

        res.json({ url: `/${outputName}` });
      })
      .on('error', (err) => {
        console.error(err);
        res.status(500).send('Error combining videos');
      })
      .run();
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
