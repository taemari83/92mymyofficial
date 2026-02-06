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
    <div class="max-w-md mx-auto p-4 pb-24">
      
      <div *ngIf="!storeService.currentUser()">
        
        <div class="bg-white p-6 rounded-2xl shadow-sm text-center">
          <h2 class="text-xl font-bold mb-6 text-brand-900">會員登入</h2>

          <button 
            (click)="handleGoogleLogin()"
            class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg font-bold mb-4 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
            <svg class="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"/>
              <path fill="#EA4335" d="M12 4.61c1.61 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.09 14.97 0 12 0 7.7 0 3.99 2.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            使用 Google 帳號登入
          </button>
          
          <div class="relative mb-4">
            <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-gray-300"></div></div>
            <div class="relative flex justify-center text-sm"><span class="px-2 bg-white text-gray-500">或使用手機號碼</span></div>
          </div>

          <div *ngIf="mode() === 'check_phone'">
             <input type="tel" [(ngModel)]="phoneInput" placeholder="輸入手機號碼" 
               class="w-full p-3 border rounded-lg bg-gray-50 mb-4 text-lg outline-none focus:ring-2 focus:ring-brand-500">
             
             <button (click)="checkPhone()" class="w-full mt-4 py-4 bg-brand-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-brand-200 active:scale-95 transition-all">
                下一步
             </button>
          </div>

          <div *ngIf="mode() === 'register'">
             <div class="text-left mb-4 bg-yellow-50 p-3 rounded-lg text-sm text-yellow-800">
               這支號碼尚未註冊，請填寫暱稱加入會員：
             </div>
             <input type="text" [(ngModel)]="nameInput" placeholder="如何稱呼您？(例: 芸姐)" 
               class="w-full p-3 border rounded-lg bg-gray-50 mb-4 text-lg outline-none focus:ring-2 focus:ring-brand-500">
             
             <button (click)="doRegister()" class="w-full py-4 bg-brand-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-brand-200 active:scale-95 transition-all">
                確認註冊
             </button>
             <button (click)="mode.set('check_phone')" class="mt-4 text-gray-400 text-sm underline">回上一步</button>
          </div>
        </div>

      </div>

      <div *ngIf="storeService.currentUser() as user">
        
        <div class="flex items-center gap-4 mb-6">
          <div class="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center text-2xl overflow-hidden border-2 border-white shadow-md">
            <img *ngIf="user.photoURL" [src]="user.photoURL" class="w-full h-full object-cover">
            <span *ngIf="!user.photoURL">😊</span>
          </div>
          <div>
            <h2 class="text-xl font-bold">{{ user.name }}</h2>
            <div class="flex items-center gap-2 text-sm text-gray-500">
               <span class="px-2 py-0.5 bg-gray-100 rounded text-xs">{{ user.tier === 'vip' ? 'VIP 會員' : '一般會員' }}</span>
               <span>購物金: ${{ user.credits }}</span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 mb-6">
           <button class="bg-white p-4 rounded-xl shadow-sm text-center active:scale-95 transition-transform" (click)="startEditing()">
              <div class="text-2xl mb-1">📝</div>
              <div class="text-sm font-bold text-gray-600">修改資料</div>
           </button>
           <button class="bg-white p-4 rounded-xl shadow-sm text-center active:scale-95 transition-transform">
              <div class="text-2xl mb-1">🎁</div>
              <div class="text-sm font-bold text-gray-600">我的優惠</div>
           </button>
           <a href="https://line.me/ti/p/~&#64;289wxmsb" target="_blank" class="bg-white p-4 rounded-xl shadow-sm text-center active:scale-95 transition-transform">
              <div class="text-2xl mb-1">💬</div>
              <div class="text-sm font-bold text-gray-600">聯絡客服</div>
           </a>
           <button class="bg-white p-4 rounded-xl shadow-sm text-center active:scale-95 transition-transform" (click)="storeService.logout()">
              <div class="text-2xl mb-1">🚪</div>
              <div class="text-sm font-bold text-gray-600">登出</div>
           </button>
        </div>

        <div *ngIf="user.isAdmin" class="mb-6">
           <button (click)="router.navigate(['/admin'])" class="w-full py-3 bg-gray-800 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2">
             <span>⚙️</span> 進入後台管理
           </button>
        </div>

        <div *ngIf="isEditingProfile()" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
           <div class="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl animate-in fade-in zoom-in duration-200">
              <h3 class="font-bold text-lg mb-4 text-center">修改個人資料</h3>
              
              <div class="space-y-3">
                 <div>
                   <label class="text-xs text-gray-500 pl-1">暱稱</label>
                   <input type="text" [(ngModel)]="editName" class="w-full p-2 bg-gray-50 border rounded-lg">
                 </div>
                 <div>
                   <label class="text-xs text-gray-500 pl-1">手機 (帳號)</label>
                   <input type="tel" [(ngModel)]="editPhone" class="w-full p-2 bg-gray-50 border rounded-lg">
                 </div>
                 <div>
                   <label class="text-xs text-gray-500 pl-1">生日 (選填)</label>
                   <input type="date" [(ngModel)]="editBirthday" class="w-full p-2 bg-gray-50 border rounded-lg">
                 </div>
              </div>

              <div class="flex gap-2 mt-6">
                 <button (click)="isEditingProfile.set(false)" class="flex-1 py-2.5 text-gray-500 font-bold bg-gray-100 rounded-lg">取消</button>
                 <button (click)="saveProfile()" class="flex-1 py-2.5 bg-brand-600 text-white font-bold rounded-lg shadow-lg shadow-brand-200">儲存</button>
              </div>
           </div>
        </div>

        <div class="bg-white rounded-2xl shadow-sm p-5 min-h-[300px]">
           <h3 class="font-bold text-lg mb-4 border-b pb-2 flex justify-between items-center">
             我的訂單
             <span class="text-xs font-normal text-gray-400">僅顯示最近 10 筆</span>
           </h3>

           <div *ngIf="myOrders().length === 0" class="text-center py-12 text-gray-400">
              <div class="text-4xl mb-2">🛍️</div>
              <p>還沒有訂單喔</p>
              <button (click)="goToShop()" class="mt-4 text-brand-600 font-bold underline">去逛逛</button>
           </div>

           <div class="space-y-4">
              @for (o of myOrders(); track o.id) {
                 <div class="border border-gray-100 rounded-xl p-4 hover:border-brand-200 transition-colors bg-gray-50/50">
                    <div class="flex justify-between items-start mb-2">
                       <div>
                          <div class="text-xs text-gray-400">訂單編號</div>
                          <div class="font-mono font-bold text-gray-700 flex items-center gap-1">
                            #{{ o.id }}
                            <button (click)="copyOrderInfo(o.id)" class="text-gray-300 hover:text-brand-500 px-1">📋</button>
                          </div>
                       </div>
                       <span [class]="getStatusClass(o.status)" class="px-2 py-1 rounded text-xs font-bold">
                          {{ getStatusLabel(o.status) }}
                       </span>
                    </div>

                    <div class="text-sm text-gray-600 mb-3 space-y-1">
                       <div class="flex justify-between">
                         <span>下單時間</span>
                         <span>{{ o.createdAt | date:'MM/dd HH:mm' }}</span>
                       </div>
                       <div class="flex justify-between font-bold text-gray-900 pt-1 border-t border-dashed">
                         <span>總金額</span>
                         <span>$ {{ o.finalTotal }}</span>
                       </div>
                    </div>

                    <div *ngIf="o.paymentMethod === 'bank_transfer' && (o.status === 'pending_payment' || o.status === 'unpaid_alert')" class="mt-3">
                       <div class="bg-blue-50 p-3 rounded-lg text-xs text-blue-800 mb-2">
                          請匯款至：<br>
                          <span class="font-bold select-all">822 (中國信託)</span><br>
                          <span class="font-bold select-all">1234-5678-9012</span><br>
                          匯款後請點擊下方按鈕回報。
                       </div>
                       <button (click)="openPaymentModal(o)" class="w-full py-2 bg-blue-600 text-white rounded-lg font-bold text-sm shadow-md active:scale-95 transition-transform">
                          回報匯款資料
                       </button>
                    </div>

                    <div class="mt-3 flex gap-2">
                       <button class="flex-1 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-500 hover:bg-gray-50 transition-colors" (click)="copyOrderInfo(o.id)">
                          複製訂單資料
                       </button>
                       <a href="https://line.me/ti/p/~&#64;289wxmsb" target="_blank" class="flex-1 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-500 text-center hover:bg-gray-50 transition-colors">
                          聯絡客服
                       </a>
                    </div>
                 </div>
              }
           </div>
        </div>
      </div>

      <div *ngIf="reportModalOrder()" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" (click)="closeReportModal()">
         <div class="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl animate-in fade-in zoom-in duration-200" (click)="$event.stopPropagation()">
            <h3 class="font-bold text-lg mb-1 text-center">回報匯款</h3>
            <p class="text-xs text-gray-400 text-center mb-4">訂單 #{{ reportModalOrder()?.id }}</p>

            <div class="space-y-3">
               <div>
                 <label class="text-xs text-gray-500 pl-1">匯款人姓名</label>
                 <input type="text" [(ngModel)]="reportName" placeholder="例：王小美" class="w-full p-2 bg-gray-50 border rounded-lg">
               </div>
               <div>
                 <label class="text-xs text-gray-500 pl-1">匯款時間</label>
                 <input type="datetime-local" [(ngModel)]="reportTime" class="w-full p-2 bg-gray-50 border rounded-lg">
               </div>
               <div>
                 <label class="text-xs text-gray-500 pl-1">帳號後五碼</label>
                 <input type="text" [(ngModel)]="reportLast5" placeholder="例：12345" maxlength="5" class="w-full p-2 bg-gray-50 border rounded-lg">
               </div>
            </div>

            <div class="flex gap-2 mt-6">
               <button (click)="closeReportModal()" class="flex-1 py-2.5 text-gray-500 font-bold bg-gray-100 rounded-lg">取消</button>
               <button (click)="submitPaymentReport()" class="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-lg shadow-lg shadow-blue-200">送出</button>
            </div>
         </div>
      </div>

    </div>
  `
})
export class MemberAreaComponent {
  storeService = inject(StoreService);
  router = inject(Router);

  mode = signal<'check_phone' | 'register'>('check_phone');
  phoneInput = '';
  nameInput = '';

  isEditingProfile = signal(false);
  editName = '';
  editPhone = '';
  editBirthday = '';

  reportModalOrder = signal<Order | null>(null);
  reportName = '';
  reportTime = '';
  reportLast5 = '';

  async handleGoogleLogin() {
    await this.storeService.loginWithGoogle();
  }

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

  startEditing() {
    const u = this.storeService.currentUser();
    if (u) {
       this.editName = u.name;
       this.editPhone = u.phone || '';
       this.editBirthday = u.birthday || '';
       this.isEditingProfile.set(true);
    }
  }

  saveProfile() {
    const u = this.storeService.currentUser();
    if (u && this.editName) { 
       this.storeService.updateUser({
         ...u,
         name: this.editName,
         phone: this.editPhone,
         birthday: this.editBirthday
       });
       this.isEditingProfile.set(false);
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
     navigator.clipboard.writeText(id).then(() => alert('已複製訂單編號'));
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
     }
  }

  getStatusLabel(status: string) {
     const map: any = {
       'pending_payment': '待付款',
       'paid_verifying': '查帳中',
       'unpaid_alert': '未付款提醒',
       'payment_confirmed': '已付款',
       'shipped': '已出貨',
       'completed': '已完成',
       'cancelled': '已取消'
     };
     return map[status] || status;
  }

  getStatusClass(status: string) {
     const map: any = {
       'pending_payment': 'bg-red-100 text-red-600',
       'paid_verifying': 'bg-blue-100 text-blue-600',
       'payment_confirmed': 'bg-green-100 text-green-600',
       'shipped': 'bg-purple-100 text-purple-600',
       'completed': 'bg-gray-200 text-gray-600',
       'cancelled': 'bg-gray-100 text-gray-400'
     };
     return map[status] || 'bg-gray-100';
  }
}