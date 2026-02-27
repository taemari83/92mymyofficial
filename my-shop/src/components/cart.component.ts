import { Component, inject, signal, computed, ChangeDetectionStrategy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { StoreService, CartItem } from '../services/store.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="max-w-4xl mx-auto space-y-6 pb-20">
      <h2 class="text-2xl font-bold text-gray-800 border-b pb-4 px-2">購物車 & 結帳</h2>

      @if (step() === 1) {
        @if (storeService.cart().length === 0) {
           <div class="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100 mt-8">
              <div class="text-6xl mb-4">🛒</div>
              <p class="text-gray-500 font-bold mb-4">購物車目前是空的</p>
              <a routerLink="/" class="px-6 py-2 bg-brand-900 text-white rounded-full font-bold hover:bg-black transition-colors inline-block">前往購物</a>
           </div>
        } @else {
           <div class="flex items-center justify-between px-2">
              <div class="flex items-center gap-2 cursor-pointer select-none" (click)="toggleAll()">
                 <div class="w-5 h-5 rounded border border-brand-300 flex items-center justify-center transition-colors" [class.bg-brand-600]="isAllSelected()" [class.border-brand-600]="isAllSelected()">
                    @if(isAllSelected()) { <span class="text-white text-xs">✓</span> }
                 </div>
                 <span class="text-sm font-bold text-gray-700">全選 ({{ storeService.cart().length }})</span>
              </div>
              @if (selectedIndices().size > 0) {
                <button (click)="clearSelected()" class="text-xs text-red-400 hover:text-red-600 font-bold">移除選取項目</button>
              }
           </div>

           <div class="space-y-3">
              @for (item of storeService.cart(); track $index) {
                <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 transition-all" 
                     [class.ring-2]="isSelected($index)" [class.ring-brand-200]="isSelected($index)"
                     (click)="toggleItem($index)">
                   
                   <div class="w-5 h-5 rounded border border-gray-300 flex items-center justify-center shrink-0" 
                        [class.bg-brand-600]="isSelected($index)" [class.border-brand-600]="isSelected($index)">
                      @if(isSelected($index)) { <span class="text-white text-xs">✓</span> }
                   </div>

                   <img [src]="item.productImage" class="w-20 h-20 rounded-xl bg-gray-100 object-cover border border-gray-100 shrink-0">
                   
                   <div class="flex-1 min-w-0">
                      <h4 class="font-bold text-gray-800 truncate">{{ item.productName }}</h4>
                      <p class="text-xs text-gray-500 mb-1">{{ item.option }}</p>
                      
                      <div class="flex flex-wrap gap-1">
                         @if(item.isPreorder) { 
                            <span class="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[10px] rounded font-bold border border-blue-200">預購</span> 
                         }
                      </div>
                   </div>

                   <div class="flex flex-col items-end gap-2" (click)="$event.stopPropagation()">
                      <div class="font-bold text-brand-900">NT$ {{ item.price * item.quantity }}</div>
                      <div class="flex items-center bg-gray-50 rounded-lg p-0.5">
                         <button (click)="storeService.updateCartQty($index, -1)" class="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-brand-900" [disabled]="item.quantity<=1">-</button>
                         <span class="w-6 text-center text-xs font-bold">{{ item.quantity }}</span>
                         <button (click)="storeService.updateCartQty($index, 1)" class="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-brand-900">+</button>
                      </div>
                   </div>
                   
                   <button (click)="$event.stopPropagation(); storeService.removeFromCart($index)" class="text-gray-300 hover:text-red-400 p-2">✕</button>
                </div>
              }
           </div>

           <div class="bg-white border-t border-gray-100 p-6 fixed bottom-0 left-0 right-0 z-30 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] md:absolute md:bottom-auto md:relative md:rounded-2xl md:border md:shadow-sm md:mt-4">
              <div class="max-w-4xl mx-auto flex flex-col gap-4">
                 
                 @if(selectedIndices().size > 0 && commonLogistics().shipping.length === 0) {
                    <div class="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold flex items-center gap-2 animate-pulse">
                       <span>⚠️</span>
                       <div>
                          <div>物流方式衝突</div>
                          <div class="text-xs font-normal">所選商品沒有共同的運送方式，請分開結帳。</div>
                       </div>
                    </div>
                 }

                 <div class="flex justify-between items-center">
                    <div class="text-sm text-gray-500">
                       已選 {{ selectedIndices().size }} 件商品
                       @if(commonLogistics().shipping.length > 0) {
                          <span class="text-green-600 text-xs ml-2">✓ 物流檢核通過</span>
                       }
                    </div>
                    <div class="text-right">
                       <div class="text-xs text-gray-400">小計</div>
                       <div class="text-2xl font-black text-brand-900">NT$ {{ storeService.cartTotal() }}</div>
                    </div>
                 </div>

                 @if (!storeService.currentUser()) {
                    <button (click)="storeService.loginWithGoogle()" 
                       class="w-full py-3.5 rounded-xl font-bold text-lg shadow-lg transition-all active:scale-[0.98] bg-gray-800 text-white hover:bg-black flex items-center justify-center gap-2"
                    >
                       <span>👤</span> 登入會員以進行結帳
                    </button>
                 } @else {
                    <button (click)="proceed()" 
                       [disabled]="selectedIndices().size === 0 || commonLogistics().shipping.length === 0"
                       class="w-full py-3.5 rounded-xl font-bold text-lg shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                       [class.bg-brand-900]="selectedIndices().size > 0 && commonLogistics().shipping.length > 0"
                       [class.text-white]="selectedIndices().size > 0 && commonLogistics().shipping.length > 0"
                       [class.bg-gray-200]="selectedIndices().size === 0 || commonLogistics().shipping.length === 0"
                       [class.text-gray-500]="selectedIndices().size === 0 || commonLogistics().shipping.length === 0"
                    >
                       {{ commonLogistics().shipping.length === 0 && selectedIndices().size > 0 ? '物流衝突，請調整選擇' : '前往結帳' }}
                    </button>
                 }
              </div>
           </div>
        }
      }

      @if (step() === 2) {
         <form [formGroup]="form" (ngSubmit)="submit()" class="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100 space-y-8 animate-fade-in">
            <div class="flex items-center gap-4 cursor-pointer hover:bg-gray-50 p-2 rounded-xl transition-colors" (click)="step.set(1)">
               <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">←</div>
               <h3 class="font-bold text-xl text-gray-800">確認結帳資訊</h3>
            </div>

            <div class="space-y-4">
               <div class="font-bold text-gray-800 border-l-4 border-brand-400 pl-3">配送方式</div>
               <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  @for(method of commonLogistics().shipping; track method) {
                     <label class="border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all hover:bg-gray-50" 
                        [class.border-brand-500]="selectedShippingMethod() === method"
                        [class.bg-brand-50]="selectedShippingMethod() === method">
                        <div class="flex items-center gap-3">
                           <input type="radio" formControlName="shippingMethod" [value]="method" class="text-brand-600 focus:ring-brand-500">
                           <span class="font-bold text-gray-700">{{ getShippingLabel(method) }}</span>
                        </div>
                     </label>
                  }
               </div>
            </div>

            <div class="space-y-4">
               <div class="font-bold text-gray-800 border-l-4 border-brand-400 pl-3">付款方式</div>
               <div class="grid grid-cols-3 gap-3">
                  @for(method of commonLogistics().payment; track method) {
                     <label class="border rounded-xl p-3 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all hover:bg-gray-50 text-center h-20"
                        [class.border-brand-500]="form.get('paymentMethod')?.value === method"
                        [class.bg-brand-50]="form.get('paymentMethod')?.value === method">
                        <input type="radio" formControlName="paymentMethod" [value]="method" class="hidden">
                        <span class="text-xl">{{ getPaymentIcon(method) }}</span>
                        <span class="text-xs font-bold text-gray-700">{{ getPaymentLabel(method) }}</span>
                     </label>
                  }
               </div>
               @if(form.get('paymentMethod')?.value === 'bank_transfer') {
                  <div class="bg-blue-50 p-4 rounded-xl text-sm text-blue-800 border border-blue-100 animate-fade-in">
                     <div class="font-bold mb-1">匯款資訊 (凱基商業銀行 809)</div>
                     <div class="font-mono text-lg">606-904-0006-7288</div>
                     <div class="font-bold mt-1">戶名：蘇*婷</div>
                  </div>
               }
            </div>

            <div class="space-y-4">
               <div class="font-bold text-gray-800 border-l-4 border-brand-400 pl-3">收件資料</div>
               <div class="grid grid-cols-2 gap-4">
                  <div>
                     <label class="text-xs font-bold text-gray-500">姓名</label>
                     <input formControlName="shipName" class="w-full border rounded-lg p-2 mt-1">
                  </div>
                  <div>
                     <label class="text-xs font-bold text-gray-500">電話</label>
                     <input formControlName="shipPhone" class="w-full border rounded-lg p-2 mt-1">
                  </div>
               </div>
               
               @if(['myship', 'family'].includes(selectedShippingMethod())) {
                  <div>
                     <label class="text-xs font-bold text-gray-500">門市名稱/代號</label>
                     <input formControlName="shipStore" class="w-full border rounded-lg p-2 mt-1" placeholder="例如：台大店 (123456)">
                  </div>
               }
               @if(selectedShippingMethod() === 'delivery') {
                  <div>
                     <label class="text-xs font-bold text-gray-500">收件地址</label>
                     <input formControlName="shipAddress" class="w-full border rounded-lg p-2 mt-1">
                  </div>
               }
            </div>

            <div class="bg-gray-50 p-4 rounded-xl space-y-2">
               <div class="flex justify-between text-sm">
                  <span class="text-gray-500">商品原價小計</span>
                  <span class="font-bold">NT$ {{ selectedOriginalSubtotal() }}</span>
               </div>
               
               @if(storeService.cartDiscount() > 0) {
                 <div class="flex justify-between text-sm text-red-500 font-bold">
                    <span>🎉 任選多入優惠折扣</span>
                    <span>- NT$ {{ storeService.cartDiscount() }}</span>
                 </div>
               }

               @if(currentShippingFee() > 0) {
                 <div class="flex justify-between text-sm">
                    <span class="text-gray-500">運費</span>
                    <span class="font-bold">+ NT$ {{ currentShippingFee() }}</span>
                 </div>
               }

               @if(currentDiscount() > 0) {
                 <div class="flex justify-between text-sm text-green-600 font-bold">
                    <span>開單預扣 ({{ selectedShippingMethod() === 'myship' ? '賣貨便' : '好賣家' }})</span>
                    <span>- NT$ {{ currentDiscount() }}</span>
                 </div>
               }
               
               @if(storeService.currentUser()?.credits) {
                  <div class="flex items-center justify-between pt-2 border-t border-gray-200">
                     <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" [checked]="useCredits()" (change)="toggleCredits($event)" class="text-brand-600 rounded">
                        <span class="text-sm font-bold text-gray-700">使用購物金 (餘額: \${{ storeService.currentUser()?.credits }})</span>
                     </label>
                     @if(useCredits()) {
                        <span class="text-sm font-bold text-brand-600">- NT$ {{ calculatedCredits() }}</span>
                     }
                  </div>
               }
               
               <div class="flex justify-between items-end pt-4 border-t border-gray-200 mt-2">
                  <span class="text-gray-500 font-bold">總付款金額</span>
                  <span class="text-3xl font-black text-brand-900">NT$ {{ finalTotal() }}</span>
               </div>
            </div>

            <button type="submit" [disabled]="form.invalid" class="w-full py-4 bg-brand-900 text-white rounded-xl font-bold shadow-lg hover:bg-black transition-transform active:scale-[0.98] disabled:bg-gray-300 disabled:cursor-not-allowed">
               確認送出訂單
            </button>
         </form>
      }

      @if (step() === 3) {
         <div class="bg-white rounded-[2rem] p-10 text-center shadow-lg border border-gray-100 mt-8 animate-fade-in">
            <div class="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto text-5xl mb-6">✓</div>
            <h2 class="text-3xl font-bold text-gray-800 mb-2">訂單建立成功！</h2>
            <p class="text-gray-500 mb-8">感謝您的購買，我們將盡快為您安排出貨。</p>
            <div class="flex gap-4 justify-center">
               <button (click)="goToMemberOrder()" class="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200">查看訂單</button>
               <button (click)="step.set(1); goToShop()" class="px-8 py-3 bg-brand-900 text-white rounded-xl font-bold hover:bg-black">繼續購物</button>
            </div>
         </div>
      }
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class CartComponent {
  storeService = inject(StoreService);
  fb: FormBuilder = inject(FormBuilder);
  router: Router = inject(Router);

  step = signal(1);
  selectedIndices = signal<Set<number>>(new Set());
  useCredits = signal(false);
  selectedShippingMethod = signal('');
  
  form: FormGroup = this.fb.group({
     paymentMethod: ['', Validators.required],
     shippingMethod: ['', Validators.required],
     shipName: ['', Validators.required],
     shipPhone: ['', Validators.required],
     shipAddress: [''],
     shipStore: [''],
     payName: [''],
     payLast5: [''],
     payDate: ['']
  });

  constructor() {
     effect(() => {
        const len = this.storeService.cart().length;
        if (len > 0 && this.selectedIndices().size === 0) {
           this.selectAll();
        }
     }, { allowSignalWrites: true });

     this.form.get('shippingMethod')?.valueChanges.subscribe(m => {
        this.selectedShippingMethod.set(m);
        const addr = this.form.get('shipAddress');
        const store = this.form.get('shipStore');
        
        if (m === 'delivery') {
           addr?.setValidators([Validators.required]);
           store?.clearValidators();
        } else if (['myship', 'family'].includes(m)) {
           addr?.clearValidators();
           store?.setValidators([Validators.required]);
        } else {
           addr?.clearValidators();
           store?.clearValidators();
        }
        addr?.updateValueAndValidity();
        store?.updateValueAndValidity();
     });
  }

  toggleItem(index: number) { this.selectedIndices.update(s => { const n = new Set(s); if (n.has(index)) n.delete(index); else n.add(index); return n; }); }
  toggleAll() { if (this.isAllSelected()) this.selectedIndices.set(new Set()); else this.selectAll(); }
  selectAll() { const all = new Set<number>(); this.storeService.cart().forEach((_, i) => all.add(i)); this.selectedIndices.set(all); }
  isAllSelected() { return this.storeService.cart().length > 0 && this.selectedIndices().size === this.storeService.cart().length; }
  isSelected(i: number) { return this.selectedIndices().has(i); }
  clearSelected() { Array.from(this.selectedIndices()).sort((a, b) => b - a).forEach(i => this.storeService.removeFromCart(i)); this.selectedIndices.set(new Set()); }

  checkoutList = computed(() => this.storeService.cart().filter((_, i) => this.selectedIndices().has(i)));
  
  commonLogistics = computed(() => {
     const items = this.checkoutList();
     if (items.length === 0) return { payment: [], shipping: [] };
     const settings = this.storeService.settings();
     const allProducts = this.storeService.products();

     let pay = new Set<string>();
     if (settings.paymentMethods.cash) pay.add('cash');
     if (settings.paymentMethods.bankTransfer) pay.add('bank_transfer');
     if (settings.paymentMethods.cod) pay.add('cod');

     let ship = new Set<string>();
     if (settings.shipping.methods.meetup.enabled) ship.add('meetup');
     if (settings.shipping.methods.myship.enabled) ship.add('myship');
     if (settings.shipping.methods.family.enabled) ship.add('family');
     if (settings.shipping.methods.delivery.enabled) ship.add('delivery');

     items.forEach(item => {
        const p = allProducts.find(x => x.id === item.productId);
        if (p) {
           if (p.allowPayment) {
              if (!p.allowPayment.cash) pay.delete('cash');
              if (!p.allowPayment.bankTransfer) pay.delete('bank_transfer');
              if (!p.allowPayment.cod) pay.delete('cod');
           }
           if (p.allowShipping) {
              if (!p.allowShipping.meetup) ship.delete('meetup');
              if (!p.allowShipping.myship) ship.delete('myship');
              if (!p.allowShipping.family) ship.delete('family');
              if (!p.allowShipping.delivery) ship.delete('delivery');
           }
        }
     });
     return { payment: Array.from(pay), shipping: Array.from(ship) };
  });

  selectedOriginalSubtotal = computed(() => this.checkoutList().reduce((sum, i) => sum + (i.price * i.quantity), 0));
  selectedSubtotal = computed(() => Math.max(0, this.selectedOriginalSubtotal() - this.storeService.cartDiscount()));

  currentShippingFee = computed(() => {
     const m = this.selectedShippingMethod();
     const settings = this.storeService.settings().shipping;
     if (settings.freeThreshold > 0 && this.selectedSubtotal() >= settings.freeThreshold) return 0;
     if (m === 'delivery') return settings.methods.delivery.fee;
     if (m === 'meetup') return settings.methods.meetup.fee;
     if (m === 'myship' || m === 'family') return 0;
     return 0;
  });

  currentDiscount = computed(() => (this.selectedShippingMethod() === 'myship' || this.selectedShippingMethod() === 'family') ? 20 : 0);

  calculatedCredits = computed(() => {
     if (!this.useCredits()) return 0;
     const user = this.storeService.currentUser();
     const max = user?.credits || 0;
     const sub = this.selectedSubtotal() + this.currentShippingFee() - this.currentDiscount();
     return Math.min(max, Math.max(0, sub));
  });

  finalTotal = computed(() => Math.max(0, this.selectedSubtotal() + this.currentShippingFee() - this.currentDiscount() - this.calculatedCredits()));

  toggleCredits(e: Event) { this.useCredits.set((e.target as HTMLInputElement).checked); }

  proceed() {
     if (this.selectedIndices().size === 0) return;
     if (this.commonLogistics().shipping.length === 0) { alert('您選擇的商品物流方式衝突，請重新選擇！'); return; }
     const user = this.storeService.currentUser();
     if (user) { this.form.patchValue({ shipName: user.name, shipPhone: user.phone, shipAddress: user.address || '' }); }
     this.step.set(2);
  }

  async submit() {
     if (this.form.valid) {
        const val = this.form.value;
        try {
           // 1. 加上 await，等待訂單建立完成
           const orderResult = await this.storeService.createOrder(
              { name: val.payName, time: val.payDate, last5: val.payLast5 },
              { name: val.shipName, phone: val.shipPhone, address: val.shipAddress, store: val.shipStore },
              this.calculatedCredits(), val.paymentMethod, val.shippingMethod, this.currentShippingFee(), this.checkoutList()
           );

           // 2. 如果回傳 null，代表可能未登入或發生其他預期內的錯誤
           if (!orderResult) {
              alert('結帳失敗，請確認登入狀態後重試！');
              return;
           }

           // 3. 確定成功後，才清空選擇並跳轉到成功畫面
           this.selectedIndices.set(new Set());
           this.step.set(3);
           
        } catch (error: any) {
           // 4. 如果 Firebase 報錯，攔截它並顯示給用戶
           console.error('結帳發生錯誤:', error);
           alert('結帳過程中發生錯誤，請稍後再試！\n' + (error.message || ''));
        }
     }
  }
  
  goToShop() { this.router.navigate(['/']); }
  goToMemberOrder() { this.router.navigate(['/member']); }

  getShippingLabel(m: string) { const map: any = { meetup: '面交自取', myship: '7-11 賣貨便', family: '全家好賣家', delivery: '宅配寄送' }; return map[m] || m; }
  getPaymentLabel(m: string) { const map: any = { cash: '現金付款', bank_transfer: '銀行轉帳', cod: '貨到付款' }; return map[m] || m; }
  getPaymentIcon(m: string) { const map: any = { cash: '💵', bank_transfer: '🏦', cod: '🚚' }; return map[m] || ''; }
}