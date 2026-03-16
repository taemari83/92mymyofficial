import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../services/store.service';

@Component({
  selector: 'app-buyer-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 pb-20 font-sans selection:bg-brand-200">
      <nav class="bg-white sticky top-0 z-40 px-4 py-3 border-b border-gray-200 shadow-sm flex items-center justify-between">
        <h1 class="text-xl font-black text-brand-900 tracking-wide">📦 新增採購建檔</h1>
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
              <select [(ngModel)]="formData.country" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-brand-400">
                <option value="韓國">🇰🇷 韓國</option>
                <option value="日本">🇯🇵 日本</option>
                <option value="中國">🇨🇳 中國</option>
                <option value="台灣">🇹🇼 台灣 (買手)</option>
              </select>
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

          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1">商品名稱</label>
            <input type="text" [(ngModel)]="formData.productName" placeholder="輸入完整商品名稱" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-400 focus:bg-white transition-colors">
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
              <div class="w-full p-3 bg-brand-900 text-white rounded-xl text-sm font-mono font-black text-center shadow-inner flex items-center justify-center h-[46px]">
                {{ formData.sku || '尚未給號' }}
              </div>
            </div>
          </div>
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
              <div class="text-xl font-black text-red-600">{{ calculatedTotal() | number }}</div>
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
            <div class="flex items-center gap-2">
              <span class="text-lg">📸</span><h2 class="font-bold text-gray-800">實拍與收據</h2>
            </div>
            <span class="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded font-bold">容量無限</span>
          </div>

          <div class="flex flex-wrap gap-2">
            @for(img of uploadedImages(); track $index) {
              <div class="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                <img [src]="img" class="w-full h-full object-cover">
                <button (click)="removeImage($index)" class="absolute top-1 right-1 bg-black/60 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">✕</button>
              </div>
            }
            
            <label class="w-20 h-20 rounded-xl border-2 border-dashed border-brand-300 bg-brand-50 text-brand-600 flex flex-col items-center justify-center cursor-pointer hover:bg-brand-100 transition-colors active:scale-95" [class.opacity-50]="isUploading()">
              @if(isUploading()) {
                <span class="animate-spin text-xl mb-1">⏳</span>
                <span class="text-[10px] font-bold">上傳中...</span>
              } @else {
                <span class="text-2xl mb-1">+</span>
                <span class="text-[10px] font-bold">新增照片</span>
                <input type="file" accept="image/*" class="hidden" (change)="uploadToDrive($event)" [disabled]="isUploading()">
              }
            </label>
          </div>
          <p class="text-[10px] text-gray-400">* 照片將自動備份至公司 Google Drive，不佔用系統空間</p>
        </div>

        <button (click)="submitPurchase()" class="w-full py-4 bg-black text-white rounded-2xl font-black tracking-widest text-lg shadow-xl hover:bg-gray-800 transition-transform active:scale-95 flex items-center justify-center gap-2 mt-4">
          <span>📤</span> 確認建檔並送出
        </button>

      </main>
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class BuyerFormComponent {
  store = inject(StoreService);
  
  // 你的 Google Apps Script 網址 (從你提供的 URL 放入)
  readonly GAS_URL = 'https://script.google.com/macros/s/AKfycbzSqZFXKWlmeI4WLkE8iBYrbGWfeWxVJigl-zOLMhUQVlVv5_qW9OpLJZenLElZqhNZxA/exec';

  isUploading = signal(false);
  uploadedImages = signal<string[]>([]);

  formData = {
    date: new Date().toISOString().split('T')[0],
    country: '韓國',
    location: '',
    productName: '',
    category: '',
    sku: '',
    localPrice: null as number | null,
    quantity: 1,
    localShipping: 0,
    payer: '藝辰',
    shareMode: '親帶',
  };

  // 自動計算總支出
  calculatedTotal = computed(() => {
    const price = Number(this.formData.localPrice) || 0;
    const qty = Number(this.formData.quantity) || 1;
    const shipping = Number(this.formData.localShipping) || 0;
    return (price * qty) + shipping;
  });

  // 自動生成 SKU 邏輯 (借用你們系統現有的 categoryCodes 設定)
  generateSku() {
    const cat = this.formData.category;
    if (!cat) return;
    
    // 從 StoreService 抓取類別代碼 (例如 美妝 -> M)
    const codeMap = this.store.settings().categoryCodes || {};
    const prefix = codeMap[cat] || 'Z'; 
    
    // 生成 YYMMDD
    const now = new Date();
    const datePart = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    
    // 產生隨機 3 碼流水號 (實務上可以改為向 Firebase 請求當日最新號碼)
    const randomNum = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
    
    this.formData.sku = `${prefix}${datePart}${randomNum}`;
  }

  // 🚀 核心功能：上傳照片到 Google Drive
  async uploadToDrive(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.isUploading.set(true);
    const reader = new FileReader();
    
    reader.onload = async (e: any) => {
      // 擷取 Base64 的純字串部分
      const base64Data = e.target.result.split(',')[1];
      
      // 使用 URLSearchParams 打包，避免 CORS 被擋
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
          // 上傳成功，將 Google Drive 網址塞進陣列顯示
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
      
      // 清空 input
      event.target.value = '';
    };

    reader.readAsDataURL(file);
  }

  removeImage(index: number) {
    this.uploadedImages.update(imgs => imgs.filter((_, i) => i !== index));
  }

  // 送出表單到 Firebase (後續串接 StoreService)
  async submitPurchase() {
    if (!this.formData.location || !this.formData.productName || !this.formData.localPrice) {
      alert('請填寫必填欄位 (購買地點、商品名稱、單價)！');
      return;
    }

    const finalData = {
      ...this.formData,
      totalLocalCost: this.calculatedTotal(),
      receiptImages: this.uploadedImages(),
      createdAt: new Date().getTime(),
      status: 'pending_sync' // 等待管理員確認上架
    };

    console.log('準備寫入資料庫：', finalData);
    
    // 這裡呼叫你的 Firebase 寫入邏輯
    // await this.store.addPurchaseRecord(finalData);
    
    alert(`✅ 採購紀錄送出成功！\n貨號: ${this.formData.sku}\n總花費: ${finalData.totalLocalCost}`);
    
    // 清空表單
    this.formData.productName = '';
    this.formData.localPrice = null;
    this.formData.sku = '';
    this.uploadedImages.set([]);
  }
}