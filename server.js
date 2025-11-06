const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Database setup
const db = new sqlite3.Database(path.join(__dirname, 'db.sqlite'));

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company TEXT NOT NULL,
    title TEXT NOT NULL,
    salary TEXT,
    requirements TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// Routes
app.get('/api/jobs', (req, res) => {
  const { q, company, title } = req.query;
  let sql = 'SELECT * FROM jobs WHERE 1=1';
  const params = [];

  if (company) {
    sql += ' AND company LIKE ?';
    params.push(`%${company}%`);
  }
  if (title) {
    sql += ' AND title LIKE ?';
    params.push(`%${title}%`);
  }
  if (q) {
    sql += ' AND (company LIKE ? OR title LIKE ? OR requirements LIKE ?)';
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  sql += ' ORDER BY created_at DESC, id DESC';

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/jobs', (req, res) => {
  const { company, title, salary, requirements } = req.body;
  if (!company || !title) {
    return res.status(400).json({ error: '企业名称与岗位名称为必填' });
  }

  const sql = 'INSERT INTO jobs (company, title, salary, requirements) VALUES (?, ?, ?, ?)';
  db.run(sql, [company, title, salary || '', requirements || ''], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    db.get('SELECT * FROM jobs WHERE id = ?', [this.lastID], (err2, row) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.status(201).json(row);
    });
  });
});

app.put('/api/jobs/:id', (req, res) => {
  const { id } = req.params;
  const { company, title, salary, requirements } = req.body;
  if (!company || !title) {
    return res.status(400).json({ error: '企业名称与岗位名称为必填' });
  }

  const sql = 'UPDATE jobs SET company = ?, title = ?, salary = ?, requirements = ? WHERE id = ?';
  db.run(sql, [company, title, salary || '', requirements || '', id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    db.get('SELECT * FROM jobs WHERE id = ?', [id], (err2, row) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json(row);
    });
  });
});

app.delete('/api/jobs/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM jobs WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Fallback to index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}/`);
});
