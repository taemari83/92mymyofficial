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
  orderBy,
  limit
} from '@angular/fire/firestore';
import { 
  Auth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
} from '@angular/fire/auth';
import { map, switchMap, of, Observable, from } from 'rxjs';

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

  // --- Signals from Firestore ---
  
  // Settings & Categories & Products (這些是公開資訊，維持全域讀取沒問題)
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

  // --- Local State & Secure Data Fetching ---
  currentUser = signal<User | null>(null);
  
  // 為了實現安全讀取，我們將 currentUser 轉為 Observable，當使用者變更時，重新決定要抓什麼資料
  private user$ = toObservable(this.currentUser);

  // 🔥 [安全修正] Users: 只有當使用者是管理員 (isAdmin) 時，才去讀取所有會員資料
  users = toSignal(
    this.user$.pipe(
      switchMap(u => {
        if (u?.isAdmin) {
          // 是管理員 -> 讀取所有會員
          return collectionData(collection(this.firestore, 'users'), { idField: 'id' }) as Observable<User[]>;
        }
        // 不是管理員 -> 回傳空陣列 (保護個資)
        return of([] as User[]);
      })
    ),
    { initialValue: [] as User[] }
  );

  // 🔥 [安全修正] Orders: 管理員讀全部，一般會員只讀自己的
  orders = toSignal(
    this.user$.pipe(
      switchMap(u => {
        if (!u) return of([] as Order[]); // 未登入 -> 什麼都看不到
        
        if (u.isAdmin) {
          // 管理員 -> 讀取所有訂單
          return collectionData(collection(this.firestore, 'orders'), { idField: 'id' }) as Observable<Order[]>;
        } else {
          // 一般會員 -> 只讀取 userId 等於自己的訂單
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
         // 這裡改用直接查詢單一文件，而不是依賴 users 陣列
         getDocs(query(collection(this.firestore, 'users'), where('id', '==', savedUserId))).then(snap => {
           if (!snap.empty) {
             this.currentUser.set(snap.docs[0].data() as User);
           }
         });
      }
    }

    effect(() => {
       const c = this.cart();
       if (typeof localStorage !== 'undefined') {
          localStorage.setItem('92mymy_cart', JSON.stringify(c));
       }
    });
  }

  // --- Settings Actions ---
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

  // --- Product Actions ---
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

  // --- Cart Actions ---
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

  // --- Order Actions ---
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
    if (!user) return null;

    const sub = checkoutItems.reduce((s, i) => s + (i.price * i.quantity), 0);
    
    let discount = 0;
    if (shippingMethod === 'myship' || shippingMethod === 'family') {
      discount = 20;
    }

    let final = Math.max(0, sub + shippingFee - discount - usedCredits);
    
    // 🔥 [安全修正] ID 生成改為查詢資料庫最後一筆，而不是依賴本地全訂單列表
    const now = new Date();
    const datePrefix = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    
    // 查詢當天最後一筆訂單編號
    const q = query(collection(this.firestore, 'orders'), where('id', '>=', datePrefix), where('id', '<', datePrefix + '9999'), orderBy('id', 'desc'), limit(1));
    const snapshot = await getDocs(q);
    
    let seq = 1;
    if (!snapshot.empty) {
       const lastId = snapshot.docs[0].id;
       const lastSeq = parseInt(lastId.slice(-4)); // 取最後4碼
       if (!isNaN(lastSeq)) seq = lastSeq + 1;
    }
    
    const orderId = `${datePrefix}${String(seq).padStart(4, '0')}`;

    const initialStatus: Order['status'] = paymentMethod === 'bank_transfer' 
        ? (paymentInfo.last5 ? 'paid_verifying' : 'pending_payment') 
        : (paymentMethod === 'cod' ? 'payment_confirmed' : 'pending_payment');

    const newOrder: Order = {
      id: orderId,
      userId: user.id,
      items: [...checkoutItems],
      subtotal: sub,
      discount,
      shippingFee,
      usedCredits,
      finalTotal: final,
      paymentMethod,
      paymentName: paymentInfo.name,
      paymentTime: paymentInfo.time,
      paymentLast5: paymentInfo.last5,
      shippingMethod,
      shippingName: shippingInfo.name,
      shippingPhone: shippingInfo.phone,
      shippingStore: shippingInfo.store,
      shippingAddress: shippingInfo.address,
      status: initialStatus,
      createdAt: Date.now()
    };

    await setDoc(doc(this.firestore, 'orders', orderId), newOrder);

    const updatedUser = { 
        ...user, 
        totalSpend: user.totalSpend + sub, 
        credits: user.credits - usedCredits 
    };
    await this.updateUser(updatedUser);

    checkoutItems.forEach(async (item) => {
       const p = this.products().find(prod => prod.id === item.productId);
       if (p) {
          await updateDoc(doc(this.firestore, 'products', p.id), {
             stock: p.stock - item.quantity,
             soldCount: p.soldCount + item.quantity
          });
       }
    });

    this.cart.update(current => current.filter(c => 
      !checkoutItems.some(k => k.productId === c.productId && k.option === c.option)
    ));

    return newOrder;
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

  // --- Auth Actions ---

  async loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(this.auth, provider);
      const gUser = credential.user;

      console.log('Google User:', gUser);

      // 🔥 [安全修正] 改為直接查詢資料庫，而不是搜尋本地 users 陣列
      const q = query(collection(this.firestore, 'users'), where('email', '==', gUser.email), limit(1));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const existingUser = snapshot.docs[0].data() as User;
        this.currentUser.set(existingUser);
        localStorage.setItem('92mymy_uid', existingUser.id);
        return existingUser;
      } else {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const datePart = `${yy}${mm}${dd}`;
        const prefix = 'M';
        
        // 🔥 [安全修正] ID 生成改為查詢資料庫
        const idQ = query(collection(this.firestore, 'users'), where('id', '>=', `${prefix}${datePart}`), where('id', '<', `${prefix}${datePart}9999`), orderBy('id', 'desc'), limit(1));
        const idSnap = await getDocs(idQ);
        
        let seq = 1;
        if (!idSnap.empty) {
           const lastId = idSnap.docs[0].id;
           const lastSeq = parseInt(lastId.slice(-4));
           if (!isNaN(lastSeq)) seq = lastSeq + 1;
        }
        
        const newSeq = String(seq).padStart(4, '0');
        const id = `${prefix}${datePart}${newSeq}`;

        const newUser: User = { 
          id, 
          email: gUser.email || '', 
          name: gUser.displayName || '新會員', 
          photoURL: gUser.photoURL || '',
          totalSpend: 0, 
          isAdmin: false, 
          tier: 'general', 
          credits: 0 
        };
        
        await setDoc(doc(this.firestore, 'users', id), newUser);
        this.currentUser.set(newUser);
        localStorage.setItem('92mymy_uid', id);
        
        return newUser;
      }
    } catch (error) {
      console.error('Google Login Error', error);
      alert('登入失敗，請重試');
      return null;
    }
  }
  
  async login(phone: string) { // 🔥 [安全修正] 這裡改成 async
    // 改為查詢資料庫
    const q = query(collection(this.firestore, 'users'), where('phone', '==', phone), limit(1));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
       const u = snapshot.docs[0].data() as User;
       this.currentUser.set(u);
       if (typeof localStorage !== 'undefined') {
          localStorage.setItem('92mymy_uid', u.id);
       }
       return u;
    }
    return null;
  }

  async register(phone: string, name: string) {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const datePart = `${yy}${mm}${dd}`;
    const prefix = 'M';
    
    // 🔥 [安全修正] ID 生成改為查詢資料庫
    const idQ = query(collection(this.firestore, 'users'), where('id', '>=', `${prefix}${datePart}`), where('id', '<', `${prefix}${datePart}9999`), orderBy('id', 'desc'), limit(1));
    const idSnap = await getDocs(idQ);
    
    let seq = 1;
    if (!idSnap.empty) {
       const lastId = idSnap.docs[0].id;
       const lastSeq = parseInt(lastId.slice(-4));
       if (!isNaN(lastSeq)) seq = lastSeq + 1;
    }
    
    const newSeq = String(seq).padStart(4, '0');
    const id = `${prefix}${datePart}${newSeq}`;

    const newUser: User = { id, phone, name, totalSpend: 0, isAdmin: false, tier: 'general', credits: 0 };
    
    await setDoc(doc(this.firestore, 'users', id), newUser);
    this.currentUser.set(newUser);
    if (typeof localStorage !== 'undefined') {
       localStorage.setItem('92mymy_uid', id);
    }
    return newUser;
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
