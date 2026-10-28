
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'data.json');

const initialData = {
  rooms: [
    {
      id: 'P001',
      code: '101',
      type: 'Standard',
      name: 'Phòng Standard',
      area: '25m²',
      price: 300000,
      status: 'trong'
    },
    {
      id: 'P002',
      code: '102',
      type: 'Deluxe',
      name: 'Phòng Deluxe',
      area: '35m²',
      price: 500000,
      status: 'trong'
    },
    {
      id: 'P003',
      code: '103',
      type: 'Suite',
      name: 'Phòng Suite',
      area: '60m²',
      price: 800000,
      status: 'trong'
    }
  ],
  customers: [],
  bookings: [],
  services: [
    { id: 'DV001', name: 'Bữa sáng', price: 50000, desc: 'Buffet sáng' },
    { id: 'DV002', name: 'Giặt ủi', price: 30000, desc: 'Giặt quần áo' },
    { id: 'DV003', name: 'Đưa đón sân bay', price: 200000, desc: 'Xe riêng' }
  ],
  bills: [],
  payments: [],
  checkoutHistory: []
};

function ensureDatabase() {
  const directory = path.dirname(dbPath);

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(
      dbPath,
      JSON.stringify(initialData, null, 2),
      'utf8'
    );
  }
}

function readDB() {
  ensureDatabase();

  const raw = fs.readFileSync(dbPath, 'utf8');
  const db = JSON.parse(raw);

  // Bổ sung các danh sách còn thiếu mà không xóa dữ liệu cũ.
  for (const key of Object.keys(initialData)) {
    if (!Array.isArray(db[key])) {
      db[key] = [];
    }
  }

  return db;
}

function writeDB(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Dữ liệu database không hợp lệ');
  }

  ensureDatabase();

  const tempPath = `${dbPath}.tmp`;

  fs.writeFileSync(
    tempPath,
    JSON.stringify(data, null, 2),
    'utf8'
  );

  fs.renameSync(tempPath, dbPath);
}

module.exports = {
  readDB,
  writeDB
};
