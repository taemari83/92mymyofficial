import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreService, Product } from '../services/store.service';

@Component({
  selector: 'app-buyer-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-white pb-20 font-sans selection:bg-brand-200 text-gray-800">
      
      <main class="max-w-md mx-auto p-5 sm:p-8 space-y-6 animate-fade-in">
        
        <header class="mb-8 mt-2">
          <h1 class="text-3xl font-black text-brand-900 tracking-tight">採購回報</h1>
          <p class="text-sm text-gray-400 font-bold mt-1">支援多件商品合併為單筆帳務</p>
        </header>

        <div class="space-y-3">
          <div class="flex items-center gap-2 border-b border-gray-100 pb-2">
            <span class="text-lg">🛍️</span><h2 class="font-bold text-gray-800">搜尋與加入商品</h2>
          </div>
          
          <div class="relative">
            <input type="text" list="productList" [(ngModel)]="searchProductText" (change)="onProductSearchChange()" placeholder="🔍 輸入品名或貨號自動過濾..." class="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-brand-900 outline-none focus:border-brand-400 focus:bg-white transition-colors shadow-inner" />
            <datalist id="productList">
              @for(p of store.products(); track p.id) {
                <option [value]="'[' + p.code + '] ' + p.name"></option>
              }
            </datalist>
          </div>
          
          @if(selectedProduct(); as p) {
            <div class="p-3.5 bg-white rounded-2xl border-2 border-brand-100 animate-fade-in shadow-sm space-y-3">
              
              <div class="flex items-center gap-3">
                <div class="w-14 h-14 bg-gray-100 rounded-xl border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                  <img [src]="p.productImage" (error)="handleImageError($event)" class="w-full h-full object-cover mix-blend-multiply" />
                </div>
                <div class="flex-1 min-w-0">
                  <span class="text-xs font-bold text-gray-800 line-clamp-1 leading-tight">{{ p.productName }}</span>
                  <div class="flex items-center gap-1.5 mt-1">
                     <span class="text-[10px] text-gray-400 font-bold">SKU</span>
                     <span class="text-[10px] font-mono font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">{{ p.sku }}</span>
                  </div>
                </div>
              </div>

              <div class="flex gap-2 pt-2 border-t border-gray-50">
                <div class="flex-1">
                  <label class="block text-[10px] font-bold text-gray-400 mb-1">當地單價</label>
                  <input type="number" [(ngModel)]="tempPrice" placeholder="0" class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-black text-gray-800 outline-none focus:border-brand-400" />
                </div>
                <div class="w-24 shrink-0">
                  <label class="block text-[10px] font-bold text-gray-400 mb-1">數量</label>
                  <input type="number" [(ngModel)]="tempQty" class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-black text-gray-800 outline-none focus:border-brand-400 text-center" />
                </div>
              </div>

              <button (click)="addItemToList()" class="w-full py-2.5 bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-1">
                <span>➕</span> 加入本次採購清單
              </button>
            </div>
          }
        </div>

        @if(purchaseItems().length > 0) {
          <div class="space-y-2 pt-4 animate-fade-in">
            <div class="flex items-center justify-between border-b border-gray-100 pb-2">
              <div class="flex items-center gap-2">
                <span class="text-lg">🛒</span><h2 class="font-bold text-gray-800">本次採購清單</h2>
              </div>
              <span class="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded-lg">共 {{ purchaseItems().length }} 項</span>
            </div>
            
            <div class="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
              @for(item of purchaseItems(); track $index) {
                <div class="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div class="flex flex-col min-w-0 flex-1 pr-2">
                    <span class="text-xs font-bold text-gray-700 line-clamp-1">{{ item.productName }}</span>
                    <span class="text-[10px] text-gray-400 font-mono mt-0.5">{{ item.sku }}</span>
                  </div>
                  <div class="flex items-center gap-3 shrink-0">
                    <div class="text-right">
                      <div class="text-xs font-black text-gray-800">{{ item.price | number }}</div>
                      <div class="text-[10px] text-gray-400">x {{ item.quantity }}</div>
                    </div>
                    <button (click)="removeItem($index)" class="w-7 h-7 bg-white text-red-400 hover:bg-red-50 hover:text-red-500 rounded-full border border-gray-200 flex items-center justify-center text-xs shadow-sm transition-colors">🗑️</button>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <div class="space-y-3 pt-4">
          <div class="flex items-center gap-2 border-b border-gray-100 pb-2">
            <span class="text-lg">📍</span><h2 class="font-bold text-gray-800">共用單據資訊</h2>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">國家</label>
              <input type="text" list="countryList" [(ngModel)]="formData.country" class="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-brand-400 transition-colors" />
            </div>
            <div>
              <label class="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">購買日期</label>
              <input type="date" [(ngModel)]="formData.date" class="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-brand-400 transition-colors" />
            </div>
          </div>
          <div>
            <label class="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">地點或網址 (必填)</label>
            <input type="text" [(ngModel)]="formData.location" placeholder="例如：明洞 Olive Young" class="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-400 transition-colors" />
          </div>
        </div>

        <div class="space-y-3 pt-4">
          <div class="flex flex-col sm:flex-row gap-3">
            <div class="flex-1">
              <label class="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">共用當地運費 (可填 0)</label>
              <input type="number" [(ngModel)]="formData.localShipping" placeholder="0" class="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 outline-none focus:border-brand-400 transition-colors" />
            </div>
            <div class="flex-1 bg-red-50/80 rounded-xl p-3.5 border border-red-100 flex flex-col justify-center items-center sm:items-start">
              <label class="block text-[10px] font-black text-red-400 mb-0.5 uppercase tracking-widest">總支出 (商品加總+運費)</label>
              <div class="text-2xl font-black text-red-600 tracking-tight">{{ getCalculatedTotal() | number }}</div>
            </div>
          </div>
        </div>

        <div class="space-y-3 pt-4">
          <div class="flex items-center gap-2 border-b border-gray-100 pb-2">
            <span class="text-lg">🤝</span><h2 class="font-bold text-gray-800">帳務歸屬</h2>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">付款人</label>
              <select [(ngModel)]="formData.payer" class="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-brand-400 transition-colors">
                <option value="藝辰">藝辰</option><option value="子婷">子婷</option><option value="小芸">小芸</option><option value="公費">公司公費</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">分潤模式</label>
              <select [(ngModel)]="formData.shareMode" class="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-brand-700 outline-none focus:border-brand-400 transition-colors">
                <option value="親帶">親帶 (25/25/25/25)</option><option value="買手">買手 (0/40/40/20)</option>
              </select>
            </div>
          </div>
        </div>

        <div class="space-y-3 pt-4">
          <div class="flex items-center justify-between border-b border-gray-100 pb-2">
            <div class="flex items-center gap-2">
              <span class="text-lg">📸</span><h2 class="font-bold text-gray-800">實拍與收據</h2>
            </div>
            <span class="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-bold tracking-wider">自動存入 Drive</span>
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

        <button (click)="submitPurchase()" class="w-full py-4 bg-brand-900 text-white rounded-2xl font-black tracking-widest text-lg shadow-[0_8px_20px_rgb(0,0,0,0.12)] hover:bg-black hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center gap-2 mt-8">
          <span>📤</span> 確認送出整筆單據
        </button>
      </main>
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
  `]
})
export class BuyerFormComponent {
  store = inject(StoreService);
  
  // ⚠️ 這裡請換回你最新部署的 GAS 網址！
  readonly GAS_URL = 'https://script.google.com/macros/s/AKfycbzSqZFXKWlmeI4WLkE8iBYrbGWfeWxVJigl-zOLMhUQVlVv5_qW9OpLJZenLElZqhNZxA/exec';

  isUploading = signal(false);
  uploadedImages = signal<string[]>([]);
  
  // 搜尋與購物車狀態
  searchProductText = ''; 
  selectedProduct = signal<any>(null); // 目前搜尋到的商品
  tempPrice = signal<number | null>(null); // 暫存單價
  tempQty = signal<number>(1); // 暫存數量
  purchaseItems = signal<any[]>([]); // 購物車陣列

  formData = {
    date: new Date().toISOString().split('T')[0],
    country: '韓國',
    location: '',
    localShipping: 0,
    payer: '藝辰',
    shareMode: '親帶',
  };

  handleImageError(event: any) {
    event.target.src = 'https://placehold.co/150x150?text=No+Image';
  }

  // 自動加總購物車內所有商品 (單價*數量) + 當地運費
  getCalculatedTotal(): number {
    const itemsTotal = this.purchaseItems().reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = Number(this.formData.localShipping) || 0;
    return itemsTotal + shipping;
  }

  onProductSearchChange() {
    const searchText = this.searchProductText.trim();
    if (!searchText) {
      this.selectedProduct.set(null);
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
        productImage: img
      });
      this.tempPrice.set(found.localPrice || null);
      this.tempQty.set(1);
    } else {
      this.selectedProduct.set(null);
    }
  }

  // 加入清單 (購物車)
  addItemToList() {
    const product = this.selectedProduct();
    const price = this.tempPrice();
    const qty = this.tempQty();

    if (!product || price === null || price < 0 || qty <= 0) {
      alert('請確認單價與數量是否正確填寫！');
      return;
    }

    this.purchaseItems.update(items => [
      ...items, 
      { ...product, price: Number(price), quantity: Number(qty) }
    ]);

    // 清空搜尋狀態，準備搜下一個
    this.searchProductText = '';
    this.selectedProduct.set(null);
    this.tempPrice.set(null);
    this.tempQty.set(1);
  }

  // 從清單中移除
  removeItem(index: number) {
    this.purchaseItems.update(items => items.filter((_, i) => i !== index));
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
      
      // 檔名：如果有加商品就用第一個商品的名稱，不然就用地點
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

  async submitPurchase() {
    if (this.purchaseItems().length === 0) {
      alert('請至少加入一項商品至採購清單！');
      return;
    }
    if (!this.formData.location) {
      alert('請填寫購買地點！');
      return;
    }

    const finalData = {
      ...this.formData,
      items: this.purchaseItems(),
      totalLocalCost: this.getCalculatedTotal(),
      receiptImages: this.uploadedImages(),
      createdAt: new Date().getTime(),
      status: 'pending_sync'
    };

    // 這裡未來會接 store.addPurchaseBatch(finalData) 將整批資料寫入 Firebase
    
    alert(`✅ 整筆單據送出成功！\n共包含 ${this.purchaseItems().length} 項商品\n總花費: ${finalData.totalLocalCost}`);
    
    // 送出後清空所有狀態
    this.searchProductText = '';
    this.selectedProduct.set(null);
    this.purchaseItems.set([]);
    this.uploadedImages.set([]);
    this.formData.location = '';
    this.formData.localShipping = 0;
  }
}