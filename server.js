
const express = require('express');
const path = require('path');
require('dotenv').config();

const { readDB, writeDB } = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// 1. Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Kiểm tra database khi khởi động
try {
  readDB();
  console.log('Đã khởi tạo và kiểm tra database/data.json');
} catch (error) {
  console.error('Không thể đọc database:', error);
  process.exit(1);
}

// 3. API đặt phòng công khai cũ
// Giữ lại để tương thích với những trang đang sử dụng endpoint này.
app.post('/api/public/book-room', (req, res) => {
  try {
    const db = readDB();

    db.customers = db.customers || [];
    db.bookings = db.bookings || [];

    const {
      hoTen,
      sdt,
      cccd,
      email,
      phong,
      ngayNhan,
      ngayTra,
      gia,
      soDem
    } = req.body;

    const name = String(hoTen || '').trim();
    const phone = String(sdt || '').trim();
    const checkIn = String(ngayNhan || '').trim();
    const checkOut = String(ngayTra || '').trim();
    const price = Number(gia);
    const nights = Number(soDem);

    if (!name || !phone || !checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin đặt phòng'
      });
    }

    if (
      !Number.isFinite(price) ||
      price <= 0 ||
      !Number.isFinite(nights) ||
      nights <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Giá phòng hoặc số đêm không hợp lệ'
      });
    }

    let customer = db.customers.find(
      c => String(c.phone || '').trim() === phone
    );

    if (!customer) {
      customer = {
        id: `KH${Date.now()}`,
        name,
        phone,
        email: String(email || '').trim(),
        idCard: String(cccd || '').trim(),
        address: '',
        request: '',
        createdAt: new Date().toISOString()
      };

      db.customers.push(customer);
    }

    const booking = {
      id: `DP${Date.now()}`,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email || '',
      customerIdCard: customer.idCard || '',
      roomName: String(phong || '').trim(),
      roomType: String(phong || '').trim(),
      roomId: null,
      roomCode: '',
      checkIn,
      checkOut,
      nights,
      pricePerNight: price,
      total: price * nights,
      status: 'confirmed',
      trangThai: 'cho_xac_nhan',
      createdAt: new Date().toISOString(),
      ngayTao: new Date().toLocaleString('vi-VN')
    };

    db.bookings.unshift(booking);
    writeDB(db);

    return res.status(201).json({
      success: true,
      maDon: booking.id,
      tongTien: booking.total,
      customer,
      booking
    });
  } catch (error) {
    console.error('Lỗi đặt phòng công khai:', error);

    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi đặt phòng'
    });
  }
});

// 4. Các API chính của hệ thống
app.use('/api/rooms', require('./routes/roomRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/bills', require('./routes/billRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

// 5. API kiểm tra trạng thái server và database
app.get('/api/health', (req, res) => {
  try {
    const db = readDB();

    return res.json({
      success: true,
      app: 'SUN HOTEL',
      database: 'connected',
      customers: (db.customers || []).length,
      bookings: (db.bookings || []).length
    });
  } catch (error) {
    console.error('Lỗi kiểm tra database:', error);

    return res.status(500).json({
      success: false,
      database: 'error'
    });
  }
});

// 6. Trang khách hàng
app.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// 7. Trang quản trị
// Không dùng index.html ở đây vì đó là trang dành cho khách.
app.get('/admin', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'dashboard.html'));
});

// 8. Đường dẫn mở dashboard trực tiếp
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'dashboard.html'));
});

// 9. Phục vụ CSS, JavaScript, ảnh và các tài nguyên tĩnh
app.use(express.static(PUBLIC_DIR));

// 10. API không tồn tại
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Không tìm thấy API',
    path: req.originalUrl
  });
});

// 11. Xử lý lỗi chung
app.use((error, req, res, next) => {
  console.error('Lỗi máy chủ:', error);

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json({
    success: false,
    message: 'Đã xảy ra lỗi máy chủ'
  });
});

// 12. Khởi động server
app.listen(PORT, () => {
  console.log(`SUN HOTEL chạy tại: http://localhost:${PORT}`);
  console.log(`Trang khách: http://localhost:${PORT}/`);
  console.log(`Trang quản trị: http://localhost:${PORT}/admin`);
  console.log(`Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`Kiểm tra API: http://localhost:${PORT}/api/health`);
});
