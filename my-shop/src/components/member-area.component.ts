import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../services/store.service';

@Component({
  selector: 'app-member-area',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto mt-10 mb-20">
      <h2 class="text-2xl font-bold mb-6 text-center text-gray-800">會員專區</h2>

      @if (!storeService.currentUser()) {
        <div class="flex flex-col items-center gap-4">
          <p class="text-gray-600 mb-2">請登入以查看訂單與會員優惠</p>
          
          <button 
            (click)="loginWithGoogle()"
            class="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-all shadow-sm">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" class="w-6 h-6" alt="Google Logo">
            使用 Google 帳號登入
          </button>
        </div>
      } 
      
      @else {
        <div class="space-y-6">
          <div class="flex items-center gap-4 border-b pb-4">
            @if (storeService.currentUser()?.photoURL) {
              <img [src]="storeService.currentUser()?.photoURL" class="w-16 h-16 rounded-full border-2 border-primary">
            } @else {
              <div class="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl">
                {{ storeService.currentUser()?.name?.charAt(0) }}
              </div>
            }
            <div>
              <h3 class="font-bold text-lg">{{ storeService.currentUser()?.name }}</h3>
              <p class="text-sm text-gray-500">{{ storeService.currentUser()?.email }}</p>
              <div class="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                [ngClass]="{
                  'bg-yellow-100 text-yellow-800': storeService.currentUser()?.tier === 'vip',
                  'bg-gray-100 text-gray-800': storeService.currentUser()?.tier === 'general',
                  'bg-purple-100 text-purple-800': storeService.currentUser()?.tier === 'wholesale'
                }">
                {{ storeService.currentUser()?.tier === 'vip' ? 'VIP 會員' : 
                   storeService.currentUser()?.tier === 'wholesale' ? '批發會員' : '一般會員' }}
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 text-center">
            <div class="bg-gray-50 p-3 rounded-lg">
              <div class="text-gray-500 text-xs mb-1">累積消費</div>
              <div class="font-bold text-lg">NT$ {{ calculatedTotalSpend() | number }}</div>
            </div>
            <div class="bg-gray-50 p-3 rounded-lg">
              <div class="text-gray-500 text-xs mb-1">購物金</div>
              <div class="font-bold text-lg text-primary">NT$ {{ storeService.currentUser()?.credits | number }}</div>
            </div>
          </div>
          
          <div class="text-center text-sm text-gray-400">
            會員編號: {{ storeService.currentUser()?.memberNo || storeService.currentUser()?.memberId || storeService.currentUser()?.id }}
          </div>

          <div class="mt-4 pt-4 border-t border-gray-100">
            <h3 class="font-bold text-gray-800 text-lg mb-4">📦 我的訂單紀錄</h3>
            
            @if(sortedOrders().length === 0) {
              <div class="text-center text-gray-400 py-4 text-sm bg-gray-50 rounded-lg">
                目前沒有訂單紀錄
              </div>
            } @else {
              <div class="space-y-4">
                @for(order of sortedOrders(); track order.id) {
                  <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-gray-300 transition-colors">
                    
                    <div class="flex justify-between items-center mb-2">
                      <div class="flex items-center gap-2 overflow-hidden">
                        <span class="text-xs text-gray-400 font-bold shrink-0">編號</span>
                        <span class="font-mono text-sm font-bold text-gray-800 truncate">{{ order.id }}</span>
                      </div>
                      <button (click)="storeService.copyToClipboard(order.id)" class="shrink-0 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-xs text-gray-600 rounded-lg transition-colors font-bold border border-gray-200">
                        複製
                      </button>
                    </div>

                    <div class="mt-3 mb-3 space-y-2">
                      @for(item of order.items; track item.productId + item.option) {
                        <div class="flex items-center gap-3 bg-gray-50/50 p-2 rounded-lg">
                          <div class="w-12 h-12 rounded-md bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                            <img [src]="item.productImage" class="w-full h-full object-cover" onerror="this.src='https://placehold.co/100x100?text=No+Image'">
                          </div>
                          <div class="flex-1 min-w-0">
                            <div class="text-sm font-bold text-gray-800 truncate">{{ item.productName }}</div>
                            <div class="text-xs text-gray-500">{{ item.option }}</div>
                          </div>
                          <div class="text-right shrink-0">
                            <div class="text-sm font-bold text-gray-800">NT$ {{ item.price }}</div>
                            <div class="text-xs text-gray-500">x{{ item.quantity }}</div>
                          </div>
                        </div>
                      }
                    </div>

                    <div class="flex justify-between items-end border-t border-gray-100 pt-3 mt-2">
                      <div>
                        <div class="text-xs text-gray-500 mb-1">
                          {{ order.createdAt | date:'yyyy/MM/dd HH:mm' }}
                        </div>
                        <span class="inline-block px-2 py-0.5 rounded text-xs font-bold"
                           [class.bg-yellow-100]="order.status === 'pending_payment' || order.status === 'paid_verifying' || order.status === 'unpaid_alert'"
                           [class.text-yellow-800]="order.status === 'pending_payment' || order.status === 'paid_verifying' || order.status === 'unpaid_alert'"
                           [class.bg-blue-100]="order.status === 'payment_confirmed' || order.status === 'shipped' || order.status === 'pending_shipping'"
                           [class.text-blue-800]="order.status === 'payment_confirmed' || order.status === 'shipped' || order.status === 'pending_shipping'"
                           [class.bg-green-100]="order.status === 'completed' || order.status === 'picked_up'"
                           [class.text-green-800]="order.status === 'completed' || order.status === 'picked_up'"
                           [class.bg-purple-100]="order.status === 'arrived_notified'"
                           [class.text-purple-800]="order.status === 'arrived_notified'"
                           [class.bg-red-100]="order.status === 'refund_needed' || order.status === 'refunded' || order.status === 'cancelled'"
                           [class.text-red-800]="order.status === 'refund_needed' || order.status === 'refunded' || order.status === 'cancelled'">
                          @switch(order.status) {
                            @case('pending_payment') { 待付款 }
                            @case('paid_verifying') { 匯款對帳中 }
                            @case('unpaid_alert') { 逾期未付 }
                            @case('payment_confirmed') { 已付款 / 待出貨 }
                            @case('pending_shipping') { 待出貨 }
                            @case('shipped') { 已出貨 }
                            @case('arrived_notified') { 貨到門市 (請留意簡訊) }
                            @case('picked_up') { 門市已取貨 }
                            @case('completed') { 訂單已完成 }
                            @case('refund_needed') { 需退款 / 異常 }
                            @case('refunded') { 已退款 }
                            @case('cancelled') { 已取消 }
                            @default { {{order.status}} }
                          }
                        </span>
                      </div>
                      <div class="text-right">
                        <div class="text-lg font-bold text-gray-800">
                          NT$ {{ order.finalTotal | number }}
                        </div>
                      </div>
                    </div>

                    @if (order.paymentMethod === 'bank_transfer' && (order.status === 'pending_payment' || order.status === 'unpaid_alert')) {
                      <div class="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl animate-fade-in">
                        <div class="text-sm font-bold text-blue-800 mb-2">💰 請填寫匯款後五碼</div>
                        <div class="flex gap-2">
                          <input #last5Input type="text" maxlength="5" placeholder="輸入帳號後 5 碼" class="flex-1 p-2.5 rounded-lg border border-blue-200 focus:outline-none focus:border-blue-400 font-mono font-bold text-center tracking-widest text-brand-900">
                          <button (click)="submitPaymentInfo(order, last5Input.value)" class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors active:scale-95 shadow-sm whitespace-nowrap">
                            送出對帳
                          </button>
                        </div>
                        <p class="text-[10px] text-blue-500 mt-1.5">* 匯款帳號：凱基銀行(809) 606-904-0006-7288</p>
                      </div>
                    }

                    @if (order.shippingLink && (order.status === 'shipped' || order.status === 'arrived_notified' || order.status === 'completed' || order.status === 'picked_up')) {
                      <div class="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between animate-fade-in">
                        <div class="flex items-center gap-3 overflow-hidden">
                           <span class="text-2xl shrink-0">🚚</span>
                           <div class="min-w-0">
                             <div class="text-xs font-bold text-gray-500">包裹追蹤碼 / 連結</div>
                             <div class="text-sm font-bold text-brand-900 font-mono select-all truncate">{{ order.shippingLink }}</div>
                           </div>
                        </div>
                        <a [href]="order.shippingLink.startsWith('http') ? order.shippingLink : 'https://myship.7-11.com.tw/general/detail/GM2602124017223'" target="_blank" class="shrink-0 ml-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-100 shadow-sm transition-colors text-decoration-none">
                          追蹤包裹
                        </a>
                      </div>
                    }

                    <button (click)="contactLine(order.id)" class="mt-4 w-full py-3 bg-[#00B900] hover:bg-[#00A000] text-white font-bold rounded-xl flex justify-center items-center gap-2 transition-colors shadow-sm active:scale-95">
                      <span class="text-xl">💬</span> 用 LINE 聯絡客服
                    </button>

                  </div>
                }
              </div>
            }
          </div>
          @if (storeService.currentUser()?.isAdmin) {
             <a href="/admin" class="block w-full text-center py-2 bg-gray-800 text-white rounded hover:bg-gray-700 mt-6">
               進入管理員後台
             </a>
          }

          <button 
            (click)="logout()"
            class="w-full bg-red-50 text-red-600 border border-red-200 py-2 rounded-lg hover:bg-red-100 transition-colors mt-4">
            登出
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class MemberAreaComponent {
  storeService = inject(StoreService);

  myOwnOrders = computed(() => {
    const user = this.storeService.currentUser();
    const allOrders = this.storeService.orders();
    if (!user) return [];
    
    return allOrders.filter(o => o.userId === user.id);
  });

  sortedOrders = computed(() => {
    return [...this.myOwnOrders()].sort((a, b) => b.createdAt - a.createdAt);
  });

  calculatedTotalSpend = computed(() => {
    const validStatuses = ['payment_confirmed', 'pending_shipping', 'shipped', 'arrived_notified', 'picked_up', 'completed'];
    return this.myOwnOrders()
      .filter(o => validStatuses.includes(o.status))
      .reduce((sum, o) => sum + o.finalTotal, 0);
  });

  async loginWithGoogle() {
    await this.storeService.loginWithGoogle();
  }

  logout() {
    this.storeService.logout();
  }

  async submitPaymentInfo(order: any, last5: string) {
    const cleanLast5 = last5.trim();
    if (!cleanLast5 || cleanLast5.length < 5) {
      alert('⚠️ 請輸入完整的帳號後 5 碼！');
      return;
    }
    
    if (!confirm(`確認送出後五碼「${cleanLast5}」嗎？\n送出後系統將為您切換為對帳中。`)) return;

    try {
      await this.storeService.updateOrderStatus(order.id, 'paid_verifying', { paymentLast5: cleanLast5 });
      alert('✅ 成功送出！請稍候，客服確認款項後會立即為您安排出貨！');
    } catch(e) {
      alert('❌ 送出失敗，請檢查網路連線或稍後再試。');
    }
  }

  // 🚀 核心功能：一鍵自動帶入訂單編號並導向 LINE 客服
  contactLine(orderId: string) {
    // 預先幫客人打好的訊息範本，讓他們不用自己手打編號
    const message = `訂單編號：#${orderId}\n我想詢問關於這筆訂單的問題：\n`;
    
    // 把文字轉換為網址可以讀懂的格式
    const encodedMessage = encodeURIComponent(message);
    
    // 綁定官方 LINE 帳號 ID 與預設訊息
    const lineUrl = `https://line.me/R/oaMessage/@289wxmsb/?${encodedMessage}`;
    
    // 開啟新視窗跳轉至 LINE
    window.open(lineUrl, '_blank');
  }
}