const express = require('express');
const multer = require('multer');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

app.post('/upload', upload.single('photo'), async (req, res) => {
  const { caption } = req.body;
  const url = `https://${process.env.SPACES_BUCKET}.${process.env.SPACES_REGION}.digitaloceanspaces.com/${req.file.filename}`;

  await pool.query('INSERT INTO photos (url, caption) VALUES ($1, $2)', [url, caption]);
  res.json({ success: true, url });
});

app.get('/photos', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM photos ORDER BY id DESC');
  res.json(rows);
});

app.listen(port, () => console.log(`Server running on port ${port}`));
