import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { 
  Firestore, collection, collectionData, doc, docData, 
  setDoc, updateDoc, deleteDoc, query, where, getDoc, addDoc 
} from '@angular/fire/firestore';
import { Auth, signInWithPopup, GoogleAuthProvider, signOut } from '@angular/fire/auth';
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
  priceType?: 'normal' | 'event' | 'clearance'; 
  bulkDiscount?: { count: number, total: number }; 
  allowPayment?: { cash: boolean; bankTransfer: boolean; cod: boolean; };
  allowShipping?: { meetup: boolean; myship: boolean; family: boolean; delivery: boolean; };
  stock: number;
  note: string;
  soldCount: number;
  buyUrl?: string;
  // 🔥 預購與上下架
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

// 🔥 完整訂單狀態：包含原本與新增的所有狀態
export type OrderStatus = 'pending_payment' | 'paid_verifying' | 'unpaid_alert' | 'refund_needed' | 'refunded' | 'payment_confirmed' | 'pending_shipping' | 'arrived_notified' | 'shipped' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  userId: string;
  userEmail?: string;
  userName: string;
  items: CartItem[];
  subtotal: number;
  discount: number; 
  shippingFee: number; 
  usedCredits: number; 
  finalTotal: number;
  depositPaid: number; 
  balanceDue: number;  
  status: OrderStatus; // 使用完整的狀態類型
  paymentMethod: 'cash' | 'bank_transfer' | 'cod'; 
  paymentName?: string;
  paymentTime?: string;
  paymentLast5?: string;
  shippingMethod: 'meetup' | 'myship' | 'family' | 'delivery'; 
  shippingName?: string;
  shippingPhone?: string;
  shippingStore?: string; 
  shippingAddress?: string; 
  shippingLink?: string; // 🔥 補回 shippingLink
  createdAt: number;
  note?: string;
}

export interface StoreSettings {
  birthdayGiftGeneral: number;
  birthdayGiftVip: number;
  categoryCodes: { [key: string]: string };
  paymentMethods: { cash: boolean; bankTransfer: boolean; cod: boolean; };
  shipping: { freeThreshold: number; methods: { meetup: { enabled: boolean, fee: number }; myship: { enabled: boolean, fee: number }; family: { enabled: boolean, fee: number }; delivery: { enabled: boolean, fee: number }; } }
}

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  // --- GAS 與 賣貨便 設定 ---
  private gasUrl = "https://script.google.com/macros/s/AKfycbzOKiHDFP3zs5VB4zntpZYB9daht0hL1Lfwlat6otLFJVy48m8CI7rwCHro3u-CrCIk/exec";
  private myShipLink = "https://myship.7-11.com.tw/general/detail/GM2602124017223";

  private defaultSettings: StoreSettings = {
    birthdayGiftGeneral: 100, birthdayGiftVip: 500,
    categoryCodes: { '熱銷精選': 'H', '服飾': 'C', '包包': 'B', '生活小物': 'L' },
    paymentMethods: { cash: false, bankTransfer: true, cod: true },
    shipping: { freeThreshold: 2000, methods: { meetup: { enabled: true, fee: 0 }, myship: { enabled: true, fee: 35 }, family: { enabled: true, fee: 39 }, delivery: { enabled: false, fee: 100 } } }
  };

  // --- Signals ---
  private settings$ = docData(doc(this.firestore, 'config/storeSettings')).pipe(map(data => ({...this.defaultSettings, ...data} as StoreSettings)));
  settings = toSignal(this.settings$, { initialValue: this.defaultSettings });

  private categories$ = docData(doc(this.firestore, 'config/categories')).pipe(map((data: any) => data ? (data.list as string[]) : ['熱銷精選', '服飾', '包包', '生活小物']));
  categories = toSignal(this.categories$, { initialValue: ['熱銷精選', '服飾', '包包', '生活小物'] });

  private products$ = collectionData(collection(this.firestore, 'products'), { idField: 'id' }) as Observable<Product[]>;
  products = toSignal(this.products$, { initialValue: [] as Product[] });

  currentUser = signal<User | null>(null);
  private user$ = toObservable(this.currentUser);

  // 🔥 補回 users 屬性
  users = toSignal(
    this.user$.pipe(
      switchMap(u => {
        if (u?.isAdmin) return collectionData(collection(this.firestore, 'users'), { idField: 'id' }) as Observable<User[]>;
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
        const q = u.isAdmin ? ref : query(ref, where('userId', '==', u.id));
        return collectionData(q, { idField: 'id' }) as Observable<Order[]>;
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
           if (snap.exists()) this.currentUser.set(snap.data() as User);
         });
      }
    }
    effect(() => localStorage.setItem('92mymy_cart', JSON.stringify(this.cart())));
  }

  // --- 🔥 補回後端管理必備方法 ---
  async updateSettings(s: StoreSettings) {
    await setDoc(doc(this.firestore, 'config/storeSettings'), s, { merge: true });
  }

  async addCategory(name: string) { 
    const current = this.categories();
    if (name && !current.includes(name)) {
       await setDoc(doc(this.firestore, 'config/categories'), { list: [...current, name] }, { merge: true });
    }
  }

  async updateUser(u: User) {
    await updateDoc(doc(this.firestore, 'users', u.id), { ...u });
    if (this.currentUser()?.id === u.id) this.currentUser.set(u);
  }

  // 🔥 補回編碼生成邏輯
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

  generateNextProductCode(): string { return this.generateProductCode('P'); }

  // --- Product Actions ---
  async addProduct(p: Product) {
    const newProduct = { ...p, isPreorder: p.isPreorder ?? false, isListed: p.isListed ?? true };
    await setDoc(doc(this.firestore, 'products', p.id), newProduct);
  }

  async updateProduct(p: Product) {
    await updateDoc(doc(this.firestore, 'products', p.id), { ...p });
  }

  async toggleProductListing(id: string, currentStatus: boolean) {
    await updateDoc(doc(this.firestore, 'products', id), { isListed: !currentStatus });
  }

  async deleteProduct(id: string) { await deleteDoc(doc(this.firestore, 'products', id)); }

  // --- Order Actions ---
  async createOrder(shippingInfo: any, usedCredits: number, paymentMethod: any, shippingMethod: any, checkoutItems: CartItem[]) {
    const user = this.currentUser();
    if (!user) return null;

    const subtotal = checkoutItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    const finalTotal = subtotal - usedCredits;
    const balanceDue = 20; 
    const depositPaid = finalTotal - balanceDue;

    const newOrder: Omit<Order, 'id'> = {
      userId: user.id,
      userEmail: user.email,
      userName: shippingInfo.name || user.name,
      items: checkoutItems,
      subtotal,
      discount: 0,
      shippingFee: 0, 
      usedCredits,
      finalTotal,
      depositPaid,
      balanceDue,
      status: 'pending_payment',
      paymentMethod,
      shippingMethod,
      createdAt: Date.now()
    };

    try {
      const docRef = await addDoc(collection(this.firestore, 'orders'), newOrder);
      const orderId = docRef.id;

      fetch(this.gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'new_order', orderId, total: finalTotal, name: newOrder.userName, email: user.email })
      }).catch(err => console.error('GAS Error:', err));

      this.cart.update(current => current.filter(c => !checkoutItems.some(k => k.productId === c.productId && k.option === c.option)));
      return { id: orderId, ...newOrder } as Order;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  // 🔥 補回 updateOrderStatus 方法
  async updateOrderStatus(id: string, status: Order['status'], extra: Partial<Order> = {}) {
    await updateDoc(doc(this.firestore, 'orders', id), { status, ...extra });
  }

  async notifyArrival(order: Order) {
    fetch(this.gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'arrival_notice', orderId: order.id, name: order.userName, email: order.userEmail, shippingLink: this.myShipLink })
    }).then(() => this.updateOrderStatus(order.id, 'arrived_notified'));
  }

  async reportPayment(id: string, info: any) {
    await this.updateOrderStatus(id, 'paid_verifying', { paymentName: info.name, paymentTime: info.time, paymentLast5: info.last5 });
  }

  // --- Auth Actions ---
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
           const now = new Date();
           const pad = (n:number)=>n.toString().padStart(2,'0');
           const newNo = `M${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
           await updateDoc(userRef, { memberNo: newNo });
           existingUser.memberNo = newNo;
        }
        this.currentUser.set(existingUser);
        localStorage.setItem('92mymy_uid', existingUser.id);
        return existingUser;
      } else {
        const now = new Date();
        const pad = (n:number)=>n.toString().padStart(2,'0');
        const newUser: User = { id: gUser.uid, memberNo: `M${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`, email: gUser.email || '', name: gUser.displayName || '新會員', photoURL: gUser.photoURL || '', totalSpend: 0, isAdmin: false, tier: 'general', credits: 0 };
        await setDoc(userRef, newUser);
        this.currentUser.set(newUser);
        localStorage.setItem('92mymy_uid', gUser.uid);
        return newUser;
      }
    } catch (error) { return null; }
  }

  logout() { signOut(this.auth); this.currentUser.set(null); localStorage.removeItem('92mymy_uid'); }
  
  // --- Cart Helpers ---
  removeFromCart(index: number) { this.cart.update(l => l.filter((_, i) => i !== index)); }
  updateCartQty(index: number, delta: number) {
    this.cart.update(l => l.map((item, i) => i === index ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  }
  clearCart() { this.cart.set([]); }
}