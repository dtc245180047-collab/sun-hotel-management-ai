const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const DB_PATH = path.join(__dirname, '../database/data.json');

function readDB() { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); }
function writeDB(d) { fs.writeFileSync(DB_PATH, JSON.stringify(d, null, 2), 'utf8'); }

router.get('/', (req, res) => res.json(readDB().rooms));
router.post('/', (req, res) => {
  const db = readDB();
  const newRoom = { id: 'P' + Date.now(), ...req.body };
  db.rooms.push(newRoom);
  writeDB(db);
  res.status(201).json(newRoom);
});
router.put('/:id', (req, res) => {
  const db = readDB();
  const idx = db.rooms.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ m: 'Không tìm thấy' });
  db.rooms[idx] = { ...db.rooms[idx], ...req.body };
  writeDB(db);
  res.json(db.rooms[idx]);
});
router.delete('/:id', (req, res) => {
  let db = readDB();
  db.rooms = db.rooms.filter(r => r.id !== req.params.id);
  writeDB(db);
  res.json({ m: 'Đã xóa' });
});

module.exports = router;