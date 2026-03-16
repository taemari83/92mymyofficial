import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreService, Product } from '../services/store.service';

@Component({
  selector: 'app-buyer-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 pb-20 font-sans selection:bg-brand-200">
      <nav class="bg-white sticky top-0 z-40 px-4 py-3 border-b border-gray-200 shadow-sm flex items-center justify-between">
        <h1 class="text-xl font-black text-brand-900 tracking-wide">📦 採購回報</h1>
        <button class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">✕</button>
      </nav>

      <main class="max-w-md mx-auto p-4 space-y-5 animate-fade-in">
        
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div class="flex items-center gap-2 mb-2 border-b border-gray-100 pb-2">
            <span class="text-lg">📍</span><h2 class="font-bold text-gray-800">購買來源</h2>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-gray-500 mb-1">國家</label>
              <input type="text" list="countryList" [(ngModel)]="formData.country" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-brand-400" />
              <datalist id="countryList">
                <option value="韓國"></option>
                <option value="日本"></option>
                <option value="中國"></option>
                <option value="台灣"></option>
                <option value="泰國"></option>
              </datalist>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-500 mb-1">購買日期</label>
              <input type="date" [(ngModel)]="formData.date" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-brand-400" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1">購買地點 / 網址 (必填)</label>
            <input type="text" [(ngModel)]="formData.location" placeholder="例如：明洞 Olive Young / 網址" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-400 focus:bg-white transition-colors" />
          </div>
        </div>

        <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4 relative overflow-hidden">
          <div class="absolute top-0 right-0 w-16 h-16 bg-brand-50 rounded-bl-full -z-0"></div>
          <div class="flex items-center gap-2 mb-2 border-b border-gray-100 pb-2 relative z-10">
            <span class="text-lg">🛍️</span><h2 class="font-bold text-gray-800">搜尋已上架商品</h2>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1">關鍵字搜尋 🔍 (打字自動過濾)</label>
            <input type="text" list="productList" [(ngModel)]="searchProductText" (change)="onProductSearchChange()" placeholder="請輸入商品名稱或貨號..." class="w-full p-3 bg-brand-50 border border-brand-200 rounded-xl text-sm font-bold text-brand-900 outline-none focus:border-brand-400" />
            <datalist id="productList">
              @for(p of store.products(); track p.id) {
                <option [value]="'[' + p.code + '] ' + p.name"></option>
              }
            </datalist>
          </div>
          
          @if(formData.sku) {
            <div class="flex items-center gap-3 mt-2 p-3 bg-gray-50 rounded-xl border border-gray-100 animate-fade-in">
              <div class="w-14 h-14 bg-white rounded-lg border border-gray-200 overflow-hidden shrink-0">
                <img [src]="formData.productImage" class="w-full h-full object-cover" />
              </div>
              <div class="flex-1 min-w-0">
                <span class="block text-[10px] text-gray-400">已選商品</span>
                <span class="text-xs font-bold text-gray-700 line-clamp-1">{{ formData.productName }}</span>
                <div class="flex items-center gap-1 mt-1">
                   <span class="text-[10px] text-gray-400">貨號 (SKU)</span>
                   <span class="text-xs font-mono font-bold text-brand-600">{{ formData.sku }}</span>
                </div>
              </div>
            </div>
          }
        </div>

        <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div class="flex items-center gap-2 mb-2 border-b border-gray-100 pb-2">
            <span class="text-lg">💵</span><h2 class="font-bold text-gray-800">當地實際花費</h2>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-gray-500 mb-1">當地單價</label>
              <input type="number" [(ngModel)]="formData.localPrice" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-lg font-black text-gray-800 outline-none focus:border-brand-400" />
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-500 mb-1">採購數量</label>
              <input type="number" [(ngModel)]="formData.quantity" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-lg font-black text-gray-800 outline-none focus:border-brand-400 text-center" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-gray-500 mb-1">當地運費 (可填 0)</label>
              <input type="number" [(ngModel)]="formData.localShipping" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 outline-none focus:border-brand-400" />
            </div>
            <div class="bg-red-50 rounded-xl p-3 border border-red-100 flex flex-col justify-center">
              <label class="block text-[10px] font-bold text-red-400 mb-0.5">總支出 (自動加總)</label>
              <div class="text-xl font-black text-red-600">{{ getCalculatedTotal() | number }}</div>
            </div>
          </div>
        </div>

        <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div class="flex items-center gap-2 mb-2 border-b border-gray-100 pb-2">
            <span class="text-lg">🤝</span><h2 class="font-bold text-gray-800">帳務歸屬</h2>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-gray-500 mb-1">實際付款人</label>
              <select [(ngModel)]="formData.payer" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-brand-400">
                <option value="藝辰">藝辰</option>
                <option value="子婷">子婷</option>
                <option value="小芸">小芸</option>
                <option value="公費">公司公費</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-500 mb-1">套用分潤模式</label>
              <select [(ngModel)]="formData.shareMode" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-brand-700 outline-none focus:border-brand-400">
                <option value="親帶">親帶 (25/25/25/25)</option>
                <option value="買手">買手 (0/40/40/20)</option>
              </select>
            </div>
          </div>
        </div>

        <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3">
          <div class="flex items-center justify-between border-b border-gray-100 pb-2">
            <h2 class="font-bold text-gray-800">📸 實拍與收據</h2>
            <span class="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded font-bold">自動存入 Drive</span>
          </div>
          <div class="flex flex-wrap gap-2">
            @for(img of uploadedImages(); track $index) {
              <div class="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                <img [src]="img" class="w-full h-full object-cover" />
                <button (click)="removeImage($index)" class="absolute top-1 right-1 bg-black/60 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">✕</button>
              </div>
            }
            <label class="w-20 h-20 rounded-xl border-2 border-dashed border-brand-300 bg-brand-50 text-brand-600 flex flex-col items-center justify-center cursor-pointer hover:bg-brand-100" [class.opacity-50]="isUploading()">
              @if(isUploading()) {
                <span class="animate-spin text-xl mb-1">⏳</span>
              } @else {
                <span class="text-2xl mb-1">+</span>
                <input type="file" accept="image/*" class="hidden" (change)="uploadToDrive($event)" [disabled]="isUploading()" />
              }
            </label>
          </div>
        </div>

        <button (click)="submitPurchase()" class="w-full py-4 bg-black text-white rounded-2xl font-black tracking-widest text-lg shadow-xl hover:bg-gray-800 transition-transform active:scale-95 flex items-center justify-center gap-2 mt-4">
          <span>📤</span> 確認送出回報
        </button>
      </main>
    </div>
  `
})
export class BuyerFormComponent {
  store = inject(StoreService);
  
  // ⚠️ 這裡請換回你最新部署的 GAS 網址！
  readonly GAS_URL = 'https://script.google.com/macros/s/AKfycbzSqZFXKWlmeI4WLkE8iBYrbGWfeWxVJigl-zOLMhUQVlVv5_qW9OpLJZenLElZqhNZxA/exec';

  isUploading = signal(false);
  uploadedImages = signal<string[]>([]);
  searchProductText = ''; // 用於綁定搜尋框

  formData = {
    date: new Date().toISOString().split('T')[0],
    country: '韓國',
    location: '',
    selectedProductId: '',
    productName: '',
    productImage: '', // 新增儲存預覽圖片的變數
    category: '',
    sku: '',
    localPrice: null as number | null,
    quantity: 1,
    localShipping: 0,
    payer: '藝辰',
    shareMode: '親帶',
  };

  getCalculatedTotal(): number {
    const price = Number(this.formData.localPrice) || 0;
    const qty = Number(this.formData.quantity) || 1;
    const shipping = Number(this.formData.localShipping) || 0;
    return (price * qty) + shipping;
  }

  clearForm() {
    this.formData.selectedProductId = '';
    this.formData.productName = '';
    this.formData.productImage = '';
    this.formData.category = '';
    this.formData.sku = '';
    this.formData.localPrice = null;
    this.formData.quantity = 1;
    this.formData.localShipping = 0;
  }

  // 🚀 智慧搜尋邏輯：反查商品名稱，並帶入預覽圖片
  onProductSearchChange() {
    const found = this.store.products().find((p: Product) => `[${p.code}] ${p.name}` === this.searchProductText);
    
    if (found) {
      this.formData.selectedProductId = found.id;
      this.formData.productName = found.name;
      this.formData.sku = found.code;
      this.formData.category = found.category;
      this.formData.localPrice = found.localPrice || null;
      // 抓取商品圖片，如果沒有就放個假圖防破版
      this.formData.productImage = found.image || 'https://placehold.co/100x100?text=No+Image'; 
    } else {
      this.clearForm();
    }
  }

  async uploadToDrive(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.isUploading.set(true);
    const reader = new FileReader();
    
    reader.onload = async (e: any) => {
      const base64Data = e.target.result.split(',')[1];
      
      // 🚀 精準命名邏輯：商品名稱_YYMMDD_流水號
      const now = new Date();
      const datePart = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      const randomSerial = String(Math.floor(Math.random() * 999)).padStart(3, '0');
      // 將商品名稱裡面的特殊符號過濾掉，避免檔名出錯
      const safeProductName = this.formData.productName ? this.formData.productName.replace(/[\/\\\\:*?"<>|]/g, '').trim() : '未命名商品';
      
      const finalFileName = `${safeProductName}_${datePart}_${randomSerial}.jpg`;

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
    if (!this.formData.location || !this.formData.selectedProductId || !this.formData.localPrice) {
      alert('請先搜尋選擇商品，並填寫必填欄位 (購買地點、單價)！');
      return;
    }

    const finalData = {
      ...this.formData,
      totalLocalCost: this.getCalculatedTotal(),
      receiptImages: this.uploadedImages(),
      createdAt: new Date().getTime(),
      status: 'pending_sync'
    };

    alert(`✅ 採購紀錄送出成功！\\n貨號: ${this.formData.sku}\\n總花費: ${finalData.totalLocalCost}`);
    
    // 清空表單，準備填寫下一筆
    this.searchProductText = '';
    this.clearForm();
    this.uploadedImages.set([]);
  }
}