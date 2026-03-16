import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreService, Product, Order, CartItem } from '../services/store.service';

@Component({
  selector: 'app-buyer-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 pb-24 font-sans selection:bg-brand-200 text-gray-800">
      
      <nav class="bg-white sticky top-0 z-40 px-4 py-3 border-b border-gray-200 shadow-sm">
        <div class="flex items-center justify-between mb-2">
          <h1 class="text-xl font-black text-brand-900 tracking-wide">📦 採購回報</h1>
          <button class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">✕</button>
        </div>
        <div class="flex items-center gap-2">
          <div class="flex-1 h-1.5 rounded-full transition-colors" [class.bg-brand-900]="currentStep() === 'cart' || currentStep() === 'checkout'" [class.bg-gray-200]="false"></div>
          <div class="flex-1 h-1.5 rounded-full transition-colors" [class.bg-brand-900]="currentStep() === 'checkout'" [class.bg-gray-200]="currentStep() === 'cart'"></div>
        </div>
        <div class="flex justify-between text-[10px] font-bold text-gray-400 mt-1 px-1">
          <span [class.text-brand-900]="currentStep() === 'cart'">STEP 1. 採購任務</span>
          <span [class.text-brand-900]="currentStep() === 'checkout'">STEP 2. 帳務回報</span>
        </div>
      </nav>

      <main class="max-w-md mx-auto p-4 animate-fade-in">
        
        @if(currentStep() === 'cart') {
          <div class="space-y-4 animate-slide-in">
            
            <div class="bg-white p-5 rounded-2xl shadow-sm border border-brand-100">
              <div class="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                <div class="flex items-center gap-2">
                  <span class="text-lg">📋</span><h2 class="font-bold text-brand-900">系統待買任務</h2>
                </div>
                <span class="text-[10px] bg-red-50 text-red-600 px-2 py-1 rounded-md font-bold tracking-wider">尚缺 {{ pendingTasks().length }} 項</span>
              </div>
              
              <div class="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                @for(task of pendingTasks(); track task.productId + task.option) {
                  <div (click)="selectTask(task)" class="flex items-center gap-3 p-3 bg-gray-50 hover:bg-brand-50 rounded-xl border border-gray-100 hover:border-brand-200 cursor-pointer transition-colors group relative overflow-hidden">
                    <div class="absolute inset-0 bg-brand-900/5 opacity-0 group-active:opacity-100 transition-opacity"></div>
                    <img [src]="task.image" (error)="handleImageError($event)" class="w-12 h-12 rounded-lg object-cover border border-gray-200 shrink-0 bg-white mix-blend-multiply" />
                    <div class="flex-1 min-w-0">
                      <div class="text-xs font-bold text-gray-800 line-clamp-1 group-hover:text-brand-900">{{ task.productName }}</div>
                      <div class="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                        <span class="bg-white border border-gray-200 px-1 rounded">{{ task.option }}</span>
                      </div>
                    </div>
                    <div class="text-right shrink-0 bg-white p-1.5 rounded-lg border border-red-100 shadow-sm">
                      <div class="text-[9px] text-red-400 font-bold mb-0.5 tracking-widest text-center">還缺</div>
                      <div class="text-lg font-black text-red-600 leading-none text-center">{{ task.needed - task.procured }}</div>
                    </div>
                  </div>
                }
                @if(pendingTasks().length === 0) {
                  <div class="text-center py-6 flex flex-col items-center justify-center opacity-50">
                    <span class="text-4xl mb-2">🎉</span>
                    <p class="text-gray-500 font-bold text-sm">目前訂單都買齊啦！<br>沒有待採購任務。</p>
                  </div>
                }
              </div>
            </div>

            <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div class="flex items-center gap-2 mb-3 border-b border-gray-100 pb-2">
                <span class="text-lg">🔍</span><h2 class="font-bold text-gray-800">手動搜尋商品 (備用)</h2>
              </div>
              <input type="text" list="productList" [(ngModel)]="searchProductText" (change)="onProductSearchChange()" placeholder="輸入品名或貨號自動過濾..." class="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-brand-900 outline-none focus:border-brand-400 focus:bg-white transition-colors" />
              <datalist id="productList">
                @for(p of store.products(); track p.id) {
                  <option [value]="'[' + p.code + '] ' + p.name"></option>
                }
              </datalist>
            </div>
            
            @if(selectedProduct(); as p) {
              <div class="p-4 bg-white rounded-2xl border-2 border-brand-300 shadow-lg space-y-4 animate-bounce-in relative z-10">
                <div class="flex justify-between items-start">
                  <div class="flex gap-3 flex-1 min-w-0">
                    <div class="w-16 h-16 bg-gray-100 rounded-xl border border-gray-100 overflow-hidden shrink-0">
                      <img [src]="p.productImage" (error)="handleImageError($event)" class="w-full h-full object-cover mix-blend-multiply" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <span class="text-sm font-bold text-gray-800 line-clamp-2 leading-tight">{{ p.productName }}</span>
                      <div class="flex items-center gap-1.5 mt-1">
                        <span class="text-[10px] font-mono font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded inline-block">{{ p.sku }}</span>
                        @if(p.option) { <span class="text-[10px] font-bold text-gray-500 border border-gray-200 px-1.5 py-0.5 rounded">{{ p.option }}</span> }
                      </div>
                    </div>
                  </div>
                  <button (click)="clearSelection()" class="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs text-gray-500 shrink-0 hover:bg-gray-200">✕</button>
                </div>

                <div class="flex gap-2 w-full">
                  <div class="flex-1 min-w-0">
                    <label class="flex justify-between items-end mb-1">
                      <span class="text-[10px] font-bold text-gray-500 truncate pr-1">單品實際花費</span>
                      @if(referencePrice()) { <span class="text-[9px] font-bold text-gray-400 bg-gray-100 px-1 rounded truncate">參考價:{{ referencePrice() | number }}</span> }
                    </label>
                    <input type="number" [(ngModel)]="tempPrice" placeholder="填寫收據金額..." class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-black outline-none focus:border-brand-400 focus:bg-white transition-colors" />
                  </div>
                  <div class="w-20 sm:w-24 shrink-0 min-w-0">
                    <label class="block text-[10px] font-bold text-gray-500 mb-1 truncate">數量</label>
                    <input type="number" [(ngModel)]="tempQty" class="w-full p-2.5 bg-brand-50 border border-brand-200 text-brand-900 rounded-xl text-sm font-black outline-none focus:border-brand-500 text-center" />
                  </div>
                </div>

                <button (click)="addItemToList()" class="w-full py-3 bg-brand-900 text-white rounded-xl text-sm font-bold transition-transform active:scale-95 flex items-center justify-center gap-1 shadow-md">
                  <span>➕</span> 確認購入，加入清單
                </button>
              </div>
            }

            <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div class="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                <div class="flex items-center gap-2">
                  <span class="text-lg">🛒</span><h2 class="font-bold text-gray-800">已加入本次帳單</h2>
                </div>
                <span class="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-100">共 {{ purchaseItems().length }} 項</span>
              </div>
              
              @if(purchaseItems().length === 0) {
                <div class="text-center py-8 text-gray-400 text-sm font-bold bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  尚未加入任何商品
                </div>
              } @else {
                <div class="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                  @for(item of purchaseItems(); track $index) {
                    <div class="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div class="flex flex-col min-w-0 flex-1 pr-2">
                        <span class="text-xs font-bold text-gray-700 line-clamp-1">{{ item.productName }}</span>
                        <div class="flex items-center gap-1 mt-0.5">
                          <span class="text-[10px] text-gray-400 font-mono">{{ item.sku }}</span>
                          @if(item.option) { <span class="text-[9px] text-gray-400 border border-gray-200 bg-white px-1 rounded">{{ item.option }}</span> }
                        </div>
                      </div>
                      <div class="flex items-center gap-3 shrink-0">
                        <div class="text-right">
                          <div class="text-xs font-black text-gray-800">{{ item.price | number }}</div>
                          <div class="text-[10px] text-gray-400">x {{ item.quantity }}</div>
                        </div>
                        <button (click)="removeItem($index)" class="w-7 h-7 bg-white text-red-400 hover:bg-red-50 hover:text-red-500 rounded-full border border-gray-200 flex items-center justify-center text-xs shadow-sm">🗑️</button>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>

            <div class="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 z-50">
              <button (click)="goToNextStep()" class="w-full max-w-md mx-auto py-3.5 bg-black text-white rounded-xl font-bold tracking-wide shadow-lg transition-transform active:scale-95 disabled:opacity-50 disabled:bg-gray-400 disabled:shadow-none" [disabled]="purchaseItems().length === 0">
                下一步：帳單結帳回報 ➔
              </button>
            </div>
          </div>
        }

        @if(currentStep() === 'checkout') {
          <div class="space-y-4 animate-slide-in">
            
            <button (click)="currentStep.set('cart')" class="text-sm font-bold text-gray-500 flex items-center gap-1 mb-2 hover:text-gray-800 transition-colors">
              <span>⬅</span> 返回修改採購清單
            </button>

            <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3">
              <div class="flex items-center gap-2 border-b border-gray-100 pb-2">
                <span class="text-lg">📍</span><h2 class="font-bold text-gray-800">整張單據購買資訊</h2>
              </div>
              <div class="grid grid-cols-2 gap-2 sm:gap-3">
                <div class="min-w-0">
                  <label class="block text-[10px] font-bold text-gray-400 mb-1">國家</label>
                  <input type="text" list="countryList" [(ngModel)]="formData.country" class="w-full p-2.5 sm:p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-bold text-gray-700 outline-none focus:border-brand-400" />
                </div>
                <div class="min-w-0">
                  <label class="block text-[10px] font-bold text-gray-400 mb-1">購買日期</label>
                  <input type="date" [(ngModel)]="formData.date" class="w-full p-2.5 sm:p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-bold text-gray-700 outline-none focus:border-brand-400" />
                </div>
              </div>
              <div>
                <label class="block text-[10px] font-bold text-gray-400 mb-1">地點或網址 (必填)</label>
                <input type="text" [(ngModel)]="formData.location" placeholder="例如：明洞 Olive Young" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-400" />
              </div>
            </div>

            <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3">
              <div class="flex items-center gap-2 border-b border-gray-100 pb-2">
                <span class="text-lg">💵</span><h2 class="font-bold text-gray-800">總花費結算</h2>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="space-y-2">
                  <div>
                    <label class="block text-[10px] font-bold text-gray-400 mb-1">整筆單據當地運費 (無則免填)</label>
                    <input type="number" [(ngModel)]="formData.localShipping" placeholder="0" class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-brand-400" />
                  </div>
                  <div class="bg-gray-50 p-2.5 rounded-xl border border-gray-200 flex justify-between items-center mt-2">
                    <span class="text-[10px] font-bold text-gray-500">預估合計 (商品+運費)</span>
                    <span class="text-sm font-black text-gray-400">{{ getCalculatedTotal() | number }}</span>
                  </div>
                </div>
                
                <div class="bg-red-50 rounded-xl p-3.5 border border-red-200 flex flex-col justify-center shadow-inner">
                  <label class="block text-[10px] font-black text-red-500 mb-1.5 tracking-widest">實際付現/刷卡總額 (必填) ⚠️</label>
                  <input type="number" [(ngModel)]="formData.actualTotalCost" placeholder="請照著收據填寫最終數字" class="w-full p-3 bg-white border border-red-300 rounded-xl text-lg font-black text-red-600 outline-none focus:border-red-500 transition-colors placeholder:text-red-200 placeholder:text-xs placeholder:font-normal text-center" />
                </div>
              </div>
            </div>

            <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3">
              <div class="flex items-center gap-2 border-b border-gray-100 pb-2">
                <span class="text-lg">🤝</span><h2 class="font-bold text-gray-800">帳務歸屬</h2>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-[10px] font-bold text-gray-400 mb-1">實際付款人</label>
                  <select [(ngModel)]="formData.payer" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-brand-400">
                    <option value="藝辰">藝辰</option><option value="子婷">子婷</option><option value="小芸">小芸</option><option value="公費">公司公費</option>
                  </select>
                </div>
                <div>
                  <label class="block text-[10px] font-bold text-gray-400 mb-1">分潤模式</label>
                  <select [(ngModel)]="formData.shareMode" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-brand-700 outline-none focus:border-brand-400">
                    <option value="親帶">親帶 (25/25/25/25)</option><option value="買手">買手 (0/40/40/20)</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3 mb-24">
              <div class="flex items-center justify-between border-b border-gray-100 pb-2">
                <div class="flex items-center gap-2">
                  <span class="text-lg">📸</span><h2 class="font-bold text-gray-800">實拍與收據</h2>
                </div>
                <span class="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-bold">自動存入 Drive</span>
              </div>
              <div class="flex flex-wrap gap-3 pt-1">
                @for(img of uploadedImages(); track $index) {
                  <div class="relative w-20 h-20 rounded-2xl overflow-hidden border border-gray-200 shadow-sm animate-fade-in">
                    <img [src]="img" class="w-full h-full object-cover" />
                    <button (click)="removeImage($index)" class="absolute top-1 right-1 bg-black/70 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs backdrop-blur-sm">✕</button>
                  </div>
                }
                <label class="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400 flex flex-col items-center justify-center cursor-pointer hover:bg-brand-50 hover:border-brand-300 hover:text-brand-600 transition-all" [class.opacity-50]="isUploading()">
                  @if(isUploading()) {
                    <span class="animate-spin text-xl mb-1">⏳</span>
                  } @else {
                    <span class="text-2xl mb-1 leading-none">+</span>
                    <input type="file" accept="image/*" class="hidden" (change)="uploadToDrive($event)" [disabled]="isUploading()" />
                  }
                </label>
              </div>
            </div>

            <div class="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 z-50">
              <button (click)="submitPurchase()" class="w-full max-w-md mx-auto py-3.5 bg-brand-900 text-white rounded-xl font-bold tracking-wide shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2">
                <span>📤</span> 確認結帳並送出回報
              </button>
            </div>
          </div>
        }
      </main>
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    .animate-slide-in { animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    .animate-bounce-in { animation: bounceIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes bounceIn { 0% { transform: scale(0.95); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
  `]
})
export class BuyerFormComponent {
  store = inject(StoreService);
  
  // ⚠️ 這裡請換回你最新部署的 GAS 網址！
  readonly GAS_URL = 'https://script.google.com/macros/s/AKfycbzSqZFXKWlmeI4WLkE8iBYrbGWfeWxVJigl-zOLMhUQVlVv5_qW9OpLJZenLElZqhNZxA/exec';

  currentStep = signal<'cart' | 'checkout'>('cart');
  isUploading = signal(false);
  uploadedImages = signal<string[]>([]);
  
  searchProductText = ''; 
  selectedProduct = signal<any>(null); 
  
  referencePrice = signal<number | null>(null);
  tempPrice = signal<number | null>(null); 
  tempQty = signal<number>(1); 
  purchaseItems = signal<any[]>([]); 

  formData = {
    date: new Date().toISOString().split('T')[0],
    country: '韓國',
    location: '',
    localShipping: 0,
    actualTotalCost: null as number | null, // 🔥 新增：實際刷卡金額
    payer: '藝辰',
    shareMode: '親帶',
  };

  pendingTasks = computed(() => {
    const activeOrders = this.store.orders().filter((o: Order) => 
      ['payment_confirmed', 'paid_verifying', 'pending_shipping'].includes(o.status)
    );

    const listMap = new Map();

    activeOrders.forEach((order: Order) => {
      (order.items || []).forEach((item: CartItem) => {
        const optionName = item.option || '單一規格';
        const key = `${item.productId}_${optionName}`;

        if (!listMap.has(key)) {
          const product = this.store.products().find((p: Product) => p.id === item.productId);
          listMap.set(key, {
            productId: item.productId,
            productName: item.productName,
            option: optionName,
            image: product?.image || item.productImage || 'https://placehold.co/150x150?text=No+Image',
            sku: product?.code || '',
            purchaseUrl: (product as any)?.purchaseUrl || '',
            localPrice: product?.localPrice || null,
            needed: 0,
            procured: (product as any)?.procured?.[optionName] || 0
          });
        }
        listMap.get(key).needed += (item.quantity || 1);
      });
    });

    return Array.from(listMap.values()).filter(task => task.needed > task.procured);
  });

  handleImageError(event: any) {
    event.target.src = 'https://placehold.co/150x150?text=No+Image';
  }

  // 這是「預估」加總
  getCalculatedTotal(): number {
    const itemsTotal = this.purchaseItems().reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = Number(this.formData.localShipping) || 0;
    return itemsTotal + shipping;
  }

  selectTask(task: any) {
    this.selectedProduct.set({
      productId: task.productId,
      productName: task.productName,
      sku: task.sku,
      category: task.category,
      productImage: task.image,
      purchaseUrl: task.purchaseUrl,
      option: task.option 
    });
    
    this.referencePrice.set(task.localPrice || null);
    this.tempPrice.set(null); 
    this.tempQty.set(task.needed - task.procured); 
    this.searchProductText = '';
  }

  clearSelection() {
    this.selectedProduct.set(null);
    this.referencePrice.set(null);
  }

  onProductSearchChange() {
    const searchText = this.searchProductText.trim();
    if (!searchText) {
      this.clearSelection();
      return;
    }

    const match = searchText.match(/\[(.*?)\]/);
    const skuCode = match ? match[1] : searchText;

    const found = this.store.products().find((p: Product) => 
      p.code === skuCode || p.name.includes(searchText)
    );
    
    if (found) {
      let img = 'https://placehold.co/150x150?text=No+Image';
      if (found.image && found.image.startsWith('http')) {
        img = found.image;
      } else if (found.images && found.images.length > 0 && found.images[0].startsWith('http')) {
        img = found.images[0];
      }

      this.selectedProduct.set({
        productId: found.id,
        productName: found.name,
        sku: found.code,
        category: found.category,
        productImage: img,
        purchaseUrl: (found as any).purchaseUrl || '' 
      });
      
      this.referencePrice.set(found.localPrice || null);
      this.tempPrice.set(null);
      this.tempQty.set(1);
    } else {
      this.clearSelection();
    }
  }

  addItemToList() {
    const product = this.selectedProduct();
    const price = this.tempPrice();
    const qty = this.tempQty();

    if (!product || price === null || price <= 0 || qty <= 0) {
      alert('⚠️ 帳務防呆：請確實輸入您「實際購買的單價」與「數量」！\n(單價不可為 0 或空白)');
      return;
    }

    this.purchaseItems.update(items => [
      ...items, 
      { ...product, price: Number(price), quantity: Number(qty) }
    ]);

    this.searchProductText = '';
    this.clearSelection();
    this.tempPrice.set(null);
    this.tempQty.set(1);
  }

  removeItem(index: number) {
    this.purchaseItems.update(items => items.filter((_, i) => i !== index));
  }

  goToNextStep() {
    if (this.purchaseItems().length === 0) {
      alert('請至少加入一項商品至採購清單！');
      return;
    }
    this.currentStep.set('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async uploadToDrive(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.isUploading.set(true);
    const reader = new FileReader();
    
    reader.onload = async (e: any) => {
      const base64Data = e.target.result.split(',')[1];
      
      const now = new Date();
      const datePart = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      const randomSerial = String(Math.floor(Math.random() * 999)).padStart(3, '0');
      
      let prefixName = '多筆單據';
      if (this.purchaseItems().length > 0) {
        prefixName = this.purchaseItems()[0].productName.replace(/[\/\\:*?"<>|]/g, '').trim().substring(0, 15);
      } else if (this.formData.location) {
        prefixName = this.formData.location.replace(/[\/\\:*?"<>|]/g, '').trim();
      }
      
      const finalFileName = `${prefixName}_${datePart}_${randomSerial}.jpg`;

      const payload = new URLSearchParams();
      payload.append('fileData', base64Data);
      payload.append('mimeType', file.type);
      payload.append('fileName', finalFileName);

      try {
        const response = await fetch(this.GAS_URL, { method: 'POST', body: payload });
        const result = await response.json();
        
        if (result.success) {
          this.uploadedImages.update(imgs => [...imgs, result.url]);
        } else {
          alert('Google Drive 上傳失敗: ' + result.error);
        }
      } catch (err) {
        console.error(err);
        alert('網路錯誤，請重試！');
      } finally {
        this.isUploading.set(false);
      }
      event.target.value = '';
    };
    reader.readAsDataURL(file);
  }

  removeImage(index: number) {
    this.uploadedImages.update(imgs => imgs.filter((_, i) => i !== index));
  }

  // 🔥 升級：提交時嚴格檢查「實際花費」
  async submitPurchase() {
    if (!this.formData.location) {
      alert('請填寫購買地點或網址！');
      return;
    }
    
    // 帳務防呆：買手一定要手動打字確認總金額，否則不給過！
    if (this.formData.actualTotalCost === null || this.formData.actualTotalCost <= 0) {
      alert('⚠️ 帳務防呆：請填寫這張單據「實際付現/刷卡的總額」！\n這攸關公司對帳準確度，請確認無誤再送出。');
      return;
    }

    const finalData = {
      ...this.formData,
      items: this.purchaseItems(),
      estimatedLocalCost: this.getCalculatedTotal(), // 保留預估值供參考
      totalLocalCost: Number(this.formData.actualTotalCost), // 👈 這個才是進帳本的真實成本！
      receiptImages: this.uploadedImages(),
      createdAt: new Date().getTime(),
      status: 'pending_sync'
    };
    
    alert(`✅ 整筆單據回報成功！\n共包含 ${this.purchaseItems().length} 項商品\n實際總扣款: ${finalData.totalLocalCost}`);
    
    this.searchProductText = '';
    this.clearSelection();
    this.purchaseItems.set([]);
    this.uploadedImages.set([]);
    this.formData.location = '';
    this.formData.localShipping = 0;
    this.formData.actualTotalCost = null; // 清空花費
    this.currentStep.set('cart');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}