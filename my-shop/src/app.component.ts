import { Component, inject, OnInit, computed, HostListener, signal } from '@angular/core'; // 👈 修復：補上 HostListener 和 signal
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router'; 
import { StoreService, Product, Order, CartItem } from './services/store.service';
import { environment } from './environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen flex flex-col bg-cream-50 font-sans selection:bg-brand-200 overflow-x-hidden">
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

      <nav class="bg-cream-50/80 backdrop-blur-md z-[100] px-6 py-4 border-b border-brand-100/50 transition-transform duration-300 ease-in-out"
           [ngClass]="isFullWidth ? 'relative' : 'fixed top-0 left-0 right-0 w-full'"
           [style.transform]="isHeaderHidden() ? 'translateY(-100%)' : 'translateY(0)'">
        <div class="flex justify-between items-center w-full transition-all duration-300" [ngClass]="isFullWidth ? '' : 'max-w-7xl mx-auto'">
            
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

      <main class="flex-1 w-full transition-all duration-300 flex flex-col" 
            [ngClass]="isFullWidth ? '' : 'max-w-5xl mx-auto px-4 py-4 pt-[96px]'">
        
        <div class="flex-1">
          <router-outlet></router-outlet>
        </div>

        @if (!isFullWidth) {
          <footer class="mt-20 pt-16 pb-12 border-t border-gray-200/60 text-gray-500">
            <div class="max-w-5xl mx-auto px-6 lg:px-8">
              <div class="flex flex-col md:flex-row justify-between items-start gap-10">
                
                <div class="space-y-6">
                  <h2 class="text-3xl font-black text-brand-900 tracking-widest font-mono">{{ companyInfo.name }}</h2>
                  
                  <div class="space-y-2 text-sm font-medium tracking-wide">
                    <p class="flex items-center gap-3">
                      <span class="text-gray-400 text-xs tracking-widest font-bold">EMAIL</span> 
                      <a [href]="'mailto:' + companyInfo.email" class="text-gray-600 hover:text-brand-900 transition-colors">{{ companyInfo.email }}</a>
                    </p>
                  </div>

                  <div class="pt-2">
                    <p class="text-[11px] text-gray-400 font-medium tracking-widest">
                      {{ companyInfo.fullName }} <span class="ml-2 font-mono">{{ companyInfo.taxId }}</span>
                    </p>
                  </div>
                </div>

                <div class="flex flex-col md:items-end gap-5">
                  <span class="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Follow Us</span>
                  
                  <div class="flex items-center gap-4">
                    <a [href]="companyInfo.lineUrl" target="_blank" class="w-12 h-12 bg-white rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-[#00B900] hover:text-white hover:border-[#00B900] transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-1">
                      <span class="font-black text-[10px]">LINE</span>
                    </a>

                    <a href="https://line.me/ti/g2/FbYCiTXfg4WRRxyDJDwZPg3M2G3eaW65phITdw?utm_source=invitation&utm_medium=link_copy&utm_campaign=default" target="_blank" class="w-12 h-12 bg-white rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-[#00B900] hover:text-white hover:border-[#00B900] transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-1">
                      <span class="font-black text-[10px] leading-tight text-center">社群</span>
                    </a>
                    
                    <a [href]="companyInfo.igUrl" target="_blank" class="w-12 h-12 bg-white rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-pink-500 hover:text-white hover:border-pink-500 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-1">
                      <span class="font-black text-[10px]">IG</span>
                    </a>
                  </div>
                </div>

              </div>

              <div class="mt-16 pt-6 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold text-gray-400 tracking-wider">
                <p>Copyright © {{ now | date:'yyyy' }} {{ companyInfo.name }}. All rights reserved.</p>
                <div class="flex gap-6">
                  <a routerLink="/privacy" class="hover:text-brand-900 transition-colors cursor-pointer">隱私權政策</a>
                  <a routerLink="/terms" class="hover:text-brand-900 transition-colors cursor-pointer">服務條款</a>
                </div>
              </div>
            </div>
          </footer>
        }
      </main>

    </div>
  `
})
export class AppComponent implements OnInit {
  store = inject(StoreService);
  router = inject(Router); 
  showKeyWarning = false;

  companyInfo = environment.company;
  now = new Date(); // 👈 修復：這就是剛剛導致當機的元兇，現在補上了！

  // 👇 新增：沉浸式表頭控制大腦 👇
  isHeaderHidden = signal(false);
  lastScrollTop = 0;

  // 👇 3. 升級版滾動偵測大腦 (連動次表頭) 👇
  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    const currentScroll = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    
    // 往下捲動超過 100px 時觸發隱藏
    if (currentScroll > 100 && currentScroll > this.lastScrollTop) {
      this.isHeaderHidden.set(true); 
      // 往下捲：通知次表頭滑到最頂端 (0px)
      if (typeof document !== 'undefined') document.documentElement.style.setProperty('--sub-header-top', '0px');
    } else {
      this.isHeaderHidden.set(false); 
      // 往上捲：通知次表頭回到主表頭下方 (保留 96px 空間)
      if (typeof document !== 'undefined') document.documentElement.style.setProperty('--sub-header-top', '96px');
    }
    
    this.lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
  }
  // 👆 沉浸式表頭大腦結束 👆

  get isFullWidth() {
    return this.router.url.startsWith('/admin') || this.router.url.startsWith('/buyer');
  }

  hasPendingBuyerTasks = computed(() => {
    const allOrders = this.store.orders() || [];
    const allProducts = this.store.products() || [];

    const activeOrders = allOrders.filter((o: Order) => 
      ['payment_confirmed', 'paid_verifying', 'pending_shipping'].includes(o.status)
    );

    const listMap = new Map();

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