// @ts-ignore
const admin = require('firebase-admin');

// 2. 初始化 Firebase Admin
if (!admin.apps.length) {
  if (!process.env.FIREBASE_PRIVATE_KEY) {
    console.error('❌ 缺少環境變數: FIREBASE_PRIVATE_KEY');
  }

  try {
    // 🔥 終極修復：處理私鑰格式
    // 有些環境會把 \n 變成字串，有些會直接換行，這裡統一處理
    const rawKey = process.env.FIREBASE_PRIVATE_KEY || '';
    let privateKey = rawKey.replace(/\\n/g, '\n');
    
    // 如果頭尾有引號，把它拿掉 (Vercel 有時候會自動加引號)
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }

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

// 3. 使用 module.exports
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

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

    let subtotal = 0;
    items.forEach(item => {
      subtotal += item.price * item.quantity;
    });

    const discount = 0;
    const finalTotal = subtotal + shippingFee - discount - (usedCredits || 0);

    const now = new Date();
    const timeCode = now.toISOString().replace(/[-T:.Z]/g, '').slice(2, 14);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const orderId = `ORD-${timeCode}-${random}`;

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
      status: 'pending_payment',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await db.collection('orders').doc(orderId).set(orderData);

    console.log(`✅ 訂單建立成功: ${orderId}`);

    return res.status(200).json({ 
      success: true, 
      orderId, 
      finalTotal 
    });

  } catch (error) {
    console.error('❌ 建立訂單 API 錯誤:', error);
    // 回傳詳細錯誤訊息，方便除錯
    return res.status(500).json({ 
      error: '伺服器內部錯誤', 
      details: error.message,
      // 告訴我們到底是哪裡錯了
      keyLength: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.length : 0 
    });
  }
};