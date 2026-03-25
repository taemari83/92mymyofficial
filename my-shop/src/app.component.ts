import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { StoreService, Product, Order, CartItem } from './services/store.service';
import { environment } from './environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen flex flex-col bg-cream-50 font-sans selection:bg-brand-200">
      @if (showKeyWarning) {
        <div class="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
           <div class="bg-white rounded-2xl p-8 max-w-md text-center shadow-2xl border-4 border-red-500">
              <div class="text-6xl mb-4">⚠️</div>
              <h2 class="text-2xl font-black text-red-600 mb-2">系統未連線</h2>
              <p class="text-gray-600 mb-6 font-bold">
                 檢測到 Firebase API Key 尚未設定。<br>
                 網站無法讀取商品或會員資料。
              </p>
              <div class="bg-gray-100 p-4 rounded-xl text-left text-sm text-gray-500 font-mono mb-6 break-all">
                 請開啟檔案：<br>
                 <span class="text-brand-900 font-bold">src/environments/environment.ts</span>
                 <br><br>
                 並填入您的 Firebase Config。
              </div>
              <button (click)="showKeyWarning = false" class="text-gray-400 text-sm underline hover:text-gray-600">
                 我只是先看看介面 (關閉警告)
              </button>
           </div>
        </div>
      }

      <nav class="bg-cream-50/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 border-b border-brand-100/50">
        <div class="max-w-7xl mx-auto flex justify-between items-center">
            
            <a routerLink="/" class="flex items-center shrink-0">
              <img src="https://www.flickr.com/photo_download.gne?id=55130020426&secret=082f93679c&size=l&source=photoPageEngagement" alt="92mymy Logo" class="h-16 sm:h-20 w-auto object-contain mix-blend-multiply hover:scale-105 transition-transform duration-300">
            </a>

            <div class="flex items-center gap-1 bg-white p-1.5 rounded-full border border-gray-100 shadow-sm">
              <a routerLink="/" routerLinkActive="bg-brand-900 text-white" [routerLinkActiveOptions]="{exact: true}" class="px-5 py-2 rounded-full text-sm font-bold transition-all hover:bg-brand-50 text-brand-900">
                首頁
              </a>
              
              <a routerLink="/member" routerLinkActive="bg-brand-900 text-white" class="px-5 py-2 rounded-full text-sm font-bold transition-all hover:bg-brand-50 text-brand-900">
               會員
              </a>

              @if (!store.currentUser()?.isAdmin) {
                 <a routerLink="/cart" routerLinkActive="bg-brand-900 text-white" class="px-5 py-2 rounded-full text-sm font-bold transition-all hover:bg-brand-50 text-brand-900 flex items-center gap-2">
                  購物車
                  @if (store.cartCount() > 0) { <span class="bg-brand-900 text-white text-[10px] px-1.5 py-0.5 rounded-full">{{ store.cartCount() }}</span> }
                </a>
              }

              @if (store.currentUser()?.isAdmin) {
                 <a routerLink="/admin" routerLinkActive="bg-brand-900 text-white" class="px-5 py-2 rounded-full text-sm font-bold transition-all hover:bg-brand-50 text-brand-900">
                  後台
                </a>
                 <a routerLink="/buyer" routerLinkActive="bg-brand-900 text-white" class="relative px-5 py-2 rounded-full text-sm font-bold transition-all hover:bg-brand-50 text-brand-900">
                  採購
                  @if(hasPendingBuyerTasks()) {
                     <span class="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white animate-pulse"></span>
                  } @else {
                     <span class="absolute top-1 right-1 w-2.5 h-2.5 bg-green-400 rounded-full border border-white"></span>
                  }
                </a>
              }
            </div>
        </div>
      </nav>

      <main class="flex-1 max-w-5xl w-full mx-auto px-4 py-4">
        <router-outlet></router-outlet>
      </main>

      </div>
  `
})
export class AppComponent implements OnInit {
  store = inject(StoreService);
  showKeyWarning = false;

  // 🧠 買手紅綠燈終極大腦：只有在「需買 > 已買」時才亮紅燈，買齊就亮綠燈！
  hasPendingBuyerTasks = computed(() => {
    const allOrders = this.store.orders() || [];
    const allProducts = this.store.products() || [];

    // 抓出「客人已付款 / 待對帳」需要叫貨的訂單
    const activeOrders = allOrders.filter((o: Order) => 
      ['payment_confirmed', 'paid_verifying', 'pending_shipping'].includes(o.status)
    );

    const listMap = new Map();

    // 重新精算現在總共缺什麼
    activeOrders.forEach((order: Order) => {
      (order.items || []).forEach((item: CartItem) => {
        const optionName = item.option || '單一規格';
        const key = `${item.productId}_${optionName}`;

        if (!listMap.has(key)) {
          const product = allProducts.find((p: Product) => p.id === item.productId);
          listMap.set(key, {
            needed: 0,
            procured: (product as any)?.procured?.[optionName] || 0
          });
        }
        listMap.get(key).needed += (item.quantity || 1);
      });
    });

    const procurementList = Array.from(listMap.values());
    
    // 只要有任何一個商品的「需買數量 > 已買數量」，就回傳 true (亮紅燈)
    if (!procurementList || procurementList.length === 0) return false;
    return procurementList.some((item: any) => item.needed > item.procured);
  });

  constructor() {
    if (environment.firebase.apiKey.includes('請在此填入')) {
       this.showKeyWarning = true;
    }
  }

  ngOnInit() {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    if (/Line/i.test(userAgent)) {
      const currentUrl = window.location.href;
      if (!currentUrl.includes('openExternalBrowser=1')) {
        const separator = currentUrl.includes('?') ? '&' : '?';
        const newUrl = currentUrl + separator + 'openExternalBrowser=1';
        window.location.href = newUrl;
      }
    }
  }
}