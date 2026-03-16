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

export interface User {
  id: string; memberId?: string; memberNo?: string; phone?: string; email?: string; name: string; photoURL?: string; 
  totalSpend: number; isAdmin: boolean; tier: 'general' | 'vip' | 'wholesale'; credits: number; note?: string;
  birthday?: string; address?: string;
}

export type OrderStatus = 'pending_payment' | 'paid_verifying' | 'unpaid_alert' | 'refund_needed' | 'refunded' | 'payment_confirmed' | 'pending_shipping' | 'arrived_notified' | 'shipped' | 'picked_up' | 'completed' | 'cancelled';

export interface Order {
  id: string; userId: string; userEmail?: string; userName: string; 
  userPhone?: string; shippingName?: string; shippingPhone?: string; shippingAddress?: string; // 🔥 補齊收件人欄位防呆
  items: CartItem[]; subtotal: number;
  discount: number; shippingFee: number; usedCredits: number; finalTotal: number; depositPaid: number; balanceDue: number;
  status: OrderStatus; paymentMethod: 'cash' | 'bank_transfer' | 'cod'; shippingMethod: 'meetup' | 'myship' | 'family' | 'delivery'; 
  createdAt: number; shippingLink?: string;
  paymentName?: string; paymentTime?: string; paymentLast5?: string;
}

export interface StoreSettings {
  birthdayGiftGeneral: number; birthdayGiftVip: number; categoryCodes: { [key: string]: string };
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

users = toSignal(this.user$.pipe(switchMap(u => u?.isAdmin ? collectionData(collection(this.firestore, 'users'), { idField: 'id' }) as Observable<User[]> : of([]))), { initialValue: [] });
  orders = toSignal(this.user$.pipe(switchMap(u => { if (!u) return of([]); const ref = collection(this.firestore, 'orders'); const q = u.isAdmin ? ref : query(ref, where('userId', '==', u.id)); return collectionData(q, { idField: 'id' }) as Observable<Order[]>; })), { initialValue: [] });
  
  // 🧾 採購總帳：即時讀取資料庫
  purchases = toSignal(collectionData(collection(this.firestore, 'purchases'), { idField: 'id' }) as Observable<any[]>, { initialValue: [] });

  cart = signal<CartItem[]>([]);
  cartCount = computed(() => this.cart().reduce((count, item) => count + item.quantity, 0));

  cartDiscount = computed(() => {
    const items = this.cart(); const allProducts = this.products(); let original = 0; let discounted = 0;
    const grouped = new Map<string, number>();
    items.forEach(item => { grouped.set(item.productId, (grouped.get(item.productId) || 0) + item.quantity); original += item.price * item.quantity; });
    grouped.forEach((qty, productId) => {
       const product = allProducts.find(p => p.id === productId); const firstItem = items.find(i => i.productId === productId); if(!firstItem) return;
       if (product?.bulkDiscount && product.bulkDiscount.count > 1 && product.bulkDiscount.total > 0) {
          const sets = Math.floor(qty / product.bulkDiscount.count); const remainder = qty % product.bulkDiscount.count;        
          discounted += (sets * product.bulkDiscount.total) + (remainder * firstItem.price);
       } else { discounted += items.filter(i => i.productId === productId).reduce((s, i) => s + (i.price * i.quantity), 0); }
    });
    return original - discounted; 
  });

  cartTotal = computed(() => this.cart().reduce((sum, item) => sum + (item.price * item.quantity), 0) - this.cartDiscount());

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
    let localCostToUse = product.localPrice; // 🔥 新增：預設使用母體當地原價

    if (option.includes('=')) {
       const parts = option.split('=');
       parsedOption = parts[0].trim();
       
       const optGenPrice = parseInt(parts[1]?.trim(), 10) || product.priceGeneral;
       const optVipPrice = parseInt(parts[2]?.trim(), 10) || product.priceVip;
       localCostToUse = parseInt(parts[3]?.trim(), 10) || product.localPrice;

       // 🔥 正確判斷：如果是 VIP/批發會員，就套用 VIP 價
       if (user?.tier === 'vip' || user?.tier === 'wholesale') {
          finalPrice = optVipPrice > 0 ? optVipPrice : optGenPrice;
       } else {
          finalPrice = optGenPrice;
       }
    } else {
       if (user?.tier === 'wholesale' && product.priceWholesale > 0) finalPrice = product.priceWholesale; 
       else if (user?.tier === 'vip' && product.priceVip > 0) finalPrice = product.priceVip;
    }

// 🔥 直接使用商品後台設定的匯率，沒填的話預設為 1 (台幣)
    const currentRate = product.exchangeRate || 1;
    // 🔥 成本 = (原價 × 匯率) + 額外加工費 + (重量 × 國際運費)
    const currentCost = (localCostToUse * currentRate) + (product.costMaterial || 0) + ((product.weight || 0) * (product.shippingCostPerKg || 0));
    
    this.cart.update(current => {
      const exist = current.find(i => i.productId === product.id && i.option === parsedOption);
      if (exist) return current.map(i => i === exist ? { ...i, quantity: i.quantity + quantity, price: finalPrice, unitCost: currentCost } : i);
      return [...current, { productId: product.id, productName: product.name, productImage: product.image, option: parsedOption, price: finalPrice, quantity, isPreorder: product.isPreorder, unitCost: currentCost }];
    });
  }  
  async createOrder(paymentInfo: any, shippingInfo: any, usedCredits: number, paymentMethod: any, shippingMethod: any, shippingFee: number, checkoutItems: CartItem[]) {
    const user = this.currentUser(); if (!user) return null;
    let originalTotal = 0; let finalItemsTotal = 0; const grouped = new Map<string, number>();
    checkoutItems.forEach(item => { grouped.set(item.productId, (grouped.get(item.productId) || 0) + item.quantity); originalTotal += item.price * item.quantity; });
    grouped.forEach((qty, productId) => {
       const product = this.products().find(p => p.id === productId); const firstItem = checkoutItems.find(i => i.productId === productId); if(!firstItem) return;
       if (product?.bulkDiscount && product.bulkDiscount.count > 1 && product.bulkDiscount.total > 0) {
          const sets = Math.floor(qty / product.bulkDiscount.count); const remainder = qty % product.bulkDiscount.count;
          finalItemsTotal += (sets * product.bulkDiscount.total) + (remainder * firstItem.price);
       } else { finalItemsTotal += checkoutItems.filter(i => i.productId === productId).reduce((s, i) => s + (i.price * i.quantity), 0); }
    });
    const bulkDiscountAmount = originalTotal - finalItemsTotal; const finalTotal = finalItemsTotal + shippingFee - usedCredits;
    
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
      discount: bulkDiscountAmount, 
      shippingFee, 
      usedCredits, 
      finalTotal, 
      depositPaid: finalTotal - 20, 
      balanceDue: 20, 
      // 🔥 修正：結帳當下如果有填後五碼，就直接判定為「待對帳」，否則才是「待付款」
      status: (paymentInfo.last5 && paymentInfo.last5.trim() !== '') ? 'paid_verifying' : 'pending_payment', 
      paymentMethod, 
      shippingMethod, 
      createdAt: Date.now(),
      paymentLast5: paymentInfo.last5 || '', 
      paymentName: paymentInfo.name || '',
      paymentTime: paymentInfo.time || ''
    };
    
    await setDoc(doc(this.firestore, 'orders', orderId), orderData);

    fetch(this.gasUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'new_order', orderId: orderId, total: finalTotal, name: orderData.userName, email: user.email }) }).catch(e => console.error(e));
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
  
  settings = toSignal(docData(doc(this.firestore, 'config/storeSettings')).pipe(map((data: any) => data || { birthdayGiftGeneral: 100, birthdayGiftVip: 500, categoryCodes: {}, paymentMethods: { cash: false, bankTransfer: true, cod: true }, shipping: { freeThreshold: 2000, methods: { meetup: {enabled: true, fee: 0}, myship: {enabled: true, fee: 35}, family: {enabled: true, fee: 39}, delivery: {enabled: false, fee: 100} } } })), { initialValue: { birthdayGiftGeneral: 100, birthdayGiftVip: 500, categoryCodes: {}, paymentMethods: { cash: false, bankTransfer: true, cod: true }, shipping: { freeThreshold: 2000, methods: { meetup: {enabled: true, fee: 0}, myship: {enabled: true, fee: 35}, family: {enabled: true, fee: 39}, delivery: {enabled: false, fee: 100} } } } });
}