
const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../database/db');

function normalize(value) {
  return String(value ?? '').trim();
}

// Lấy danh sách khách hàng
router.get('/', (req, res) => {
  try {
    const db = readDB();
    res.json(db.customers || []);
  } catch (error) {
    console.error('Lỗi lấy danh sách khách hàng:', error);
    res.status(500).json({
      message: 'Không thể lấy danh sách khách hàng'
    });
  }
});

// Lấy chi tiết một khách hàng
router.get('/:id', (req, res) => {
  try {
    const db = readDB();
    const customer = (db.customers || []).find(
      c => String(c.id) === String(req.params.id)
    );

    if (!customer) {
      return res.status(404).json({
        message: 'Không tìm thấy khách hàng'
      });
    }

    res.json(customer);
  } catch (error) {
    console.error('Lỗi lấy chi tiết khách hàng:', error);
    res.status(500).json({
      message: 'Không thể lấy thông tin khách hàng'
    });
  }
});

// Thêm khách hàng
router.post('/', (req, res) => {
  try {
    const db = readDB();
    db.customers = db.customers || [];

    const name = normalize(req.body.name || req.body.fullName);
    const phone = normalize(req.body.phone);
    const email = normalize(req.body.email);
    const idCard = normalize(req.body.idCard);
    const address = normalize(req.body.address);
    const request = normalize(req.body.request);

    if (!name || !phone) {
      return res.status(400).json({
        message: 'Vui lòng nhập họ tên và số điện thoại'
      });
    }

    const existing = db.customers.find(
      c => normalize(c.phone) === phone
    );

    if (existing) {
      return res.status(409).json({
        message: 'Số điện thoại đã tồn tại',
        customer: existing
      });
    }

    const newCustomer = {
      id: `KH${Date.now()}`,
      name,
      phone,
      email,
      idCard,
      address,
      request,
      createdAt: new Date().toISOString()
    };

    db.customers.push(newCustomer);
    writeDB(db);

    res.status(201).json(newCustomer);
  } catch (error) {
    console.error('Lỗi thêm khách hàng:', error);
    res.status(500).json({
      message: 'Không thể thêm khách hàng'
    });
  }
});

// Cập nhật khách hàng
router.put('/:id', (req, res) => {
  try {
    const db = readDB();
    db.customers = db.customers || [];

    const index = db.customers.findIndex(
      c => String(c.id) === String(req.params.id)
    );

    if (index === -1) {
      return res.status(404).json({
        message: 'Không tìm thấy khách hàng'
      });
    }

    const oldCustomer = db.customers[index];

    const name = normalize(
      req.body.name ?? req.body.fullName ?? oldCustomer.name
    );

    const phone = normalize(
      req.body.phone ?? oldCustomer.phone
    );

    if (!name || !phone) {
      return res.status(400).json({
        message: 'Họ tên và số điện thoại không được để trống'
      });
    }

    const duplicate = db.customers.find(
      (c, i) =>
        i !== index && normalize(c.phone) === phone
    );

    if (duplicate) {
      return res.status(409).json({
        message: 'Số điện thoại đã thuộc khách hàng khác'
      });
    }

    db.customers[index] = {
      ...oldCustomer,
      name,
      phone,
      email: normalize(req.body.email ?? oldCustomer.email),
      idCard: normalize(req.body.idCard ?? oldCustomer.idCard),
      address: normalize(req.body.address ?? oldCustomer.address),
      request: normalize(req.body.request ?? oldCustomer.request),
      updatedAt: new Date().toISOString()
    };

    writeDB(db);
    res.json(db.customers[index]);
  } catch (error) {
    console.error('Lỗi cập nhật khách hàng:', error);
    res.status(500).json({
      message: 'Không thể cập nhật khách hàng'
    });
  }
});

// Xóa khách hàng
router.delete('/:id', (req, res) => {
  try {
    const db = readDB();
    db.customers = db.customers || [];
    db.bookings = db.bookings || [];

    const customer = db.customers.find(
      c => String(c.id) === String(req.params.id)
    );

    if (!customer) {
      return res.status(404).json({
        message: 'Không tìm thấy khách hàng'
      });
    }

    const hasBooking = db.bookings.some(
      b => String(b.customerId) === String(req.params.id)
    );

    if (hasBooking) {
      return res.status(409).json({
        message: 'Khách hàng đang có đơn đặt phòng, không thể xóa'
      });
    }

    db.customers = db.customers.filter(
      c => String(c.id) !== String(req.params.id)
    );

    writeDB(db);

    res.json({
      message: 'Đã xóa khách hàng'
    });
  } catch (error) {
    console.error('Lỗi xóa khách hàng:', error);
    res.status(500).json({
      message: 'Không thể xóa khách hàng'
    });
  }
});

module.exports = router;
