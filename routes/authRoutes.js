const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'sun_hotel_bao_mat_2026';

const TAI_KHOAN = [
  { id: 1, ten_dang_nhap: 'le_tan', mat_khau: '123456', vai_tro: 'le_tan', ten_hien_thi: 'Lễ tân' },
  { id: 2, ten_dang_nhap: 'quan_ly', mat_khau: 'admin123', vai_tro: 'quan_ly', ten_hien_thi: 'Quản lý' },
  { id: 3, ten_dang_nhap: 'quan_tri', mat_khau: 'admin@2026', vai_tro: 'quan_tri', ten_hien_thi: 'Quản trị hệ thống' },
  { id: 4, ten_dang_nhap: 'ke_toan', mat_khau: 'ketoan2026', vai_tro: 'ke_toan', ten_hien_thi: 'Kế toán' }
];

router.post('/login', async (req, res) => {
  try {
    const { ten_dang_nhap, mat_khau, vai_tro } = req.body;
    if (!ten_dang_nhap || !mat_khau || !vai_tro) {
      return res.status(400).json({ success: false, message: 'Điền đầy đủ thông tin' });
    }

    const user = TAI_KHOAN.find(u =>
      u.ten_dang_nhap === ten_dang_nhap &&
      u.mat_khau === mat_khau &&
      u.vai_tro === vai_tro
    );

    if (!user) {
      return res.status(401).json({ success: false, message: 'Thông tin đăng nhập không chính xác' });
    }

    const token = jwt.sign(
      { id: user.id, ten_dang_nhap: user.ten_dang_nhap, vai_tro: user.vai_tro },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    const redirectUrl = user.vai_tro === 'le_tan' ? '/index.html' : '/dashboard.html';

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      user: { id: user.id, ten_dang_nhap: user.ten_dang_nhap, ten_hien_thi: user.ten_hien_thi, vai_tro: user.vai_tro },
      redirectUrl
    });
  } catch (err) {
    console.error('Lỗi đăng nhập:', err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

module.exports = router;