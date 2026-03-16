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
        <h1 class="text-xl font-black text-brand-900 tracking-wide">📦 採購回報系統</h1>
        <button class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">✕</button>
      </nav>

      <main class="max-w-md mx-auto p-4 space-y-5 animate-fade-in">
        
        <div class="flex bg-gray-200/50 p-1 rounded-xl w-full">
          <button (click)="isNewProduct.set(false); clearForm()" [class.bg-white]="!isNewProduct()" [class.shadow-sm]="!isNewProduct()" [class.text-brand-900]="!isNewProduct()" [class.text-gray-500]="isNewProduct()" class="flex-1 py-2 rounded-lg text-sm font-bold transition-all">📦 買現有缺貨商品</button>
          <button (click)="isNewProduct.set(true); clearForm()" [class.bg-white]="isNewProduct()" [class.shadow-sm]="isNewProduct()" [class.text-brand-900]="isNewProduct()" [class.text-gray-500]="!isNewProduct()" class="flex-1 py-2 rounded-lg text-sm font-bold transition-all">✨ 現場開發新品</button>
        </div>

        <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div class="flex items-center gap-2 mb-2 border-b border-gray-100 pb-2">
            <span class="text-lg">📍</span><h2 class="font-bold text-gray-800">購買來源</h2>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-gray-500 mb-1">國家 (可自由輸入)</label>
              <input type="text" list="countryList" [(ngModel)]="formData.country" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-brand-400">
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
              <input type="date" [(ngModel)]="formData.date" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-brand-400">
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1">購買地點 / 網址 (必填)</label>
            <input type="text" [(ngModel)]="formData.location" placeholder="例如：明洞 Olive Young / 網址" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-400 focus:bg-white transition-colors">
          </div>
        </div>

        <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4 relative overflow-hidden">
          <div class="absolute top-0 right-0 w-16 h-16 bg-brand-50 rounded-bl-full -z-0"></div>
          <div class="flex items-center gap-2 mb-2 border-b border-gray-100 pb-2 relative z-10">
            <span class="text-lg">🛍️</span><h2 class="font-bold text-gray-800">商品資訊</h2>
          </div>

          @if (!isNewProduct()) {
            <div>
              <label class="block text-xs font-bold text-gray-500 mb-1">搜尋現有需叫貨商品</label>
              <select [(ngModel)]="formData.selectedProductId" (change)="onExistingProductSelect()" class="w-full p-3 bg-brand-50 border border-brand-200 rounded-xl text-sm font-bold text-brand-900 outline-none focus:border-brand-400">
                <option value="" disabled>選擇要回報的商品...</option>
                @for(p of store.products(); track p.id) {
                  <option [value]="p.id">[{{ p.code }}] {{ p.name }}</option>
                }
              </select>
            </div>
          } @else {
            <div>
              <label class="block text-xs font-bold text-gray-500 mb-1">商品名稱</label>
              <input type="text" [(ngModel)]="formData.productName" placeholder="輸入完整商品名稱" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-400">
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-gray-500 mb-1">主分類 (觸發給號)</label>
                <select [(ngModel)]="formData.category" (change)="generateSku()" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-brand-900 outline-none focus:border-brand-400">
                  <option value="" disabled>選擇分類...</option>
                  @for(c of store.categories(); track c) {
                    <option [value]="c">{{ c }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-500 mb-1">系統分配貨號</label>
                <div class="w-full p-3 bg-brand-900 text-white rounded-xl text-sm font-mono font-black text-center shadow-inner h-[46px] flex items-center justify-center">
                  {{ formData.sku || '尚未給號' }}
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
              <label class="block text-xs font-bold text-gray-500 mb-1">商品單價 (當地幣)</label>
              <input type="number" [(ngModel)]="formData.localPrice" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-lg font-black text-gray-800 outline-none focus:border-brand-400">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-500 mb-1">採購數量</label>
              <input type="number" [(ngModel)]="formData.quantity" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-lg font-black text-gray-800 outline-none focus:border-brand-400 text-center">
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-gray-500 mb-1">當地運費 (可填 0)</label>
              <input type="number" [(ngModel)]="formData.localShipping" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 outline-none focus:border-brand-400">
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
                <option value="親帶">親帶 (30/30/15/25)</option>
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
                <img [src]="img" class="w-full h-full object-cover">
                <button (click)="removeImage($index)" class="absolute top-1 right-1 bg-black/60 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">✕</button>
              </div>
            }
            <label class="w-20 h-20 rounded-xl border-2 border-dashed border-brand-300 bg-brand-50 text-brand-600 flex flex-col items-center justify-center cursor-pointer hover:bg-brand-100" [class.opacity-50]="isUploading()">
              @if(isUploading()) {
                <span class="animate-spin text-xl mb-1">⏳</span>
              } @else {
                <span class="text-2xl mb-1">+</span>
                <input type="file" accept="image/*" class="hidden" (change)="uploadToDrive($event)" [disabled]="isUploading()">
              }
            </label>
          </div>
        </div>

        <button (click)="submitPurchase()" class="w-full py-4 bg-black text-white rounded-2xl font-black tracking-widest text-lg shadow-xl hover:bg-gray-800 transition-transform active:scale-95 flex items-center justify-center gap-2 mt-4">
          <span>📤</span> 確認建檔並送出
        </button>
      </main>
    </div>
  `
})
export class BuyerFormComponent {
  store = inject(StoreService);
  
  // ⚠️ 記得替換成你重新部署並設定為「所有人」的新 GAS 網址！
  readonly GAS_URL = 'https://script.google.com/macros/s/AKfycbzSqZFXKWlmeI4WLkE8iBYrbGWfeWxVJigl-zOLMhUQVlVv5_qW9OpLJZenLElZqhNZxA/exec';

  isNewProduct = signal(false);
  isUploading = signal(false);
  uploadedImages = signal<string[]>([]);

  formData = {
    date: new Date().toISOString().split('T')[0],
    country: '韓國',
    location: '',
    selectedProductId: '',
    productName: '',
    category: '',
    sku: '',
    localPrice: null as number | null,
    quantity: 1,
    localShipping: 0,
    payer: '藝辰',
    shareMode: '親帶',
  };

  // 🚀 核心優化：傳統函式確保 ngModel 雙向綁定能即時更新數字
  getCalculatedTotal(): number {
    const price = Number(this.formData.localPrice) || 0;
    const qty = Number(this.formData.quantity) || 1;
    const shipping = Number(this.formData.localShipping) || 0;
    return (price * qty) + shipping;
  }

  clearForm() {
    this.formData.selectedProductId = '';
    this.formData.productName = '';
    this.formData.category = '';
    this.formData.sku = '';
    this.formData.localPrice = null;
    this.formData.quantity = 1;
  }

  // 選擇現有商品時，自動帶入貨號與名稱
  onExistingProductSelect() {
    const id = this.formData.selectedProductId;
    const product = this.store.products().find((p: Product) => p.id === id);
    if (product) {
      this.formData.productName = product.name;
      this.formData.sku = product.code;
      this.formData.category = product.category;
      this.formData.localPrice = product.localPrice || null;
    }
  }

  generateSku() {
    if (!this.isNewProduct() || !this.formData.category) return;
    const codeMap = this.store.settings().categoryCodes || {};
    const prefix = codeMap[this.formData.category] || 'Z'; 
    const now = new Date();
    const datePart = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const randomNum = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
    this.formData.sku = `${prefix}${datePart}${randomNum}`;
  }

  async uploadToDrive(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.isUploading.set(true);
    const reader = new FileReader();
    
    reader.onload = async (e: any) => {
      const base64Data = e.target.result.split(',')[1];
      const payload = new URLSearchParams();
      payload.append('fileData', base64Data);
      payload.append('mimeType', file.type);
      payload.append('fileName', `採購單據_${this.formData.sku || '未命名'}_${Date.now()}.jpg`);

      try {
        const response = await fetch(this.GAS_URL, {
          method: 'POST',
          body: payload
        });
        
        const result = await response.json();
        
        if (result.success) {
          this.uploadedImages.update(imgs => [...imgs, result.url]);
        } else {
          alert('Google Drive 上傳失敗 (請檢查權限): ' + result.error);
        }
      } catch (err) {
        console.error(err);
        alert('網路錯誤，請確認 GAS 部署權限設定為「所有人」！');
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
    if (!this.formData.location || (!this.formData.productName && !this.formData.selectedProductId) || !this.formData.localPrice) {
      alert('請填寫必填欄位！');
      return;
    }

    const finalData = {
      ...this.formData,
      totalLocalCost: this.getCalculatedTotal(),
      receiptImages: this.uploadedImages(),
      createdAt: new Date().getTime(),
      status: 'pending_sync'
    };

    alert(`✅ 採購紀錄送出成功！\n貨號: ${this.formData.sku}\n總花費: ${finalData.totalLocalCost}`);
    this.clearForm();
    this.uploadedImages.set([]);
  }
}