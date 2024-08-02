const { IncomingForm } = require('formidable');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const cors = require('cors');
const express = require('express');
const execPromise = util.promisify(exec);

// Define paths
const TEMP_DIR = '/tmp';
const app = express();
app.use(cors({
  origin:"http://localhost:3000"
})); // Enable CORS
app.use(express.json());
module.exports = async (req, res) => {
  if (req.method === 'POST') {
    const form = new IncomingForm();
    form.uploadDir = TEMP_DIR; // Use the temporary directory
    form.keepExtensions = true;

    form.parse(req, async (err, fields, files) => {
      if (err) {
        res.status(500).json({ error: 'Form parse error' });
        return;
      }

      const audioPath = files.audio[0].filepath;
      const imagePath = files.image[0].filepath;
      const outputPath = path.join(TEMP_DIR, 'output.mp3');

      try {
        // Convert M4A to MP3 with cover image
        await execPromise(`ffmpeg -i ${audioPath} -i ${imagePath} -c:v mjpeg -id3v2_version 3 -metadata:s:v title="Album cover" -metadata:s:v comment="Cover (front)" -metadata artist="${fields.artist}" -metadata album="${fields.album}" ${outputPath}`);
        
        // Send the converted file
        res.status(200).sendFile(outputPath, () => {
          fs.unlinkSync(outputPath); // Clean up
        });
      } catch (error) {
        res.status(500).json({ error: 'Conversion failed', details: error.message });
      }
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
