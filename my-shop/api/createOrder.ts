import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';

// 初始化 Firebase Admin (確保只初始化一次)
if (!admin.apps.length) {
  try {
    // 🔧 [修正] 改用 ['...'] 讀取環境變數，解決 TypeScript 紅字警告
    const serviceAccount = JSON.parse(
      process.env['FIREBASE_SERVICE_ACCOUNT_KEY'] as string
    );

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin Initialized');
  } catch (error) {
    console.error('Firebase Admin Init Error:', error);
  }
}

const db = admin.firestore();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. 只允許 POST 請求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { userId, items, shippingMethod, shippingFee, paymentMethod, paymentInfo, shippingInfo, usedCredits } = req.body;

    // 2. 基礎驗證
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: '購物車是空的' });
    }

    // --- 🔥 關鍵防護：後端重新計算金額 ---
    let serverSubtotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      // 3. 從資料庫讀取這個商品的「真正價格」
      const productDoc = await db.collection('products').doc(item.productId).get();
      
      if (!productDoc.exists) {
        throw new Error(`商品 ${item.productName || item.productId} 已下架或不存在`);
      }

      const productData = productDoc.data() || {};
      
      // 🔧 [修正] 改用 ['...'] 讀取資料庫欄位，解決 TypeScript 紅字警告
      // 取得正確價格 (這裡預設使用一般價格，防止前端竄改)
      const correctPrice = productData['priceGeneral'] || 0; 

      // 累加正確的金額
      serverSubtotal += correctPrice * item.quantity;

      // 準備寫入訂單的資料 (強制使用正確價格)
      verifiedItems.push({
        ...item,
        price: correctPrice 
      });
      
      // 4. 扣庫存
      await db.collection('products').doc(item.productId).update({
          stock: admin.firestore.FieldValue.increment(-item.quantity),
          soldCount: admin.firestore.FieldValue.increment(item.quantity)
      });
    }

    // 5. 計算折扣 (需與前端邏輯一致)
    let discount = 0;
    if (shippingMethod === 'myship' || shippingMethod === 'family') {
      discount = 20;
    }

    // 6. 計算最終金額 (確保不為負數)
    const finalTotal = Math.max(0, serverSubtotal + shippingFee - discount - usedCredits);

    // 7. 產生訂單 ID
    const now = new Date();
    const datePrefix = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const orderId = `${datePrefix}-${Date.now().toString().slice(-6)}`;

    // 8. 準備寫入資料庫的物件
    const newOrder = {
      id: orderId,
      userId,
      items: verifiedItems,
      subtotal: serverSubtotal,
      discount,
      shippingFee,
      usedCredits,
      finalTotal,
      paymentMethod,
      shippingMethod,
      status: 'pending_payment',
      createdAt: Date.now()
    };
    
    // 合併付款與物流資訊
    if (paymentInfo) Object.assign(newOrder, { 
        paymentName: paymentInfo.name, 
        paymentTime: paymentInfo.time, 
        paymentLast5: paymentInfo.last5 
    });
    
    if (shippingInfo) {
        Object.assign(newOrder, {
            shippingName: shippingInfo.name,
            shippingPhone: shippingInfo.phone,
            shippingAddress: shippingInfo.address,
            shippingStore: shippingInfo.store
        });
    }

    // 9. 寫入訂單到 Firestore
    await db.collection('orders').doc(orderId).set(newOrder);

    console.log(`訂單建立成功：${orderId}, 金額：${finalTotal}`);

    // 10. 回傳成功訊息給前端
    return res.status(200).json({ success: true, orderId, finalTotal });

  } catch (error: any) {
    console.error('建立訂單失敗:', error);
    return res.status(500).json({ error: error.message || '伺服器內部錯誤' });
  }
}