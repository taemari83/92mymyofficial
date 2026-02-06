import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StoreService, Order } from '../services/store.service';

@Component({
  selector: 'app-member-area',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-3xl mx-auto pb-10">
      @if (!storeService.currentUser()) {
        <!-- Auth Form -->
        <div class="bg-white rounded-[2rem] shadow-xl border border-gray-50 overflow-hidden max-w-sm mx-auto mt-10">
          <div class="p-8 space-y-8">
            <div class="text-center">
              <h2 class="text-3xl font-black text-brand-900 tracking-tighter">92mymy<br>就愛買買</h2>
              <p class="text-brand-400 text-sm mt-1 uppercase tracking-widest">Member Login</p>
            </div>
            
            @if (mode() === 'check_phone') {
              <div>
                <input type="tel" [(ngModel)]="phoneInput" class="w-full bg-cream-50 border-none rounded-2xl p-4 text-center text-xl font-bold text-brand-900 placeholder-gray-300 focus:ring-2 focus:ring-brand-200 outline-none" placeholder="輸入手機號碼">
                <button (click)="checkPhone()" class="w-full mt-4 py-4 bg-brand-900 text-white rounded-2xl font-bold text-lg hover:bg-black transition-transform active:scale-95 shadow-lg">登入 / 註冊</button>
              </div>
            }

            @if (mode() === 'register') {
              <div class="space-y-4 animate-fade-in">
                <div class="bg-brand-50 p-4 rounded-xl text-center text-sm text-brand-900 leading-relaxed">
                   <p class="font-bold mb-2">👋 歡迎加入 92mymy！</p>
                   <p>註冊完成後，請務必加入官方 LINE</p>
                   <a href="https://lin.ee/nAhKfze" target="_blank" class="block my-2 text-brand-600 font-bold underline bg-white py-2 rounded-lg border border-brand-100 hover:bg-brand-100 transition-colors">
                     點我加入 LINE 好友
                   </a>
                   <p class="text-xs text-gray-500">並告知您的會員手機號碼以利審核</p>
                </div>

                <div class="text-center text-sm text-gray-500 mt-2">
                  請輸入您的暱稱
                </div>
                <input type="text" [(ngModel)]="nameInput" class="w-full bg-cream-50 border-none rounded-2xl p-4 text-center text-lg font-bold text-brand-900 placeholder-gray-300 focus:ring-2 focus:ring-brand-200 outline-none" placeholder="您的暱稱">
                <button (click)="doRegister()" class="w-full py-4 bg-brand-900 text-white rounded-2xl font-bold text-lg hover:bg-black transition-transform active:scale-95 shadow-lg">開始購物</button>
              </div>
            }
          </div>
        </div>
      } @else {
        <!-- Member Dashboard -->
        <div class="space-y-8">
          
          <!-- Dark Card Profile -->
          <div class="bg-brand-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
            <!-- Decorative blurred blobs -->
            <div class="absolute -top-10 -right-10 w-40 h-40 bg-brand-400 rounded-full blur-[50px] opacity-20"></div>
            <div class="absolute bottom-10 left-10 w-20 h-20 bg-blue-400 rounded-full blur-[40px] opacity-10"></div>

            <div class="relative z-10">
              <div class="flex justify-between items-start mb-8">
                <div>
                   <div class="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Total Spend</div>
                   <h2 class="text-5xl font-bold tracking-tight">NT$ {{ storeService.currentUser()?.totalSpend | number }}</h2>
                </div>
                
                <div class="flex flex-col items-end gap-2">
                   @if(storeService.currentUser()?.tier === 'vip') {
                      <div class="bg-purple-500/20 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold text-purple-200 border border-purple-500/30">
                        👑 VIP MEMBER
                      </div>
                   } @else if(storeService.currentUser()?.tier === 'wholesale') {
                      <div class="bg-blue-500/20 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold text-blue-200 border border-blue-500/30">
                        📦 WHOLESALE
                      </div>
                   } @else {
                      <div class="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold text-white/80 border border-white/10">
                        MEMBER
                      </div>
                   }
                   
                   @if((storeService.currentUser()?.credits || 0) > 0) {
                      <div class="text-xs text-brand-200 font-bold flex items-center gap-1">
                         💰 購物金 \${{ storeService.currentUser()?.credits }}
                      </div>
                   }
                </div>
              </div>

              <div class="flex items-end justify-between">
                <div>
                  <h3 class="text-xl font-bold">{{ storeService.currentUser()?.name }}</h3>
                  <p class="text-white/40 text-sm mt-1">ID: {{ storeService.currentUser()?.id }}</p>
                </div>
                <div class="flex gap-3">
                   <button (click)="storeService.logout()" class="px-5 py-2 rounded-full border border-white/20 text-sm font-bold hover:bg-white hover:text-brand-900 transition-colors">登出</button>
                </div>
              </div>
            </div>
          </div>

          <!-- NEW: Personal Profile Section -->
          <div class="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-50 relative overflow-hidden">
             <div class="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                <h3 class="font-bold text-xl text-gray-800 flex items-center gap-2">
                   <span>📝 個人資料</span>
                </h3>
                @if(!isEditingProfile()) {
                  <button (click)="startEditing()" class="text-xs font-bold text-brand-600 bg-brand-50 px-3 py-1.5 rounded-full hover:bg-brand-100 transition-colors flex items-center gap-1">
                    <span>✎</span> 編輯資料
                  </button>
                }
             </div>

             @if(!isEditingProfile()) {
               <!-- View Mode -->
               <div class="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                  <div>
                    <div class="text-xs text-gray-400 uppercase font-bold mb-1">姓名</div>
                    <div class="font-bold text-brand-900 text-lg">{{ storeService.currentUser()?.name }}</div>
                  </div>
                  <div>
                    <div class="text-xs text-gray-400 uppercase font-bold mb-1">手機號碼 (帳號)</div>
                    <div class="font-bold text-brand-900 text-lg font-mono">{{ storeService.currentUser()?.phone }}</div>
                  </div>
                  <div>
                    <div class="text-xs text-gray-400 uppercase font-bold mb-1">生日</div>
                    <div class="font-bold text-brand-900 text-lg font-mono flex items-center gap-2">
                      {{ storeService.currentUser()?.birthday || '尚未填寫' }}
                      @if(storeService.currentUser()?.birthday) { 🎂 }
                    </div>
                  </div>
               </div>
             } @else {
               <!-- Edit Mode -->
               <div class="space-y-4 animate-fade-in bg-gray-50/50 p-4 rounded-2xl">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                       <label class="block text-xs font-bold text-gray-500 mb-1">姓名</label>
                       <input [(ngModel)]="editName" class="w-full bg-white border border-gray-200 rounded-xl p-3 font-bold text-brand-900 focus:ring-2 focus:ring-brand-200 outline-none focus:border-brand-300 transition-all">
                    </div>
                    <div>
                       <label class="block text-xs font-bold text-gray-500 mb-1">手機號碼 (修改後須用新號碼登入)</label>
                       <input [(ngModel)]="editPhone" type="tel" class="w-full bg-white border border-gray-200 rounded-xl p-3 font-bold text-brand-900 focus:ring-2 focus:ring-brand-200 outline-none focus:border-brand-300 transition-all">
                    </div>
                    <div>
                       <label class="block text-xs font-bold text-gray-500 mb-1">生日</label>
                       <input type="date" [(ngModel)]="editBirthday" class="w-full bg-white border border-gray-200 rounded-xl p-3 font-bold text-brand-900 focus:ring-2 focus:ring-brand-200 outline-none focus:border-brand-300 transition-all">
                    </div>
                  </div>
                  
                  <div class="flex justify-end gap-2 mt-4 pt-2 border-t border-gray-200/50">
                    <button (click)="isEditingProfile.set(false)" class="px-6 py-2.5 rounded-xl text-gray-500 font-bold hover:bg-gray-100 transition-colors">取消</button>
                    <button (click)="saveProfile()" class="px-6 py-2.5 rounded-xl bg-brand-900 text-white font-bold hover:bg-black shadow-lg hover:shadow-xl transition-all active:scale-95">
                       儲存變更
                    </button>
                  </div>
               </div>
             }
          </div>

          <!-- Status Indicators / Legend -->
          <div class="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-50">
             <h4 class="font-bold text-gray-400 text-xs uppercase tracking-widest mb-3">訂單狀態說明</h4>
             <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div class="flex items-center gap-2">
                   <div class="w-3 h-3 rounded-full bg-yellow-100"></div>
                   <div>
                     <div class="font-bold text-brand-900">未對帳</div>
                     <div class="text-xs text-gray-400">已填匯款單，等待確認</div>
                   </div>
                </div>
                <div class="flex items-center gap-2">
                   <div class="w-3 h-3 rounded-full bg-green-100"></div>
                   <div>
                     <div class="font-bold text-brand-900">對帳成功</div>
                     <div class="text-xs text-gray-400">款項確認，準備出貨</div>
                   </div>
                </div>
                 <div class="flex items-center gap-2">
                   <div class="w-3 h-3 rounded-full bg-red-100"></div>
                   <div>
                     <div class="font-bold text-red-700">未付款</div>
                     <div class="text-xs text-gray-400">請盡速匯款並回報</div>
                   </div>
                </div>
                <div class="flex items-center gap-2">
                   <div class="w-3 h-3 rounded-full bg-blue-50"></div>
                   <div>
                     <div class="font-bold text-brand-900">已出貨</div>
                     <div class="text-xs text-gray-400">包裹已寄出，可追蹤</div>
                   </div>
                </div>
             </div>
          </div>

          <!-- Order History -->
          <div class="px-2">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4 px-2 gap-2">
               <h3 class="text-xl font-bold text-brand-900">我的訂單</h3>
               <div class="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full flex items-center gap-1">
                 <span>💬 訂單有問題？請加入官方 LINE:</span>
                 <span class="font-bold text-brand-600 select-all">&#64;289wxmsb</span>
               </div>
            </div>
            
            <div class="space-y-4">
              @for (o of myOrders(); track o.id) {
                <div class="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-50 hover:shadow-md transition-shadow">
                  <div class="flex justify-between items-start mb-4">
                    <div class="flex flex-col">
                       <span class="text-2xl font-bold text-brand-900">NT$ {{ o.finalTotal | number }}</span>
                       <span class="text-xs text-gray-400 mt-1">{{ o.createdAt | date:'yyyy/MM/dd HH:mm' }}</span>
                       @if(o.usedCredits > 0) {
                         <span class="text-xs text-brand-500 font-bold mt-1">已折抵購物金 \${{o.usedCredits}}</span>
                       }
                    </div>
                    <span [class]="getStatusClass(o.status)" class="px-4 py-2 rounded-xl text-xs font-bold border border-transparent">
                      {{ getStatusLabel(o.status) }}
                    </span>
                  </div>
                  
                  <div class="bg-cream-50 rounded-xl p-4 mb-4">
                    @for (item of o.items; track item.productId) {
                      <div class="flex justify-between text-sm py-1 border-b border-gray-200/50 last:border-0">
                        <span class="text-gray-600">{{ item.productName }} <span class="text-xs text-gray-400">({{ item.option }})</span></span>
                        <span class="font-bold text-gray-800">x{{ item.quantity }}</span>
                      </div>
                    }
                  </div>

                  <div class="flex gap-2 mt-4 flex-wrap">
                     <button class="flex-1 min-w-[120px] py-3 bg-brand-50 text-brand-900 rounded-xl font-bold text-sm hover:bg-brand-100 transition-colors" (click)="copyOrderInfo(o.id)">
                       複製訂單編號
                     </button>
                     
                     <!-- Report Payment Button -->
                     @if(o.status === 'pending_payment' || o.status === 'unpaid_alert') {
                        <button (click)="openPaymentModal(o)" class="flex-1 min-w-[120px] py-3 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-colors shadow-sm animate-pulse">
                          回報匯款
                        </button>
                     }

                     @if (o.shippingLink) {
                        <a [href]="o.shippingLink" target="_blank" class="flex-1 min-w-[120px] py-3 bg-brand-900 text-white rounded-xl font-bold text-sm text-center hover:bg-black transition-colors">
                          追蹤貨態
                        </a>
                     }
                  </div>
                </div>
              } @empty {
                <div class="text-center py-12 text-gray-400 bg-white rounded-[2rem] border border-dashed border-gray-200">
                  <p>尚無訂單紀錄</p>
                  <button (click)="goToShop()" class="mt-4 text-brand-600 underline hover:text-brand-800 transition-colors">去逛逛</button>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Payment Report Modal -->
      @if(reportModalOrder()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" (click)="closeReportModal()">
           <div class="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm p-8" (click)="$event.stopPropagation()">
              <h3 class="text-xl font-bold text-gray-800 mb-2">回報匯款資訊</h3>
              <p class="text-sm text-gray-500 mb-6">訂單: {{ reportModalOrder()?.id }}</p>
              
              <div class="space-y-4">
                 <div>
                    <label class="block text-sm font-bold text-gray-600 mb-1">匯款戶名</label>
                    <input type="text" [(ngModel)]="reportName" class="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-brand-300">
                 </div>
                 <div>
                    <label class="block text-sm font-bold text-gray-600 mb-1">匯款時間</label>
                    <input type="datetime-local" [(ngModel)]="reportTime" class="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-brand-300">
                 </div>
                 <div>
                    <label class="block text-sm font-bold text-gray-600 mb-1">帳號後五碼</label>
                    <input type="text" [(ngModel)]="reportLast5" maxlength="5" class="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-brand-300" placeholder="12345">
                 </div>
                 <button (click)="submitPaymentReport()" class="w-full py-4 bg-brand-900 text-white rounded-xl font-bold shadow-lg hover:bg-black mt-2">
                    送出對帳
                 </button>
              </div>
           </div>
        </div>
      }
    </div>
  `,
  styles: [`
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class MemberAreaComponent {
  public storeService = inject(StoreService);
  router: Router = inject(Router);

  mode = signal<'check_phone' | 'register'>('check_phone');
  phoneInput = '';
  nameInput = '';

  // Profile Edit State
  isEditingProfile = signal(false);
  editName = '';
  editPhone = '';
  editBirthday = '';

  // Payment Report Modal State
  reportModalOrder = signal<Order | null>(null);
  reportName = '';
  reportTime = '';
  reportLast5 = '';

  checkPhone() {
    if (!this.phoneInput) return;
    const user = this.storeService.login(this.phoneInput);
    if (!user) {
      this.mode.set('register');
    }
  }

  doRegister() {
    if (!this.nameInput) return;
    this.storeService.register(this.phoneInput, this.nameInput);
    this.mode.set('check_phone');
  }

  // --- Profile Actions ---
  startEditing() {
    const u = this.storeService.currentUser();
    if (u) {
      this.editName = u.name;
      this.editPhone = u.phone;
      this.editBirthday = u.birthday || '';
      this.isEditingProfile.set(true);
    }
  }

  saveProfile() {
    const u = this.storeService.currentUser();
    if (u && this.editName && this.editPhone) {
      this.storeService.updateUser({
        ...u,
        name: this.editName,
        phone: this.editPhone,
        birthday: this.editBirthday
      });
      this.isEditingProfile.set(false);
    } else {
       alert('姓名與電話為必填欄位');
    }
  }

  myOrders = computed(() => {
    const uid = this.storeService.currentUser()?.id;
    return this.storeService.orders()
      .filter(o => o.userId === uid)
      .sort((a,b) => b.createdAt - a.createdAt);
  });
  
  goToShop() {
     this.router.navigate(['/']);
  }

  copyOrderInfo(id: string) {
    navigator.clipboard.writeText(id).then(() => alert('已複製訂單編號！'));
  }

  openPaymentModal(order: Order) {
     this.reportModalOrder.set(order);
     this.reportName = order.paymentName || '';
     this.reportTime = order.paymentTime || '';
     this.reportLast5 = order.paymentLast5 || '';
  }

  closeReportModal() {
     this.reportModalOrder.set(null);
  }

  submitPaymentReport() {
     const order = this.reportModalOrder();
     if(order && this.reportName && this.reportTime && this.reportLast5) {
        this.storeService.reportPayment(order.id, {
           name: this.reportName,
           time: this.reportTime,
           last5: this.reportLast5
        });
        this.closeReportModal();
        alert('匯款資訊已更新，請等待管理員對帳。');
     } else {
        alert('請填寫完整資訊');
     }
  }

  getStatusLabel(status: string) {
    const map: any = {
      'pending_payment': '未付款',
      'paid_verifying': '未對帳 (等待確認)',
      'unpaid_alert': '⚠️ 尚未收到款項',
      'refund_needed': '需退款',  
      'refunded': '已退款', // Added
      'payment_confirmed': '✅ 已付款 (對帳成功)',
      'shipped': '已出貨',
      'completed': '完成',
      'cancelled': '🚫 已取消'
    };
    return map[status] || status;
  }

  getStatusClass(status: string) {
    const map: any = {
      'pending_payment': 'bg-red-50 text-red-500',
      'paid_verifying': 'bg-yellow-100 text-yellow-700 font-bold',
      'unpaid_alert': 'bg-red-100 text-red-600 border border-red-200 font-bold animate-pulse',
      'refund_needed': 'bg-white text-red-600 border border-red-200',
      'refunded': 'bg-gray-100 text-gray-400 line-through', // Added specific style
      'payment_confirmed': 'bg-green-100 text-green-700 font-bold',
      'shipped': 'bg-blue-50 text-blue-700',
      'completed': 'bg-gray-800 text-white',
      'cancelled': 'bg-gray-200 text-gray-400 border border-gray-300'
    };
    return map[status] || 'bg-gray-100';
  }
}
