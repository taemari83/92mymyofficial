import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { StoreService } from './services/store.service';
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
            
            <a routerLink="/" class="text-left group cursor-pointer block">
              <h1 class="text-xl font-black text-brand-900 tracking-tighter leading-none group-hover:opacity-70 transition-opacity">92mymy<br>就愛買買</h1>
            </a>

            <div class="flex items-center gap-1 bg-white p-1.5 rounded-full border border-gray-100 shadow-sm">
              <a 
                routerLink="/" 
                routerLinkActive="bg-brand-900 text-white"
                [routerLinkActiveOptions]="{exact: true}"
                class="px-5 py-2 rounded-full text-sm font-bold transition-all hover:bg-brand-50 text-brand-900"
              >
                首頁
              </a>
              
              <a 
                routerLink="/member" 
                routerLinkActive="bg-brand-900 text-white"
                class="px-5 py-2 rounded-full text-sm font-bold transition-all hover:bg-brand-50 text-brand-900 relative"
              >
                會員
                @if(store.currentUser()) {
                  <span class="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full border border-white"></span>
                }
              </a>

              @if (!store.currentUser()?.isAdmin) {
                 <a 
                  routerLink="/cart" 
                  routerLinkActive="bg-brand-900 text-white"
                  class="px-5 py-2 rounded-full text-sm font-bold transition-all hover:bg-brand-50 text-brand-900 flex items-center gap-2"
                >
                  購物車
                  @if (store.cartCount() > 0) {
                    <span class="bg-brand-900 text-white text-[10px] px-1.5 py-0.5 rounded-full">{{ store.cartCount() }}</span>
                  }
                </a>
              }

              @if (store.currentUser()?.isAdmin) {
                 <a 
                  routerLink="/admin" 
                  routerLinkActive="bg-brand-900 text-white"
                  class="px-5 py-2 rounded-full text-sm font-bold transition-all hover:bg-brand-50 text-brand-900"
                >
                  後台
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
export class AppComponent {
  store = inject(StoreService);
  showKeyWarning = false;

  constructor() {
    // Safety check for Firebase Configuration
    if (environment.firebase.apiKey.includes('請在此填入')) {
       this.showKeyWarning = true;
    }
  }
}