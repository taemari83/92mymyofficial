// 1. 使用 require 而不是 import
const admin = require('firebase-admin');

// 2. 初始化 Firebase Admin
// 我們先檢查是否已經初始化過，避免重複錯誤
if (!admin.apps.length) {
  // 檢查是否有環境變數 (這是下一關會用到的鑰匙)
  if (!process.env.FIREBASE_PRIVATE_KEY) {
    console.error('❌ 缺少環境變數: FIREBASE_PRIVATE_KEY');
  }

  try {
    // 處理私鑰的換行問題 (Vercel 環境變數有時候會把換行吃掉)
    const privateKey = process.env.FIREBASE_PRIVATE_KEY 
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
      : undefined;

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    console.log('✅ Firebase Admin 初始化成功');
  } catch (error) {
    console.error('❌ Firebase Admin 初始化失敗:', error);
  }
}

const db = admin.firestore();

// 3. 使用 module.exports 而不是 export default
module.exports = async (req, res) => {
  // 設定 CORS (允許跨網域請求)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 處理 OPTIONS 請求 (瀏覽器預檢)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 只允許 POST 方法
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { 
      userId, 
      items, 
      shippingMethod, 
      shippingFee, 
      paymentMethod, 
      usedCredits,
      paymentInfo,
      shippingInfo 
    } = req.body;

    if (!userId || !items || items.length === 0) {
      return res.status(400).json({ error: '缺少必要欄位 (userId 或 items)' });
    }

    console.log(`正在為用戶 ${userId} 建立訂單...`);

    // --- 計算金額 ---
    let subtotal = 0;
    items.forEach(item => {
      subtotal += item.price * item.quantity;
    });

    const discount = 0; // 暫時沒有全館折扣邏輯
    const finalTotal = subtotal + shippingFee - discount - (usedCredits || 0);

    // --- 產生訂單 ID ---
    // 格式：ORD-年月日時分秒-隨機數
    const now = new Date();
    const timeCode = now.toISOString().replace(/[-T:.Z]/g, '').slice(2, 14); // 2602091200
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const orderId = `ORD-${timeCode}-${random}`;

    // --- 準備寫入資料庫 ---
    const orderData = {
      id: orderId,
      userId,
      items,
      subtotal,
      shippingFee,
      discount,
      usedCredits: usedCredits || 0,
      finalTotal,
      paymentMethod,
      shippingMethod,
      paymentInfo: paymentInfo || {},
      shippingInfo: shippingInfo || {},
      status: 'pending_payment', // 預設狀態
      createdAt: Date.now(), // 使用伺服器時間
      updatedAt: Date.now()
    };

    // --- 使用 Admin SDK 寫入 (繞過 Firestore Rules) ---
    // 這就是為什麼後端可以寫入，但前端不行的原因：因為我們有 Admin 權限
    await db.collection('orders').doc(orderId).set(orderData);

    console.log(`✅ 訂單建立成功: ${orderId}`);

    return res.status(200).json({ 
      success: true, 
      orderId, 
      finalTotal 
    });

  } catch (error) {
    console.error('❌ 建立訂單 API 錯誤:', error);
    return res.status(500).json({ error: '伺服器內部錯誤', details: error.message });
  }
};