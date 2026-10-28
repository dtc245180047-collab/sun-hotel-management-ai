const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../database/db');

router.get('/', (req, res) => {
  const db = readDB();
  res.json(db.bills);
});

router.post('/', (req, res) => {
  const db = readDB();
  const newBill = {
    id: 'HD' + Date.now(),
    ngayTao: new Date().toLocaleString('vi-VN'),
    trangThai: 'chua_thanh_toan',
    ...req.body
  };
  db.bills.unshift(newBill);
  writeDB(db);
  res.status(201).json(newBill);
});

router.put('/:id', (req, res) => {
  const db = readDB();
  const idx = db.bills.findIndex(b => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Không tìm thấy' });
  db.bills[idx] = { ...db.bills[idx], ...req.body };
  writeDB(db);
  res.json(db.bills[idx]);
});

module.exports = router;