import { Component, inject } from '@angular/core';
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
            會員編號: {{ storeService.currentUser()?.memberId || storeService.currentUser()?.id }}
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

  async loginWithGoogle() {
    await this.storeService.loginWithGoogle();
  }

  logout() {
    this.storeService.logout();
  }
}