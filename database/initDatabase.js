const db = require('./db');

const seedData = () => {
  db.serialize(() => {
    db.get('SELECT * FROM LoaiPhong LIMIT 1', (err, row) => {
      if (!row) {
        const insertLoai = db.prepare(
          'INSERT INTO LoaiPhong (tenLoai, giaCoBan, soNguoiToiDa, tienNghi) VALUES (?, ?, ?, ?)'
        );
        insertLoai.run('Phòng Đơn', 350000, 1, 'Wi-Fi, TV, Máy nước nóng');
        insertLoai.run('Phòng Đôi', 500000, 2, 'Wi-Fi, TV, Điều hòa, Tủ lạnh');
        insertLoai.run('Phòng Gia đình', 800000, 4, 'Wi-Fi, TV x2, Điều hòa, Bếp nhỏ');
        console.log('✅ Đã thêm loại phòng');
      }
    });

    db.get('SELECT * FROM Phong LIMIT 1', (err, row) => {
      if (!row) {
        const insertPhong = db.prepare(
          'INSERT INTO Phong (soPhong, tang, maLoaiPhong, trangThai) VALUES (?, ?, ?, ?)'
        );
        insertPhong.run('101', 1, 1, 'Trống');
        insertPhong.run('102', 1, 2, 'Trống');
        insertPhong.run('201', 2, 2, 'Trống');
        insertPhong.run('301', 3, 3, 'Trống');
        console.log('✅ Đã thêm phòng');
      }
    });
  });
};

seedData();