const express = require('express');
const multer = require('multer');
const { Pool } = require('pg');
const cors = require('cors');
const fs = require('fs');
const AWS = require('aws-sdk');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

// Setup DigitalOcean Spaces using AWS SDK
const spacesEndpoint = new AWS.Endpoint(`${process.env.SPACES_REGION}.digitaloceanspaces.com`);
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.SPACES_KEY,
  secretAccessKey: process.env.SPACES_SECRET
});

// Upload endpoint
app.post('/upload', upload.single('photo'), async (req, res) => {
  const { caption } = req.body;

  try {
    const fileContent = fs.readFileSync(req.file.path);
    const params = {
      Bucket: process.env.SPACES_BUCKET,
      Key: req.file.filename,
      Body: fileContent,
      ACL: 'public-read',
      ContentType: req.file.mimetype
    };

    // Upload to Spaces
    const result = await s3.upload(params).promise();

    // Save the file URL and caption to PostgreSQL
    await pool.query('INSERT INTO photos (url, caption) VALUES ($1, $2)', [
      result.Location,
      caption
    ]);

    // Cleanup local upload folder if needed (optional)
    fs.unlinkSync(req.file.path);

    res.json({ success: true, url: result.Location });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// List endpoint
app.get('/photos', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM photos ORDER BY id DESC');
  res.json(rows);
});

// Start server
app.listen(port, () => console.log(`Server running on port ${port}`));
