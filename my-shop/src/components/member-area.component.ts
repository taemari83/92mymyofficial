import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../services/store.service';

@Component({
  selector: 'app-member-area',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto mt-10">
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
              <div class="font-bold text-lg">NT$ {{ storeService.currentUser()?.totalSpend | number }}</div>
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

                    <div class="flex justify-between items-end border-t border-gray-100 pt-2 mt-2">
                      <div>
                        <div class="text-xs text-gray-500 mb-1">
                          {{ order.createdAt | date:'yyyy/MM/dd HH:mm' }}
                        </div>
                        <span class="inline-block px-2 py-0.5 rounded text-xs font-bold"
                           [class.bg-yellow-100]="order.status === 'pending_payment'"
                           [class.text-yellow-800]="order.status === 'pending_payment'"
                           [class.bg-blue-100]="order.status === 'payment_confirmed' || order.status === 'shipped'"
                           [class.text-blue-800]="order.status === 'payment_confirmed' || order.status === 'shipped'"
                           [class.bg-green-100]="order.status === 'completed'"
                           [class.text-green-800]="order.status === 'completed'"
                           [class.bg-purple-100]="order.status === 'arrived_notified'"
                           [class.text-purple-800]="order.status === 'arrived_notified'">
                          @switch(order.status) {
                            @case('pending_payment') { 待付款 }
                            @case('paid_verifying') { 對帳中 }
                            @case('payment_confirmed') { 已付款 / 待出貨 }
                            @case('shipped') { 已出貨 }
                            @case('arrived_notified') { 貨到 / 請下單賣貨便 }
                            @case('completed') { 已完成 }
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
                  </div>
                }
              </div>
            }
          </div>
          @if (storeService.currentUser()?.isAdmin) {
             <a href="/admin" class="block w-full text-center py-2 bg-gray-800 text-white rounded hover:bg-gray-700">
               進入管理員後台
             </a>
          }

          <button 
            (click)="logout()"
            class="w-full bg-red-50 text-red-600 border border-red-200 py-2 rounded-lg hover:bg-red-100 transition-colors">
            登出
          </button>
        </div>
      }
    </div>
  `,
  styles: []
})
export class MemberAreaComponent {
  storeService = inject(StoreService);

  // 🔥 新增：動態計算屬性，將原始訂單依照 createdAt 時間戳記由大到小（最新到最舊）排序
  sortedOrders = computed(() => {
    return [...this.storeService.orders()].sort((a, b) => b.createdAt - a.createdAt);
  });

  async loginWithGoogle() {
    await this.storeService.loginWithGoogle();
  }

  logout() {
    this.storeService.logout();
  }
}