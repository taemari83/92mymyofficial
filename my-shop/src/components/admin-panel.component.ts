import { Component, inject, signal, computed, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StoreService, Product, Order, User, StoreSettings, CartItem } from '../services/store.service';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="flex h-screen w-full bg-[#FDFBF9] font-sans overflow-hidden">
      
      <aside class="w-20 md:w-64 h-full bg-white border-r border-gray-100 flex flex-col shrink-0 z-20 shadow-lg md:shadow-none overflow-y-auto">
        <div class="p-4 md:p-6 flex items-center gap-3 justify-center md:justify-start">
          <div class="w-8 h-8 bg-brand-400 rounded-lg flex items-center justify-center text-white font-bold shrink-0">92</div>
        </div>

        <div class="flex-1 overflow-y-auto py-4 px-2 md:px-3 space-y-1">
          <div class="px-2 md:px-3 text-[10px] md:text-xs font-bold text-gray-400 mb-2 mt-2 text-center md:text-left">主要功能</div>
          <button (click)="activeTab.set('dashboard')" [class]="navClass('dashboard')"><span class="text-xl md:text-lg">🏠</span> <span class="hidden md:inline">主控台</span></button>
          <button (click)="activeTab.set('orders')" [class]="navClass('orders')"><span class="text-xl md:text-lg">🛍️</span> <span class="hidden md:inline">訂單管理</span></button>
          <button (click)="activeTab.set('products')" [class]="navClass('products')"><span class="text-xl md:text-lg">📦</span> <span class="hidden md:inline">商品管理</span></button>
          <button (click)="activeTab.set('customers')" [class]="navClass('customers')"><span class="text-xl md:text-lg">👥</span> <span class="hidden md:inline">客戶管理</span></button>
          <div class="px-2 md:px-3 text-[10px] md:text-xs font-bold text-gray-400 mb-2 mt-6 text-center md:text-left">數據分析</div>
          <button (click)="activeTab.set('accounting')" [class]="navClass('accounting')"><span class="text-xl md:text-lg">📊</span> <span class="hidden md:inline">銷售報表</span></button>
          <button (click)="activeTab.set('inventory')" [class]="navClass('inventory')"><span class="text-xl md:text-lg">🏭</span> <span class="hidden md:inline">庫存管理</span></button>
          <div class="px-2 md:px-3 text-[10px] md:text-xs font-bold text-gray-400 mb-2 mt-6 text-center md:text-left">設定</div>
           <button (click)="activeTab.set('settings')" [class]="navClass('settings')"><span class="text-xl md:text-lg">⚙️</span> <span class="hidden md:inline">商店設定</span></button>
        </div>
        
        <div class="p-2 md:p-4 border-t border-gray-100">
           <div class="flex items-center gap-3 p-2 md:p-3 rounded-xl bg-brand-50/50 justify-center md:justify-start">
              <div class="w-8 h-8 rounded-full bg-brand-900 text-white flex items-center justify-center text-xs shrink-0">M</div>
              <div class="text-sm hidden md:block"><div class="font-bold text-brand-900">Admin</div><div class="text-xs text-gray-400">Owner</div></div>
           </div>
        </div>
      </aside>

      <main class="flex-1 h-full overflow-y-auto bg-[#FDFBF9] p-4 md:p-8 w-full relative">
        <div class="flex justify-between items-center mb-6">
           <h2 class="text-2xl font-bold text-gray-800 whitespace-nowrap">{{ getTabTitle() }}</h2>
           <div class="flex gap-2"><button class="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-brand-900 shadow-sm">↻</button></div>
        </div>

        @if (activeTab() === 'dashboard') {
          }

        @if (activeTab() === 'orders') {
          }

        @if (activeTab() === 'products') { 
          <div class="space-y-6 w-full"> 
            <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4 w-full"> 
              <div><h3 class="text-2xl font-bold text-brand-900 whitespace-nowrap">上架連線商品</h3><p class="text-sm text-gray-400 mt-1">管理商品、庫存與定價</p></div> 
              <div class="flex gap-3 w-full md:w-auto">
                <button (click)="exportProductsCSV()" class="px-4 py-3 bg-white border border-gray-200 text-gray-600 rounded-full font-bold hover:bg-gray-50 shadow-sm flex items-center gap-2 whitespace-nowrap"><span>📥</span> 匯出商品表</button>
                <label class="flex-1 md:flex-none justify-center flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 text-brand-900 rounded-full font-bold shadow-sm hover:bg-brand-50 cursor-pointer transition-colors hover:shadow-md whitespace-nowrap"> 
                  <span class="text-lg">📂</span> <span class="text-sm">批量新增</span> 
                  <input type="file" (change)="handleBatchImport($event)" class="hidden" accept=".csv"> 
                </label> 
                <button (click)="openProductForm()" class="w-12 h-12 bg-brand-900 text-white rounded-full flex items-center justify-center text-2xl shadow-lg hover:scale-105 transition-transform shrink-0"> + </button> 
              </div> 
            </div> 
            <div class="grid grid-cols-1 gap-4 w-full"> 
              @for (p of store.products(); track p.id) { 
                <div class="bg-white rounded-[1.5rem] p-4 flex items-center gap-5 hover:shadow-md transition-all border border-transparent hover:border-brand-100 group w-full"> 
                   <div class="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 relative"> 
                      <img [src]="p.image" (error)="handleImageError($event)" class="w-full h-full object-cover"> 
                      <div class="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center font-mono py-0.5"> {{ p.code }} </div> 
                   </div> 
                   <div class="flex-1 min-w-0"> 
                      <div class="flex justify-between items-start"> 
                         <div> 
                            <div class="flex items-center gap-2 mb-1 flex-wrap"> 
                               <span class="text-xs text-brand-400 font-bold tracking-wider uppercase whitespace-nowrap">{{ p.category }}</span> 
                               
                               @if(p.isPreorder) { 
                                 <span class="bg-blue-100 text-blue-600 text-[10px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap">預購</span> 
                               }
                               
                               @if(!p.isListed) { 
                                 <span class="bg-gray-200 text-gray-500 text-[10px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap">未上架</span> 
                               } else {
                                 }

                               @if(p.priceType === 'event') { <span class="bg-red-50 text-red-500 text-[10px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap">活動價</span> } 
                               @if(p.priceType === 'clearance') { <span class="bg-gray-100 text-gray-500 text-[10px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap">清倉價</span> } 
                            </div> 
                            <h4 class="text-lg font-bold text-brand-900 truncate">{{ p.name }}</h4> 
                         </div> 
                         <div class="text-right shrink-0 ml-2"> 
                            <div class="font-bold text-lg text-brand-900 whitespace-nowrap">NT$ {{ p.priceGeneral }}</div> 
                            <div class="text-[10px] text-gray-400 whitespace-nowrap">
                               庫存 {{ p.stock >= 9999 ? '無限' : p.stock }}
                            </div> 
                         </div> 
                      </div> 
                      <div class="flex justify-between items-end mt-2"> 
                         <div class="text-xs text-gray-400 truncate"> {{ p.options.join(', ') }} </div> 
                         <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"> 
                            <button (click)="editProduct(p)" class="px-3 py-1 rounded-full bg-gray-100 text-xs font-bold text-gray-600 hover:bg-gray-200 whitespace-nowrap">Edit</button> 
                            <button (click)="store.deleteProduct(p.id)" class="px-3 py-1 rounded-full bg-red-50 text-xs font-bold text-red-400 hover:bg-red-100 whitespace-nowrap">Del</button> 
                         </div> 
                      </div> 
                   </div> 
                </div> 
              } 
            </div> 
          </div> 
        }
        
        @if (activeTab() === 'customers') { 
          }

        @if (activeTab() === 'accounting') {
           }

        @if (activeTab() === 'inventory') {
          }

        @if (activeTab() === 'settings') { 
          }

        @if (showProductModal()) { 
          <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" (click)="closeProductModal()"> 
            <div class="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" (click)="$event.stopPropagation()"> 
              <div class="p-6 border-b border-gray-100 flex justify-between items-center"> 
                <h3 class="text-xl font-bold text-brand-900">{{ editingProduct() ? '編輯商品' : '新增商品' }}</h3> 
                <button (click)="closeProductModal()" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200">✕</button> 
              </div> 
              <div class="p-6 overflow-y-auto flex-1"> 
                <form [formGroup]="productForm" class="space-y-4"> 
                  <div class="grid grid-cols-2 gap-4"> 
                    <div> <label class="block text-xs font-bold text-gray-500 mb-1">商品名稱</label> <input formControlName="name" class="w-full p-2 border rounded-lg"> </div> 
                    <div> 
                      <label class="block text-xs font-bold text-gray-500 mb-1">分類</label> 
                      <div class="flex gap-2"> 
                        <div class="relative flex-1"> <input formControlName="category" (change)="onCategoryChange()" class="w-full p-2 border rounded-lg" list="catList" placeholder="選擇或輸入分類..."> <datalist id="catList"> @for(c of store.categories(); track c) { <option [value]="c"> } </datalist> </div> 
                        <div class="w-20"> <input [value]="currentCategoryCode()" (input)="onCodeInput($event)" class="w-full p-2 border rounded-lg text-center font-mono font-bold uppercase bg-gray-50" placeholder="代碼" maxlength="1" title="分類代碼 (例如 A)"> </div> 
                      </div> 
                    </div> 
                  </div> 
                  
                  <div class="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4"> 
                     <h4 class="font-bold text-gray-700 text-sm border-b border-gray-200 pb-2">💰 成本結構與獲利分析</h4> 
                     <div class="grid grid-cols-2 md:grid-cols-4 gap-4"> 
                        <div> <label class="block text-xs font-bold text-gray-500 mb-1">當地幣原價 (Local)</label> <input type="number" formControlName="localPrice" class="w-full p-2 border rounded-lg bg-white"> </div> 
                        <div> <label class="block text-xs font-bold text-gray-500 mb-1">匯率 (Rate)</label> <input type="number" formControlName="exchangeRate" step="0.001" class="w-full p-2 border rounded-lg bg-white"> </div> 
                        <div> <label class="block text-xs font-bold text-gray-500 mb-1">重量 kg</label> <input type="number" formControlName="weight" step="0.1" class="w-full p-2 border rounded-lg bg-white"> </div> 
                        <div> <label class="block text-xs font-bold text-gray-500 mb-1">國際運費/kg</label> <input type="number" formControlName="shippingCostPerKg" class="w-full p-2 border rounded-lg bg-white"> </div> 
                     </div> 
                     <div class="grid grid-cols-2 gap-4"> 
                        <div> <label class="block text-xs font-bold text-gray-500 mb-1">額外成本 (包材/加工)</label> <input type="number" formControlName="costMaterial" class="w-full p-2 border rounded-lg bg-white"> </div> 
                        <div class="flex flex-col justify-end"> <div class="text-xs text-gray-500 mb-1">預估總成本 (NT$)</div> <div class="text-xl font-bold text-gray-800 bg-white px-3 py-1.5 rounded border border-gray-200"> {{ estimatedCost() | number:'1.0-0' }} </div> </div> 
                     </div> 
                     <div class="flex items-center justify-between pt-2 border-t border-gray-200/50"> 
                        <div class="text-xs text-gray-500"> 定價: <span class="font-bold text-gray-800">\${{ formValues().priceGeneral }}</span> </div> 
                        <div class="text-right"> 
                           <div class="text-xs text-gray-400">預估毛利 / 毛利率</div> 
                           <div class="font-bold" [class.text-green-600]="estimatedProfit() > 0" [class.text-red-500]="estimatedProfit() <= 0"> \${{ estimatedProfit() | number:'1.0-0' }} <span class="text-xs ml-1 bg-gray-100 px-1 rounded text-gray-600"> {{ estimatedMargin() | number:'1.1-1' }}% </span> </div> 
                        </div> 
                     </div> 
                  </div> 

                  <div class="grid grid-cols-2 gap-4"> 
                    <div> <label class="block text-xs font-bold text-gray-500 mb-1">售價 (NT$)</label> <input type="number" formControlName="priceGeneral" class="w-full p-2 border rounded-lg"> </div> 
                    <div> <label class="block text-xs font-bold text-gray-500 mb-1">VIP價 (NT$)</label> <input type="number" formControlName="priceVip" class="w-full p-2 border rounded-lg"> </div> 
                  </div> 
                  
                  <div class="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                     <label class="flex items-center gap-3 cursor-pointer select-none">
                        <input type="checkbox" formControlName="isPreorder" class="w-5 h-5 rounded text-blue-600">
                        <span class="font-bold text-gray-700">這是一個「預購」商品</span>
                     </label>
                     <label class="flex items-center gap-3 cursor-pointer select-none">
                        <input type="checkbox" formControlName="isListed" class="w-5 h-5 rounded text-green-600">
                        <span class="font-bold text-gray-700">確認上架 (前台可見)</span>
                     </label>
                  </div>

                  <div class="grid grid-cols-2 gap-4"> 
                    <div> 
                      <label class="block text-xs font-bold text-gray-500 mb-1">庫存</label> 
                      @if(formValues().isPreorder) {
                         <input type="text" value="無限 (99999)" disabled class="w-full p-2 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed">
                      } @else {
                         <input type="number" formControlName="stock" class="w-full p-2 border rounded-lg"> 
                      }
                    </div> 
                    <div> <label class="block text-xs font-bold text-gray-500 mb-1">規格 (用逗號分隔)</label> <input formControlName="optionsStr" class="w-full p-2 border rounded-lg" placeholder="例如: 紅色, 藍色, 綠色"> </div> 
                  </div> 
                  
                  <div> <label class="block text-xs font-bold text-gray-500 mb-1">商品貨號 (SKU) <span class="text-xs font-normal text-gray-400 ml-1">自動生成: {{ generatedSkuPreview() }}</span></label> <input formControlName="code" class="w-full p-2 border rounded-lg font-mono bg-gray-50 text-gray-500"> </div> 
                  <div> <label class="block text-xs font-bold text-gray-500 mb-2">商品圖片 (第一張為主圖)</label> <div class="flex flex-wrap gap-2 mb-3"> @for(img of tempImages(); track $index) { <div class="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group bg-gray-50"> <img [src]="img" (error)="handleImageError($event)" class="w-full h-full object-cover"> <button (click)="removeImage($index)" class="absolute top-0 right-0 bg-black/50 hover:bg-red-500 text-white w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button> @if($index === 0) { <div class="absolute bottom-0 inset-x-0 bg-brand-900/80 text-white text-[9px] text-center font-bold">主圖</div> } </div> } </div> <div class="flex flex-col gap-2 p-4 bg-gray-50 rounded-xl border border-gray-200"> <div class="flex gap-2"> <input #urlInput type="text" placeholder="請貼上「圖片連結」 (以 .jpg .png 結尾)" class="flex-1 p-2 text-sm border rounded-lg"> <button (click)="addImageUrl(urlInput.value); urlInput.value=''" class="px-3 py-2 bg-gray-200 rounded-lg text-xs font-bold hover:bg-gray-300 whitespace-nowrap">加入網址</button> </div> <div class="flex items-center gap-2 flex-wrap mt-2"> <span class="text-xs font-bold text-gray-400">或</span> <label class="cursor-pointer px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold hover:bg-gray-50 flex items-center gap-1 whitespace-nowrap"> <span>📂 選擇電腦檔案</span> <input type="file" multiple accept="image/*" class="hidden" (change)="handleFileSelect($event)"> </label> <span class="text-xs font-bold text-gray-400">或</span> <a href="https://www.flickr.com/photos/upload" target="_blank" class="px-3 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-xs font-bold hover:bg-blue-100 flex items-center gap-1 whitespace-nowrap" title="前往 Flickr 上傳"> <span>☁️ Flickr 上傳</span> </a> </div> </div> </div> 
                  <div> <label class="block text-xs font-bold text-gray-500 mb-1">備註</label> <textarea formControlName="note" class="w-full p-2 border rounded-lg" rows="3"></textarea> </div> 
                </form> 
              </div> 
              <div class="p-6 border-t border-gray-100 flex justify-end gap-3"> 
                <button (click)="closeProductModal()" class="px-6 py-2 rounded-xl border border-gray-200 font-bold text-gray-500">取消</button> 
                <button (click)="submitProduct()" class="px-6 py-2 rounded-xl bg-brand-900 text-white font-bold hover:bg-black">確認儲存</button> 
              </div> 
            </div> 
          </div> 
        }
        
        @if (showUserModal()) { 
          }
        
        @if (actionModalOrder(); as o) { 
          }
      </main>
    </div>
  `,
  styles: [`
    .nav-btn { @apply w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all mb-1 text-gray-500 hover:bg-gray-50 hover:text-gray-700; }
    .nav-btn.active { @apply bg-brand-900 text-white font-bold shadow-md; }
    aside::-webkit-scrollbar { display: none; }
    main::-webkit-scrollbar { display: none; }
  `]
})
export class AdminPanelComponent {
  store = inject(StoreService);
  fb: FormBuilder = inject(FormBuilder);
  now = new Date();

  activeTab = signal('dashboard');
  
  // Dashboard Logic (Keep original)
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
  topProducts = computed(() => [...this.store.products()].sort((a: any, b: any) => b.soldCount - a.soldCount).slice(0, 5));

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
     return list.sort((a: any, b: any) => b.createdAt - a.createdAt);
  });

  paginatedOrders = computed(() => {
     const list = this.filteredOrders();
     const size = this.orderPageSize();
     if (size === 'all') return list;
     const start = (this.orderPage() - 1) * size;
     return list.slice(start, start + size);
  });

  // Customer Logic (Keep original)
  customerViewMode = signal<'list' | 'ranking'>('list');
  customerPageSize = signal<number | 'all'>(50);
  customerPage = signal(1);
  customerSearch = signal('');
  birthMonthFilter = signal('all');
  memberStart = signal('');
  memberEnd = signal('');
  rankPeriod = signal('all_time');
  rankMetric = signal('spend');
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
  
  customerRanking = computed(() => {
     return this.store.users().map((u: User) => {
        return { user: u, spend: u.totalSpend, count: Math.floor(u.totalSpend / 1000), lastOrder: Date.now() - Math.random()*1000000000 };
     }).sort((a: any, b: any) => {
        if(this.rankMetric() === 'spend') return b.spend - a.spend;
        if(this.rankMetric() === 'count') return b.count - a.count;
        return b.lastOrder - a.lastOrder; 
     });
  });

  topCustomers = computed(() => this.customerRanking().slice(0, 3));
  restCustomers = computed(() => this.customerRanking().slice(3, 50));

  // Accounting Logic (Keep original)
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
        payment: { total: payTotal, received: payReceived, verifying: payVerifying, unpaid: payUnpaid, refund: payRefund, refundedTotal: payRefundedTotal }
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
     }).sort((a: any, b: any) => b.profit - a.profit);
  });

  // Product Form
  showProductModal = signal(false);
  editingProduct = signal<Product | null>(null);
  productForm: FormGroup;
  tempImages = signal<string[]>([]);
  formValues = signal<any>({}); 
  
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
       localPrice: [0],
       exchangeRate: [0.22],
       weight: [0],
       shippingCostPerKg: [200],
       costMaterial: [0],
       stock: [0],
       optionsStr: [''], 
       note: [''],
       isPreorder: [false],
       isListed: [true]
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

    this.userForm = this.fb.group({
       name: ['', Validators.required],
       phone: ['', Validators.required],
       birthday: [''],
       tier: ['general'],
       credits: [0],
       note: ['']
    });
  }

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

  navClass(tab: string) {
    const active = this.activeTab() === tab;
    return `w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all mb-1 ${active ? 'bg-brand-900 text-white font-bold shadow-md' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`;
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

  formatMemberNo(no?: string): string {
    if (!no) return '舊會員 (待更新)';
    if (no.includes('/')) {
       return 'M' + no.replace(/\//g, '');
    }
    return no;
  }

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

  // CSV Export helpers (keep original)
  private downloadCSV(filename: string, headers: string[], rows: any[]) {
    const BOM = '\uFEFF';
    const csvContent = [
       headers.join(','),
       ...rows.map(row => row.map((cell: any) => {
          const str = String(cell === null || cell === undefined ? '' : cell);
          return `"${str.replace(/"/g, '""')}"`;
       }).join(','))
    ].join('\r\n');
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
        return [ o.id, date, this.getUserName(o.userId), this.getPaymentStatusLabel('temp', o.paymentMethod), o.shippingMethod, o.finalTotal, this.getPaymentStatusLabel(o.status, o.paymentMethod), o.shippingLink || '', items ];
     });
     this.downloadCSV(`訂單報表_${new Date().toISOString().slice(0,10)}`, headers, rows);
  }

  exportProductsCSV() {
     const headers = ['SKU貨號', '商品名稱', '分類', '規格', '庫存', '已售', '一般售價', 'VIP價', '本地成本', '匯率', '預估毛利'];
     const rows = this.store.products().map((p: Product) => {
        const cost = (p.localPrice * p.exchangeRate) + p.costMaterial + (p.weight * p.shippingCostPerKg);
        const profit = p.priceGeneral - cost;
        return [ p.code, p.name, p.category, p.options.join('|'), p.stock, p.soldCount, p.priceGeneral, p.priceVip, p.localPrice, p.exchangeRate, profit.toFixed(0) ];
     });
     this.downloadCSV(`商品總表_${new Date().toISOString().slice(0,10)}`, headers, rows);
  }

  exportCustomersCSV() {
     const headers = ['會員編碼', '會員ID', '姓名', '電話', '等級', '累積消費', '購物金餘額', '生日'];
     const rows = this.filteredUsers().map((u: User) => [ this.formatMemberNo(u.memberNo), u.id, u.name, u.phone, u.tier, u.totalSpend, u.credits, u.birthday || '' ]);
     this.downloadCSV(`會員名單_${new Date().toISOString().slice(0,10)}`, headers, rows);
  }

  exportInventoryCSV() {
     const headers = ['SKU貨號', '商品名稱', '分類', '庫存數量', '狀態'];
     const rows = this.store.products().map((p: Product) => {
        let status = '充足';
        if (p.stock <= 0) status = '缺貨';
        else if (p.stock < 5) status = '低庫存';
        return [ p.code, p.name, p.category, p.stock, status ];
     });
     this.downloadCSV(`庫存盤點表_${new Date().toISOString().slice(0,10)}`, headers, rows);
  }
  
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
        return [ o.id, new Date(o.createdAt).toLocaleDateString(), o.items.map((i: CartItem) => i.productName).join(';'), o.finalTotal, cost.toFixed(0), profit.toFixed(0), margin.toFixed(1) ];
     });
     this.downloadCSV(`銷售報表_明細_${range}_${new Date().toISOString().slice(0,10)}`, headers, rows);
  }

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
    this.formValues.set(this.productForm.getRawValue()); 
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

     // 🔥 修正重點：如果勾選預購，強制設定庫存為 99999
     const finalStock = val.isPreorder ? 99999 : val.stock;

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
        stock: finalStock,
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
        allowShipping: { meetup: true, myship: true, family: true, delivery: true },

        isPreorder: val.isPreorder,
        isListed: val.isListed
     };
     
     if (this.editingProduct()) {
        this.store.updateProduct(p);
     } else {
        this.store.addProduct(p);
     }
     this.closeProductModal();
  }
  handleBatchImport(e: any) {}

  getPeriodLabel(p: string) { const map: any = { all_time: '全期', this_month: '本月', last_month: '上月', this_quarter: '本季' }; return map[p] || p; }
  getMetricLabel(m: string) { const map: any = { spend: '消費金額', count: '訂單數', recency: '最近購買' }; return map[m] || m; }
  editUser(u: User) { this.openUserModal(u); }
  isBirthdayMonth(d: string) { return new Date(d).getMonth() === new Date().getMonth(); }
  openUserModal(u: User) { this.editingUser.set(u); this.userForm.patchValue(u); this.showUserModal.set(true); }
  closeUserModal() { this.showUserModal.set(false); this.editingUser.set(null); }
  saveUser() {
     if (this.userForm.valid && this.editingUser()) {
        const updatedUser = { ...this.editingUser()!, ...this.userForm.value };
        this.store.updateUser(updatedUser);
        this.closeUserModal();
        alert('會員資料已更新');
     } else {
        alert('請檢查必填欄位');
     }
  }
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
        paymentMethods: { cash: val.enableCash, bankTransfer: val.enableBank, cod: val.enableCod },
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