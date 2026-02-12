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
  // --- 成本與其他欄位 ---
  localPrice: number;
  exchangeRate: number;
  costMaterial: number; 
  weight: number; 
  shippingCostPerKg: number; 
  // -------------------
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

  // 🔥 修正：確保欄位存在
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
  isPreorder: boolean; 
}

export interface User {
  id: string;        
  memberId?: string; 
  memberNo?: string; 
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
  userEmail?: string; 
  userName?: string;  
  items: CartItem[];
  subtotal: number;
  discount: number; 
  shippingFee: number; 
  usedCredits: number; 
  finalTotal: number;
  depositPaid?: number; 
  balanceDue?: number;  
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
    categoryCodes: { '熱銷精選': 'H', '服飾': 'C', '包包': 'B', '生活小物': 'L' },
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

  currentUser = signal<User | null>(null);
  private user$ = toObservable(this.currentUser);

  // 🔥 確保 users 是公開的，解決 Admin Panel 找不到屬性的問題
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
        const ref = collection(this.firestore, 'orders');
        if (u.isAdmin) {
          return collectionData(ref, { idField: 'id' }) as Observable<Order[]>;
        } else {
          const q = query(ref, where('userId', '==', u.id));
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

  // --- Helpers ---
  private generateMemberNo(): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `M${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  }

  // 🔥 黃色筆：產生日期時間格式的訂單編號
  private generateOrderId(): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const yyyy = now.getFullYear();
    const MM = pad(now.getMonth() + 1);
    const dd = pad(now.getDate());
    const HH = pad(now.getHours());
    const mm = pad(now.getMinutes());
    const ss = pad(now.getSeconds());
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${yyyy}${MM}${dd}${HH}${mm}${ss}${random}`;
  }

  // 🔥 綠色筆：複製訂單編號功能
  copyToClipboard(text: string) {
    if (navigator && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => alert('已複製訂單編號！'));
    } else {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("Copy");
      textArea.remove();
      alert('已複製訂單編號！');
    }
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
    const datePart = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const pattern = new RegExp(`^${prefix}${datePart}(\\d{3})$`);
    let maxSeq = 0;
    this.products().forEach(p => {
       const match = p.code.match(pattern);
       if (match) {
          const seq = parseInt(match[1], 10);
          if (seq > maxSeq) maxSeq = seq;
       }
    });
    return `${prefix}${datePart}${String(maxSeq + 1).padStart(3, '0')}`;
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
        isPreorder: product.isPreorder 
      }];
    });
  }

  removeFromCart(index: number) { this.cart.update(l => l.filter((_, i) => i !== index)); }
  
  updateCartQty(index: number, delta: number) {
    this.cart.update(l => l.map((item, i) => i === index ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  }

  clearCart() { this.cart.set([]); }

  // 🔥 核心修正：createOrder
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
      const subtotal = checkoutItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      const discount = 0; 
      const finalTotal = subtotal + shippingFee - usedCredits - discount;

      const balanceDue = shippingMethod === 'myship' ? 20 : 0;
      const depositPaid = Math.max(0, finalTotal - balanceDue);

      // 🔥 黃色筆：生成自定義訂單 ID
      const orderId = this.generateOrderId();

      const newOrder: Order = {
        id: orderId, 
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

      await setDoc(doc(this.firestore, 'orders', orderId), newOrder);

      const updatedUser = { 
        ...user, 
        totalSpend: user.totalSpend + finalTotal, 
        credits: user.credits - usedCredits 
      };
      await this.updateUser(updatedUser);

      this.cart.update(current => current.filter(c => 
        !checkoutItems.some(k => k.productId === c.productId && k.option === c.option)
      ));

      this.sendGasNotification({
        orderId: orderId,
        total: finalTotal,
        name: newOrder.userName,
        email: user.email,
        action: 'new_order',
        items: checkoutItems.map(i => `${i.productName} x${i.quantity}`).join(', ')
      });

      return newOrder;

    } catch (error: any) {
      console.error('Order Error:', error);
      alert(`訂單建立失敗：${error.message}`);
      return null;
    }
  }

  async notifyArrival(order: Order) {
    if (!order.userEmail) {
      alert('此訂單沒有 Email，無法發送通知');
      return;
    }
    const confirmSend = confirm(`確定要發送貨到通知給 ${order.userName} 嗎？\n將附上賣貨便連結。`);
    if (!confirmSend) return;

    await this.sendGasNotification({
      action: 'arrival_notice', 
      orderId: order.id,
      name: order.userName,
      email: order.userEmail,
      shippingLink: this.MY_SHIP_LINK 
    });

    await updateDoc(doc(this.firestore, 'orders', order.id), {
      status: 'arrived_notified',
      shippingLink: this.MY_SHIP_LINK
    });

    alert('已發送通知！');
  }

  // 🔥 藍色筆修正：確保 GAS 傳送乾淨數據
  private sendGasNotification(data: any) {
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

  async loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(this.auth, provider);
      const gUser = credential.user;
      const userRef = doc(this.firestore, 'users', gUser.uid);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const existingUser = docSnap.data() as User;
        if (!existingUser.memberNo || existingUser.memberNo.includes('/')) {
           let newNo = existingUser.memberNo && existingUser.memberNo.includes('/')
             ? 'M' + existingUser.memberNo.replace(/\//g, '')
             : this.generateMemberNo();
           await updateDoc(userRef, { memberNo: newNo });
           existingUser.memberNo = newNo;
        }
        this.currentUser.set(existingUser);
        localStorage.setItem('92mymy_uid', existingUser.id);
        return existingUser;
      } else {
        const readableMemberNo = this.generateMemberNo();
        const newUser: User = { 
          id: gUser.uid,
          memberNo: readableMemberNo, 
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
      alert('登入失敗，請重試');
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