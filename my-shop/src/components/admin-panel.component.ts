import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreService, User, Product, Order } from '../services/store.service';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 pb-20">
      <nav class="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex items-center gap-8">
              <span class="text-2xl font-black text-brand-900 tracking-tight">MYMY ADMIN</span>
              <div class="flex space-x-1">
                <button (click)="activeTab.set('orders')" class="px-4 py-2 rounded-lg text-sm font-bold transition-colors" 
                  [class.bg-brand-50]="activeTab() === 'orders'" [class.text-brand-900]="activeTab() === 'orders'" [class.text-gray-500]="activeTab() !== 'orders'">
                  訂單管理
                </button>
                <button (click)="activeTab.set('products')" class="px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                  [class.bg-brand-50]="activeTab() === 'products'" [class.text-brand-900]="activeTab() === 'products'" [class.text-gray-500]="activeTab() !== 'products'">
                  商品管理
                </button>
                <button (click)="activeTab.set('customers')" class="px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                  [class.bg-brand-50]="activeTab() === 'customers'" [class.text-brand-900]="activeTab() === 'customers'" [class.text-gray-500]="activeTab() !== 'customers'">
                  客戶管理
                </button>
              </div>
            </div>
            <div class="flex items-center">
              <button (click)="logout()" class="text-sm font-bold text-gray-400 hover:text-red-500">登出</button>
            </div>
          </div>
        </div>
      </nav>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        @if (activeTab() === 'orders') {
          <div class="space-y-6">
            <div class="flex items-center justify-between">
               <div>
                  <h1 class="text-3xl font-bold text-gray-900">訂單管理</h1>
                  <p class="text-gray-500 mt-1">查看並處理所有客戶訂單</p>
               </div>
               <div class="flex gap-2">
                 <button (click)="orderFilter.set('all')" class="px-4 py-2 rounded-full text-sm font-bold border transition-colors" [class.bg-black]="orderFilter() === 'all'" [class.text-white]="orderFilter() === 'all'" [class.border-transparent]="orderFilter() === 'all'" [class.bg-white]="orderFilter() !== 'all'" [class.text-gray-600]="orderFilter() !== 'all'">全部</button>
                 <button (click)="orderFilter.set('pending')" class="px-4 py-2 rounded-full text-sm font-bold border transition-colors" [class.bg-yellow-100]="orderFilter() === 'pending'" [class.text-yellow-700]="orderFilter() === 'pending'" [class.border-yellow-200]="orderFilter() === 'pending'" [class.bg-white]="orderFilter() !== 'pending'" [class.text-gray-600]="orderFilter() !== 'pending'">待處理</button>
                 <button (click)="orderFilter.set('completed')" class="px-4 py-2 rounded-full text-sm font-bold border transition-colors" [class.bg-green-100]="orderFilter() === 'completed'" [class.text-green-700]="orderFilter() === 'completed'" [class.border-green-200]="orderFilter() === 'completed'" [class.bg-white]="orderFilter() !== 'completed'" [class.text-gray-600]="orderFilter() !== 'completed'">已完成</button>
               </div>
            </div>

            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
               <div class="overflow-x-auto">
                 <table class="min-w-full divide-y divide-gray-200">
                   <thead class="bg-gray-50">
                     <tr>
                       <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">客戶</th>
                       <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">付款方式</th>
                       <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金額</th>
                       <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">狀態</th>
                       <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">物流</th>
                       <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">時間</th>
                       <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                     </tr>
                   </thead>
                   <tbody class="bg-white divide-y divide-gray-200">
                     @for (order of filteredOrders(); track order.id) {
                       <tr class="hover:bg-gray-50 transition-colors cursor-pointer" (click)="viewOrder(order)">
                         <td class="px-6 py-4 whitespace-nowrap">
                           <div class="text-sm font-bold text-gray-900">{{ order.shippingName || '訪客' }}</div>
                           <div class="text-xs text-gray-500 select-all font-mono">{{ order.id }}</div>
                         </td>
                         <td class="px-6 py-4 whitespace-nowrap">
                           <span class="text-xs font-bold px-2 py-1 rounded-md" 
                             [class.bg-blue-50]="order.paymentMethod === 'bank_transfer'" [class.text-blue-600]="order.paymentMethod === 'bank_transfer'"
                             [class.bg-orange-50]="order.paymentMethod === 'cod'" [class.text-orange-600]="order.paymentMethod === 'cod'">
                             {{ order.paymentMethod === 'bank_transfer' ? '🏦 銀行轉帳' : '🚚 貨到付款' }}
                           </span>
                         </td>
                         <td class="px-6 py-4 whitespace-nowrap">
                           <div class="text-sm font-bold text-brand-900">NT$ {{ order.finalTotal | number }}</div>
                         </td>
                         <td class="px-6 py-4 whitespace-nowrap text-center">
                           <span class="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full"
                             [class.bg-yellow-100]="['pending_payment', 'paid_verifying'].includes(order.status)" [class.text-yellow-800]="['pending_payment', 'paid_verifying'].includes(order.status)"
                             [class.bg-green-100]="order.status === 'payment_confirmed' || order.status === 'completed'" [class.text-green-800]="order.status === 'payment_confirmed' || order.status === 'completed'"
                             [class.bg-red-100]="order.status === 'cancelled' || order.status === 'refund_needed'" [class.text-red-800]="order.status === 'cancelled' || order.status === 'refund_needed'">
                             {{ getStatusLabel(order.status) }}
                           </span>
                         </td>
                         <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                            {{ getShippingLabel(order.shippingMethod) }}
                         </td>
                         <td class="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                           {{ order.createdAt | date:'MM/dd HH:mm' }}
                         </td>
                         <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                           <button class="text-brand-600 hover:text-brand-900">...</button>
                         </td>
                       </tr>
                     }
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        }

        @if (activeTab() === 'products') {
          <div class="space-y-6">
             <div class="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                   <h1 class="text-3xl font-bold text-gray-900">商品管理</h1>
                   <p class="text-gray-500 mt-1">上架、編輯或管理您的商品庫存</p>
                </div>
                <button (click)="openProductModal()" class="px-6 py-3 bg-brand-900 text-white rounded-xl font-bold shadow-lg hover:bg-black transition-all active:scale-95 flex items-center gap-2">
                   <span>+</span> 新增商品
                </button>
             </div>

             <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                @for (product of store.products(); track product.id) {
                   <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                      <div class="aspect-square bg-gray-100 relative overflow-hidden">
                         <img [src]="product.image" class="w-full h-full object-cover">
                         <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button (click)="editProduct(product)" class="bg-white text-gray-900 px-4 py-2 rounded-full font-bold text-sm hover:scale-105 transition-transform">編輯</button>
                            <button (click)="deleteProduct(product.id)" class="bg-red-500 text-white px-4 py-2 rounded-full font-bold text-sm hover:scale-105 transition-transform">刪除</button>
                         </div>
                      </div>
                      <div class="p-4">
                         <div class="flex justify-between items-start mb-2">
                            <span class="text-[10px] uppercase tracking-wider font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded">{{ product.category }}</span>
                            <span class="text-sm font-bold text-brand-900">NT$ {{ product.priceGeneral }}</span>
                         </div>
                         <h3 class="font-bold text-gray-900 truncate">{{ product.name }}</h3>
                         <div class="flex items-center justify-between mt-3 text-xs text-gray-500">
                            <span>庫存: {{ product.stock }}</span>
                            <span>已售: {{ product.soldCount }}</span>
                         </div>
                      </div>
                   </div>
                }
             </div>
          </div>
        }

        @if (activeTab() === 'customers') {
          <div class="space-y-6">
             <div class="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                   <h1 class="text-3xl font-bold text-gray-900">客戶管理</h1>
                   <p class="text-gray-500 mt-1">查看會員資料與消費紀錄</p>
                </div>
                
                <div class="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                   <div class="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
                      <span class="text-xs text-gray-400 font-bold">註冊時間:</span>
                      <input type="date" [ngModel]="memberStart()" (ngModelChange)="memberStart.set($event)" class="bg-transparent text-sm font-bold text-gray-700 outline-none w-28">
                      <span class="text-gray-300">-</span>
                      <input type="date" [ngModel]="memberEnd()" (ngModelChange)="memberEnd.set($event)" class="bg-transparent text-sm font-bold text-gray-700 outline-none w-28">
                   </div>

                   <div class="relative flex-1 md:w-64">
                      <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                      <input type="text" [ngModel]="customerSearch()" (ngModelChange)="customerSearch.set($event)" 
                             placeholder="搜尋姓名/手機..." 
                             class="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-900 transition-colors">
                   </div>
                   <button class="px-6 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 shadow-sm whitespace-nowrap">
                      📥 匯出會員
                   </button>
                </div>
             </div>

             <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table class="min-w-full divide-y divide-gray-200">
                   <thead class="bg-gray-50">
                      <tr>
                         <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">會員編號 / Google UID</th>
                         <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">會員資訊</th>
                         <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">等級</th>
                         <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">累積消費</th>
                         <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">購物金</th>
                         <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                      </tr>
                   </thead>
                   <tbody class="bg-white divide-y divide-gray-200">
                      @for (user of filteredUsers(); track user.id) {
                         <tr class="hover:bg-gray-50 transition-colors">
                            <td class="px-6 py-4 whitespace-nowrap">
                               <div class="flex flex-col">
                                  <span class="text-sm font-bold text-brand-900 font-mono tracking-wide">
                                     {{ user.memberNo || '舊會員 (需登入更新)' }}
                                  </span>
                                  <div class="flex items-center gap-1 mt-1 group cursor-pointer" title="點擊全選複製 UID">
                                     <span class="text-[10px] text-gray-400 font-mono">UID:</span>
                                     <span class="text-[10px] text-gray-500 font-mono select-all hover:text-brand-900">{{ user.id }}</span>
                                  </div>
                               </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                               <div class="flex items-center">
                                  <div class="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-xl overflow-hidden">
                                     @if(user.photoURL) { <img [src]="user.photoURL" class="w-full h-full object-cover"> }
                                     @else { 👤 }
                                  </div>
                                  <div class="ml-4">
                                     <div class="text-sm font-bold text-gray-900">{{ user.name }}</div>
                                     <div class="text-xs text-gray-500">{{ user.email }}</div>
                                  </div>
                               </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-center">
                               <span class="px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-lg bg-gray-100 text-gray-800 border border-gray-200">
                                  {{ user.tier === 'wholesale' ? '批發' : (user.tier === 'vip' ? 'VIP' : '一般') }}
                               </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                               NT$ {{ user.totalSpend | number }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-brand-600">
                               {{ user.credits }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                               <button class="text-gray-400 hover:text-brand-900 px-3 py-1 rounded border hover:border-brand-900 transition-all">編輯</button>
                            </td>
                         </tr>
                      }
                   </tbody>
                </table>
             </div>
          </div>
        }
      </div>

      @if (showProductModal()) {
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" (click)="closeProductModal()">
           <div class="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]" (click)="$event.stopPropagation()">
              <div class="p-6 border-b border-gray-100 flex justify-between items-center">
                 <h3 class="text-lg font-bold text-gray-900">{{ editingProduct() ? '編輯商品' : '新增商品' }}</h3>
                 <button (click)="closeProductModal()" class="text-gray-400 hover:text-gray-900 text-2xl">×</button>
              </div>
              
              <div class="p-6 overflow-y-auto space-y-4">
                 <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">商品名稱</label>
                    <input type="text" [(ngModel)]="tempProduct.name" class="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-brand-900">
                 </div>

                 <div class="grid grid-cols-2 gap-4">
                    <div>
                       <label class="block text-sm font-bold text-gray-700 mb-1">分類</label>
                       <select [(ngModel)]="tempProduct.category" class="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-brand-900 bg-white">
                          @for(cat of store.categories(); track cat) {
                             <option [value]="cat">{{ cat }}</option>
                          }
                       </select>
                    </div>
                    <div>
                       <label class="block text-sm font-bold text-gray-700 mb-1">價格 (NT$)</label>
                       <input type="number" [(ngModel)]="tempProduct.priceGeneral" class="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-brand-900">
                    </div>
                 </div>

                 <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">圖片連結 (URL)</label>
                    <input type="text" [(ngModel)]="tempProduct.image" class="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-brand-900" placeholder="https://...">
                    @if(tempProduct.image) {
                       <img [src]="tempProduct.image" class="mt-2 w-20 h-20 object-cover rounded-lg border border-gray-200">
                    }
                 </div>

                 <div class="grid grid-cols-2 gap-4">
                    <div>
                       <label class="block text-sm font-bold text-gray-700 mb-1">庫存數量</label>
                       <input type="number" [(ngModel)]="tempProduct.stock" class="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-brand-900">
                    </div>
                    <div>
                       <label class="block text-sm font-bold text-gray-700 mb-1">規格 (逗號分隔)</label>
                       <input type="text" [ngModel]="tempProduct.options.join(',')" (ngModelChange)="updateOptions($event)" class="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-brand-900" placeholder="S, M, L">
                    </div>
                 </div>

                 <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">商品描述</label>
                    <textarea [(ngModel)]="tempProduct.note" rows="3" class="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-brand-900"></textarea>
                 </div>
              </div>

              <div class="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
                 <button (click)="closeProductModal()" class="flex-1 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-100">取消</button>
                 <button (click)="saveProduct()" class="flex-1 py-3 bg-brand-900 text-white font-bold rounded-xl hover:bg-black">儲存</button>
              </div>
           </div>
        </div>
      }

      @if (selectedOrder()) {
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" (click)="selectedOrder.set(null)">
           <div class="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]" (click)="$event.stopPropagation()">
              <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                 <div>
                    <h3 class="text-lg font-bold text-gray-900 flex items-center gap-2">
                       ⚡️ 操作訂單 <span class="text-gray-400 text-sm">#{{ selectedOrder()!.id }}</span>
                    </h3>
                    <div class="mt-1 flex gap-2">
                       <span class="text-xs bg-white border px-2 py-0.5 rounded text-gray-500">狀態: {{ getStatusLabel(selectedOrder()!.status) }}</span>
                    </div>
                 </div>
                 <button (click)="selectedOrder.set(null)" class="text-gray-400 hover:text-gray-900 text-2xl">×</button>
              </div>
              
              <div class="p-6 overflow-y-auto space-y-4">
                 <div class="grid grid-cols-2 gap-4">
                    @if (['pending_payment', 'paid_verifying', 'unpaid_alert'].includes(selectedOrder()!.status)) {
                       <button (click)="updateStatus('payment_confirmed')" class="p-4 rounded-xl border-2 border-green-100 bg-green-50 hover:bg-green-100 text-left transition-all group">
                          <div class="text-2xl mb-2 group-hover:scale-110 transition-transform origin-left">✅</div>
                          <div class="font-bold text-green-800">確認收款</div>
                          <div class="text-xs text-green-600 opacity-60">轉為已付款</div>
                       </button>
                    }
                    
                    @if (selectedOrder()!.status === 'pending_payment') {
                       <button (click)="updateStatus('unpaid_alert')" class="p-4 rounded-xl border-2 border-orange-100 bg-orange-50 hover:bg-orange-100 text-left transition-all group">
                          <div class="text-2xl mb-2 group-hover:scale-110 transition-transform origin-left">🔔</div>
                          <div class="font-bold text-orange-800">提醒付款</div>
                          <div class="text-xs text-orange-600 opacity-60">發送提醒</div>
                       </button>
                    }

                    @if (selectedOrder()!.status === 'payment_confirmed' || (selectedOrder()!.paymentMethod === 'cod' && selectedOrder()!.status === 'pending_payment')) {
                       <button (click)="updateStatus('shipped')" class="p-4 rounded-xl border-2 border-blue-100 bg-blue-50 hover:bg-blue-100 text-left transition-all group">
                          <div class="text-2xl mb-2 group-hover:scale-110 transition-transform origin-left">📦</div>
                          <div class="font-bold text-blue-800">安排出貨</div>
                          <div class="text-xs text-blue-600 opacity-60">標記為已出貨</div>
                       </button>
                    }

                    <button (click)="updateStatus('refund_needed')" class="p-4 rounded-xl border-2 border-red-50 bg-red-50 hover:bg-red-100 text-left transition-all group">
                       <div class="text-2xl mb-2 group-hover:scale-110 transition-transform origin-left">⚠️</div>
                       <div class="font-bold text-red-800">缺貨/需退款</div>
                       <div class="text-xs text-red-600 opacity-60">標記為問題訂單</div>
                    </button>
                    
                    @if (selectedOrder()!.status === 'refund_needed') {
                       <button (click)="updateStatus('refunded')" class="p-4 rounded-xl border-2 border-gray-100 bg-gray-50 hover:bg-gray-100 text-left transition-all group">
                          <div class="text-2xl mb-2 group-hover:scale-110 transition-transform origin-left">💸</div>
                          <div class="font-bold text-gray-800">確認已退款</div>
                          <div class="text-xs text-gray-500 opacity-60">強制結案並標記為已退款 (任何狀態可用)</div>
                       </button>
                    }

                    @if (selectedOrder()!.paymentMethod === 'cod' && selectedOrder()!.status === 'shipped') {
                       <button (click)="updateStatus('completed')" class="col-span-2 p-4 rounded-xl border-2 border-emerald-100 bg-emerald-600 hover:bg-emerald-700 text-left transition-all group">
                          <div class="text-2xl mb-2 text-white">💰</div>
                          <div class="font-bold text-white">確認已收款 (COD)</div>
                          <div class="text-xs text-emerald-100">貨到付款專用：確認物流已撥款</div>
                       </button>
                    }
                 </div>

                 @if(selectedOrder()!.paymentMethod === 'bank_transfer') {
                    <div class="bg-blue-50 p-4 rounded-xl border border-blue-100 mt-4">
                       <h4 class="font-bold text-blue-900 mb-2 text-sm uppercase tracking-wider">匯款回報資訊</h4>
                       <div class="grid grid-cols-2 gap-4 text-sm">
                          <div>
                             <span class="text-blue-400 text-xs">匯款戶名</span>
                             <div class="font-bold text-blue-800">{{ selectedOrder()!.paymentName || '尚未回報' }}</div>
                          </div>
                          <div>
                             <span class="text-blue-400 text-xs">帳號後五碼</span>
                             <div class="font-bold text-blue-800 font-mono">{{ selectedOrder()!.paymentLast5 || '---' }}</div>
                          </div>
                          <div class="col-span-2">
                             <span class="text-blue-400 text-xs">匯款時間</span>
                             <div class="font-bold text-blue-800">{{ selectedOrder()!.paymentTime || '---' }}</div>
                          </div>
                       </div>
                    </div>
                 }
                 
                 <div class="pt-6 border-t border-gray-100 mt-2">
                   <button (click)="updateStatus('cancelled')" class="w-full text-center text-xs text-red-400 hover:text-red-600 hover:underline">🚫 取消訂單 (保留紀錄但標記為取消)</button>
                 </div>
              </div>
              
              <div class="p-4 border-t border-gray-100 bg-gray-50">
                 <button (click)="selectedOrder.set(null)" class="w-full py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-100">關閉</button>
              </div>
           </div>
        </div>
      }
      
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.2s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
  `]
})
export class AdminPanelComponent {
  store = inject(StoreService);
  activeTab = signal<'orders' | 'products' | 'customers'>('orders');
  
  // Order Filters
  orderFilter = signal<'all' | 'pending' | 'completed'>('all');
  
  // Customer Filters
  customerSearch = signal('');
  memberStart = signal(''); 
  memberEnd = signal('');   

  // State
  selectedOrder = signal<Order | null>(null);
  showProductModal = signal(false);
  editingProduct = signal<Product | null>(null);
  
  // Temp Product for Form
  tempProduct: Product = this.getEmptyProduct();

  // --- Computed Data ---
  filteredOrders = computed(() => {
    let list = this.store.orders();
    const f = this.orderFilter();
    if (f === 'pending') list = list.filter(o => ['pending_payment', 'paid_verifying', 'unpaid_alert'].includes(o.status));
    if (f === 'completed') list = list.filter(o => ['completed', 'cancelled', 'refunded'].includes(o.status));
    return list.sort((a, b) => b.createdAt - a.createdAt);
  });

  filteredUsers = computed(() => {
    let list = this.store.users();
    const q = this.customerSearch().toLowerCase();
    
    // 1. Text Search
    if (q) {
       list = list.filter(u => 
          u.name.toLowerCase().includes(q) || 
          (u.phone && u.phone.includes(q)) ||
          u.id.toLowerCase().includes(q) ||
          (u.memberNo && u.memberNo.includes(q))
       );
    }

    // 2. Date Range Filter
    const start = this.memberStart(); 
    const end = this.memberEnd();     
    
    if (start || end) {
       list = list.filter(u => {
          if (!u.memberNo) return false; 
          const noDatePart = u.memberNo.substring(0, 10); 
          const startDate = start ? start.replace(/-/g, '/') : null;
          const endDate = end ? end.replace(/-/g, '/') : null;

          if (startDate && noDatePart < startDate) return false;
          if (endDate && noDatePart > endDate) return false;
          return true;
       });
    }
    return list;
  });

  // --- Actions ---
  viewOrder(o: Order) { this.selectedOrder.set(o); }
  
  updateStatus(status: Order['status']) {
     const o = this.selectedOrder();
     if (o) {
        this.store.updateOrderStatus(o.id, status);
        this.selectedOrder.set(null);
     }
  }

  // Product Actions
  openProductModal() {
     this.editingProduct.set(null);
     this.tempProduct = this.getEmptyProduct();
     this.showProductModal.set(true);
  }

  editProduct(p: Product) {
     this.editingProduct.set(p);
     this.tempProduct = JSON.parse(JSON.stringify(p)); // Deep copy
     this.showProductModal.set(true);
  }

  closeProductModal() {
     this.showProductModal.set(false);
  }

  async saveProduct() {
     if (!this.tempProduct.name || this.tempProduct.priceGeneral <= 0) {
        alert('請輸入正確的商品名稱與價格');
        return;
     }

     if (this.editingProduct()) {
        await this.store.updateProduct(this.tempProduct);
     } else {
        this.tempProduct.id = 'prod_' + Date.now(); 
        await this.store.addProduct(this.tempProduct);
     }
     this.closeProductModal();
  }

  deleteProduct(id: string) { 
     if(confirm('確定要刪除這個商品嗎？')) {
        this.store.deleteProduct(id); 
     }
  }

  updateOptions(val: string) {
     this.tempProduct.options = val.split(',').map(s => s.trim()).filter(s => s);
  }

  getEmptyProduct(): Product {
     return {
        id: '',
        code: '',
        name: '',
        image: '',
        category: this.store.categories()[0] || '一般',
        options: [],
        country: '',
        localPrice: 0,
        exchangeRate: 1,
        costMaterial: 0,
        weight: 0,
        shippingCostPerKg: 0,
        priceGeneral: 0,
        priceVip: 0,
        priceWholesale: 0,
        priceType: 'normal',
        stock: 99,
        note: '',
        soldCount: 0
     };
  }

  logout() { this.store.logout(); }

  // --- Helpers ---
  getStatusLabel(s: string) {
     const map: any = {
        pending_payment: '待付款',
        paid_verifying: '已付款待核',
        unpaid_alert: '已催款',
        payment_confirmed: '已確認付款',
        shipped: '已出貨',
        completed: '已完成',
        cancelled: '已取消',
        refund_needed: '需退款',
        refunded: '已退款'
     };
     return map[s] || s;
  }

  getShippingLabel(m: string) {
     const map: any = { meetup: '面交', myship: '賣貨便', family: '好賣家', delivery: '宅配' };
     return map[m] || m;
  }
}