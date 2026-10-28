const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../database/db');

router.get('/', (req, res) => {
  const db = readDB();
  res.json(db.services);
});

router.post('/', (req, res) => {
  const db = readDB();
  const newSvc = { id: 'DV' + Date.now(), ...req.body };
  db.services.push(newSvc);
  writeDB(db);
  res.status(201).json(newSvc);
});

router.put('/:id', (req, res) => {
  const db = readDB();
  const idx = db.services.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Không tìm thấy' });
  db.services[idx] = { ...db.services[idx], ...req.body };
  writeDB(db);
  res.json(db.services[idx]);
});

router.delete('/:id', (req, res) => {
  let db = readDB();
  db.services = db.services.filter(s => s.id !== req.params.id);
  writeDB(db);
  res.json({ message: 'Đã xóa' });
});

module.exports = router;