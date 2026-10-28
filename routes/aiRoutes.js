const express = require('express');
const router = express.Router();

const DANH_SACH_PHONG = [
  { id: 1, ten_phong: 'Phòng Đơn Tiêu Chuẩn', gia: 300000, so_nguoi_toi_da: 2, loai: 'don', tien_nghi: 'Wi-Fi, TV, Điều hòa, Tủ lạnh' },
  { id: 2, ten_phong: 'Phòng Đôi Cao Cấp', gia: 450000, so_nguoi_toi_da: 2, loai: 'doi', tien_nghi: 'Hồ bơi miễn phí, Bữa sáng, Ban công' },
  { id: 3, ten_phong: 'Phòng Gia Đình Sang Trọng', gia: 550000, so_nguoi_toi_da: 4, loai: 'gia_dinh', tien_nghi: '2 phòng ngủ, Bếp nhỏ, Đỗ xe' },
  { id: 4, ten_phong: 'Phòng Deluxe Hướng Biển', gia: 750000, so_nguoi_toi_da: 2, loai: 'deluxe', tien_nghi: 'Toàn cảnh, Bồn tắm massage, Dịch vụ 24/7' }
];

router.post('/advice-room', async (req, res) => {
  try {
    const { checkin, checkout, guests, budget } = req.body;
    if (!checkin || !checkout || !guests || !budget) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin yêu cầu' });
    }
    if (new Date(checkout) <= new Date(checkin)) {
      return res.status(400).json({ success: false, message: 'Ngày trả phòng phải sau ngày nhận phòng' });
    }
    const goi_y = DANH_SACH_PHONG.filter(p => p.gia <= budget && p.so_nguoi_toi_da >= guests);
    res.json({
      success: true,
      goi_y,
      thong_bao: goi_y.length > 0 ? `Tìm thấy ${goi_y.length} phòng phù hợp!` : 'Không có phòng phù hợp.'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi xử lý' });
  }
});

router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, error: 'Vui lòng nhập câu hỏi' });
    const msg = message.toLowerCase();
    let reply;
    if (msg.includes('giá') && msg.includes('phòng')) {
      reply = '💰 Bảng giá:\n• Phòng Đơn: 300.000đ/đêm\n• Phòng Đôi: 450.000đ/đêm\n• Phòng Gia đình: 550.000đ/đêm\n• Phòng Deluxe: 750.000đ/đêm';
    } else if (msg.includes('đặt phòng')) {
      reply = '📝 Vào trang "Đặt phòng" → chọn ngày → số người → bấm "Tìm phòng" → chọn phòng → "Đặt phòng". Hoặc gọi hotline: 0123 456 789';
    } else if (msg.includes('hủy phòng')) {
      reply = '📋 Chính sách hủy:\n• Trước 3 ngày: Hoàn 100%\n• 1-3 ngày: Hoàn 50%\n• Trong 24h: Không hoàn trả';
    } else {
      reply = `Tôi đã nhận: "${message}"\nVui lòng gọi hotline 0123 456 789 để được hỗ trợ chi tiết! 😊`;
    }
    res.json({ success: true, reply });
  } catch {
    res.status(500).json({ success: false, error: 'Lỗi xử lý' });
  }
});

module.exports = router;