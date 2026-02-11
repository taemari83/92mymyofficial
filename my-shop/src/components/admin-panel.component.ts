import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StoreService, Product, Order, User, StoreSettings, CartItem } from '../services/store.service';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-[#FDFBF9] font-sans">
      
      <aside class="fixed top-0 left-0 h-full w-20 md:w-64 bg-white border-r border-gray-100 flex flex-col z-30 transition-all duration-300">
        <div class="p-6 flex items-center gap-3">
          <div class="w-8 h-8 bg-brand-400 rounded-lg flex items-center justify-center text-white font-bold shrink-0">92</div>
        </div>

        <div class="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <div class="px-3 text-xs font-bold text-gray-400 mb-2 mt-2">主要功能</div>
          <button (click)="activeTab.set('dashboard')" [class]="navClass('dashboard')"><span class="text-lg">🏠</span> <span class="hidden md:inline">主控台</span></button>
          <button (click)="activeTab.set('orders')" [class]="navClass('orders')"><span class="text-lg">🛍️</span> <span class="hidden md:inline">訂單管理</span></button>
          <button (click)="activeTab.set('products')" [class]="navClass('products')"><span class="text-lg">📦</span> <span class="hidden md:inline">商品管理</span></button>
          <button (click)="activeTab.set('customers')" [class]="navClass('customers')"><span class="text-lg">👥</span> <span class="hidden md:inline">客戶管理</span></button>
          
          <div class="px-3 text-xs font-bold text-gray-400 mb-2 mt-6">數據分析</div>
          <button (click)="activeTab.set('accounting')" [class]="navClass('accounting')"><span class="text-lg">📊</span> <span class="hidden md:inline">銷售報表</span></button>
          <button (click)="activeTab.set('inventory')" [class]="navClass('inventory')"><span class="text-lg">🏭</span> <span class="hidden md:inline">庫存管理</span></button>
          
          <div class="px-3 text-xs font-bold text-gray-400 mb-2 mt-6">設定</div>
           <button (click)="activeTab.set('settings')" [class]="navClass('settings')"><span class="text-lg">⚙️</span> <span class="hidden md:inline">商店設定</span></button>
        </div>
        
        <div class="p-4 border-t border-gray-100">
           <div class="flex items-center gap-3 p-3 rounded-xl bg-brand-50/50">
              <div class="w-8 h-8 rounded-full bg-brand-900 text-white flex items-center justify-center text-xs shrink-0">M</div>
              <div class="text-sm hidden md:block"><div class="font-bold text-brand-900">Admin</div><div class="text-xs text-gray-400">Owner</div></div>
           </div>
        </div>
      </aside>

      <main class="ml-20 md:ml-64 p-6 min-h-screen">
        
        <div class="flex justify-between items-center mb-6">
           <h2 class="text-2xl font-bold text-gray-800">{{ getTabTitle() }}</h2>
           <button class="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-brand-900 shadow-sm">↻</button>
        </div>

        @if (activeTab() === 'dashboard') {
          <div class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="bg-brand-900 text-white rounded-[2rem] p-8 shadow-xl relative overflow-hidden group"><div class="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10"></div><div class="relative z-10"><div class="flex items-center gap-2 text-white/60 text-sm font-bold uppercase tracking-widest mb-2"><span>📅 今日營業額</span></div><div class="text-4xl font-black">NT$ {{ dashboardMetrics().todayRevenue | number }}</div></div></div>
              <div class="bg-white rounded-[2rem] p-8 shadow-sm border border-brand-100 flex flex-col justify-center"><div class="text-gray-400 text-sm font-bold uppercase tracking-widest mb-2">本月銷售總額</div><div class="text-3xl font-bold text-gray-800">NT$ {{ dashboardMetrics().monthSales | number }}</div></div>
              <div class="bg-[#F0F7F4] rounded-[2rem] p-8 shadow-sm border border-[#E1EFE8] flex flex-col justify-center"><div class="text-[#5A8C74] text-sm font-bold uppercase tracking-widest mb-2">本月預估利潤</div><div class="text-3xl font-bold text-[#2D5B46]">NT$ {{ dashboardMetrics().monthProfit | number:'1.0-0' }}</div></div>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div class="bg-white p-6 rounded-2xl border border-yellow-100 shadow-sm flex flex-col items-center justify-center gap-2"><div class="text-3xl font-black text-yellow-600">{{ dashboardMetrics().toConfirm }}</div><div class="text-sm font-bold text-yellow-800">未對帳訂單</div></div>
               <div class="bg-white p-6 rounded-2xl border border-green-100 shadow-sm flex flex-col items-center justify-center gap-2"><div class="text-3xl font-black text-green-600">{{ dashboardMetrics().toShip }}</div><div class="text-sm font-bold text-green-800">待出貨</div></div>
               <div class="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center gap-2"><div class="text-3xl font-black text-gray-500">{{ dashboardMetrics().unpaid }}</div><div class="text-sm font-bold text-gray-600">未付款</div></div>
               <div class="bg-white p-6 rounded-2xl border border-red-100 shadow-sm flex flex-col items-center justify-center gap-2"><div class="text-3xl font-black text-red-500">{{ dashboardMetrics().processing }}</div><div class="text-sm font-bold text-red-800">問題/退款</div></div>
            </div>
          </div>
        }

        @if (activeTab() === 'orders') {
          <div class="space-y-6">
            <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
               <div class="flex flex-col xl:flex-row gap-4 justify-between items-center mb-6">
                  <div class="flex gap-2 overflow-x-auto pb-2">
                    @for(range of ['今日', '本週', '本月', '全部']; track range) { <button (click)="statsRange.set(range)" [class.bg-brand-900]="statsRange()===range" [class.text-white]="statsRange()===range" class="px-4 py-2 rounded-lg text-sm font-bold border border-gray-200 hover:bg-gray-50 transition-colors whitespace-nowrap" [class.bg-white]="statsRange()!==range" [class.text-gray-600]="statsRange()!==range">{{ range }}</button> }
                  </div>
                  <div class="flex-1 w-full xl:w-auto relative">
                      <input type="text" [(ngModel)]="orderSearch" placeholder="搜尋訂單..." class="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-500">
                      <span class="absolute left-4 top-1/2 -translate-y-1/2">🔍</span>
                  </div>
                  <button (click)="exportOrdersCSV()" class="px-6 py-3 bg-green-600 text-white rounded-xl font-bold shadow-sm whitespace-nowrap">匯出報表</button>
               </div>
               
               <div class="overflow-x-auto">
                 <table class="w-full text-sm text-left whitespace-nowrap">
                   <thead class="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
                     <tr><th class="p-4">訂單資訊</th><th class="p-4">客戶</th><th class="p-4">金額</th><th class="p-4">狀態</th><th class="p-4">操作</th></tr>
                   </thead>
                   <tbody class="divide-y divide-gray-100">
                     @for(order of paginatedOrders(); track order.id) {
                       <tr class="hover:bg-gray-50">
                         <td class="p-4"><div class="font-mono font-bold text-brand-900">#{{ order.id }}</div><div class="text-xs text-gray-400">{{ timeAgo(order.createdAt) }}</div></td>
                         <td class="p-4"><div class="font-bold">{{ getUserName(order.userId) }}</div></td>
                         <td class="p-4 font-bold text-brand-600">NT$ {{ order.finalTotal | number }}</td>
                         <td class="p-4"><span [class]="getPaymentStatusClass(order.status)" class="px-2 py-1 rounded text-xs font-bold">{{ getPaymentStatusLabel(order.status, order.paymentMethod) }}</span></td>
                         <td class="p-4"><button (click)="openAction($event, order)" class="px-3 py-1 border rounded hover:bg-gray-100">操作</button></td>
                       </tr>
                     }
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        }

        @if (activeTab() === 'products') { 
          <div class="space-y-6"> 
            <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50 flex justify-between items-center"> 
              <h3 class="text-2xl font-bold text-brand-900">商品管理</h3>
              <div class="flex gap-3">
                 <button (click)="exportProductsCSV()" class="px-4 py-2 bg-white border rounded-xl font-bold">匯出</button>
                 <button (click)="openProductForm()" class="px-6 py-2 bg-brand-900 text-white rounded-xl font-bold">＋ 新增</button>
              </div>
            </div> 
            <div class="grid grid-cols-1 gap-4"> 
               @for (p of store.products(); track p.id) { 
                  <div class="bg-white rounded-xl p-4 flex items-center gap-4 hover:shadow-md border border-transparent hover:border-brand-100"> 
                     <div class="w-16 h-16 rounded-lg bg-gray-100 shrink-0 overflow-hidden"><img [src]="p.image" class="w-full h-full object-cover"></div>
                     <div class="flex-1 min-w-0">
                        <div class="font-bold text-gray-800 truncate">{{ p.name }}</div>
                        <div class="text-xs text-gray-400">SKU: {{ p.code }} | 庫存: {{ p.stock }}</div>
                     </div>
                     <div class="font-bold text-brand-900">NT$ {{ p.priceGeneral }}</div>
                     <button (click)="editProduct(p)" class="px-3 py-1 bg-gray-100 rounded text-xs font-bold">編輯</button>
                  </div> 
               } 
            </div> 
          </div> 
        }
        
        @if (activeTab() === 'customers') { 
          <div class="space-y-6">
              <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50 flex flex-wrap justify-between items-center gap-4">
                 <div>
                    <h3 class="text-2xl font-bold text-brand-900">客戶管理</h3>
                    <p class="text-sm text-gray-400">查看會員資料</p>
                 </div>
                 <div class="flex gap-3 items-center">
                    <button (click)="exportCustomersCSV()" class="px-4 py-2 bg-white border rounded-xl font-bold">匯出會員</button>
                    <input type="text" [(ngModel)]="customerSearch" placeholder="搜尋..." class="pl-4 pr-4 py-2 bg-gray-50 border rounded-xl outline-none">
                 </div>
              </div>

              <div class="bg-white rounded-[2rem] shadow-sm border border-gray-50 overflow-hidden">
                 <div class="overflow-x-auto">
                   <table class="w-full text-sm text-left whitespace-nowrap">
                      <thead class="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
                         <tr>
                            <th class="p-4">會員 ID / Google UID</th>
                            <th class="p-4">姓名</th>
                            <th class="p-4">等級</th>
                            <th class="p-4 text-right">消費</th>
                            <th class="p-4 text-right">購物金</th>
                            <th class="p-4 text-right">操作</th>
                         </tr>
                      </thead>
                      <tbody class="divide-y divide-gray-100">
                         @for(u of paginatedUsers(); track u.id) {
                            <tr class="hover:bg-brand-50/30">
                               <td class="p-4">
                                  <div class="font-mono font-bold text-brand-900">{{ u.id }}</div>
                               </td>
                               <td class="p-4 font-bold">{{ u.name }}<div class="text-xs text-gray-400">{{ u.phone }}</div></td>
                               <td class="p-4"><span class="bg-gray-100 px-2 py-1 rounded text-xs font-bold">{{ u.tier }}</span></td>
                               <td class="p-4 text-right font-bold">NT$ {{ u.totalSpend | number }}</td>
                               <td class="p-4 text-right font-bold text-brand-600">{{ u.credits }}</td>
                               <td class="p-4 text-right"><button (click)="openUserModal(u)" class="text-xs border px-3 py-1 rounded">編輯</button></td>
                            </tr>
                         }
                      </tbody>
                   </table>
                 </div>
              </div>
          </div>
        }

        @if (activeTab() === 'accounting') {
           <div class="space-y-6 pt-2">
              <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex justify-between items-center">
                 <h3 class="text-xl font-bold text-gray-800">銷售報表</h3>
                 <div class="flex gap-2">
                    @for(r of ['today', 'week', 'month']; track r) { <button (click)="accountingRange.set(r)" class="px-4 py-1 rounded-lg border" [class.bg-brand-900]="accountingRange()===r" [class.text-white]="accountingRange()===r">{{ r }}</button> }
                 </div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100"><div class="text-gray-400 text-xs font-bold">營收</div><div class="text-3xl font-black">NT$ {{ accountingStats().revenue | number }}</div></div>
                 <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100"><div class="text-gray-400 text-xs font-bold">利潤</div><div class="text-3xl font-black text-green-600">NT$ {{ accountingStats().profit | number }}</div></div>
                 <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100"><div class="text-gray-400 text-xs font-bold">成本</div><div class="text-3xl font-black text-red-500">NT$ {{ accountingStats().cost | number }}</div></div>
              </div>
           </div>
        }

        @if (activeTab() === 'inventory') {
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div class="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 class="font-bold text-lg text-gray-800">庫存總覽</h3>
                <button (click)="exportInventoryCSV()" class="px-4 py-2 border rounded-xl font-bold">匯出</button>
             </div>
             <table class="w-full text-sm text-left">
                <thead class="bg-gray-50 font-bold text-gray-500"><tr><th class="p-4">貨號</th><th class="p-4">商品</th><th class="p-4 text-right">庫存</th></tr></thead>
                <tbody class="divide-y divide-gray-100">
                   @for (p of store.products(); track p.id) { <tr><td class="p-4 font-mono">{{ p.code }}</td><td class="p-4">{{ p.name }}</td><td class="p-4 text-right font-bold">{{ p.stock }}</td></tr> }
                </tbody>
             </table>
          </div>
        }

        @if (activeTab() === 'settings') { 
          <div class="py-6"> 
            <div class="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 space-y-8"> 
              <h3 class="text-2xl font-bold text-gray-800">商店設定</h3>
              <form [formGroup]="settingsForm" (ngSubmit)="saveSettings()" class="space-y-6"> 
                 <div><label class="font-bold">免運門檻</label><input type="number" formControlName="freeThreshold" class="border p-2 rounded ml-2"></div>
                 <button type="submit" class="px-6 py-2 bg-brand-900 text-white rounded-lg font-bold">儲存設定</button>
              </form> 
            </div> 
          </div> 
        }

        @if (showProductModal()) { <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" (click)="closeProductModal()"> <div class="bg-white rounded-2xl w-full max-w-2xl p-6" (click)="$event.stopPropagation()"> <h3 class="text-xl font-bold mb-4">編輯商品</h3> <form [formGroup]="productForm" class="space-y-4"> <input formControlName="name" class="w-full border p-2 rounded" placeholder="商品名稱"> <div class="flex justify-end gap-2"> <button (click)="closeProductModal()" class="px-4 py-2 border rounded">取消</button> <button (click)="submitProduct()" class="px-4 py-2 bg-brand-900 text-white rounded">儲存</button> </div> </form> </div> </div> }
        @if (showUserModal()) { <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" (click)="closeUserModal()"> <div class="bg-white rounded-2xl w-full max-w-md p-6" (click)="$event.stopPropagation()"> <h3 class="text-xl font-bold mb-4">編輯會員</h3> <form [formGroup]="userForm" class="space-y-4"> <input formControlName="name" class="w-full border p-2 rounded"> <div class="flex justify-end gap-2"> <button (click)="closeUserModal()" class="px-4 py-2 border rounded">取消</button> <button (click)="saveUser()" class="px-4 py-2 bg-brand-900 text-white rounded">儲存</button> </div> </form> </div> </div> }
        @if (actionModalOrder(); as o) { <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" (click)="closeActionModal()"> <div class="bg-white rounded-2xl w-full max-w-md p-6" (click)="$event.stopPropagation()"> <h3 class="text-xl font-bold mb-4">訂單操作 #{{ o.id }}</h3> <div class="grid grid-cols-2 gap-4"> <button (click)="doConfirm(o)" class="p-4 bg-green-50 text-green-700 rounded-xl font-bold">確認收款</button> <button (click)="doShip(o)" class="p-4 bg-blue-50 text-blue-700 rounded-xl font-bold">安排出貨</button> </div> <button (click)="closeActionModal()" class="mt-4 w-full py-2 border rounded">關閉</button> </div> </div> }

      </main>
    </div>
  `,
  styles: [`
    .nav-btn { @apply w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all mb-1 text-gray-500 hover:bg-gray-50 hover:text-gray-700; }
    .nav-btn.active { @apply bg-brand-900 text-white font-bold shadow-md; }
    /* 隱藏卷軸但保留功能 */
    aside::-webkit-scrollbar { display: none; }
    main::-webkit-scrollbar { display: none; }
  `]
})
export class AdminPanelComponent {
  store = inject(StoreService);
  fb: FormBuilder = inject(FormBuilder);
  now = new Date();

  activeTab = signal('dashboard');
  
  // Dashboard Logic
  dashboardMetrics = computed(() => {
     const orders = this.store.orders();
     const today = new Date().toDateString();
     const thisMonth = new Date().getMonth();
     
     const todayOrders = orders.filter((o: Order) => new Date(o.createdAt).toDateString() === today);
     const monthOrders = orders.filter((o: Order) => new Date(o.createdAt).getMonth() === thisMonth);

     let todayRev = 0;
     todayOrders.forEach((o: Order) => { if(o.status !== 'unpaid_alert' && o.status !== 'refunded' && o.status !== 'cancelled') todayRev += o.finalTotal; });
     
     let monthSales = 0;
     let monthCost = 0;
     monthOrders.forEach((o: Order) => {
        if(o.status !== 'unpaid_alert' && o.status !== 'refunded' && o.status !== 'cancelled') {
           monthSales += o.finalTotal;
           o.items.forEach((i: CartItem) => {
              const p = this.store.products().find((x: Product) => x.id === i.productId);
              if(p) {
                 const c = (p.localPrice * p.exchangeRate) + p.costMaterial + (p.weight * p.shippingCostPerKg);
                 monthCost += c * i.quantity;
              }
           });
        }
     });

     return {
        todayRevenue: todayRev,
        monthSales,
        monthProfit: monthSales - monthCost,
        toConfirm: orders.filter((o: Order) => o.status === 'paid_verifying').length,
        toShip: orders.filter((o: Order) => o.status === 'payment_confirmed').length,
        unpaid: orders.filter((o: Order) => o.status === 'pending_payment' || o.status === 'unpaid_alert').length,
        processing: orders.filter((o: Order) => o.status === 'refund_needed').length
     };
  });
  
  pendingCount = computed(() => this.dashboardMetrics().toConfirm);
  topProducts = computed(() => [...this.store.products()].sort((a,b) => b.soldCount - a.soldCount).slice(0, 5));

  // Orders Logic
  statsRange = signal('今日');
  orderSearch = signal('');
  orderPageSize = signal<number | 'all'>(50);
  orderPage = signal(1);
  orderStatusTab = signal('all');

  // Action Modal
  actionModalOrder = signal<Order | null>(null);
  cancelConfirmState = signal(false);

  orderTabs = [
    { id: 'all', label: '全部' },
    { id: 'pending', label: '待付款' },
    { id: 'verifying', label: '待對帳' },
    { id: 'shipping', label: '待出貨' },
    { id: 'completed', label: '已完成' },
    { id: 'refund', label: '退款/取消' }
  ];

  dashboardStats = computed(() => {
    const allOrders = this.store.orders();
    const range = this.statsRange();
    const now = new Date();
    
    // Filter by date range first
    const list = allOrders.filter((o: Order) => {
       const d = new Date(o.createdAt);
       if (range === '今日') return d.toDateString() === now.toDateString();
       if (range === '本週') {
          const start = new Date(now);
          start.setDate(now.getDate() - now.getDay());
          start.setHours(0,0,0,0);
          return d >= start;
       }
       if (range === '本月') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
       return true;
    });

    const pendingRevenue = list.reduce((sum: number, o: Order) => {
       if (o.status === 'cancelled') return sum;
       if (o.status === 'pending_payment' || o.status === 'unpaid_alert') return sum + o.finalTotal;
       if (o.paymentMethod === 'cod' && (o.status === 'payment_confirmed' || o.status === 'shipped')) return sum + o.finalTotal;
       return sum;
    }, 0);

    return {
       count: list.length,
       pendingRevenue, 
       toShip: list.filter((o: Order) => o.status === 'payment_confirmed').length,
       toConfirm: list.filter((o: Order) => o.status === 'paid_verifying').length
    };
  });

  filteredOrders = computed(() => {
     let list = [...this.store.orders()];
     const q = this.orderSearch().toLowerCase();
     const tab = this.orderStatusTab();

     if (tab === 'pending') list = list.filter((o: Order) => ['pending_payment', 'unpaid_alert'].includes(o.status));
     else if (tab === 'verifying') list = list.filter((o: Order) => o.status === 'paid_verifying');
     else if (tab === 'shipping') list = list.filter((o: Order) => o.status === 'payment_confirmed');
     else if (tab === 'completed') list = list.filter((o: Order) => ['shipped', 'completed'].includes(o.status));
     else if (tab === 'refund') list = list.filter((o: Order) => ['refund_needed', 'refunded', 'cancelled'].includes(o.status));

     if (q) {
        list = list.filter((o: Order) => o.id.includes(q) || o.items.some((i: CartItem) => i.productName.toLowerCase().includes(q)) || this.getUserName(o.userId).toLowerCase().includes(q));
     }
     
     return list.sort((a,b) => b.createdAt - a.createdAt);
  });

  paginatedOrders = computed(() => {
     const list = this.filteredOrders();
     const size = this.orderPageSize();
     if (size === 'all') return list;
     const start = (this.orderPage() - 1) * size;
     return list.slice(start, start + size);
  });

  // Customer Logic
  customerViewMode = signal<'list' | 'ranking'>('list');
  customerPageSize = signal<number | 'all'>(50);
  customerPage = signal(1);
  customerSearch = signal('');
  birthMonthFilter = signal('all');
  
  memberStart = signal('');
  memberEnd = signal('');

  rankPeriod = signal('all_time');
  rankMetric = signal('spend');

  // Customer Edit Modal
  showUserModal = signal(false);
  editingUser = signal<User | null>(null);
  userForm: FormGroup;

  filteredUsers = computed(() => {
     let list = [...this.store.users()];
     const q = this.customerSearch().toLowerCase();
     const bm = this.birthMonthFilter();
     
     const start = this.memberStart(); 
     const end = this.memberEnd();     

     if (q) list = list.filter((u: User) => 
        u.name.toLowerCase().includes(q) || 
        (u.phone && u.phone.includes(q)) ||
        u.id.toLowerCase().includes(q) ||
        (u.memberNo && u.memberNo.includes(q))
     );

     if (bm !== 'all') {
        list = list.filter((u: User) => {
           if (!u.birthday) return false;
           return new Date(u.birthday).getMonth() + 1 === parseInt(bm);
        });
     }

     if (start || end) {
       list = list.filter(u => {
          if (!u.memberNo) return false; 
          const noDatePart = u.memberNo.substring(0, 10); 
          const startDate = start ? start.replace(/-/g, '/') : null;
          const endDate = end ? end.replace(/-/g, '/') : null;

          if (startDate && noDatePart < startDate) return false;
          if (endDate && noDatePart > endDate) return false;
          return true;
       });
    }

     return list;
  });

  paginatedUsers = computed(() => {
     const list = this.filteredUsers();
     const size = this.customerPageSize();
     if (size === 'all') return list;
     const start = (this.customerPage() - 1) * size;
     return list.slice(start, start + size);
  });
  
  // Customer Ranking Logic
  customerRanking = computed(() => {
     return this.store.users().map((u: User) => {
        return { user: u, spend: u.totalSpend, count: Math.floor(u.totalSpend / 1000), lastOrder: Date.now() - Math.random()*1000000000 };
     }).sort((a,b) => {
        if(this.rankMetric() === 'spend') return b.spend - a.spend;
        if(this.rankMetric() === 'count') return b.count - a.count;
        return b.lastOrder - a.lastOrder; 
     });
  });

  topCustomers = computed(() => this.customerRanking().slice(0, 3));
  restCustomers = computed(() => this.customerRanking().slice(3, 50));

  // Accounting Logic
  accountingRange = signal('month');
  accountingCustomStart = signal('');
  accountingCustomEnd = signal('');
  
  accountingStats = computed(() => {
     const orders = this.store.orders();
     const range = this.accountingRange();
     const now = new Date();
     
     let startDate: Date | null = null;
     let endDate: Date | null = null;

     if (range === 'today') {
        startDate = new Date(now.setHours(0,0,0,0));
     } else if (range === 'week') {
        const day = now.getDay() || 7;
        startDate = new Date(now.setHours(0,0,0,0) - (day - 1) * 24 * 60 * 60 * 1000);
     } else if (range === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
     } else if (range === 'custom' && this.accountingCustomStart()) {
        startDate = new Date(this.accountingCustomStart());
        if (this.accountingCustomEnd()) endDate = new Date(this.accountingCustomEnd());
     }

     const filteredOrders = orders.filter((o: Order) => {
        const d = new Date(o.createdAt);
        if (startDate && d < startDate) return false;
        if (endDate) {
           const e = new Date(endDate);
           e.setHours(23,59,59,999);
           if (d > e) return false;
        }
        return true;
     });

     let revenue = 0;
     let cost = 0;
     let discounts = 0;
     
     let payReceived = 0;
     let payVerifying = 0;
     let payUnpaid = 0;
     let payRefund = 0;
     let payRefundedTotal = 0;

     filteredOrders.forEach((o: Order) => {
        if (o.status === 'refunded') {
           payRefundedTotal += o.finalTotal;
        } else if (o.status === 'refund_needed') {
           payRefund += o.finalTotal;
        } else if (o.status === 'paid_verifying') {
           payVerifying += o.finalTotal;
        } else if (o.status === 'pending_payment' || o.status === 'unpaid_alert') {
           payUnpaid += o.finalTotal;
        } else if (o.status === 'payment_confirmed' || o.status === 'shipped' || o.status === 'completed') {
           if (o.paymentMethod === 'cod' && o.status !== 'completed') {
              payUnpaid += o.finalTotal;
           } else {
              payReceived += o.finalTotal;
           }
        }
        
        if (o.status !== 'pending_payment' && o.status !== 'unpaid_alert' && o.status !== 'refunded' && o.status !== 'cancelled') {
           revenue += o.finalTotal;
           
           o.items.forEach((i: CartItem) => {
             const p = this.store.products().find((x: Product) => x.id === i.productId);
             if (p) {
               const c = (p.localPrice * p.exchangeRate) + p.costMaterial + (p.weight * p.shippingCostPerKg);
               cost += c * i.quantity;
             }
           });
           
           discounts += o.discount + o.usedCredits;
        }
     });
     
     const payTotal = payReceived + payVerifying + payUnpaid + payRefund;

     return {
        revenue,
        cost,
        profit: revenue - cost,
        margin: revenue ? ((revenue-cost)/revenue)*100 : 0,
        discounts,
        count: filteredOrders.length,
        maxOrder: filteredOrders.length > 0 ? Math.max(...filteredOrders.map(o=>o.finalTotal)) : 0,
        minOrder: filteredOrders.length > 0 ? Math.min(...filteredOrders.map(o=>o.finalTotal)) : 0,
        avgOrder: filteredOrders.length > 0 ? revenue / (filteredOrders.filter((o: Order) => o.status !== 'pending_payment').length || 1) : 0,
        payment: { 
           total: payTotal, 
           received: payReceived, 
           verifying: payVerifying, 
           unpaid: payUnpaid, 
           refund: payRefund,
           refundedTotal: payRefundedTotal
        }
     };
  });

  accountingInsights = computed(() => {
     return {
        topProducts: this.store.products().slice(0,3).map(p => ({ product: p, qty: p.soldCount })),
        topCustomers: this.store.users().slice(0,3).map(u => ({ name: u.name, spend: u.totalSpend, count: 5 }))
     };
  });

  productPerformance = computed(() => {
     return this.store.products().map((p: Product) => {
        const revenue = p.soldCount * p.priceGeneral;
        const cost = p.soldCount * (p.localPrice * p.exchangeRate + p.costMaterial);
        return { product: p, sold: p.soldCount, revenue, cost, profit: revenue - cost, margin: revenue ? ((revenue-cost)/revenue)*100 : 0 };
     }).sort((a,b) => b.profit - a.profit);
  });

  // Product Form
  showProductModal = signal(false);
  editingProduct = signal<Product | null>(null);
  productForm: FormGroup;
  tempImages = signal<string[]>([]);
  formValues = signal<any>({}); 
  
  // Category & SKU State
  categoryCodes = computed(() => this.store.settings().categoryCodes);
  currentCategoryCode = signal('');
  generatedSkuPreview = signal(''); 

  // Settings Form
  settingsForm: FormGroup;

  constructor() {
    this.productForm = this.fb.group({
       name: ['', Validators.required],
       category: [''],
       code: [''], 
       priceGeneral: [0],
       priceVip: [0],
       
       // Cost Fields
       localPrice: [0],
       exchangeRate: [0.22],
       weight: [0],
       shippingCostPerKg: [200],
       costMaterial: [0],

       stock: [0],
       optionsStr: [''], 
       note: ['']
    });
    
    this.productForm.valueChanges.subscribe(v => this.formValues.set(v));

    const s = this.store.settings();
    this.settingsForm = this.fb.group({
       enableCash: [s.paymentMethods.cash],
       enableBank: [s.paymentMethods.bankTransfer],
       enableCod: [s.paymentMethods.cod],
       birthdayGiftGeneral: [s.birthdayGiftGeneral],
       birthdayGiftVip: [s.birthdayGiftVip],
       shipping: this.fb.group({
          freeThreshold: [s.shipping.freeThreshold],
          methods: this.fb.group({
             meetup: this.fb.group({ enabled: [s.shipping.methods.meetup.enabled], fee: [s.shipping.methods.meetup.fee] }),
             myship: this.fb.group({ enabled: [s.shipping.methods.myship.enabled], fee: [s.shipping.methods.myship.fee] }),
             family: this.fb.group({ enabled: [s.shipping.methods.family.enabled], fee: [s.shipping.methods.family.fee] }),
             delivery: this.fb.group({ enabled: [s.shipping.methods.delivery.enabled], fee: [s.shipping.methods.delivery.fee] })
          })
       })
    });

    // User Form
    this.userForm = this.fb.group({
       name: ['', Validators.required],
       phone: ['', Validators.required],
       birthday: [''],
       tier: ['general'],
       credits: [0],
       note: ['']
    });
  }

  // --- Cost Calculations ---
  estimatedCost = computed(() => {
     const v = this.formValues();
     if (!v) return 0;
     const local = v.localPrice || 0;
     const rate = v.exchangeRate || 0;
     const weight = v.weight || 0;
     const ship = v.shippingCostPerKg || 0;
     const mat = v.costMaterial || 0;
     return (local * rate) + (weight * ship) + mat;
  });

  estimatedProfit = computed(() => {
     const price = this.formValues()?.priceGeneral || 0;
     return price - this.estimatedCost();
  });

  estimatedMargin = computed(() => {
     const price = this.formValues()?.priceGeneral || 0;
     if (!price) return 0;
     return (this.estimatedProfit() / price) * 100;
  });

  // Helper Methods
  navClass(tab: string) {
    const active = this.activeTab() === tab;
    return `nav-btn ${active ? 'active' : ''}`;
  }

  getTabTitle() {
     const map: any = { dashboard: '主控台 Dashboard', orders: '訂單管理 Orders', products: '商品管理 Products', customers: '客戶管理 Customers', accounting: '銷售報表 Accounting', inventory: '庫存盤點 Inventory', settings: '商店設定 Settings' };
     return map[this.activeTab()] || '';
  }

  goToOrders(filter: string) {
     this.activeTab.set('orders');
     this.orderStatusTab.set(filter);
  }
  
  toNumber(val: any) { return Number(val); }
  
  getEndIndex(page: number, size: any, total: number) {
     if(size === 'all') return total;
     return Math.min(page * Number(size), total);
  }

  getUserName(id: string) { return this.store.users().find((u: User) => u.id === id)?.name || id; }
  
  getThumb(o: Order) { return o.items[0]?.productImage; }

  timeAgo(ts: number) {
     const diff = Date.now() - ts;
     const mins = Math.floor(diff / 60000);
     if(mins < 60) return `${mins} 分鐘前`;
     const hours = Math.floor(mins / 60);
     if(hours < 24) return `${hours} 小時前`;
     return `${Math.floor(hours/24)} 天前`;
  }
  
  // Status Helpers
  getPaymentStatusLabel(s: string, method?: string) {
     const map: any = { 
        pending_payment: '未付款', 
        paid_verifying: '對帳中', 
        unpaid_alert: '逾期未付', 
        refund_needed: '需退款', 
        refunded: '已退款',
        payment_confirmed: method === 'cod' ? '待出貨 (未入帳)' : '已付款',
        shipped: method === 'cod' ? '已出貨 (未入帳)' : '已出貨',
        completed: '已完成 (已入帳)',
        cancelled: '🚫 已取消' 
     };
     return map[s] || s;
  }

  getPaymentStatusClass(s: string) {
     if(s==='payment_confirmed') return 'bg-green-100 text-green-700';
     if(s==='paid_verifying') return 'bg-yellow-100 text-yellow-700';
     if(s==='pending_payment' || s==='unpaid_alert') return 'bg-red-50 text-red-500';
     if(s==='refunded') return 'bg-gray-200 text-gray-500 line-through';
     if(s==='cancelled') return 'bg-gray-200 text-gray-400 border border-gray-300';
     if(s==='refund_needed') return 'bg-red-100 text-red-700 font-bold border border-red-200';
     if(s==='completed') return 'bg-green-600 text-white font-bold'; 
     return 'bg-gray-100 text-gray-500';
  }
  getShippingStatusLabel(s: string) {
     const map: any = { payment_confirmed: '待出貨', shipped: '已出貨', completed: '已完成' };
     return map[s] || '-';
  }
  getShippingStatusClass(s: string) {
     if(s==='shipped') return 'bg-blue-100 text-blue-700';
     if(s==='completed') return 'bg-gray-800 text-white';
     return 'text-gray-400';
  }

  // --- Action Modal Methods ---
  openAction(e: Event, order: Order) {
     e.stopPropagation();
     this.actionModalOrder.set(order);
     this.cancelConfirmState.set(false);
  }
  closeActionModal() { this.actionModalOrder.set(null); }

  doConfirm(o: Order) { this.store.updateOrderStatus(o.id, 'payment_confirmed'); this.closeActionModal(); }
  doAlert(o: Order) { this.store.updateOrderStatus(o.id, 'unpaid_alert'); this.closeActionModal(); }
  
  doRefundNeeded(o: Order) { 
     this.store.updateOrderStatus(o.id, 'refund_needed'); 
     this.orderStatusTab.set('refund'); 
     this.closeActionModal(); 
  }
  
  doRefundDone(o: Order) { 
     this.store.updateOrderStatus(o.id, 'refunded'); 
     this.closeActionModal(); 
  }
  
  doShip(o: Order) { 
     const code = prompt('請輸入物流單號');
     if (code !== null) {
        this.store.updateOrderStatus(o.id, 'shipped', { shippingLink: code }); 
        this.closeActionModal(); 
     }
  }
  
  doCancel(o: Order) {
     if(this.cancelConfirmState()) {
        this.store.updateOrderStatus(o.id, 'cancelled');
        this.closeActionModal();
     } else {
        this.cancelConfirmState.set(true);
     }
  }

  quickConfirm(e: Event, o: Order) { e.stopPropagation(); this.store.updateOrderStatus(o.id, 'payment_confirmed'); }
  quickShip(e: Event, o: Order) { e.stopPropagation(); this.store.updateOrderStatus(o.id, 'shipped'); }
  quickRefundDone(e: Event, o: Order) { e.stopPropagation(); this.store.updateOrderStatus(o.id, 'refunded'); }
  quickComplete(e: Event, o: Order) { e.stopPropagation(); this.store.updateOrderStatus(o.id, 'completed'); }

  // --- Export Functionality (CSV) ---
  private downloadCSV(filename: string, headers: string[], rows: any[]) {
    // BOM for Excel to read UTF-8 correctly
    const BOM = '\uFEFF';
    
    // Convert logic
    const csvContent = [
       headers.join(','),
       ...rows.map(row => row.map((cell: any) => {
          // Escape quotes and wrap in quotes
          const str = String(cell === null || cell === undefined ? '' : cell);
          return `"${str.replace(/"/g, '""')}"`;
       }).join(','))
    ].join('\r\n'); // Use CRLF for Windows compatibility

    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  copyOrdersToClipboard() {
     const list = this.filteredOrders().map((o: Order) => `${o.id}\t${this.getUserName(o.userId)}\tNT$${o.finalTotal}`).join('\n');
     navigator.clipboard.writeText(list).then(() => alert('訂單摘要已複製！'));
  }
  
  exportOrdersCSV() {
     const headers = ['訂單編號', '下單日期', '客戶姓名', '付款方式', '物流方式', '總金額', '訂單狀態', '物流單號', '商品內容'];
     const rows = this.filteredOrders().map((o: Order) => {
        const date = new Date(o.createdAt).toLocaleDateString();
        const items = o.items.map((i: CartItem) => `${i.productName}(${i.option})x${i.quantity}`).join('; ');
        return [
           o.id,
           date,
           this.getUserName(o.userId),
           this.getPaymentStatusLabel('temp', o.paymentMethod), // Hack to get clean name
           o.shippingMethod,
           o.finalTotal,
           this.getPaymentStatusLabel(o.status, o.paymentMethod),
           o.shippingLink || '',
           items
        ];
     });
     this.downloadCSV(`訂單報表_${new Date().toISOString().slice(0,10)}`, headers, rows);
  }

  exportProductsCSV() {
     const headers = ['SKU貨號', '商品名稱', '分類', '規格', '庫存', '已售', '一般售價', 'VIP價', '本地成本', '匯率', '預估毛利'];
     const rows = this.store.products().map((p: Product) => {
        const cost = (p.localPrice * p.exchangeRate) + p.costMaterial + (p.weight * p.shippingCostPerKg);
        const profit = p.priceGeneral - cost;
        return [
           p.code,
           p.name,
           p.category,
           p.options.join('|'),
           p.stock,
           p.soldCount,
           p.priceGeneral,
           p.priceVip,
           p.localPrice,
           p.exchangeRate,
           profit.toFixed(0)
        ];
     });
     this.downloadCSV(`商品總表_${new Date().toISOString().slice(0,10)}`, headers, rows);
  }

  exportCustomersCSV() {
     const headers = ['會員編碼', '會員ID', '姓名', '電話', '等級', '累積消費', '購物金餘額', '生日'];
     const rows = this.filteredUsers().map((u: User) => [
        u.id, // ID is Member Code
        u.name,
        u.phone,
        u.tier,
        u.totalSpend,
        u.credits,
        u.birthday || ''
     ]);
     this.downloadCSV(`會員名單_${new Date().toISOString().slice(0,10)}`, headers, rows);
  }

  exportInventoryCSV() {
     const headers = ['SKU貨號', '商品名稱', '分類', '庫存數量', '狀態'];
     const rows = this.store.products().map((p: Product) => {
        let status = '充足';
        if (p.stock <= 0) status = '缺貨';
        else if (p.stock < 5) status = '低庫存';
        
        return [
           p.code,
           p.name,
           p.category,
           p.stock,
           status
        ];
     });
     this.downloadCSV(`庫存盤點表_${new Date().toISOString().slice(0,10)}`, headers, rows);
  }
  
  // Accounting
  copyAccountingToClipboard() {
     const s = this.accountingStats();
     const text = `營收: ${s.revenue}\n利潤: ${s.profit}\n成本: ${s.cost}\n毛利率: ${s.margin.toFixed(1)}%`;
     navigator.clipboard.writeText(text).then(() => alert('報表摘要已複製！'));
  }

  exportToCSV() {
     const range = this.accountingRange();
     const now = new Date();
     let startDate: Date | null = null;
     if (range === 'today') startDate = new Date(now.setHours(0,0,0,0));
     else if (range === 'week') startDate = new Date(now.setDate(now.getDate() - now.getDay()));
     else if (range === 'month') startDate = new Date(now.getFullYear(), now.getMonth(), 1);
     
     let list = this.store.orders();
     if (startDate) list = list.filter((o: Order) => o.createdAt >= startDate!.getTime());
     
     list = list.filter((o: Order) => !['pending_payment', 'unpaid_alert', 'refunded', 'cancelled'].includes(o.status));

     const headers = ['訂單編號', '日期', '商品內容', '總營收', '商品成本', '預估利潤', '毛利率%'];
     const rows = list.map((o: Order) => {
        let cost = 0;
        o.items.forEach((i: CartItem) => {
           const p = this.store.products().find((x: Product) => x.id === i.productId);
           if (p) cost += ((p.localPrice * p.exchangeRate) + p.costMaterial + (p.weight * p.shippingCostPerKg)) * i.quantity;
        });
        const profit = o.finalTotal - cost;
        const margin = o.finalTotal ? (profit / o.finalTotal * 100) : 0;
        
        return [
           o.id,
           new Date(o.createdAt).toLocaleDateString(),
           o.items.map((i: CartItem) => i.productName).join(';'),
           o.finalTotal,
           cost.toFixed(0),
           profit.toFixed(0),
           margin.toFixed(1)
        ];
     });
     
     this.downloadCSV(`銷售報表_明細_${range}_${new Date().toISOString().slice(0,10)}`, headers, rows);
  }

  // Products
  openProductForm() { 
    this.editingProduct.set(null); 
    this.productForm.reset(); 
    this.productForm.patchValue({
       exchangeRate: 0.22,
       shippingCostPerKg: 200,
       weight: 0,
       costMaterial: 0
    });
    this.tempImages.set([]);
    this.currentCategoryCode.set('');
    this.generatedSkuPreview.set('');
    this.formValues.set(this.productForm.getRawValue()); // Initial sync
    this.showProductModal.set(true); 
  }
  
  editProduct(p: Product) {
     this.editingProduct.set(p);
     this.productForm.patchValue({
        ...p,
        optionsStr: p.options.join(', '),
        exchangeRate: p.exchangeRate || 0.22,
        shippingCostPerKg: p.shippingCostPerKg || 200,
        weight: p.weight || 0,
        costMaterial: p.costMaterial || 0
     });
     const imgs = p.images && p.images.length > 0 ? p.images : (p.image ? [p.image] : []);
     this.tempImages.set(imgs);
     
     this.generatedSkuPreview.set(p.code);
     this.formValues.set(this.productForm.getRawValue()); 
     
     this.showProductModal.set(true);
  }
  
  closeProductModal() { this.showProductModal.set(false); }
  
  // SKU Generator Logic in Modal
  onCategoryChange() {
     const cat = this.productForm.get('category')?.value;
     if (cat && !this.editingProduct()) {
        const codeMap = this.categoryCodes();
        const foundCode = codeMap[cat] || '';
        this.currentCategoryCode.set(foundCode);
        this.updateSkuPreview(foundCode);
     }
  }

  onCodeInput(e: any) {
     const val = e.target.value.toUpperCase();
     this.currentCategoryCode.set(val);
     if (!this.editingProduct()) {
        this.updateSkuPreview(val);
     }
  }

  updateSkuPreview(prefix: string) {
     if (prefix) {
        const sku = this.store.generateProductCode(prefix);
        this.generatedSkuPreview.set(sku);
        this.productForm.patchValue({ code: sku });
     }
  }
  
  // Image Handlers
  handleImageError(event: any) {
    event.target.src = 'https://placehold.co/100x100?text=Broken+Link';
  }

  addImageUrl(url: string) {
     if(!url || !url.trim()) return;
     const u = url.trim();
     const isFlickrPage = u.includes('flickr.com/photos/') && !u.match(/\.(jpg|jpeg|png|gif)$/i) && !u.includes('live.staticflickr.com');
     if (isFlickrPage) {
       alert('⚠️ 注意：您貼上的是 Flickr「網頁」網址，不是「圖片」連結！\n\n請在圖片上按右鍵 -> 選擇「複製圖片位址」(Copy Image Address)。');
       return;
     }
     this.tempImages.update(l => [...l, u]);
  }

  handleFileSelect(event: any) {
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.tempImages.update(l => [...l, e.target.result]);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  removeImage(index: number) {
    this.tempImages.update(l => l.filter((_, i) => i !== index));
  }

  submitProduct() {
     const val = this.productForm.value;
     
     if (val.category) {
        const catName = val.category.trim();
        this.store.addCategory(catName);
        
        if (this.currentCategoryCode()) {
           const newSettings = { ...this.store.settings() };
           if (!newSettings.categoryCodes) newSettings.categoryCodes = {};
           newSettings.categoryCodes[catName] = this.currentCategoryCode();
           this.store.updateSettings(newSettings);
        }
     }
     
     const finalImages = this.tempImages();
     const mainImage = finalImages.length > 0 ? finalImages[0] : 'https://picsum.photos/300/300';

     const finalCode = this.editingProduct() ? val.code : (this.generatedSkuPreview() || val.code || this.store.generateNextProductCode());

     const p: Product = {
        id: this.editingProduct()?.id || Date.now().toString(), 
        code: finalCode,
        name: val.name,
        category: val.category,
        image: mainImage, 
        images: finalImages, 
        priceGeneral: val.priceGeneral,
        priceVip: val.priceVip,
        priceWholesale: 0,
        localPrice: val.localPrice,
        stock: val.stock,
        options: val.optionsStr ? val.optionsStr.split(',').map((s: string) => s.trim()) : [],
        note: val.note,
        
        exchangeRate: val.exchangeRate,
        costMaterial: val.costMaterial,
        weight: val.weight,
        shippingCostPerKg: val.shippingCostPerKg,
        
        priceType: 'normal',
        soldCount: this.editingProduct()?.soldCount || 0,
        country: 'Korea',
        allowPayment: { cash: true, bankTransfer: true, cod: true },
        allowShipping: { meetup: true, myship: true, family: true, delivery: true }
     };
     
     if (this.editingProduct()) {
        this.store.updateProduct(p);
     } else {
        this.store.addProduct(p);
     }
     this.closeProductModal();
  }
  handleBatchImport(e: any) {}

  // Customers
  getPeriodLabel(p: string) { const map: any = { all_time: '全期', this_month: '本月', last_month: '上月', this_quarter: '本季' }; return map[p] || p; }
  getMetricLabel(m: string) { const map: any = { spend: '消費金額', count: '訂單數', recency: '最近購買' }; return map[m] || m; }
  
  editUser(u: User) { 
     this.openUserModal(u);
  }
  
  isBirthdayMonth(d: string) { return new Date(d).getMonth() === new Date().getMonth(); }

  // Customer Edit Methods
  openUserModal(u: User) {
     this.editingUser.set(u);
     this.userForm.patchValue(u);
     this.showUserModal.set(true);
  }
  
  closeUserModal() { 
     this.showUserModal.set(false); 
     this.editingUser.set(null);
  }
  
  saveUser() {
     if (this.userForm.valid && this.editingUser()) {
        const updatedUser = {
           ...this.editingUser()!,
           ...this.userForm.value
        };
        this.store.updateUser(updatedUser);
        this.closeUserModal();
        alert('會員資料已更新');
     } else {
        alert('請檢查必填欄位');
     }
  }

  // Settings
  updateCategoryCode(cat: string, code: string) {
     const newCodes = { ...this.categoryCodes() };
     newCodes[cat] = code.toUpperCase();
     const s = { ...this.store.settings() }; 
     s.categoryCodes = newCodes;
     this.store.updateSettings(s);
  }

  saveSettings() {
     const val = this.settingsForm.value;
     const currentSettings = this.store.settings(); 
     
     const settings: StoreSettings = {
        birthdayGiftGeneral: val.birthdayGiftGeneral,
        birthdayGiftVip: val.birthdayGiftVip,
        categoryCodes: currentSettings.categoryCodes, 
        paymentMethods: {
           cash: val.enableCash,
           bankTransfer: val.enableBank,
           cod: val.enableCod
        },
        shipping: {
           freeThreshold: val.shipping.freeThreshold,
           methods: {
              meetup: val.shipping.methods.meetup,
              myship: val.shipping.methods.myship,
              family: val.shipping.methods.family,
              delivery: val.shipping.methods.delivery
           }
        }
     };
     this.store.updateSettings(settings);
     alert('設定已儲存');
  }
}