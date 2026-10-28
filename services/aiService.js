require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// === Đọc biến môi trường ===
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash'; // ✅ Đã sửa
const AI_TEMPERATURE = parseFloat(process.env.AI_TEMPERATURE || 0.2);
const AI_MAX_TOKENS = parseInt(process.env.AI_MAX_TOKENS || 1024);

// === Kiểm tra khóa ===
if (!GEMINI_API_KEY) {
  console.error('❌ LỖI: GEMINI_API_KEY chưa có trong .env');
  process.exit(1);
}
console.log(`✅ Đã kết nối mô hình: ${GEMINI_MODEL} | Temperature: ${AI_TEMPERATURE}`);

// === Khởi tạo Gemini ===
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: GEMINI_MODEL,
  generationConfig: {
    temperature: AI_TEMPERATURE,
    maxOutputTokens: AI_MAX_TOKENS,
    responseMimeType: 'application/json'
  }
});

// === Lọc dữ liệu nhạy cảm ===
function sanitizeData(data) {
  const sensitive = ['mat_khau', 'password', 'cccd', 'so_cmnd', 'email', 'dien_thoai'];
  const safe = JSON.parse(JSON.stringify(data));
  function clean(obj) {
    if (!obj || typeof obj !== 'object') return;
    for (const k in obj) {
      if (sensitive.some(f => k.toLowerCase().includes(f))) obj[k] = '[ĐÃ BẢO MẬT]';
      else if (typeof obj[k] === 'object') clean(obj[k]);
    }
  }
  clean(safe);
  return safe;
}

// === Gọi AI chính ===
async function callAI(systemPrompt, userPrompt) {
  try {
    const fullPrompt = `${systemPrompt}\n\n=== DỮ LIỆU & YÊU CẦU ===\n${userPrompt}`;
    
    console.log('🤖 Đang gọi Gemini API...');
    
    const result = await model.generateContent(fullPrompt);
    const text = result.response.text();
    
    if (!text) return { success: false, error: 'AI không trả về nội dung' };
    
    try {
      return { success: true, data: JSON.parse(text), raw: text };
    } catch (parseErr) {
      return { success: false, error: 'Phản hồi không đúng định dạng JSON', raw: text };
    }
  } catch (err) {
    console.error('🔍 Chi tiết lỗi AI:', err.message);
    
    // Phân loại lỗi
    let msg = err.message;
    if (msg.includes('429') || msg.includes('quota')) {
      msg = 'Hết hạn ngạch API — thử lại sau hoặc tạo khóa mới tại Google AI Studio';
    } else if (msg.includes('401') || msg.includes('API key') || msg.includes('authentication')) {
      msg = 'Khóa API không hợp lệ — kiểm tra lại GEMINI_API_KEY trong .env';
    } else if (msg.includes('network') || msg.includes('fetch') || msg.includes('ECONNREFUSED') || msg.includes('ETIMEDOUT')) {
      msg = 'Lỗi kết nối mạng đến máy chủ Gemini.\n→ Kiểm tra internet\n→ Tắt VPN/tường lửa nếu có';
    } else if (msg.includes('403') || msg.includes('forbidden')) {
      msg = 'Truy cập bị từ chối — tài khoản Google có thể bị giới hạn';
    } else if (msg.includes('404') || msg.includes('not found')) {
      msg = `Mô hình ${GEMINI_MODEL} không tồn tại — kiểm tra lại tên mô hình`;
    }
    
    return { success: false, error: msg };
  }
}

// === Gọi an toàn + trả dữ liệu mẫu khi lỗi ===
async function safeAICall(systemPrompt, userPrompt, fallback = null) {
  const res = await callAI(systemPrompt, userPrompt);
  if (res.success) return res;
  
  console.error('❌ Không gọi được AI, dùng dữ liệu mẫu thay thế');
  return {
    ...res,
    data: fallback,
    fallback: true,
    note: 'Dữ liệu tham khảo — không kết nối được AI'
  };
}

module.exports = { callAI, safeAICall, sanitizeData };