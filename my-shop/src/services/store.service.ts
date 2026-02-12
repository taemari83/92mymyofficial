import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { 
  Firestore, 
  collection, 
  collectionData, 
  doc, 
  docData, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  getDocs,
  getDoc,
  orderBy,
  limit,
  addDoc
} from '@angular/fire/firestore';
import { 
  Auth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
} from '@angular/fire/auth';
import { map, switchMap, of, Observable } from 'rxjs';

// --- Interfaces ---
export interface Product {
  id: string;
  code: string;
  name: string;
  image: string;
  images?: string[];
  category: string;
  options: string[]; 
  country: string;
  // --- 原始成本欄位保留 ---
  localPrice: number;
  exchangeRate: number;
  costMaterial: number; 
  weight: number; 
  shippingCostPerKg: number; 
  // ---------------------
  priceGeneral: number;    
  priceVip: number;        
  priceWholesale: number; 
  priceType: 'normal' | 'event' | 'clearance'; 
  bulkDiscount?: { count: number, total: number }; 
  allowPayment?: { cash: boolean; bankTransfer: boolean; cod: boolean; };
  allowShipping?: { meetup: boolean; myship: boolean; family: boolean; delivery: boolean; };
  stock: number;
  note: string;
  soldCount: number;
  buyUrl?: string;

  // 🔥 新增欄位：預購 & 上下架
  isPreorder: boolean; 
  isListed: boolean;   
}

export interface CartItem {
  productId: string;
  productName: string;
  productImage: string;
  option: string;
  price: number;
  quantity: number;
  isPreorder: boolean; // 🔥 購物車也要紀錄是否為預購
}

export interface User {
  id: string;        
  memberId?: string; // 舊欄位保留
  memberNo?: string; // 🔥 新增：時間格式編號 (M20260211...)
  phone?: string; 
  email?: string; 
  name: string;
  photoURL?: string;
  totalSpend: number;
  isAdmin: boolean;
  address?: string;
  birthday?: string; 
  tier: 'general' | 'vip' | 'wholesale'; 
  credits: number;
  note?: string;
}

// 🔥 擴充 Order 介面以包含 GAS 通知的金額邏輯
export interface Order {
  id: string;
  userId: string;
  userEmail?: string; // 新增方便發信
  userName?: string;  // 新增方便發信
  items: CartItem[];
  subtotal: number;
  discount: number; 
  shippingFee: number; 
  usedCredits: number; 
  finalTotal: number;
  // --- 新增金額結構 (網站付/尾款) ---
  depositPaid?: number; // 網站應付 (Total - 20)
  balanceDue?: number;  // 尾款 (20)
  // -----------------------------
  paymentMethod: 'cash' | 'bank_transfer' | 'cod'; 
  paymentName?: string;
  paymentTime?: string;
  paymentLast5?: string;
  shippingMethod: 'meetup' | 'myship' | 'family' | 'delivery'; 
  shippingName?: string;
  shippingPhone?: string;
  shippingStore?: string; 
  shippingAddress?: string; 
  shippingLink?: string; 
  // 新增狀態: arrived_notified (已通知貨到)
  status: 'pending_payment' | 'paid_verifying' | 'unpaid_alert' | 'refund_needed' | 'refunded' | 'payment_confirmed' | 'shipped' | 'completed' | 'cancelled' | 'arrived_notified';
  createdAt: number;
  note?: string;
}

export interface StoreSettings {
  birthdayGiftGeneral: number;
  birthdayGiftVip: number;
  categoryCodes: { [key: string]: string };
  paymentMethods: {
    cash: boolean;
    bankTransfer: boolean;
    cod: boolean;
  };
  shipping: {
    freeThreshold: number; 
    methods: {
      meetup: { enabled: boolean, fee: number };
      myship: { enabled: boolean, fee: number }; 
      family: { enabled: boolean, fee: number }; 
      delivery: { enabled: boolean, fee: number }; 
    }
  }
}

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  // 🔥 您的專屬賣貨便連結
  private readonly MY_SHIP_LINK = "https://myship.7-11.com.tw/general/detail/GM2602124017223";
  // 🔥 GAS 連結
  private readonly GAS_URL = "https://script.google.com/macros/s/AKfycbzOKiHDFP3zs5VB4zntpZYB9daht0hL1Lfwlat6otLFJVy48m8CI7rwCHro3u-CrCIk/exec";

  // --- Default Settings ---
  private defaultSettings: StoreSettings = {
    birthdayGiftGeneral: 100,
    birthdayGiftVip: 500,
    categoryCodes: {
      '熱銷精選': 'H',
      '服飾': 'C',
      '包包': 'B',
      '生活小物': 'L'
    },
    paymentMethods: { cash: false, bankTransfer: true, cod: true },
    shipping: {
      freeThreshold: 2000,
      methods: {
        meetup: { enabled: true, fee: 0 },
        myship: { enabled: true, fee: 35 },
        family: { enabled: true, fee: 39 },
        delivery: { enabled: false, fee: 100 }
      }
    }
  };

  // --- Signals ---
  
  private settings$: Observable<StoreSettings> = docData(doc(this.firestore, 'config/storeSettings')).pipe(
    map((data: any) => {
      if (!data) return this.defaultSettings;
      return {
        ...this.defaultSettings,
        ...data,
        categoryCodes: { ...this.defaultSettings.categoryCodes, ...(data.categoryCodes || {}) },
        paymentMethods: { ...this.defaultSettings.paymentMethods, ...(data.paymentMethods || {}) },
        shipping: {
            ...this.defaultSettings.shipping,
            ...(data.shipping || {}),
            methods: { ...this.defaultSettings.shipping.methods, ...(data.shipping?.methods || {}) }
        }
      } as StoreSettings;
    })
  );
  settings = toSignal(this.settings$, { initialValue: this.defaultSettings });

  private categories$: Observable<string[]> = docData(doc(this.firestore, 'config/categories')).pipe(
    map((data: any) => data ? (data.list as string[]) : ['熱銷精選', '服飾', '包包', '生活小物'])
  );
  categories = toSignal(this.categories$, { initialValue: ['熱銷精選', '服飾', '包包', '生活小物'] });

  private products$: Observable<Product[]> = collectionData(collection(this.firestore, 'products'), { idField: 'id' }) as Observable<Product[]>;
  products = toSignal(this.products$, { initialValue: [] as Product[] });

  // --- Local State ---
  currentUser = signal<User | null>(null);
  
  private user$ = toObservable(this.currentUser);

  users = toSignal(
    this.user$.pipe(
      switchMap(u => {
        if (u?.isAdmin) {
          return collectionData(collection(this.firestore, 'users'), { idField: 'id' }) as Observable<User[]>;
        }
        return of([] as User[]);
      })
    ),
    { initialValue: [] as User[] }
  );

  orders = toSignal(
    this.user$.pipe(
      switchMap(u => {
        if (!u) return of([] as Order[]); 
        if (u.isAdmin) {
          return collectionData(collection(this.firestore, 'orders'), { idField: 'id' }) as Observable<Order[]>;
        } else {
          const q = query(collection(this.firestore, 'orders'), where('userId', '==', u.id));
          return collectionData(q, { idField: 'id' }) as Observable<Order[]>;
        }
      })
    ),
    { initialValue: [] as Order[] }
  );

  cart = signal<CartItem[]>([]);
  cartTotal = computed(() => this.cart().reduce((sum, item) => sum + (item.price * item.quantity), 0));
  cartCount = computed(() => this.cart().reduce((count, item) => count + item.quantity, 0));

  constructor() {
    if (typeof localStorage !== 'undefined') {
      const savedCart = localStorage.getItem('92mymy_cart');
      if (savedCart) this.cart.set(JSON.parse(savedCart));

      const savedUserId = localStorage.getItem('92mymy_uid');
      if (savedUserId) {
         getDoc(doc(this.firestore, 'users', savedUserId)).then(snap => {
           if (snap.exists()) {
             this.currentUser.set(snap.data() as User);
           }
         }).catch(err => console.log('Auto login failed', err));
      }
    }

    effect(() => {
       const c = this.cart();
       if (typeof localStorage !== 'undefined') {
          localStorage.setItem('92mymy_cart', JSON.stringify(c));
       }
    });
  }

  // 🔥 修正：生成 M + 純數字格式 (M20260211171114)
  private generateMemberNo(): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    // M + yyyyMMddHHmmss
    return `M${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  }

  // --- Actions ---
  async updateSettings(s: StoreSettings) {
    const docRef = doc(this.firestore, 'config/storeSettings');
    await setDoc(docRef, s, { merge: true });
  }

  async addCategory(name: string) { 
    const n = name.trim();
    const current = this.categories();
    if (n && !current.includes(n)) {
       const newList = [...current, n];
       await setDoc(doc(this.firestore, 'config/categories'), { list: newList }, { merge: true });
    }
  }

  async addProduct(p: Product) {
    // 🔥 新增預購/上架預設值
    const newProduct = {
      ...p,
      isPreorder: p.isPreorder ?? false,
      isListed: p.isListed ?? true 
    };
    await setDoc(doc(this.firestore, 'products', p.id), newProduct);
  }

  async updateProduct(p: Product) {
    await updateDoc(doc(this.firestore, 'products', p.id), { ...p });
  }

  async toggleProductListing(id: string, currentStatus: boolean) {
    await updateDoc(doc(this.firestore, 'products', id), { isListed: !currentStatus });
  }

  async deleteProduct(id: string) {
    await deleteDoc(doc(this.firestore, 'products', id));
  }

  generateProductCode(prefix: string): string {
    if (!prefix) prefix = 'Z';
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const datePart = `${yy}${mm}${dd}`;
    const pattern = new RegExp(`^${prefix}${datePart}(\\d{3})$`);
    let maxSeq = 0;
    this.products().forEach(p => {
       const match = p.code.match(pattern);
       if (match) {
          const seq = parseInt(match[1], 10);
          if (seq > maxSeq) maxSeq = seq;
       }
    });
    const newSeq = String(maxSeq + 1).padStart(3, '0');
    return `${prefix}${datePart}${newSeq}`;
  }

  generateNextProductCode(): string {
    return this.generateProductCode('P');
  }

  addToCart(product: Product, option: string, quantity: number) {
    const user = this.currentUser();
    let finalPrice = product.priceGeneral;
    if (user?.tier === 'wholesale' && product.priceWholesale > 0) finalPrice = product.priceWholesale;
    else if (user?.tier === 'vip' && product.priceVip > 0) finalPrice = product.priceVip;

    this.cart.update(current => {
      const exist = current.find(i => i.productId === product.id && i.option === option);
      if (exist) {
        return current.map(i => i === exist ? { ...i, quantity: i.quantity + quantity, price: finalPrice } : i);
      }
      return [...current, { 
        productId: product.id, 
        productName: product.name, 
        productImage: product.image, 
        option, 
        price: finalPrice, 
        quantity,
        isPreorder: product.isPreorder // 🔥 紀錄是否預購
      }];
    });
  }

  removeFromCart(index: number) { this.cart.update(l => l.filter((_, i) => i !== index)); }
  
  updateCartQty(index: number, delta: number) {
    this.cart.update(l => l.map((item, i) => i === index ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  }

  clearCart() { this.cart.set([]); }

  // 🔥 整合後的 createOrder：使用直接寫入 Firestore + GAS 通知
  async createOrder(
    paymentInfo: any, 
    shippingInfo: any, 
    usedCredits: number, 
    paymentMethod: 'cash'|'bank_transfer'|'cod',
    shippingMethod: 'meetup'|'myship'|'family'|'delivery',
    shippingFee: number,
    checkoutItems: CartItem[]
  ) {
    const user = this.currentUser();
    if (!user) {
      alert('請先登入會員');
      return null;
    }

    try {
      // 1. 計算金額
      const subtotal = checkoutItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      const discount = 0; // 若有折扣邏輯可加
      const finalTotal = subtotal + shippingFee - usedCredits - discount;

      // 賣貨便尾款邏輯 (如果是賣貨便，保留 $20 尾款)
      const balanceDue = shippingMethod === 'myship' ? 20 : 0;
      const depositPaid = Math.max(0, finalTotal - balanceDue);

      // 2. 建立訂單物件
      const newOrder: Omit<Order, 'id'> = {
        userId: user.id,
        userEmail: user.email,
        userName: shippingInfo.name || user.name,
        items: checkoutItems,
        subtotal,
        discount,
        shippingFee,
        usedCredits,
        finalTotal,
        depositPaid,
        balanceDue,
        paymentMethod,
        paymentName: paymentInfo?.name || '',
        paymentLast5: paymentInfo?.last5 || '',
        shippingMethod,
        shippingName: shippingInfo.name,
        shippingPhone: shippingInfo.phone,
        shippingStore: shippingInfo.storeName || '',
        shippingAddress: shippingInfo.address || '',
        status: 'pending_payment',
        createdAt: Date.now(),
        note: shippingInfo.note || paymentInfo.note || ''
      };

      // 3. 寫入 Firestore (Client Side)
      const docRef = await addDoc(collection(this.firestore, 'orders'), newOrder);
      const orderId = docRef.id;

      // 4. 更新 User 累積消費與點數
      const updatedUser = { 
        ...user, 
        totalSpend: user.totalSpend + finalTotal, 
        credits: user.credits - usedCredits 
      };
      await this.updateUser(updatedUser);

      // 5. 清空購物車中已結帳商品
      this.cart.update(current => current.filter(c => 
        !checkoutItems.some(k => k.productId === c.productId && k.option === c.option)
      ));

      // 6. 🔥 呼叫 GAS 發送通知
      this.sendGasNotification({
        orderId: orderId,
        total: finalTotal,
        name: newOrder.userName,
        email: user.email,
        action: 'new_order',
        items: checkoutItems.map(i => `${i.productName} x${i.quantity}`).join(', ')
      });

      return { id: orderId, ...newOrder } as Order;

    } catch (error: any) {
      console.error('Order Error:', error);
      alert(`訂單建立失敗：${error.message}`);
      return null;
    }
  }

  // 🔥 新增：貨到通知 (管理員使用，自動發送賣貨便連結)
  async notifyArrival(order: Order) {
    if (!order.userEmail) {
      alert('此訂單沒有 Email，無法發送通知');
      return;
    }

    const confirmSend = confirm(`確定要發送貨到通知給 ${order.userName} 嗎？\n將附上賣貨便連結。`);
    if (!confirmSend) return;

    // 1. 呼叫 GAS 發信
    await this.sendGasNotification({
      action: 'arrival_notice', 
      orderId: order.id,
      name: order.userName,
      email: order.userEmail,
      shippingLink: this.MY_SHIP_LINK // 自動帶入您的連結
    });

    // 2. 更新狀態
    await updateDoc(doc(this.firestore, 'orders', order.id), {
      status: 'arrived_notified',
      shippingLink: this.MY_SHIP_LINK
    });

    alert('已發送通知！');
  }

  // 私有輔助：呼叫 GAS
  private sendGasNotification(data: any) {
    // 使用 no-cors 模式發送 (fire and forget)
    fetch(this.GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(data)
    }).catch(e => console.error("GAS Notification Error", e));
  }

  async updateOrderStatus(id: string, status: Order['status'], extra: Partial<Order> = {}) {
    await updateDoc(doc(this.firestore, 'orders', id), { status, ...extra });
  }

  async reportPayment(id: string, info: any) {
    await updateDoc(doc(this.firestore, 'orders', id), {
      status: 'paid_verifying', 
      paymentName: info.name, 
      paymentTime: info.time, 
      paymentLast5: info.last5 
    });
  }

  // --- Auth Actions (🔥 包含自動修正舊編號邏輯) ---

  async loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(this.auth, provider);
      const gUser = credential.user;

      const userRef = doc(this.firestore, 'users', gUser.uid);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const existingUser = docSnap.data() as User;
        
        // 🔥 檢查與修正：
        // 1. 如果沒有 memberNo -> 生成新的
        // 2. 如果有 memberNo 但包含斜線 '/' (舊格式) -> 自動轉成 M + 純數字
        if (!existingUser.memberNo || existingUser.memberNo.includes('/')) {
           let newNo = '';
           if (existingUser.memberNo && existingUser.memberNo.includes('/')) {
             // 舊格式修正: 2026/02/11... -> M20260211...
             newNo = 'M' + existingUser.memberNo.replace(/\//g, '');
           } else {
             // 全新生成
             newNo = this.generateMemberNo();
           }
           
           await updateDoc(userRef, { memberNo: newNo });
           existingUser.memberNo = newNo;
        }

        this.currentUser.set(existingUser);
        localStorage.setItem('92mymy_uid', existingUser.id);
        return existingUser;
      } else {
        // --- 新會員 ---
        // 生成可讀編號
        const readableMemberNo = this.generateMemberNo();

        const newUser: User = { 
          id: gUser.uid,
          memberNo: readableMemberNo, // 🔥 存入新編號
          email: gUser.email || '', 
          name: gUser.displayName || '新會員', 
          photoURL: gUser.photoURL || '',
          totalSpend: 0, 
          isAdmin: false, 
          tier: 'general', 
          credits: 0
        };
        
        await setDoc(userRef, newUser);
        
        this.currentUser.set(newUser);
        localStorage.setItem('92mymy_uid', gUser.uid);
        
        return newUser;
      }
    } catch (error) {
      console.error('Google Login Error', error);
      alert('登入失敗，請重試 (請檢查 Firebase Domain 設定)');
      return null;
    }
  }

  async updateUser(u: User) {
    await updateDoc(doc(this.firestore, 'users', u.id), { ...u });
    if (this.currentUser()?.id === u.id) this.currentUser.set(u);
  }

  logout() { 
     signOut(this.auth); 
     this.currentUser.set(null); 
     if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('92mymy_uid');
     }
  }
}