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
  limit
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
  localPrice: number;
  exchangeRate: number;
  costMaterial: number; 
  weight: number; 
  shippingCostPerKg: number; 
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
}

export interface CartItem {
  productId: string;
  productName: string;
  productImage: string;
  option: string;
  price: number;
  quantity: number;
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

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  discount: number; 
  shippingFee: number; 
  usedCredits: number; 
  finalTotal: number;
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
  status: 'pending_payment' | 'paid_verifying' | 'unpaid_alert' | 'refund_needed' | 'refunded' | 'payment_confirmed' | 'shipped' | 'completed' | 'cancelled';
  createdAt: number;
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
    await setDoc(doc(this.firestore, 'products', p.id), p);
  }

  async updateProduct(p: Product) {
    await updateDoc(doc(this.firestore, 'products', p.id), { ...p });
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
      return [...current, { productId: product.id, productName: product.name, productImage: product.image, option, price: finalPrice, quantity }];
    });
  }

  removeFromCart(index: number) { this.cart.update(l => l.filter((_, i) => i !== index)); }
  
  updateCartQty(index: number, delta: number) {
    this.cart.update(l => l.map((item, i) => i === index ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  }

  clearCart() { this.cart.set([]); }

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
      // 1. 呼叫後端 API 建立訂單
      const response = await fetch('/api/createOrder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          items: checkoutItems,
          shippingMethod,
          shippingFee,
          paymentMethod,
          usedCredits,
          paymentInfo,
          shippingInfo
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '訂單建立失敗');

      // 2. 更新本地 User 資料
      const updatedUser = { 
        ...user, 
        totalSpend: user.totalSpend + result.finalTotal, 
        credits: user.credits - usedCredits 
      };
      this.currentUser.set(updatedUser);

      // 3. 清空購物車中已結帳商品
      this.cart.update(current => current.filter(c => 
        !checkoutItems.some(k => k.productId === c.productId && k.option === c.option)
      ));

      // =======================================================
      // 🔥 [新增] 呼叫 Google Apps Script 發送通知 (Telegram + Email)
      // =======================================================
      // 請將下方的網址換成您剛剛部署 GAS 取得的那串網址
      const gasUrl = "https://script.google.com/macros/s/AKfycbzOKiHDFP3zs5VB4zntpZYB9daht0hL1Lfwlat6otLFJVy48m8CI7rwCHro3u-CrCIk/exec"; 
      
      const notifyData = {
        orderId: result.orderId,
        total: result.finalTotal,
        name: shippingInfo.name || user.name || '訪客'
      };

      // 使用 no-cors 模式發送，避免跨域錯誤 (fire and forget)
      fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(notifyData)
      }).catch(err => console.error('通知發送異常(不影響訂單):', err));
      // =======================================================

      return { 
          id: result.orderId, 
          finalTotal: result.finalTotal,
          status: 'pending_payment' 
      } as Order;

    } catch (error: any) {
      console.error('API Error:', error);
      alert(`建立訂單失敗：${error.message}`);
      return null;
    }
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

  // --- Auth Actions (🔥 修正後的登入：支援自動修正舊編號) ---

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
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        
        const oldFormatId = `M${yy}${mm}${dd}${hh}${min}${ss}`;
        const readableMemberNo = this.generateMemberNo(); // M20260211...

        const newUser: User = { 
          id: gUser.uid,
          memberId: oldFormatId,
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