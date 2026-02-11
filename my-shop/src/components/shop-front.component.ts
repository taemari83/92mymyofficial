import { Component, computed, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, Params, RouterModule } from '@angular/router'; // 👈 1. 這裡加了 RouterModule
import { toSignal } from '@angular/core/rxjs-interop';
import { StoreService, Product } from '../services/store.service';

@Component({
  selector: 'app-shop-front',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule], // 👈 2. 這裡一定要加 RouterModule，連結才會動！
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
                class="flex-1 px-3 py-2 outline-none bg-transparent placeholder-gray-400 text-brand-900"
              >
           </div>

           <div class="relative min-w-[160px]">
             <select 
               [ngModel]="sortOption()" 
               (ngModelChange)="sortOption.set($event)"
               class="w-full h-full appearance-none bg-white border border-gray-100 text-brand-900 text-sm rounded-full px-6 py-3 outline-none focus:border-brand-300 shadow-sm font-bold cursor-pointer"
             >
               <option value="newest">📅 上架：新到舊</option>
               <option value="oldest">📅 上架：舊到新</option>
               <option value="hot">🔥 熱銷排行</option>
               <option value="price_asc">💰 價格：低到高</option>
               <option value="price_desc">💰 價格：高到低</option>
             </select>
             <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-xs text-gray-400">▼</div>
           </div>
         </div>
         
         <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-2">
            <button 
              (click)="selectedCategory.set('all')"
              [class.bg-brand-900]="selectedCategory() === 'all'"
              [class.text-white]="selectedCategory() === 'all'"
              [class.bg-white]="selectedCategory() !== 'all'"
              [class.text-gray-500]="selectedCategory() !== 'all'"
              class="px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors border border-transparent shadow-sm"
            >
              All
            </button>
            @for (cat of store.categories(); track cat) {
              <button 
                (click)="selectedCategory.set(cat)"
                [class.bg-brand-900]="selectedCategory() === cat"
                [class.text-white]="selectedCategory() === cat"
                [class.bg-white]="selectedCategory() !== cat"
                [class.text-gray-500]="selectedCategory() !== cat"
                class="px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors border border-transparent shadow-sm"
              >
                {{ cat }}
              </button>
            }
         </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-2">
        @for (product of filteredProducts(); track product.id) {
          <div 
            (click)="openProductModal(product)"
            class="bg-white rounded-[2rem] shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group border border-gray-50 flex flex-col cursor-pointer"
          >
            <div class="relative aspect-[4/5] overflow-hidden bg-gray-100">
              <img [src]="product.image" [alt]="product.name" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700">
              
              <div class="absolute top-4 left-4 bg-white/80 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-brand-900 uppercase tracking-widest">
                {{ product.category || 'NEW' }}
              </div>

              @if (product.stock <= 0) {
                <div class="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
                   <div class="bg-white px-6 py-2 rounded-full font-bold text-brand-900">SOLD OUT</div>
                </div>
              }
            </div>

            <div class="p-5 flex-1 flex flex-col">
              <div class="flex-1">
                 <h3 class="font-bold text-brand-900 text-lg leading-tight mb-2">{{ product.name }}</h3>
                 <p class="text-sm text-gray-400 line-clamp-2 mb-4">{{ product.note || 'Winter Special Selection' }}</p>
              </div>

              <div class="flex items-center justify-between mt-2">
                <div class="flex flex-col">
                   @if(getTierBadge(product)) {
                     <span class="text-[10px] font-bold text-white bg-black px-2 py-0.5 rounded-full w-fit mb-1">{{ getTierBadge(product) }}</span>
                   }
                   <span class="text-xl font-bold text-brand-900">NT$ {{ getPrice(product) }}</span>
                </div>
                
                @if(product.stock > 0) {
                  <button class="w-10 h-10 bg-brand-50 text-brand-900 rounded-full flex items-center justify-center group-hover:bg-brand-900 group-hover:text-white transition-colors">
                    +
                  </button>
                }
              </div>
            </div>
          </div>
        } @empty {
          <div class="col-span-full py-20 text-center">
            <div class="text-6xl mb-4">🍂</div>
            <p class="text-xl text-gray-400 font-medium">Coming Soon...</p>
          </div>
        }
      </div>

      @if (store.cartCount() > 0) {
        <a 
          routerLink="/checkout" 
          class="fixed bottom-6 right-6 z-40 bg-brand-900 text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform cursor-pointer animate-bounce-in border-none outline-none text-decoration-none"
        >
          <div class="relative pointer-events-none">
            <span class="text-3xl">👜</span>
            <span class="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white">
              {{ store.cartCount() }}
            </span>
          </div>
        </a>
      }
      @if (selectedProduct()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6 bg-brand-900/60 backdrop-blur-sm" (click)="closeModal()">
          <div 
            class="bg-[#FDFBF9] w-full max-w-5xl md:rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up md:animate-fade-in h-full md:h-auto max-h-[100vh] md:max-h-[90vh] flex flex-col md:flex-row" 
            (click)="$event.stopPropagation()"
          >
            <div class="md:w-1/2 bg-gray-100 relative group flex flex-col h-[40vh] md:h-auto shrink-0">
               <div class="flex-1 relative overflow-hidden">
                  <img [src]="activeImage()" class="w-full h-full object-cover">
                  <button (click)="closeModal()" class="md:hidden absolute top-4 right-4 w-10 h-10 bg-black/20 backdrop-blur rounded-full text-white flex items-center justify-center font-bold hover:bg-black/40 transition-colors z-20">✕</button>
               </div>
               
               @if(productImages().length > 1) {
                  <div class="p-4 bg-white/10 backdrop-blur-md absolute bottom-0 left-0 right-0 flex gap-2 overflow-x-auto scrollbar-hide z-10">
                     @for(img of productImages(); track img) {
                        <button (click)="activeImage.set(img)" class="w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all shadow-sm" [class.border-brand-900]="activeImage() === img" [class.border-white]="activeImage() !== img">
                           <img [src]="img" class="w-full h-full object-cover">
                        </button>
                     }
                  </div>
               }
            </div>

            <div class="md:w-1/2 flex flex-col bg-[#FDFBF9] h-[60vh] md:h-auto relative">
               <button (click)="closeModal()" class="hidden md:flex absolute top-6 right-6 w-10 h-10 bg-gray-100 rounded-full text-gray-500 items-center justify-center hover:bg-gray-200 transition-colors z-20">✕</button>

               <div class="flex-1 overflow-y-auto p-5 md:p-8 scrollbar-hide">
                  <div class="mb-6">
                    <div class="flex justify-between items-start mb-2 pr-10">
                      <div class="text-sm text-brand-400 font-bold uppercase tracking-widest bg-brand-50 px-2 py-1 rounded-lg">{{ selectedProduct()!.category }}</div>
                      
                      <button (click)="copyLink()" class="flex items-center gap-1 text-xs text-gray-400 hover:text-brand-900 transition-colors border border-gray-200 rounded-full px-3 py-1 bg-white">
                        <span>🔗</span> 複製連結
                      </button>
                    </div>
                    <h2 class="text-2xl md:text-3xl font-black text-gray-800 leading-tight mb-2">{{ selectedProduct()!.name }}</h2>
                    
                    <div class="flex items-end gap-3 mt-3 border-b border-gray-100 pb-4">
                       <div class="text-3xl font-black text-brand-900 tracking-tight">NT$ {{ getPrice(selectedProduct()!) | number }}</div>
                       @if(getTierBadge(selectedProduct()!)) {
                          <div class="text-sm bg-black text-white px-3 py-1 rounded-full font-bold mb-1">{{ getTierBadge(selectedProduct()!) }}</div>
                       }
                    </div>
                  </div>

                  <div class="bg-brand-50/60 rounded-[1.5rem] p-5 md:p-6 mb-6 border border-brand-100/50">
                      @if (selectedProduct()!.options.length > 0) {
                        <div class="mb-6">
                          <div class="flex items-center justify-between mb-3">
                             <label class="text-sm font-bold text-gray-800">選擇規格</label>
                             @if(selectedOption()) {
                                <span class="text-xs text-brand-600 font-bold bg-white px-2 py-1 rounded-md shadow-sm border border-brand-100 animate-fade-in">{{ selectedOption() }}</span>
                             }
                          </div>
                          <div class="flex flex-wrap gap-2.5">
                            @for (opt of selectedProduct()!.options; track opt) {
                              <button 
                                (click)="selectedOption.set(opt)"
                                class="px-4 py-3 md:px-5 md:py-3 rounded-xl text-sm md:text-base font-bold transition-all shadow-sm active:scale-95 flex-1 min-w-[80px] text-center relative overflow-hidden"
                                [class.bg-brand-900]="selectedOption() === opt"
                                [class.text-white]="selectedOption() === opt"
                                [class.ring-2]="selectedOption() === opt"
                                [class.ring-brand-200]="selectedOption() === opt"
                                [class.bg-white]="selectedOption() !== opt"
                                [class.text-gray-600]="selectedOption() !== opt"
                                [class.border]="selectedOption() !== opt"
                                [class.border-gray-200]="selectedOption() !== opt"
                                [class.hover:border-brand-300]="selectedOption() !== opt"
                              >
                                {{ opt }}
                                @if(selectedOption() === opt) { <div class="absolute inset-0 bg-white/10"></div> }
                              </button>
                            }
                          </div>
                        </div>
                      }

                      <div>
                         <label class="block text-sm font-bold text-gray-800 mb-2">購買數量</label>
                         <div class="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-1.5 shadow-sm w-full">
                           <button (click)="qty.set(qty() > 1 ? qty() - 1 : 1)" class="w-14 h-14 flex items-center justify-center text-gray-400 hover:text-brand-900 hover:bg-gray-100 rounded-lg text-2xl transition-colors font-bold disabled:opacity-30" [disabled]="qty() <= 1">
                             <span class="mb-1">-</span>
                           </button>
                           <span class="flex-1 text-center font-black text-brand-900 text-2xl select-none">{{ qty() }}</span>
                           <button (click)="qty.set(qty() + 1)" class="w-14 h-14 flex items-center justify-center text-gray-400 hover:text-brand-900 hover:bg-gray-100 rounded-lg text-2xl transition-colors font-bold">
                             <span class="mb-1">+</span>
                           </button>
                         </div>
                      </div>
                  </div>

                  <div class="text-gray-500 leading-relaxed text-sm bg-white p-4 rounded-xl border border-gray-100">
                    <h4 class="font-bold text-gray-800 mb-2 text-xs uppercase tracking-wide">商品介紹</h4>
                    <p class="whitespace-pre-wrap">{{ selectedProduct()!.note || '這是一個非常棒的商品，來自我們精選的 Winter Collection。' }}</p>
                  </div>
               </div>

               <div class="p-5 border-t border-gray-100 bg-white z-10 relative shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
                  <button 
                    (click)="addToCart()"
                    [disabled]="selectedProduct()!.options.length > 0 && !selectedOption()"
                    class="w-full py-4 bg-brand-900 text-white rounded-2xl font-bold text-xl shadow-xl shadow-brand-900/20 hover:bg-black hover:scale-[1.01] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-between px-6 group"
                  >
                    <div class="flex flex-col items-start">
                       <span class="text-[10px] text-white/60 font-medium uppercase tracking-wider">Total</span>
                       <span class="text-xl font-mono">NT$ {{ getPrice(selectedProduct()!) * qty() | number }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                       <span>加入購物車</span>
                       <span class="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center text-base group-hover:translate-x-1 transition-transform group-hover:bg-white group-hover:text-brand-900">→</span>
                    </div>
                  </button>
               </div>
            </div>

          </div>
        </div>
      }
    </div>
  `,
  styles: [`
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

  // Modal State
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
  }

  productImages = computed(() => {
     const p = this.selectedProduct();
     if (!p) return [];
     return p.images && p.images.length > 0 ? p.images : [p.image];
  });

  filteredProducts = computed(() => {
    let list = [...this.store.products()];
    const query = this.searchQuery().toLowerCase();
    const cat = this.selectedCategory();
    const sort = this.sortOption();

    // 1. Filter
    if (query) list = list.filter(p => p.name.toLowerCase().includes(query));
    if (cat !== 'all') list = list.filter(p => p.category === cat);
    
    // 2. Sort
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

  copyLink() {
     const url = window.location.href;
     navigator.clipboard.writeText(url).then(() => {
        alert('連結已複製！可直接貼給客人。');
     });
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