import { Component, computed, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, Params, RouterModule } from '@angular/router'; 
import { toSignal } from '@angular/core/rxjs-interop';
import { StoreService, Product } from '../services/store.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-shop-front',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule], 
  template: `
<div class="space-y-4 sm:space-y-8 pb-20">
      
      <div class="flex items-center justify-end gap-2 px-3 pt-4 sm:pt-2 sm:px-4 animate-fade-in">
        
        <a href="https://instagram.com/92mymy_official" target="_blank" class="flex items-center justify-center px-3 py-1.5 sm:px-4 sm:py-2 bg-white text-gray-600 border border-gray-200 rounded-full font-bold text-[10px] sm:text-xs hover:text-white hover:border-transparent hover:bg-gradient-to-tr hover:from-yellow-400 hover:via-pink-500 hover:to-purple-500 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 text-decoration-none">
           <span class="hidden sm:inline">Instagram</span><span class="sm:hidden">IG</span>
        </a>
        
        <a href="https://lin.ee/3rHhZWz" target="_blank" class="flex items-center justify-center px-3 py-1.5 sm:px-4 sm:py-2 bg-white text-gray-600 border border-gray-200 rounded-full font-bold text-[10px] sm:text-xs hover:text-white hover:border-[#00B900] hover:bg-[#00B900] transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 text-decoration-none">
           官方 LINE
        </a>
        
        <a href="https://line.me/ti/g2/FbYCiTXfg4WRRxyDJDwZPg3M2G3eaW65phITdw?utm_source=invitation&utm_medium=link_copy&utm_campaign=default" target="_blank" class="flex items-center justify-center px-3 py-1.5 sm:px-4 sm:py-2 bg-white text-gray-600 border border-gray-200 rounded-full font-bold text-[10px] sm:text-xs hover:text-white hover:border-[#00B900] hover:bg-[#00B900] transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 text-decoration-none">
           LINE 社群
        </a>
      </div>

      <div class="sticky top-0 md:top-20 z-[60] bg-[#FDFBF9] pb-4 pt-2 space-y-3 border-b border-gray-100 shadow-sm">        
         <div class="flex flex-col sm:flex-row gap-3 px-2">
           <div class="bg-white p-2 rounded-full shadow-sm border border-gray-100 flex items-center flex-1">
              <span class="pl-4 text-gray-400">🔍</span>
              <input 
                type="text" 
                [(ngModel)]="searchQuery"
                placeholder="搜尋" 
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
                 <option value="newest">  上架：新到舊</option>
                 <option value="oldest">  上架：舊到新</option>
                 <option value="hot">  熱銷排行</option>
                 <option value="price_asc">  價格：低到高</option>
                 <option value="price_desc">  價格：高到低</option>
               </select>
               <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-xs text-gray-400">▼</div>
             </div>

             <div class="flex items-center p-1 bg-white rounded-full border border-gray-100 shadow-sm shrink-0">
                <button (click)="viewMode.set('grid')" [class.bg-gray-100]="viewMode() === 'grid'" [class.text-brand-900]="viewMode() === 'grid'" [class.text-gray-400]="viewMode() !== 'grid'" class="w-10 h-10 rounded-full flex items-center justify-center transition-colors" title="宮格檢視">
                   <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                </button>
                <button (click)="viewMode.set('list')" [class.bg-gray-100]="viewMode() === 'list'" [class.text-brand-900]="viewMode() === 'list'" [class.text-gray-400]="viewMode() !== 'list'" class="w-10 h-10 rounded-full flex items-center justify-center transition-colors" title="條列檢視">
                   <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                </button>
             </div>
           </div>
         </div>
         
         <div class="flex gap-2 overflow-x-auto pb-2 custom-scrollbar px-2">
            <button 
              (click)="selectedCategory.set('all'); selectedSubCategory.set('全部')"
              [class.bg-brand-900]="selectedCategory() === 'all'" [class.text-white]="selectedCategory() === 'all'" [class.bg-white]="selectedCategory() !== 'all'" [class.text-gray-500]="selectedCategory() !== 'all'"
              class="px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors border border-transparent shadow-sm shrink-0"
            >All</button>
            <button 
              (click)="selectedCategory.set('新品'); selectedSubCategory.set('全部')"
              [class.bg-red-500]="selectedCategory() === '新品'" [class.text-white]="selectedCategory() === '新品'" [class.bg-white]="selectedCategory() !== '新品'" [class.text-red-500]="selectedCategory() !== '新品'"
              class="px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors border border-transparent shadow-sm shrink-0 flex items-center gap-1"
            ><span>✨</span> 本月新品</button>

            @for (cat of store.categories(); track cat) {
              @if(cat !== '新品') {
                <button 
                  (click)="selectedCategory.set(cat); selectedSubCategory.set('全部')"
                  [class.bg-brand-900]="selectedCategory() === cat" [class.text-white]="selectedCategory() === cat" [class.bg-white]="selectedCategory() !== cat" [class.text-gray-500]="selectedCategory() !== cat"
                  class="px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors border border-transparent shadow-sm shrink-0"
                >{{ cat }}</button>
              }
            }
         </div>

         @if (currentSubCategories().length > 0) {
            <div class="flex gap-2 overflow-x-auto pb-1 custom-scrollbar px-2 animate-fade-in">
              @for (sub of currentSubCategories(); track sub) {
                <button 
                  (click)="selectedSubCategory.set(sub)"
                  [class.bg-gray-800]="selectedSubCategory() === sub" [class.text-white]="selectedSubCategory() === sub" [class.bg-white]="selectedSubCategory() !== sub" [class.text-gray-500]="selectedSubCategory() !== sub"
                  class="px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border border-gray-100 shadow-sm shrink-0"
                >{{ sub }}</button>
              }
            </div>
         }
      </div>

      @if (viewMode() === 'grid') {
         <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6 px-2">
           @for (product of filteredProducts(); track product.id) {
             <div (click)="openProductModal(product)" class="bg-white rounded-[1.5rem] shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group border border-gray-50 flex flex-col cursor-pointer">
               <div class="relative aspect-[4/5] overflow-hidden bg-white border-b border-gray-50">
                 
                 @if(isYT(product.image)) {
                    <img loading="lazy" [src]="getYTThumbnail(product.image)" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700">
                    <div class="absolute inset-0 bg-black/20 flex items-center justify-center"><span class="text-white text-3xl drop-shadow-md">▶</span></div>
                 } @else if(isEmbedVideo(product.image)) {
                    <div class="absolute inset-0 w-full h-full overflow-hidden bg-black pointer-events-none">
                       <iframe [src]="getSafeEmbedUrl(product.image)" [class]="isIG(product.image) ? 'absolute w-full h-[calc(100%+240px)] -top-[120px] left-0 scale-[1.55] origin-center' : 'absolute inset-0 w-full h-full'" frameborder="0" allow="autoplay; fullscreen; picture-in-picture"></iframe>
                    </div>
                 } @else if(isVideo(product.image)) {
                    <video [src]="product.image" autoplay muted loop playsinline class="absolute inset-0 w-full h-full object-cover pointer-events-none group-hover:scale-105 transition-transform duration-700"></video>
                 } @else {
                    <img loading="lazy" [src]="product.image" (error)="handleImageError($event)" [alt]="product.name" class="absolute inset-0 w-full h-full object-contain mix-blend-multiply p-2 group-hover:scale-105 transition-transform duration-700">
                 }
                 
                 <div class="absolute top-2 left-2 right-2 flex gap-1.5 flex-wrap z-[1]">
                    @if(product.bulkDiscount?.count) { <div class="bg-gradient-to-r from-red-500 to-orange-400 backdrop-blur px-2 py-1 rounded-md text-[10px] font-black text-white shadow-sm border border-white/20 animate-pulse">🔥 任 {{ product.bulkDiscount!.count }} 件優惠</div> }
                    @if(isNewProduct(product)) { <div class="bg-black/80 backdrop-blur px-2 py-1 rounded-md text-[10px] font-black text-white shadow-sm border border-white/20 tracking-wider">NEW</div> }
                    <div class="bg-white/90 backdrop-blur px-2 py-1 rounded-md text-[10px] font-bold text-gray-800 uppercase shadow-sm border border-gray-100">{{ product.category }}</div>
                    @if(product.isPreorder) { <div class="bg-blue-50/90 backdrop-blur px-2 py-1 rounded-md text-[10px] font-bold text-blue-600 shadow-sm border border-blue-100">預購</div> }
                    @if($any(product).tags) {
                      @for(tag of $any(product).tags; track tag) {
                        <div (click)="clickTag(tag, $event)" class="bg-brand-50/90 backdrop-blur px-2 py-1 rounded-md text-[10px] font-bold text-brand-700 shadow-sm border border-brand-100 cursor-pointer hover:bg-brand-200 transition-colors z-20 relative">#{{ tag }}</div>
                      }
                    }
                 </div>

                 @if (!product.isPreorder && product.stock <= 0) {
                   <div class="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm z-20">
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
                   @if(product.isPreorder || product.stock > 0) {
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
               <div class="relative w-24 sm:w-32 h-28 sm:h-36 shrink-0 rounded-xl overflow-hidden bg-white border border-gray-100">
                 
                 @if(isYT(product.image)) {
                    <img loading="lazy" [src]="getYTThumbnail(product.image)" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700">
                    <div class="absolute inset-0 bg-black/20 flex items-center justify-center"><span class="text-white text-2xl drop-shadow-md">▶</span></div>
                 } @else if(isEmbedVideo(product.image)) {
                    <div class="absolute inset-0 w-full h-full overflow-hidden bg-black pointer-events-none">
                       <iframe [src]="getSafeEmbedUrl(product.image)" [class]="isIG(product.image) ? 'absolute w-full h-[calc(100%+240px)] -top-[120px] left-0 scale-[1.55] origin-center' : 'absolute inset-0 w-full h-full'" frameborder="0" allow="autoplay; fullscreen; picture-in-picture"></iframe>
                    </div>
                 } @else if(isVideo(product.image)) {
                    <video [src]="product.image" autoplay muted loop playsinline class="absolute inset-0 w-full h-full object-cover pointer-events-none group-hover:scale-105 transition-transform duration-700"></video>
                 } @else {
                    <img loading="lazy" [src]="product.image" (error)="handleImageError($event)" class="absolute inset-0 w-full h-full object-contain mix-blend-multiply p-1 group-hover:scale-105 transition-transform duration-700">
                 }

                 @if (!product.isPreorder && product.stock <= 0) {
                    <div class="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
                       <span class="bg-white px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold text-brand-900">售完</span>
                    </div>
                 }
               </div>
               
               <div class="flex-1 min-w-0 flex flex-col py-0.5 sm:py-1 justify-between pr-1">
                 <div>
                    <div class="flex gap-1.5 flex-wrap mb-1.5">
                       @if(isNewProduct(product)) { <span class="text-[10px] bg-black/80 text-white font-black px-2 py-0.5 rounded-md tracking-wider border border-white/20">NEW</span> }
                       @if(product.isPreorder) { <span class="text-[10px] bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-md border border-blue-100">預購</span> }
                       <span class="text-[10px] bg-gray-50 text-gray-600 font-bold px-2 py-0.5 rounded-md uppercase border border-gray-100">{{ product.category }}</span>
                       @if($any(product).tags) {
                          @for(tag of $any(product).tags; track tag) {
                            <span (click)="clickTag(tag, $event)" class="text-[10px] bg-brand-50 text-brand-700 font-bold px-2 py-0.5 rounded-md border border-brand-100 cursor-pointer hover:bg-brand-200 transition-colors z-20 relative">#{{ tag }}</span>
                          }
                       }
                    </div>
                    <h3 class="font-bold text-brand-900 text-sm sm:text-lg leading-tight mb-1 line-clamp-2">{{ product.name }}</h3>
                    @if(product.bulkDiscount?.count) {
                       <div class="text-[10px] sm:text-xs text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 font-bold line-clamp-1">🔥 任選 {{ product.bulkDiscount!.count }} 件優惠</div>
                    }
                 </div>
                 
                 <div class="flex items-end justify-between">
                    <div>
                       @if(getTierBadge(product)) { <div class="text-[9px] font-bold text-white bg-black px-1.5 py-0.5 rounded w-fit mb-0.5">{{ getTierBadge(product) }}</div> }
                       <div class="font-black text-brand-900 text-base sm:text-xl">NT$ {{ getPrice(product) }} @if(hasCustomPrice(product)) { <span class="text-xs text-gray-400 font-normal">起</span> }</div>
                    </div>
                    @if(product.isPreorder || product.stock > 0) {
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
                  @if(isYT(activeImage())) {
                     <div class="absolute inset-0 w-full h-full bg-black">
                        <iframe [src]="getSafeEmbedUrl(activeImage())" class="w-full h-full" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
                     </div>
                  } @else if(isEmbedVideo(activeImage())) {
                     <div class="absolute inset-0 w-full h-full overflow-hidden bg-black">
                        <iframe [src]="getSafeEmbedUrl(activeImage())" [class]="isIG(activeImage()) ? 'absolute w-full h-[calc(100%+240px)] -top-[120px] left-0 scale-[1.55] origin-center pointer-events-auto' : 'absolute inset-0 w-full h-full pointer-events-auto'" frameborder="0" allow="autoplay; fullscreen; picture-in-picture"></iframe>
                     </div>
                  } @else if(isVideo(activeImage())) {
                     <video [src]="activeImage()" autoplay muted loop playsinline class="absolute inset-0 w-full h-full object-contain"></video>
                  } @else {
                     <img [src]="activeImage()" (error)="handleImageError($event)" (click)="isFullscreen.set(true)" class="absolute inset-0 w-full h-full object-contain mix-blend-multiply cursor-zoom-in" title="點擊放大">
                  }
                  <button (click)="closeModal()" class="md:hidden absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur rounded-full text-gray-800 flex items-center justify-center font-bold hover:bg-gray-200 transition-colors z-20 shadow-sm border border-gray-100">✕</button>
               </div>

               @if(productImages().length > 1) {
                  <div class="p-3 md:p-4 bg-white border-t border-gray-100 flex gap-2 overflow-x-auto custom-scrollbar shrink-0">
                     @for(img of productImages(); track $index) {
                        <button (click)="activeImage.set(img)" class="relative w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all shadow-sm bg-gray-50" [class.border-brand-900]="activeImage() === img" [class.border-transparent]="activeImage() !== img">
                           @if(isYT(img)) {
                              <img loading="lazy" [src]="getYTThumbnail(img)" class="w-full h-full object-cover pointer-events-none">
                              <div class="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none"><span class="text-white text-xs drop-shadow-md">▶</span></div>
                           } @else if(isEmbedVideo(img)) {
                              <div class="w-full h-full bg-gray-900 flex flex-col items-center justify-center pointer-events-none"><span class="text-white text-[12px] mb-0.5">🎬</span><span class="text-[8px] text-gray-300 font-bold tracking-widest">影片</span></div>
                           } @else if(isVideo(img)) {
                              <video [src]="img" class="w-full h-full object-cover pointer-events-none"></video>
                              <div class="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none"><span class="text-white text-xs">▶</span></div>
                           } @else {
                              <img loading="lazy" [src]="img" (error)="handleImageError($event)" class="w-full h-full object-cover pointer-events-none">
                           }
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
                         @if(selectedProduct()!.bulkDiscount?.count) { <div class="text-xs bg-gradient-to-r from-red-500 to-orange-400 text-white font-black tracking-widest px-2.5 py-1 rounded-md shadow-sm border border-white/20 animate-pulse">🔥 任 {{ selectedProduct()!.bulkDiscount!.count }} 件優惠</div> }
                         @if(isNewProduct(selectedProduct()!)) { <div class="text-xs bg-black/80 text-white font-black tracking-widest px-2.5 py-1 rounded-md shadow-sm border border-white/20">NEW</div> }
                         <div class="text-xs bg-gray-50 text-gray-600 font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border border-gray-200">{{ selectedProduct()!.category }}</div>
                         @if(selectedProduct()!.isPreorder) { <div class="text-xs bg-blue-50 text-blue-600 font-bold tracking-widest px-2.5 py-1 rounded-md border border-blue-100">預購</div> }
                         @if($any(selectedProduct()!).tags) {
                           @for(tag of $any(selectedProduct()!).tags; track tag) {
                             <div (click)="clickTag(tag, $event)" class="text-xs bg-brand-50 text-brand-700 font-bold tracking-widest px-2.5 py-1 rounded-md border border-brand-100 cursor-pointer hover:bg-brand-200 transition-colors z-20 relative">#{{ tag }}</div>
                           }
                         }
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
                              @for (rawOpt of selectedProduct()!.options; track rawOpt; let i = $index) {
                                <button 
                                  (click)="!isOptSoldOut(rawOpt) && onOptionSelect(rawOpt, i)"
                                  class="w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between text-left relative overflow-hidden"
                                  [class.opacity-60]="isOptSoldOut(rawOpt)"
                                  [class.cursor-not-allowed]="isOptSoldOut(rawOpt)"
                                  [class.bg-gray-50]="isOptSoldOut(rawOpt)"
                                  [class.border-gray-200]="isOptSoldOut(rawOpt)"
                                  [class.border-brand-400]="!isOptSoldOut(rawOpt) && selectedOption() === rawOpt" [class.bg-white]="!isOptSoldOut(rawOpt) && selectedOption() === rawOpt" [class.shadow-md]="!isOptSoldOut(rawOpt) && selectedOption() === rawOpt"
                                  [class.border-gray-200]="!isOptSoldOut(rawOpt) && selectedOption() !== rawOpt" [class.bg-white]="!isOptSoldOut(rawOpt) && selectedOption() !== rawOpt" [class.hover:border-brand-300]="!isOptSoldOut(rawOpt) && selectedOption() !== rawOpt"
                                >
                                  @if(!isOptSoldOut(rawOpt) && selectedOption() === rawOpt) { <div class="absolute top-0 left-0 w-1 h-full bg-brand-400"></div> }
                                  <div class="flex items-center gap-2 pr-4 break-words whitespace-normal">
                                    <span class="font-bold" [class.text-gray-800]="!isOptSoldOut(rawOpt)" [class.text-gray-500]="isOptSoldOut(rawOpt)" [class.line-through]="isOptSoldOut(rawOpt)">{{ getOptName(rawOpt) }}</span>
                                    @if(isOptSoldOut(rawOpt)) { <span class="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded font-bold shrink-0">已售完</span> }
                                  </div>
                                  <span class="font-black text-lg shrink-0" [class.text-brand-900]="!isOptSoldOut(rawOpt)" [class.text-gray-400]="isOptSoldOut(rawOpt)">NT$ {{ getOptPrice(rawOpt) | number }}</span>
                                </button>
                              }
                            </div>
                          } @else {
                            <div class="flex flex-wrap gap-2.5">
                              @for (rawOpt of selectedProduct()!.options; track rawOpt; let i = $index) {
                                <button 
                                  (click)="!isOptSoldOut(rawOpt) && onOptionSelect(rawOpt, i)"
                                  class="px-4 py-2 md:px-5 md:py-2.5 rounded-xl text-sm md:text-base font-bold transition-all shadow-sm active:scale-95 text-center relative overflow-hidden break-words whitespace-normal h-auto min-h-[48px] flex items-center justify-center gap-1.5"
                                  [class.opacity-60]="isOptSoldOut(rawOpt)"
                                  [class.cursor-not-allowed]="isOptSoldOut(rawOpt)"
                                  [class.bg-gray-100]="isOptSoldOut(rawOpt)" [class.text-gray-400]="isOptSoldOut(rawOpt)" [class.border-gray-200]="isOptSoldOut(rawOpt)" [class.border]="isOptSoldOut(rawOpt)"
                                  [class.bg-brand-900]="!isOptSoldOut(rawOpt) && selectedOption() === rawOpt" [class.text-white]="!isOptSoldOut(rawOpt) && selectedOption() === rawOpt" [class.ring-2]="!isOptSoldOut(rawOpt) && selectedOption() === rawOpt" [class.ring-brand-200]="!isOptSoldOut(rawOpt) && selectedOption() === rawOpt"
                                  [class.bg-white]="!isOptSoldOut(rawOpt) && selectedOption() !== rawOpt" [class.text-gray-600]="!isOptSoldOut(rawOpt) && selectedOption() !== rawOpt" [class.border]="!isOptSoldOut(rawOpt) && selectedOption() !== rawOpt" [class.border-gray-200]="!isOptSoldOut(rawOpt) && selectedOption() !== rawOpt" [class.hover:border-brand-300]="!isOptSoldOut(rawOpt) && selectedOption() !== rawOpt"
                                >
                                  <span [class.line-through]="isOptSoldOut(rawOpt)">{{ getOptName(rawOpt) }}</span>
                                  @if(isOptSoldOut(rawOpt)) { <span class="text-[10px] text-red-500 font-bold shrink-0">售完</span> }
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
                  @if (!selectedProduct()!.isPreorder && selectedProduct()!.stock <= 0) {
                     <button 
                       disabled
                       class="w-full py-4 bg-gray-200 text-gray-500 rounded-2xl font-black text-xl shadow-inner cursor-not-allowed flex items-center justify-center gap-2"
                     >
                       <span>❌</span> 商品已售完
                     </button>
                  } @else if (!store.currentUser()) {
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

      @if (isFullscreen()) {
        <div class="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-2 sm:p-4 animate-fade-in" (click)="isFullscreen.set(false)">
          <button class="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 sm:w-12 sm:h-12 text-white bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-xl transition-colors backdrop-blur z-10">✕</button>
          <img [src]="activeImage()" class="max-w-full max-h-full object-contain cursor-zoom-out select-none" (click)="$event.stopPropagation()">
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
  sanitizer = inject(DomSanitizer);
  router: Router = inject(Router);
  route: ActivatedRoute = inject(ActivatedRoute);
  
  searchQuery = signal('');
  selectedCategory = signal<string>('all');
  selectedSubCategory = signal<string>('全部');
  sortOption = signal<'hot'|'price_asc'|'price_desc'|'newest'|'oldest'>('newest');
  viewMode = signal<'grid' | 'list'>('grid');

  selectedProduct = signal<Product | null>(null);
  selectedOption = signal<string>('');
  qty = signal(1);
  activeImage = signal(''); 
  isFullscreen = signal(false);

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

  // 🔥 處理標籤點擊事件
  clickTag(tag: string, event: Event) {
    event.stopPropagation(); 
    this.searchQuery.set(tag); 
    this.selectedCategory.set('all'); 
    this.selectedSubCategory.set('全部');
    this.closeModal(); 
    
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  currentSubCategories = computed(() => {
    const cat = this.selectedCategory();
    if (cat === 'all' || cat === '新品') return [];
    const productsInCurrentCat = this.store.visibleProducts().filter(p => p.category === cat);
    const existingSubs = productsInCurrentCat.map(p => p.subCategory).filter((sub): sub is string => !!sub); 
    const uniqueSubs = [...new Set(existingSubs)];
    if (uniqueSubs.length === 0) return [];
    return ['全部', ...uniqueSubs];
  });

  hasCustomPrice(p: Product): boolean {
    return p?.options?.some(opt => opt.includes('=')) || false;
  }

  // 🪄 魔法功能：隱藏 (售完) 以及 [圖X] 的字眼，讓客人畫面保持乾淨
  getOptName(opt: string): string {
    let name = opt.includes('=') ? opt.split('=')[0].trim() : opt;
    return name.replace(/\(售完\)|\[售完\]|【售完】|售完|斷貨|停產/g, '')
               .replace(/\[圖\d+\]/g, '') // 🔥 新增：把 [圖2] 這種標記從客人畫面上隱藏
               .trim();
  }

  // 📸 全新加入：點擊規格連動切換圖片 (精準指定版)
  onOptionSelect(opt: string, index: number) {
    this.selectedOption.set(opt); // 設定選中的規格
    
    const p = this.selectedProduct();
    if (!p) return;
    
    const imgs = this.productImages();
    if (imgs.length <= 1) return; 

    // 🎯 精準模式：找尋你設定的 [圖X] 標記 (例如 [圖2])
    const match = opt.match(/\[圖(\d+)\]/);
    
    if (match) {
       const imgNum = parseInt(match[1], 10);
       const targetIndex = imgNum - 1; // 因為陣列是從 0 開始，所以 [圖2] 會對應到 imgs[1]
       
       if (imgs[targetIndex]) {
          this.activeImage.set(imgs[targetIndex]);
       }
    }
  }
  
  // 🪄 魔法功能：判斷這個選項是不是帶有售完的關鍵字
  isOptSoldOut(opt: string): boolean {
    return opt.includes('售完') || opt.includes('斷貨') || opt.includes('停產');
  }

  getOptPrice(opt: string): number {
    const p = this.selectedProduct();
    if (!p) return 0;
    if (opt.includes('=')) {
      return parseInt(opt.split('=')[1].trim(), 10) || this.getPrice(p);
    }
    return this.getPrice(p);
  }

  hasCustomPriceOptions = computed(() => {
    const p = this.selectedProduct();
    return p ? this.hasCustomPrice(p) : false;
  });

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
    const subCat = this.selectedSubCategory();
    const sort = this.sortOption();

    if (query) {
       list = list.filter(p => 
         p.name.toLowerCase().includes(query) || 
         ((p as any).subCategory && (p as any).subCategory.toLowerCase().includes(query)) ||
         ((p as any).tags && (p as any).tags.some((t: string) => t.toLowerCase().includes(query)))
       );
    }
    
    if (cat === '新品') {
       list = list.filter(p => this.isNewProduct(p));
    } else if (cat !== 'all') {
       list = list.filter(p => p.category === cat);
       
       if (subCat && subCat !== '全部') {
         list = list.filter(p => (p as any).subCategory === subCat); 
       }
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
    this.isFullscreen.set(false);
  }

  handleImageError(event: any) {
    event.target.className = 'absolute inset-0 w-full h-full object-cover';
    event.target.src = 'https://placehold.co/400x500?text=No+Image';
  }

  copyLink() {
     const url = window.location.href;
     navigator.clipboard.writeText(url).then(() => {
        if (typeof document !== 'undefined') {
           const div = document.createElement('div');
           div.className = 'fixed top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full shadow-2xl z-[120] text-sm font-bold animate-fade-in flex items-center gap-2';
           div.innerHTML = '<span>✅</span> 連結已複製';
           
           document.body.appendChild(div);
           
           setTimeout(() => div.remove(), 2000);
        }
     });
  }

  addToCart() {
    const p = this.selectedProduct();
    if (!p) return;

    // 🛑 終極防護一：商品整包賣光了
    if (!p.isPreorder && p.stock <= 0) {
      alert('抱歉，此商品已售完！');
      return; 
    }

    const opt = p.options.length > 0 ? this.selectedOption() : '單一規格';
    
    // 🛑 防呆檢查：必須選擇規格
    if (p.options.length > 0 && !opt) {
      alert('請先選擇商品規格！'); 
      return; 
    }

    // 🛑 終極防護二：如果這個規格被標記為售完，不准加！
    if (this.isOptSoldOut(opt)) {
      alert('抱歉，此規格已售完！');
      return;
    }

    this.store.addToCart(p, opt, this.qty());
    this.closeModal();
    
    const div = document.createElement('div');
    div.className = 'fixed top-6 left-1/2 -translate-x-1/2 bg-brand-900 text-white px-6 py-3 rounded-full shadow-2xl z-[60] text-sm font-bold animate-fade-in flex items-center gap-2';
    div.innerHTML = '<span>👜</span> 已加入購物車';
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 2000);
  }

  // 🎥 魔法功能：判斷網址是不是直連影片
  isVideo(url: string | undefined): boolean {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    return lowerUrl.includes('.mp4') || lowerUrl.includes('.mov') || lowerUrl.includes('.webm');
  }

  // 🌐 判斷是否為社群平台外連影片 (YT, IG, FB)
  isEmbedVideo(url: string | undefined): boolean {
    if (!url) return false;
    const l = url.toLowerCase();
    return l.includes('youtube.com') || l.includes('youtu.be') || l.includes('instagram.com') || l.includes('facebook.com') || l.includes('fb.watch');
  }

  isIG(url: string | undefined): boolean {
    if (!url) return false;
    return url.toLowerCase().includes('instagram.com');
  }

  isYT(url: string | undefined): boolean {
    if (!url) return false;
    const l = url.toLowerCase();
    return l.includes('youtube.com') || l.includes('youtu.be');
  }

  // 📸 取得 YT 影片 ID
  getYTVideoId(url: string): string {
    if (!url) return '';
    if (url.includes('watch?v=')) return url.split('v=')[1]?.split('&')[0] || '';
    if (url.includes('youtu.be/')) return url.split('youtu.be/')[1]?.split('?')[0] || '';
    if (url.includes('shorts/')) return url.split('shorts/')[1]?.split('?')[0] || '';
    return '';
  }

  // 🖼️ 取得 YT 影片高畫質封面
  getYTThumbnail(url: string): string {
    const vid = this.getYTVideoId(url);
    return vid ? `https://img.youtube.com/vi/${vid}/hqdefault.jpg` : '';
  }

  // 🛡️ 轉換社群網址為安全的可播放嵌入碼 (全面隱藏 UI 與清洗 FB 網址版)
  getSafeEmbedUrl(url: string): SafeResourceUrl {
    let embedUrl = url;
    try {
      if (this.isYT(url)) {
         let videoId = '';
         if (url.includes('watch?v=')) videoId = url.split('v=')[1]?.split('&')[0];
         else if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1]?.split('?')[0];
         else if (url.includes('shorts/')) videoId = url.split('shorts/')[1]?.split('?')[0];

         // 🔥 YT 聲音解禁版：拿掉 autoplay 和 mute，讓客人自己按播放，且有聲音！
         if (videoId) {
            embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`;
         }
      } else if (this.isIG(url)) {
         const cleanUrl = url.split('?')[0].replace(/\/$/, "");
         embedUrl = `${cleanUrl}/embed`;
      } else if (url.includes('facebook.com') || url.includes('fb.watch')) {
         // FB 常因為帶有 fbclid 等追蹤碼導致無法播放，這裡自動清除乾淨
         let cleanFbUrl = url.split('?')[0];
         if (url.includes('v=')) {
            const params = new URLSearchParams(url.split('?')[1]);
            const v = params.get('v');
            if (v) cleanFbUrl = `${cleanFbUrl}?v=${v}`;
         }
         embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(cleanFbUrl)}&show_text=false&width=auto`;
      }
    } catch(e) {}
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }
}