
CREATE TABLE IF NOT EXISTS LoaiPhong (
  maLoaiPhong INTEGER PRIMARY KEY AUTOINCREMENT,
  tenLoai TEXT NOT NULL,
  giaCoBan REAL NOT NULL CHECK(giaCoBan >= 0),
  soNguoiToiDa INTEGER NOT NULL CHECK(soNguoiToiDa > 0),
  dienTich REAL,
  tienNghi TEXT,
  moTa TEXT
);


CREATE TABLE IF NOT EXISTS Phong (
  maPhong INTEGER PRIMARY KEY AUTOINCREMENT,
  soPhong TEXT NOT NULL UNIQUE,
  tang INTEGER,
  maLoaiPhong INTEGER NOT NULL,
  trangThai TEXT DEFAULT 'Trống',
  ghiChu TEXT,
  FOREIGN KEY (maLoaiPhong) REFERENCES LoaiPhong(maLoaiPhong)
);


CREATE TABLE IF NOT EXISTS KhachHang (
  maKhach INTEGER PRIMARY KEY AUTOINCREMENT,
  hoTen TEXT NOT NULL,
  soDienThoai TEXT UNIQUE,
  email TEXT,
  diaChi TEXT,
  ngayTao TEXT DEFAULT (datetime('now'))
);


CREATE TABLE IF NOT EXISTS DatPhong (
  maDatPhong INTEGER PRIMARY KEY AUTOINCREMENT,
  maKhach INTEGER NOT NULL,
  maPhong INTEGER NOT NULL,
  checkInDuKien TEXT NOT NULL,
  checkOutDuKien TEXT NOT NULL,
  soNguoi INTEGER NOT NULL,
  tienCoc REAL DEFAULT 0,
  tongTien REAL DEFAULT 0,
  trangThai TEXT DEFAULT 'Đang chờ',
  ngayTao TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (maKhach) REFERENCES KhachHang(maKhach),
  FOREIGN KEY (maPhong) REFERENCES Phong(maPhong)
);


CREATE TABLE IF NOT EXISTS TaiKhoan (
  maTaiKhoan INTEGER PRIMARY KEY AUTOINCREMENT,
  tenDangNhap TEXT NOT NULL UNIQUE,
  matKhauHash TEXT NOT NULL,
  hoTen TEXT,
  vaiTro TEXT NOT NULL CHECK(vaiTro IN ('Lễ tân', 'Quản lý', 'Kế toán', 'Quản trị')),
  trangThai TEXT DEFAULT 'Hoạt động'
);


CREATE TABLE IF NOT EXISTS LichSuAI (
  maLog INTEGER PRIMARY KEY AUTOINCREMENT,
  loaiYeuCau TEXT,
  duLieuGoi TEXT,
  phanHoi TEXT,
  thoiGian TEXT DEFAULT (datetime('now')),
  maTaiKhoan INTEGER
);