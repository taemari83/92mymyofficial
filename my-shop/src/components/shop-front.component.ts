import { Component, computed, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, Params, RouterModule } from '@angular/router'; 
import { toSignal } from '@angular/core/rxjs-interop';
import { StoreService, Product } from '../services/store.service';

@Component({
  selector: 'app-shop-front',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule], 
  template: `
    <div class="space-y-8 pb-20">
      <div class="sticky top-20 z-10 bg-cream-50/90 backdrop-blur-md pb-4 pt-2 space-y-3">
         
         <div class="flex flex-col sm:flex-row gap-3 px-2">
           <div class="bg-white p-2 rounded-full shadow-sm border border-gray-100 flex items-center flex-1">
              <span class="pl-4 text-gray-400">🔍</span>
              <input 
                type="text" 
                [(ngModel)]="searchQuery"
                placeholder="搜尋 Winter Collection..." 
                class="flex-1 px-3 py-2 outline-none bg-transparent placeholder-gray-400 text-brand-900 text-sm"
              >
           </div>

           <div class="flex gap-2 w-full sm:w-auto">
             <div class="relative flex-1 sm:min-w-[160px]">
               <select 
                 [ngModel]="sortOption()" 
                 (ngModelChange)="sortOption.set($event)"
                 class="w-full h-full appearance-none bg-white border border-gray-100 text-brand-900 text-sm rounded-full pl-4 pr-8 py-3 outline-none focus:border-brand-300 shadow-sm font-bold cursor-pointer"
               >
                 <option value="newest">📅 上架：新到舊</option>
                 <option value="oldest">📅 上架：舊到新</option>
                 <option value="hot">🔥 熱銷排行</option>
                 <option value="price_asc">💰 價格：低到高</option>
                 <option value="price_desc">💰 價格：高到低</option>
               </select>
               <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-xs text-gray-400">▼</div>
             </div>

             <div class="flex items-center p-1 bg-white rounded-full border border-gray-100 shadow-sm shrink-0">
                <button (click)="viewMode.set('grid')" [class.bg-gray-100]="viewMode() === 'grid'" [class.text-brand-900]="viewMode() === 'grid'" [class.text-gray-400]="viewMode() !== 'grid'" class="w-10 h-10 rounded-full flex items-center justify-center transition-colors" title="宮格檢視">
                   <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                </button>
                <button (click)="viewMode.set('list')" [class.bg-gray-100]="viewMode() === 'list'" [class.text-brand-900]="viewMode() === 'list'" [class.text-gray-400]="viewMode() !== 'list'" class="w-10 h-10 rounded-full flex items-center justify-center transition-colors" title="條列檢視">
                   <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                </button>
             </div>
           </div>
         </div>
         
         <div class="flex gap-2 overflow-x-auto pb-2 custom-scrollbar px-2">
            <button 
              (click)="selectedCategory.set('all')"
              [class.bg-brand-900]="selectedCategory() === 'all'" [class.text-white]="selectedCategory() === 'all'" [class.bg-white]="selectedCategory() !== 'all'" [class.text-gray-500]="selectedCategory() !== 'all'"
              class="px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors border border-transparent shadow-sm shrink-0"
            >All</button>
            <button 
              (click)="selectedCategory.set('新品')"
              [class.bg-red-500]="selectedCategory() === '新品'" [class.text-white]="selectedCategory() === '新品'" [class.bg-white]="selectedCategory() !== '新品'" [class.text-red-500]="selectedCategory() !== '新品'"
              class="px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors border border-transparent shadow-sm shrink-0 flex items-center gap-1"
            ><span>✨</span> 本月新品</button>

            @for (cat of store.categories(); track cat) {
              @if(cat !== '新品') {
                <button 
                  (click)="selectedCategory.set(cat)"
                  [class.bg-brand-900]="selectedCategory() === cat" [class.text-white]="selectedCategory() === cat" [class.bg-white]="selectedCategory() !== cat" [class.text-gray-500]="selectedCategory() !== cat"
                  class="px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors border border-transparent shadow-sm shrink-0"
                >{{ cat }}</button>
              }
            }
         </div>
      </div>

      @if (viewMode() === 'grid') {
         <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6 px-2">
           @for (product of filteredProducts(); track product.id) {
             <div (click)="openProductModal(product)" class="bg-white rounded-[1.5rem] shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group border border-gray-50 flex flex-col cursor-pointer">
               <div class="relative aspect-[4/5] overflow-hidden bg-gray-100">
                 <img [src]="product.image" (error)="handleImageError($event)" [alt]="product.name" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700">
                 
                 <div class="absolute top-2 left-2 right-2 flex gap-1 flex-wrap">
                    @if(product.bulkDiscount?.count) { <div class="bg-red-500/90 backdrop-blur px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[9px] sm:text-[10px] font-bold text-white shadow-sm animate-pulse">任選 {{ product.bulkDiscount!.count }} 件優惠</div> }
                    @if(isNewProduct(product)) { <div class="bg-red-500/90 backdrop-blur px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[9px] sm:text-[10px] font-bold text-white shadow-sm animate-pulse">NEW</div> }
                    <div class="bg-white/90 backdrop-blur px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[9px] sm:text-[10px] font-bold text-brand-900 uppercase shadow-sm">{{ product.category }}</div>
                    @if(product.isPreorder) { <div class="bg-blue-100/90 backdrop-blur px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[9px] sm:text-[10px] font-bold text-blue-600 shadow-sm">預購</div> }
                 </div>

                 @if (product.stock <= 0) {
                   <div class="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
                      <div class="bg-white px-3 py-1 sm:px-6 py-2 rounded-full font-bold text-brand-900 text-xs sm:text-base">SOLD OUT</div>
                   </div>
                 }
               </div>

               <div class="p-3 sm:p-5 flex-1 flex flex-col">
                 <div class="flex-1">
                    <h3 class="font-bold text-brand-900 text-sm sm:text-lg leading-tight mb-1 sm:mb-2 line-clamp-2">{{ product.name }}</h3>
                    <p class="text-[10px] sm:text-sm text-gray-400 line-clamp-1 sm:line-clamp-2 mb-2 sm:mb-4">{{ product.note || 'Winter Special Selection' }}</p>
                 </div>

                 <div class="flex items-end justify-between mt-auto">
                   <div>
                      @if(getTierBadge(product)) { <span class="text-[9px] font-bold text-white bg-black px-1.5 py-0.5 rounded-full w-fit block mb-0.5">{{ getTierBadge(product) }}</span> }
                      <span class="text-sm sm:text-xl font-bold text-brand-900">NT$ {{ getPrice(product) }}</span>
                      @if(hasCustomPrice(product)) { <span class="text-[10px] text-gray-400 ml-1">起</span> }
                   </div>
                   @if(product.stock > 0) {
                     <button class="w-8 h-8 sm:w-10 sm:h-10 bg-brand-50 text-brand-900 rounded-full flex items-center justify-center group-hover:bg-brand-900 group-hover:text-white transition-colors shrink-0">
                       +
                     </button>
                   }
                 </div>
               </div>
             </div>
           } @empty {
             <div class="col-span-full py-20 text-center flex flex-col items-center justify-center">
               <div class="text-6xl mb-4">🍂</div>
               <p class="text-xl text-gray-400 font-medium">Coming Soon...</p>
             </div>
           }
         </div>
      } @else {
         <div class="flex flex-col gap-3 px-2">
           @for (product of filteredProducts(); track product.id) {
             <div (click)="openProductModal(product)" class="bg-white rounded-[1.2rem] sm:rounded-[1.5rem] shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group border border-gray-50 flex p-2.5 sm:p-4 gap-3 sm:gap-5 cursor-pointer">
               <div class="relative w-24 sm:w-32 h-28 sm:h-36 shrink-0 rounded-xl overflow-hidden bg-gray-100">
                 <img [src]="product.image" (error)="handleImageError($event)" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700">
                 @if (product.stock <= 0) {
                    <div class="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
                       <span class="bg-white px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold text-brand-900">售完</span>
                    </div>
                 }
               </div>
               
               <div class="flex-1 min-w-0 flex flex-col py-0.5 sm:py-1 justify-between pr-1">
                 <div>
                    <div class="flex gap-1.5 flex-wrap mb-1 sm:mb-1.5">
                       @if(isNewProduct(product)) { <span class="text-[9px] sm:text-[10px] text-red-500 font-bold bg-red-50 px-1.5 py-0.5 rounded">NEW</span> }
                       @if(product.isPreorder) { <span class="text-[9px] sm:text-[10px] text-blue-500 font-bold bg-blue-50 px-1.5 py-0.5 rounded">預購</span> }
                       <span class="text-[9px] sm:text-[10px] text-gray-500 font-bold bg-gray-100 px-1.5 py-0.5 rounded uppercase">{{ product.category }}</span>
                    </div>
                    <h3 class="font-bold text-brand-900 text-sm sm:text-lg leading-tight mb-1 line-clamp-2">{{ product.name }}</h3>
                    @if(product.bulkDiscount?.count) {
                       <div class="text-[10px] sm:text-xs text-red-500 font-bold line-clamp-1">🔥 任選 {{ product.bulkDiscount!.count }} 件優惠</div>
                    }
                 </div>
                 
                 <div class="flex items-end justify-between">
                    <div>
                       @if(getTierBadge(product)) { <div class="text-[9px] font-bold text-white bg-black px-1.5 py-0.5 rounded w-fit mb-0.5">{{ getTierBadge(product) }}</div> }
                       <div class="font-black text-brand-900 text-base sm:text-xl">NT$ {{ getPrice(product) }} @if(hasCustomPrice(product)) { <span class="text-xs text-gray-400 font-normal">起</span> }</div>
                    </div>
                    @if(product.stock > 0) {
                      <button class="w-8 h-8 sm:w-10 sm:h-10 bg-brand-50 text-brand-900 rounded-full flex items-center justify-center group-hover:bg-brand-900 group-hover:text-white transition-colors shadow-sm text-lg">
                        +
                      </button>
                    }
                 </div>
               </div>
             </div>
           } @empty {
             <div class="py-20 text-center flex flex-col items-center justify-center w-full">
               <div class="text-6xl mb-4">🍂</div>
               <p class="text-xl text-gray-400 font-medium">Coming Soon...</p>
             </div>
           }
         </div>
      }

      @if (store.cartCount() > 0) {
        <a routerLink="/checkout" class="fixed bottom-6 right-6 z-40 bg-brand-900 text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform cursor-pointer animate-bounce-in border-none outline-none text-decoration-none">
          <div class="relative pointer-events-none">
            <span class="text-3xl">👜</span>
            <span class="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white">{{ store.cartCount() }}</span>
          </div>
        </a>
      }

      @if (selectedProduct()) {
        <div class="fixed top-0 left-0 right-0 bottom-0 z-[100] flex flex-col md:flex-row md:items-center justify-center p-0 md:p-6 bg-white md:bg-black/70 md:backdrop-blur-md">
          
          <div class="bg-white w-full h-full md:max-w-5xl md:rounded-[2.5rem] md:shadow-2xl overflow-hidden animate-slide-up md:animate-fade-in md:h-auto md:max-h-[90vh] flex flex-col md:flex-row relative">
            
            <div class="md:w-1/2 bg-white relative group flex flex-col h-[45%] md:h-auto shrink-0 border-b md:border-b-0 md:border-r border-gray-100">
               <div class="flex-1 relative overflow-hidden bg-gray-50 p-2 md:p-4">
                  <img [src]="activeImage()" (error)="handleImageError($event)" class="absolute inset-0 w-full h-full object-contain mix-blend-multiply">
                  <button (click)="closeModal()" class="md:hidden absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur rounded-full text-gray-800 flex items-center justify-center font-bold hover:bg-gray-200 transition-colors z-20 shadow-sm border border-gray-100">✕</button>
               </div>
               @if(productImages().length > 1) {
                  <div class="p-3 md:p-4 bg-white border-t border-gray-100 flex gap-2 overflow-x-auto custom-scrollbar shrink-0">
                     @for(img of productImages(); track $index) {
                        <button (click)="activeImage.set(img)" class="w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all shadow-sm bg-gray-50" [class.border-brand-900]="activeImage() === img" [class.border-transparent]="activeImage() !== img">
                           <img [src]="img" (error)="handleImageError($event)" class="w-full h-full object-cover">
                        </button>
                     }
                  </div>
               }
            </div>

            <div class="md:w-1/2 flex flex-col flex-1 min-h-0 bg-white relative">
               <button (click)="closeModal()" class="hidden md:flex absolute top-6 right-6 w-10 h-10 bg-gray-100 rounded-full text-gray-500 items-center justify-center hover:bg-gray-200 transition-colors z-20">✕</button>

               <div class="flex-1 overflow-y-auto p-5 md:p-8 custom-scrollbar pb-6 md:pb-10 bg-white">
                  <div class="mb-6">
                    <div class="flex justify-between items-start mb-2 pr-10">
                      <div class="flex flex-wrap gap-2">
                         @if(selectedProduct()!.bulkDiscount?.count) { <div class="text-sm text-red-500 font-bold tracking-widest bg-red-50 px-2 py-1 rounded-lg flex items-center gap-1 animate-pulse">🔥 多件優惠</div> }
                         @if(isNewProduct(selectedProduct()!)) { <div class="text-sm text-red-500 font-bold uppercase tracking-widest bg-red-50 px-2 py-1 rounded-lg flex items-center gap-1">✨ NEW</div> }
                         <div class="text-sm text-brand-400 font-bold uppercase tracking-widest bg-brand-50 px-2 py-1 rounded-lg">{{ selectedProduct()!.category }}</div>
                         @if(selectedProduct()!.isPreorder) { <div class="text-sm text-blue-500 font-bold tracking-widest bg-blue-50 px-2 py-1 rounded-lg">預購</div> }
                      </div>
                      <button (click)="copyLink()" class="flex items-center gap-1 text-xs text-gray-400 hover:text-brand-900 transition-colors border border-gray-200 rounded-full px-3 py-1 bg-white shrink-0"><span>🔗</span> 複製</button>
                    </div>
                    <h2 class="text-2xl md:text-3xl font-black text-gray-800 leading-tight mb-2">{{ selectedProduct()!.name }}</h2>
                    
                    <div class="flex items-end gap-3 mt-3 border-b border-gray-100 pb-4 transition-all">
                       <div class="text-3xl font-black text-brand-900 tracking-tight">NT$ {{ currentDisplayPrice() | number }}</div>
                       @if(getTierBadge(selectedProduct()!)) { <div class="text-sm bg-black text-white px-3 py-1 rounded-full font-bold mb-1">{{ getTierBadge(selectedProduct()!) }}</div> }
                    </div>
                  </div>

                  <div class="bg-brand-50/60 rounded-[1.5rem] p-5 md:p-6 mb-6 border border-brand-100/50">
                      @if (selectedProduct()!.options.length > 0) {
                        <div class="mb-6">
                          <div class="flex items-center justify-between mb-3">
                             <label class="text-sm font-bold text-gray-800">選擇規格或方案</label>
                             @if(selectedOption()) { <span class="text-xs text-brand-600 font-bold bg-white px-2 py-1 rounded-md shadow-sm border border-brand-100 animate-fade-in">{{ getOptName(selectedOption()) }}</span> }
                          </div>
                          
                          @if (hasCustomPriceOptions()) {
                            <div class="flex flex-col gap-2.5">
                              @for (rawOpt of selectedProduct()!.options; track rawOpt) {
                                <button 
                                  (click)="selectedOption.set(rawOpt)"
                                  class="w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between text-left relative overflow-hidden"
                                  [class.border-brand-400]="selectedOption() === rawOpt" [class.bg-white]="selectedOption() === rawOpt" [class.shadow-md]="selectedOption() === rawOpt"
                                  [class.border-gray-200]="selectedOption() !== rawOpt" [class.bg-white]="selectedOption() !== rawOpt" [class.hover:border-brand-300]="selectedOption() !== rawOpt"
                                >
                                  @if(selectedOption() === rawOpt) { <div class="absolute top-0 left-0 w-1 h-full bg-brand-400"></div> }
                                  <span class="font-bold text-gray-800 pr-4 break-words whitespace-normal">{{ getOptName(rawOpt) }}</span>
                                  <span class="font-black text-brand-900 text-lg shrink-0">NT$ {{ getOptPrice(rawOpt) | number }}</span>
                                </button>
                              }
                            </div>
                          } @else {
                            <div class="flex flex-wrap gap-2.5">
                              @for (rawOpt of selectedProduct()!.options; track rawOpt) {
                                <button 
                                  (click)="selectedOption.set(rawOpt)"
                                  class="px-4 py-2 md:px-5 md:py-2.5 rounded-xl text-sm md:text-base font-bold transition-all shadow-sm active:scale-95 text-center relative overflow-hidden break-words whitespace-normal h-auto min-h-[48px] flex items-center justify-center"
                                  [class.bg-brand-900]="selectedOption() === rawOpt" [class.text-white]="selectedOption() === rawOpt" [class.ring-2]="selectedOption() === rawOpt" [class.ring-brand-200]="selectedOption() === rawOpt"
                                  [class.bg-white]="selectedOption() !== rawOpt" [class.text-gray-600]="selectedOption() !== rawOpt" [class.border]="selectedOption() !== rawOpt" [class.border-gray-200]="selectedOption() !== rawOpt" [class.hover:border-brand-300]="selectedOption() !== rawOpt"
                                >
                                  {{ rawOpt }}
                                </button>
                              }
                            </div>
                          }
                        </div>
                      }

                      <div>
                         <label class="block text-sm font-bold text-gray-800 mb-2">購買數量</label>
                         <div class="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-1.5 shadow-sm w-full">
                           <button (click)="qty.set(qty() > 1 ? qty() - 1 : 1)" class="w-14 h-14 flex items-center justify-center text-gray-400 hover:text-brand-900 hover:bg-gray-100 rounded-lg text-2xl transition-colors font-bold disabled:opacity-30" [disabled]="qty() <= 1"><span class="mb-1">-</span></button>
                           <span class="flex-1 text-center font-black text-brand-900 text-2xl select-none">{{ qty() }}</span>
                           <button (click)="qty.set(qty() + 1)" class="w-14 h-14 flex items-center justify-center text-gray-400 hover:text-brand-900 hover:bg-gray-100 rounded-lg text-2xl transition-colors font-bold"><span class="mb-1">+</span></button>
                         </div>
                      </div>
                  </div>

                  <div class="text-gray-500 leading-relaxed text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <h4 class="font-bold text-gray-800 mb-2 text-xs uppercase tracking-wide">商品介紹</h4>
                    <p class="whitespace-pre-wrap">{{ selectedProduct()!.note || '這是一個非常棒的商品，來自我們精選的 Winter Collection。' }}</p>
                  </div>
               </div>

               <div class="p-4 md:p-6 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-gray-100 bg-white z-20 relative shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
                  @if (!store.currentUser()) {
                     <button 
                       (click)="store.loginWithGoogle()"
                       class="w-full py-4 bg-gray-800 text-white rounded-2xl font-bold text-lg shadow-xl shadow-gray-800/20 hover:bg-black hover:scale-[1.01] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                     >
                       <span>👤</span> 登入會員以加入購物車
                     </button>
                  } @else {
                     <button 
                       (click)="addToCart()"
                       [disabled]="selectedProduct()!.options.length > 0 && !selectedOption()"
                       class="w-full py-4 bg-brand-900 text-white rounded-2xl font-bold text-xl shadow-xl shadow-brand-900/20 hover:bg-black hover:scale-[1.01] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-between px-6 group"
                     >
                       <div class="flex flex-col items-start">
                          <span class="text-[10px] text-white/60 font-medium uppercase tracking-wider">Total</span>
                          <span class="text-xl font-mono">NT$ {{ currentDisplayPrice() * qty() | number }}</span>
                       </div>
                       <div class="flex items-center gap-2">
                          <span>加入購物車</span>
                          <span class="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center text-base group-hover:translate-x-1 transition-transform group-hover:bg-white group-hover:text-brand-900">→</span>
                       </div>
                     </button>
                  }
               </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; border-radius: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
    .animate-fade-in { animation: fadeIn 0.2s ease-out; }
    .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    .animate-bounce-in { animation: bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
    @keyframes bounceIn { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.1); } 100% { transform: scale(1); opacity: 1; } }
  `]
})
export class ShopFrontComponent {
  store = inject(StoreService);
  router: Router = inject(Router);
  route: ActivatedRoute = inject(ActivatedRoute);
  
  searchQuery = signal('');
  selectedCategory = signal<string>('all');
  sortOption = signal<'hot'|'price_asc'|'price_desc'|'newest'|'oldest'>('newest');
  viewMode = signal<'grid' | 'list'>('grid');

  selectedProduct = signal<Product | null>(null);
  selectedOption = signal<string>('');
  qty = signal(1);
  activeImage = signal(''); 

  queryParams = toSignal(this.route.queryParams, { initialValue: {} as Params });

  constructor() {
    effect(() => {
       const params = this.queryParams();
       const pId = params?.['p'];
       const allProducts = this.store.products();

       if (pId && allProducts.length > 0) {
          if (this.selectedProduct()?.id !== pId) {
             const found = allProducts.find(x => x.id === pId);
             if (found) {
                this.selectedProduct.set(found);
                this.activeImage.set(found.image);
             }
          }
       } else if (!pId && this.selectedProduct()) {
          this.selectedProduct.set(null);
       }
    }, { allowSignalWrites: true });

    effect(() => {
       if (typeof document !== 'undefined') {
          if (this.selectedProduct()) {
             document.body.style.overflow = 'hidden';
          } else {
             document.body.style.overflow = '';
          }
       }
    });
  }

  // 🔥 修正：為了避開 Angular 模板對 arrow function 的限制，把判斷獨立成函數
  hasCustomPrice(p: Product): boolean {
    return p?.options?.some(opt => opt.includes('=')) || false;
  }

  // 解析選項名稱 (去掉 = 跟價格)
  getOptName(opt: string): string {
    return opt.includes('=') ? opt.split('=')[0].trim() : opt;
  }

  // 解析選項獨立價格
  getOptPrice(opt: string): number {
    const p = this.selectedProduct();
    if (!p) return 0;
    if (opt.includes('=')) {
      return parseInt(opt.split('=')[1].trim(), 10) || this.getPrice(p);
    }
    return this.getPrice(p);
  }

  // 判斷當前選中商品是否有設定獨立價格的規格
  hasCustomPriceOptions = computed(() => {
    const p = this.selectedProduct();
    return p ? this.hasCustomPrice(p) : false;
  });

  // 目前畫面該顯示的總單價 (根據選擇的選項變動)
  currentDisplayPrice = computed(() => {
    const p = this.selectedProduct();
    if (!p) return 0;
    const opt = this.selectedOption();
    if (opt) return this.getOptPrice(opt);
    return this.getPrice(p);
  });

  productImages = computed(() => {
     const p = this.selectedProduct();
     if (!p) return [];
     return p.images && p.images.length > 0 ? p.images : [p.image];
  });

  isNewProduct(p: Product): boolean {
    if (!p.code || p.code.length < 5) return false;
    const productYear = p.code.substring(1, 3);
    const productMonth = p.code.substring(3, 5);
    const now = new Date();
    const currentYear = String(now.getFullYear()).slice(-2);
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    return productYear === currentYear && productMonth === currentMonth;
  }

  filteredProducts = computed(() => {
    let list = [...this.store.visibleProducts()]; 
    const query = this.searchQuery().toLowerCase();
    const cat = this.selectedCategory();
    const sort = this.sortOption();

    if (query) list = list.filter(p => p.name.toLowerCase().includes(query));
    if (cat === '新品') {
       list = list.filter(p => this.isNewProduct(p));
    } else if (cat !== 'all') {
       list = list.filter(p => p.category === cat);
    }
    
    switch (sort) {
      case 'newest': list = list.reverse(); break;
      case 'oldest': break;
      case 'hot': list.sort((a, b) => b.soldCount - a.soldCount); break;
      case 'price_asc': list.sort((a, b) => this.getPrice(a) - this.getPrice(b)); break;
      case 'price_desc': list.sort((a, b) => this.getPrice(b) - this.getPrice(a)); break;
    }
    return list;
  });

  getPrice(p: Product): number {
     const user = this.store.currentUser();
     if (user?.tier === 'wholesale' && p.priceWholesale > 0) return p.priceWholesale;
     if (user?.tier === 'vip' && p.priceVip > 0) return p.priceVip;
     return p.priceGeneral;
  }
  
  getTierBadge(p: Product): string {
     const user = this.store.currentUser();
     if (user?.tier === 'wholesale' && p.priceWholesale > 0) return '批發價';
     if (user?.tier === 'vip' && p.priceVip > 0) return 'VIP價';
     return '';
  }

  openProductModal(p: Product) {
    this.router.navigate([], { queryParams: { p: p.id } });
    this.selectedOption.set('');
    this.qty.set(1);
  }

  closeModal() {
    this.router.navigate([], { queryParams: { p: null } });
  }

  handleImageError(event: any) {
    event.target.className = 'absolute inset-0 w-full h-full object-cover';
    event.target.src = 'https://placehold.co/400x500?text=No+Image';
  }

  copyLink() {
     const url = window.location.href;
     navigator.clipboard.writeText(url).then(() => alert('連結已複製！'));
  }

  addToCart() {
    const p = this.selectedProduct();
    if (!p) return;
    const opt = p.options.length > 0 ? this.selectedOption() : '單一規格';
    if (p.options.length > 0 && !opt) return;
    this.store.addToCart(p, opt, this.qty());
    this.closeModal();
    const div = document.createElement('div');
    div.className = 'fixed top-6 left-1/2 -translate-x-1/2 bg-brand-900 text-white px-6 py-3 rounded-full shadow-2xl z-[60] text-sm font-bold animate-fade-in flex items-center gap-2';
    div.innerHTML = '<span>👜</span> 已加入購物車';
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 2000);
  }
}