import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { 
  Firestore, collection, collectionData, doc, docData, 
  setDoc, updateDoc, deleteDoc, query, where, getDocs, getDoc, addDoc
} from '@angular/fire/firestore';
import { Auth, signInWithPopup, GoogleAuthProvider, signOut } from '@angular/fire/auth';
import { map, switchMap, of, Observable } from 'rxjs';

export interface Product {
  id: string; code: string; name: string; image: string; images?: string[]; 
  category: string;
  subCategory?: string; // 🔥 新增：第二層分類
  tags?: string[];      // 🔥 新增：多重標籤
  options: string[]; country: string; localPrice: number; exchangeRate: number; costMaterial: number; 
  weight: number; shippingCostPerKg: number; priceGeneral: number; priceVip: number; priceWholesale: number; 
  priceType?: 'normal' | 'event' | 'clearance'; stock: number; note: string; soldCount: number;
  isPreorder: boolean; isListed: boolean;
  bulkDiscount?: { count: number, total: number }; 
  allowPayment?: { cash: boolean; bankTransfer: boolean; cod: boolean; };
  allowShipping?: { meetup: boolean; myship: boolean; family: boolean; delivery: boolean; };
  brand?: string; 
}

export interface CartItem {
  productId: string; productName: string; productImage: string; option: string; price: number; quantity: number; isPreorder: boolean;
  unitCost?: number; // 🔥 紀錄結帳當下的實際單位成本
}

export interface Wallet { id: string; name: string; currency: string; symbol: string; balance: number; }
export interface Expense { id: string; date: string; item: string; category: string; amount: number; currency: string; payer: string; note: string; imageUrl?: string; remainingBalance?: number; }
export interface User {
  id: string; memberId?: string; memberNo?: string; phone?: string; email?: string; name: string; photoURL?: string; 
  totalSpend: number; isAdmin: boolean; 
  tier: 'general' | 'v1' | 'v2' | 'v3' | 'wholesale' | string; // 👈 放寬 tier 支援多階級
  credits: number; note?: string; birthday?: string; address?: string;
}

export type OrderStatus = 'pending_payment' | 'paid_verifying' | 'unpaid_alert' | 'refund_needed' | 'refunded' | 'payment_confirmed' | 'pending_shipping' | 'arrived_notified' | 'shipped' | 'picked_up' | 'completed' | 'cancelled';

export interface PromoCode {
  code: string;               // 折扣碼 (例如: 92VIP)
  type: 'amount' | 'percent'; // 折抵金額(amount) 或 打折(percent)
  value: number;              // 折抵 100元 或 88折 (輸入 88)
  minSpend: number;           // 低消門檻 (例如滿 1000 才能用)
  active: boolean;            // 啟用/停用
  note?: string;              // 備註說明
  usageLimit?: number;        // 總使用次數限制 (0代表無限)
  usedCount?: number;         // 目前已被使用的次數
  expiryDate?: string;        // 到期日 (YYYY-MM-DD)，空白代表不限期
}

export interface Order {
  id: string; userId: string; userEmail?: string; userName: string; 
  userPhone?: string; shippingName?: string; shippingPhone?: string; shippingAddress?: string;
  items: CartItem[]; subtotal: number;
  discount: number; shippingFee: number; usedCredits: number; finalTotal: number; depositPaid: number; balanceDue: number;
  promoCode?: string;      // 👈 紀錄使用的折扣碼
  promoDiscount?: number;  // 👈 紀錄折扣碼折了多少錢
  status: OrderStatus; paymentMethod: 'cash' | 'bank_transfer' | 'cod'; shippingMethod: 'meetup' | 'myship' | 'family' | 'delivery'; 
  createdAt: number; shippingLink?: string;
  paymentName?: string; paymentTime?: string; paymentLast5?: string;
  messages?: { sender: 'user' | 'admin', text: string, time: number }[];
}

export interface StoreSettings {
  birthdayGiftGeneral: number; birthdayGiftVip: number; categoryCodes: { [key: string]: string };
  vipDiscounts?: { [tier: string]: number }; // 👈 新增：VIP 各階級折扣率 (例如 v1: 0.95)
  promoCodes?: PromoCode[]; // 👈 新增折扣碼資料庫
  paymentMethods: { cash: boolean; bankTransfer: boolean; cod: boolean; };
  shipping: { freeThreshold: number; methods: { meetup: { enabled: boolean, fee: number }; myship: { enabled: boolean, fee: number }; family: { enabled: boolean, fee: number }; delivery: { enabled: boolean, fee: number }; } }
}

@Injectable({ providedIn: 'root' })
export class StoreService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private gasUrl = "https://script.google.com/macros/s/AKfycbwHQhjL_MDaulYgBtBH07-9eH8U4RJM6lFWE7xcL7qwLeSoMnfe_RzCaXG6KugGPqhv/exec";
  private myShipLink = "https://myship.7-11.com.tw/general/detail/GM2602124017223";

  private products$ = collectionData(collection(this.firestore, 'products'), { idField: 'id' }) as Observable<Product[]>;
  products = toSignal(this.products$, { initialValue: [] });

  visibleProducts = computed(() => this.products().filter(p => p.isListed !== false));

  currentUser = signal<User | null>(null);
  private user$ = toObservable(this.currentUser);

  wallets = toSignal(collectionData(collection(this.firestore, 'wallets'), { idField: 'id' }) as Observable<Wallet[]>, { initialValue: [] });
  expenses = toSignal(collectionData(collection(this.firestore, 'expenses'), { idField: 'id' }) as Observable<Expense[]>, { initialValue: [] });
users = toSignal(this.user$.pipe(switchMap(u => u?.isAdmin ? collectionData(collection(this.firestore, 'users'), { idField: 'id' }) as Observable<User[]> : of([]))), { initialValue: [] });
  orders = toSignal(this.user$.pipe(switchMap(u => { if (!u) return of([]); const ref = collection(this.firestore, 'orders'); const q = u.isAdmin ? ref : query(ref, where('userId', '==', u.id)); return collectionData(q, { idField: 'id' }) as Observable<Order[]>; })), { initialValue: [] });
  
  // 🧾 採購總帳：即時讀取資料庫
  purchases = toSignal(collectionData(collection(this.firestore, 'purchases'), { idField: 'id' }) as Observable<any[]>, { initialValue: [] });

  cart = signal<CartItem[]>([]);
  cartCount = computed(() => this.cart().reduce((count, item) => count + item.quantity, 0));

// 1. 專門算「多入組優惠」
  cartBulkDiscount = computed(() => {
    const items = this.cart(); const allProducts = this.products(); 
    let discounted = 0; const grouped = new Map<string, number>();
    items.forEach(item => { grouped.set(item.productId, (grouped.get(item.productId) || 0) + item.quantity); });
    grouped.forEach((qty, productId) => {
       const product = allProducts.find(p => p.id === productId); const firstItem = items.find(i => i.productId === productId); if(!firstItem) return;
       if (product?.bulkDiscount && product.bulkDiscount.count > 1 && product.bulkDiscount.total > 0) {
          const sets = Math.floor(qty / product.bulkDiscount.count); const remainder = qty % product.bulkDiscount.count;        
          const original = items.filter(i => i.productId === productId).reduce((s, i) => s + (i.price * i.quantity), 0);
          const newTotal = (sets * product.bulkDiscount.total) + (remainder * firstItem.price);
          discounted += (original - newTotal);
       }
    });
    return discounted; 
  });

  // 2. 專門算「VIP 全館折扣」
  cartVipDiscount = computed(() => {
    const items = this.cart(); let original = 0;
    items.forEach(item => { original += item.price * item.quantity; });
    const bulkAmount = this.cartBulkDiscount();
    
    const user = this.currentUser();
    const vipDiscounts = this.settings().vipDiscounts || { v1: 0.95, v2: 0.9, v3: 0.85 };
    const userTier = user?.tier || 'general';
    
    if (userTier !== 'general' && userTier !== 'wholesale') {
        const discountRate = vipDiscounts[userTier] || 1;
        const amountAfterBulk = original - bulkAmount;
        const amountAfterVip = Math.round(amountAfterBulk * discountRate);
        return amountAfterBulk - amountAfterVip;
    }
    return 0;
  });

  // 3. 總折扣 (維持原本變數名稱，確保系統不報錯)
  cartDiscount = computed(() => this.cartBulkDiscount() + this.cartVipDiscount());

  cartTotal = computed(() => this.cart().reduce((sum, item) => sum + (item.price * item.quantity), 0) - this.cartDiscount());  
  // 🧠 真實採購平均成本大腦 (終極精準版)
  averageActualCostMap = computed(() => {
    const costData: Record<string, { totalCostTWD: number, totalQty: number }> = {};
    const allPurchases = this.purchases() || [];

    allPurchases.forEach(p => {
       const actualTotal = Number(p.totalLocalCost) || 0;
       if (actualTotal <= 0) return; // 沒填寫真實花費的跳過

       // 1. 算出這張單買手手填的單價總額 (圖一的 單價 × 數量 的總和)
       const itemsTotalLocal = (p.items || []).reduce((sum: number, i: any) => sum + ((Number(i.price) || 0) * (Number(i.quantity) || 1)), 0);

       // 2. 均攤當地運費與尾數的比例 (實際總刷卡額 / 商品單價總和)
       const costRatio = itemsTotalLocal > 0 ? (actualTotal / itemsTotalLocal) : 1;

       (p.items || []).forEach((item: any) => {
          const key = `${item.productId}_${item.option || '單一規格'}`;
          const product = this.products().find((prod: Product) => prod.id === item.productId);
          
          // 3. 抓取買手手動輸入的「當地貨幣單價」(圖一填寫的)
          const buyerUnitPrice = Number(item.price) || 0;

          // 4. 乘上落差比例 (把當地運費均攤進單價裡)
          const adjustedLocalUnitPrice = buyerUnitPrice * costRatio;

          // 5. 轉換為台幣 (TWD) 成本
          let twdUnitCost = adjustedLocalUnitPrice;
          if (p.currency === 'KRW' || p.currency === 'JPY') {
             // 若為外幣，必須乘上該商品設定的匯率，轉成台幣
             const exRate = product?.exchangeRate || 1;
             twdUnitCost = adjustedLocalUnitPrice * exRate;
          }

          // 6. 加上該商品固定的「國際運費與包材成本」
          // (從國外運回來的秤重運費，不管買手花多少錢買都要加上去)
          // 💡 [未來擴充：國際運費與包材] 若以後要加入計算，把下面這段的 // 拿掉即可
          //if (product) {
          //   const costMat = Number(product.costMaterial) || 0;
          //   const shipKg = Number(product.shippingCostPerKg) || 0;
          //   const weight = Number(product.weight) || 0;
          //   twdUnitCost += costMat + (weight * shipKg);
          // }

          // 7. 加到總成本池裡，用來算歷史平均單價
          if (!costData[key]) costData[key] = { totalCostTWD: 0, totalQty: 0 };
          costData[key].totalCostTWD += (twdUnitCost * item.quantity);
          costData[key].totalQty += item.quantity;
       });
    });

    // 8. 輸出每個商品的「真實平均單件成本」
    const result = new Map<string, number>();
    Object.keys(costData).forEach(key => {
       result.set(key, Math.round(costData[key].totalCostTWD / costData[key].totalQty)); 
    });
    return result;
  });
  
  constructor() {
    if (typeof localStorage !== 'undefined') {
      const savedCart = localStorage.getItem('92mymy_cart'); if (savedCart) this.cart.set(JSON.parse(savedCart));
      const savedUserId = localStorage.getItem('92mymy_uid'); if (savedUserId) getDoc(doc(this.firestore, 'users', savedUserId)).then(snap => snap.exists() && this.currentUser.set(snap.data() as User));
    }
    effect(() => localStorage.setItem('92mymy_cart', JSON.stringify(this.cart())));
  }

  copyToClipboard(text: string) {
    if (navigator && navigator.clipboard) { navigator.clipboard.writeText(text).then(() => alert('已複製到剪貼簿！'));
    } else { const el = document.createElement('textarea'); el.value = text; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el); alert('已複製到剪貼簿！'); }
  }

  async updateSettings(s: any) { await setDoc(doc(this.firestore, 'config/storeSettings'), s, { merge: true }); }
  async addCategory(name: string) { const current = this.categories(); if (name && !current.includes(name)) await setDoc(doc(this.firestore, 'config/categories'), { list: [...current, name] }, { merge: true }); }
  async renameCategory(oldName: string, newName: string) { const list = this.categories().map(c => c === oldName ? newName : c); await setDoc(doc(this.firestore, 'config/categories'), { list }, { merge: true }); }
  async removeCategory(cat: string) { const list = this.categories().filter(c => c !== cat); await setDoc(doc(this.firestore, 'config/categories'), { list }, { merge: true }); }
  private categories$ = docData(doc(this.firestore, 'config/categories')).pipe(map((data: any) => data ? (data.list as string[]) : ['熱銷精選', '服飾', '包包', '生活小物']));
  categories = toSignal(this.categories$, { initialValue: ['熱銷精選', '服飾', '包包', '生活小物'] });

async updateUser(u: User) { await updateDoc(doc(this.firestore, 'users', u.id), { ...u }); }
  async updateOrderStatus(id: string, status: OrderStatus, extra: any = {}) { await updateDoc(doc(this.firestore, 'orders', id), { status, ...extra }); }
  async deleteOrder(o: Order) { await deleteDoc(doc(this.firestore, 'orders', o.id)); }
  async addWallet(w: Wallet) { await setDoc(doc(this.firestore, 'wallets', w.id), w); }
  async updateWalletBalance(id: string, newBalance: number) { await updateDoc(doc(this.firestore, 'wallets', id), { balance: newBalance }); }
  async addExpense(e: Expense) { await setDoc(doc(this.firestore, 'expenses', e.id), e); }
  async deleteExpense(id: string) { await deleteDoc(doc(this.firestore, 'expenses', id)); } // 👈 補上這行
  

  // 🧾 新增：寫入採購單，並自動同步商品的「已買到」數量
  async addPurchaseBatch(data: any) { 
    const docRef = await addDoc(collection(this.firestore, 'purchases'), data);
    for (const item of data.items) {
      const p = this.products().find((x: Product) => x.id === item.productId);
      if (p) {
         const currentMap = (p as any).procured || {};
         const currentQty = currentMap[item.option] || 0;
         await this.updateProduct({ ...p, procured: { ...currentMap, [item.option]: currentQty + item.quantity } } as any);
      }
    }
    return docRef;
  }
  
  // 🧾 新增：單筆建立採購草稿單 (一鍵結算用)
  async addPurchase(purchase: any) {
    await setDoc(doc(this.firestore, 'purchases', purchase.id), purchase);
  }

  // 🧾 新增：核准採購單狀態
  async updatePurchaseStatus(id: string, status: string) { 
    await updateDoc(doc(this.firestore, 'purchases', id), { status }); 
  }  
  
  // 🧾 新增：刪除採購單，並自動把「已買到」的數量扣回去
  async deletePurchase(purchaseId: string, items: any[]) {
    // 1. 刪除該筆採購單據
    await deleteDoc(doc(this.firestore, 'purchases', purchaseId));
    
    // 2. 把當初加上去的「已買到數量」扣回來
    for (const item of items) {
      const p = this.products().find((x: Product) => x.id === item.productId);
      if (p) {
         const currentMap = (p as any).procured || {};
         const currentQty = currentMap[item.option] || 0;
         // 扣除數量，並確保最低不會變成負數
         const newQty = Math.max(0, currentQty - item.quantity); 
         await this.updateProduct({ ...p, procured: { ...currentMap, [item.option]: newQty } } as any);
      }
    }
  }

  async addProduct(p: Product) { await setDoc(doc(this.firestore, 'products', p.id), { ...p, isPreorder: p.isPreorder ?? false, isListed: p.isListed ?? true }); }
  async updateProduct(p: Product) { await updateDoc(doc(this.firestore, 'products', p.id), { ...p }); }
  async toggleProductListing(id: string, current: boolean) { await updateDoc(doc(this.firestore, 'products', id), { isListed: !current }); }
  async deleteProduct(id: string) { await deleteDoc(doc(this.firestore, 'products', id)); }

  generateOrderId(): string {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const sec = String(now.getSeconds()).padStart(2, '0');
    const randomStr = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${yy}${mm}${dd}${hh}${min}${sec}${randomStr}`;
  }

  generateProductCode(prefix: string): string {
    const now = new Date(); const datePart = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const pattern = new RegExp(`^${prefix}${datePart}(\\d{3})$`); let maxSeq = 0;
    this.products().forEach(p => { const match = p.code.match(pattern); if (match) { const seq = parseInt(match[1], 10); if (seq > maxSeq) maxSeq = seq; } });
    return `${prefix || 'P'}${datePart}${String(maxSeq + 1).padStart(3, '0')}`;
  }
  generateNextProductCode(): string { return this.generateProductCode('P'); }

addToCart(product: Product, option: string, quantity: number) {
    const user = this.currentUser(); 
    let finalPrice = product.priceGeneral;
    let parsedOption = option;
    let localCostToUse = product.localPrice; // 預設使用母體當地原價

    // 🤫 ==========================================
    // 🤫 內部員工專屬：真實匯率過濾器
    // 🤫 ==========================================
    let employeeRate = product.exchangeRate || 1; // 預設跟商品表單填的一樣
    
    // 💡 判斷如果是韓國商品，強制套用「真實底價匯率」
    if (product.country === 'Korea' || product.country === '韓國') {
        employeeRate = 1 / 43; // 👈 修正：員工結帳直接除以 43 (約 0.0232)
    } 
    // ==========================================

    if (option.includes('=')) {
       const parts = option.split('=');
       parsedOption = parts[0].trim();
       
       const optGenPrice = parseInt(parts[1]?.trim(), 10) || product.priceGeneral;
       localCostToUse = parseInt(parts[3]?.trim(), 10) || product.localPrice;

       // 🧠 終極智慧定價大腦 (多規格版)
       if (user?.tier === 'employee') {
          // 🤫 內部員工：當地原價 * 員工專屬真實匯率 (無條件進位到整數)
          const localCost = localCostToUse * employeeRate;
          finalPrice = localCost > 0 ? Math.ceil(localCost) : optGenPrice;
       } else if (user?.tier === 'wholesale') {
          // 📦 批發客：批發價 (如果商品沒填批發價，防呆退回規格一般價)
          finalPrice = product.priceWholesale > 0 ? product.priceWholesale : optGenPrice;
       } else {
          // 🌟 一般與 VIP (VIP 全館折扣由結帳區計算)
          finalPrice = optGenPrice;
       }
    } else {
       // 🧠 終極智慧定價大腦 (單一規格版)
       if (user?.tier === 'employee') {
           const localCost = (product.localPrice || 0) * employeeRate;
           finalPrice = localCost > 0 ? Math.ceil(localCost) : product.priceGeneral;
       } else if (user?.tier === 'wholesale') {
           finalPrice = product.priceWholesale > 0 ? product.priceWholesale : product.priceGeneral;
       } else {
           finalPrice = product.priceGeneral;
       }
    }

    // 🔥 單位成本計算 (紀錄於訂單明細，供未來報表對帳用)
    // 這裡的底價成本，我們統一用真實匯率 (employeeRate) 來記錄，報表才會準確！
    const currentCost = (localCostToUse * employeeRate) + (product.costMaterial || 0) + ((product.weight || 0) * (product.shippingCostPerKg || 0));
    
    this.cart.update(current => {
      const exist = current.find(i => i.productId === product.id && i.option === parsedOption);
      if (exist) return current.map(i => i === exist ? { ...i, quantity: i.quantity + quantity, price: finalPrice, unitCost: currentCost } : i);
      return [...current, { productId: product.id, productName: product.name, productImage: product.image, option: parsedOption, price: finalPrice, quantity, isPreorder: product.isPreorder, unitCost: currentCost }];
    });
  }
    
  async createOrder(
    paymentInfo: any, shippingInfo: any, usedCredits: number, 
    paymentMethod: any, shippingMethod: any, shippingFee: number, 
    checkoutItems: CartItem[], combinedDiscount: number = 0,
    promoCode: string = '', promoDiscount: number = 0 // 👈 新增折扣碼接收參數
  ) {
    const user = this.currentUser(); if (!user) return null;
    
    let originalTotal = 0; 
    checkoutItems.forEach(item => { 
       originalTotal += item.price * item.quantity; 
    });
    
    // 🚀 核心升級：把折扣碼的扣款也算進最終結帳金額
    const finalTotal = originalTotal + shippingFee - usedCredits - combinedDiscount - promoDiscount;    
    const orderId = this.generateOrderId();

    const orderData: Order = {
      id: orderId,
      userId: user.id, 
      userEmail: user.email, 
      userName: shippingInfo.name || user.name, 
      userPhone: user.phone || '',
      shippingName: shippingInfo.name || '',
      shippingPhone: shippingInfo.phone || '',
      shippingAddress: (shippingMethod === 'myship' || shippingMethod === 'family') ? shippingInfo.store : shippingInfo.address,
      items: checkoutItems, 
      subtotal: originalTotal, 
      discount: combinedDiscount, // 👈 存入包含多入與平台的總折扣
      promoCode: promoCode,           // 👈 寫入資料庫
      promoDiscount: promoDiscount,   // 👈 寫入資料庫
      shippingFee, 
      usedCredits, 
      finalTotal: Math.max(0, finalTotal), 
      depositPaid: Math.max(0, finalTotal - 20), 
      balanceDue: 20, 
      status: (paymentInfo.last5 && paymentInfo.last5.trim() !== '') ? 'paid_verifying' : 'pending_payment', 
      paymentMethod, 
      shippingMethod, 
      createdAt: Date.now(),
      paymentLast5: paymentInfo.last5 || '', 
      paymentName: paymentInfo.name || '',
      paymentTime: paymentInfo.time || ''
    };
    
    await setDoc(doc(this.firestore, 'orders', orderId), orderData);

    // 🧠 帳務資訊計入：實際扣除會員已使用的購物金
    if (usedCredits > 0) {
        const updatedUser = { ...user, credits: Math.max(0, (user.credits || 0) - usedCredits) };
        await this.updateUser(updatedUser);
        // 同步更新當下的 currentUser signal 狀態
        this.currentUser.set(updatedUser);
    }

    fetch(this.gasUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'new_order', orderId: orderId, total: orderData.finalTotal, name: orderData.userName, email: user.email }) }).catch(e => console.error(e));
    this.cart.update(current => current.filter(c => !checkoutItems.some(k => k.productId === c.productId && k.option === c.option)));
    return orderData;
  }

  async notifyArrival(order: Order) {
    fetch(this.gasUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'arrival_notice', orderId: order.id, name: order.userName, email: order.userEmail, shippingLink: this.myShipLink }) }).then(() => this.updateOrderStatus(order.id, 'arrived_notified'));
  }

  // 🔥 新增：通用發信函數，用來觸發 Google Apps Script 的各種信件
  async sendOrderNotification(order: Order, action: string, extraData: any = {}) {
    const payload = {
      action: action,
      orderId: order.id,
      name: order.userName,
      email: order.userEmail,
      total: order.finalTotal,
      ...extraData // 包含 shippingLink 等額外資訊
    };

    fetch(this.gasUrl, { 
      method: 'POST', 
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, 
      body: JSON.stringify(payload) 
    }).catch(e => console.error('發送通知失敗:', e));
  }
  
  async loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider(); const credential = await signInWithPopup(this.auth, provider); const gUser = credential.user; const userRef = doc(this.firestore, 'users', gUser.uid); const docSnap = await getDoc(userRef);
      if (docSnap.exists()) { const existingUser = docSnap.data() as User; this.currentUser.set(existingUser); localStorage.setItem('92mymy_uid', existingUser.id); return existingUser; } 
      else { const now = new Date(); const pad = (n:number)=>n.toString().padStart(2,'0'); const newUser: User = { id: gUser.uid, memberNo: `M${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`, email: gUser.email || '', name: gUser.displayName || '新會員', photoURL: gUser.photoURL || '', totalSpend: 0, isAdmin: false, tier: 'general', credits: 0 }; await setDoc(userRef, newUser); this.currentUser.set(newUser); localStorage.setItem('92mymy_uid', gUser.uid); return newUser; }
    } catch (e) { return null; }
  }

  logout() { signOut(this.auth); this.currentUser.set(null); localStorage.removeItem('92mymy_uid'); }
  removeFromCart(index: number) { this.cart.update(l => l.filter((_, i) => i !== index)); }
  updateCartQty(index: number, delta: number) { this.cart.update(l => l.map((item, i) => i === index ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item)); }
  clearCart() { this.cart.set([]); }
  
settings = toSignal(
    docData(doc(this.firestore, 'config/storeSettings')).pipe(
      map((data: any) => data || { 
        birthdayGiftGeneral: 100, 
        birthdayGiftVip: 500, 
        categoryCodes: {}, 
        vipDiscounts: { v1: 0.95, v2: 0.9, v3: 0.85 }, // 👈 第一處：Firebase 沒資料時的預設值
        promoCodes: [{ code: '92VIP', type: 'amount', value: 100, minSpend: 1000, active: true, note: '歡慶上線滿千折百' }], 
        paymentMethods: { cash: false, bankTransfer: true, cod: true }, 
        shipping: { freeThreshold: 2000, methods: { meetup: {enabled: true, fee: 0}, myship: {enabled: true, fee: 35}, family: {enabled: true, fee: 39}, delivery: {enabled: false, fee: 100} } } 
      })
    ), 
    { 
      initialValue: { 
        birthdayGiftGeneral: 100, 
        birthdayGiftVip: 500, 
        categoryCodes: {}, 
        vipDiscounts: { v1: 0.95, v2: 0.9, v3: 0.85 }, // 👈 第二處：畫面剛載入時的初始值
        promoCodes: [{ code: '92VIP', type: 'amount', value: 100, minSpend: 1000, active: true, note: '歡慶上線滿千折百' }], 
        paymentMethods: { cash: false, bankTransfer: true, cod: true }, 
        shipping: { freeThreshold: 2000, methods: { meetup: {enabled: true, fee: 0}, myship: {enabled: true, fee: 35}, family: {enabled: true, fee: 39}, delivery: {enabled: false, fee: 100} } } 
      } 
    }
  );
}