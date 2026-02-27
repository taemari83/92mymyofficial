import { Component, inject, signal, computed, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StoreService, Product, Order, User, StoreSettings, CartItem } from '../services/store.service';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="flex h-screen w-full bg-[#FDFBF9] font-sans overflow-hidden">
      
      <aside class="w-20 md:w-64 h-full bg-white border-r border-gray-100 flex flex-col shrink-0 z-20 shadow-lg md:shadow-none overflow-y-auto custom-scrollbar">
        <div class="p-4 md:p-6 flex items-center gap-3 justify-center md:justify-start">
          <div class="w-8 h-8 bg-brand-400 rounded-lg flex items-center justify-center text-white font-bold shrink-0">92</div>
        </div>

        <div class="flex-1 overflow-y-auto py-4 px-2 md:px-3 space-y-1">
          <div class="px-2 md:px-3 text-[10px] md:text-xs font-bold text-gray-400 mb-2 mt-2 text-center md:text-left">主要功能</div>
          <button (click)="activeTab.set('dashboard')" [class]="navClass('dashboard')"><span class="text-xl md:text-lg">🏠</span> <span class="hidden md:inline">主控台</span></button>
          <button (click)="activeTab.set('orders')" [class]="navClass('orders')"><span class="text-xl md:text-lg relative">🛍️@if(pendingCount() > 0) {<span class="absolute -top-1 -right-1 md:hidden bg-red-400 text-white text-[8px] w-3 h-3 flex items-center justify-center rounded-full">{{ pendingCount() }}</span>}</span> <span class="hidden md:inline">訂單管理</span>@if(pendingCount() > 0) {<span class="hidden md:inline ml-auto bg-red-400 text-white text-[10px] px-1.5 py-0.5 rounded-full">{{ pendingCount() }}</span>}</button>
          <button (click)="activeTab.set('products')" [class]="navClass('products')"><span class="text-xl md:text-lg">📦</span> <span class="hidden md:inline">商品管理</span></button>
          <button (click)="activeTab.set('customers')" [class]="navClass('customers')"><span class="text-xl md:text-lg">👥</span> <span class="hidden md:inline">客戶管理</span></button>
          <div class="px-2 md:px-3 text-[10px] md:text-xs font-bold text-gray-400 mb-2 mt-6 text-center md:text-left">數據分析</div>
          <button (click)="activeTab.set('accounting')" [class]="navClass('accounting')"><span class="text-xl md:text-lg">📊</span> <span class="hidden md:inline">銷售報表</span></button>
          <button (click)="activeTab.set('inventory')" [class]="navClass('inventory')"><span class="text-xl md:text-lg">🏭</span> <span class="hidden md:inline">庫存管理</span></button>
          <div class="px-2 md:px-3 text-[10px] md:text-xs font-bold text-gray-400 mb-2 mt-6 text-center md:text-left">設定</div>
           <button (click)="activeTab.set('settings')" [class]="navClass('settings')"><span class="text-xl md:text-lg">⚙️</span> <span class="hidden md:inline">商店設定</span></button>
        </div>
        
        <div class="p-2 md:p-4 border-t border-gray-100">
           <div class="flex items-center gap-3 p-2 md:p-3 rounded-xl bg-brand-50/50 justify-center md:justify-start">
              <div class="w-8 h-8 rounded-full bg-brand-900 text-white flex items-center justify-center text-xs shrink-0">M</div>
              <div class="text-sm hidden md:block"><div class="font-bold text-brand-900">Admin</div><div class="text-xs text-gray-400">Owner</div></div>
           </div>
        </div>
      </aside>

      <main class="flex-1 h-full overflow-y-auto custom-scrollbar bg-[#FDFBF9] p-4 md:p-8 w-full relative">
        <div class="flex justify-between items-center mb-6">
           <h2 class="text-2xl font-bold text-gray-800 whitespace-nowrap">{{ getTabTitle() }}</h2>
           <div class="flex gap-2"><button class="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-brand-900 shadow-sm">↻</button></div>
        </div>

        @if (activeTab() === 'dashboard') {
          <div class="space-y-8 w-full overflow-x-hidden">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              <div class="bg-brand-900 text-white rounded-[2rem] p-8 shadow-xl relative overflow-hidden group w-full"><div class="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10"></div><div class="relative z-10"><div class="flex items-center gap-2 text-white/60 text-sm font-bold uppercase tracking-widest mb-2"><span>📅 今日營業額</span></div><div class="text-3xl sm:text-4xl xl:text-5xl font-black tracking-tight break-words whitespace-normal leading-tight" [title]="'NT$ ' + (dashboardMetrics().todayRevenue | number)">NT$ {{ dashboardMetrics().todayRevenue | number }}</div><div class="mt-4 text-sm text-white/50">截至目前為止</div></div></div>
              <div class="bg-white rounded-[2rem] p-8 shadow-sm border border-brand-100 flex flex-col justify-center w-full"><div class="text-gray-400 text-sm font-bold uppercase tracking-widest mb-2">本月銷售總額</div><div class="text-2xl sm:text-3xl xl:text-4xl font-bold text-gray-800 break-words whitespace-normal leading-tight" [title]="'NT$ ' + (dashboardMetrics().monthSales | number)">NT$ {{ dashboardMetrics().monthSales | number }}</div><div class="mt-2 text-xs text-green-500 font-bold bg-green-50 px-2 py-1 rounded w-fit">持續成長中 📈</div></div>
              <div class="bg-[#F0F7F4] rounded-[2rem] p-8 shadow-sm border border-[#E1EFE8] flex flex-col justify-center w-full"><div class="text-[#5A8C74] text-sm font-bold uppercase tracking-widest mb-2">本月預估利潤</div><div class="text-2xl sm:text-3xl xl:text-4xl font-bold text-[#2D5B46] break-words whitespace-normal leading-tight" [title]="'NT$ ' + (dashboardMetrics().monthProfit | number)">NT$ {{ dashboardMetrics().monthProfit | number:'1.0-0' }}</div><div class="mt-2 text-xs text-[#5A8C74]">已扣除商品成本</div></div>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 overflow-x-auto pb-2 w-full custom-scrollbar">
              <div (click)="goToOrders('verifying')" class="bg-white p-6 rounded-[1.5rem] border border-yellow-100 shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-yellow-50 hover:scale-105 transition-all cursor-pointer group min-w-[140px]"><div class="w-12 h-12 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center text-xl mb-1 group-hover:bg-yellow-200">📝</div><div class="text-2xl md:text-3xl font-black text-yellow-600">{{ dashboardMetrics().toConfirm }}</div><div class="text-sm font-bold text-yellow-800 whitespace-nowrap">未對帳訂單</div></div>
              <div (click)="goToOrders('shipping')" class="bg-white p-6 rounded-[1.5rem] border border-green-100 shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-green-50 hover:scale-105 transition-all cursor-pointer group min-w-[140px]"><div class="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xl mb-1 group-hover:bg-green-200">💰</div><div class="text-2xl md:text-3xl font-black text-green-600">{{ dashboardMetrics().toShip }}</div><div class="text-sm font-bold text-green-800 whitespace-nowrap">已付款/待出貨</div></div>
              <div (click)="goToOrders('pending')" class="bg-white p-6 rounded-[1.5rem] border border-gray-200 shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-gray-50 hover:scale-105 transition-all cursor-pointer group min-w-[140px]"><div class="w-12 h-12 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xl mb-1 group-hover:bg-gray-200">⚠️</div><div class="text-2xl md:text-3xl font-black text-gray-500">{{ dashboardMetrics().unpaid }}</div><div class="text-sm font-bold text-gray-600 whitespace-nowrap">未付款</div></div>
              <div (click)="goToOrders('refund')" class="bg-white p-6 rounded-[1.5rem] border border-red-100 shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-red-50 hover:scale-105 transition-all cursor-pointer group min-w-[140px]"><div class="w-12 h-12 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-xl mb-1 group-hover:bg-red-200">⚡️</div><div class="text-2xl md:text-3xl font-black text-red-500">{{ dashboardMetrics().processing }}</div><div class="text-sm font-bold text-red-800 whitespace-nowrap">待處理 / 退款</div></div>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
               <div class="lg:col-span-2 bg-white rounded-[2rem] p-8 shadow-sm border border-gray-50 w-full">
                 <div class="flex items-center justify-between mb-6">
                    <h3 class="font-bold text-xl text-gray-800 whitespace-nowrap">🔥 熱銷商品排行</h3>
                    <button (click)="activeTab.set('accounting')" class="text-xs text-brand-600 hover:underline whitespace-nowrap">查看完整報表</button>
                 </div>
                 <div class="space-y-4">
                    @for (p of topProducts(); track p.id; let i = $index) {
                       <div class="flex items-center gap-4 p-3 hover:bg-brand-50/50 rounded-2xl transition-colors group">
                          <div class="w-10 flex-shrink-0 flex items-center justify-center">@if(i === 0) { <span class="text-3xl">🥇</span> }@else if(i === 1) { <span class="text-3xl">🥈</span> }@else if(i === 2) { <span class="text-3xl">🥉</span> }@else { <span class="text-xl font-bold text-gray-300 font-mono italic">#{{ i + 1 }}</span> }</div>
                          <div class="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden shadow-sm border border-gray-100 relative shrink-0"><img [src]="p.image" (error)="handleImageError($event)" class="w-full h-full object-cover"></div>
                          <div class="flex-1 min-w-0"><h4 class="font-bold text-gray-800 truncate group-hover:text-brand-900">{{ p.name }}</h4><div class="flex gap-2 text-xs mt-0.5"><span class="text-gray-400 whitespace-nowrap">{{ p.category }}</span></div></div>
                          <div class="text-right shrink-0"><div class="font-bold text-brand-900 text-lg">{{ p.soldCount }} <span class="text-xs text-gray-400 font-normal">已售</span></div><div class="text-xs text-gray-400">NT$ {{ p.priceGeneral * p.soldCount | number }}</div></div>
                       </div>
                    }
                 </div>
               </div>
               <div class="space-y-6 w-full">
                  <h3 class="text-lg font-bold text-gray-700 px-2">快捷操作</h3>
                  <div class="grid grid-cols-2 gap-4">
                     <button (click)="openProductForm()" class="bg-white hover:bg-brand-50 border border-gray-200 hover:border-brand-200 p-4 rounded-2xl transition-all text-center group shadow-sm flex flex-col items-center justify-center h-32"><div class="w-10 h-10 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center text-xl mb-2 group-hover:scale-110 transition-transform">+</div><div class="font-bold text-gray-800 text-sm">新增商品</div></button>
                     <button (click)="activeTab.set('inventory')" class="bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-200 p-4 rounded-2xl transition-all text-center group shadow-sm flex flex-col items-center justify-center h-32"><div class="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl mb-2 group-hover:scale-110 transition-transform">🏭</div><div class="font-bold text-gray-800 text-sm">庫存查詢</div></button>
                  </div>
               </div>
            </div>
          </div>
        }

        @if (activeTab() === 'orders') {
          <div class="space-y-6 w-full">
            <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 overflow-x-auto w-full custom-scrollbar">
               
               <div class="flex flex-wrap gap-2 mb-6 border-b border-gray-100 pb-4 items-center">
                 <div class="flex gap-1">
                   @for(range of ['今日', '本週', '本月', '全部']; track range) { 
                     <button (click)="setOrderRange(range)" 
                             [class.text-brand-600]="statsRange() === range" 
                             [class.bg-brand-50]="statsRange() === range" 
                             [class.border-brand-200]="statsRange() === range" 
                             class="px-4 py-1.5 rounded-lg text-sm font-medium border border-transparent hover:bg-gray-50 text-gray-500 transition-colors whitespace-nowrap">
                        {{ range }}
                     </button> 
                   }
                 </div>
                 
                 <div class="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200 ml-auto md:ml-4">
                    <span class="text-xs text-gray-400 font-bold whitespace-nowrap">自訂:</span>
                    <input type="date" [ngModel]="orderStart()" (ngModelChange)="orderStart.set($event); statsRange.set('自訂')" class="bg-transparent text-sm font-bold text-gray-700 outline-none w-24 lg:w-32">
                    <span class="text-gray-300">-</span>
                    <input type="date" [ngModel]="orderEnd()" (ngModelChange)="orderEnd.set($event); statsRange.set('自訂')" class="bg-transparent text-sm font-bold text-gray-700 outline-none w-24 lg:w-32">
                 </div>
                 
                 <span class="ml-auto md:ml-4 text-xs text-gray-400 flex items-center whitespace-nowrap">📅 {{ now | date:'yyyy/MM/dd' }}</span>
               </div>
               
               <div class="flex flex-col xl:flex-row gap-4 justify-between items-center mb-4 w-full">
                  <div class="flex flex-col sm:flex-row gap-4 w-full xl:w-auto items-start sm:items-center flex-1">
                    <div class="relative w-full sm:w-auto sm:flex-1 xl:w-80">
                      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                      <input type="text" [(ngModel)]="orderSearch" placeholder="搜尋訂單編號、客戶名稱..." class="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-200">
                    </div>
                  </div>
                  <div class="flex gap-2 w-full md:w-auto overflow-x-auto items-center pb-2 custom-scrollbar">
                    <button (click)="exportOrdersCSV()" class="px-4 py-2 bg-[#8FA996] text-white rounded-lg font-bold shadow-sm hover:bg-[#7a9180] flex items-center gap-2 whitespace-nowrap"><span>📥</span> 匯出報表</button>
                    <div class="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
                      @for(tab of orderTabs; track tab.id) { <button (click)="orderStatusTab.set(tab.id)" [class.bg-brand-900]="orderStatusTab() === tab.id" [class.text-white]="orderStatusTab() === tab.id" [class.text-gray-600]="orderStatusTab() !== tab.id" class="px-4 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-all">{{ tab.label }}</button> }
                    </div>
                  </div>
               </div>
               <div class="overflow-x-auto w-full custom-scrollbar">
                 <table class="w-full text-sm text-left whitespace-nowrap">
                   <thead class="bg-[#F9FAFB] text-gray-500 font-medium border-b border-gray-200">
                     <tr>
                       <th class="p-4 sticky left-0 z-20 bg-[#F9FAFB] shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">
                         <div class="flex items-center gap-4">
                           <input type="checkbox" class="rounded border-gray-300">
                           <span>商品 訂單資訊</span>
                         </div>
                       </th>
                       <th class="p-4">客戶</th>
                       <th class="p-4">付款方式</th>
                       <th class="p-4">金額</th>
                       <th class="p-4">匯款狀態</th>
                       <th class="p-4">物流狀態</th>
                       <th class="p-4">時間</th>
                       <th class="p-4 text-right">操作</th>
                     </tr>
                   </thead>
                   <tbody class="divide-y divide-gray-100">
                     @for(order of paginatedOrders(); track order.id) {
                       <tr class="hover:bg-gray-50 transition-colors group">
                         <td class="p-4 align-top sticky left-0 z-10 bg-white group-hover:bg-gray-50 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] transition-colors">
                           <div class="flex items-start gap-4">
                             <input type="checkbox" class="rounded border-gray-300 shrink-0 mt-1">
                             <div class="flex gap-3 items-start min-w-[200px]">
                               <div class="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
                                 @if(order.items.length > 0) { <img [src]="getThumb(order)" (error)="handleImageError($event)" class="w-full h-full object-cover"> }
                               </div>
                               <div class="flex-1">
                                 <div class="flex items-center gap-2 mb-1"><span class="font-bold text-gray-800 font-mono">#{{ order.id }}</span>@if(order.paymentName) { <span class="w-2 h-2 rounded-full bg-blue-500" title="已回報匯款"></span> }</div>
                                 <div class="flex flex-col gap-0.5">
                                   @for(item of order.items; track item.productId + item.option) {
                                     <div class="text-[11px] text-gray-500 truncate max-w-[220px]">
                                       • {{ item.productName }} <span class="opacity-70">({{ item.option }})</span> <span class="font-bold text-brand-900">x{{ item.quantity }}</span>
                                     </div>
                                   }
                                 </div>
                               </div>
                             </div>
                           </div>
                         </td>
                         <td class="p-4 align-top"><div class="flex items-center gap-2 mt-1"><span class="font-medium text-gray-800">{{ getUserName(order.userId) }}</span></div></td>
                         <td class="p-4 align-top"><div class="mt-1">@if(order.paymentMethod === 'bank_transfer') { <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">🏦 轉帳</span> }@else if(order.paymentMethod === 'cod') { <span class="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-bold">🚚 貨到付款</span> }@else { <span class="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">💵 現金</span> }</div></td>
                         <td class="p-4 align-top font-bold text-brand-600"><div class="mt-1">NT$ {{ order.finalTotal | number }}</div></td>
                         <td class="p-4 align-top"><div class="flex flex-col gap-1 mt-1"><span [class]="getPaymentStatusClass(order.status)" class="px-2.5 py-1 rounded-md text-xs font-bold w-fit">{{ getPaymentStatusLabel(order.status, order.paymentMethod) }}</span>@if(order.status === 'paid_verifying' && order.paymentLast5) { <div class="text-[10px] text-gray-500 font-mono">後五碼: <span class="font-bold text-brand-900">{{ order.paymentLast5 }}</span></div> }</div></td>
                         <td class="p-4 align-top"><div class="mt-1"><span [class]="getShippingStatusClass(order.status)" class="px-2.5 py-1 rounded-md text-xs font-bold">{{ getShippingStatusLabel(order.status) }}</span></div></td>
                         <td class="p-4 align-top text-gray-400 text-xs"><div class="mt-1">{{ timeAgo(order.createdAt) }}</div></td>
                         <td class="p-4 align-top text-right"><div class="flex items-center justify-end gap-2 mt-1">@if (order.status === 'paid_verifying') { <button (click)="quickConfirm($event, order)" class="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-bold whitespace-nowrap">✅ 確認</button> } @else if (order.status === 'payment_confirmed') { <button (click)="quickShip($event, order)" class="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold whitespace-nowrap">📦 出貨</button> }@else if (order.status === 'shipped' && order.paymentMethod === 'cod') { <button (click)="quickComplete($event, order)" class="px-3 py-1.5 bg-green-800 text-white rounded-lg text-xs font-bold whitespace-nowrap">💰 確認收款</button> }@else if (order.status === 'refund_needed') { <button (click)="quickRefundDone($event, order)" class="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-bold whitespace-nowrap">💸 已退款</button> }<button (click)="openAction($event, order)" class="p-2 hover:bg-gray-200 rounded-lg text-gray-400">•••</button></div></td>
                       </tr>
                     }
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        }

        @if (activeTab() === 'products') { 
          <div class="space-y-6 w-full"> 
            
            <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50 flex flex-col gap-4 w-full"> 
              <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
                <div>
                   <h3 class="text-2xl font-bold text-brand-900 whitespace-nowrap">商品管理</h3>
                   <p class="text-sm text-gray-400 mt-1">管理商品、庫存與定價</p>
                </div> 
                <div class="flex flex-wrap gap-3 w-full md:w-auto">
                  <button (click)="exportProductsCSV()" class="px-4 py-3 bg-brand-50 text-brand-700 border border-brand-200 rounded-full font-bold hover:bg-brand-100 shadow-sm flex items-center gap-2 whitespace-nowrap">
                    <span>📥</span> 匯出標準格式 (可直接上傳)
                  </button>
                  <label class="flex-1 md:flex-none justify-center flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 text-brand-900 rounded-full font-bold shadow-sm hover:bg-gray-50 cursor-pointer transition-colors hover:shadow-md whitespace-nowrap"> 
                    <span class="text-lg">📂</span> <span class="text-sm">批量新增/更新</span> 
                    <input type="file" (change)="handleBatchImport($event)" class="hidden" accept=".csv"> 
                  </label> 
                  <button (click)="openProductForm()" class="w-12 h-12 bg-brand-900 text-white rounded-full flex items-center justify-center text-2xl shadow-lg hover:scale-105 transition-transform shrink-0"> + </button> 
                </div> 
              </div>

              <div class="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-gray-100">
                <div class="relative w-full sm:max-w-md">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    <input type="text" [(ngModel)]="productSearch" placeholder="搜尋商品名稱、SKU 貨號或分類..." class="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-200 transition-all">
                </div>
                <div class="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200 shadow-inner w-full sm:w-auto justify-center">
                    <button (click)="productViewMode.set('list')" [class.bg-white]="productViewMode() === 'list'" [class.shadow-sm]="productViewMode() === 'list'" [class.text-brand-900]="productViewMode() === 'list'" [class.text-gray-400]="productViewMode() !== 'list'" class="flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2">
                      <span class="text-lg">≣</span> 條列
                    </button>
                    <button (click)="productViewMode.set('grid')" [class.bg-white]="productViewMode() === 'grid'" [class.shadow-sm]="productViewMode() === 'grid'" [class.text-brand-900]="productViewMode() === 'grid'" [class.text-gray-400]="productViewMode() !== 'grid'" class="flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2">
                      <span class="text-lg">⊞</span> 宮格
                    </button>
                </div>
              </div>
            </div> 

            @if(productViewMode() === 'list') {
              <div class="grid grid-cols-1 gap-4 w-full"> 
                @for (p of filteredAdminProducts(); track p.id) { 
                  <div class="bg-white rounded-[1.5rem] p-4 flex items-center gap-5 hover:shadow-md transition-all border border-transparent hover:border-brand-100 group w-full"> 
                     <div class="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 relative"> 
                        <img [src]="p.image" (error)="handleImageError($event)" class="w-full h-full object-cover"> 
                        <div class="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center font-mono py-0.5"> {{ p.code }} </div> 
                     </div> 
                     <div class="flex-1 min-w-0"> 
                        <div class="flex justify-between items-start gap-4"> 
                           <div class="flex-1 min-w-0"> 
                              <div class="flex items-center gap-2 mb-1 flex-wrap"> 
                                 <span class="text-xs text-brand-400 font-bold tracking-wider uppercase whitespace-nowrap">{{ p.category }}</span> 
                                 @if(p.isPreorder) { <span class="bg-blue-100 text-blue-600 text-[10px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap">預購</span> }
                                 @if(!p.isListed) { <span class="bg-gray-200 text-gray-500 text-[10px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap">未上架</span> }
                                 @if(p.priceType === 'event') { <span class="bg-red-50 text-red-500 text-[10px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap">活動價</span> } 
                                 @if(p.priceType === 'clearance') { <span class="bg-gray-100 text-gray-500 text-[10px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap">清倉價</span> } 
                                 @if(p.bulkDiscount?.count) { <span class="bg-red-50 text-red-500 text-[10px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap">任選 {{ p.bulkDiscount?.count }} 件 $ {{ p.bulkDiscount?.total }}</span> }
                              </div> 
                              <h4 class="text-lg font-bold text-brand-900 truncate" [title]="p.name">{{ p.name }}</h4> 
                           </div> 
                           <div class="text-right shrink-0"> 
                              <div class="font-bold text-lg text-brand-900 whitespace-nowrap">NT$ {{ p.priceGeneral }}</div> 
                              <div class="text-[10px] text-gray-400 whitespace-nowrap">庫存 {{ p.stock >= 9999 ? '無限' : p.stock }}</div> 
                           </div> 
                        </div> 
                        <div class="flex justify-between items-end mt-2"> 
                           <div class="text-xs text-gray-400 truncate"> {{ p.options.join(', ') }} </div> 
                           <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pl-2"> 
                              <button (click)="editProduct(p)" class="px-3 py-1 rounded-full bg-gray-100 text-xs font-bold text-gray-600 hover:bg-gray-200 whitespace-nowrap">Edit</button> 
                              <button (click)="store.deleteProduct(p.id)" class="px-3 py-1 rounded-full bg-red-50 text-xs font-bold text-red-400 hover:bg-red-100 whitespace-nowrap">Del</button> 
                           </div> 
                        </div> 
                     </div> 
                  </div> 
                } @empty {
                  <div class="text-center py-10 text-gray-400 font-bold">找不到符合條件的商品</div>
                }
              </div> 
            } @else {
              <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 w-full">
                @for (p of filteredAdminProducts(); track p.id) {
                  <div class="bg-white rounded-[1.5rem] p-3 flex flex-col hover:shadow-md transition-all border border-transparent hover:border-brand-100 group w-full">
                     <div class="w-full aspect-square rounded-xl overflow-hidden bg-gray-100 relative mb-3">
                        <img [src]="p.image" (error)="handleImageError($event)" class="w-full h-full object-cover">
                        <div class="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center font-mono py-1"> {{ p.code }} </div>
                        <div class="absolute top-2 left-2 flex flex-col gap-1">
                           @if(p.isPreorder) { <span class="bg-blue-100 text-blue-600 text-[10px] px-1.5 py-0.5 rounded font-bold shadow-sm w-fit">預購</span> }
                           @if(!p.isListed) { <span class="bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded font-bold shadow-sm w-fit">未上架</span> }
                        </div>
                     </div>
                     <div class="flex flex-col flex-1 min-w-0">
                        <span class="text-[10px] text-brand-400 font-bold uppercase mb-1 truncate">{{ p.category }}</span>
                        <h4 class="text-sm font-bold text-brand-900 line-clamp-2 leading-tight mb-2 flex-1" [title]="p.name">{{ p.name }}</h4>
                        <div class="flex justify-between items-end mt-auto pt-2 border-t border-gray-50">
                           <div>
                              <div class="font-black text-brand-900">NT$ {{ p.priceGeneral }}</div>
                              <div class="text-[10px] text-gray-400">庫存 {{ p.stock >= 9999 ? '無限' : p.stock }}</div>
                           </div>
                           <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button (click)="editProduct(p)" class="w-7 h-7 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 transition-colors" title="編輯">✎</button>
                              <button (click)="store.deleteProduct(p.id)" class="w-7 h-7 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors" title="刪除">✕</button>
                           </div>
                        </div>
                     </div>
                  </div>
                } @empty {
                  <div class="col-span-full text-center py-10 text-gray-400 font-bold">找不到符合條件的商品</div>
                }
              </div>
            }
          </div> 
        }
        
        @if (activeTab() === 'customers') { 
          <div class="space-y-6 w-full">
              <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50 flex flex-wrap lg:flex-nowrap justify-between items-center gap-4 w-full">
                 <div class="min-w-[150px]"><h3 class="text-2xl font-bold text-brand-900 whitespace-nowrap">客戶管理</h3><p class="text-sm text-gray-400 mt-1">查看會員資料與消費紀錄</p></div>
                 <div class="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
                    <div class="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200"><span class="text-xs text-gray-400 font-bold whitespace-nowrap">註冊:</span><input type="date" [ngModel]="memberStart()" (ngModelChange)="memberStart.set($event)" class="bg-transparent text-sm font-bold text-gray-700 outline-none w-24 lg:w-32"><span class="text-gray-300">-</span><input type="date" [ngModel]="memberEnd()" (ngModelChange)="memberEnd.set($event)" class="bg-transparent text-sm font-bold text-gray-700 outline-none w-24 lg:w-32"></div>
                    <button (click)="exportCustomersCSV()" class="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 whitespace-nowrap shadow-sm">📥 匯出</button>
                    <div class="relative w-full lg:w-64 min-w-[200px]"><input type="text" [(ngModel)]="customerSearch" placeholder="搜尋姓名/手機/編號..." class="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-300 transition-all focus:ring-1 focus:ring-brand-100"><span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span></div>
                 </div>
              </div>
              <div class="bg-white rounded-[2rem] shadow-sm border border-gray-50 overflow-hidden w-full custom-scrollbar">
                 <div class="overflow-x-auto w-full custom-scrollbar">
                   <table class="w-full text-sm text-left whitespace-nowrap">
                      <thead class="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
                        <tr>
                          <th class="p-4 sticky left-0 z-20 bg-gray-50 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">會員編號 / Google UID</th>
                          <th class="p-4">會員資訊</th><th class="p-4">等級</th><th class="p-4 text-right">累積消費</th><th class="p-4 text-right">購物金</th><th class="p-4 text-right">操作</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-gray-100">
                         @for(u of paginatedUsers(); track u.id) {
                            <tr class="hover:bg-gray-50 transition-colors group">
                               <td class="p-4 sticky left-0 z-10 bg-white group-hover:bg-gray-50 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] transition-colors">
                                  <div class="flex flex-col"><span class="text-sm font-bold text-brand-900 font-mono tracking-wide">{{ formatMemberNo(u.memberNo) }}</span><div class="flex items-center gap-1 mt-1 cursor-pointer" title="點擊全選複製 UID"><span class="text-[10px] text-gray-400 font-mono">UID:</span><span class="text-[10px] text-gray-500 font-mono select-all hover:text-brand-900">{{ u.id }}</span></div></div>
                               </td>
                               <td class="p-4"><div class="font-bold text-brand-900">{{ u.name }}</div><div class="text-xs text-gray-400 font-mono">{{ u.phone?.trim() }}</div></td>
                               <td class="p-4">@if(u.tier === 'vip') { <span class="bg-purple-100 text-purple-600 px-2 py-1 rounded-md text-xs font-bold border border-purple-200">VIP</span> }@else if(u.tier === 'wholesale') { <span class="bg-blue-100 text-blue-600 px-2 py-1 rounded-md text-xs font-bold border border-blue-200">批發</span> }@else { <span class="bg-gray-100 text-gray-500 px-2 py-1 rounded-md text-xs font-bold border border-gray-200">一般</span> }</td>
                               <td class="p-4 text-right font-bold text-brand-900">NT$ {{ u.totalSpend | number }}</td>
                               <td class="p-4 text-right text-brand-600 font-bold">{{ u.credits }}</td>
                               <td class="p-4 text-right"><button (click)="openUserModal(u)" class="text-xs font-bold text-gray-400 hover:text-brand-900 border border-gray-200 hover:bg-white px-3 py-1 rounded-lg transition-colors">編輯</button></td>
                            </tr>
                         }
                      </tbody>
                   </table>
                 </div>
                 @if(customerPageSize() !== 'all' && filteredUsers().length > toNumber(customerPageSize())) {
                    <div class="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2"><button (click)="customerPage.set(customerPage() - 1)" [disabled]="customerPage() === 1" class="px-3 py-1 bg-white border border-gray-200 rounded text-sm disabled:opacity-50 hover:bg-gray-50">上一頁</button><span class="px-3 py-1 bg-white border border-gray-200 rounded text-sm font-bold text-brand-900">{{ customerPage() }}</span><button (click)="customerPage.set(customerPage() + 1)" [disabled]="customerPage() * toNumber(customerPageSize()) >= filteredUsers().length" class="px-3 py-1 bg-white border border-gray-200 rounded text-sm disabled:opacity-50 hover:bg-gray-50">下一頁</button></div>
                 }
              </div>
          </div>
        }

        @if (activeTab() === 'accounting') {
           <div class="space-y-6 pt-2 w-full">
            <div class="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100 w-full">
               <div class="flex gap-2 overflow-x-auto w-full sm:w-auto pb-1 custom-scrollbar">@for(r of ['today', 'week', 'month', 'custom']; track r) { <button (click)="accountingRange.set(r)" class="px-5 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap" [class.bg-brand-900]="accountingRange() === r" [class.text-white]="accountingRange() === r" [class.bg-gray-100]="accountingRange() !== r" [class.text-gray-500]="accountingRange() !== r"> @switch(r) { @case('today') { 今日 } @case('week') { 本週 } @case('month') { 本月 } @case('custom') { 自訂 } } </button> }</div>
               <div class="flex items-center gap-2">@if(accountingRange() === 'custom') { <div class="flex items-center gap-2 animate-fade-in"> <input type="date" [ngModel]="accountingCustomStart()" (ngModelChange)="accountingCustomStart.set($event)" class="border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-gray-600 outline-none focus:border-brand-300"> <span class="text-gray-400">~</span> <input type="date" [ngModel]="accountingCustomEnd()" (ngModelChange)="accountingCustomEnd.set($event)" class="border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-gray-600 outline-none focus:border-brand-300"> </div> }<button (click)="exportToCSV()" class="px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-xl font-bold hover:bg-green-100 whitespace-nowrap flex items-center gap-1"><span>📊</span> 匯出報表</button></div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full"><div class="bg-brand-900 text-white p-6 rounded-[2rem] shadow-lg relative overflow-hidden group"><div class="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors"></div><div class="relative z-10"><div class="text-brand-200 text-xs font-bold uppercase tracking-widest mb-1">總營收 (已扣除折扣)</div><div class="text-3xl font-black">NT$ {{ accountingStats().revenue | number }}</div></div></div><div class="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden"><div class="text-green-600 text-xs font-bold uppercase tracking-widest mb-1">淨利潤</div><div class="text-3xl font-black text-gray-800">NT$ {{ accountingStats().profit | number:'1.0-0' }}</div><div class="mt-2 inline-block px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-bold">淨利率 {{ accountingStats().margin | number:'1.1-1' }}%</div></div><div class="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden"><div class="text-red-400 text-xs font-bold uppercase tracking-widest mb-1">總成本 (商品+物流)</div><div class="text-3xl font-black text-gray-800">NT$ {{ accountingStats().cost | number:'1.0-0' }}</div></div><div class="lg:col-span-3 bg-blue-50/50 p-4 rounded-[2rem] border border-blue-50 flex items-center text-blue-800/70 text-xs leading-relaxed">💡 報表說明：<br>• 上方「總營收/淨利」僅計算已成交訂單 (排除未付款、取消)。<br>• 下方「收款狀態分析」為全狀態統計，方便追蹤現金流。<br>• 貨到付款 (COD) 訂單，在訂單狀態為「已完成」前，皆視為「未收款 (應收帳款)」。</div></div>
            
            <div class="mt-4 w-full"><h4 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><span>💰 收款狀態分析</span><span class="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-normal">Cash Flow</span></h4><div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 w-full"><div class="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden"><div class="text-xs text-gray-500 font-bold mb-1 uppercase">應收總額</div><div class="text-lg font-black text-gray-800 whitespace-nowrap">\${{ accountingStats().payment.total | number }}</div><div class="absolute bottom-0 right-0 p-2 opacity-5 text-4xl">🧾</div></div><div class="bg-green-50 p-4 rounded-2xl border border-green-100 shadow-sm relative overflow-hidden"><div class="text-xs text-green-600 font-bold mb-1 uppercase">已實收 (入帳)</div><div class="text-lg font-black text-green-700 whitespace-nowrap">\${{ accountingStats().payment.received | number }}</div><div class="absolute bottom-0 right-0 p-2 opacity-10 text-4xl">💰</div></div><div class="bg-yellow-50 p-4 rounded-2xl border border-yellow-100 shadow-sm relative overflow-hidden"><div class="text-xs text-yellow-600 font-bold mb-1 uppercase">對帳中</div><div class="text-lg font-black text-yellow-700 whitespace-nowrap">\${{ accountingStats().payment.verifying | number }}</div><div class="absolute bottom-0 right-0 p-2 opacity-10 text-4xl">🔍</div></div><div class="bg-red-50 p-4 rounded-2xl border border-red-100 shadow-sm relative overflow-hidden"><div class="text-xs text-red-600 font-bold mb-1 uppercase">未收款</div><div class="text-lg font-black text-red-700 whitespace-nowrap">\${{ accountingStats().payment.unpaid | number }}</div><div class="absolute bottom-0 right-0 p-2 opacity-10 text-4xl">⚠️</div></div><div class="bg-gray-100 p-4 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden opacity-75"><div class="text-xs text-gray-500 font-bold mb-1 uppercase">待退款</div><div class="text-lg font-black text-gray-600 whitespace-nowrap">\${{ accountingStats().payment.refund | number }}</div><div class="absolute bottom-0 right-0 p-2 opacity-10 text-4xl">↩️</div></div><div class="bg-gray-800 text-white p-4 rounded-2xl border border-gray-700 shadow-sm relative overflow-hidden"><div class="text-xs text-gray-400 font-bold mb-1 uppercase">已退款 (結案)</div><div class="text-lg font-black text-white whitespace-nowrap">\${{ accountingStats().payment.refundedTotal | number }}</div><div class="absolute bottom-0 right-0 p-2 opacity-20 text-4xl">💸</div></div></div></div>
            
            <div class="mt-8 bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden w-full">
               <div class="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h4 class="text-xl font-bold text-gray-800 flex items-center gap-2"><span>📈 期間商品銷售分析</span></h4>
                  <div class="flex items-center gap-2 bg-gray-100 p-1 rounded-xl w-fit">
                     <button (click)="reportSortBy.set('sold')" [class.bg-white]="reportSortBy() === 'sold'" [class.text-brand-900]="reportSortBy() === 'sold'" [class.shadow-sm]="reportSortBy() === 'sold'" class="px-4 py-1.5 rounded-lg text-sm font-bold text-gray-500 transition-all">🔥 熱銷排行</button>
                     <button (click)="reportSortBy.set('profit')" [class.bg-white]="reportSortBy() === 'profit'" [class.text-brand-900]="reportSortBy() === 'profit'" [class.shadow-sm]="reportSortBy() === 'profit'" class="px-4 py-1.5 rounded-lg text-sm font-bold text-gray-500 transition-all">💰 毛利排行</button>
                  </div>
               </div>

               <div class="overflow-x-auto w-full custom-scrollbar">
                 <table class="w-full text-sm text-left whitespace-nowrap">
                   <thead class="bg-gray-50 text-gray-500 font-bold text-xs uppercase border-b border-gray-200">
                     <tr> <th class="p-4 w-16 text-center">排名</th> <th class="p-4">商品名稱</th> <th class="p-4 text-right">銷售數量</th> <th class="p-4 text-right">預估總營收</th> <th class="p-4 text-right">總成本</th> <th class="p-4 text-right">預估總利潤</th> <th class="p-4 text-right">綜合毛利率 %</th> </tr>
                   </thead>
                   <tbody class="divide-y divide-gray-100">
                     @for(item of (reportSortBy() === 'sold' ? topSellingProducts() : topProfitProducts()); track item.product.id; let i = $index) {
                       <tr class="hover:bg-brand-50/30 transition-colors">
                         <td class="p-4 text-center font-bold text-gray-400 font-mono">{{ i + 1 }}</td>
                         <td class="p-4"> 
                           <div class="flex items-center gap-3"> 
                             <div class="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden border border-gray-200 shrink-0"> <img [src]="item.product.image" (error)="handleImageError($event)" class="w-full h-full object-cover"> </div> 
                             <div> <div class="font-bold text-brand-900">{{ item.product.name }}</div> <div class="text-[10px] text-gray-400">{{ item.hasBulk ? '含多入優惠計算' : '單件計價' }}</div> </div> 
                           </div> 
                         </td>
                         <td class="p-4 text-right font-bold text-gray-600">{{ item.sold }}</td>
                         <td class="p-4 text-right font-mono text-gray-500">$ {{ item.revenue | number:'1.0-0' }}</td>
                         <td class="p-4 text-right font-mono text-gray-400">$ {{ item.cost | number:'1.0-0' }}</td>
                         <td class="p-4 text-right font-bold text-brand-900 text-base" [class.text-red-500]="item.profit < 0">$ {{ item.profit | number:'1.0-0' }}</td>
                         <td class="p-4 text-right"> {{ item.margin | number:'1.1-1' }}% </td>
                       </tr>
                     } @empty {
                       <tr><td colspan="7" class="p-8 text-center text-gray-400 font-bold">此區間尚無訂單資料</td></tr>
                     }
                   </tbody>
                 </table>
               </div>
            </div>
         </div>
        }

        @if (activeTab() === 'inventory') {
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full custom-scrollbar">
             <div class="p-6 border-b border-gray-100 flex justify-between items-center"><h3 class="font-bold text-lg text-gray-800">庫存總覽</h3><button (click)="exportInventoryCSV()" class="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 whitespace-nowrap shadow-sm">📥 匯出盤點單</button></div>
             <div class="overflow-x-auto w-full"><table class="w-full text-sm text-left whitespace-nowrap"><thead class="bg-gray-50 text-gray-500"><tr><th class="p-4">貨號</th><th class="p-4">商品名稱</th><th class="p-4">規格</th><th class="p-4 text-right">剩餘庫存</th><th class="p-4 text-right">已售出</th><th class="p-4">狀態</th></tr></thead><tbody class="divide-y divide-gray-100">@for (p of store.products(); track p.id) {<tr class="hover:bg-gray-50"><td class="p-4 font-mono text-gray-400 text-xs">{{ p.code }}</td><td class="p-4 font-bold text-gray-800">{{ p.name }}</td><td class="p-4 text-gray-500">{{ p.options.join(', ') || '單一規格' }}</td><td class="p-4 text-right font-mono font-bold" [class.text-red-500]="p.stock < 5">{{ p.stock >= 9999 ? '無限' : p.stock }}</td><td class="p-4 text-right text-gray-500">{{ p.soldCount }}</td><td class="p-4">@if(p.stock <= 0) { <span class="bg-gray-200 text-gray-500 px-2 py-1 rounded text-xs font-bold">缺貨</span> }@else if(p.stock < 5) { <span class="bg-red-100 text-red-500 px-2 py-1 rounded text-xs font-bold">低庫存</span> }@else { <span class="bg-green-100 text-green-600 px-2 py-1 rounded text-xs font-bold">充足</span> }</td></tr>}</tbody></table></div>
          </div>
        }

        @if (activeTab() === 'settings') { 
          <div class="w-full py-6"> 
            <div class="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 space-y-12 w-full"> 
              <div class="flex justify-between items-center border-b border-gray-100 pb-6"><h3 class="text-2xl font-bold text-gray-800">⚙️ 商店參數設定</h3></div>
              <form [formGroup]="settingsForm" (ngSubmit)="saveSettings()" class="space-y-10"> 
                <div class="space-y-4"><h4 class="font-bold text-gray-600 flex items-center gap-2"><span class="bg-blue-100 text-blue-600 p-1.5 rounded-lg text-lg">💳</span> 收款方式</h4><div class="grid grid-cols-1 sm:grid-cols-3 gap-4"><label class="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"><input type="checkbox" formControlName="enableCash" class="w-5 h-5 rounded text-brand-600 focus:ring-brand-500"><span class="font-bold text-gray-700">現金付款</span></label><label class="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"><input type="checkbox" formControlName="enableBank" class="w-5 h-5 rounded text-brand-600 focus:ring-brand-500"><span class="font-bold text-gray-700">銀行轉帳</span></label><label class="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"><input type="checkbox" formControlName="enableCod" class="w-5 h-5 rounded text-brand-600 focus:ring-brand-500"><span class="font-bold text-gray-700">貨到付款</span></label></div></div>
                <div class="space-y-6" formGroupName="shipping"><div class="flex justify-between items-end"><h4 class="font-bold text-gray-600 flex items-center gap-2"><span class="bg-green-100 text-green-600 p-1.5 rounded-lg text-lg">🚚</span> 物流設定</h4><div class="flex items-center gap-2"><span class="text-sm font-bold text-gray-500">全館免運門檻 $</span><input type="number" formControlName="freeThreshold" class="w-24 border border-gray-200 rounded-lg p-2 text-center font-bold"></div></div><div class="grid grid-cols-1 sm:grid-cols-2 gap-4" formGroupName="methods"><div class="border border-gray-200 rounded-xl p-4 space-y-2" formGroupName="meetup"><div class="flex justify-between items-center"><label class="flex items-center gap-2 font-bold text-gray-700"><input type="checkbox" formControlName="enabled" class="rounded text-brand-600"> 面交自取</label><input type="number" formControlName="fee" class="w-20 border border-gray-200 rounded-lg p-1 text-right text-sm" placeholder="運費"></div></div><div class="border border-gray-200 rounded-xl p-4 space-y-2" formGroupName="myship"><div class="flex justify-between items-center"><label class="flex items-center gap-2 font-bold text-gray-700"><input type="checkbox" formControlName="enabled" class="rounded text-brand-600"> 7-11 賣貨便</label><input type="number" formControlName="fee" class="w-20 border border-gray-200 rounded-lg p-1 text-right text-sm" placeholder="運費"></div></div><div class="border border-gray-200 rounded-xl p-4 space-y-2" formGroupName="family"><div class="flex justify-between items-center"><label class="flex items-center gap-2 font-bold text-gray-700"><input type="checkbox" formControlName="enabled" class="rounded text-brand-600"> 全家 好賣家</label><input type="number" formControlName="fee" class="w-20 border border-gray-200 rounded-lg p-1 text-right text-sm" placeholder="運費"></div></div><div class="border border-gray-200 rounded-xl p-4 space-y-2" formGroupName="delivery"><div class="flex justify-between items-center"><label class="flex items-center gap-2 font-bold text-gray-700"><input type="checkbox" formControlName="enabled" class="rounded text-brand-600"> 宅配寄送</label><input type="number" formControlName="fee" class="w-20 border border-gray-200 rounded-lg p-1 text-right text-sm" placeholder="運費"></div></div></div></div>
                <div class="space-y-4"><h4 class="font-bold text-gray-600 flex items-center gap-2"><span class="bg-yellow-100 text-yellow-600 p-1.5 rounded-lg text-lg">🎁</span> 會員回饋 (生日禮金)</h4><div class="grid grid-cols-2 gap-6"><div><label class="block text-xs font-bold text-gray-500 mb-1">一般會員生日禮 ($)</label><input type="number" formControlName="birthdayGiftGeneral" class="w-full border border-gray-200 rounded-xl p-3 font-bold"></div><div><label class="block text-xs font-bold text-gray-500 mb-1">VIP 生日禮 ($)</label><input type="number" formControlName="birthdayGiftVip" class="w-full border border-gray-200 rounded-xl p-3 font-bold"></div></div></div>
                
                <div class="space-y-4">
                   <h4 class="font-bold text-gray-600 flex items-center gap-2">
                      <span class="bg-purple-100 text-purple-600 p-1.5 rounded-lg text-lg">🏷️</span> 商品分類管理 (類別增刪改與代碼)
                   </h4>
                   <div class="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                      @for(cat of store.categories(); track cat) { 
                         <div class="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                            <input type="text" [value]="cat" (change)="renameCategory(cat, $any($event.target).value)" class="flex-1 min-w-[120px] border border-transparent hover:border-gray-200 outline-none font-bold text-sm text-gray-700 bg-transparent focus:ring-1 focus:ring-brand-200 rounded px-2 py-1" title="點擊修改名稱">
                            <span class="text-xs text-gray-400 font-bold ml-auto sm:ml-2">SKU代碼:</span>
                            <input type="text" [value]="categoryCodes()[cat] || ''" (change)="updateCategoryCode(cat, $any($event.target).value)" class="w-12 border border-gray-200 rounded px-1 py-1 uppercase text-center font-mono font-bold text-brand-900 focus:outline-none focus:border-brand-300 shadow-inner" maxlength="1" placeholder="?">
                            <button type="button" (click)="deleteCategory(cat)" class="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="刪除此分類">✕</button>
                         </div> 
                      }
                      <div class="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                         <input #newCatInput type="text" placeholder="輸入新分類名稱..." class="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-300 shadow-inner">
                         <button type="button" (click)="addNewCategory(newCatInput.value); newCatInput.value=''" class="px-4 py-2 bg-brand-900 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-black whitespace-nowrap">＋ 新增分類</button>
                      </div>
                      <p class="text-xs text-gray-400 mt-2">* SKU 代碼請輸入單一英文字母 (A-Z)，用於貨號開頭 (例如: A250520001)</p>
                   </div>
                </div>

                <div class="pt-6 border-t border-gray-100 flex justify-end"><button type="submit" class="px-10 py-4 bg-brand-900 text-white rounded-xl font-bold shadow-lg hover:bg-black transition-transform active:scale-95 text-lg">儲存所有設定</button></div> 
              </form> 
            </div> 
          </div> 
        }

        @if (showProductModal()) { 
          <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" (click)="closeProductModal()"> 
            <div class="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" (click)="$event.stopPropagation()"> 
              <div class="p-6 border-b border-gray-100 flex justify-between items-center"> 
                <h3 class="text-xl font-bold text-brand-900">{{ editingProduct() ? '編輯商品' : '新增商品' }}</h3> 
                <button (click)="closeProductModal()" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200">✕</button> 
              </div> 
              <div class="p-6 overflow-y-auto flex-1 custom-scrollbar"> 
                <form [formGroup]="productForm" class="space-y-4"> 
                  <div class="grid grid-cols-2 gap-4"> 
                    <div> <label class="block text-xs font-bold text-gray-500 mb-1">商品名稱</label> <input formControlName="name" class="w-full p-2 border rounded-lg"> </div> 
                    <div> 
                      <label class="block text-xs font-bold text-gray-500 mb-1">分類</label> 
                      <div class="flex gap-2"> 
                        <div class="relative flex-1"> 
                          <input formControlName="category" (change)="onCategoryChange()" class="w-full p-2 border rounded-lg" list="catList" placeholder="選擇或輸入分類..."> 
                          <datalist id="catList"> 
                            @for(c of store.categories(); track c) { <option [value]="c"></option> } 
                          </datalist> 
                        </div> 
                        <div class="w-20"> <input [value]="currentCategoryCode()" (input)="onCodeInput($event)" class="w-full p-2 border rounded-lg text-center font-mono font-bold uppercase bg-gray-50" placeholder="代碼" maxlength="1" title="分類代碼 (例如 A)"> </div> 
                      </div> 
                    </div> 
                  </div> 
                  
                  <div class="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4"> 
                     <h4 class="font-bold text-gray-700 text-sm border-b border-gray-200 pb-2">💰 成本結構與獲利分析</h4> 
                     <div class="grid grid-cols-2 md:grid-cols-4 gap-4"> 
                        <div> <label class="block text-xs font-bold text-gray-500 mb-1">當地幣原價 (Local)</label> <input type="number" formControlName="localPrice" class="w-full p-2 border rounded-lg bg-white"> </div> 
                        <div> <label class="block text-xs font-bold text-gray-500 mb-1">匯率 (Rate)</label> <input type="number" formControlName="exchangeRate" step="0.001" class="w-full p-2 border rounded-lg bg-white"> </div> 
                        <div> <label class="block text-xs font-bold text-gray-500 mb-1">重量 kg</label> <input type="number" formControlName="weight" step="0.1" class="w-full p-2 border rounded-lg bg-white"> </div> 
                        <div> <label class="block text-xs font-bold text-gray-500 mb-1">國際運費/kg</label> <input type="number" formControlName="shippingCostPerKg" class="w-full p-2 border rounded-lg bg-white"> </div> 
                     </div> 
                     <div class="grid grid-cols-2 gap-4"> 
                        <div> <label class="block text-xs font-bold text-gray-500 mb-1">額外成本 (包材/加工)</label> <input type="number" formControlName="costMaterial" class="w-full p-2 border rounded-lg bg-white"> </div> 
                        <div class="flex flex-col justify-end"> <div class="text-xs text-gray-500 mb-1">預估總成本 (NT$)</div> <div class="text-xl font-bold text-gray-800 bg-white px-3 py-1.5 rounded border border-gray-200"> {{ estimatedCost() | number:'1.0-0' }} </div> </div> 
                     </div> 
                     <div class="flex items-center justify-between pt-2 border-t border-gray-200/50"> 
                        <div class="text-xs text-gray-500"> 定價: <span class="font-bold text-gray-800">$ {{ formValues().priceGeneral }}</span> </div> 
                        <div class="text-right"> 
                           <div class="text-xs text-gray-400">預估毛利 / 毛利率</div> 
                           <div class="font-bold" [class.text-green-600]="estimatedProfit() > 0" [class.text-red-500]="estimatedProfit() <= 0"> $ {{ estimatedProfit() | number:'1.0-0' }} <span class="text-xs ml-1 bg-gray-100 px-1 rounded text-gray-600"> {{ estimatedMargin() | number:'1.1-1' }}% </span> </div> 
                        </div> 
                     </div> 
                  </div> 

                  <div class="grid grid-cols-2 gap-4"> 
                    <div> <label class="block text-xs font-bold text-gray-500 mb-1">售價 (NT$)</label> <input type="number" formControlName="priceGeneral" class="w-full p-2 border rounded-lg"> </div> 
                    <div> <label class="block text-xs font-bold text-gray-500 mb-1">VIP價 (NT$)</label> <input type="number" formControlName="priceVip" class="w-full p-2 border rounded-lg"> </div> 
                  </div> 

                  <div class="grid grid-cols-2 gap-4 bg-red-50 p-4 rounded-xl border border-red-200 mt-4">
                     <div class="col-span-2 flex items-center justify-between border-b border-red-200 pb-2">
                       <h4 class="font-bold text-red-600 text-sm flex items-center gap-1"><span>🔥</span> 多入組優惠設定 (選填)</h4>
                       <span class="text-[10px] text-red-400">例如: 任選 3 件 $1000</span>
                     </div>
                     <div> <label class="block text-xs font-bold text-red-500 mb-1">任選數量 (件)</label> <input type="number" formControlName="bulkCount" class="w-full p-2 border border-red-200 rounded-lg focus:outline-none focus:border-red-400" placeholder="例如: 3"> </div>
                     <div> <label class="block text-xs font-bold text-red-500 mb-1">優惠總價 (NT$)</label> <input type="number" formControlName="bulkTotal" class="w-full p-2 border border-red-200 rounded-lg focus:outline-none focus:border-red-400" placeholder="例如: 1000"> </div>
                  </div>
                  
                  <div class="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                     <label class="flex items-center gap-3 cursor-pointer select-none">
                        <input type="checkbox" formControlName="isPreorder" class="w-5 h-5 rounded text-blue-600">
                        <span class="font-bold text-gray-700">這是一個「預購」商品</span>
                     </label>
                     <label class="flex items-center gap-3 cursor-pointer select-none">
                        <input type="checkbox" formControlName="isListed" class="w-5 h-5 rounded text-green-600">
                        <span class="font-bold text-gray-700">確認上架 (前台可見)</span>
                     </label>
                  </div>

                  <div class="grid grid-cols-2 gap-4"> 
                    <div> 
                      <label class="block text-xs font-bold text-gray-500 mb-1">庫存</label> 
                      @if(formValues().isPreorder) {
                         <input type="text" value="無限 (99999)" disabled class="w-full p-2 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed">
                      } @else {
                         <input type="number" formControlName="stock" class="w-full p-2 border rounded-lg"> 
                      }
                    </div> 
                    <div> <label class="block text-xs font-bold text-gray-500 mb-1">規格 (用逗號分隔)</label> <input formControlName="optionsStr" class="w-full p-2 border rounded-lg" placeholder="例如: 紅色, 藍色, 綠色"> </div> 
                  </div> 
                  
                  <div> <label class="block text-xs font-bold text-gray-500 mb-1">商品貨號 (SKU) <span class="text-xs font-normal text-gray-400 ml-1">自動生成: {{ generatedSkuPreview() }}</span></label> <input formControlName="code" class="w-full p-2 border rounded-lg font-mono bg-gray-50 text-gray-500"> </div> 
                  <div> <label class="block text-xs font-bold text-gray-500 mb-2">商品圖片 (第一張為主圖)</label> <div class="flex flex-wrap gap-2 mb-3"> @for(img of tempImages(); track $index) { <div class="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group bg-gray-50"> <img [src]="img" (error)="handleImageError($event)" class="w-full h-full object-cover"> <button (click)="removeImage($index)" class="absolute top-0 right-0 bg-black/50 hover:bg-red-500 text-white w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button> @if($index === 0) { <div class="absolute bottom-0 inset-x-0 bg-brand-900/80 text-white text-[9px] text-center font-bold">主圖</div> } </div> } </div> <div class="flex flex-col gap-2 p-4 bg-gray-50 rounded-xl border border-gray-200"> <div class="flex gap-2"> <input #urlInput type="text" placeholder="請貼上「圖片連結」 (以 .jpg .png 結尾)" class="flex-1 p-2 text-sm border rounded-lg"> <button (click)="addImageUrl(urlInput.value); urlInput.value=''" class="px-3 py-2 bg-gray-200 rounded-lg text-xs font-bold hover:bg-gray-300 whitespace-nowrap">加入網址</button> </div> <div class="flex items-center gap-2 flex-wrap mt-2"> <span class="text-xs font-bold text-gray-400">或</span> <label class="cursor-pointer px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold hover:bg-gray-50 flex items-center gap-1 whitespace-nowrap"> <span>📂 選擇電腦檔案</span> <input type="file" multiple accept="image/*" class="hidden" (change)="handleFileSelect($event)"> </label> <span class="text-xs font-bold text-gray-400">或</span> <a href="https://www.flickr.com/photos/upload" target="_blank" class="px-3 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-xs font-bold hover:bg-blue-100 flex items-center gap-1 whitespace-nowrap" title="前往 Flickr 上傳"> <span>☁️ Flickr 上傳</span> </a> </div> </div> </div> 
                  <div> <label class="block text-xs font-bold text-gray-500 mb-1">備註</label> <textarea formControlName="note" class="w-full p-2 border rounded-lg" rows="3"></textarea> </div> 
                </form> 
              </div> 
              <div class="p-6 border-t border-gray-100 flex justify-end gap-3"> 
                <button (click)="closeProductModal()" class="px-6 py-2 rounded-xl border border-gray-200 font-bold text-gray-500">取消</button> 
                <button (click)="submitProduct()" class="px-6 py-2 rounded-xl bg-brand-900 text-white font-bold hover:bg-black">確認儲存</button> 
              </div> 
            </div> 
          </div> 
        }

        @if (showUserModal()) { 
          <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" (click)="closeUserModal()"> 
            <div class="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" (click)="$event.stopPropagation()"> 
              <div class="p-6 border-b border-gray-100 flex justify-between items-center"> 
                <h3 class="text-xl font-bold text-brand-900">編輯會員資料</h3> 
                <button (click)="closeUserModal()" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200">✕</button> 
              </div> 
              <div class="p-6 overflow-y-auto flex-1 custom-scrollbar"> 
                <form [formGroup]="userForm" class="space-y-4"> 
                  <div> 
                    <label class="block text-xs font-bold text-gray-500 mb-1">會員 ID (無法修改)</label> 
                    <div class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-mono font-bold text-gray-600">{{ editingUser()?.id }}</div> 
                  </div> 
                  <div class="grid grid-cols-2 gap-4"> 
                    <div> <label class="block text-xs font-bold text-gray-500 mb-1">姓名</label> <input formControlName="name" class="w-full p-3 border border-gray-200 rounded-xl"> </div> 
                    <div> <label class="block text-xs font-bold text-gray-500 mb-1">電話</label> <input formControlName="phone" class="w-full p-3 border border-gray-200 rounded-xl"> </div> 
                  </div> 
                  <div class="grid grid-cols-2 gap-4"> 
                    <div> <label class="block text-xs font-bold text-gray-500 mb-1">生日</label> <input type="date" formControlName="birthday" class="w-full p-3 border border-gray-200 rounded-xl"> </div> 
                    <div> 
                      <label class="block text-xs font-bold text-gray-500 mb-1">會員等級</label> 
                      <select formControlName="tier" class="w-full p-3 border border-gray-200 rounded-xl bg-white"> 
                        <option value="general">一般會員</option> 
                        <option value="vip">VIP 會員</option> 
                        <option value="wholesale">批發會員</option> 
                      </select> 
                    </div> 
                  </div> 
                  <div class="grid grid-cols-2 gap-4"> 
                    <div> <label class="block text-xs font-bold text-gray-500 mb-1">購物金餘額 ($)</label> <input type="number" formControlName="credits" class="w-full p-3 border border-gray-200 rounded-xl font-bold text-brand-600"> </div> 
                    <div> <label class="block text-xs font-bold text-gray-500 mb-1">累積消費 ($)</label> <input type="number" formControlName="totalSpend" class="w-full p-3 border border-gray-200 rounded-xl font-bold text-gray-800"> </div> 
                  </div> 
                  <div> <label class="block text-xs font-bold text-gray-500 mb-1">管理員備註</label> <textarea formControlName="note" class="w-full p-3 border border-gray-200 rounded-xl" rows="3"></textarea> </div> 
                </form> 
              </div> 
              <div class="p-6 border-t border-gray-100 flex justify-end gap-3"> 
                <button (click)="closeUserModal()" class="px-6 py-2 rounded-xl border border-gray-200 font-bold text-gray-500">取消</button> 
                <button (click)="saveUser()" class="px-6 py-2 rounded-xl bg-brand-900 text-white font-bold hover:bg-black">確認儲存</button> 
              </div> 
            </div> 
          </div> 
        }

        @if (actionModalOrder(); as o) { 
          <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4" (click)="closeActionModal()"> 
            <div class="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-fade-in flex flex-col max-h-[90vh]" (click)="$event.stopPropagation()"> 
              
              <div class="p-6 border-b border-gray-100 bg-gray-50 shrink-0"> 
                <h3 class="text-xl font-bold text-gray-800 flex items-center gap-2"> <span>⚡️ 操作訂單</span> <span class="font-mono text-gray-400">#{{ o.id }}</span> </h3> 
                <div class="flex gap-2 mt-2"> <span class="px-2 py-1 rounded text-xs font-bold bg-white border border-gray-200"> 狀態: {{ getPaymentStatusLabel(o.status, o.paymentMethod) }} </span> </div> 
              </div> 

              <div class="p-6 border-b border-gray-100 bg-white shrink-0">
                 <div class="text-sm font-bold text-gray-700 mb-3 border-l-4 border-brand-400 pl-2">客戶資訊</div>
                 <div class="text-xs text-gray-600 mb-4 grid grid-cols-2 gap-2">
                    <div><span class="text-gray-400">姓名:</span> {{ o.userName }}</div>
                    <div><span class="text-gray-400">Email:</span> {{ o.userEmail || '無' }}</div>
                    <div><span class="text-gray-400">付款:</span> {{ getPaymentLabel(o.paymentMethod) }}</div>
                    <div><span class="text-gray-400">物流:</span> {{ getShippingLabel(o.shippingMethod) }}</div>
                    @if(o.paymentName) { <div class="col-span-2 text-blue-600"><span class="text-blue-400">匯款回報:</span> {{ o.paymentName }} (後五碼: {{ o.paymentLast5 }})</div> }
                 </div>

                 <div class="text-sm font-bold text-gray-700 mb-3 border-l-4 border-brand-400 pl-2">商品明細</div>
                 <div class="space-y-2 mb-4 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                    @for(item of o.items; track item.productId + item.option) {
                       <div class="flex items-center gap-3 bg-gray-50 p-2 rounded-lg">
                          <img [src]="item.productImage" class="w-10 h-10 rounded-md object-cover bg-gray-200 shrink-0">
                          <div class="flex-1 min-w-0">
                             <div class="text-xs font-bold text-gray-800 truncate">{{ item.productName }}</div>
                             <div class="text-[10px] text-gray-500">{{ item.option }}</div>
                          </div>
                          <div class="text-right shrink-0">
                             <div class="text-xs font-bold text-brand-900">NT$ {{ item.price }}</div>
                             <div class="text-[10px] text-gray-500">x{{ item.quantity }}</div>
                          </div>
                       </div>
                    }
                 </div>
                 
                 <div class="bg-gray-50 p-3 rounded-lg text-xs space-y-1">
                    <div class="flex justify-between"><span class="text-gray-500">商品小計</span><span>NT$ {{ o.subtotal }}</span></div>
                    <div class="flex justify-between"><span class="text-gray-500">運費</span><span>NT$ {{ o.shippingFee }}</span></div>
                    <div class="flex justify-between text-red-500"><span class="">折扣/購物金</span><span>- NT$ {{ o.discount + o.usedCredits }}</span></div>
                    <div class="flex justify-between font-bold text-sm text-brand-900 pt-1 border-t border-gray-200 mt-1"><span>總計</span><span>NT$ {{ o.finalTotal }}</span></div>
                 </div>
              </div>
              
              <div class="p-6 grid grid-cols-2 gap-4 overflow-y-auto flex-1 custom-scrollbar"> 
                <button (click)="store.notifyArrival(o)" class="col-span-2 p-4 rounded-2xl bg-purple-50 hover:bg-purple-100 border border-purple-100 text-left transition-colors flex items-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed">
                   <div class="text-2xl group-hover:scale-110 transition-transform w-fit text-purple-600">🚛</div>
                   <div><div class="font-bold text-purple-900">通知貨到 (發送賣貨便)</div><div class="text-[10px] text-purple-400">發送 Email/TG 通知客人下單</div></div>
                </button>

                <button (click)="doMyshipPickup(o)" class="col-span-2 p-4 rounded-2xl bg-teal-50 hover:bg-teal-100 border border-teal-100 text-left transition-colors flex items-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed" [disabled]="o.status === 'picked_up' || o.status === 'completed' || o.status === 'cancelled'">
                   <div class="text-2xl group-hover:scale-110 transition-transform w-fit text-teal-600">🏪</div>
                   <div><div class="font-bold text-teal-900">賣貨便確認取貨</div><div class="text-[10px] text-teal-500">標記買家已於門市取件</div></div>
                </button>

                <button (click)="doShip(o)" class="p-4 rounded-2xl bg-blue-50 hover:bg-blue-100 border border-blue-100 text-left transition-colors flex flex-col gap-2 group disabled:opacity-50 disabled:cursor-not-allowed" [disabled]="o.status === 'shipped' || o.status === 'picked_up' || o.status === 'pending_payment' || o.status === 'unpaid_alert' || o.status === 'refund_needed' || o.status === 'refunded' || o.status === 'completed' || o.status === 'cancelled'"> <div class="text-2xl group-hover:scale-110 transition-transform w-fit">📦</div> <div> <div class="font-bold text-blue-900">安排出貨</div> <div class="text-[10px] text-blue-400">標記為已出貨</div> </div> </button> 
                <button (click)="doConfirm(o)" class="p-4 rounded-2xl bg-green-50 hover:bg-green-100 border border-green-100 text-left transition-colors flex flex-col gap-2 group disabled:opacity-50 disabled:cursor-not-allowed" [disabled]="o.status !== 'paid_verifying' && o.status !== 'pending_payment' && o.status !== 'unpaid_alert'"> <div class="text-2xl group-hover:scale-110 transition-transform w-fit">✅</div> <div> <div class="font-bold text-green-900">確認收款</div> <div class="text-[10px] text-green-500">轉為已付款</div> </div> </button> 
                <button (click)="doAlert(o)" class="p-4 rounded-2xl bg-orange-50 hover:bg-orange-100 border border-orange-100 text-left transition-colors flex flex-col gap-2 group disabled:opacity-50 disabled:cursor-not-allowed" [disabled]="o.status !== 'pending_payment' && o.status !== 'unpaid_alert' && o.status !== 'paid_verifying'"> <div class="text-2xl group-hover:scale-110 transition-transform w-fit">🔔</div> <div> <div class="font-bold text-orange-900">提醒付款</div> <div class="text-[10px] text-orange-400">發送提醒</div> </div> </button> 
                <button (click)="doRefundNeeded(o)" class="p-4 rounded-2xl bg-red-50 hover:bg-red-100 border border-red-100 text-left transition-colors flex flex-col gap-2 group disabled:opacity-50 disabled:cursor-not-allowed" [disabled]="o.status === 'refunded' || o.status === 'refund_needed' || o.status === 'shipped' || o.status === 'picked_up' || o.status === 'cancelled'"> <div class="text-2xl group-hover:scale-110 transition-transform w-fit">⚠️</div> <div> <div class="font-bold text-red-900">缺貨/需退款</div> <div class="text-[10px] text-red-400">標記為問題訂單</div> </div> </button> 
                <button (click)="doRefundDone(o)" class="col-span-2 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-100 text-left transition-colors flex items-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed" [disabled]="o.status === 'refunded' || o.status === 'cancelled'"> <div class="text-2xl group-hover:scale-110 transition-transform w-fit">💸</div> <div> <div class="font-bold text-gray-800">確認已退款</div> <div class="text-[10px] text-gray-400">強制結案並標記為已退款 (任何狀態可用)</div> </div> </button> 
                <button (click)="quickComplete($event, o)" class="col-span-2 p-4 rounded-2xl bg-green-800 hover:bg-green-900 border border-green-700 text-left transition-colors flex items-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed" [disabled]="(o.status !== 'shipped' && o.status !== 'picked_up') || o.paymentMethod !== 'cod'"> <div class="text-2xl group-hover:scale-110 transition-transform w-fit text-white">💰</div> <div> <div class="font-bold text-white">確認已收款 (COD)</div> <div class="text-[10px] text-green-200">貨到付款專用：確認物流已撥款</div> </div> </button> 
                <button (click)="doCancel(o)" class="col-span-2 text-xs font-bold py-3 border-t border-gray-100 transition-colors flex justify-center items-center" [class.bg-red-500]="cancelConfirmState()" [class.text-white]="cancelConfirmState()" [class.hover:bg-red-600]="cancelConfirmState()" [class.text-gray-400]="!cancelConfirmState()" [class.hover:text-red-500]="!cancelConfirmState()" [class.hover:bg-red-50]="!cancelConfirmState()" [disabled]="o.status === 'cancelled' || o.status === 'shipped' || o.status === 'picked_up' || o.status === 'completed'"> {{ cancelConfirmState() ? '⚠️ 確定要取消嗎？(點擊確認)' : '🚫 取消訂單 (保留紀錄但標記為取消)' }} </button> 
                
                <button (click)="doDeleteOrder(o)" class="col-span-2 text-xs font-bold py-3 border-t border-gray-100 transition-colors flex justify-center items-center rounded-b-2xl bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700">
                  🗑️ 徹底刪除訂單 (測試用)
                </button>
              </div> 
              
              <div class="p-4 bg-gray-50 border-t border-gray-100 shrink-0"> <button (click)="closeActionModal()" class="w-full py-3 rounded-xl bg-white border border-gray-200 text-gray-600 font-bold hover:bg-gray-100 transition-colors"> 關閉 </button> </div> 
            </div> 
          </div> 
        }
      </main>
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
export class AdminPanelComponent {
  store = inject(StoreService);
  fb: FormBuilder = inject(FormBuilder);
  now = new Date();
  activeTab = signal('dashboard');
  productSearch = signal('');
  productViewMode = signal<'list' | 'grid'>('list');

  filteredAdminProducts = computed(() => {
    const q = this.productSearch().toLowerCase();
    let list = [...this.store.products()];
    if (q) {
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.code.toLowerCase().includes(q) || 
        p.category.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => b.id.localeCompare(a.id));
  });

  private parseCSV(text: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let inQuotes = false;
    let val = '';
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      if (char === '"' && inQuotes && nextChar === '"') {
        val += '"'; i++; 
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(val.trim()); val = '';
      } else if (char === '\n' && !inQuotes) {
        row.push(val.trim()); rows.push(row); row = []; val = '';
      } else if (char !== '\r') {
        val += char;
      }
    }
    if (val || row.length > 0) { row.push(val.trim()); rows.push(row); }
    return rows;
  }

  async handleBatchImport(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e: any) => {
      const text = e.target.result;
      const rows = this.parseCSV(text);
      if (rows.length < 2) { alert('CSV 檔案格式錯誤或沒有資料！'); return; }

      let successCount = 0; let failCount = 0;

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 4 || !row[2] || !row[3]) continue;
        if (row[2].includes('商品名稱') || row[2] === '秋季毛衣') continue; 

        try {
          const name = String(row[2] || '').trim(); 
          const category = String(row[3] || '').trim();
          const priceGeneral = Number(row[4]) || 0; 
          const priceVip = Number(row[5]) || 0;
          const localPrice = Number(row[6]) || 0; 
          const exchangeRate = Number(row[7]) || 0.22;
          const weight = Number(row[8]) || 0; 
          const shippingCostPerKg = Number(row[9]) || 200;
          const costMaterial = Number(row[10]) || 0;
          
          const bulkCount = Number(row[11]) || 0;
          const bulkTotal = Number(row[12]) || 0;

          const imageRaw = String(row[13] || '');
          const imagesArray = imageRaw.split(/[,\n]+/).map((s: string) => s.trim()).filter((s: string) => s.startsWith('http')); 
          const mainImage = imagesArray.length > 0 ? imagesArray[0] : 'https://placehold.co/300x300?text=No+Image';
          const allImages = imagesArray.length > 0 ? imagesArray : [mainImage];

          const optionsStr = String(row[14] || '');
          const stockInput = Number(row[15]) || 0;
          
          const isPreorder = String(row[16] || '').trim().toUpperCase() === 'TRUE';
          const isListed = String(row[17] || '').trim().toUpperCase() !== 'FALSE'; 
          const note = String(row[19] || '');
          
          const stock = isPreorder ? 99999 : stockInput;
          const options = optionsStr ? optionsStr.split(',').map((s: string) => s.trim()).filter((s: string) => s) : [];
          
          let code = String(row[18] || '').replace(/\t/g, '').trim(); 
          if (!code) {
            const codeMap = this.store.settings().categoryCodes || {};
            const prefix = codeMap[category] || 'Z'; 
            const now = new Date();
            const datePart = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
            code = `${prefix}${datePart}${String(i).padStart(3, '0')}`;
          }

          const existingProduct = this.store.products().find(p => p.code === code);
          const uniqueId = existingProduct?.id || (Date.now().toString() + '-' + i + '-' + Math.random().toString(36).substring(2, 7));

          const p: any = {
            id: uniqueId, 
            code, name, category, image: mainImage, images: allImages,
            priceGeneral, priceVip, priceWholesale: 0, localPrice, exchangeRate,        
            weight, shippingCostPerKg, costMaterial, stock, options, note, priceType: 'normal',
            soldCount: existingProduct?.soldCount || 0, country: 'Korea',
            allowPayment: { cash: true, bankTransfer: true, cod: true },
            allowShipping: { meetup: true, myship: true, family: true, delivery: true },
            isPreorder, isListed
          };

          if (bulkCount > 1 && bulkTotal > 0) {
            p.bulkDiscount = { count: bulkCount, total: bulkTotal };
          }

          this.store.addCategory(category);
          
          if (existingProduct) {
            await this.store.updateProduct(p);
          } else {
            await this.store.addProduct(p);
          }
          successCount++;
        } catch (err) { 
          console.error('匯入失敗的商品:', row[2], err);
          failCount++; 
        }
      }
      alert(`✅ 批量操作完成！\n成功新增/更新：${successCount} 筆\n失敗/略過：${failCount} 筆`);
      event.target.value = ''; 
    };
    reader.readAsText(file, 'UTF-8');
  }

  reportSortBy = signal<'sold' | 'profit'>('sold');
  accountingRange = signal('month'); 
  accountingCustomStart = signal(''); 
  accountingCustomEnd = signal('');

  accountingFilteredOrders = computed(() => {
    const orders = this.store.orders(); 
    const range = this.accountingRange(); 
    const now = new Date();
    let startDate: Date | null = null; let endDate: Date | null = null;
    
    if (range === 'today') startDate = new Date(now.setHours(0,0,0,0));
    else if (range === 'week') startDate = new Date(now.setHours(0,0,0,0) - ((now.getDay() || 7) - 1) * 24 * 60 * 60 * 1000);
    else if (range === 'month') startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    else if (range === 'custom' && this.accountingCustomStart()) { startDate = new Date(this.accountingCustomStart()); if (this.accountingCustomEnd()) endDate = new Date(this.accountingCustomEnd()); }

    return orders.filter((o: Order) => {
      const d = new Date(o.createdAt);
      if (startDate && d < startDate) return false;
      if (endDate) { const e = new Date(endDate); e.setHours(23,59,59,999); if (d > e) return false; }
      if (['cancelled', 'refunded'].includes(o.status)) return false;
      return true;
    });
  });

  accountingStats = computed(() => {
    const filteredOrders = this.accountingFilteredOrders();
    let revenue = 0; let cost = 0; let discounts = 0;
    let payReceived = 0; let payVerifying = 0; let payUnpaid = 0; let payRefund = 0; let payRefundedTotal = 0;

    filteredOrders.forEach((o: Order) => {
      if (o.status === 'refund_needed') payRefund += o.finalTotal;
      else if (o.status === 'paid_verifying') payVerifying += o.finalTotal;
      else if (o.status === 'payment_confirmed' || o.status === 'shipped' || o.status === 'completed' || o.status === 'picked_up' as any) {
          if (o.paymentMethod === 'cod' && o.status !== 'completed') payUnpaid += o.finalTotal; else payReceived += o.finalTotal;
      } else if (['pending_payment', 'unpaid_alert'].includes(o.status)) {
          payUnpaid += o.finalTotal;
      }
      
      revenue += o.finalTotal;
      o.items.forEach((i: CartItem) => {
          const p = this.store.products().find((x: Product) => x.id === i.productId);
          if (p) cost += ((p.localPrice * p.exchangeRate) + p.costMaterial + (p.weight * p.shippingCostPerKg)) * i.quantity;
      });
      discounts += o.discount + o.usedCredits;
    });

    return { 
        revenue, cost, profit: revenue - cost, margin: revenue ? ((revenue-cost)/revenue)*100 : 0, discounts, count: filteredOrders.length, maxOrder: filteredOrders.length > 0 ? Math.max(...filteredOrders.map(o=>o.finalTotal)) : 0, minOrder: filteredOrders.length > 0 ? Math.min(...filteredOrders.map(o=>o.finalTotal)) : 0, avgOrder: filteredOrders.length > 0 ? revenue / (filteredOrders.filter((o: Order) => o.status !== 'pending_payment').length || 1) : 0, payment: { total: payReceived + payVerifying + payUnpaid + payRefund, received: payReceived, verifying: payVerifying, unpaid: payUnpaid, refund: payRefund, refundedTotal: payRefundedTotal } 
    };
  });

  productPerformance = computed(() => { 
    const orders = this.accountingFilteredOrders();
    const productMap = new Map<string, any>();
    
    orders.forEach(o => {
      o.items.forEach(item => {
          if (!productMap.has(item.productId)) {
            const p = this.store.products().find(x => x.id === item.productId);
            if(p) productMap.set(item.productId, { product: p, sold: 0, revenue: 0, cost: 0 });
          }
          const stats = productMap.get(item.productId);
          if (stats) stats.sold += item.quantity;
      });
    });

    return Array.from(productMap.values()).map(stats => {
      const p = stats.product;
      const costPerUnit = (p.localPrice * p.exchangeRate) + (p.weight * p.shippingCostPerKg) + p.costMaterial;
      stats.cost = stats.sold * costPerUnit;

      let estimatedRevenue = 0; let hasBulk = false;
      if (p.bulkDiscount && p.bulkDiscount.count > 1 && p.bulkDiscount.total > 0 && stats.sold >= p.bulkDiscount.count) {
          hasBulk = true;
          const sets = Math.floor(stats.sold / p.bulkDiscount.count);
          const remainder = stats.sold % p.bulkDiscount.count;
          estimatedRevenue = (sets * p.bulkDiscount.total) + (remainder * p.priceGeneral);
      } else { estimatedRevenue = stats.sold * p.priceGeneral; }

      stats.revenue = estimatedRevenue; stats.profit = estimatedRevenue - stats.cost; stats.margin = estimatedRevenue ? (stats.profit / estimatedRevenue) * 100 : 0; stats.hasBulk = hasBulk;
      return stats;
    });
  });

  topSellingProducts = computed(() => [...this.productPerformance()].sort((a, b) => b.sold - a.sold));
  topProfitProducts = computed(() => [...this.productPerformance()].sort((a, b) => b.profit - a.profit));

  // 🔥 確保主控台泡泡數量同步
  dashboardMetrics = computed(() => { 
    const orders = this.store.orders(); 
    const today = new Date().toDateString(); 
    const thisMonth = new Date().getMonth(); 
    let todayRev = 0; let monthSales = 0; let monthCost = 0; 
    
    orders.forEach((o: Order) => {
        const dStr = new Date(o.createdAt).toDateString();
        const dMonth = new Date(o.createdAt).getMonth();

        if(!['pending_payment', 'unpaid_alert', 'cancelled', 'refunded'].includes(o.status)) { 
          if (dStr === today) todayRev += o.finalTotal; 
          if (dMonth === thisMonth) {
              monthSales += o.finalTotal; 
              o.items.forEach((i: CartItem) => { 
                const p = this.store.products().find((x: Product) => x.id === i.productId); 
                if(p) monthCost += ((p.localPrice * p.exchangeRate) + p.costMaterial + (p.weight * p.shippingCostPerKg)) * i.quantity; 
              }); 
          }
        } 
    }); 
    
    return { 
        todayRevenue: todayRev, 
        monthSales, 
        monthProfit: monthSales - monthCost, 
        toConfirm: orders.filter((o: Order) => ['pending_payment', 'unpaid_alert', 'paid_verifying'].includes(o.status)).length, 
        toShip: orders.filter((o: Order) => o.status === 'payment_confirmed').length, 
        unpaid: orders.filter((o: Order) => ['pending_payment', 'unpaid_alert'].includes(o.status)).length, 
        processing: orders.filter((o: Order) => o.status === 'refund_needed').length 
    }; 
  });

  pendingCount = computed(() => this.dashboardMetrics().toConfirm);
  topProducts = computed(() => [...this.store.products()].sort((a: any, b: any) => b.soldCount - a.soldCount).slice(0, 5));

  statsRange = signal('今日'); 
  orderStart = signal(''); 
  orderEnd = signal(''); 
  orderSearch = signal(''); 
  orderPageSize = signal<number | 'all'>(50); 
  orderPage = signal(1); 
  orderStatusTab = signal('all'); 
  actionModalOrder = signal<Order | null>(null); 
  cancelConfirmState = signal(false);
  
  orderTabs = [ 
    { id: 'all', label: '全部' }, 
    { id: 'pending', label: '待付款' }, 
    { id: 'verifying', label: '待對帳' }, 
    { id: 'shipping', label: '待出貨' }, 
    { id: 'completed', label: '已完成' }, 
    { id: 'refund', label: '退款/取消' } 
  ];
  
  setOrderRange(range: string) { 
    this.statsRange.set(range); 
    this.orderStart.set(''); 
    this.orderEnd.set(''); 
  }

  filteredOrders = computed(() => { 
    let list = [...this.store.orders()]; 
    const q = this.orderSearch().toLowerCase(); 
    const tab = this.orderStatusTab(); 
    const range = this.statsRange(); 
    const now = new Date(); 
    if (range === '今日') list = list.filter((o: Order) => new Date(o.createdAt).toDateString() === now.toDateString()); 
    else if (range === '本週') { const s = new Date(now); s.setDate(now.getDate() - now.getDay()); s.setHours(0,0,0,0); list = list.filter((o: Order) => o.createdAt >= s.getTime()); } 
    else if (range === '本月') list = list.filter((o: Order) => new Date(o.createdAt).getMonth() === now.getMonth() && new Date(o.createdAt).getFullYear() === now.getFullYear()); 
    const os = this.orderStart(); const oe = this.orderEnd(); 
    if (os) list = list.filter((o: Order) => o.createdAt >= new Date(os).setHours(0,0,0,0)); 
    if (oe) list = list.filter((o: Order) => o.createdAt <= new Date(oe).setHours(23,59,59,999)); 
    if (tab === 'pending') list = list.filter((o: Order) => ['pending_payment', 'unpaid_alert'].includes(o.status)); 
    else if (tab === 'verifying') list = list.filter((o: Order) => o.status === 'paid_verifying'); 
    else if (tab === 'shipping') list = list.filter((o: Order) => o.status === 'payment_confirmed'); 
    else if (tab === 'completed') list = list.filter((o: Order) => ['shipped', 'picked_up', 'completed'].includes(o.status as any)); 
    else if (tab === 'refund') list = list.filter((o: Order) => ['refund_needed', 'refunded', 'cancelled'].includes(o.status)); 
    if (q) list = list.filter((o: Order) => o.id.includes(q) || o.items.some((i: CartItem) => i.productName.toLowerCase().includes(q)) || this.getUserName(o.userId).toLowerCase().includes(q)); 
    return list.sort((a: any, b: any) => b.createdAt - a.createdAt); 
  });
  
  paginatedOrders = computed(() => { 
    const list = this.filteredOrders(); 
    const size = this.orderPageSize(); 
    if (size === 'all') return list; 
    const start = (this.orderPage() - 1) * size; 
    return list.slice(start, start + size); 
  });

  customerPageSize = signal<number | 'all'>(50); 
  customerPage = signal(1); 
  customerSearch = signal(''); 
  birthMonthFilter = signal('all'); 
  memberStart = signal(''); 
  memberEnd = signal(''); 
  showUserModal = signal(false); 
  editingUser = signal<User | null>(null); 
  userForm: FormGroup;
  
  // 🔥 客戶管理防護移除，完整還原資料
  filteredUsers = computed(() => { 
    let list = [...this.store.users()]; 
    const q = this.customerSearch().toLowerCase(); 
    const bm = this.birthMonthFilter(); 
    const start = this.memberStart(); 
    const end = this.memberEnd(); 
    if (q) list = list.filter((u: User) => u.name.toLowerCase().includes(q) || (u.phone && u.phone.includes(q)) || u.id.toLowerCase().includes(q) || (u.memberNo && u.memberNo.includes(q))); 
    if (bm !== 'all') list = list.filter((u: User) => { if (!u.birthday) return false; return new Date(u.birthday).getMonth() + 1 === parseInt(bm); }); 
    if (start || end) { list = list.filter(u => { if (!u.memberNo || u.memberNo.length < 9) return false; const noDatePart = u.memberNo.substring(1, 9); const startDate = start ? start.replace(/-/g, '') : null; const endDate = end ? end.replace(/-/g, '') : null; if (startDate && noDatePart < startDate) return false; if (endDate && noDatePart > endDate) return false; return true; }); } 
    return list; 
  });
  
  paginatedUsers = computed(() => { 
    const list = this.filteredUsers(); 
    const size = this.customerPageSize(); 
    if (size === 'all') return list; 
    const start = (this.customerPage() - 1) * size; 
    return list.slice(start, start + size); 
  });

  showProductModal = signal(false); 
  editingProduct = signal<Product | null>(null); 
  productForm: FormGroup; 
  tempImages = signal<string[]>([]); 
  formValues = signal<any>({}); 
  categoryCodes = computed(() => this.store.settings().categoryCodes); 
  currentCategoryCode = signal(''); 
  generatedSkuPreview = signal(''); 
  settingsForm: FormGroup;
  
  constructor() {
    this.productForm = this.fb.group({ name: ['', Validators.required], category: [''], code: [''], priceGeneral: [0], priceVip: [0], localPrice: [0], exchangeRate: [0.22], weight: [0], shippingCostPerKg: [200], costMaterial: [0], stock: [0], optionsStr: [''], note: [''], isPreorder: [false], isListed: [true], bulkCount: [0], bulkTotal: [0] });
    this.productForm.valueChanges.subscribe(v => this.formValues.set(v));
    const s = this.store.settings();
    this.settingsForm = this.fb.group({ enableCash: [s.paymentMethods.cash], enableBank: [s.paymentMethods.bankTransfer], enableCod: [s.paymentMethods.cod], birthdayGiftGeneral: [s.birthdayGiftGeneral], birthdayGiftVip: [s.birthdayGiftVip], shipping: this.fb.group({ freeThreshold: [s.shipping.freeThreshold], methods: this.fb.group({ meetup: this.fb.group({ enabled: [s.shipping.methods.meetup.enabled], fee: [s.shipping.methods.meetup.fee] }), myship: this.fb.group({ enabled: [s.shipping.methods.myship.enabled], fee: [s.shipping.methods.myship.fee] }), family: this.fb.group({ enabled: [s.shipping.methods.family.enabled], fee: [s.shipping.methods.family.fee] }), delivery: this.fb.group({ enabled: [s.shipping.methods.delivery.enabled], fee: [s.shipping.methods.delivery.fee] }) }) }) });
    this.userForm = this.fb.group({ name: ['', Validators.required], phone: [''], birthday: [''], tier: ['general'], credits: [0], totalSpend: [0], note: [''] });
  }

  estimatedCost = computed(() => { const v = this.formValues(); if (!v) return 0; return (v.localPrice * v.exchangeRate) + (v.weight * v.shippingCostPerKg) + v.costMaterial; }); 
  estimatedProfit = computed(() => (this.formValues()?.priceGeneral || 0) - this.estimatedCost()); 
  estimatedMargin = computed(() => this.formValues()?.priceGeneral ? (this.estimatedProfit() / this.formValues().priceGeneral) * 100 : 0);
  
  navClass(tab: string) { return `w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all mb-1 ${this.activeTab() === tab ? 'bg-brand-900 text-white font-bold shadow-md' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`; } 
  getTabTitle() { const map: any = { dashboard: '主控台 Dashboard', orders: '訂單管理 Orders', products: '商品管理 Products', customers: '客戶管理 Customers', accounting: '銷售報表 Accounting', inventory: '庫存盤點 Inventory', settings: '商店設定 Settings' }; return map[this.activeTab()] || ''; } 
  goToOrders(filter: string) { this.activeTab.set('orders'); this.orderStatusTab.set(filter); } 
  toNumber(val: any) { return Number(val); } 
  getUserName(id: string) { return this.store.users().find((u: User) => u.id === id)?.name || id; } 
  getThumb(o: Order) { return o.items[0]?.productImage; } 
  timeAgo(ts: number) { const mins = Math.floor((Date.now() - ts) / 60000); if(mins < 60) return `${mins} 分鐘前`; const hours = Math.floor(mins / 60); if(hours < 24) return `${hours} 小時前`; return `${Math.floor(hours/24)} 天前`; }
  
  getPaymentStatusLabel(s: string, method?: string) { const map: any = { pending_payment: '未付款', paid_verifying: '對帳中', unpaid_alert: '逾期未付', refund_needed: '需退款', refunded: '已退款', payment_confirmed: method === 'cod' ? '待出貨 (未入帳)' : '已付款', shipped: method === 'cod' ? '已出貨 (未入帳)' : '已出貨', picked_up: method === 'cod' ? '已取貨 (未撥款)' : '已取貨', completed: '已完成 (已入帳)', cancelled: '🚫 已取消' }; return map[s] || s; } 
  getPaymentStatusClass(s: string) { if(s==='payment_confirmed') return 'bg-green-100 text-green-700'; if(s==='paid_verifying') return 'bg-yellow-100 text-yellow-700'; if(s==='pending_payment' || s==='unpaid_alert') return 'bg-red-50 text-red-500'; if(s==='refunded') return 'bg-gray-200 text-gray-500 line-through'; if(s==='cancelled') return 'bg-gray-200 text-gray-400 border border-gray-300'; if(s==='refund_needed') return 'bg-red-100 text-red-700 font-bold border border-red-200'; if(s==='picked_up') return 'bg-teal-100 text-teal-700 font-bold'; if(s==='completed') return 'bg-green-600 text-white font-bold'; return 'bg-gray-100 text-gray-500'; } 
  getShippingStatusLabel(s: string) { const map: any = { payment_confirmed: '待出貨', shipped: '已出貨', picked_up: '門市已取貨', completed: '已完成' }; return map[s] || '-'; } 
  getShippingStatusClass(s: string) { if(s==='shipped') return 'bg-blue-100 text-blue-700'; if(s==='picked_up') return 'bg-teal-100 text-teal-700 font-bold'; if(s==='completed') return 'bg-gray-800 text-white'; return 'text-gray-400'; } 
  getPaymentLabel(m: string) { const map: any = { cash: '現金付款', bank_transfer: '銀行轉帳', cod: '貨到付款' }; return map[m] || m; }
  getShippingLabel(m: string) { const map: any = { meetup: '面交自取', myship: '7-11 賣貨便', family: '全家好賣家', delivery: '宅配寄送' }; return map[m] || m; }
  formatMemberNo(no?: string): string { if (!no) return '舊會員 (待更新)'; if (no.includes('/')) return 'M' + no.replace(/\//g, ''); return no; }
  
  openAction(e: Event, order: Order) { e.stopPropagation(); this.actionModalOrder.set(order); this.cancelConfirmState.set(false); } 
  closeActionModal() { this.actionModalOrder.set(null); } 
  doConfirm(o: Order) { this.store.updateOrderStatus(o.id, 'payment_confirmed'); this.closeActionModal(); } 
  doAlert(o: Order) { this.store.updateOrderStatus(o.id, 'unpaid_alert'); this.closeActionModal(); } 
  doRefundNeeded(o: Order) { this.store.updateOrderStatus(o.id, 'refund_needed'); this.orderStatusTab.set('refund'); this.closeActionModal(); } 
  doRefundDone(o: Order) { this.store.updateOrderStatus(o.id, 'refunded'); this.closeActionModal(); } 
  doShip(o: Order) { const code = prompt('請輸入物流單號'); if (code !== null) { this.store.updateOrderStatus(o.id, 'shipped', { shippingLink: code }); this.closeActionModal(); } } 
  doMyshipPickup(o: Order) { this.store.updateOrderStatus(o.id, 'picked_up' as any); this.closeActionModal(); } 
  doCancel(o: Order) { if(this.cancelConfirmState()) { this.store.updateOrderStatus(o.id, 'cancelled'); this.closeActionModal(); } else { this.cancelConfirmState.set(true); } } 
  doDeleteOrder(o: Order) { if(confirm(`⚠️ 警告：確定要徹底刪除訂單 #${o.id} 嗎？\n資料刪除後將無法復原，且系統會自動扣除該會員對應的累積消費金額！(購物金如有使用亦會退還)`)) { this.store.deleteOrder(o); this.closeActionModal(); } } 
  quickConfirm(e: Event, o: Order) { e.stopPropagation(); this.store.updateOrderStatus(o.id, 'payment_confirmed'); } 
  quickShip(e: Event, o: Order) { e.stopPropagation(); this.store.updateOrderStatus(o.id, 'shipped'); } 
  quickRefundDone(e: Event, o: Order) { e.stopPropagation(); this.store.updateOrderStatus(o.id, 'refunded'); } 
  quickComplete(e: Event, o: Order) { e.stopPropagation(); this.store.updateOrderStatus(o.id, 'completed'); }
  
  private downloadCSV(filename: string, headers: string[], rows: any[]) { const BOM = '\uFEFF'; const csvContent = [ headers.join(','), ...rows.map(row => row.map((cell: any) => `"${String(cell === null || cell === undefined ? '' : cell).replace(/"/g, '""')}"`).join(',')) ].join('\r\n'); const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.setAttribute('download', `${filename}.csv`); document.body.appendChild(link); link.click(); document.body.removeChild(link); } 
  copyOrdersToClipboard() { const list = this.filteredOrders().map((o: Order) => `${o.id}\t${this.getUserName(o.userId)}\tNT$${o.finalTotal}`).join('\n'); navigator.clipboard.writeText(list).then(() => alert('訂單摘要已複製！')); } 
  exportOrdersCSV() { const headers = ['訂單編號', '下單日期', '客戶姓名', '付款方式', '物流方式', '總金額', '訂單狀態', '物流單號', '商品內容']; const payMap: any = { cash: '現金付款', bank_transfer: '銀行轉帳', cod: '貨到付款' }; const shipMap: any = { meetup: '面交自取', myship: '7-11 賣貨便', family: '全家好賣家', delivery: '宅配寄送' }; const rows = this.filteredOrders().map((o: Order) => [ `\t${o.id}`, new Date(o.createdAt).toLocaleString('zh-TW', { hour12: false }), this.getUserName(o.userId), payMap[o.paymentMethod] || o.paymentMethod, shipMap[o.shippingMethod] || o.shippingMethod, o.finalTotal, this.getPaymentStatusLabel(o.status, o.paymentMethod), o.shippingLink || '', o.items.map((i: CartItem) => `• ${i.productName} (${i.option}) x ${i.quantity}`).join('\n') ]); this.downloadCSV(`訂單報表_${new Date().toISOString().slice(0,10)}`, headers, rows); } 
  exportCustomersCSV() { const headers = ['會員編碼', '會員ID', '姓名', '電話', '等級', '累積消費', '購物金餘額', '生日']; const rows = this.filteredUsers().map((u: User) => [ `\t${this.formatMemberNo(u.memberNo)}`, `\t${u.id}`, u.name, `\t${u.phone || ''}`, u.tier === 'vip' ? 'VIP' : (u.tier === 'wholesale' ? '批發' : '一般'), u.totalSpend, u.credits, u.birthday || '' ]); this.downloadCSV(`會員名單_${new Date().toISOString().slice(0,10)}`, headers, rows); } 
  exportInventoryCSV() { const headers = ['SKU貨號', '商品名稱', '分類', '庫存數量', '狀態']; const rows = this.store.products().map((p: Product) => [ `\t${p.code}`, p.name, p.category, p.stock, p.stock <= 0 ? '缺貨' : (p.stock < 5 ? '低庫存' : '充足') ]); this.downloadCSV(`庫存盤點表_${new Date().toISOString().slice(0,10)}`, headers, rows); } 
  exportToCSV() { const range = this.accountingRange(); const now = new Date(); let startDate: Date | null = null; if (range === 'today') startDate = new Date(now.setHours(0,0,0,0)); else if (range === 'week') startDate = new Date(now.setDate(now.getDate() - now.getDay())); else if (range === 'month') startDate = new Date(now.getFullYear(), now.getMonth(), 1); let list = this.accountingFilteredOrders(); const headers = ['訂單編號', '日期', '商品內容', '總營收', '商品成本', '預估利潤', '毛利率%']; const rows = list.map((o: Order) => { let cost = 0; o.items.forEach((i: CartItem) => { const p = this.store.products().find((x: Product) => x.id === i.productId); if (p) cost += ((p.localPrice * p.exchangeRate) + p.costMaterial + (p.weight * p.shippingCostPerKg)) * i.quantity; }); const profit = o.finalTotal - cost; return [ `\t${o.id}`, new Date(o.createdAt).toLocaleDateString(), o.items.map((i: CartItem) => `${i.productName} x${i.quantity}`).join('\n'), o.finalTotal, cost.toFixed(0), profit.toFixed(0), (o.finalTotal ? (profit / o.finalTotal * 100) : 0).toFixed(1) ]; }); this.downloadCSV(`銷售報表_明細_${range}_${new Date().toISOString().slice(0,10)}`, headers, rows); }

  exportProductsCSV() { 
     const headers = [ '貨號(註記用)', '表頭說明範例(A)', '商品名稱(B)', '分類(C)', '售價(D)', 'VIP價(E)', '當地原價(F)', '匯率(G)', '重量(H)', '國際運費/kg(I)', '額外成本(J)', '任選數量(K)', '優惠總價(L)', '圖片網址(M)', '規格(N)', '庫存(O)', '是否預購(P)', '是否上架(Q)', '自訂貨號SKU(R)', '備註介紹(S)', '【參考】單件成本', '【參考】一般單件毛利', '【參考】優惠單件毛利', '【參考】已售出' ]; 
     const rows = this.store.products().map((p: Product) => { 
        const cost = (p.localPrice * p.exchangeRate) + p.costMaterial + (p.weight * p.shippingCostPerKg); 
        const normalProfit = p.priceGeneral - cost; 
        const bulkProfit = (p.bulkDiscount?.count && p.bulkDiscount?.total) ? ((p.bulkDiscount.total / p.bulkDiscount.count) - cost).toFixed(0) : '無優惠'; 
        return [ p.code, '', p.name, p.category, p.priceGeneral, p.priceVip, p.localPrice, p.exchangeRate, p.weight, p.shippingCostPerKg, p.costMaterial, p.bulkDiscount?.count || '', p.bulkDiscount?.total || '', (p.images && p.images.length > 0) ? p.images.join(',') : p.image, p.options.join(','), p.stock, p.isPreorder ? 'TRUE' : 'FALSE', p.isListed ? 'TRUE' : 'FALSE', `\t${p.code}`, p.note || '', cost.toFixed(0), normalProfit.toFixed(0), bulkProfit, p.soldCount ]; 
     }); 
     this.downloadCSV(`商品總表_統一格式_${new Date().toISOString().slice(0,10)}`, headers, rows); 
  }

  openProductForm() { this.editingProduct.set(null); this.productForm.reset(); this.productForm.patchValue({ exchangeRate: 0.22, shippingCostPerKg: 200, weight: 0, costMaterial: 0, isPreorder: false, isListed: true, bulkCount: 0, bulkTotal: 0 }); this.tempImages.set([]); this.currentCategoryCode.set(''); this.generatedSkuPreview.set(''); this.formValues.set(this.productForm.getRawValue()); this.showProductModal.set(true); } 
  editProduct(p: Product) { this.editingProduct.set(p); this.productForm.patchValue({ ...p, optionsStr: p.options.join(', '), exchangeRate: p.exchangeRate || 0.22, shippingCostPerKg: p.shippingCostPerKg || 200, weight: p.weight || 0, costMaterial: p.costMaterial || 0, isPreorder: p.isPreorder ?? false, isListed: p.isListed ?? true, bulkCount: p.bulkDiscount?.count || 0, bulkTotal: p.bulkDiscount?.total || 0 }); this.tempImages.set(p.images && p.images.length > 0 ? p.images : (p.image ? [p.image] : [])); this.generatedSkuPreview.set(p.code); this.formValues.set(this.productForm.getRawValue()); this.showProductModal.set(true); } 
  closeProductModal() { this.showProductModal.set(false); } 
  onCategoryChange() { const cat = this.productForm.get('category')?.value; if (cat && !this.editingProduct()) { const codeMap = this.categoryCodes(); const foundCode = codeMap[cat] || ''; this.currentCategoryCode.set(foundCode); this.updateSkuPreview(foundCode); } } 
  onCodeInput(e: any) { const val = e.target.value.toUpperCase(); this.currentCategoryCode.set(val); if (!this.editingProduct()) { this.updateSkuPreview(val); } } 
  updateSkuPreview(prefix: string) { if (prefix) { const sku = this.store.generateProductCode(prefix); this.generatedSkuPreview.set(sku); this.productForm.patchValue({ code: sku }); } } 
  handleImageError(event: any) { event.target.src = 'https://placehold.co/100x100?text=Broken+Link'; } 
  addImageUrl(url: string) { if(!url || !url.trim()) return; const u = url.trim(); if (u.includes('flickr.com/photos/') && !u.match(/\.(jpg|jpeg|png|gif)$/i) && !u.includes('live.staticflickr.com')) { alert('⚠️ 注意：您貼上的是 Flickr「網頁」網址，不是「圖片」連結！\n\n請在圖片上按右鍵 -> 選擇「複製圖片位址」(Copy Image Address)。'); return; } this.tempImages.update(l => [...l, u]); } 
  handleFileSelect(event: any) { const files = event.target.files; if (files) { for (let i = 0; i < files.length; i++) { const file = files[i]; const reader = new FileReader(); reader.onload = (e: any) => { this.tempImages.update(l => [...l, e.target.result]); }; reader.readAsDataURL(file); } } } 
  removeImage(index: number) { this.tempImages.update(l => l.filter((_, i) => i !== index)); } 
  
  submitProduct() { 
     const val = this.productForm.value; 
     if (val.category) { const catName = val.category.trim(); this.store.addCategory(catName); if (this.currentCategoryCode()) { const newSettings = { ...this.store.settings() }; if (!newSettings.categoryCodes) newSettings.categoryCodes = {}; newSettings.categoryCodes[catName] = this.currentCategoryCode(); this.store.updateSettings(newSettings); } } 
     const finalImages = this.tempImages(); const mainImage = finalImages.length > 0 ? finalImages[0] : 'https://picsum.photos/300/300'; 
     const finalCode = this.editingProduct() ? val.code : (this.generatedSkuPreview() || val.code || this.store.generateNextProductCode()); 
     const bulkCount = Number(val.bulkCount) || 0; const bulkTotal = Number(val.bulkTotal) || 0; 
     const p: Product = { id: this.editingProduct()?.id || Date.now().toString(), code: finalCode, name: val.name, category: val.category, image: mainImage, images: finalImages, priceGeneral: val.priceGeneral, priceVip: val.priceVip, priceWholesale: 0, localPrice: val.localPrice, stock: val.isPreorder ? 99999 : val.stock, options: val.optionsStr ? val.optionsStr.split(',').map((s: string) => s.trim()) : [], note: val.note, exchangeRate: val.exchangeRate, costMaterial: val.costMaterial, weight: val.weight, shippingCostPerKg: val.shippingCostPerKg, priceType: 'normal', soldCount: this.editingProduct()?.soldCount || 0, country: 'Korea', allowPayment: { cash: true, bankTransfer: true, cod: true }, allowShipping: { meetup: true, myship: true, family: true, delivery: true }, isPreorder: val.isPreorder, isListed: val.isListed }; 
     if (bulkCount > 1 && bulkTotal > 0) { p.bulkDiscount = { count: bulkCount, total: bulkTotal }; } 
     if (this.editingProduct()) this.store.updateProduct(p); else this.store.addProduct(p); 
     this.closeProductModal(); 
  }

  editUser(u: User) { this.openUserModal(u); } 
  openUserModal(u: User) { this.editingUser.set(u); this.userForm.patchValue(u); this.showUserModal.set(true); } 
  closeUserModal() { this.showUserModal.set(false); this.editingUser.set(null); } 
  
  saveUser() { 
    if (this.userForm.valid && this.editingUser()) { 
      const formVals = this.userForm.value; 
      const updatedUser = { 
        ...this.editingUser()!, 
        ...formVals, 
        phone: formVals.phone ? formVals.phone.trim() : '', 
        name: formVals.name ? formVals.name.trim() : '', 
        totalSpend: Number(formVals.totalSpend) || 0, 
        credits: Number(formVals.credits) || 0 
      }; 
      this.store.updateUser(updatedUser); 
      this.closeUserModal(); 
      alert('會員資料已更新'); 
    } else { 
      alert('請檢查必填欄位'); 
    } 
  }

  renameCategory(oldName: string, newName: string) { this.store.renameCategory(oldName, newName); }
  deleteCategory(cat: string) { if(confirm(`確定要徹底刪除分類「${cat}」嗎？\n注意：這不會刪除該分類下的商品，但建議您將現有商品轉移至其他分類。`)) { this.store.removeCategory(cat); } }
  addNewCategory(name: string) { if(name.trim()) this.store.addCategory(name); }
  updateCategoryCode(cat: string, code: string) { const newCodes = { ...this.categoryCodes() }; newCodes[cat] = code.toUpperCase(); const s = { ...this.store.settings() }; s.categoryCodes = newCodes; this.store.updateSettings(s); }
  
  saveSettings() { 
    const val = this.settingsForm.value; 
    const currentSettings = this.store.settings(); 
    const settings: StoreSettings = { 
      birthdayGiftGeneral: val.birthdayGiftGeneral, 
      birthdayGiftVip: val.birthdayGiftVip, 
      categoryCodes: currentSettings.categoryCodes, 
      paymentMethods: { cash: val.enableCash, bankTransfer: val.enableBank, cod: val.enableCod }, 
      shipping: { 
        freeThreshold: val.shipping.freeThreshold, 
        methods: { 
          meetup: val.shipping.methods.meetup, 
          myship: val.shipping.methods.myship, 
          family: val.shipping.methods.family, 
          delivery: val.shipping.methods.delivery 
        } 
      } 
    }; 
    this.store.updateSettings(settings); 
    alert('設定已儲存'); 
  }
}