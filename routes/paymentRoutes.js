const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../database/db');

router.get('/', (req, res) => {
  const db = readDB();
  res.json(db.payments);
});

router.post('/', (req, res) => {
  const db = readDB();
  const newPay = {
    id: 'TT' + Date.now(),
    ngayThanhToan: new Date().toLocaleString('vi-VN'),
    trangThai: 'cho_xac_nhan',
    ...req.body
  };
  db.payments.unshift(newPay);
  writeDB(db);
  res.status(201).json(newPay);
});

module.exports = router;