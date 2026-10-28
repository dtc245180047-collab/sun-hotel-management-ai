
const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../database/db');

function normalize(value) {
  return String(value ?? '').trim();
}

function validDate(value) {
  if (!value) return false;

  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime());
}

// Chuẩn hóa trạng thái để status và trangThai luôn thống nhất.
function normalizeStatus(value) {
  const status = normalize(value).toLowerCase();

  if (
    ['pending', 'cho_xac_nhan', 'chờ xác nhận'].includes(status)
  ) {
    return {
      status: 'pending',
      trangThai: 'cho_xac_nhan'
    };
  }

  if (
    ['confirmed', 'da_xac_nhan', 'đã xác nhận'].includes(status)
  ) {
    return {
      status: 'confirmed',
      trangThai: 'da_xac_nhan'
    };
  }

  if (
    ['cancelled', 'canceled', 'da_huy', 'đã hủy'].includes(status)
  ) {
    return {
      status: 'cancelled',
      trangThai: 'da_huy'
    };
  }

  return null;
}

// Lấy danh sách đơn đặt phòng
router.get('/', (req, res) => {
  try {
    const db = readDB();
    res.json(db.bookings || []);
  } catch (error) {
    console.error('Lỗi lấy danh sách đặt phòng:', error);

    res.status(500).json({
      message: 'Không thể lấy danh sách đặt phòng'
    });
  }
});

// Lấy chi tiết một đơn đặt phòng
router.get('/:id', (req, res) => {
  try {
    const db = readDB();

    const booking = (db.bookings || []).find(
      b => String(b.id) === String(req.params.id)
    );

    if (!booking) {
      return res.status(404).json({
        message: 'Không tìm thấy đơn đặt phòng'
      });
    }

    res.json(booking);
  } catch (error) {
    console.error('Lỗi lấy chi tiết đặt phòng:', error);

    res.status(500).json({
      message: 'Không thể lấy chi tiết đặt phòng'
    });
  }
});

// Tạo đơn đặt phòng
// Đơn mới luôn ở trạng thái CHỜ XÁC NHẬN.
// Nhân viên quản trị phải chủ động xác nhận.
router.post('/', (req, res) => {
  try {
    const db = readDB();

    db.bookings = db.bookings || [];
    db.customers = db.customers || [];

    const body = req.body || {};

    const customerId = normalize(body.customerId);
    const checkIn = normalize(body.checkIn);
    const checkOut = normalize(body.checkOut);
    const roomName = normalize(body.roomName || body.roomType);

    const pricePerNight = Number(
      body.pricePerNight ?? body.gia
    );

    const suppliedTotal = Number(
      body.total ?? body.tongTien
    );

    if (!customerId) {
      return res.status(400).json({
        message: 'Thiếu mã khách hàng'
      });
    }

    const customer = db.customers.find(
      c => String(c.id) === customerId
    );

    if (!customer) {
      return res.status(400).json({
        message: 'Khách hàng chưa tồn tại trong hệ thống'
      });
    }

    if (!validDate(checkIn) || !validDate(checkOut)) {
      return res.status(400).json({
        message: 'Ngày nhận phòng hoặc ngày trả phòng không hợp lệ'
      });
    }

    const start = new Date(`${checkIn}T00:00:00`);
    const end = new Date(`${checkOut}T00:00:00`);

    const nights = Math.round(
      (end.getTime() - start.getTime()) / 86400000
    );

    if (nights <= 0) {
      return res.status(400).json({
        message: 'Ngày trả phòng phải sau ngày nhận phòng'
      });
    }

    if (
      !Number.isFinite(pricePerNight) ||
      pricePerNight <= 0
    ) {
      return res.status(400).json({
        message: 'Giá phòng không hợp lệ'
      });
    }

    const total =
      Number.isFinite(suppliedTotal) && suppliedTotal > 0
        ? suppliedTotal
        : pricePerNight * nights;

    const bookingId = `DP${Date.now()}`;

    const newBooking = {
      id: bookingId,

      customerId,
      customerName: normalize(
        body.customerName || customer.name
      ),
      customerPhone: normalize(
        body.customerPhone || customer.phone
      ),
      customerEmail: normalize(
        body.customerEmail || customer.email
      ),
      customerIdCard: normalize(
        body.customerIdCard || customer.idCard
      ),
      customerAddress: normalize(
        body.customerAddress || customer.address
      ),
      specialRequest: normalize(
        body.specialRequest || customer.request
      ),

      roomId: body.roomId ?? null,
      roomCode: normalize(body.roomCode),
      roomType: normalize(body.roomType || roomName),
      roomName,

      checkIn,
      checkOut,
      nights,
      pricePerNight,
      total,

      // Khách gửi yêu cầu chưa có nghĩa là đã được xác nhận.
      status: 'pending',
      trangThai: 'cho_xac_nhan',

      createdAt: new Date().toISOString(),
      ngayTao: new Date().toLocaleString('vi-VN')
    };

    db.bookings.unshift(newBooking);
    writeDB(db);

    return res.status(201).json({
      message: 'Đã nhận yêu cầu đặt phòng. Vui lòng chờ xác nhận.',
      booking: newBooking
    });
  } catch (error) {
    console.error('Lỗi tạo đơn đặt phòng:', error);

    res.status(500).json({
      message: 'Không thể tạo đơn đặt phòng'
    });
  }
});

// Cập nhật đơn đặt phòng.
// Khi quản trị viên gửi status: "confirmed",
// hệ thống sẽ lưu cả hai trường trạng thái tương ứng.
router.put('/:id', (req, res) => {
  try {
    const db = readDB();
    db.bookings = db.bookings || [];

    const index = db.bookings.findIndex(
      b => String(b.id) === String(req.params.id)
    );

    if (index === -1) {
      return res.status(404).json({
        message: 'Không tìm thấy đơn đặt phòng'
      });
    }

    const body = req.body || {};
    const currentBooking = db.bookings[index];

    // Chỉ chuẩn hóa trạng thái khi request thực sự gửi trạng thái.
    const requestedStatus =
      body.status !== undefined
        ? body.status
        : body.trangThai;

    let statusFields = {};

    if (requestedStatus !== undefined) {
      const normalizedStatus = normalizeStatus(requestedStatus);

      if (!normalizedStatus) {
        return res.status(400).json({
          message: 'Trạng thái đặt phòng không hợp lệ'
        });
      }

      statusFields = normalizedStatus;
    }

    // Không cho request thay đổi mã đơn.
    // Các trường khác vẫn được cập nhật như trước.
    db.bookings[index] = {
      ...currentBooking,
      ...body,
      ...statusFields,
      id: currentBooking.id,
      updatedAt: new Date().toISOString()
    };

    writeDB(db);

    return res.json({
      message:
        statusFields.status === 'confirmed'
          ? 'Đã xác nhận đặt phòng thành công'
          : 'Cập nhật đơn đặt phòng thành công',
      booking: db.bookings[index]
    });
  } catch (error) {
    console.error('Lỗi cập nhật đơn đặt phòng:', error);

    res.status(500).json({
      message: 'Không thể cập nhật đơn đặt phòng'
    });
  }
});

// Hủy đơn đặt phòng
router.delete('/:id', (req, res) => {
  try {
    const db = readDB();
    db.bookings = db.bookings || [];

    const index = db.bookings.findIndex(
      b => String(b.id) === String(req.params.id)
    );

    if (index === -1) {
      return res.status(404).json({
        message: 'Không tìm thấy đơn đặt phòng'
      });
    }

    db.bookings[index] = {
      ...db.bookings[index],
      status: 'cancelled',
      trangThai: 'da_huy',
      updatedAt: new Date().toISOString()
    };

    writeDB(db);

    return res.json({
      message: 'Đã hủy đơn đặt phòng',
      booking: db.bookings[index]
    });
  } catch (error) {
    console.error('Lỗi hủy đơn đặt phòng:', error);

    res.status(500).json({
      message: 'Không thể hủy đơn đặt phòng'
    });
  }
});

module.exports = router;
