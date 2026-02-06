import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
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
  getDocs
} from '@angular/fire/firestore';
import { map, switchMap, from, of, Observable } from 'rxjs';

// --- Interfaces (Kept identical for compatibility) ---
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
  phone: string;
  name: string;
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
  
  // 1. Settings (Real-time sync from Firestore path 'config/storeSettings')
  private settings$: Observable<StoreSettings> = docData(doc(this.firestore, 'config/storeSettings')).pipe(
    map((data: any) => {
      // Deep merge with defaults to ensure all fields exist
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

  // 2. Categories (Real-time sync from 'config/categories')
  private categories$: Observable<string[]> = docData(doc(this.firestore, 'config/categories')).pipe(
    map((data: any) => data ? (data.list as string[]) : ['熱銷精選', '服飾', '包包', '生活小物'])
  );
  categories = toSignal(this.categories$, { initialValue: ['熱銷精選', '服飾', '包包', '生活小物'] });

  // 3. Products (Real-time sync from collection 'products')
  private products$: Observable<Product[]> = collectionData(collection(this.firestore, 'products'), { idField: 'id' }) as Observable<Product[]>;
  products = toSignal(this.products$, { initialValue: [] as Product[] });

  // 4. Users (Real-time sync from collection 'users')
  private users$: Observable<User[]> = collectionData(collection(this.firestore, 'users'), { idField: 'id' }) as Observable<User[]>;
  users = toSignal(this.users$, { initialValue: [] as User[] });

  // 5. Orders (Real-time sync from collection 'orders')
  private orders$: Observable<Order[]> = collectionData(collection(this.firestore, 'orders'), { idField: 'id' }) as Observable<Order[]>;
  orders = toSignal(this.orders$, { initialValue: [] as Order[] });

  // --- Local State ---
  currentUser = signal<User | null>(null);
  
  // Cart remains in LocalStorage
  cart = signal<CartItem[]>([]);
  cartTotal = computed(() => this.cart().reduce((sum, item) => sum + (item.price * item.quantity), 0));
  cartCount = computed(() => this.cart().reduce((count, item) => count + item.quantity, 0));

  constructor() {
    // Initialize Cart from LocalStorage (Safe check for SSR/Build)
    if (typeof localStorage !== 'undefined') {
      const savedCart = localStorage.getItem('92mymy_cart');
      if (savedCart) this.cart.set(JSON.parse(savedCart));

      // Check for persisted login session
      const savedUserId = localStorage.getItem('92mymy_uid');
      if (savedUserId) {
         // Wait for users to be loaded then find the user
         getDocs(query(collection(this.firestore, 'users'), where('id', '==', savedUserId))).then(snap => {
           if (!snap.empty) {
             this.currentUser.set(snap.docs[0].data() as User);
           }
         });
      }
    }

    // Persist Cart to LocalStorage whenever it changes
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
    // We use setDoc with p.id to ensure the ID matches the doc ID
    await setDoc(doc(this.firestore, 'products', p.id), p);
  }

  async updateProduct(p: Product) {
    await updateDoc(doc(this.firestore, 'products', p.id), { ...p });
  }

  async deleteProduct(id: string) {
    await deleteDoc(doc(this.firestore, 'products', id));
  }

  // --- ID Generation Logic (Reused but based on Signal state) ---
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

  // --- Cart Actions (Local Only) ---
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
    
    // Generate Order ID
    const now = new Date();
    const datePrefix = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    // Use current orders length to estimate ID (Optimistic)
    const count = this.orders().filter(o => o.id.startsWith(datePrefix)).length;
    const orderId = `${datePrefix}${String(count + 1).padStart(4, '0')}`;

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

    // 1. Save Order to Firestore
    await setDoc(doc(this.firestore, 'orders', orderId), newOrder);

    // 2. Update User (Spend & Credits)
    const updatedUser = { 
        ...user, 
        totalSpend: user.totalSpend + sub, 
        credits: user.credits - usedCredits 
    };
    await this.updateUser(updatedUser);

    // 3. Update Stock (Transactional logic simplified here)
    checkoutItems.forEach(async (item) => {
       const p = this.products().find(prod => prod.id === item.productId);
       if (p) {
          await updateDoc(doc(this.firestore, 'products', p.id), {
             stock: p.stock - item.quantity,
             soldCount: p.soldCount + item.quantity
          });
       }
    });

    // 4. Clean Local Cart
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

  // --- User/Auth Actions ---
  
  // Login: Simple query by phone number
  login(phone: string) {
    // Note: Since 'users' is a signal synced with all users (admin view), we can find it locally.
    // For a real large app, we should query Firestore. But for this specific logic requested:
    const u = this.users().find(user => user.phone === phone);
    if (u) {
       this.currentUser.set(u);
       if (typeof localStorage !== 'undefined') {
          localStorage.setItem('92mymy_uid', u.id);
       }
    }
    return u;
  }

  async register(phone: string, name: string) {
    // ID Generation
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const datePart = `${yy}${mm}${dd}`;
    const prefix = 'M';
    
    const pattern = new RegExp(`^${prefix}${datePart}(\\d{4})$`);
    let maxSeq = 0;
    this.users().forEach(u => {
       const match = u.id.match(pattern);
       if (match) {
          const seq = parseInt(match[1], 10);
          if (seq > maxSeq) maxSeq = seq;
       }
    });
    
    const newSeq = String(maxSeq + 1).padStart(4, '0');
    const id = `${prefix}${datePart}${newSeq}`;

    const newUser: User = { id, phone, name, totalSpend: 0, isAdmin: false, tier: 'general', credits: 0 };
    
    // Save to Firestore
    await setDoc(doc(this.firestore, 'users', id), newUser);
    
    // Set Session
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
     this.currentUser.set(null); 
     if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('92mymy_uid');
     }
  }
}