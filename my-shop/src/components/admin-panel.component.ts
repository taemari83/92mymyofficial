import { Component, inject, signal, computed, effect, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StoreService, Product, Order, User, StoreSettings, CartItem } from '../services/store.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="flex min-h-screen w-full bg-[#FDFBF9] font-sans relative">
      
      @if (!store.currentUser()?.isAdmin) {
        <div class="absolute top-0 left-0 right-0 bg-red-500 text-white p-2.5 text-center text-sm font-bold z-[100] shadow-md animate-pulse">
           ⚠️ 系統偵測：您目前「未登入」或「非管理員帳號」！請回前台登入管理員帳號，否則部分資料將受限。
        </div>
      }

     @if (isSidebarOpen()) {
        <div class="fixed inset-0 bg-black/40 z-[80] md:hidden backdrop-blur-sm transition-opacity" (click)="isSidebarOpen.set(false)"></div>
      }

      <aside class="fixed inset-y-0 left-0 z-[90] md:z-[30] w-64 bg-white border-r border-gray-100 flex flex-col shrink-0 shadow-2xl transform transition-transform duration-300 md:sticky md:top-0 md:h-screen md:translate-x-0 md:shadow-none" [class.-translate-x-full]="!isSidebarOpen()">        <div class="p-4 md:p-6 flex items-center gap-3 justify-center md:justify-start mt-6 md:mt-0">
          <div class="w-8 h-8 bg-brand-400 rounded-lg flex items-center justify-center text-white font-bold shrink-0">92</div>
        </div>

       <div class="flex-1 overflow-y-auto py-4 px-2 md:px-3 space-y-1">
          <div class="px-2 md:px-3 text-[10px] md:text-xs font-bold text-gray-400 mb-2 mt-2 text-center md:text-left">主要功能</div>
          <button (click)="activeTab.set('dashboard'); isSidebarOpen.set(false)" [class]="navClass('dashboard')"><span class="text-xl md:text-lg">🏠</span> <span class="inline">主控台</span></button>
          <button (click)="activeTab.set('orders'); isSidebarOpen.set(false)" [class]="navClass('orders')"><span class="text-xl md:text-lg relative">🛍️@if(pendingCount() > 0) {<span class="absolute -top-1 -right-1 md:hidden bg-red-400 text-white text-[8px] w-3 h-3 flex items-center justify-center rounded-full">{{ pendingCount() }}</span>}</span> <span class="inline">訂單管理</span>@if(pendingCount() > 0) {<span class="inline ml-auto bg-red-400 text-white text-[10px] px-1.5 py-0.5 rounded-full">{{ pendingCount() }}</span>}</button>
          <button (click)="activeTab.set('products'); isSidebarOpen.set(false)" [class]="navClass('products')"><span class="text-xl md:text-lg">📦</span> <span class="inline">商品管理</span></button>
          <button (click)="activeTab.set('customers'); isSidebarOpen.set(false)" [class]="navClass('customers')"><span class="text-xl md:text-lg">👥</span> <span class="inline">客戶管理</span></button>
          
          <div class="px-2 md:px-3 text-[10px] md:text-xs font-bold text-gray-400 mb-2 mt-6 text-center md:text-left">數據分析</div>
          <button (click)="activeTab.set('accounting'); isSidebarOpen.set(false)" [class]="navClass('accounting')"><span class="text-xl md:text-lg">📊</span> <span class="inline">銷售報表</span></button>
          <button (click)="activeTab.set('inventory'); isSidebarOpen.set(false)" [class]="navClass('inventory')"><span class="text-xl md:text-lg">🏭</span> <span class="inline">庫存管理</span></button>
          <button (click)="activeTab.set('purchases'); isSidebarOpen.set(false)" [class]="navClass('purchases')"><span class="text-xl md:text-lg">🧾</span> <span class="inline">採購總帳</span></button>
          
          <div class="px-2 md:px-3 text-[10px] md:text-xs font-bold text-gray-400 mb-2 mt-6 text-center md:text-left">資金與支出</div>
          <button (click)="activeTab.set('wallets'); isSidebarOpen.set(false)" [class]="navClass('wallets')"><span class="text-xl md:text-lg">👛</span> <span class="inline">資金帳戶</span></button>
          <button (click)="activeTab.set('expenses'); isSidebarOpen.set(false)" [class]="navClass('expenses')"><span class="text-xl md:text-lg">💸</span> <span class="inline">營業支出</span></button>
          
          <div class="px-2 md:px-3 text-[10px] md:text-xs font-bold text-gray-400 mb-2 mt-6 text-center md:text-left">設定</div>
          <button (click)="activeTab.set('settings'); isSidebarOpen.set(false)" [class]="navClass('settings')"><span class="text-xl md:text-lg">⚙️</span> <span class="inline">商店設定</span></button>
        </div>
        
        <div class="p-2 md:p-4 border-t border-gray-100">
           <div class="flex items-center gap-3 p-2 md:p-3 rounded-xl bg-brand-50/50 justify-center md:justify-start">
              <div class="w-8 h-8 rounded-full bg-brand-900 text-white flex items-center justify-center text-xs shrink-0">
                {{ store.currentUser()?.name?.charAt(0) || 'M' }}
              </div>
              <div class="text-sm block">
                 <div class="font-bold text-brand-900">{{ store.currentUser()?.name || '請登入' }}</div>
                 <div class="text-xs text-gray-400">{{ store.currentUser()?.isAdmin ? '管理員' : '訪客' }}</div>
              </div>
           </div>
        </div>
      </aside>

      <main class="flex-1 bg-[#FDFBF9] p-4 md:p-8 w-full relative min-w-0">
        <div class="flex justify-between items-center mb-6 pt-2 md:pt-0">
           <div class="flex items-center gap-3">
              <button (click)="isSidebarOpen.set(true)" class="md:hidden p-2 -ml-2 bg-white rounded-lg shadow-sm border border-gray-100 text-gray-600 hover:bg-gray-50 flex items-center justify-center h-10 w-10 shrink-0 transition-colors">
                 <span class="text-xl leading-none">☰</span>
              </button>
              <h2 class="text-2xl font-bold text-gray-800 whitespace-nowrap">{{ getTabTitle() }}</h2>
           </div>
          <div class="flex gap-2 items-center">
             <button (click)="showProcurementModal.set(true); procureRange.set('all');" class="relative px-4 py-2 bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-xl font-bold hover:bg-yellow-200 flex items-center justify-center gap-2 shadow-sm transition-colors whitespace-nowrap">
               @if(hasPendingProcurements()) { <span class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span> }
               <span class="text-lg leading-none mt-0.5">📦</span> <span class="hidden sm:block leading-none mt-0.5">叫貨</span>
             </button>
             <button (click)="forceRefresh()" class="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-brand-900 shadow-sm active:scale-95 transition-transform" title="強制重新整理">↻</button>
           </div>
         </div>

         @if (showProcurementModal()) {
          <div class="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-md flex flex-col justify-end animate-slide-up" (click)="showProcurementModal.set(false)">
            <div class="bg-gray-50 w-full h-[85vh] md:h-[90vh] rounded-t-[2rem] flex flex-col overflow-hidden shadow-2xl relative" (click)="$event.stopPropagation()">
              
              <div class="p-4 sm:p-6 border-b border-gray-200 bg-white sticky top-0 z-20 shadow-sm space-y-4 shrink-0">
                <div class="flex justify-between items-center">
                   <h2 class="text-xl font-bold text-brand-900 flex items-center gap-2"><span>📦</span> 即時叫貨總表</h2>
                   <div class="flex items-center gap-2 sm:gap-3">
                     <button (click)="exportProcurementCSV()" class="px-3 py-1.5 bg-brand-50 text-brand-700 border border-brand-200 rounded-lg text-xs font-bold hover:bg-brand-100 shadow-sm flex items-center gap-1 transition-colors"><span>📥</span></button>
                     <button (click)="syncProcurementToGoogleSheets()" class="px-3 py-1.5 bg-brand-900 text-white rounded-lg text-xs font-bold hover:bg-black shadow-sm flex items-center gap-1 transition-colors"><span>☁️</span></button>
                     <button (click)="showProcurementModal.set(false)" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold transition-colors shrink-0">✕</button>
                   </div>
                </div>
                
                <div class="flex flex-col gap-2">
                   <div class="flex flex-wrap items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-100">
                     <div class="flex gap-1 overflow-x-auto custom-scrollbar">
                       <button (click)="procureRange.set('all')" [class.bg-brand-900]="procureRange() === 'all'" [class.text-white]="procureRange() === 'all'" [class.text-gray-500]="procureRange() !== 'all'" class="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap">全部未買</button>
                       <button (click)="procureRange.set('today')" [class.bg-brand-900]="procureRange() === 'today'" [class.text-white]="procureRange() === 'today'" [class.text-gray-500]="procureRange() !== 'today'" class="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap">今日</button>
                       <button (click)="procureRange.set('yesterday')" [class.bg-brand-900]="procureRange() === 'yesterday'" [class.text-white]="procureRange() === 'yesterday'" [class.text-gray-500]="procureRange() !== 'yesterday'" class="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap">昨日</button>
                       <button (click)="procureRange.set('custom')" [class.bg-brand-900]="procureRange() === 'custom'" [class.text-white]="procureRange() === 'custom'" [class.text-gray-500]="procureRange() !== 'custom'" class="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap">自訂</button>
                     </div>
                     @if(procureRange() === 'custom') {
                        <div class="flex items-center gap-2 ml-auto w-full sm:w-auto mt-2 sm:mt-0">
                           <input type="date" [ngModel]="procureStart()" (ngModelChange)="procureStart.set($event)" class="bg-white border border-gray-200 rounded text-xs font-bold p-1.5 outline-none w-full sm:w-auto text-gray-600">
                           <span class="text-gray-400">-</span>
                           <input type="date" [ngModel]="procureEnd()" (ngModelChange)="procureEnd.set($event)" class="bg-white border border-gray-200 rounded text-xs font-bold p-1.5 outline-none w-full sm:w-auto text-gray-600">
                        </div>
                     }
                   </div>
                   
                   <div class="flex items-center justify-between gap-3 px-1">
                      <div class="flex items-center gap-2 flex-1 relative">
                         <span class="absolute left-3 text-gray-400 text-sm">🔍</span>
                         <input type="text" [ngModel]="procureSearch()" (ngModelChange)="procureSearch.set($event)" placeholder="搜尋商品名稱或分類..." class="w-full bg-white border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-sm font-bold text-gray-700 focus:outline-none focus:border-brand-400 shadow-sm">
                      </div>
                      <label class="flex items-center gap-2 cursor-pointer shrink-0 bg-white border border-gray-200 px-3 py-2 rounded-lg shadow-sm">
                         <input type="checkbox" [ngModel]="procureShowOnlyShort()" (ngModelChange)="procureShowOnlyShort.set($event)" class="rounded text-brand-600 w-4 h-4">
                         <span class="text-sm font-bold text-gray-600">只看缺貨</span>
                      </label>
                   </div>
                </div>
              </div>

              <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar pb-6 bg-gray-50">
                @for(group of groupedProcurementList(); track group.category) {
                   <div class="space-y-3">
                      <div class="flex items-center gap-2 sticky top-0 bg-gray-50/95 backdrop-blur z-10 py-2 border-b border-gray-200/50">
                         <span class="bg-brand-400 w-2 h-4 rounded-full"></span>
                         <h3 class="font-black text-gray-800 text-lg">{{ group.category }}</h3>
                         <span class="text-xs text-gray-400 font-mono bg-gray-200 px-2 py-0.5 rounded-full">{{ group.items.length }} 件</span>
                      </div>

                      @for(cargo of group.items; track cargo.productId + '||' + cargo.option) {
                         <div class="flex items-center gap-3 p-3 sm:p-4 rounded-2xl border transition-all" 
                              [class.bg-white]="cargo.procured < cargo.needed" [class.border-gray-200]="cargo.procured < cargo.needed" [class.shadow-sm]="cargo.procured < cargo.needed"
                              [class.bg-green-50]="cargo.procured >= cargo.needed" [class.border-green-200]="cargo.procured >= cargo.needed" [class.opacity-60]="cargo.procured >= cargo.needed">
                           <img [src]="cargo.image" (error)="handleImageError($event)" class="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-gray-100 shrink-0">
                           <div class="flex-1 min-w-0">
                             <h4 class="font-bold text-gray-800 text-sm sm:text-base truncate">{{ cargo.name }}</h4>
                             <div class="text-xs text-gray-500 mt-1 flex items-center gap-1">規格: <span class="font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">{{ cargo.option }}</span></div>
                             <div class="text-xs text-gray-400 mt-1 font-mono">已買 {{ cargo.procured }} / 總需 {{ cargo.needed }} <span class="ml-2 text-[10px] bg-brand-50 text-brand-600 px-1.5 py-0.5 rounded inline-block" title="包含的訂單日期">📅 {{ cargo.orderDatesStr }}</span></div>
                           </div>
                           <div class="flex items-center gap-2 shrink-0">
                             @if(cargo.procured >= cargo.needed) {
                               <div class="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-green-100 text-green-600 rounded-full text-xl sm:text-2xl font-bold">✅</div>
                               <button (click)="updateProcured(cargo, -1)" class="text-[10px] text-gray-400 underline ml-1">退回</button>
                             } @else {
                               <button (click)="updateProcured(cargo, -1)" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 font-bold active:bg-gray-200 text-lg">-</button>
                               <div class="flex flex-col items-center min-w-[2.5rem]">
                                 <span class="text-[10px] text-red-500 font-bold">還缺</span>
                                 <span class="text-xl font-black text-red-600 leading-none">{{ cargo.needed - cargo.procured }}</span>
                               </div>
                               <button (click)="updateProcured(cargo, 1)" class="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-brand-900 text-white font-bold text-2xl active:scale-90 transition-transform shadow-md">+</button>
                             }
                           </div>
                         </div>
                      }
                   </div>
                } @empty {
                  <div class="text-center py-20 flex flex-col items-center justify-center">
                    <span class="text-6xl mb-4">🎉</span>
                    <p class="text-gray-500 font-bold text-lg">目前沒有需要叫貨的商品！<br>訂單都買齊啦！</p>
                  </div>
                }
              </div>
              
              <div class="p-4 bg-white border-t border-gray-100 shrink-0 shadow-[0_-4px_15px_rgba(0,0,0,0.03)] z-20">
                 <button (click)="generatePurchaseDraft()" class="w-full py-3.5 bg-gray-800 text-white rounded-xl font-bold shadow-lg hover:bg-black transition-colors flex items-center justify-center gap-2 active:scale-[0.98]">
                    <span class="text-xl">🧾</span> 結算今日已叫貨 (建立採購草稿單)
                 </button>
              </div>

            </div>
          </div>
        }

        @if (activeTab() === 'dashboard') {
          <div class="space-y-8 w-full overflow-x-hidden">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              
              <div class="bg-brand-900 text-white rounded-[2rem] p-8 shadow-xl relative overflow-hidden group w-full">
                <div class="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div class="relative z-10">
                  <div class="flex items-center gap-2 text-white/60 text-sm font-bold uppercase tracking-widest mb-2"><span>📅 今日營業額</span></div>
                  <div class="text-3xl sm:text-4xl xl:text-5xl font-black tracking-tight break-words whitespace-normal leading-tight" [title]="'NT$ ' + (dashboardMetrics().todayRevenue | number)">NT$ {{ dashboardMetrics().todayRevenue | number }}</div>
                  <div class="mt-4 text-sm text-white/50">截至目前為止</div>
                </div>
              </div>

              <div class="bg-white rounded-[2rem] p-8 shadow-sm border border-brand-100 flex flex-col justify-center w-full relative z-40">
               <div class="text-gray-500 text-sm font-bold uppercase tracking-widest mb-2 relative group cursor-help w-fit">
               <div class="flex items-center gap-1">本月銷售總額 <span class="w-3.5 h-3.5 rounded-full border border-gray-500 flex items-center justify-center text-[9px] opacity-70">?</span></div>
               <div class="text-gray-400 text-[10px] opacity-70 mt-1 leading-none normal-case">(含員購)</div>
                 <div class="absolute top-full left-0 mt-2 w-56 bg-gray-800 text-white text-[10px] p-3 rounded-xl shadow-xl hidden group-hover:block font-normal normal-case tracking-normal leading-relaxed z-[100]">
                  這個月從 1 號到今天，客人總共貢獻了多少業績。
                   <span class="opacity-50 font-mono text-[9px] mt-1.5 block pt-1.5 border-t border-gray-600">公式：本月所有有效訂單的 (最終結帳金額) 加總。</span>
                 </div>
               </div>
               <div class="text-2xl sm:text-3xl xl:text-4xl font-bold text-gray-800 break-words whitespace-normal leading-tight mt-1" [title]="'NT$ ' + (dashboardMetrics().monthSales | number)">
                NT$ {{ dashboardMetrics().monthSales | number }}
               </div>
              </div>

              <div class="bg-[#F0F7F4] rounded-[2rem] p-8 shadow-sm border border-[#E1EFE8] flex flex-col justify-center w-full relative z-50">
               <div class="text-[#5A8C74] text-sm font-bold uppercase tracking-widest mb-2 relative group cursor-help w-fit">
                 <div class="flex items-center gap-1">本月預估利潤 <span class="w-3.5 h-3.5 rounded-full border border-[#5A8C74] flex items-center justify-center text-[9px] opacity-70">?</span></div>
                 <div class="absolute top-full left-0 mt-2 w-56 bg-gray-800 text-white text-[10px] p-3 rounded-xl shadow-xl hidden group-hover:block font-normal normal-case tracking-normal leading-relaxed z-[100]">
                  扣掉進貨成本跟公司的營業雜支後，這個月「粗估」賺了多少錢。
                  <span class="opacity-50 font-mono text-[9px] mt-1.5 block pt-1.5 border-t border-gray-600">公式：本月銷售總額 - 本月商品總成本 - 本月營業雜支。</span>
                 </div>
               </div>
               <div class="text-2xl sm:text-3xl xl:text-4xl font-bold text-[#2D5B46] break-words whitespace-normal leading-tight mt-1" [title]="'NT$ ' + (dashboardMetrics().monthProfit | number)">
                 NT$ {{ dashboardMetrics().monthProfit | number:'1.0-0' }}
               </div>
               <div class="mt-2 text-xs text-[#5A8C74]">已扣除商品成本</div>
              </div>

            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 overflow-x-auto pb-2 w-full custom-scrollbar">
              <div (click)="goToOrders('verifying')" class="bg-white p-6 rounded-[1.5rem] border border-yellow-100 shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-yellow-50 hover:scale-105 transition-all cursor-pointer group min-w-[140px]"><div class="w-12 h-12 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center text-xl mb-1 group-hover:bg-yellow-200">📝</div><div class="text-2xl md:text-3xl font-black text-yellow-600">{{ dashboardMetrics().toConfirm }}</div><div class="text-sm font-bold text-yellow-800 whitespace-nowrap">未對帳訂單</div></div>
              <div (click)="goToOrders('shipping')" class="bg-white p-6 rounded-[1.5rem] border border-green-100 shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-green-50 hover:scale-105 transition-all cursor-pointer group min-w-[140px]"><div class="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xl mb-1 group-hover:bg-green-200">💰</div><div class="text-2xl md:text-3xl font-black text-green-600">{{ dashboardMetrics().toShip }}</div><div class="text-sm font-bold text-green-800 whitespace-nowrap">已付款/待出貨</div></div>
              <div (click)="goToOrders('pending')" class="bg-white p-6 rounded-[1.5rem] border border-gray-200 shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-gray-50 hover:scale-105 transition-all cursor-pointer group min-w-[140px]"><div class="w-12 h-12 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xl mb-1 group-hover:bg-gray-200">⚠️</div><div class="text-2xl md:text-3xl font-black text-gray-500">{{ dashboardMetrics().unpaid }}</div><div class="text-sm font-bold text-gray-600 whitespace-nowrap">未付款</div></div>
              <div (click)="goToOrders('refund')" class="bg-white p-6 rounded-[1.5rem] border border-red-100 shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-red-50 hover:scale-105 transition-all cursor-pointer group min-w-[140px]"><div class="w-12 h-12 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-xl mb-1 group-hover:bg-red-200">⚡️</div><div class="text-2xl md:text-3xl font-black text-red-500">{{ dashboardMetrics().processing }}</div><div class="text-sm font-bold text-red-800 whitespace-nowrap">待處理 / 退款</div></div>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full mb-6">
               <div class="lg:col-span-2 space-y-4">
                  <h3 class="text-lg font-bold text-gray-700 px-2">⚡️ 快捷操作</h3>
                  <div class="grid grid-cols-3 gap-4 h-full">
                     <button (click)="openProductForm()" class="bg-white hover:bg-brand-50 border border-gray-200 hover:border-brand-200 p-4 rounded-2xl transition-all text-center group shadow-sm flex flex-col items-center justify-center h-32"><div class="w-10 h-10 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center text-xl mb-2 group-hover:scale-110 transition-transform">+</div><div class="font-bold text-gray-800 text-sm">新增商品</div></button>
                     <button (click)="activeTab.set('inventory')" class="bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-200 p-4 rounded-2xl transition-all text-center group shadow-sm flex flex-col items-center justify-center h-32"><div class="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl mb-2 group-hover:scale-110 transition-transform">🏭</div><div class="font-bold text-gray-800 text-sm">庫存查詢</div></button>
                     <button (click)="activeTab.set('settings'); openPromoForm()" class="bg-white hover:bg-pink-50 border border-gray-200 hover:border-pink-200 p-4 rounded-2xl transition-all text-center group shadow-sm flex flex-col items-center justify-center h-32"><div class="w-10 h-10 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-xl mb-2 group-hover:scale-110 transition-transform">🎟️</div><div class="font-bold text-gray-800 text-sm">折扣碼設定</div></button>
                  </div>
               </div>

               <div class="lg:col-span-1 space-y-4">
                  <h3 class="text-lg font-bold text-gray-700 px-2">🚨 系統通知</h3>
                  @if(lowStockAlerts().length > 0) {
                     <div class="bg-red-50/80 rounded-2xl p-4 border border-red-100 shadow-sm relative overflow-hidden h-32 flex flex-col justify-center animate-fade-in">
                        <div class="absolute -right-2 -top-2 text-6xl opacity-10 pointer-events-none">🚨</div>
                        <h3 class="text-red-800 font-bold text-base mb-2 flex items-center gap-2 relative z-10">
                           現貨告急 
                           <span class="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{{ lowStockAlerts().length }}</span>
                        </h3>
                        <button (click)="activeTab.set('inventory')" class="w-full mt-2 py-2 bg-red-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-red-700 transition-colors active:scale-95 relative z-10 flex justify-center items-center gap-1">
                           <span></span> 前往庫存盤點
                        </button>
                     </div>
                  } @else {
                     <div class="bg-green-50/80 rounded-2xl p-4 border border-green-100 shadow-sm flex flex-col items-center justify-center h-32">
                        <div class="text-3xl mb-1">✅</div>
                        <div class="text-green-800 font-bold text-sm">現貨庫存充足</div>
                     </div>
                  }
               </div>
            </div>

            <div class="grid grid-cols-1 w-full">
               <div class="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-50 w-full">
                 <div class="flex items-center justify-between mb-6">
                    <h3 class="font-bold text-xl text-gray-800 whitespace-nowrap">🔥 熱銷商品排行</h3>
                    <button (click)="activeTab.set('accounting')" class="text-xs text-brand-600 hover:underline whitespace-nowrap">查看完整報表</button>
                 </div>
                 <div class="space-y-4">
                    @for (p of topProducts(); track p.id; let i = $index) {
                       <div class="flex items-center gap-4 p-3 hover:bg-brand-50/50 rounded-2xl transition-colors group cursor-pointer" (click)="editProduct(p)">
                          <div class="w-10 flex-shrink-0 flex items-center justify-center">@if(i === 0) { <span class="text-3xl">🥇</span> }@else if(i === 1) { <span class="text-3xl">🥈</span> }@else if(i === 2) { <span class="text-3xl">🥉</span> }@else { <span class="text-xl font-bold text-gray-300 font-mono italic">#{{ i + 1 }}</span> }</div>
                          <div class="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden shadow-sm border border-gray-100 relative shrink-0"><img [src]="p.image" (error)="handleImageError($event)" class="w-full h-full object-cover"></div>
                          <div class="flex-1 min-w-0"><h4 class="font-bold text-gray-800 truncate group-hover:text-brand-900">{{ p.name }}</h4><div class="flex gap-2 text-xs mt-0.5"><span class="text-gray-400 whitespace-nowrap">{{ p.category }}</span></div></div>
                          <div class="text-right shrink-0"><div class="font-bold text-brand-900 text-lg">{{ p.soldCount }} <span class="text-xs text-gray-400 font-normal">已售</span></div><div class="text-xs text-gray-400">NT$ {{ p.priceGeneral * (p.soldCount || 0) | number }}</div></div>
                       </div>
                    }
                 </div>
               </div>
            </div>
          </div>
        }

        @if (activeTab() === 'orders') {
          <div class="space-y-6 w-full">
            <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 overflow-hidden w-full">
               
<div class="flex flex-col xl:flex-row justify-between gap-4 mb-6 border-b border-gray-100 pb-4">
                 <div class="flex flex-wrap items-center gap-2">
                   <div class="flex gap-1 bg-gray-50 p-1 rounded-xl">
                     @for(range of ['今日', '本週', '本月', '全部']; track range) { 
                       <button (click)="setOrderRange(range)" 
                               [class.text-brand-900]="statsRange() === range" 
                               [class.bg-white]="statsRange() === range" 
                               [class.shadow-sm]="statsRange() === range" 
                               class="px-4 py-1.5 rounded-lg text-sm font-bold border border-transparent text-gray-500 transition-all whitespace-nowrap">
                          {{ range }}
                       </button> 
                     }
                   </div>
                   <div class="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
                      <span class="text-xs text-gray-400 font-bold whitespace-nowrap">自訂:</span>
                      <input type="date" [ngModel]="orderStart()" (ngModelChange)="orderStart.set($event); statsRange.set('自訂')" class="bg-transparent text-sm font-bold text-gray-700 outline-none w-32">
                      <span class="text-gray-300">-</span>
                      <input type="date" [ngModel]="orderEnd()" (ngModelChange)="orderEnd.set($event); statsRange.set('自訂')" class="bg-transparent text-sm font-bold text-gray-700 outline-none w-32">
                   </div>
                 </div>
                 
<div class="flex flex-wrap items-center gap-2 xl:ml-auto">
                    <span class="hidden lg:block text-xs text-gray-400 font-bold mr-2">📅 {{ now | date:'yyyy/MM/dd' }}</span>
                    <button (click)="openGiveawayModal()" class="flex-1 sm:flex-none px-4 py-2 bg-[#C0AEE1] text-white rounded-xl font-bold shadow-sm hover:bg-[#A992D3] flex items-center justify-center gap-1 whitespace-nowrap transition-colors"><span>🎁</span> 抽獎單</button>
                    <button (click)="exportOrdersCSV()" class="flex-1 sm:flex-none px-4 py-2 bg-[#8FA996] text-white rounded-xl font-bold shadow-sm hover:bg-[#7a9180] flex items-center justify-center gap-1 whitespace-nowrap transition-colors"><span>📥</span> 匯出</button>
                    <button (click)="syncOrdersToGoogleSheets()" class="flex-1 sm:flex-none px-4 py-2 bg-[#E5B5B5] text-white rounded-xl font-bold shadow-sm hover:bg-[#D4A0A0] flex items-center justify-center gap-1 whitespace-nowrap transition-colors"><span>☁️</span> 同步</button>
                    <label class="flex-1 sm:flex-none px-4 py-2 bg-[#F39C12] text-white rounded-xl font-bold shadow-sm hover:bg-[#E67E22] flex items-center justify-center gap-1 whitespace-nowrap transition-colors cursor-pointer active:scale-95">
                       <span>🚚</span> 匯入賣貨便對單
                       <input type="file" accept=".csv" class="hidden" (change)="handleMyshipImport($event)">
                    </label>
                    </div>
               </div>
               
             <div class="flex flex-col gap-4 mb-4 w-full">
                <div class="relative w-full">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>                  <input type="text" [(ngModel)]="orderSearch" placeholder="搜尋訂單編號、客戶名稱..." class="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-200">
                </div>
    <div class="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm w-full flex-wrap">
  @for(tab of orderTabs; track tab.id) { 
    <button (click)="orderStatusTab.set(tab.id)" 
            [class.bg-brand-900]="orderStatusTab() === tab.id" 
            [class.text-white]="orderStatusTab() === tab.id" 
            [class.text-gray-600]="orderStatusTab() !== tab.id" 
            class="flex-1 px-2 py-2 sm:px-4 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap transition-all flex items-center justify-center gap-1.5">
       {{ tab.label }}
       <span [class.bg-white]="orderStatusTab() === tab.id" 
             [class.text-brand-900]="orderStatusTab() === tab.id" 
             [class.bg-gray-100]="orderStatusTab() !== tab.id" 
             [class.text-gray-500]="orderStatusTab() !== tab.id" 
             class="text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-sm">
          {{ $any(orderCounts())[tab.id] || 0 }}
       </span>
    </button> 
  }
  </div>
</div>
               
               <div class="overflow-x-auto w-full custom-scrollbar pb-4 max-h-[65vh] overflow-y-auto relative">
                 <table class="w-full text-sm text-left whitespace-nowrap block md:table">
                   <thead class="text-gray-500 font-medium hidden md:table-header-group sticky top-0 z-[40] shadow-sm">
                     <tr class="bg-[#F9FAFB] border-b border-gray-200">
                       <th class="p-4 sticky left-0 top-0 z-[50] bg-[#F9FAFB] shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">商品 訂單資訊</th>
                       <th class="p-4 bg-[#F9FAFB]">客戶</th>
                       <th class="p-4 bg-[#F9FAFB]">付款方式</th>
                       <th class="p-4 bg-[#F9FAFB]">金額</th>
                       <th class="p-4 bg-[#F9FAFB]">匯款狀態</th>
                       <th class="p-4 bg-[#F9FAFB]">物流狀態</th>
                       <th class="p-4 bg-[#F9FAFB]">時間</th>
                       <th class="p-4 text-right bg-[#F9FAFB]">操作</th>
                     </tr>
                   </thead>
                   <tbody class="block md:table-row-group divide-y-0 md:divide-y md:divide-gray-200">
                     @for(order of paginatedOrders(); track order.id) {
                       <tr class="hover:bg-[#F0F7FF] transition-colors group flex flex-col md:table-row border border-gray-200 md:border-none rounded-2xl md:rounded-none mb-4 md:mb-0 bg-white md:even:bg-[#F8FAFC] shadow-sm md:shadow-none overflow-hidden">
                         
                         <td class="p-4 bg-gray-50/50 md:bg-white group-even:md:bg-[#F8FAFC] group-hover:md:bg-[#F0F7FF] md:sticky md:left-0 z-10 md:shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] transition-colors block md:table-cell border-b md:border-none border-gray-200">
                           <div class="flex gap-3 items-start min-w-[200px]">
                             <div class="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-100 mt-1">
                               @if((order.items || []).length > 0) { <img [src]="getThumb(order)" (error)="handleImageError($event)" class="w-full h-full object-cover"> }
                             </div>
                             <div class="flex-1 min-w-0">
                               <div class="flex items-center gap-2 mb-1">
                                 <span class="font-bold text-gray-800 font-mono text-base md:text-sm">#{{ order.id }}</span>
                                 @if(order.paymentName) { <span class="w-2 h-2 rounded-full bg-blue-500" title="已回報匯款"></span> }
                               </div>
                              <div class="flex flex-col gap-1.5 mt-1">
                               @for(item of (order.items || []); track item.productId + item.option) {
                                 <div class="text-[11px] text-gray-600 whitespace-normal break-all leading-snug flex items-start gap-1 text-left">
                                   <span class="mt-0.5 shrink-0">•</span>
                                   <span class="flex-1">{{ item.productName }} <span class="opacity-70">({{ item.option }})</span> <span class="font-bold text-brand-900 ml-1">x{{ item.quantity }}</span></span>
                                 </div>
                               }
                             </div>
                             </div>
                           </div>
                         </td>
                         
                         <td class="p-4 flex items-center justify-between md:table-cell border-b md:border-none border-gray-100">
                           <span class="md:hidden text-[10px] text-gray-400 font-bold uppercase tracking-wider">客戶</span>
                           <div class="text-right md:text-left"><span class="font-medium text-gray-800">{{ getUserName(order.userId) }}</span></div>
                         </td>
                         
                         <td class="p-4 flex items-center justify-between md:table-cell border-b md:border-none border-gray-100">
                           <span class="md:hidden text-[10px] text-gray-400 font-bold uppercase tracking-wider">付款方式</span>
                           <div class="text-right md:text-left">
                             @if(order.paymentMethod === 'bank_transfer') { <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">轉帳</span> }@else if(order.paymentMethod === 'cod') { <span class="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-bold">🚚 貨到付款</span> }@else { <span class="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">💵 現金</span> }
                           </div>
                         </td>
                         
                         <td class="p-4 flex items-center justify-between md:table-cell border-b md:border-none border-gray-100 font-bold text-brand-600">
                           <span class="md:hidden text-[10px] text-gray-400 font-bold uppercase tracking-wider">總金額</span>
                           <div class="text-right md:text-left text-lg md:text-sm">NT$ {{ order.finalTotal | number }}</div>
                         </td>
                         
                         <td class="p-4 flex items-center justify-between md:table-cell border-b md:border-none border-gray-100 whitespace-nowrap">
  <span class="md:hidden text-[10px] text-gray-400 font-bold uppercase tracking-wider">匯款狀態</span>
  <div class="flex flex-col gap-1.5 items-end md:items-start">
    <span [class]="getPaymentStatusClass(order.status)" class="px-2.5 py-1 rounded-md text-xs font-bold w-fit">{{ getPaymentStatusLabel(order.status, order.paymentMethod) }}</span>
    
    @if(order.paymentLast5) { 
      <div class="bg-blue-50 px-2.5 py-1.5 rounded-md border border-blue-100 flex flex-col gap-0.5 shadow-sm mt-0.5">
         <div class="text-[13px] text-blue-800 font-mono font-black flex items-center gap-1" title="匯款後五碼">
            <span>{{ order.paymentLast5 }}</span>
         </div>
         @if(order.paymentName) { <div class="text-[10px] text-blue-600 font-bold">{{ order.paymentName }}</div> }
      </div>
    }
  </div>
</td>
                         
                         <td class="p-4 flex items-center justify-between md:table-cell border-b md:border-none border-gray-100 whitespace-nowrap">
                            <span class="md:hidden text-[10px] text-gray-400 font-bold uppercase tracking-wider">物流狀態</span>
                            <div class="text-right md:text-left flex flex-col gap-1.5 items-end md:items-start">
                               <span [class]="getShippingStatusClass(order.status)" class="px-2.5 py-1 rounded-md text-xs font-bold w-fit shadow-sm">{{ getShippingStatusLabel(order.status) }}</span>
                               @if(order.shippingLink) {
                                  <span class="text-[11px] text-[#E67E22] font-mono font-bold bg-orange-50 px-2 py-0.5 rounded border border-orange-100 shadow-sm">{{ order.shippingLink }}</span>
                               }
                            </div>
                         </td>
                         
                         <td class="p-4 flex items-center justify-between md:table-cell border-b md:border-none border-gray-100 text-gray-400 text-xs">
                           <span class="md:hidden text-[10px] text-gray-400 font-bold uppercase tracking-wider">下單時間</span>
                           <div class="text-right md:text-left">{{ timeAgo(order.createdAt) }}</div>
                         </td>
                         
                         <td class="p-4 flex items-center justify-end md:table-cell text-right bg-gray-50/50 md:bg-transparent rounded-b-2xl md:rounded-none">
                           <div class="flex items-center justify-end gap-2">
                             @if (order.status === 'paid_verifying') { <button (click)="quickConfirm($event, order)" class="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-bold whitespace-nowrap">✅ 確認</button> } 
                             @else if (order.status === 'payment_confirmed' || order.status === 'pending_shipping') { <button (click)="quickShip($event, order)" class="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold whitespace-nowrap shadow-sm transition-colors hover:bg-blue-200">📦 出貨</button> }
                             @else if (order.status === 'shipped' && order.paymentMethod === 'cod') { <button (click)="quickComplete($event, order)" class="px-3 py-1.5 bg-green-800 text-white rounded-lg text-xs font-bold whitespace-nowrap">💰 確認收款</button> }
                             @else if (order.status === 'refund_needed') { <button (click)="quickRefundDone($event, order)" class="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-bold whitespace-nowrap">💸 已退款</button> }
                             <button (click)="openAction($event, order)" class="p-2 hover:bg-white/50 rounded-lg text-gray-500 shadow-sm border border-gray-200 md:border-transparent md:bg-transparent bg-white transition-colors">•••</button>
                           </div>
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
          <div class="space-y-6 w-full"> 
            
            <div class="bg-white p-5 sm:p-6 rounded-[2rem] shadow-sm border border-gray-50 flex flex-col gap-4 w-full"> 
              
              <div class="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                 <div class="flex items-center gap-2 bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
                    <button (click)="productStatusFilter.set('active')" [class.bg-white]="productStatusFilter() === 'active'" [class.text-brand-900]="productStatusFilter() === 'active'" [class.shadow-sm]="productStatusFilter() === 'active'" class="flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold text-gray-500 transition-all">🟢 上架中</button>
                    <button (click)="productStatusFilter.set('inactive')" [class.bg-white]="productStatusFilter() === 'inactive'" [class.text-gray-900]="productStatusFilter() === 'inactive'" [class.shadow-sm]="productStatusFilter() === 'inactive'" class="flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold text-gray-500 transition-all">⚫️ 已下架</button>
                 </div>
                 
                 <div class="hidden sm:flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200 shadow-inner">
                    <button (click)="productViewMode.set('list')" title="條列" [class.bg-white]="productViewMode() === 'list'" [class.shadow-sm]="productViewMode() === 'list'" [class.text-brand-900]="productViewMode() === 'list'" [class.text-gray-400]="productViewMode() !== 'list'" class="px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center"><span class="text-lg">≣</span></button>
                    <button (click)="productViewMode.set('grid')" title="宮格" [class.bg-white]="productViewMode() === 'grid'" [class.shadow-sm]="productViewMode() === 'grid'" [class.text-brand-900]="productViewMode() === 'grid'" [class.text-gray-400]="productViewMode() !== 'grid'" class="px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center"><span class="text-lg">⊞</span></button>
                 </div>
              </div> 

              <div class="flex flex-wrap items-center gap-3 w-full mt-2">
                <div class="bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200 flex items-center shadow-sm w-full sm:w-[260px] shrink-0 transition-colors focus-within:border-brand-300 focus-within:bg-white">
                  <span class="text-gray-400 mr-2 text-lg">🔍</span>
                  <input type="text" [(ngModel)]="productSearch" placeholder="搜名稱、貨號或 #標籤..." class="w-full outline-none bg-transparent text-sm font-medium text-gray-700 placeholder-gray-400">
                </div>

                <select 
                  [ngModel]="productCategoryFilter()" 
                  (ngModelChange)="productCategoryFilter.set($event); productSubCategoryFilter.set('all')"
                  class="w-full sm:w-auto min-w-[150px] bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm outline-none focus:border-brand-300 text-sm font-bold text-gray-700 cursor-pointer appearance-none shrink-0"
                >
                  <option value="all">全部主分類</option>
                  @for(c of store.categories(); track c) { <option [value]="c">{{ c }}</option> }
                </select>

                @if(productCategoryFilter() !== 'all' && adminSubCategories().length > 0) {
                  <select 
                    [ngModel]="productSubCategoryFilter()" 
                    (ngModelChange)="productSubCategoryFilter.set($event)"
                    class="w-full sm:w-auto min-w-[150px] bg-brand-50 px-4 py-2.5 rounded-xl border border-brand-200 shadow-sm outline-none focus:border-brand-300 text-sm font-bold text-brand-800 cursor-pointer appearance-none animate-fade-in shrink-0"
                  >
                    <option value="all">全部次分類</option>
                    @for(sub of adminSubCategories(); track sub) { <option [value]="sub">{{ sub }}</option> }
                  </select>
                }
              </div>

              <div class="flex flex-wrap items-center justify-between gap-3 w-full pt-4 border-t border-gray-100">
                <div class="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <div class="flex w-full sm:w-auto gap-2">
                    <button (click)="exportProductsCSV()" class="flex-1 sm:flex-none px-4 py-2.5 bg-[#8FA996] text-white border border-transparent rounded-xl font-bold hover:bg-[#7a9180] shadow-sm flex items-center justify-center gap-1 whitespace-nowrap transition-colors"><span>📥</span> 匯出</button>
                    <button (click)="syncProductsToGoogleSheets()" class="flex-1 sm:flex-none px-4 py-2.5 bg-[#E5B5B5] text-white border border-transparent rounded-xl font-bold hover:bg-[#D4A0A0] shadow-sm flex items-center justify-center gap-1 whitespace-nowrap transition-colors"><span>☁️</span> 同步</button>
                    <button (click)="openTrashModal()" class="flex-1 sm:flex-none px-4 py-2.5 bg-gray-100 text-gray-600 border border-transparent rounded-xl font-bold hover:bg-gray-200 shadow-sm flex items-center justify-center gap-1 whitespace-nowrap transition-colors relative">
                      <span>🗑️</span> 回收站 
                      @if(deletedProducts().length > 0) { <span class="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full shadow-sm animate-pulse">{{ deletedProducts().length }}</span> }
                    </button>
                  </div>
                  <label class="w-full sm:w-auto px-5 py-2.5 bg-white border border-gray-200 text-brand-900 rounded-xl font-bold shadow-sm hover:bg-gray-50 cursor-pointer transition-colors hover:shadow-md flex items-center justify-center gap-2 whitespace-nowrap shrink-0"> 
                    <span class="text-lg"></span> <span class="text-sm">批量新增</span> 
                    <input type="file" (change)="handleBatchImport($event)" class="hidden" accept=".csv"> 
                  </label> 
                  <button (click)="openProductForm()" class="w-full sm:w-auto px-6 py-2.5 bg-brand-900 text-white rounded-xl flex items-center justify-center font-bold shadow-lg hover:bg-brand-800 transition-colors shrink-0 gap-2"> 
                    <span class="text-lg">+</span> 新增商品
                  </button> 
                </div>
                
                <div class="flex sm:hidden items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200 shadow-inner w-full mt-2">
                    <button (click)="productViewMode.set('list')" [class.bg-white]="productViewMode() === 'list'" [class.shadow-sm]="productViewMode() === 'list'" [class.text-brand-900]="productViewMode() === 'list'" [class.text-gray-400]="productViewMode() !== 'list'" class="flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all"><span class="text-lg">≣</span> 條列</button>
                    <button (click)="productViewMode.set('grid')" [class.bg-white]="productViewMode() === 'grid'" [class.shadow-sm]="productViewMode() === 'grid'" [class.text-brand-900]="productViewMode() === 'grid'" [class.text-gray-400]="productViewMode() !== 'grid'" class="flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all"><span class="text-lg">⊞</span> 宮格</button>
                </div>
              </div>
            </div> 
            
            @if(productViewMode() === 'list') {
              <div class="grid grid-cols-1 gap-4 w-full"> 
                @for (p of filteredAdminProducts(); track p.id) { 
                  <div class="bg-white rounded-[1.5rem] p-4 flex items-center gap-5 hover:shadow-md transition-all border border-transparent hover:border-brand-100 group w-full"> 
                     <div class="w-20 h-20 rounded-xl overflow-hidden bg-white flex-shrink-0 relative border border-gray-100"> 
                        <img [src]="p.image" (error)="handleImageError($event)" referrerpolicy="no-referrer" class="w-full h-full object-contain mix-blend-multiply p-1"> 
                        <div class="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center font-mono py-0.5"> {{ p.code }} </div> 
                     </div>
                     <div class="flex-1 min-w-0"> 
                        <div class="flex justify-between items-start gap-4"> 
                           <div class="flex-1 min-w-0"> 
                              <div class="flex items-center gap-2 mb-1 flex-wrap"> 
                                 <span class="text-xs text-brand-400 font-bold tracking-wider uppercase whitespace-nowrap">{{ p.category }}</span> 
                                 @if($any(p).subCategory) { <span class="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap">{{ $any(p).subCategory }}</span> }
                                 @if($any(p).tags) {
                                   @for(tag of $any(p).tags; track tag) { <span class="bg-brand-50 text-brand-600 text-[10px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap">#{{ tag }}</span> }
                                 }
                                 @if(p.isPreorder) { <span class="bg-blue-100 text-blue-600 text-[10px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap">預購</span> }
                                 @if(!p.isListed) { <span class="bg-gray-200 text-gray-500 text-[10px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap">未上架</span> }
                                 @if($any(p).isHidden) { <span class="bg-purple-100 text-purple-600 text-[10px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap">隱形賣場</span> }
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
                           <div class="text-xs text-gray-400 truncate"> {{ (p.options || []).join(', ') }} </div> 
                           <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pl-2"> 
                               @if(!p.isListed) {
                                  <button (click)="toggleProductStatus(p, $event)" class="px-4 py-1.5 rounded-full bg-green-50 text-xs font-bold text-green-600 hover:bg-green-100 whitespace-nowrap transition-colors shadow-sm border border-green-200">🟢 重新上架</button>
                               } @else {
                                  <button (click)="toggleProductStatus(p, $event)" class="px-4 py-1.5 rounded-full bg-gray-100 text-xs font-bold text-gray-600 hover:bg-gray-200 whitespace-nowrap transition-colors shadow-sm border border-gray-200">⚫️ 暫時下架</button>
                               }
                               <button (click)="editProduct(p)" class="px-4 py-1.5 rounded-full bg-brand-50 text-xs font-bold text-brand-700 hover:bg-brand-100 whitespace-nowrap transition-colors shadow-sm border border-brand-200">✏️ 編輯</button> 
                            </div>
                        </div> 
                     </div> 
                  </div> 
                } @empty {
                  <div class="text-center py-10 text-gray-400 font-bold">目前無符合條件的商品。</div>
                }
              </div> 
            } @else {
              <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 w-full">
                @for (p of filteredAdminProducts(); track p.id) {
                  <div class="bg-white rounded-[1.5rem] p-3 flex flex-col hover:shadow-md transition-all border border-transparent hover:border-brand-100 group w-full">
                     <div class="w-full aspect-square rounded-xl overflow-hidden bg-white relative mb-3 border border-gray-100">
                        <img [src]="p.image" (error)="handleImageError($event)" referrerpolicy="no-referrer" class="w-full h-full object-contain mix-blend-multiply p-2">
                        <div class="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center font-mono py-1"> {{ p.code }} </div>
                        <div class="absolute top-2 left-2 flex flex-col gap-1 z-10">
                           @if(p.isPreorder) { <span class="bg-blue-100 text-blue-600 text-[10px] px-1.5 py-0.5 rounded font-bold shadow-sm w-fit">預購</span> }
                           @if(!p.isListed) { <span class="bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded font-bold shadow-sm w-fit">未上架</span> }
                           @if($any(p).isHidden) { <span class="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded font-bold shadow-sm border border-purple-200 w-fit">隱形賣場</span> }
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
                              @if(!p.isListed) {
                                 <button (click)="toggleProductStatus(p, $event)" class="px-3 h-8 rounded-full bg-green-50 text-green-600 text-xs font-bold flex items-center justify-center hover:bg-green-100 transition-colors shadow-sm border border-green-200" title="重新上架">上架</button>
                              } @else {
                                 <button (click)="toggleProductStatus(p, $event)" class="px-3 h-8 rounded-full bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center hover:bg-gray-200 transition-colors shadow-sm border border-gray-200" title="暫時下架">下架</button>
                              }
                              <button (click)="editProduct(p)" class="w-8 h-8 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center hover:bg-brand-100 transition-colors shadow-sm border border-brand-200" title="編輯商品">✏️</button>
                           </div>
                        </div>
                     </div>
                  </div>
                } @empty {
                  <div class="col-span-full text-center py-10 text-gray-400 font-bold">目前無符合條件的商品。</div>
                }
              </div>
            }
          </div> 
        }

@if (activeTab() === 'customers') { 
          <div class="space-y-6 w-full">
              <div class="bg-white p-5 sm:p-6 rounded-[2rem] shadow-sm border border-gray-50 flex flex-col gap-4 w-full">
                
                <div class="flex flex-wrap justify-between items-center gap-4">
                  
                  <div class="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                     <div class="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 flex-1 sm:flex-none">
                        <span class="text-xs text-gray-400 font-bold whitespace-nowrap shrink-0">註冊:</span>
                        <input type="date" [ngModel]="memberStart()" (ngModelChange)="memberStart.set($event)" class="bg-transparent text-sm font-bold text-gray-700 outline-none flex-1 min-w-[110px]">
                        <span class="text-gray-300 hidden sm:block shrink-0">-</span>
                        <input type="date" [ngModel]="memberEnd()" (ngModelChange)="memberEnd.set($event)" class="bg-transparent text-sm font-bold text-gray-700 outline-none flex-1 min-w-[110px]">
                     </div>
                     <div class="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 flex-1 sm:flex-none">
                        <span class="text-xs text-gray-400 font-bold whitespace-nowrap shrink-0">消費額 ≥</span>
                        <input type="number" [ngModel]="minSpendFilter()" (ngModelChange)="minSpendFilter.set($event)" class="bg-transparent text-sm font-bold text-brand-900 outline-none w-full sm:w-20" placeholder="0">
                     </div>
                  </div>

                  <div class="flex flex-wrap items-center gap-3 w-full xl:w-auto flex-1 justify-start xl:justify-end">
                     <div class="relative w-full sm:w-auto flex-1 min-w-[200px] max-w-full xl:max-w-[300px]">
                       <input type="text" [(ngModel)]="customerSearch" placeholder="搜尋姓名/手機/編號..." class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-300 transition-all focus:ring-1 focus:ring-brand-100">
                       <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                     </div>
                     <div class="flex flex-wrap gap-2 w-full sm:w-auto">
                       <button (click)="openBulkCustomerModal()" class="flex-1 sm:flex-none px-4 py-2.5 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 whitespace-nowrap shadow-sm flex items-center justify-center transition-colors gap-1 disabled:opacity-50" [disabled]="selectedCustomerIds().length === 0"><span>⚡️</span> 批次 ({{ selectedCustomerIds().length }})</button>
                       <button (click)="exportCustomersCSV()" class="flex-1 sm:flex-none px-4 py-2.5 bg-[#8FA996] text-white rounded-xl font-bold hover:bg-[#7a9180] whitespace-nowrap shadow-sm flex items-center justify-center transition-colors">📥 匯出</button>
                       <button (click)="syncCustomersToGoogleSheets()" class="flex-1 sm:flex-none px-4 py-2.5 bg-[#E5B5B5] text-white rounded-lg font-bold hover:bg-[#D4A0A0] whitespace-nowrap shadow-sm flex items-center justify-center transition-colors">☁️ 同步</button>
                     </div>
                  </div>

                </div>
              </div>

              <div class="bg-white rounded-[2rem] shadow-sm border border-gray-50 overflow-hidden w-full">
                 <div class="overflow-auto w-full custom-scrollbar h-[calc(100vh-380px)] md:h-[calc(100vh-320px)]">
                   <table class="w-full text-sm text-left whitespace-nowrap block md:table">
                      <thead class="bg-gray-50 text-gray-500 font-bold border-b border-gray-100 hidden md:table-header-group sticky top-0 z-[40]">
                        <tr>
                          <th class="p-4 sticky left-0 z-[45] bg-gray-50 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">
                             <div class="flex items-center gap-3">
                                <input type="checkbox" (change)="toggleAllUsers($event)" class="w-4 h-4 rounded text-blue-600 cursor-pointer">
                                <span>會員編號 / Google UID</span>
                             </div>
                          </th>
                          <th class="p-4">會員資訊</th><th class="p-4">等級</th><th class="p-4 text-right">累積消費</th><th class="p-4 text-right">購物金</th><th class="p-4 text-right">操作</th>
                        </tr>
                      </thead>
                      <tbody class="block md:table-row-group divide-y-0 md:divide-y md:divide-gray-200">
                         @for(u of paginatedUsers(); track u.id) {
                            <tr class="hover:bg-[#F0F7FF] transition-colors group flex flex-col md:table-row border border-gray-200 md:border-none rounded-2xl md:rounded-none mb-4 md:mb-0 bg-white md:even:bg-[#F8FAFC] shadow-sm md:shadow-none overflow-hidden">
                               <td class="p-4 bg-gray-50/50 md:bg-white group-even:md:bg-[#F8FAFC] group-hover:md:bg-[#F0F7FF] md:sticky md:left-0 z-10 md:shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] transition-colors block md:table-cell border-b md:border-none border-gray-200">
                                  <div class="flex items-center gap-3">
                                     <input type="checkbox" [checked]="selectedCustomerIds().includes(u.id)" (change)="toggleUserSelection(u.id)" class="w-4 h-4 rounded text-blue-600 cursor-pointer shrink-0">
                                     <div class="flex flex-col min-w-0">
                                        <span class="text-sm font-bold text-brand-900 font-mono tracking-wide truncate">{{ formatMemberNo(u) }}</span>
                                        <div class="flex items-center gap-1 mt-1 cursor-pointer" title="點擊全選複製 UID">
                                           <span class="text-[10px] text-gray-400 font-mono">UID:</span>
                                           <span class="text-[10px] text-gray-500 font-mono select-all hover:text-brand-900 truncate">{{ u.id }}</span>
                                        </div>
                                     </div>
                                  </div>
                               </td>
                               <td class="p-4 flex justify-between items-center md:table-cell border-b md:border-none border-gray-100"><span class="md:hidden text-[10px] text-gray-400 font-bold uppercase tracking-wider">會員資訊</span><div class="text-right md:text-left"><div class="font-bold text-brand-900">{{ u.name }}</div>
                               <div class="text-xs text-gray-400 font-mono">{{ u.phone?.trim() }}</div></div></td>
                               <td class="p-4 flex justify-between items-center md:table-cell border-b md:border-none border-gray-100">
                                  <span class="md:hidden text-[10px] text-gray-400 font-bold uppercase tracking-wider">等級</span>
                                  <div class="text-right md:text-left">
                                     @if (u.tier === 'v1') { 
                                        <span class="bg-purple-100 text-purple-600 px-2 py-1 rounded-md text-xs font-bold border border-purple-200">VIP 1</span> 
                                     }
                                     @else if (u.tier === 'v2') { 
                                        <span class="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md text-xs font-bold border border-yellow-200">VIP 2</span> 
                                     }
                                     @else if (u.tier === 'v3') { 
                                        <span class="bg-red-100 text-red-600 px-2 py-1 rounded-md text-xs font-bold border border-red-200">VIP 3</span> 
                                     }
                                     @else if (u.tier === 'wholesale') { 
                                        <span class="bg-blue-100 text-blue-600 px-2 py-1 rounded-md text-xs font-bold border border-blue-200">批發</span> 
                                     }
                                     @else if (u.tier === 'employee') { 
                                        <span class="bg-gray-800 text-white px-2 py-1 rounded-md text-xs font-bold border border-gray-700">內部員工</span> 
                                     }
                                     @else { 
                                        <span class="bg-gray-100 text-gray-500 px-2 py-1 rounded-md text-xs font-bold border border-gray-200">一般</span> 
                                     }
                                  </div>
                               </td>
                               <td class="p-4 flex justify-between items-center md:table-cell border-b md:border-none border-gray-100 font-bold text-brand-900 md:text-right"><span class="md:hidden text-[10px] text-gray-400 font-bold uppercase tracking-wider">累積消費</span><div class="text-right">NT$ {{ calculateUserTotalSpend(u.id) | number }}</div></td>
                               <td class="p-4 flex justify-between items-center md:table-cell border-b md:border-none border-gray-100 text-brand-600 font-bold md:text-right"><span class="md:hidden text-[10px] text-gray-400 font-bold uppercase tracking-wider">購物金</span><div class="text-right">{{ u.credits }}</div></td>
                               <td class="p-4 flex justify-end md:table-cell md:text-right bg-gray-50/50 md:bg-transparent rounded-b-2xl md:rounded-none"><button (click)="openUserModal(u)" class="text-xs font-bold text-gray-600 md:text-gray-400 hover:text-brand-900 border border-gray-200 hover:bg-white px-4 py-2 md:px-3 md:py-1 rounded-lg transition-colors bg-white md:bg-transparent shadow-sm md:shadow-none">編輯</button></td>
                            </tr>
                         } @empty {
                            <tr><td colspan="6" class="p-8 text-center text-gray-400 font-bold">找不到相符的會員資料</td></tr>
                         }
                      </tbody>
                   </table>
                 </div>
              </div>

              @if(customerPageSize() !== 'all' && filteredUsers().length > toNumber(customerPageSize())) {
                 <div class="p-4 flex justify-end gap-2">
                    <button (click)="customerPage.set(customerPage() - 1)" [disabled]="customerPage() === 1" class="px-3 py-1 bg-white border border-gray-200 rounded text-sm disabled:opacity-50 hover:bg-gray-50 shadow-sm">上一頁</button>
                    <span class="px-3 py-1 bg-white border border-gray-200 rounded text-sm font-bold text-brand-900 shadow-sm">{{ customerPage() }}</span>
                    <button (click)="customerPage.set(customerPage() + 1)" [disabled]="customerPage() * toNumber(customerPageSize()) >= filteredUsers().length" class="px-3 py-1 bg-white border border-gray-200 rounded text-sm disabled:opacity-50 hover:bg-gray-50 shadow-sm">下一頁</button>
                 </div>
              }
          </div>
        }

        @if (activeTab() === 'accounting') {
          <div class="space-y-6 w-full">
            
            <div class="bg-white p-4 sm:p-5 rounded-[2rem] shadow-sm border border-gray-50 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 w-full animate-fade-in overflow-hidden">
              <div class="flex items-center gap-2 flex-wrap w-full lg:w-auto">
                <span class="text-sm font-bold text-gray-500 shrink-0 hidden sm:block">報表區間:</span>
                <div class="flex flex-wrap gap-1 bg-gray-50 p-1 rounded-xl w-full sm:w-auto">
                  @for(range of [{id:'today', label:'今日'}, {id:'week', label:'本週'}, {id:'month', label:'本月'}, {id:'year', label:'今年'}, {id:'all', label:'全部'}]; track range.id) {
                    <button (click)="accountingRange.set(range.id); accountingCustomStart.set(''); accountingCustomEnd.set('');"
                            [class.text-brand-900]="accountingRange() === range.id"
                            [class.bg-white]="accountingRange() === range.id"
                            [class.shadow-sm]="accountingRange() === range.id"
                            class="px-3 sm:px-4 py-1.5 rounded-lg text-sm font-bold border border-transparent text-gray-500 transition-all whitespace-nowrap flex-1 sm:flex-none">
                       {{ range.label }}
                    </button>
                  }
                </div>
              </div>
              <div class="flex flex-wrap items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 w-full lg:w-auto shadow-inner">
                <span class="text-xs text-gray-400 font-bold whitespace-nowrap hidden sm:block">自訂:</span>
                <input type="date" [ngModel]="accountingCustomStart()" (ngModelChange)="accountingCustomStart.set($event); accountingRange.set('custom')" class="bg-transparent text-sm font-bold text-gray-700 outline-none flex-1 min-w-[120px] cursor-pointer">
                <span class="text-gray-300">-</span>
                <input type="date" [ngModel]="accountingCustomEnd()" (ngModelChange)="accountingCustomEnd.set($event); accountingRange.set('custom')" class="bg-transparent text-sm font-bold text-gray-700 outline-none flex-1 min-w-[120px] cursor-pointer">
              </div>
            </div>
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">               
               <div class="col-span-2 lg:col-span-2 bg-blue-50 p-5 rounded-[2rem] border border-blue-200 shadow-sm relative z-10 hover:z-[60] transition-all">
                 <div class="absolute inset-0 overflow-hidden rounded-[2rem] pointer-events-none"><div class="absolute -right-2 -bottom-2 text-6xl opacity-10">🇹🇼</div></div>
                 <div class="relative z-10">
                   <div class="text-blue-600 text-xs font-bold uppercase tracking-widest mb-1 relative group cursor-help w-fit">
                     <div class="flex items-center gap-1">🇹🇼 台幣淨結算 <span class="w-3.5 h-3.5 rounded-full border border-blue-600 flex items-center justify-center text-[9px] opacity-70">?</span></div>
                     <div class="text-[9px] opacity-60 mt-1 leading-none normal-case">(不含員購)</div>
                     <div class="absolute top-full left-0 mt-2 w-64 bg-gray-800 text-white text-[10px] p-3 rounded-xl shadow-xl hidden group-hover:block font-normal normal-case tracking-normal leading-relaxed z-[100]">
                      結算完，台灣銀行戶頭裡實質增加了多少現金。<br>(通常是正數，因為錢都在台灣收)
                      <span class="opacity-50 font-mono text-[9px] mt-1.5 block pt-1.5 border-t border-gray-600">公式：台幣總營收 - 台幣商品成本 - 台幣營業雜支。</span>
                     </div>
                   </div>
                   <div class="text-3xl sm:text-4xl font-black text-blue-800 mt-3">NT$ {{ (accountingStats().revenueTWD - accountingStats().costTWD - accountingExpenses().twd) | number:'1.0-0' }}</div>
                 </div>
               </div>
               
               <div class="col-span-2 lg:col-span-2 bg-red-50 p-5 rounded-[2rem] border border-red-200 shadow-sm relative z-10 hover:z-[60] transition-all">
                 <div class="absolute inset-0 overflow-hidden rounded-[2rem] pointer-events-none"><div class="absolute -right-2 -bottom-2 text-6xl opacity-10">🇰🇷</div></div>
                 <div class="relative z-10">
                   <div class="text-red-600 text-xs font-bold uppercase tracking-widest mb-1 relative group cursor-help w-fit">
                     <div class="flex items-center gap-1">🇰🇷 韓幣淨結算 <span class="w-3.5 h-3.5 rounded-full border border-red-600 flex items-center justify-center text-[9px] opacity-70">?</span></div>
                     <div class="text-[9px] opacity-60 mt-1 leading-none normal-case">(不含員購)</div>
                     <div class="absolute top-full left-0 mt-2 w-64 bg-gray-800 text-white text-[10px] p-3 rounded-xl shadow-xl hidden group-hover:block font-normal normal-case tracking-normal leading-relaxed z-[100]">
                       結算完，總共欠韓國買手/廠商多少韓幣。<br>(通常是負數，因為要拿台幣換韓幣付給他們)
                       <span class="opacity-50 font-mono text-[9px] mt-1.5 block pt-1.5 border-t border-gray-600">公式：韓幣總營收 - 韓幣商品成本 - 韓幣營業雜支。</span>
                     </div>
                   </div>
                   <div class="text-3xl sm:text-4xl font-black text-red-800 mt-3">₩ {{ (accountingStats().revenueKRW - accountingStats().costKRW - accountingExpenses().krw) | number:'1.0-0' }}</div>
                 </div>
               </div>
               
               <div class="col-span-1 bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 relative z-10 hover:z-[60] transition-all flex flex-col justify-between">
                  <div>
                     <div class="text-gray-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-2 relative group cursor-help w-fit">
                       <div class="flex items-center gap-1">總營收 <span class="w-3.5 h-3.5 rounded-full border border-gray-500 flex items-center justify-center text-[9px] opacity-70">?</span></div>
                       <div class="text-gray-400 text-[9px] opacity-60 mt-1 leading-none normal-case">(不含員購)</div>
                       <div class="absolute bottom-full left-0 md:-left-4 mb-2 w-56 bg-gray-800 text-white text-[10px] p-3 rounded-xl shadow-xl hidden group-hover:block font-normal normal-case tracking-normal leading-relaxed z-[100]">
                         客人實際付給我們的錢。<br>因為賣台灣客人，韓幣營收通常為 0。
                         <span class="opacity-50 font-mono text-[9px] mt-1.5 block pt-1.5 border-t border-gray-600">公式：期間內所有有效訂單的 (最終結帳金額) 加總。</span>
                       </div>
                     </div>
                     <div class="text-lg font-black text-gray-800 mt-1">NT$ {{ accountingStats().revenueTWD | number:'1.0-0' }}</div>
                     <div class="text-sm font-bold text-gray-500">₩ {{ accountingStats().revenueKRW | number:'1.0-0' }}</div>
                  </div>
                  
                  <div class="flex flex-col gap-1 mt-3 pt-3 border-t border-gray-100">
                     <div class="flex justify-between items-center text-xs">
                        <span class="text-gray-400">一般零售 NT$</span>
                        <span class="font-bold text-gray-700">{{ accountingStats().revenueRetailTWD | number:'1.0-0' }}</span>
                     </div>
                     <div class="flex justify-between items-center text-xs">
                        <span class="text-gray-400">批發收入 NT$</span>
                        <span class="font-bold text-blue-600">{{ accountingStats().revenueWholesaleTWD | number:'1.0-0' }}</span>
                     </div>
                  </div>
               </div>

               <div class="col-span-1 bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 relative z-10 hover:z-[60] transition-all">
                  <div class="text-gray-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-2 relative group cursor-help w-fit">
                    <div class="flex items-center gap-1">總商品成本 <span class="w-3.5 h-3.5 rounded-full border border-gray-500 flex items-center justify-center text-[9px] opacity-70">?</span></div>
                    <div class="text-gray-400 text-[9px] opacity-60 mt-1 leading-none normal-case">(不含員購)</div>
                    <div class="absolute bottom-full left-0 md:-left-10 mb-2 w-56 bg-gray-800 text-white text-[10px] p-3 rounded-xl shadow-xl hidden group-hover:block font-normal normal-case tracking-normal leading-relaxed z-[100]">
                      賣掉的商品，當初買手進貨花了多少錢。
                      <span class="opacity-50 font-mono text-[9px] mt-1.5 block pt-1.5 border-t border-gray-600">公式：優先抓取「採購總帳」實刷均價；若無則用「當地原價」。</span>
                    </div>
                  </div>
                  <div class="text-lg font-black text-gray-800 mt-1">NT$ {{ accountingStats().costTWD | number:'1.0-0' }}</div>
                  <div class="text-sm font-bold text-gray-500">₩ {{ accountingStats().costKRW | number:'1.0-0' }}</div>
               </div>

               <div class="col-span-1 bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 relative z-10 hover:z-[60] transition-all">
                  <div class="text-gray-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-2 relative group cursor-help w-fit">
                    <div class="flex items-center gap-1">營業雜支 <span class="w-3.5 h-3.5 rounded-full border border-gray-500 flex items-center justify-center text-[9px] opacity-70">?</span></div>
                    <div class="absolute bottom-full left-0 md:-left-16 mb-2 w-56 bg-gray-800 text-white text-[10px] p-3 rounded-xl shadow-xl hidden group-hover:block font-normal normal-case tracking-normal leading-relaxed z-[100]">
                      進貨以外的營運費用 (如：國際運費、包材)。
                      <span class="opacity-50 font-mono text-[9px] mt-1.5 block pt-1.5 border-t border-gray-600">公式：手動於「營業支出」記帳的項目 (依錢包分台/韓幣)。</span>
                    </div>
                  </div>
                  <div class="text-lg font-black text-gray-800 mt-1">NT$ {{ accountingExpenses().twd | number:'1.0-0' }}</div>
                  <div class="text-sm font-bold text-gray-500">₩ {{ accountingExpenses().krw | number:'1.0-0' }}</div>
               </div>

               <div class="col-span-1 bg-brand-900 text-white p-5 rounded-[2rem] shadow-lg relative z-10 hover:z-[60] transition-all">
                  <div class="text-brand-200 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1 relative group cursor-help w-fit">
                    <div class="flex items-center gap-1">估算總盈餘 <span class="w-3.5 h-3.5 rounded-full bg-brand-200/20 text-brand-200 flex items-center justify-center text-[9px]">?</span></div>
                    <div class="text-[9px] opacity-60 mt-1 leading-none normal-case">(不含員購)</div>
                    <div class="absolute bottom-full right-0 md:-left-20 mb-2 w-64 bg-gray-800 text-white text-[10px] p-3 rounded-xl shadow-xl hidden group-hover:block font-normal normal-case tracking-normal leading-relaxed z-[100]">
                      將所有花掉的外幣，統一換算回台幣後的「公司最終參考淨利」。
                      <span class="opacity-50 font-mono text-[9px] mt-1.5 block pt-1.5 border-t border-gray-600">公式：總營收 - (台幣成本+外幣成本依匯率換算) - 總雜支。</span>
                    </div>
                  </div>
                  <div class="text-xl sm:text-2xl font-black mt-2">NT$ {{ accountingStats().profit - accountingExpenses().totalTwdEst | number:'1.0-0' }}</div>
               </div>
            </div>

            <div class="mt-4 w-full animate-fade-in flex flex-col sm:flex-row gap-3">
                <button (click)="exportFinalMonthlyReport()" class="flex-1 py-4 bg-gray-900 text-white rounded-[1.5rem] font-black text-lg shadow-xl hover:bg-black transition-transform active:scale-[0.98] flex items-center justify-center gap-2">
                   <span class="text-2xl">📥</span> 總結算匯出
                </button>
                <button (click)="syncFinalMonthlyReportToGoogleSheets()" class="flex-1 py-4 bg-[#E5B5B5] text-white rounded-[1.5rem] font-black text-lg shadow-xl hover:bg-[#D4A0A0] transition-transform active:scale-[0.98] flex items-center justify-center gap-2">
                   <span class="text-2xl">☁️</span> 總結算同步
                </button>
             </div>
            
            <div class="mt-10 pt-8 border-t border-gray-100 w-full animate-fade-in">
               <h4 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2 relative group w-fit cursor-help z-50">
                 <span></span> 合夥人分潤結算 
                 <span class="text-xs bg-brand-100 text-brand-600 px-2 py-1 rounded-full font-normal shadow-sm">依「已入帳」真實淨利自動拆分</span>
                 <span class="w-5 h-5 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs ml-1 hover:bg-gray-300 transition-colors">?</span>
  
                 <div class="absolute bottom-full left-0 mb-2 w-72 bg-gray-800 text-white text-[10px] p-4 rounded-xl shadow-xl hidden group-hover:block font-normal normal-case tracking-normal leading-relaxed">
                   根據商品來源 (親帶/批發)，將真實淨利精準切分。<br>
                   • <span class="text-brand-200 font-bold">親帶</span> (藝25/子25/芸25/公25)<br>
                   • <span class="text-brand-200 font-bold">批發</span> (藝0/子40/芸40/公20)
                   <span class="opacity-50 font-mono text-[9px] mt-2 block pt-2 border-t border-gray-600">已自動扣除客人折扣碼、購物金與免運補貼後的真實淨利。</span>
                 </div>
               </h4>
               <div class="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                  <div class="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-brand-300 transition-colors">
                     <div class="text-xs text-gray-500 font-bold mb-1 uppercase">藝辰 (25% / 0%)</div>
                     <div class="text-2xl lg:text-3xl font-black text-gray-800">NT$ {{ accountingStats().shares.yichen | number:'1.0-0' }}</div>
                     <div class="absolute bottom-0 right-0 p-2 opacity-5 text-5xl group-hover:scale-110 transition-transform">👧🏻</div>
                  </div>
                  <div class="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-brand-300 transition-colors">
                     <div class="text-xs text-gray-500 font-bold mb-1 uppercase">子婷 (25% / 40%)</div>
                     <div class="text-2xl lg:text-3xl font-black text-gray-800">NT$ {{ accountingStats().shares.ziting | number:'1.0-0' }}</div>
                     <div class="absolute bottom-0 right-0 p-2 opacity-5 text-5xl group-hover:scale-110 transition-transform">👩🏻</div>
                  </div>
                  <div class="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-brand-300 transition-colors">
                     <div class="text-xs text-gray-500 font-bold mb-1 uppercase">小芸 (25% / 40%)</div>
                     <div class="text-2xl lg:text-3xl font-black text-gray-800">NT$ {{ accountingStats().shares.xiaoyun | number:'1.0-0' }}</div>
                     <div class="absolute bottom-0 right-0 p-2 opacity-5 text-5xl group-hover:scale-110 transition-transform">👱🏻‍♀️</div>
                  </div>
                  <div class="bg-brand-50 p-5 rounded-2xl border border-brand-200 shadow-sm relative overflow-hidden group hover:border-brand-400 transition-colors">
                     <div class="text-xs text-brand-600 font-bold mb-1 uppercase">公司 (25% / 20%)</div>
                     <div class="text-2xl lg:text-3xl font-black text-brand-900">NT$ {{ accountingStats().shares.company | number:'1.0-0' }}</div>
                     <div class="absolute bottom-0 right-0 p-2 opacity-10 text-5xl group-hover:scale-110 transition-transform">🏢</div>
                  </div>
               </div>

            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 mt-10 pt-8 border-t border-gray-100">
                 <h4 class="text-xl font-bold text-gray-800 flex items-center gap-2">
                   <span></span> 行銷預算與折讓追蹤 
                   <span class="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-bold shadow-sm">隱形成本大數據</span>
                 </h4>
                 <div class="flex gap-2 w-full sm:w-auto">
                   <button (click)="exportMarketingCSV()" class="flex-1 sm:flex-none px-4 py-2 bg-purple-100 text-purple-700 rounded-xl font-bold shadow-sm hover:bg-purple-200 transition-colors flex items-center justify-center gap-1 text-sm whitespace-nowrap"><span>📥</span> 匯出明細</button>
                   <button (click)="syncMarketingToGoogleSheets()" class="flex-1 sm:flex-none px-4 py-2 bg-[#E5B5B5] text-white rounded-xl font-bold shadow-sm hover:bg-[#D4A0A0] transition-colors flex items-center justify-center gap-1 text-sm whitespace-nowrap"><span>☁️</span> 同步</button>
                 </div>
               </div>
               <div class="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                  <div class="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-purple-300 transition-colors">
                     <div class="text-xs text-gray-500 font-bold mb-1">折扣碼折抵總額</div>
                     <div class="text-2xl font-black text-purple-600">NT$ {{ accountingStats().marketing.promo | number }}</div>
                     <div class="absolute bottom-0 right-0 p-2 opacity-5 text-4xl">🎟️</div>
                  </div>
                  <div class="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-purple-300 transition-colors">
                     <div class="text-xs text-gray-500 font-bold mb-1">多入組優惠總額</div>
                     <div class="text-2xl font-black text-purple-600">NT$ {{ accountingStats().marketing.bundle | number }}</div>
                     <div class="absolute bottom-0 right-0 p-2 opacity-5 text-4xl">🔥</div>
                  </div>
                  <div class="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-purple-300 transition-colors">
                     <div class="text-xs text-gray-500 font-bold mb-1">購物金折抵總額</div>
                     <div class="text-2xl font-black text-purple-600">NT$ {{ accountingStats().marketing.credits | number }}</div>
                     <div class="absolute bottom-0 right-0 p-2 opacity-5 text-4xl">💎</div>
                  </div>
                  <div class="bg-purple-50 p-5 rounded-2xl border border-purple-200 shadow-sm relative overflow-hidden group">
                     <div class="text-xs text-purple-800 font-bold mb-1">本期行銷總折讓</div>
                     <div class="text-3xl font-black text-purple-900">NT$ {{ accountingStats().marketing.total | number }}</div>
                     <div class="absolute bottom-0 right-0 p-2 opacity-10 text-4xl">📈</div>
                  </div>
               </div>
            </div>

<div class="mt-10 pt-8 border-t border-gray-100 w-full">
               <h4 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                 <span>收款狀態分析</span>
                 <span class="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-normal">Cash Flow</span>
               </h4>
               <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 w-full">
                  <div class="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
                     <div class="text-xs text-gray-500 font-bold mb-1 uppercase">應收總額</div>
                     <div class="text-lg font-black text-gray-800 whitespace-nowrap">\${{ accountingStats().payment.total | number }}</div>
                     <div class="absolute bottom-0 right-0 p-2 opacity-5 text-4xl">🧾</div>
                  </div>
                  <div class="bg-green-50 p-4 rounded-2xl border border-green-100 shadow-sm relative overflow-hidden">
                     <div class="text-xs text-green-600 font-bold mb-1 uppercase">已實收 (入帳)</div>
                     <div class="text-lg font-black text-green-700 whitespace-nowrap">\${{ accountingStats().payment.received | number }}</div>
                     <div class="absolute bottom-0 right-0 p-2 opacity-10 text-4xl">💰</div>
                  </div>
                  <div class="bg-yellow-50 p-4 rounded-2xl border border-yellow-100 shadow-sm relative overflow-hidden">
                     <div class="text-xs text-yellow-600 font-bold mb-1 uppercase">對帳中</div>
                     <div class="text-lg font-black text-yellow-700 whitespace-nowrap">\${{ accountingStats().payment.verifying | number }}</div>
                     <div class="absolute bottom-0 right-0 p-2 opacity-10 text-4xl">🔍</div>
                  </div>
                  <div class="bg-red-50 p-4 rounded-2xl border border-red-100 shadow-sm relative overflow-hidden">
                     <div class="text-xs text-red-600 font-bold mb-1 uppercase">未收款(含貨到付款)</div>
                     <div class="text-lg font-black text-red-700 whitespace-nowrap">\${{ accountingStats().payment.unpaid | number }}</div>
                     <div class="absolute bottom-0 right-0 p-2 opacity-10 text-4xl">⚠️</div>
                  </div>
                  <div class="bg-gray-100 p-4 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden opacity-75">
                     <div class="text-xs text-gray-500 font-bold mb-1 uppercase">待退款</div>
                     <div class="text-lg font-black text-gray-600 whitespace-nowrap">\${{ accountingStats().payment.refund | number }}</div>
                     <div class="absolute bottom-0 right-0 p-2 opacity-10 text-4xl">↩️</div>
                  </div>
                  <div class="bg-gray-800 text-white p-4 rounded-2xl border border-gray-700 shadow-sm relative overflow-hidden">
                     <div class="text-xs text-gray-400 font-bold mb-1 uppercase">已退款 (結案)</div>
                     <div class="text-lg font-black text-white whitespace-nowrap">\${{ accountingStats().payment.refundedTotal | number }}</div>
                     <div class="absolute bottom-0 right-0 p-2 opacity-20 text-4xl">💸</div>
                  </div>
               </div>
            </div>

            <div class="mt-8 bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden w-full">
               <div class="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h4 class="text-xl font-bold text-gray-800 flex items-center gap-2"><span>期間商品銷售分析</span></h4>
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

            <div class="mt-12 w-full animate-fade-in bg-gray-50 p-6 rounded-[2rem] border border-gray-200">
               <h4 class="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2"><span>🤫</span> 員工內部自購獨立帳本</h4>
               <p class="text-sm text-gray-500 mb-4">設定為「內部員工」的會員訂單，已從上方正式報表中完全剔除，避免影響稅務與營收。請在此獨立下載對帳。</p>
               <div class="flex flex-wrap gap-3">
                  <button (click)="exportEmployeeCSV()" class="px-5 py-3 bg-gray-800 text-white rounded-xl font-bold shadow-md hover:bg-black transition-colors flex items-center gap-2"><span class="text-lg">📥</span> 匯出員工總帳 CSV</button>
                  <button (click)="syncEmployeeToGoogleSheets()" class="px-5 py-3 bg-gray-400 text-white rounded-xl font-bold shadow-md hover:bg-gray-500 transition-colors flex items-center gap-2"><span class="text-lg">☁️</span> 同步至雲端表單</button>
               </div>
            </div>

         </div>
        }

        @if (activeTab() === 'inventory') {
          <div class="bg-white rounded-[2rem] shadow-sm border border-gray-200 overflow-hidden w-full relative">
             
             <div class="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white relative z-50">
                <h3 class="font-bold text-lg text-gray-800 flex items-center gap-2"><span>🏭</span> 庫存總覽</h3>
                <div class="flex gap-2 w-full sm:w-auto">
                   <button (click)="exportInventoryCSV()" class="flex-1 sm:flex-none px-4 py-2 bg-[#8FA996] text-white rounded-xl font-bold hover:bg-[#7a9180] whitespace-nowrap shadow-sm flex justify-center items-center gap-1 transition-colors">📥 匯出</button>
                   <button (click)="syncInventoryToGoogleSheets()" class="flex-1 sm:flex-none px-4 py-2 bg-[#E5B5B5] text-white rounded-xl font-bold hover:bg-[#D4A0A0] whitespace-nowrap shadow-sm flex justify-center items-center gap-1 transition-colors">☁️ 同步</button>
                </div>
             </div>

             <div class="overflow-auto w-full max-h-[65vh] custom-scrollbar relative">
                <table class="w-full text-sm text-left whitespace-nowrap">
                   
                   <thead class="bg-gray-50 text-gray-500 sticky top-0 z-40 shadow-sm">
                      <tr>
                         <th class="p-4 sticky left-0 z-50 bg-gray-50 border-r border-b border-gray-200 w-[120px] min-w-[120px]">貨號</th>
                         <th class="p-4 sticky left-[120px] z-50 bg-gray-50 border-r border-b border-gray-200 w-[200px] min-w-[200px] shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">商品名稱</th>
                         <th class="p-4 border-b border-gray-200">規格</th>
                         <th class="p-4 text-right border-b border-gray-200">剩餘庫存</th>
                         <th class="p-4 text-right border-b border-gray-200">已售出</th>
                         <th class="p-4 border-b border-gray-200">狀態</th>
                      </tr>
                   </thead>

                   <tbody class="divide-y divide-gray-100">
                      @for (p of activeProducts(); track p.id) {
                      <tr class="hover:bg-gray-50 group transition-colors">
                         <td class="p-4 font-mono text-gray-400 text-xs sticky left-0 z-20 bg-white group-hover:bg-gray-50 border-r border-gray-100 w-[120px] min-w-[120px] transition-colors truncate">{{ p.code }}</td>
                         <td class="p-4 font-bold text-gray-800 sticky left-[120px] z-20 bg-white group-hover:bg-gray-50 border-r border-gray-100 w-[200px] min-w-[200px] shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] transition-colors truncate" [title]="p.name">{{ p.name }}</td>
                         <td class="p-4 text-gray-500">{{ (p.options || []).join(', ') || '單一規格' }}</td>
                         <td class="p-4 text-right font-mono font-bold" [class.text-red-500]="p.stock < 5">{{ p.stock >= 9999 ? '無限' : p.stock }}</td>
                         <td class="p-4 text-right text-gray-500 font-mono">{{ p.soldCount }}</td>
                         <td class="p-4">
                            @if(p.stock <= 0) { <span class="bg-gray-200 text-gray-500 px-2 py-1 rounded text-xs font-bold">缺貨</span> }
                            @else if(p.stock < 5) { <span class="bg-red-100 text-red-500 px-2 py-1 rounded text-xs font-bold">低庫存</span> }
                            @else { <span class="bg-green-100 text-green-600 px-2 py-1 rounded text-xs font-bold">充足</span> }
                         </td>
                      </tr>
                      }
                   </tbody>
                </table>
             </div>
          </div>
        }

        @if (activeTab() === 'purchases') {
          <div class="space-y-6 w-full animate-fade-in">
              <div class="bg-white p-4 sm:p-6 rounded-[2rem] shadow-sm border border-gray-50 flex flex-col xl:flex-row justify-between xl:items-center gap-4 w-full">
                 <div class="flex items-center gap-2 flex-wrap w-full xl:w-auto">
                    <span class="text-sm font-bold text-gray-500 shrink-0">日期篩選:</span>
                    <div class="flex items-center gap-2 flex-1 sm:flex-none min-w-[220px]">
                       <input type="date" [ngModel]="purchaseStart()" (ngModelChange)="purchaseStart.set($event)" class="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm font-bold rounded-xl px-2 py-2 outline-none">
                       <span class="text-gray-400">~</span>
                       <input type="date" [ngModel]="purchaseEnd()" (ngModelChange)="purchaseEnd.set($event)" class="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm font-bold rounded-xl px-2 py-2 outline-none">
                    </div>
                 </div>
                 <div class="flex items-center gap-2 w-full xl:w-auto">
                    <button (click)="exportPurchasesCSV()" class="flex-1 sm:flex-none px-4 py-2.5 bg-[#8FA996] text-white rounded-xl font-bold hover:bg-[#7a9180] transition-colors shadow-sm flex items-center justify-center gap-1"><span>📥</span> 匯出</button>
                    <button (click)="syncPurchasesToGoogleSheets()" class="flex-1 sm:flex-none px-4 py-2.5 bg-[#E5B5B5] text-white rounded-xl font-bold hover:bg-[#D4A0A0] transition-colors shadow-sm flex items-center justify-center gap-1"><span>☁️</span> 同步</button>
                 </div>
              </div>

              <div class="bg-white rounded-[2rem] shadow-sm border border-gray-50 overflow-hidden w-full custom-scrollbar relative">
                 <div class="overflow-x-auto w-full custom-scrollbar max-h-[65vh]">
                   <table class="w-full text-sm text-left whitespace-nowrap block md:table">
                      <thead class="bg-[#F9FAFB] text-gray-500 font-bold border-b border-gray-200 hidden md:table-header-group sticky top-0 z-[40] shadow-sm">
                        <tr>
                          <th class="p-4">回報時間 / 購買日</th>
                          <th class="p-4">地點/網址</th>
                          <th class="p-4">購買品項 (預估商品總額)</th>
                          <th class="p-4 text-right">單據運費</th>
                          <th class="p-4 text-right">實際刷卡總額</th>
                          <th class="p-4 text-center">付款人 / 分潤</th>
                          <th class="p-4 text-center">實拍收據</th>
                          <th class="p-4 text-center">狀態</th>
                          <th class="p-4 text-right">操作</th>
                        </tr>
                      </thead>
                      <tbody class="block md:table-row-group divide-y-0 md:divide-y md:divide-gray-200">
   @for(p of purchaseList(); track p?.id || $index) {
      <tr class="hover:bg-[#F0F7FF] transition-colors group flex flex-col md:table-row border border-gray-200 md:border-none rounded-2xl md:rounded-none mb-4 md:mb-0 bg-white md:even:bg-[#F8FAFC] shadow-sm md:shadow-none overflow-hidden relative">
         <td class="p-4 bg-gray-50/50 md:bg-transparent block md:table-cell border-b md:border-none border-gray-200">
            <span class="md:hidden text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">回報時間 / 購買日</span>
            <div class="font-bold text-gray-800">{{ p?.date || '無日期' }}</div>
            <div class="text-[10px] text-gray-400">回報: {{ p?.createdAt || '無' }}</div>
         </td>
         <td class="p-4 block md:table-cell border-b md:border-none border-gray-100">
            <span class="md:hidden text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">地點/網址</span>
            <div class="font-bold text-gray-700 flex items-center gap-1"><span class="text-[10px] bg-gray-200 px-1 rounded">{{ p?.country || '未指定' }}</span> {{ p?.location || '無' }}</div>
         </td>
         <td class="p-4 block md:table-cell border-b md:border-none border-gray-100">
            <span class="md:hidden text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">購買品項</span>
            <div class="text-xs text-gray-600 font-bold mb-1">{{ p?.items?.length || 0 }} 項商品 (預估值: {{ p?.currency === 'KRW' ? '₩' : (p?.currency === 'TWD' ? 'NT$' : (p?.currency || 'NT$')) }} {{ p?.estimatedLocalCost || 0 }})</div>
            <div class="flex flex-col gap-1">
              @for(item of (p?.items || []); track (item?.productId || '') + $index) {
                <div class="text-[10px] text-gray-600 break-words whitespace-normal leading-snug">
                  • {{ item?.productName }} <span class="bg-gray-200 text-gray-600 px-1 py-0.5 rounded mx-1 font-bold">[{{ item?.option || '單一規格' }}]</span> x{{ item?.quantity }} 
                  <span class="text-brand-600 font-bold ml-1">(&#64; {{ item?.currency === 'KRW' ? '₩' : (item?.currency === 'TWD' ? 'NT$' : (item?.currency || p?.currency || '$')) }}{{ item?.price || 0 | number }})</span>
                </div>
              }
            </div>
         </td>
         <td class="p-4 flex items-center justify-between md:table-cell border-b md:border-none border-gray-100 md:text-right">
            <span class="md:hidden text-[10px] text-gray-400 font-bold uppercase tracking-wider">單據運費</span>
            <div class="font-mono text-gray-500">{{ p?.currency === 'KRW' ? '₩' : (p?.currency === 'TWD' ? 'NT$' : (p?.currency || 'NT$')) }} {{ p?.localShipping || 0 }}</div>
         </td>
         <td class="p-4 flex items-center justify-between md:table-cell border-b md:border-none border-gray-100 md:text-right">
            <span class="md:hidden text-[10px] text-gray-400 font-bold uppercase tracking-wider">實際刷卡總額</span>
            <div class="font-black text-red-600 text-base">{{ p?.currency === 'KRW' ? '₩' : (p?.currency === 'TWD' ? 'NT$' : (p?.currency || 'NT$')) }} {{ p?.totalLocalCost || 0 }}</div>
         </td>
         <td class="p-4 flex items-center justify-between md:table-cell border-b md:border-none border-gray-100 md:text-center">
            <span class="md:hidden text-[10px] text-gray-400 font-bold uppercase tracking-wider">付款人 / 分潤</span>
            <div class="text-right md:text-center">
               <div class="font-bold text-gray-800">{{ p?.payer || '未指定' }}</div>
               <div class="text-[10px] text-gray-400">{{ p?.shareMode || '-' }}</div>
            </div>
         </td>
         <td class="p-4 flex items-center justify-between md:table-cell border-b md:border-none border-gray-100 md:text-center">
            <span class="md:hidden text-[10px] text-gray-400 font-bold uppercase tracking-wider">實拍收據</span>
            <div class="flex items-center gap-1 justify-end md:justify-center flex-wrap">
               @if(p?.receiptImages && p.receiptImages.length > 0) {
                  @for(img of p.receiptImages.slice(0, 3); track $index) {
                     <button (click)="openReceipts(p.receiptImages)" title="點擊放大查看全部" class="w-8 h-8 rounded-lg overflow-hidden border border-gray-200 hover:border-brand-400 shrink-0 transition-transform active:scale-95 relative group">
                        <img [src]="getSafeDriveImage(img)" (error)="handleImageError($event)" class="w-full h-full object-cover">
                        <div class="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors"></div>
                     </button>
                  }
                  @if(p.receiptImages.length > 3) {
                     <button (click)="openReceipts(p.receiptImages)" title="點擊放大查看全部" class="h-8 px-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 text-[10px] font-bold flex items-center transition-colors">
                        +{{ p.receiptImages.length - 3 }}
                     </button>
                  }
               } @else {
                  <span class="text-gray-300 font-bold">-</span>
               }
            </div>
         </td>
         <td class="p-4 flex items-center justify-between md:table-cell border-b md:border-none border-gray-100 md:text-center">
            <span class="md:hidden text-[10px] text-gray-400 font-bold uppercase tracking-wider">狀態</span>
            @if(p?.status === 'pending_sync') { <span class="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold border border-yellow-200 w-fit">待核銷</span> }
            @else { <span class="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold border border-green-200 w-fit">已入帳</span> }
         </td>
         <td class="p-4 flex flex-wrap items-center justify-end gap-2 min-w-[160px]">
            @if(p?.status === 'pending_sync') { 
              <button (click)="approvePurchase(p)" class="px-4 py-2 bg-brand-900 text-white rounded-lg text-xs font-bold hover:bg-black transition-colors shadow-sm active:scale-95 whitespace-nowrap">✅ 核准</button> 
            } @else {
              <button class="px-4 py-2 bg-gray-100 text-gray-400 rounded-lg text-xs font-bold cursor-not-allowed border border-gray-200 whitespace-nowrap">已完成</button>
            }
            <button (click)="openEditPurchaseModal(p)" class="px-3 py-2 bg-white text-gray-600 hover:text-brand-900 hover:bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold transition-colors shadow-sm whitespace-nowrap">✏️ 編輯</button>
            
            <button (click)="deletePurchaseRecord(p)" class="px-3 py-2 bg-white text-red-400 hover:text-red-600 hover:bg-red-50 border border-red-100 rounded-lg text-xs font-bold transition-colors shadow-sm whitespace-nowrap">🗑️ 刪除</button>
         </td>
      </tr>
   } @empty {
      <tr><td colspan="9" class="p-8 text-center text-gray-400 font-bold">目前沒有待處理的採購單據</td></tr>
   }
</tbody>
                   </table>
                 </div>
              </div>
          </div>
        }

        @if (activeTab() === 'wallets') {
          <div class="space-y-6 w-full animate-fade-in relative z-10">
             <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-5 rounded-[2rem] shadow-sm border border-gray-50">
                <p class="text-sm font-bold text-gray-500">💡 管理各幣別營運資金與買手餘額</p>
                <button (click)="openAddWalletModal()" class="w-full sm:w-auto px-6 py-2.5 bg-brand-900 text-white rounded-xl font-bold shadow-sm hover:bg-black transition-transform active:scale-95 whitespace-nowrap">+ 新增帳戶</button>
             </div>
             
             <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                @for(w of wallets(); track w.id) {
                   <div class="bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group">
                      <div class="absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none" [class.bg-blue-500]="w.currency==='TWD'" [class.bg-purple-500]="w.currency==='KRW'"></div>
                      
                      <div class="flex justify-between items-center mb-6 relative z-20">
                         <span class="text-sm font-bold text-gray-500 bg-gray-50 px-3 py-1 rounded-lg">{{ w.currency }}</span>
                         <button (click)="openWalletDetails(w)" class="px-4 py-2 bg-gray-100 text-gray-600 hover:bg-brand-50 hover:text-brand-900 font-bold text-sm rounded-lg transition-colors cursor-pointer active:scale-95 shadow-sm">查看明細 ➔</button>
                      </div>
                      <h4 class="text-lg sm:text-xl font-bold text-gray-800 mb-2 relative z-20">{{ w.name }}</h4>
                      <div class="text-4xl sm:text-5xl font-black break-words relative z-20" [class.text-blue-600]="w.currency==='TWD'" [class.text-purple-600]="w.currency==='KRW'">
                         {{ w.symbol }} {{ w.balance | number }}
                      </div>
                      <div class="flex gap-3 mt-8 relative z-20">
                         <button (click)="openWalletModal(w, 'add')" class="flex-1 py-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl text-sm font-bold text-green-700 transition-colors cursor-pointer active:scale-95">儲值 (收入)</button>
                         <button (click)="openWalletModal(w, 'deduct')" class="flex-1 py-3 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-sm font-bold text-red-700 transition-colors cursor-pointer active:scale-95">扣款 (支出)</button>
                      </div>
                   </div>
                }
             </div>
          </div>
        }

        @if (activeTab() === 'expenses') {
          <div class="space-y-6 w-full animate-fade-in">
             <div class="bg-white p-4 sm:p-5 rounded-[2rem] shadow-sm border border-gray-50 flex flex-col gap-4">
                <p class="text-sm font-bold text-gray-500 whitespace-nowrap border-b border-gray-100 pb-2">💡 記錄包材、機票、貨運費等公積金攤提</p>
                <div class="flex flex-wrap items-center gap-2 w-full">
                   <div class="flex items-center gap-2 flex-1 sm:flex-none min-w-[220px]">
                      <input type="date" [ngModel]="expenseStart()" (ngModelChange)="expenseStart.set($event)" class="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm font-bold rounded-xl px-2 py-2.5 outline-none">
                      <span class="text-gray-400">~</span>
                      <input type="date" [ngModel]="expenseEnd()" (ngModelChange)="expenseEnd.set($event)" class="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm font-bold rounded-xl px-2 py-2.5 outline-none">
                   </div>
                   <select [ngModel]="expenseCategoryFilter()" (ngModelChange)="expenseCategoryFilter.set($event)" class="flex-1 sm:flex-none min-w-[120px] bg-gray-50 border border-gray-200 text-gray-700 text-sm font-bold rounded-xl px-3 py-2.5 outline-none focus:border-brand-300">
                      <option value="all">全部類別</option>
                      <option value="商品採購">商品採購 (自動)</option>
                      <option value="儲值">資金流轉 (自動)</option>
                      @for(cat of uniqueExpenseCategories(); track cat) {
                         @if(cat !== '商品採購' && cat !== '儲值') {
                            <option [value]="cat">{{ cat }}</option>
                         }
                      }
                   </select>
                   <button (click)="exportExpensesCSV()" class="flex-1 sm:flex-none px-4 py-2.5 bg-[#8FA996] text-white rounded-xl font-bold shadow-sm hover:bg-[#7a9180] transition-colors whitespace-nowrap flex items-center justify-center gap-1"><span>📥</span> 匯出</button>
                   <button (click)="syncExpensesToGoogleSheets()" class="flex-1 sm:flex-none px-4 py-2.5 bg-[#E5B5B5] text-white rounded-xl font-bold shadow-sm hover:bg-[#D4A0A0] transition-colors whitespace-nowrap flex items-center justify-center gap-1"><span>☁️</span> 同步</button>
                   <button (click)="openExpenseModal()" class="flex-1 sm:flex-none px-6 py-2.5 bg-brand-900 text-white rounded-xl font-bold shadow-sm hover:bg-black transition-transform active:scale-95 whitespace-nowrap">+ 記一筆</button>
                </div>
             </div>

             <div class="bg-transparent md:bg-white md:rounded-[2rem] md:shadow-sm md:border md:border-gray-50 overflow-x-auto overflow-y-auto max-h-[70vh] w-full custom-scrollbar pb-2 relative">
                <table class="w-full text-sm text-left whitespace-nowrap block md:table md:min-w-[700px]">
                   <thead class="bg-gray-50 text-gray-500 font-bold border-b border-gray-200 hidden md:table-header-group sticky top-0 z-[40] shadow-sm">
                      <tr>
                         <th class="p-4 pl-6">日期</th>
                         <th class="p-4">支出項目</th>
                         <th class="p-4">類別</th>
                         <th class="p-4 text-right">金額</th>
                         <th class="p-4 text-right">結存餘額</th> <th class="p-4 text-center">付款人</th>
                         <th class="p-4">收據/備註</th>
                         <th class="p-4 text-center">操作</th>
                      </tr>
                   </thead>
                   <tbody class="block md:table-row-group divide-y-0 md:divide-y md:divide-gray-100">
                      @for(e of filteredExpenses(); track e.id) {
                         <tr class="hover:bg-gray-50 transition-colors block md:table-row bg-white border border-gray-200 md:border-none rounded-[1.5rem] md:rounded-none mb-4 md:mb-0 shadow-sm md:shadow-none p-1 md:p-0">
                            <td class="p-4 md:pl-6 flex items-center justify-between md:table-cell border-b border-gray-50 md:border-none">
                               <span class="md:hidden text-xs text-gray-400 font-bold">日期</span>
                               <span class="text-gray-500 font-mono">{{ e.date }}</span>
                            </td>
                            <td class="p-4 flex items-center justify-between md:table-cell border-b border-gray-50 md:border-none">
                               <span class="md:hidden text-xs text-gray-400 font-bold">支出項目</span>
                               <span class="font-bold text-gray-800 whitespace-normal break-all text-right md:text-left max-w-[200px] md:max-w-none leading-snug">{{ e.item }}</span>
                            </td>
                            <td class="p-4 flex items-center justify-between md:table-cell border-b border-gray-50 md:border-none">
                               <span class="md:hidden text-xs text-gray-400 font-bold">類別</span>
                               <span class="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-xs font-bold">{{ e.category }}</span>
                            </td>
                            <td class="p-4 flex items-center justify-between md:table-cell border-b border-gray-50 md:border-none md:text-right">
                               <span class="md:hidden text-xs text-gray-400 font-bold">金額</span>
                               <span class="font-black text-lg md:text-sm" [class.text-red-500]="e.category !== '儲值'">{{ e.currency === 'KRW' ? '₩' : 'NT$' }} {{ e.amount | number }}</span>
                            </td>
                            <td class="p-4 flex items-center justify-between md:table-cell border-b border-gray-50 md:border-none md:text-right bg-gray-50/50 md:bg-transparent">
                               <span class="md:hidden text-xs text-gray-400 font-bold">結存餘額</span>
                               <span class="font-mono text-gray-500 font-bold">{{ e.runningBalance !== undefined ? (e.currency === 'KRW' ? '₩ ' : 'NT$ ') + (e.runningBalance | number) : '-' }}</span>
                            </td>
                            <td class="p-4 flex items-center justify-between md:table-cell border-b border-gray-50 md:border-none md:text-center">
                               <span class="md:hidden text-xs text-gray-400 font-bold">付款人</span>
                               <span class="text-gray-600 text-xs font-bold">{{ e.payer }}</span>
                            </td>
                            <td class="p-4 flex flex-col md:flex-row items-end md:items-center justify-between md:justify-start gap-2 md:table-cell border-b border-gray-50 md:border-none">
                               <span class="md:hidden text-xs text-gray-400 font-bold mb-1">收據/備註</span>
                               <div class="flex items-center gap-2">
                                  @if(e.imageUrl) { <button (click)="openReceipts([e.imageUrl])" title="點擊放大查看" class="w-8 h-8 rounded-lg overflow-hidden border border-gray-200 hover:border-brand-400 shrink-0 transition-transform active:scale-95"><img [src]="getSafeDriveImage(e.imageUrl)" (error)="handleImageError($event)" class="w-full h-full object-cover"></button> }
                                  <span class="text-xs text-gray-400 truncate max-w-[150px] text-right md:text-left" [title]="e.note">{{ e.note || '-' }}</span>
                               </div>
                            </td>
                            <td class="p-4 flex items-center justify-end md:table-cell md:text-center gap-2">
                             <button (click)="editExpense(e)" class="px-3 py-1.5 bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-lg text-xs font-bold transition-colors shadow-sm">編輯</button>
                            <button (click)="deleteExpenseRecord(e)" class="px-3 py-1.5 bg-white text-red-400 border border-red-100 hover:bg-red-50 hover:text-red-600 rounded-lg text-xs font-bold transition-colors shadow-sm">刪除</button>
                           </td>
                         </tr>
                      } @empty {
                         <tr><td colspan="7" class="p-8 text-center text-gray-400 font-bold block md:table-cell">目前無支出紀錄</td></tr>
                      }
                   </tbody>
                </table>
             </div>
          </div>
        }
        @if (activeTab() === 'settings') { 
          <div class="w-full py-6"> 
            <div class="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 space-y-12 w-full"> 
              <div class="flex justify-between items-center border-b border-gray-100 pb-6"><h3 class="text-2xl font-bold text-gray-800">⚙️ 商店參數設定</h3></div>
              <form [formGroup]="settingsForm" (ngSubmit)="saveSettings()" class="space-y-10"> 
                <div class="space-y-4"><h4 class="font-bold text-gray-600 flex items-center gap-2"><span class="bg-blue-100 text-blue-600 p-1.5 rounded-lg text-lg">💳</span> 收款方式</h4><div class="grid grid-cols-1 sm:grid-cols-3 gap-4"><label class="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"><input type="checkbox" formControlName="enableCash" class="w-5 h-5 rounded text-brand-600 focus:ring-brand-500"><span class="font-bold text-gray-700">現金付款</span></label><label class="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"><input type="checkbox" formControlName="enableBank" class="w-5 h-5 rounded text-brand-600 focus:ring-brand-500"><span class="font-bold text-gray-700">銀行轉帳</span></label><label class="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"><input type="checkbox" formControlName="enableCod" class="w-5 h-5 rounded text-brand-600 focus:ring-brand-500"><span class="font-bold text-gray-700">貨到付款</span></label></div></div>
                <div class="space-y-6" formGroupName="shipping"><div class="flex justify-between items-end"><h4 class="font-bold text-gray-600 flex items-center gap-2"><span class="bg-green-100 text-green-600 p-1.5 rounded-lg text-lg">🚚</span> 物流設定</h4><div class="flex items-center gap-2"><span class="text-sm font-bold text-gray-500">全館免運門檻 $</span><input type="number" formControlName="freeThreshold" class="w-24 border border-gray-200 rounded-lg p-2 text-center font-bold"></div></div><div class="grid grid-cols-1 sm:grid-cols-2 gap-4" formGroupName="methods"><div class="border border-gray-200 rounded-xl p-4 space-y-2" formGroupName="meetup"><div class="flex justify-between items-center"><label class="flex items-center gap-2 font-bold text-gray-700"><input type="checkbox" formControlName="enabled" class="rounded text-brand-600"> 面交自取</label><input type="number" formControlName="fee" class="w-20 border border-gray-200 rounded-lg p-1 text-right text-sm" placeholder="運費"></div></div><div class="border border-gray-200 rounded-xl p-4 space-y-2" formGroupName="myship"><div class="flex justify-between items-center"><label class="flex items-center gap-2 font-bold text-gray-700"><input type="checkbox" formControlName="enabled" class="rounded text-brand-600"> 7-11 賣貨便</label><input type="number" formControlName="fee" class="w-20 border border-gray-200 rounded-lg p-1 text-right text-sm" placeholder="運費"></div></div><div class="border border-gray-200 rounded-xl p-4 space-y-2" formGroupName="family"><div class="flex justify-between items-center"><label class="flex items-center gap-2 font-bold text-gray-700"><input type="checkbox" formControlName="enabled" class="rounded text-brand-600"> 全家 好賣家</label><input type="number" formControlName="fee" class="w-20 border border-gray-200 rounded-lg p-1 text-right text-sm" placeholder="運費"></div></div><div class="border border-gray-200 rounded-xl p-4 space-y-2" formGroupName="delivery"><div class="flex justify-between items-center"><label class="flex items-center gap-2 font-bold text-gray-700"><input type="checkbox" formControlName="enabled" class="rounded text-brand-600"> 宅配寄送</label><input type="number" formControlName="fee" class="w-20 border border-gray-200 rounded-lg p-1 text-right text-sm" placeholder="運費"></div></div></div></div>
                <div class="space-y-4">
                  <div class="flex items-center justify-between border-b border-gray-100 pb-2">
                    <h4 class="font-bold text-gray-600 flex items-center gap-2">
                      <span class="bg-pink-100 text-pink-600 p-1.5 rounded-lg text-lg">🎟️</span> 折扣碼管理
                    </h4>
                    <button type="button" (click)="openPromoForm()" class="px-4 py-2 bg-pink-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-pink-700 transition-transform active:scale-95 whitespace-nowrap">＋ 新增折扣碼</button>
                  </div>
                  <div class="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                    @for(promo of store.settings().promoCodes || []; track $index; let i = $index) {
                       <div class="flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 bg-white p-3 rounded-lg border border-gray-200 shadow-sm transition-hover hover:border-pink-300">
                         <div class="flex-1">
                           <div class="flex items-center gap-2 mb-1">
                             <span class="font-black text-xl text-brand-900 tracking-wider">{{ promo.code }}</span>
                             @if(promo.active) { <span class="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold border border-green-200">🟢 啟用中</span> }
                             @else { <span class="bg-gray-200 text-gray-500 px-2 py-0.5 rounded text-[10px] font-bold">停用中</span> }
                           </div>
                           <div class="text-xs text-gray-500 flex flex-wrap gap-x-3 gap-y-1">
                             <span class="font-bold text-pink-600">{{ promo.type === 'fixed' ? '折抵 NT$ ' + promo.value : '打 ' + (promo.value * 10) + ' 折' }}</span>
                             <span>| 低消: {{ promo.minSpend === 0 ? '無' : '$' + promo.minSpend }}</span>
                             <span>| 已用: <span class="font-bold">{{ promo.usedCount }}</span> / {{ promo.usageLimit === 0 ? '無限' : promo.usageLimit }}</span>
                             <span>| 期限: {{ promo.expiryDate || '永久' }}</span>
                           </div>
                         </div>
                         <div class="flex items-center gap-2 shrink-0">
                            <button type="button" (click)="openPromoForm(i)" class="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-200 shadow-sm">編輯</button>
                            <button type="button" (click)="deletePromo(i)" class="px-3 py-1.5 bg-white text-red-500 border border-red-100 rounded-lg text-xs font-bold hover:bg-red-50 shadow-sm">刪除</button>
                         </div>
                       </div>
                    } @empty {
                       <div class="text-center py-6 text-gray-400 font-bold text-sm">目前尚無設定任何折扣碼，點擊右上方新增吧！</div>
                    }
                  </div>
                </div>
                <div class="space-y-4"><h4 class="font-bold text-gray-600 flex items-center gap-2"><span class="bg-yellow-100 text-yellow-600 p-1.5 rounded-lg text-lg">🎁</span> 會員回饋 (生日禮金)</h4><div class="grid grid-cols-1 sm:grid-cols-2 gap-6"><div><label class="block text-xs font-bold text-gray-500 mb-1">一般會員生日禮 ($)</label><input type="number" formControlName="birthdayGiftGeneral" class="w-full border border-gray-200 rounded-xl p-3 font-bold"></div><div><label class="block text-xs font-bold text-gray-500 mb-1">VIP 生日禮 ($)</label><input type="number" formControlName="birthdayGiftVip" class="w-full border border-gray-200 rounded-xl p-3 font-bold"></div></div></div>
                
                <div class="space-y-4">
                   <h4 class="font-bold text-gray-600 flex items-center gap-2">
                      <span class="bg-purple-100 text-purple-600 p-1.5 rounded-lg text-lg">🏷️</span> 商品分類管理 (類別增刪改與代碼)
                   </h4>
                   <div class="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                      @for(cat of store.categories(); track cat) { 
                         <div class="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                            <input type="text" [value]="cat" (change)="renameCategory(cat, $any($event.target).value)" class="flex-1 min-w-[120px] border border-transparent hover:border-gray-200 outline-none font-bold text-sm text-gray-700 bg-transparent focus:ring-1 focus:ring-brand-200 rounded px-2 py-1" title="點擊修改名稱">
                            <span class="text-xs text-gray-400 font-bold ml-auto sm:ml-2">SKU代碼:</span>
                            <input type="text" [value]="categoryCodes()[cat] || ''" (change)="updateCategoryCode(cat, $any($event.target).value)" class="w-16 border border-gray-200 rounded px-1 py-1 uppercase text-center font-mono font-bold text-brand-900 focus:outline-none focus:border-brand-300 shadow-inner" maxlength="3" placeholder="ABC">
                            <button type="button" (click)="deleteCategory(cat)" class="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="刪除此分類">✕</button>
                         </div> 
                      }
                      <div class="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                         <input #newCatInput type="text" placeholder="輸入新分類名稱..." class="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-300 shadow-inner">
                         <button type="button" (click)="addNewCategory(newCatInput.value); newCatInput.value=''" class="px-4 py-2 bg-brand-900 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-black whitespace-nowrap">＋ 新增分類</button>
                      </div>
                      <p class="text-xs text-gray-400 mt-2">* SKU 代碼建議輸入 1~3 個英文字母 (A-Z)，用於貨號開頭 (例如: TS250520001)</p>
                   </div>
                </div>

                <div class="pt-6 border-t border-gray-100 flex justify-end"><button type="submit" class="px-10 py-4 bg-brand-900 text-white rounded-xl font-bold shadow-lg hover:bg-black transition-transform active:scale-95 text-lg">儲存所有設定</button></div> 
              </form> 
            </div> 
          </div> 
        }

        @if (showProductModal()) { 
          <div class="fixed inset-0 z-[1000] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm pt-12">
            <div class="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col overflow-hidden animate-slide-up" (click)="$event.stopPropagation()"> 
              
              <div class="p-4 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50"> 
                <div class="flex items-center gap-3">
                  <h3 class="text-xl font-bold text-brand-900">{{ editingProduct() ? '編輯商品' : '新增商品' }}</h3> 
                  <button type="button" (click)="isQuickMode.set(!isQuickMode())" class="px-3 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1 shadow-sm" [class.bg-brand-900]="isQuickMode()" [class.text-white]="isQuickMode()" [class.bg-white]="!isQuickMode()" [class.text-gray-500]="!isQuickMode()" [class.border]="!isQuickMode()" [class.border-gray-200]="!isQuickMode()">
                    <span class="text-sm">⚡️</span> {{ isQuickMode() ? '快閃模式' : '完整模式' }}
                  </button>
                </div>
                <button (click)="closeProductModal()" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 font-bold transition-colors">✕</button> 
              </div> 

              <div class="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar"> 
                <form [formGroup]="productForm" class="space-y-5"> 
                  
                  <div class="bg-gray-50 p-4 rounded-2xl border border-gray-100"> 
                    <label class="block text-xs font-bold text-gray-500 mb-2">商品圖片 (第一張為主圖)</label> 
                    <div class="flex flex-wrap gap-2 mb-3"> 
                      @for(img of tempImages(); track $index) { 
                        <div draggable="true" (dragstart)="onImageDragStart($index)" (dragover)="onImageDragOver($event)" (drop)="onImageDrop($event, $index)" [class.opacity-40]="draggedImageIndex() === $index" [class.ring-2]="draggedImageIndex() === $index" [class.ring-brand-400]="draggedImageIndex() === $index" class="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group bg-gray-50 cursor-grab active:cursor-grabbing hover:shadow-md transition-all"> 
                          
                          <div class="absolute top-0 left-0 bg-brand-900/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-br-lg z-20 pointer-events-none shadow-sm">圖{{ $index + 1 }}</div>

                          @if(isYT(img)) {
                             <img [src]="getYTThumbnail(img)" class="w-full h-full object-cover pointer-events-none">
                             <div class="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none"><span class="text-white text-xl drop-shadow-md">▶</span></div>
                          } @else if(isEmbedVideo(img)) {
                             <div class="w-full h-full bg-gray-800 flex flex-col items-center justify-center pointer-events-none"><span class="text-white text-xl mb-1">🌐</span><span class="text-[10px] text-gray-300 font-bold">社群影片</span></div>
                          } @else if(isVideo(img)) {
                             <video [src]="img" autoplay muted loop playsinline class="w-full h-full object-cover pointer-events-none"></video>
                             <div class="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] px-1 rounded z-10">影片</div>
                          } @else {
                             <img [src]="img" (error)="handleImageError($event)" referrerpolicy="no-referrer" class="w-full h-full object-cover pointer-events-none"> 
                          }
                          
                          <button type="button" (click)="removeImage($index)" class="absolute top-0 right-0 bg-black/40 hover:bg-red-500 text-white w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-colors z-20 rounded-bl-lg">✕</button> 
                          
                          @if($index === 0) { <div class="absolute bottom-0 inset-x-0 bg-brand-900/80 text-white text-[9px] text-center font-bold pointer-events-none z-10 py-0.5">主圖</div> } 
                        </div> 
                      } 
                    </div>
                    <div class="flex flex-col sm:flex-row gap-2"> 
                      <label class="flex-1 cursor-pointer px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 hover:border-brand-200 flex items-center justify-center gap-2 transition-colors shadow-sm"> 
                        <span class="text-lg">📷</span> 手機拍照 / 選照片 
                        <input type="file" multiple accept="image/*" class="hidden" (change)="handleFileSelect($event)"> 
                      </label> 
                      <div class="flex-1 flex gap-2 items-start"> 
                        <textarea #urlInput rows="2" placeholder="貼上圖片網址 (支援換行/多張一起貼)..." class="flex-1 p-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-brand-300 custom-scrollbar resize-none"></textarea> 
                        <button type="button" (click)="addImageUrl(urlInput.value); urlInput.value=''" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-300 whitespace-nowrap mt-1 shadow-sm transition-colors active:scale-95">加入</button> 
                      </div>
                     </div> 
                  </div>

                  <div> 
                    <label class="block text-xs font-bold text-gray-500 mb-1">商品名稱</label> 
                    <input formControlName="name" class="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-400 transition-colors" placeholder="例如: 韓國東大門羊毛大衣"> 
                  </div> 

                  <div class="bg-blue-50/50 p-3 rounded-xl border border-blue-100 mt-4"> 
                    <label class="block text-xs font-bold text-blue-600 mb-1 flex items-center gap-1"><span>🔗</span> 購買網址 (支援多個，請按 Enter 換行)</label> 
                    <textarea formControlName="purchaseUrl" rows="3" class="w-full p-2.5 bg-white border border-blue-200 rounded-lg text-sm outline-none focus:border-brand-400 custom-scrollbar resize-y" placeholder="貼上韓國官網或店家網址...&#10;如果有多個網址，請換行貼上"></textarea> 
                  </div>

                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mt-4"> 
                    <div class="bg-brand-50 p-2 sm:p-3 rounded-xl border border-brand-100"> 
                      <label class="block text-[10px] sm:text-xs font-bold text-brand-700 mb-1">售價 (NT$)</label> 
                      <input type="number" formControlName="priceGeneral" class="w-full p-1.5 sm:p-2 border border-brand-200 rounded-lg focus:outline-none focus:border-brand-500 font-bold text-brand-900 text-sm sm:text-lg"> 
                    </div> 
                    <div class="bg-gray-50 p-2 sm:p-3 rounded-xl border border-gray-200"> 
                      <label class="block text-[10px] sm:text-xs font-bold text-gray-600 mb-1">原價幣別</label> 
                      <select formControlName="localCurrency" class="w-full p-1.5 sm:p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-500 font-bold text-brand-900 text-sm sm:text-base bg-white cursor-pointer">
                        <option value="KRW">韓幣 (KRW)</option>
                        <option value="TWD">台幣 (TWD)</option>
                        <option value="JPY">日幣 (JPY)</option>
                        <option value="CNY">人民幣 (CNY)</option>
                        <option value="THB">泰銖 (THB)</option>
                        <option value="USD">美金 (USD)</option>
                      </select>
                    </div> 
                    <div class="bg-gray-50 p-2 sm:p-3 rounded-xl border border-gray-200"> 
                      <label class="block text-[10px] sm:text-xs font-bold text-gray-600 mb-1">當地原價</label> 
                      <input type="number" formControlName="localPrice" class="w-full p-1.5 sm:p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-500 font-bold text-gray-700 text-sm sm:text-lg"> 
                    </div> 
                    <div class="bg-gray-50 p-2 sm:p-3 rounded-xl border border-gray-200 relative group"> 
                      <label class="block text-[10px] sm:text-xs font-bold text-gray-600 mb-1 flex items-center gap-1">客用匯率 <span class="text-gray-400 cursor-help rounded-full border border-gray-300 w-3 h-3 flex items-center justify-center text-[8px]">?</span></label> 
                      <input type="number" formControlName="exchangeRate" step="0.001" class="w-full p-1.5 sm:p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-500 font-bold text-gray-700 text-sm sm:text-lg"> 
                      <div class="absolute bottom-full left-0 mb-2 w-48 bg-gray-800 text-white text-[10px] p-2 rounded shadow-lg hidden group-hover:block z-50">填寫給客人的緩衝定價匯率。<br>員工後台的「真實底價利潤」系統會依照您選擇的幣別自動帶入真實匯率計算。</div>
                    </div> 
                  </div> 

                  <div class="bg-gray-50 p-4 rounded-xl border border-gray-200 mt-2 mb-4">
                    <div class="flex items-center justify-between"> 
                      <div class="text-xs text-gray-500 space-y-2"> 
                         <div>
                            客用預估成本: <span class="font-bold text-gray-800">$ {{ estimatedCost() | number:'1.0-0' }}</span> 
                            <span class="text-[10px] text-gray-400 ml-1">({{ formValues()?.exchangeRate || 1 }})</span>
                         </div>
                         <div class="text-brand-700">
                            真實底價(員工): <span class="font-bold">$ {{ realEstimatedCost() | number:'1.0-0' }}</span> 
                            <span class="text-[10px] opacity-70 ml-1">({{ getRealExchangeRate(formValues()) | number:'1.2-4' }})</span>
                         </div>
                      </div> 
                      <div class="text-right space-y-2"> 
                        <div>
                           <span class="text-xs text-gray-400 mr-2">客用預估毛利</span> 
                           <span class="font-bold" [class.text-green-600]="estimatedProfit() > 0" [class.text-red-500]="estimatedProfit() <= 0"> $ {{ estimatedProfit() | number:'1.0-0' }} </span>
                           <span class="text-[10px] ml-1 bg-gray-100 px-1 rounded text-gray-500"> {{ estimatedMargin() | number:'1.1-1' }}% </span>
                        </div> 
                        <div class="text-brand-700 font-bold">
                           <span class="text-xs opacity-80 mr-2">真實底價毛利</span> 
                           $ {{ realEstimatedProfit() | number:'1.0-0' }} 
                        </div>
                      </div> 
                    </div>
                  </div>

                  <div> 
                    <label class="block text-xs font-bold text-gray-500 mb-1">商品規格 <span class="text-[10px] text-gray-400 font-normal">格式：名稱[圖X]=售價=VIP=當地 (可換行或逗號分隔)</span></label>                    <textarea formControlName="optionsStr" rows="4" class="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-400 custom-scrollbar leading-relaxed" placeholder="例如：&#10;燕麥色[圖2]=2580=2500=85000&#10;海軍藍[圖3]=2580=2500=85000&#10;單一顏色不換圖=2580"></textarea> 
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-blue-50 p-4 rounded-xl border border-blue-200 mb-4">
                        <div class="col-span-1 sm:col-span-2 flex items-center justify-between border-b border-blue-200 pb-2">
                          <h4 class="font-bold text-blue-800 text-sm flex items-center gap-1"><span>🤝</span> 合夥人分潤模式設定</h4>
                        </div>
                        <div class="col-span-1 sm:col-span-2">
                          <label class="block text-xs font-bold text-blue-600 mb-1">進貨來源與分潤比例</label>
                          <select formControlName="shareMode" class="w-full p-3 border border-blue-200 rounded-xl focus:outline-none focus:border-blue-400 text-sm font-bold bg-white text-blue-900 cursor-pointer shadow-sm">
                            <option value="親帶">✈️ 親帶 (藝辰25% / 子婷25% / 小芸25% / 公司25%)</option>
                            <option value="批發">📦 批發 (藝辰0% / 子婷40% / 小芸40% / 公司20%)</option>
                          </select>
                        </div>
                      </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4"> 
                    <div> 
                      <label class="block text-xs font-bold text-gray-500 mb-1">主分類</label> 
                      <select formControlName="category" (change)="onCategoryChange()" class="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-400 cursor-pointer">
                        <option value="" disabled selected>請選擇分類...</option>
                        @for(c of store.categories(); track c) { 
                          <option [value]="c">{{ c }}</option> 
                        } 
                      </select>
                    </div>
                    <div> 
                      <label class="block text-xs font-bold text-gray-500 mb-1">次分類</label> 
                      <div class="flex gap-2">
                         <select [ngModel]="productForm.get('subCategory')?.value" (ngModelChange)="onSubCategoryChange($event)" [ngModelOptions]="{standalone: true}" class="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-400 cursor-pointer font-bold text-sm text-gray-700">
                            <option value="" disabled selected>選擇現有次分類...</option>
                            @for(sub of formSubCategories(); track sub) { <option [value]="sub">{{ sub }}</option> }
                            <option value="NEW">➕ 自訂新次分類</option>
                         </select>
                         @if(isAddingNewSubCategory()) {
                            <input type="text" formControlName="subCategory" placeholder="輸入新名稱" class="w-full p-3 border border-brand-300 rounded-xl bg-white focus:outline-none focus:border-brand-500 animate-fade-in text-sm font-bold">
                         }
                     </div>
                    </div>
                  </div> <div>
                     <label class="block text-xs font-bold text-gray-500 mb-1">標籤 <span class="text-[10px] text-gray-400 font-normal">(可換行或逗號分隔)</span></label> 
                     <textarea formControlName="tagsStr" rows="2" class="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-400 custom-scrollbar resize-none" placeholder="例如：品牌, 團體"></textarea>
                  </div>

                  @if(!isQuickMode()) {
                    <div class="pt-6 mt-6 border-t border-gray-100 space-y-5 animate-slide-up">
                      
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div> 
                          <label class="block text-xs font-bold text-gray-500 mb-1">分類代碼 (用於自動貨號)</label> 
                          <input [value]="currentCategoryCode()" (input)="onCodeInput($event)" class="w-full p-3 border border-gray-200 rounded-xl text-center font-mono font-bold uppercase bg-gray-50 focus:outline-none focus:border-brand-300" placeholder="代碼" maxlength="3"> 
                        </div>
                        <div class="hidden sm:block"></div>
                      </div>

                      <div class="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4"> 
                        <h4 class="font-bold text-gray-700 text-sm border-b border-gray-200 pb-2">💰 進階成本 (國際運費/包材)</h4> 
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-4"> 
                          <div> <label class="block text-xs font-bold text-gray-500 mb-1">重量 kg</label> <input type="number" formControlName="weight" step="0.1" class="w-full p-2 border rounded-lg bg-white"> </div> 
                          <div> <label class="block text-xs font-bold text-gray-500 mb-1">國際運費/kg</label> <input type="number" formControlName="shippingCostPerKg" class="w-full p-2 border rounded-lg bg-white"> </div> 
                          <div> <label class="block text-xs font-bold text-gray-500 mb-1">額外成本</label> <input type="number" formControlName="costMaterial" class="w-full p-2 border rounded-lg bg-white"> </div> 
                        </div> 
                      </div> <div class="grid grid-cols-1 sm:grid-cols-3 gap-4"> 
                        <div> <label class="block text-xs font-bold text-gray-500 mb-1">VIP價 (NT$)</label> <input type="number" formControlName="priceVip" class="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-300"> </div> 
                        <div> <label class="block text-xs font-bold text-blue-500 mb-1">批發價 (NT$)</label> <input type="number" formControlName="priceWholesale" class="w-full p-3 border border-blue-200 rounded-xl focus:outline-none focus:border-blue-400 bg-blue-50/30"> </div> 
                        <div> <label class="block text-xs font-bold text-gray-500 mb-1">商品貨號 (SKU)</label> <input formControlName="code" class="w-full p-3 border border-gray-200 rounded-xl font-mono bg-gray-50 text-gray-500" [placeholder]="'自動: ' + generatedSkuPreview()"> </div> 
                      </div>

                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-red-50 p-4 rounded-xl border border-red-200">
                        <div class="col-span-1 sm:col-span-2 flex items-center justify-between border-b border-red-200 pb-2">
                          <h4 class="font-bold text-red-600 text-sm flex items-center gap-1"><span>🔥</span> 多入組優惠設定</h4>
                        </div>
                        <div> <label class="block text-xs font-bold text-red-500 mb-1">任選數量 (件)</label> <input type="number" formControlName="bulkCount" class="w-full p-2 border border-red-200 rounded-lg focus:outline-none focus:border-red-400"> </div>
                        <div> <label class="block text-xs font-bold text-red-500 mb-1">優惠總價 (NT$)</label> <input type="number" formControlName="bulkTotal" class="w-full p-2 border border-red-200 rounded-lg focus:outline-none focus:border-red-400"> </div>
                      </div>
                      
                      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <label class="flex items-center gap-3 cursor-pointer select-none">
                          <input type="checkbox" formControlName="isPreorder" class="w-5 h-5 rounded text-blue-600">
                          <span class="font-bold text-gray-700">預購</span>
                        </label>
                        <label class="flex items-center gap-3 cursor-pointer select-none">
                          <input type="checkbox" formControlName="isListed" class="w-5 h-5 rounded text-green-600">
                          <span class="font-bold text-gray-700">上架前台</span>
                        </label>
                        <label class="flex items-center gap-3 cursor-pointer select-none">
                          <input type="checkbox" formControlName="isHidden" class="w-5 h-5 rounded text-purple-600">
                          <span class="font-bold text-purple-700 flex items-center gap-1">隱形賣場</span>
                        </label>
                      </div>

                      <div> 
                        <label class="block text-xs font-bold text-gray-500 mb-1">庫存</label> 
                        @if(formValues().isPreorder) {
                          <input type="text" value="無限 (99999)" disabled class="w-full p-3 border border-gray-200 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed">
                        } @else {
                          <input type="number" formControlName="stock" class="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-300"> 
                        }
                      </div> 
                      
                      <div> <label class="block text-xs font-bold text-gray-500 mb-1">備註/商品文案</label> <textarea formControlName="note" class="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-300 custom-scrollbar" rows="4"></textarea> </div> 
                    </div>
                  }
                </form>
               </div> 
              
              <div class="p-4 sm:p-6 border-t border-gray-100 bg-white flex justify-between items-center shrink-0 w-full"> 
                <div>
                  @if(editingProduct()) {
                    <button type="button" (click)="deleteProduct(editingProduct()!)" class="px-4 py-2 rounded-xl text-red-400 font-bold hover:bg-red-50 hover:text-red-600 transition-colors text-sm flex items-center gap-1">
                      永久刪除此商品
                    </button>
                  }
                </div>
                
                <div class="flex gap-3">
                  <button type="button" (click)="closeProductModal()" class="px-5 sm:px-6 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-500 hover:bg-gray-50 transition-colors">取消</button> 
                  <button type="button" (click)="submitProduct()" class="px-5 sm:px-6 py-2.5 rounded-xl bg-brand-900 text-white font-bold hover:bg-black transition-transform active:scale-95 flex items-center gap-2">
                    確認儲存
                  </button> 
                </div>
              </div>
            </div> 
          </div> 
        }

        @if (showUserModal()) { 
          <div class="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"> 
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
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4"> 
                    <div> <label class="block text-xs font-bold text-gray-500 mb-1">姓名</label> <input formControlName="name" class="w-full p-3 border border-gray-200 rounded-xl"> </div> 
                    <div> <label class="block text-xs font-bold text-gray-500 mb-1">電話</label> <input formControlName="phone" class="w-full p-3 border border-gray-200 rounded-xl"> </div> 
                  </div> 
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4"> 
                    <div> <label class="block text-xs font-bold text-gray-500 mb-1">生日</label> <input type="date" formControlName="birthday" class="w-full p-3 border border-gray-200 rounded-xl"> </div> 
                    <div> 
                      <label class="block text-xs font-bold text-gray-500 mb-1">會員等級</label> 
                      <select formControlName="tier" class="w-full p-3 border border-gray-200 rounded-xl bg-white"> 
                        <option value="general">一般會員</option>
                        <option value="v1">VIP 1</option>
                        <option value="v2">VIP 2</option>
                        <option value="v3">VIP 3</option>
                        <option value="wholesale">批發會員</option>
                        <option value="employee">內部員工</option>
                      </select> 
                    </div> 
                  </div> 
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4"> 
                    <div> <label class="block text-xs font-bold text-gray-500 mb-1">購物金餘額 ($)</label> <input type="number" formControlName="credits" class="w-full p-3 border border-gray-200 rounded-xl font-bold text-brand-600"> </div> 
                    <div> 
                       <label class="block text-xs font-bold text-gray-500 mb-1">累積消費 ($) <span class="text-brand-600 font-normal ml-1 text-[10px]">(自動計算)</span></label> 
                       <input type="number" formControlName="totalSpend" readonly class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 cursor-not-allowed" title="系統將自動根據有效訂單加總"> 
                    </div> 
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

        @if (showReceiptModal()) {
          <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" (click)="showReceiptModal.set(false)">
            <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-bounce-in" (click)="$event.stopPropagation()">
               <div class="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
                 <h3 class="font-bold text-gray-800 flex items-center gap-2"><span>📸</span> 實拍收據</h3>
                 <button (click)="showReceiptModal.set(false)" class="text-gray-500 hover:bg-gray-200 bg-white border border-gray-200 w-8 h-8 rounded-full flex items-center justify-center font-bold">✕</button>
               </div>
               <div class="p-4 overflow-y-auto max-h-[70vh] flex flex-col gap-4 bg-gray-100/50 custom-scrollbar">
                 @for(img of viewReceiptImages(); track $index) {
                   <img [src]="getSafeDriveImage(img)" (error)="handleImageError($event)" class="w-full rounded-xl border border-gray-200 shadow-sm bg-white p-1">
                 }
                 @if(viewReceiptImages().length === 0) {
                   <div class="text-center text-gray-400 py-10 font-bold bg-white rounded-xl border border-dashed border-gray-200">買手未附上收據照片</div>
                 }
               </div>
            </div>
          </div>
        }

        @if (actionModalOrder(); as o) { 
          <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1000] flex items-center justify-center p-4"> 
            <div class="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-fade-in flex flex-col max-h-[90vh]" (click)="$event.stopPropagation()"> 
              
              <div class="p-6 border-b border-gray-100 bg-gray-50 shrink-0"> 
                <h3 class="text-xl font-bold text-gray-800 flex items-center gap-2"> <span>⚡️ 操作訂單</span> <span class="font-mono text-gray-400">#{{ o.id }}</span> </h3> 
                <div class="flex gap-2 mt-2"> 
                  <span [class]="getPaymentStatusClass(o.status)" class="px-2 py-1 rounded text-xs font-bold border border-transparent">{{ getPaymentStatusLabel(o.status, o.paymentMethod) }}</span> 
                  <span [class]="getShippingStatusClass(o.status)" class="px-2 py-1 rounded text-xs font-bold border border-transparent">{{ getShippingStatusLabel(o.status) }}</span> 
                </div> 
              </div> 

              <div class="overflow-y-auto flex-1 custom-scrollbar p-6 bg-white">
                 
                 <div class="text-sm font-bold text-gray-700 mb-3 border-l-4 border-brand-400 pl-2">客戶與收件資訊</div>
                 <div class="text-xs text-gray-600 mb-6 grid grid-cols-2 gap-2 items-start bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div><span class="text-gray-400">訂購人:</span> {{ o.userName }}</div>
                    <div><span class="text-gray-400">電話:</span> {{ $any(o).userPhone || '無' }}</div>
                    <div class="col-span-2"><span class="text-gray-400">Email:</span> {{ o.userEmail || '無' }}</div>

                    <div class="col-span-2 mt-2 pt-2 border-t border-gray-200"><span class="text-gray-400">收件人:</span> {{ $any(o).shippingName || o.userName }}</div>
                    <div><span class="text-gray-400">收件電話:</span> {{ $any(o).shippingPhone || $any(o).userPhone || '無' }}</div>
                    <div class="col-span-2"><span class="text-gray-400">收件地址:</span> {{ $any(o).shippingAddress || '無' }}</div>

                    <div class="col-span-2 mt-2 pt-2 border-t border-gray-200"></div>
                    <div><span class="text-gray-400">付款:</span> {{ getPaymentLabel(o.paymentMethod) }}</div>
                    <div><span class="text-gray-400">物流:</span> {{ getShippingLabel(o.shippingMethod) }}</div>

                    @if(o.paymentMethod === 'bank_transfer' || o.paymentLast5) {
                       <div class="col-span-2 flex flex-col sm:flex-row sm:items-center gap-2 mt-2 p-3 bg-blue-100/50 rounded-lg border border-blue-200">
                          <span class="text-blue-700 font-bold shrink-0">匯款後五碼:</span>
                          <input type="text" [value]="o.paymentLast5 || ''" (change)="updatePaymentLast5(o, $event)" placeholder="可手動幫客人填寫" class="w-full sm:w-32 px-2 py-1.5 rounded border border-blue-300 text-sm focus:outline-none focus:border-blue-500 bg-white text-brand-900 font-mono font-bold">
                          @if(o.paymentName) { <span class="text-[10px] text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">戶名: {{ o.paymentName }}</span> }
                       </div>
                    }
                 </div>

                 <div class="bg-yellow-50 p-4 rounded-xl border border-yellow-200 mb-6">
                    <div class="flex justify-between items-center mb-2">
                       <span class="text-sm font-bold text-yellow-800 flex items-center gap-1"><span>📝</span> 內部備註 (僅管理員可見)</span>
                       <button (click)="saveOrderNote(o, orderNoteInput.value)" class="text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1.5 rounded-lg font-bold shadow-sm transition-colors active:scale-95">儲存備註</button>
                    </div>
                    <textarea #orderNoteInput [value]="$any(o).note || ''" rows="2" placeholder="例如：出貨需退款 20 元賣貨便運費給客人..." class="w-full p-2 border border-yellow-300 rounded-lg focus:outline-none focus:border-yellow-500 text-sm custom-scrollbar bg-white"></textarea>
                 </div>
                 
                 <div class="flex justify-between items-center mb-3">
                    <div class="text-sm font-bold text-gray-700 border-l-4 border-brand-400 pl-2">訂單明細</div>
                    @if(o.items.length > 1) {
                       <button (click)="toggleSplitMode()" class="text-xs bg-gray-100 px-3 py-1.5 rounded-lg font-bold text-gray-600 hover:bg-gray-200 transition-colors shadow-sm">
                         {{ isSplittingOrder() ? '取消拆單' : '✂️ 拆分此訂單' }}
                       </button>
                    }
                 </div>
                 
                 <div class="space-y-3 mb-6">
                    @for(item of o.items; track item.productId + item.option; let i = $index) {
                       <div class="flex items-start gap-3 bg-white p-3 rounded-xl border shadow-sm transition-all cursor-pointer"
                            [class.border-gray-200]="!splitItemIndices().has(i)"
                            [class.border-brand-500]="splitItemIndices().has(i)"
                            [class.bg-brand-50]="splitItemIndices().has(i)"
                            (click)="isSplittingOrder() ? toggleSplitItem(i) : null">
                          
                          @if(isSplittingOrder()) {
                             <input type="checkbox" [checked]="splitItemIndices().has(i)" class="mt-4 w-4 h-4 text-brand-600 pointer-events-none shrink-0">
                          }
                          <img [src]="item.productImage" class="w-12 h-12 rounded-lg object-cover bg-gray-100 shrink-0 border border-gray-100">
                          <div class="flex-1 min-w-0 flex flex-col gap-1">
                             <div class="text-sm font-bold text-gray-800 leading-snug whitespace-normal break-all">{{ item.productName }}</div>
                             <div class="text-xs text-gray-500">{{ item.option }}</div>
                          </div>
                          <div class="text-right shrink-0 flex flex-col items-end gap-1">
                             <div class="text-sm font-bold text-brand-900">NT$ {{ item.price }}</div>
                             <div class="text-xs text-gray-500">x{{ item.quantity }}</div>
                          </div>
                       </div>
                    }

                    @if(isSplittingOrder()) {
                       <div class="p-3 bg-brand-900 rounded-xl mb-4 shadow-lg flex justify-between items-center animate-fade-in mt-4">
                          <span class="text-sm font-bold text-white">已選 {{ splitItemIndices().size }} 件商品移至新單</span>
                          <button (click)="confirmSplitOrder(o)" [disabled]="splitItemIndices().size === 0 || splitItemIndices().size === o.items.length" class="px-4 py-2 bg-white text-brand-900 text-xs font-black rounded-lg disabled:opacity-50 transition-transform active:scale-95">確認拆分</button>
                       </div>
                    } @else {
                       <div class="px-2 pt-3 border-t border-gray-200 space-y-1 mt-2">
                          <div class="flex justify-between text-sm text-gray-500"><span>商品小計</span><span>NT$ {{ o.subtotal }}</span></div>
                          @if(o.discount > 0) { <div class="flex justify-between text-sm text-red-500 font-bold"><span>多入優惠/運費補貼</span><span>- NT$ {{ o.discount }}</span></div> }
                          @if(o.promoDiscount) { <div class="flex justify-between text-sm text-brand-600 font-bold"><span>🎟️ 折扣碼 ({{ o.promoCode }})</span><span>- NT$ {{ o.promoDiscount }}</span></div> }
                          @if(o.usedCredits > 0) { <div class="flex justify-between text-sm text-purple-600 font-bold"><span>💎 購物金折抵</span><span>- NT$ {{ o.usedCredits }}</span></div> }
                          @if(o.shippingFee > 0) { <div class="flex justify-between text-sm text-gray-500"><span>運費</span><span>+ NT$ {{ o.shippingFee }}</span></div> }
                          <div class="flex justify-between items-center font-black text-brand-900 text-lg pt-2 mt-2 border-t border-gray-100">
                             <span>總付款金額</span>
                             <span>NT$ {{ o.finalTotal }}</span>
                          </div>
                       </div>
                    }
                 </div>
              
                 <div class="grid grid-cols-1 sm:grid-cols-2 gap-4"> 
                   <button (click)="store.notifyArrival(o)" class="p-4 rounded-2xl bg-purple-50 hover:bg-purple-100 border border-purple-100 text-left transition-colors flex items-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed">
                      <div class="text-2xl group-hover:scale-110 transition-transform w-fit text-purple-600">🚛</div>
                      <div><div class="font-bold text-purple-900">通知貨到</div><div class="text-[10px] text-purple-500">發送 Email/TG</div></div>
                   </button>

                   <button (click)="doMyshipPickup(o)" class="p-4 rounded-2xl bg-teal-50 hover:bg-teal-100 border border-teal-100 text-left transition-colors flex items-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed" [disabled]="o.status === 'picked_up' || o.status === 'completed' || o.status === 'cancelled'">
                      <div class="text-2xl group-hover:scale-110 transition-transform w-fit text-teal-600">🏪</div>
                      <div><div class="font-bold text-teal-900">確認取貨</div><div class="text-[10px] text-teal-500">標記買家已於門市取件</div></div>
                   </button>

                   <button (click)="doShip(o)" class="p-4 rounded-2xl bg-blue-50 hover:bg-blue-100 border border-blue-100 text-left transition-colors flex items-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed" [disabled]="o.status === 'shipped' || o.status === 'picked_up' || o.status === 'pending_payment' || o.status === 'unpaid_alert' || o.status === 'refund_needed' || o.status === 'refunded' || o.status === 'completed' || o.status === 'cancelled'"> 
                      <div class="text-2xl group-hover:scale-110 transition-transform w-fit text-blue-600">📦</div> 
                      <div><div class="font-bold text-blue-900">安排出貨</div> <div class="text-[10px] text-blue-500">標記為已出貨</div> </div> 
                   </button> 

                   <button (click)="doConfirm(o)" class="p-4 rounded-2xl bg-green-50 hover:bg-green-100 border border-green-100 text-left transition-colors flex items-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed" [disabled]="o.status !== 'paid_verifying' && o.status !== 'pending_payment' && o.status !== 'unpaid_alert'"> 
                      <div class="text-2xl group-hover:scale-110 transition-transform w-fit text-green-600">✅</div> 
                      <div><div class="font-bold text-green-900">確認收款</div> <div class="text-[10px] text-green-500">轉為已付款</div> </div> 
                   </button> 

                   <button (click)="doAlert(o)" class="p-4 rounded-2xl bg-orange-50 hover:bg-orange-100 border border-orange-100 text-left transition-colors flex items-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed" [disabled]="o.status !== 'pending_payment' && o.status !== 'unpaid_alert' && o.status !== 'paid_verifying'"> 
                      <div class="text-2xl group-hover:scale-110 transition-transform w-fit text-orange-600">🔔</div> 
                      <div><div class="font-bold text-orange-900">提醒付款</div> <div class="text-[10px] text-orange-500">發送提醒通知</div> </div> 
                   </button> 

                   <button (click)="doRefundNeeded(o)" class="p-4 rounded-2xl bg-red-50 hover:bg-red-100 border border-red-100 text-left transition-colors flex items-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed" [disabled]="o.status === 'refunded' || o.status === 'refund_needed' || o.status === 'shipped' || o.status === 'picked_up' || o.status === 'cancelled'"> 
                      <div class="text-2xl group-hover:scale-110 transition-transform w-fit text-red-600">⚠️</div> 
                      <div><div class="font-bold text-red-900">缺貨/需退款</div> <div class="text-[10px] text-red-500">標記為問題訂單</div> </div> 
                   </button> 

                   <button (click)="doRefundDone(o)" class="col-span-1 sm:col-span-2 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-100 text-left transition-colors flex items-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed" [disabled]="o.status === 'refunded' || o.status === 'cancelled'"> 
                      <div class="text-2xl group-hover:scale-110 transition-transform w-fit text-gray-600">💸</div> 
                      <div><div class="font-bold text-gray-800">確認已退款</div> <div class="text-[10px] text-gray-500">強制結案並標記為已退款</div> </div> 
                   </button> 

                   <button (click)="quickComplete($event, o)" class="col-span-1 sm:col-span-2 p-4 rounded-2xl bg-green-800 hover:bg-green-900 border border-green-700 text-left transition-colors flex items-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed" [disabled]="(o.status !== 'shipped' && o.status !== 'picked_up') || o.paymentMethod !== 'cod'"> 
                      <div class="text-2xl group-hover:scale-110 transition-transform w-fit text-white">💰</div> 
                      <div><div class="font-bold text-white">確認已收款 (COD)</div> <div class="text-[10px] text-green-200">貨到付款專用：確認物流已撥款</div> </div> 
                   </button> 

                   <button (click)="doCancel(o)" class="col-span-1 sm:col-span-2 text-xs font-bold py-3 border-t border-gray-100 transition-colors flex justify-center items-center rounded-lg" [class.bg-red-500]="cancelConfirmState()" [class.text-white]="cancelConfirmState()" [class.hover:bg-red-600]="cancelConfirmState()" [class.text-gray-400]="!cancelConfirmState()" [class.hover:text-red-500]="!cancelConfirmState()" [class.hover:bg-red-50]="!cancelConfirmState()" [disabled]="o.status === 'cancelled' || o.status === 'shipped' || o.status === 'picked_up' || o.status === 'completed'"> {{ cancelConfirmState() ? '⚠️ 確定要取消嗎？(點擊確認)' : '🚫 取消訂單 (保留紀錄但標記為取消)' }} </button> 
                   
                   <button (click)="doDeleteOrder(o)" class="col-span-1 sm:col-span-2 text-xs font-bold py-3 transition-colors flex justify-center items-center rounded-lg bg-white border border-red-100 text-red-300 hover:bg-red-50 hover:text-red-500 hover:border-red-200">
                     🗑️ 徹底刪除訂單 (測試用)
                   </button>
                 </div> 
              </div>
              
              <div class="p-4 bg-gray-50 border-t border-gray-100 shrink-0"> <button (click)="closeActionModal()" class="w-full py-3 rounded-xl bg-white border border-gray-200 text-gray-600 font-bold hover:bg-gray-100 transition-colors"> 關閉 </button> </div> 
            </div> 
          </div> 
        }

        @if (showWalletModal()) {
          <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" (click)="closeWalletModal()">
            <div class="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-bounce-in" (click)="$event.stopPropagation()">
              <div class="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 class="text-xl font-bold text-gray-800">
                  {{ walletAction() === 'add' ? '💰 新增資金 (儲值)' : '💸 提領資金 (扣款)' }}
                </h3>
                <button (click)="closeWalletModal()" class="w-8 h-8 rounded-full bg-gray-200 text-gray-600 font-bold hover:bg-gray-300">✕</button>
              </div>
              <div class="p-6">
                <div class="mb-4 text-center">
                  <div class="text-sm font-bold text-gray-500 mb-1">目標帳戶</div>
                  <div class="text-lg font-black text-brand-900">{{ activeWallet()?.name }} ({{ activeWallet()?.currency }})</div>
                </div>
                <form [formGroup]="walletForm" class="space-y-4">
                  <div>
                    <label class="block text-xs font-bold text-gray-500 mb-1">金額 ({{ activeWallet()?.symbol }})</label>
                    <input type="number" formControlName="amount" class="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-400 font-black text-lg text-center" placeholder="請輸入金額">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-gray-500 mb-1">備註 (選填)</label>
                    <input type="text" formControlName="note" class="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-400 text-sm" placeholder="例如：股東注資、盈餘提撥">
                  </div>
                </form>
              </div>
              <div class="p-4 border-t border-gray-100 flex gap-2">
                <button (click)="closeWalletModal()" class="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200">取消</button>
                <button (click)="submitWalletAction()" [disabled]="walletForm.invalid" class="flex-1 py-3 rounded-xl text-white font-bold transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed" [class.bg-green-600]="walletAction() === 'add'" [class.hover:bg-green-700]="walletAction() === 'add'" [class.bg-red-600]="walletAction() === 'deduct'" [class.hover:bg-red-700]="walletAction() === 'deduct'">
                  確認送出
                </button>
              </div>
            </div>
          </div>
        }

        @if (showAddWalletModal()) {
          <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" (click)="closeAddWalletModal()">
            <div class="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-bounce-in" (click)="$event.stopPropagation()">
              <div class="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 class="text-xl font-bold text-gray-800">🏦 新增資金帳戶</h3>
                <button (click)="closeAddWalletModal()" class="w-8 h-8 rounded-full bg-gray-200 text-gray-600 font-bold hover:bg-gray-300">✕</button>
              </div>
              <div class="p-6">
                <form [formGroup]="addWalletForm" class="space-y-4">
                  <div>
                    <label class="block text-xs font-bold text-gray-500 mb-1">帳戶名稱</label>
                    <input type="text" formControlName="name" class="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-400 text-sm font-bold" placeholder="例如：日幣營運資金">
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-xs font-bold text-gray-500 mb-1">幣別代碼</label>
                      <input type="text" formControlName="currency" class="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-400 text-sm font-bold uppercase" placeholder="JPY">
                    </div>
                    <div>
                      <label class="block text-xs font-bold text-gray-500 mb-1">符號</label>
                      <input type="text" formControlName="symbol" class="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-400 text-sm font-bold" placeholder="¥">
                    </div>
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-gray-500 mb-1">初始餘額</label>
                    <input type="number" formControlName="balance" class="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-400 font-black text-lg" placeholder="0">
                  </div>
                </form>
              </div>
              <div class="p-4 border-t border-gray-100 flex gap-2">
                <button (click)="closeAddWalletModal()" class="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200">取消</button>
                <button (click)="submitAddWallet()" class="flex-1 py-3 rounded-xl bg-brand-900 text-white font-bold hover:bg-black transition-transform active:scale-95">確認新增</button>
              </div>
            </div>
          </div>
        }

        @if (showWalletDetailsModal()) {
          <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" (click)="closeWalletDetails()">
            <div class="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up" (click)="$event.stopPropagation()">
              <div class="p-4 sm:p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
                <div class="flex items-center gap-3">
                   <h3 class="text-lg sm:text-xl font-bold text-gray-800">📄 {{ detailsWallet()?.name }} 交易明細</h3>
                   <span class="hidden sm:inline-block bg-white px-2 py-1 rounded-lg text-xs font-bold text-gray-500 shadow-sm border border-gray-200">目前餘額: {{ detailsWallet()?.symbol }} {{ detailsWallet()?.balance | number }}</span>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                   <button (click)="exportWalletDetailsCSV()" class="px-3 py-1.5 bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-lg text-xs font-bold transition-colors border border-brand-200 shadow-sm flex items-center gap-1"><span>📥</span> 匯出</button>
                   <button (click)="syncWalletDetailsToGoogleSheets()" class="px-3 py-1.5 bg-[#E5B5B5] text-white hover:bg-[#D4A0A0] rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center gap-1"><span>☁️</span> 同步</button>
                   <button (click)="closeWalletDetails()" class="w-8 h-8 rounded-full bg-gray-200 text-gray-600 font-bold hover:bg-gray-300 flex items-center justify-center">✕</button>
                </div>
              </div>
              <div class="p-0 sm:p-6 overflow-y-auto flex-1 custom-scrollbar bg-gray-50/50">
                 <div class="overflow-x-auto w-full custom-scrollbar">
                    <table class="w-full text-sm text-left whitespace-nowrap block md:table">
                       <thead class="bg-gray-100 text-gray-500 font-bold hidden md:table-header-group">
                          <tr>
                             <th class="p-3 rounded-tl-lg">日期</th>
                             <th class="p-3">類別</th>
                             <th class="p-3">項目說明</th>
                             <th class="p-3">操作人</th>
                             <th class="p-3 text-right rounded-tr-lg">收支金額 ({{ detailsWallet()?.symbol }})</th>
                          </tr>
                       </thead>
                       <tbody class="block md:table-row-group divide-y-0 md:divide-y md:divide-gray-100">
                          @for(t of walletTransactions(); track t.id) {
                             <tr class="hover:bg-white transition-colors block md:table-row bg-white border border-gray-200 md:border-none rounded-[1rem] md:rounded-none mb-3 md:mb-0 shadow-sm md:shadow-none p-2 md:p-0 mx-2 md:mx-0 mt-2 md:mt-0">
                                <td class="p-3 flex justify-between md:table-cell border-b border-gray-50 md:border-none"><span class="md:hidden text-xs text-gray-400 font-bold">日期</span><span class="text-gray-500 font-mono">{{ t.date }}</span></td>
                                <td class="p-3 flex justify-between md:table-cell border-b border-gray-50 md:border-none"><span class="md:hidden text-xs text-gray-400 font-bold">類別</span><span class="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold">{{ t.category }}</span></td>
                                <td class="p-3 flex flex-col md:table-cell border-b border-gray-50 md:border-none"><span class="md:hidden text-xs text-gray-400 font-bold mb-1">項目</span><span class="font-bold text-gray-800 whitespace-normal break-all line-clamp-2 md:truncate md:max-w-[200px] block" [title]="t.item">{{ t.item }}</span></td>
                                <td class="p-3 flex justify-between md:table-cell border-b border-gray-50 md:border-none"><span class="md:hidden text-xs text-gray-400 font-bold">操作人</span><span class="text-gray-600 text-xs">{{ t.payer }}</span></td>
                                <td class="p-3 flex justify-between items-center md:table-cell md:text-right font-black" [class.text-green-600]="t.amount < 0" [class.text-red-500]="t.amount > 0">
                                   <span class="md:hidden text-xs text-gray-400 font-bold">金額</span>
                                   <span>{{ t.amount < 0 ? '+' : '-' }} {{ (t.amount < 0 ? -t.amount : t.amount) | number }}</span>
                                </td>
                             </tr>
                          } @empty {
                             <tr><td colspan="5" class="p-8 text-center text-gray-400 font-bold block md:table-cell">此帳戶目前無任何交易紀錄</td></tr>
                          }
                       </tbody>
                    </table>
                 </div>
              </div>
            </div>
          </div>
        }

        @if (showExpenseModal()) {
          <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" (click)="closeExpenseModal()">
            <div class="bg-white rounded-[2rem] shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-slide-up" (click)="$event.stopPropagation()">
              <div class="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
                <h3 class="text-xl font-bold text-gray-800">{{ editingExpense() ? '📝 編輯營業支出' : '💸 新增營業支出' }}</h3>
                <button (click)="closeExpenseModal()" class="w-8 h-8 rounded-full bg-gray-200 text-gray-600 font-bold hover:bg-gray-300">✕</button>
              </div>
              <div class="p-6 overflow-y-auto flex-1 custom-scrollbar">
<form [formGroup]="expenseForm" class="space-y-5">
                  
                  <div class="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-2">
                     <label class="block text-xs font-bold text-gray-500 mb-2">收據/證明照片 (選填)</label>
                     <div class="flex flex-col sm:flex-row items-center gap-3">
                        @if(expenseForm.get('imageUrl')?.value) {
                           <div class="w-full sm:w-20 h-32 sm:h-20 rounded-lg overflow-hidden border border-gray-200 relative group shrink-0">
                              <img [src]="getSafeDriveImage(expenseForm.get('imageUrl')?.value)" class="w-full h-full object-cover">
                              <button type="button" (click)="expenseForm.patchValue({imageUrl: ''})" class="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold">移除</button>
                           </div>
                        }
                        <label class="w-full cursor-pointer px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 hover:border-brand-300 transition-colors shadow-sm flex items-center justify-center gap-2">
                           @if(isUploadingExpImage()) { <span class="animate-pulse">⏳ 壓縮上傳中...</span> }
                           @else { <span>📸 點擊上傳收據相片</span> }
                           <input type="file" accept="image/*" class="hidden" (change)="uploadExpenseImage($event)" [disabled]="isUploadingExpImage()">
                        </label>
                     </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-xs font-bold text-gray-500 mb-1">日期</label>
                      <input type="date" formControlName="date" class="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-400 text-sm font-bold">
                    </div>
                    <div>
                      <label class="block text-xs font-bold text-gray-500 mb-1">支出類別</label>
                      <div class="flex flex-col gap-2">
                         <select [ngModel]="expenseForm.get('category')?.value" (ngModelChange)="onExpCategoryChange($event)" [ngModelOptions]="{standalone: true}" class="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-400 text-sm font-bold bg-white cursor-pointer bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20fill=%22none%22%20viewBox=%220%200%2020%2020%22%20stroke=%22%236b7280%22%3E%3Cpath%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22%20stroke-width=%222%22%20d=%22M5%207l5%205%205-5%22/%3E%3C/svg%3E')] bg-[length:1.25rem_1.25rem] bg-[position:right_0.5rem_center] bg-no-repeat appearance-none pr-8">
                            <option value="" disabled selected>請選擇類別...</option>
                            <option value="包材費">包材費</option>
                            <option value="國際貨運費">國際貨運費</option>
                            <option value="機票費">機票/行李</option>
                            <option value="海關稅">海關稅金</option>
                            <option value="行銷抽獎">行銷抽獎</option>
                            <option value="其他雜支">其他雜支</option>
                            @for(cat of uniqueExpenseCategories(); track cat) {
                               @if(cat !== '商品採購' && cat !== '儲值' && !['包材費','國際貨運費','機票費','海關稅','行銷抽獎','其他雜支'].includes(cat)) {
                                  <option [value]="cat">{{ cat }}</option>
                               }
                            }
                            <option value="NEW">➕ 自訂新類別...</option>
                         </select>
                         @if(isAddingNewExpCategory()) {
                            <input type="text" formControlName="category" placeholder="輸入自訂類別" class="w-full p-3 border border-brand-300 rounded-xl bg-white focus:outline-none focus:border-brand-500 animate-fade-in text-sm font-bold shadow-inner">
                         }
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label class="block text-xs font-bold text-gray-500 mb-1">支出項目 (品項/摘要)</label>
                    <input type="text" formControlName="item" class="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-400 text-sm font-bold" placeholder="例如：打包破壞袋500個">
                  </div>
                  
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-red-50 p-4 rounded-xl border border-red-100">
                    <div>
                      <label class="block text-xs font-bold text-red-600 mb-1">扣款幣別 (錢包)</label>
                      <select formControlName="currency" class="w-full p-3 border border-red-200 rounded-xl focus:outline-none focus:border-red-400 text-sm font-bold bg-white cursor-pointer bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20fill=%22none%22%20viewBox=%220%200%2020%2020%22%20stroke=%22%23ef4444%22%3E%3Cpath%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22%20stroke-width=%222%22%20d=%22M5%207l5%205%205-5%22/%3E%3C/svg%3E')] bg-[length:1.25rem_1.25rem] bg-[position:right_0.5rem_center] bg-no-repeat appearance-none pr-8 text-red-800">
                        <option value="" disabled selected>請選擇幣別...</option>
                        <option value="TWD">台幣 (TWD)</option>
                        <option value="KRW">韓元 (KRW)</option>
                        <option value="JPY">日幣 (JPY)</option>
                        <option value="CNY">人民幣 (CNY)</option>
                        <option value="THB">泰銖 (THB)</option>
                        <option value="USD">美金 (USD)</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-xs font-bold text-red-600 mb-1">金額</label>
                      <input type="number" formControlName="amount" class="w-full p-3 border border-red-200 rounded-xl focus:outline-none focus:border-red-400 text-xl font-black text-red-600" placeholder="0">
                    </div>
                  </div>
                  
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-xs font-bold text-gray-500 mb-1">付款人</label>
                      <select formControlName="payer" class="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-400 text-sm font-bold bg-white cursor-pointer shadow-sm bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20fill=%22none%22%20viewBox=%220%200%2020%2020%22%20stroke=%22%236b7280%22%3E%3Cpath%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22%20stroke-width=%222%22%20d=%22M5%207l5%205%205-5%22/%3E%3C/svg%3E')] bg-[length:1.25rem_1.25rem] bg-[position:right_0.5rem_center] bg-no-repeat appearance-none pr-8">
                        <option value="" disabled selected>請選擇付款人...</option>
                        <option value="公司">🏢 公司公積金</option>
                        <option value="藝辰">👧🏻 藝辰</option>
                        <option value="子婷">👩🏻 子婷</option>
                        <option value="小芸">👱🏻‍♀️ 小芸</option>
                        <option value="其他">其他</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-xs font-bold text-gray-500 mb-1">備註 (選填)</label>
                      <input type="text" formControlName="note" class="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-400 text-sm" placeholder="其他說明">
                    </div>
                  </div>

                  <label class="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200 cursor-pointer mt-4">
                    <input type="checkbox" formControlName="isHistorical" class="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 shrink-0">
                    <div class="flex flex-col">
                      <span class="font-bold text-blue-900 text-sm">純紀錄 / 歷史補登</span>
                      <span class="text-[10px] text-blue-600">打勾後，這筆支出僅列入報表，不會扣除資金帳戶餘額</span>
                    </div>
                  </label>
                </form>              </div>
              <div class="p-6 border-t border-gray-100 bg-white shrink-0">
                <button (click)="submitExpense()" [disabled]="expenseForm.invalid || isUploadingExpImage()" class="w-full py-3 rounded-xl bg-brand-900 text-white font-bold text-lg hover:bg-black transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                  {{ editingExpense() ? '確認儲存修改' : '確認記帳並扣除餘額' }}
                </button>
              </div>
            </div>
          </div>
        }

        @if (showGiveawayModal()) {
          <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" (click)="closeGiveawayModal()">
            <div class="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-slide-up" (click)="$event.stopPropagation()">
              <div class="p-6 border-b border-gray-100 bg-purple-50 flex justify-between items-center shrink-0">
                <h3 class="text-xl font-bold text-purple-900 flex items-center gap-2"><span>🎁</span> 建立行銷 / 抽獎單</h3>
                <button (click)="closeGiveawayModal()" class="w-8 h-8 rounded-full bg-purple-200/50 text-purple-700 font-bold hover:bg-purple-200">✕</button>
              </div>
              <div class="p-6 overflow-y-auto flex-1 custom-scrollbar">
                <div class="mb-4 p-3 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold leading-relaxed">
                  💡 說明：此訂單金額為 $0，不計入營業額。<br>系統將自動扣除商品庫存，並將商品成本認列至「營業支出-行銷抽獎」。
                </div>
                <form [formGroup]="giveawayForm" class="space-y-4">
                  <div>
                    <label class="block text-xs font-bold text-gray-500 mb-1">選擇贈品 / 商品</label>
                    <select formControlName="productId" (change)="onGiveawayProductChange($event)" class="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 text-sm font-bold bg-gray-50 cursor-pointer">
                      <option value="" disabled selected>請選擇商品...</option>
                      @for(p of activeProducts(); track p.id) {
                        <option [value]="p.id">{{ p.name }} (庫存: {{ p.stock >= 9999 ? '無限' : p.stock }})</option>
                      }
                    </select>
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-xs font-bold text-gray-500 mb-1">規格</label>
                      <select formControlName="option" class="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 text-sm font-bold bg-white">
                        @if (giveawaySelectedProduct(); as sp) {
                           @for(opt of sp.options; track opt) {
                             <option [value]="opt.split('=')[0].trim()">{{ opt.split('=')[0].trim() }}</option>
                           }
                           @if (!sp.options || sp.options.length === 0) { <option value="單一規格">單一規格</option> }
                        } @else {
                           <option value="單一規格">單一規格</option>
                        }
                      </select>
                    </div>
                    <div>
                      <label class="block text-xs font-bold text-gray-500 mb-1">贈送數量</label>
                      <input type="number" formControlName="quantity" class="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 text-sm font-bold text-center">
                    </div>
                  </div>
                  <div class="border-t border-gray-100 pt-4 mt-2">
                   <label class="block text-xs font-bold text-brand-600 mb-1">併入現有訂單 (選填)</label>
                   <input type="text" formControlName="targetOrderId" class="w-full p-3 border border-brand-200 rounded-xl focus:outline-none focus:border-brand-400 text-sm font-bold mb-4" placeholder="例如：240315123456 (若填寫，將直接把贈品加入該單)">

                  <label class="block text-xs font-bold text-gray-500 mb-1">中獎者 / 收件人姓名</label>
                    <input type="text" formControlName="winnerName" class="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 text-sm font-bold" placeholder="例如：王小明 或 IG 帳號">
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-xs font-bold text-gray-500 mb-1">連絡電話</label>
                      <input type="text" formControlName="winnerPhone" class="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 text-sm">
                    </div>
                    <div>
                      <label class="block text-xs font-bold text-gray-500 mb-1">收件門市 / 地址</label>
                      <input type="text" formControlName="shippingAddress" class="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 text-sm">
                    </div>
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-gray-500 mb-1">抽獎活動備註</label>
                    <input type="text" formControlName="note" class="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 text-sm" placeholder="例如：9月粉絲同樂抽獎">
                  </div>
                </form>
              </div>
              <div class="p-6 border-t border-gray-100 bg-white shrink-0">
                <button (click)="submitGiveawayOrder()" [disabled]="giveawayForm.invalid || !giveawaySelectedProduct()" class="w-full py-3 rounded-xl bg-purple-600 text-white font-bold text-lg hover:bg-purple-700 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                  確認建立 $0 抽獎單
                </button>
              </div>
            </div>
          </div>
        }

        @if (showBulkCustomerModal()) {
          <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" (click)="showBulkCustomerModal.set(false)">
            <div class="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-bounce-in" (click)="$event.stopPropagation()">
              <div class="p-6 border-b border-gray-100 bg-blue-50 flex justify-between items-center">
                <h3 class="text-xl font-bold text-blue-900">⚡️ 批次操作客戶</h3>
                <button (click)="showBulkCustomerModal.set(false)" class="w-8 h-8 rounded-full bg-blue-200/50 text-blue-700 font-bold hover:bg-blue-200">✕</button>
              </div>
              <div class="p-6 space-y-4">
                <div class="text-center mb-2">
                  <span class="text-sm text-gray-500 font-bold">已選擇</span>
                  <div class="text-3xl font-black text-brand-900">{{ selectedCustomerIds().length }} <span class="text-sm text-gray-400 font-bold">人</span></div>
                </div>
                
                <div>
                  <label class="block text-xs font-bold text-gray-500 mb-1">執行動作</label>
                  <select [ngModel]="bulkActionType()" (ngModelChange)="bulkActionType.set($event)" class="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 text-sm font-bold bg-white">
                    <option value="credits">💰 批次發放購物金</option>
                    <option value="vip">🌟 批次升級為 VIP</option>
                  </select>
                </div>

                @if(bulkActionType() === 'credits') {
                  <div class="animate-fade-in space-y-4">
                    <div>
                      <label class="block text-xs font-bold text-blue-600 mb-1">發放金額 ($)</label>
                      <input type="number" [ngModel]="bulkCreditAmount()" (ngModelChange)="bulkCreditAmount.set($event)" class="w-full p-3 border border-blue-200 rounded-xl focus:outline-none focus:border-blue-400 text-lg font-black text-blue-700" placeholder="0">
                    </div>
                  </div>
                }
              </div>
              <div class="p-6 border-t border-gray-100 bg-white">
                <button (click)="submitBulkAction()" class="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 transition-transform active:scale-95">
                  確認執行
                </button>
              </div>
            </div>
          </div>
        }

        
          @if (showPromoModal()) {
          <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" (click)="showPromoModal.set(false)">
            <div class="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-bounce-in" (click)="$event.stopPropagation()">
              <div class="p-6 border-b border-gray-100 bg-pink-50 flex justify-between items-center">
                <h3 class="text-xl font-bold text-pink-900">🎟️ {{ editingPromoIndex() !== null ? '編輯' : '新增' }}折扣碼</h3>
                <button type="button" (click)="showPromoModal.set(false)" class="w-8 h-8 rounded-full bg-pink-200 text-pink-700 font-bold hover:bg-pink-300">✕</button>
              </div>
              <div class="p-6">
                <form [formGroup]="promoForm" class="space-y-4">
                  <div>
                    <label class="block text-xs font-bold text-gray-500 mb-1">折扣代碼 (客戶輸入用)</label>
                    <input type="text" formControlName="code" class="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-400 uppercase font-black tracking-widest text-center" placeholder="如: VIP99">
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="block text-xs font-bold text-gray-500 mb-1">優惠類型</label>
                      <select formControlName="type" class="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-400 text-sm font-bold bg-white">
                        <option value="amount">扣減金額 ($)</option>
                        <option value="percent">全單打折 (%)</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-xs font-bold text-gray-500 mb-1">數值 (如:50 / 88折)</label>
                      <input type="number" formControlName="value" class="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-400 text-sm font-bold">
                    </div>
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-gray-500 mb-1">低消門檻 (0為不限)</label>
                    <input type="number" formControlName="minSpend" class="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-400 text-sm font-bold">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-gray-500 mb-1">活動備註 (僅管理員可見)</label>
                    <input type="text" formControlName="note" class="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-400 text-sm" placeholder="如: 情人節活動">
                  </div>
                  <label class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
                    <input type="checkbox" formControlName="active" class="w-5 h-5 rounded text-pink-600 focus:ring-pink-500">
                    <span class="font-bold text-gray-700">啟用此折扣碼</span>
                  </label>
                </form>
              </div>
              <div class="p-6 border-t border-gray-100 bg-white">
                <button type="button" (click)="savePromo()" [disabled]="promoForm.invalid" class="w-full py-3 rounded-xl bg-pink-600 text-white font-bold text-lg hover:bg-pink-700 transition-transform active:scale-95 disabled:opacity-50">
                  確認儲存
                </button>
              </div>
            </div>
          </div>
        }
          @if (showTrashModal()) {
          <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" (click)="showTrashModal.set(false)">
            <div class="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-bounce-in" (click)="$event.stopPropagation()">
              <div class="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
                <h3 class="text-xl font-bold text-gray-800 flex items-center gap-2"><span>🗑️</span> 垃圾桶 (保留 30 天)</h3>
                <button (click)="showTrashModal.set(false)" class="w-8 h-8 rounded-full bg-gray-200 text-gray-600 font-bold hover:bg-gray-300 flex items-center justify-center">✕</button>
              </div>
              <div class="p-4 overflow-y-auto flex-1 custom-scrollbar space-y-3 bg-gray-50/50">
                @for(p of deletedProducts(); track p.id) {
                  <div class="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-gray-300 transition-colors">
                    <div class="flex items-center gap-3 min-w-0 flex-1">
                      <img [src]="p.image" (error)="handleImageError($event)" class="w-12 h-12 rounded-lg object-cover border border-gray-100 shrink-0 mix-blend-multiply">
                      <div class="min-w-0">
                        <div class="font-bold text-gray-800 truncate text-sm" [title]="p.name">{{ p.name }}</div>
                        <div class="text-[10px] text-red-400 font-mono mt-0.5 font-bold">刪除於: {{ $any(p).deletedAt | date:'yyyy/MM/dd' }}</div>
                      </div>
                    </div>
                    <div class="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <button (click)="restoreProduct(p)" class="px-4 py-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg text-xs font-bold transition-colors shadow-sm">↩️ 復原</button>
                      <button (click)="forceDeleteProduct(p)" class="px-4 py-2 bg-white text-red-400 hover:text-red-600 hover:bg-red-50 border border-red-100 rounded-lg text-xs font-bold transition-colors shadow-sm">永久抹除</button>
                    </div>
                  </div>
                } @empty {
                  <div class="text-center py-12 flex flex-col items-center justify-center">
                    <span class="text-5xl mb-3 opacity-30">🗑️</span>
                    <span class="text-gray-400 font-bold">垃圾桶目前是空的 ✨</span>
                  </div>
                }
              </div>
            </div>
          </div>
        }

        @if (showEditPurchaseModal()) {
          <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" (click)="closeEditPurchaseModal()">
            <div class="bg-white rounded-[2rem] shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-slide-up" (click)="$event.stopPropagation()">
              <div class="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
                <h3 class="text-xl font-bold text-gray-800">📝 編輯採購單資訊</h3>
                <button (click)="closeEditPurchaseModal()" class="w-8 h-8 rounded-full bg-gray-200 text-gray-600 font-bold hover:bg-gray-300">✕</button>
              </div>
              <div class="p-6 overflow-y-auto flex-1 custom-scrollbar">
                <form [formGroup]="editPurchaseForm" class="space-y-4">
                  <div>
                    <label class="block text-xs font-bold text-gray-500 mb-1">購買日期</label>
                    <input type="date" formControlName="date" class="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-400">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-gray-500 mb-1">地點 / 網址</label>
                    <input type="text" formControlName="location" class="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-400">
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                     <div>
                        <label class="block text-xs font-bold text-gray-500 mb-1">結帳幣別</label>
                        <select formControlName="currency" class="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-400 bg-white">
                          <option value="KRW">韓元 (KRW)</option>
                          <option value="TWD">台幣 (TWD)</option>
                          <option value="JPY">日幣 (JPY)</option>
                          <option value="USD">美金 (USD)</option>
                          <option value="CNY">人民幣 (CNY)</option>
                        </select>
                     </div>
                     <div>
                        <label class="block text-xs font-bold text-gray-500 mb-1">單據運費</label>
                        <input type="number" formControlName="localShipping" class="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-400">
                     </div>
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-red-500 mb-1">實際刷卡總額</label>
                    <input type="number" formControlName="totalLocalCost" class="w-full p-3 border border-red-200 rounded-xl focus:outline-none focus:border-red-400 font-bold text-red-600 bg-red-50">
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                     <div>
                        <label class="block text-xs font-bold text-gray-500 mb-1">付款人</label>
                        <input type="text" formControlName="payer" class="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-400">
                     </div>
                     <div>
                        <label class="block text-xs font-bold text-gray-500 mb-1">分潤模式</label>
                        <select formControlName="shareMode" class="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-400 bg-white">
                          <option value="親帶">親帶</option>
                          <option value="批發">批發</option>
                          <option value="-">-</option>
                        </select>
                     </div>
                  </div>
                </form>
              </div>
              <div class="p-6 border-t border-gray-100 bg-white shrink-0">
                <button (click)="submitEditPurchase()" class="w-full py-3 rounded-xl bg-brand-900 text-white font-bold text-lg hover:bg-black transition-transform active:scale-95">確認儲存修改</button>
              </div>
            </div>
          </div>
        }

        @if (showMyshipMatcherModal()) {
          <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" (click)="showMyshipMatcherModal.set(false)">
            <div class="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up" (click)="$event.stopPropagation()">
              <div class="p-5 sm:p-6 border-b border-gray-100 bg-[#FDFBF9] flex justify-between items-center shrink-0">
                <div>
                   <h3 class="text-xl font-black text-[#E67E22] flex items-center gap-2"><span>🚚</span> 賣貨便出貨配對中心</h3>
                   <div class="text-xs text-gray-500 font-bold mt-1">系統已抓取賣貨便單號，請在右側輸入對應的「官網訂單號」，系統將自動帶出商品明細！</div>
                </div>
                <button (click)="showMyshipMatcherModal.set(false)" class="w-8 h-8 rounded-full bg-gray-200 text-gray-600 font-bold hover:bg-gray-300 flex items-center justify-center">✕</button>
              </div>

              <div class="p-6 overflow-y-auto flex-1 custom-scrollbar bg-gray-50">
                 <div class="space-y-3">
                    @for(item of myshipImportList(); track item.trackingNumber; let i = $index) {
                       <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center gap-4"
                            [class.border-green-400]="item.matchedOrder" [class.bg-green-50]="item.matchedOrder">
                          
                          <div class="w-full md:w-1/3 shrink-0">
                             <div class="text-xs text-gray-400 font-bold mb-1">賣貨便收件人 / 追蹤碼</div>
                             <div class="font-bold text-gray-800 text-lg">{{ item.name }}</div>
                             <div class="font-mono text-[#E67E22] font-bold bg-orange-50 px-2 py-1 rounded w-fit mt-1">{{ item.trackingNumber }}</div>
                             @if(item.note) { <div class="text-[10px] text-gray-500 mt-1 bg-gray-100 p-1 rounded">備註: {{ item.note }}</div> }
                          </div>

                          <div class="w-full md:w-2/3 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                             <div class="flex-1 w-full">
                                <label class="block text-[10px] font-bold text-gray-500 mb-1">輸入官網訂單號 (支援末 6 碼)</label>
                                <input type="text" [ngModel]="item.searchKey" (ngModelChange)="matchMyshipOrder(i, $event)" 
                                       placeholder="例如: 021107" 
                                       class="w-full p-2.5 border rounded-lg focus:outline-none font-mono font-bold transition-colors"
                                       [class.border-green-400]="item.matchedOrder" [class.border-gray-300]="!item.matchedOrder" [class.bg-white]="!item.matchedOrder">
                             </div>

                             <div class="flex-1 w-full min-w-[200px]">
                                @if(item.matchedOrder) {
                                   <div class="text-[10px] font-bold text-green-600 mb-1">✅ 已配對成功 (請依此明細包貨)</div>
                                   <div class="bg-white border border-green-200 rounded-lg p-2 max-h-24 overflow-y-auto custom-scrollbar">
                                      @for(prod of item.matchedOrder.items; track prod.productId) {
                                         <div class="text-xs text-gray-700 font-bold leading-tight mb-1">
                                            • {{ prod.productName }} <span class="text-gray-500">[{{ prod.option }}]</span> <span class="text-brand-600">x{{ prod.quantity }}</span>
                                         </div>
                                      }
                                   </div>
                                } @else {
                                   <div class="h-16 flex items-center justify-center border border-dashed border-gray-300 rounded-lg text-xs text-gray-400 font-bold bg-gray-50">
                                      尚未配對
                                   </div>
                                }
                             </div>
                          </div>
                       </div>
                    }
                 </div>
              </div>

              <div class="p-6 border-t border-gray-100 bg-white shrink-0 flex justify-end gap-3">
                 <div class="text-sm font-bold text-gray-500 flex items-center mr-auto">
                    已成功配對: <span class="text-green-600 text-lg mx-1">{{ getMatchedCount() }}</span> / {{ myshipImportList().length }}
                 </div>
                 <button (click)="showMyshipMatcherModal.set(false)" class="px-6 py-3 rounded-xl border border-gray-200 font-bold text-gray-500 hover:bg-gray-50 transition-colors">取消</button>
                 <button (click)="submitMyshipMatch()" [disabled]="getMatchedCount() === 0" class="px-6 py-3 rounded-xl bg-[#E67E22] text-white font-bold text-lg hover:bg-[#D35400] transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                    確認配對並批次出貨
                 </button>
              </div>
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
  showEditPurchaseModal = signal(false);
  editPurchaseForm!: FormGroup;
  store = inject(StoreService);
  sanitizer = inject(DomSanitizer);
  fb: FormBuilder = inject(FormBuilder);
  cdr = inject(ChangeDetectorRef); // 👈 新增這行：畫面強制更新引擎
  now = new Date();
// 🧠 統一取得「真實底價匯率」的大腦 (供報表預估成本使用)
  getRealExchangeRate(p: any): number {
     let curr = p.localCurrency || '';
     const rate = Number(p.exchangeRate) || 1;
     
     // 🛡️ 終極防呆：如果舊資料沒選幣別，但匯率是1，絕對是台幣！
     if (!curr) curr = (rate === 1) ? 'TWD' : 'KRW';
     if (rate === 1) curr = 'TWD';
     
     if (curr === 'TWD') return 1;
     if (curr === 'KRW') return 1 / 43; 
     if (curr === 'JPY') return 0.22;
     if (curr === 'CNY') return 4.5;
     if (curr === 'THB') return 0.9;
     if (curr === 'USD') return 32.0;

     if (rate && rate > 0) return rate;
     return 1 / 43;
  }

  // ===== 👛 Phase 2: 資金帳戶與營業支出 (正式連動 Firebase) =====
  wallets = computed(() => this.store.wallets() || []);
  expenses = computed(() => this.store.expenses() || []);

  expenseSearch = signal('');
  expenseCategoryFilter = signal('all');
  // 👇 新增：處理自訂類別的開關
  isAddingNewExpCategory = signal(false);
  onExpCategoryChange(val: string) {
     if (val === 'NEW') {
        this.isAddingNewExpCategory.set(true);
        this.expenseForm.patchValue({ category: '' });
     } else {
        this.isAddingNewExpCategory.set(false);
        this.expenseForm.patchValue({ category: val });
     }
  }

  expenseStart = signal(''); // 👈 新增：營業支出開始日
  expenseEnd = signal('');   // 👈 新增：營業支出結束日

  purchaseStart = signal(''); // 👈 新增：採購總帳開始日
  purchaseEnd = signal('');   // 👈 新增：採購總帳結束日 

// 新增支出與錢包的表單及彈窗控制
  showExpenseModal = signal(false);
  expenseForm!: FormGroup;
  editingExpense = signal<any>(null); // 👈 新增：紀錄目前正在編輯哪一筆
  isUploadingExpImage = signal(false); // 👈 新增：上傳照片時的 Loading 狀態
  showWalletModal = signal(false);
  walletAction = signal<'add'|'deduct'>('add');
  activeWallet = signal<any>(null);
  walletForm!: FormGroup;

  // 🏦 新增帳戶表單控制
  showAddWalletModal = signal(false);
  addWalletForm!: FormGroup;

  // 📄 錢包交易明細控制
  showWalletDetailsModal = signal(false);
  detailsWallet = signal<any>(null);
  
  // 💡 大腦：從所有「營業支出」中，精準抓出與這個錢包同幣別的所有金流
  walletTransactions = computed(() => {
     const w = this.detailsWallet();
     if (!w) return [];
     return this.expenses().filter(e => e.currency === w.currency)
         .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });
  
  // 🎁 抽獎單表單控制
  showGiveawayModal = signal(false);
  giveawayForm!: FormGroup;
  giveawaySelectedProduct = signal<Product | null>(null);

  // 🧠 自動從現有的支出紀錄中，抓取所有不重複的「支出類別」，讓下拉選單永遠保持最新！
  uniqueExpenseCategories = computed(() => {
     return [...new Set(this.expenses().map(e => e.category))];
  });

  // 🧠 動態結存餘額時光機：由最新餘額往前推算歷史餘額
  expensesWithBalance = computed(() => {
    // 1. 確保所有支出依時間(新到舊)完美排序
    const allExp = [...this.expenses()].sort((a, b) => {
        const timeDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (timeDiff !== 0) return timeDiff;
        return b.id.localeCompare(a.id); // 同一天的話，依 ID (時間戳) 排序
    });
    
    const wallets = this.wallets();
    const currentBalances: Record<string, number> = {};
    
    // 2. 抓取每個錢包「現在」的真實餘額當作起點
    wallets.forEach(w => {
       currentBalances[w.currency] = w.balance;
    });

    // 3. 從最新的一筆開始往回推算歷史餘額
    return allExp.map(exp => {
        const curr = exp.currency;
        let bal = undefined;
        if (currentBalances[curr] !== undefined) {
            bal = currentBalances[curr]; // 這筆交易完成後的餘額，就是當下的追蹤餘額
            // 時光倒流：把這筆支出的錢「加回去」，還原成上一筆交易發生前的狀態
            currentBalances[curr] += Number(exp.amount);
        }
        return { ...exp, runningBalance: bal }; // 把算好的餘額包裝成 runningBalance 屬性
    });
  });

  filteredExpenses = computed(() => {
    let list = this.expensesWithBalance(); // 👈 替換點：改用剛算好餘額的時光機列表
    if (this.expenseCategoryFilter() !== 'all') {
        list = list.filter(e => e.category === this.expenseCategoryFilter());
    }
    const start = this.expenseStart();
    const end = this.expenseEnd();
    if (start) list = list.filter(e => new Date(e.date) >= new Date(start));
    if (end) list = list.filter(e => new Date(e.date) <= new Date(end));

    return list;
  });
  // ===========================================

// ===== 🎟️ 折扣碼管理系統 (進階版) =====
  showPromoModal = signal(false);
  editingPromoIndex = signal<number | null>(null);
  promoForm!: FormGroup;

  openPromoForm(index: number | null = null) {
    this.editingPromoIndex.set(index);
    if (index !== null) {
      const promos = this.store.settings().promoCodes || [];
      this.promoForm.patchValue(promos[index]);
    } else {
      this.promoForm.reset({ type: 'amount', value: 0, minSpend: 0, usageLimit: 0, usedCount: 0, expiryDate: '', active: true, note: '' });
    }
    this.showPromoModal.set(true);
  }

  savePromo() {
    if (this.promoForm.invalid) return alert('請填寫完整資訊！');
    const val = this.promoForm.value;
    
    // 組裝進階版資料
    const promoData = {
      code: val.code.trim().toUpperCase(),
      type: val.type,
      value: Number(val.value),
      minSpend: Number(val.minSpend) || 0,
      usageLimit: Number(val.usageLimit) || 0,
      usedCount: val.usedCount || 0, // 保留已使用次數
      expiryDate: val.expiryDate || '',
      active: val.active,
      note: val.note || ''
    };

    const settings = { ...this.store.settings() };
    const promos = [...(settings.promoCodes || [])];
    
    const index = this.editingPromoIndex();
    if (index !== null) {
      promos[index] = promoData; // 更新現有
    } else {
      promos.push(promoData);    // 新增
    }
    
    settings.promoCodes = promos;
    this.store.updateSettings(settings); // 安全存入 Firebase Settings
    this.showPromoModal.set(false);
  }

  deletePromo(index: number) {
    if (!confirm('⚠️ 確定要刪除此折扣碼嗎？')) return;
    const settings = { ...this.store.settings() };
    const promos = [...(settings.promoCodes || [])];
    promos.splice(index, 1);
    settings.promoCodes = promos;
    this.store.updateSettings(settings);
  }

  // 👇 補上這段防破圖的函式 👇
  handleImageError(event: any) { 
    event.target.src = 'https://placehold.co/100x100?text=No+Image'; 
  }

// 📸 Google Drive 終極破圖修復器 (強化防呆版)
  getSafeDriveImage(url: any): string {
    if (!url) return 'https://placehold.co/300x300?text=No+Image';
    
    // 🛡️ 防呆 1：如果傳進來的是物件 (例如買手系統可能存成 { url: '...' })
    let safeUrl = '';
    if (typeof url === 'object') {
       safeUrl = url.url || url.link || url.src || '';
    } else {
       // 🛡️ 防呆 2：移除買手系統可能殘留的引號、陣列括號與多餘空白
       safeUrl = String(url).replace(/['"\[\]]/g, '').trim(); 
    }

    if (!safeUrl) return 'https://placehold.co/300x300?text=No+Image';
    if (!safeUrl.includes('drive.google.com')) return safeUrl;

    let fileId = '';
    // 破解格式 1: https://drive.google.com/file/d/ID/view
    const match1 = safeUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match1) fileId = match1[1];
    
    // 破解格式 2: https://drive.google.com/uc?id=ID 或 export=view&id=ID
    const match2 = safeUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match2) fileId = match2[1];

    if (fileId) {
      // 使用 Google 官方的 Thumbnail API
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
    }
    
    return safeUrl;
  }

  activeTab = signal('dashboard');
  productSearch = signal('');
  productCategoryFilter = signal<string>('all'); // 記錄選中的主分類
  productSubCategoryFilter = signal<string>('all'); // 記錄選中的次分類
  productStatusFilter = signal<'active' | 'inactive'>('active'); // 👈 新增：商品上下架狀態過濾
  
  // 👇👇👇 貼在這裡（處理新增次分類的邏輯） 👇👇👇
  isAddingNewSubCategory = signal(false);
  onSubCategoryChange(val: string) {
     if (val === 'NEW') {
        this.isAddingNewSubCategory.set(true);
        this.productForm.patchValue({ subCategory: '' });
     } else {
        this.isAddingNewSubCategory.set(false);
        this.productForm.patchValue({ subCategory: val });
     }
  }
  // 👆👆👆 =================================== 👆👆👆
  
  // 自動抓取：當前選中主分類底下的所有次分類
  adminSubCategories = computed(() => {
    const cat = this.productCategoryFilter();
    if (cat === 'all') return [];
    
    // 篩選出該主分類的商品，並收集所有不重複的次分類
    const productsInCat = this.activeProducts().filter((p: Product) => p.category === cat);
    const subs = productsInCat.map((p: any) => p.subCategory).filter((sub): sub is string => !!sub);
    return [...new Set(subs)];
  });
  productViewMode = signal<'list' | 'grid'>('list');
  isSidebarOpen = signal(false);

 // ===== 📦 連線叫貨神器專用變數與邏輯 =====
  showProcurementModal = signal(false);
  procureRange = signal('all'); 
  procureStart = signal('');
  procureEnd = signal('');

  // 🌟 進階功能 1：新增搜尋與過濾狀態
  procureSearch = signal('');
  procureShowOnlyShort = signal(false);

  // 基礎清單：負責撈出資料、算好數量與日期
  procurementList = computed(() => {
    const allOrders = this.store.orders() || [];
    const allProducts = this.store.products() || [];

    // 抓出「客人已付款 / 待對帳」需要叫貨的訂單 (保留你原本精準的防呆條件)
    const activeOrders = allOrders.filter((o: Order) => 
      ['payment_confirmed', 'paid_verifying', 'pending_shipping'].includes(o.status)
    );

    let filteredOrders = activeOrders;
    const range = this.procureRange();
    const now = new Date();
    
    if (range === 'today') {
       const todayStr = now.toDateString();
       filteredOrders = activeOrders.filter((o: Order) => new Date(o.createdAt).toDateString() === todayStr);
    } else if (range === 'yesterday') {
       const yest = new Date(now);
       yest.setDate(yest.getDate() - 1);
       const yestStr = yest.toDateString();
       filteredOrders = activeOrders.filter((o: Order) => new Date(o.createdAt).toDateString() === yestStr);
    } else if (range === 'custom') {
       const start = this.procureStart();
       const end = this.procureEnd();
       if (start) filteredOrders = filteredOrders.filter((o: Order) => o.createdAt >= new Date(start).setHours(0,0,0,0));
       if (end) filteredOrders = filteredOrders.filter((o: Order) => o.createdAt <= new Date(end).setHours(23,59,59,999));
    }

    const listMap = new Map();

    filteredOrders.forEach((order: Order) => {
      (order.items || []).forEach((item: CartItem) => {
        const optionName = item.option || '單一規格';
        const key = `${item.productId}_${optionName}`;

        if (!listMap.has(key)) {
          const product = allProducts.find((p: Product) => p.id === item.productId);
          listMap.set(key, {
            productId: item.productId,
            name: item.productName,
            option: optionName,
            image: product?.image || item.productImage || '',
            category: product?.category || '未分類', // 🌟 新增：抓取商品分類，為了後面的群組化做準備
            needed: 0,
            procured: (product as any)?.procured?.[optionName] || 0,
            orderDatesSet: new Set<string>(),
            orderDatesStr: ''
          });
        }
        listMap.get(key).needed += (item.quantity || 1);
        
        try {
           const dateObj = new Date(order.createdAt);
           if (!isNaN(dateObj.getTime())) {
              listMap.get(key).orderDatesSet.add(dateObj.toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' }));
           }
        } catch (e) {}
        listMap.get(key).orderDatesStr = Array.from(listMap.get(key).orderDatesSet).join(', ');      
      });
    });

    return Array.from(listMap.values());
  });

  // 🌟 進階功能 2：建立「分類群組與過濾」的超級大腦
  groupedProcurementList = computed(() => {
    let list = this.procurementList();

    // 過濾 1: 關鍵字搜尋
    const q = this.procureSearch().toLowerCase();
    if (q) {
      list = list.filter(item => 
        item.name.toLowerCase().includes(q) || 
        item.option.toLowerCase().includes(q) || 
        item.category.toLowerCase().includes(q)
      );
    }

    // 過濾 2: 只看缺貨
    if (this.procureShowOnlyShort()) {
      list = list.filter(item => item.procured < item.needed);
    }

    // 分組: 依照「分類」打包
    const groups = new Map<string, any[]>();
    list.forEach(item => {
      const cat = item.category;
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat)!.push(item);
    });

    // 轉換為陣列並排序 (缺貨的排上面)
    return Array.from(groups.entries()).map(([category, items]) => ({
      category,
      items: items.sort((a, b) => {
         const aDone = a.procured >= a.needed;
         const bDone = b.procured >= b.needed;
         if (aDone && !bDone) return 1;
         if (!aDone && bDone) return -1;
         return 0;
      })
    }));
  });

  // 點擊 +1 或 -1 的更新按鈕 (不變)
  async updateProcured(item: any, change: number) {
    const product = this.store.products().find((p: Product) => p.id === item.productId);
    if (!product) return;

    const currentMap = (product as any).procured || {};
    const currentQty = currentMap[item.option] || 0;
    let newQty = currentQty + change;
    if (newQty < 0) newQty = 0; 

    const updatedProduct = {
      ...product,
      procured: { ...currentMap, [item.option]: newQty }
    };
    await this.store.updateProduct(updatedProduct);
  }
  
  // 🌟 進階功能 3：一鍵結算建立「採購草稿單」
  async generatePurchaseDraft() {
    const toBuyItems = this.procurementList().filter(i => i.procured > 0);
    if (toBuyItems.length === 0) return alert('⚠️ 目前沒有已經叫到貨的商品可以結算！\n請先在列表點擊「+」增加數量。');

    if (!confirm(`💡 確定要將這 ${toBuyItems.length} 項有叫到貨的商品，建立為「採購單草稿」嗎？\n(建立後可至採購總帳填寫實際金額並上傳收據)`)) return;

    const draftItems = toBuyItems.map(i => ({
      productId: i.productId,
      productName: i.name,
      option: i.option,
      quantity: i.procured,
    }));

    const draftPurchase = {
      id: 'PUR-DRAFT-' + Date.now(),
      date: new Date().toISOString().slice(0, 10),
      createdAt: new Date().getTime(),
      country: '韓國',
      location: '未填寫現場/店家',
      items: draftItems,
      estimatedLocalCost: 0,
      localShipping: 0,
      totalLocalCost: 0,
      payer: this.store.currentUser()?.name || '買手',
      shareMode: '-',
      status: 'pending_sync', // 預設為待核銷
      receiptImages: []
    };

    try {
      if ((this.store as any).addPurchase) {
         await (this.store as any).addPurchase(draftPurchase);
      } else {
         const current = this.store.purchases();
         (this.store.purchases as any).set([draftPurchase, ...current]);
      }
      
      alert('✅ 採購草稿單已建立！\n請前往「採購總帳」分頁查看並完善金額。');
      this.showProcurementModal.set(false); // 關閉叫貨總表
      this.activeTab.set('purchases');      // 自動跳轉到採購總帳
    } catch (err) {
      alert('❌ 建立草稿單發生錯誤：' + err);
    }
  }

  // 建立一個快速尋找叫貨狀態的字典 (供報表匯出用)
  procurementStatusMap = computed(() => {
    const map = new Map<string, { needed: number, procured: number }>();
    const activeOrders = this.store.orders().filter((o: Order) => 
      ['payment_confirmed', 'paid_verifying', 'pending_shipping'].includes(o.status)
    );

    activeOrders.forEach(o => {
      (o.items || []).forEach((item: CartItem) => {
        const key = `${item.productId}_${item.option || '單一規格'}`;
        if (!map.has(key)) {
          const p = this.store.products().find((x: Product) => x.id === item.productId);
          map.set(key, { needed: 0, procured: (p as any)?.procured?.[item.option || '單一規格'] || 0 });
        }
        map.get(key)!.needed += (item.quantity || 1);
      });
    });
    return map;
  });

  // 供匯出報表呼叫，取得單一商品的叫貨進度
  getItemProcureStatus(productId: string, option: string) {
    const key = `${productId}_${option || '單一規格'}`;
    return this.procurementStatusMap().get(key);
  }
  // =====================================

  filteredAdminProducts = computed(() => {
    let list = [...this.activeProducts()];

    // 🔥 0. 依照「上架中 / 已下架」篩選 (改用系統原生的 isListed 判斷！)
    if (this.productStatusFilter() === 'active') {
        list = list.filter(p => p.isListed !== false); // 找出上架的 (包含預設值)
    } else {
        list = list.filter(p => p.isListed === false); // 找出明確被下架的
    }

    const q = this.productSearch().toLowerCase();
    const cat = this.productCategoryFilter();
    const subCat = this.productSubCategoryFilter();

    // 🔥 1. 依照「下拉選單」的主分類與次分類篩選
    if (cat !== 'all') {
      list = list.filter(p => p.category === cat);
      if (subCat !== 'all') {
        list = list.filter((p: any) => p.subCategory === subCat);
      }
    }

    // 🔥 2. 依照「搜尋框」的關鍵字篩選 (保留你原本的條件，並加上標籤搜尋)
    if (q) {
      list = list.filter((p: any) => 
        p.name.toLowerCase().includes(q) || 
        p.code.toLowerCase().includes(q) || 
        p.category.toLowerCase().includes(q) ||
        (p.tags && p.tags.some((t: string) => t.toLowerCase().includes(q))) // 新增標籤搜尋
      );
    }

    // 🔥 3. 完美保留你原本的排序邏輯 (依 ID 降冪排列)
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
      if (rows.length < 2) { 
        alert(`❌ CSV 檔案格式錯誤或沒有資料！(只讀到 ${rows.length} 行)`); 
        return; 
      }

      let successCount = 0; let failCount = 0; let skippedCount = 0;
      let lastError = '';

      // 🔥 新增：獨立的流水號計數器，固定從 1 開始
      let validProductCount = 1;

      // 🔥 防呆神器：自動把 "69,000" 這種帶逗號的文字，洗乾淨變成純數字 69000
      const toNumber = (val: any) => Number(String(val || '').replace(/,/g, '')) || 0;

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        
        // 🔥 對應您的新表格：商品名稱現在被擠到了第 6 格 (索引 5)，分類在第 7 格 (索引 6)
        if (row.length < 6 || !row[5] || !row[6]) {
          skippedCount++;
          continue;
        }
        if (row[5].includes('商品名稱') || row[5] === '秋季毛衣') {
          skippedCount++;
          continue; 
        }

try {
           const name = String(row[5] || '').trim(); 
           const category = String(row[6] || '').trim();
           
           // 🔥 1. 將次分類與標籤移動到分類與售價之間 (對應表格的 H, I 欄)
           const subCategory = String(row[7] || '').trim();
           const tagsStr = String(row[8] || '').trim();
           // ✨ 升級：標籤現在同時支援 Excel 裡的換行或逗號
           const tags = tagsStr ? tagsStr.split(/[,\n]+/).map((s: string) => s.trim()).filter((s: string) => s) : [];
           
           // 🔥 2. 原本的售價與後續欄位，全部順延兩格
           const priceGeneral = toNumber(row[9]); 
           const priceVip = toNumber(row[10]);
           const localPrice = toNumber(row[11]); 
           const exchangeRate = Number(String(row[12]).replace(/,/g, '')) || 1;
           const weight = toNumber(row[13]); 
           const shippingCostPerKg = Number(String(row[14]).replace(/,/g, '')) || 0;
           const costMaterial = toNumber(row[15]);
           
           const bulkCount = toNumber(row[16]);
           const bulkTotal = toNumber(row[17]);

           const imageRaw = String(row[18] || '');
           const imagesArray = imageRaw.split(/[,\n]+/).map((s: string) => s.trim()).filter((s: string) => s.startsWith('http')); 
           const mainImage = imagesArray.length > 0 ? imagesArray[0] : 'https://placehold.co/300x300?text=No+Image';
           const allImages = imagesArray.length > 0 ? imagesArray : [mainImage];

           const optionsStr = String(row[19] || '');
           const stockInput = toNumber(row[20]);
           
           const isPreorder = String(row[21] || '').trim().toUpperCase() === 'TRUE';
           const isListed = String(row[22] || '').trim().toUpperCase() !== 'FALSE'; 
           
           let code = String(row[23] || '').replace(/\t/g, '').trim(); 
           const note = String(row[24] || '');          
           const stock = isPreorder ? 99999 : stockInput;
          
           // ✨ 升級：規格現在同時支援 Excel 裡的換行或逗號
           const options = optionsStr ? optionsStr.split(/[,\n]+/).map((s: string) => s.trim()).filter((s: string) => s) : [];
          
           // 1️⃣ 先判斷：如果沒有貨號，就自動生成
           if (!code) {
             const codeMap = this.store.settings().categoryCodes || {};
             const prefix = codeMap[category] || 'Z'; 
             const now = new Date();
             const datePart = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
             code = `${prefix}${datePart}${String(validProductCount).padStart(3, '0')}`;
           }

           // 2️⃣ 再用確定的貨號去資料庫找商品 (這裡只宣告一次 existingProduct！)
           const existingProduct = this.store.products().find((p: any) => p.code === code);
           const uniqueId = existingProduct?.id || (Date.now().toString() + '-' + i + '-' + Math.random().toString(36).substring(2, 7));

           // 3️⃣ 智慧判斷：檢查第 25 格是不是真的「購買網址」
           let purchaseUrl = '';
           if (rows[0] && rows[0][25] === '購買網址') {
               purchaseUrl = String(row[25] || '').trim();
           } else {
               // 若為舊版表單，保留資料庫原有網址
               purchaseUrl = existingProduct ? (existingProduct as any).purchaseUrl : '';
           }

           // 4️⃣ 組合最終要存入資料庫的商品資料
           const p: any = { 
             id: uniqueId, 
             code, name, category, subCategory, tags, image: mainImage, images: allImages,
             priceGeneral, priceVip, priceWholesale: 0, localPrice, exchangeRate,        
             weight, shippingCostPerKg, costMaterial, stock, options, note, purchaseUrl, priceType: 'normal',
             soldCount: existingProduct?.soldCount || 0, country: 'Korea',
             allowPayment: { cash: true, bankTransfer: true, cod: true },
             allowShipping: { meetup: true, myship: true, family: true, delivery: true },
             isPreorder, isListed
           };

           if (bulkCount > 1 && bulkTotal > 0) {
             p.bulkDiscount = { count: bulkCount, total: bulkTotal };
           }

           this.store.addCategory(category);
           
           if (existingProduct) { await this.store.updateProduct(p); } 
           else { await this.store.addProduct(p); }
           
           successCount++;
           // 🔥 成功處理一個商品後，流水號才允許 +1
           validProductCount++;

        } catch (err: any) { 
           failCount++; 
           lastError = err.message || String(err);
        }    
      }
      
      alert(`✅ 讀取完畢！\n成功新增/更新：${successCount} 筆\n失敗報錯：${failCount} 筆\n格式不符跳過：${skippedCount} 筆\n\n${lastError ? '⚠️ 最後一個錯誤: ' + lastError : ''}`);
      event.target.value = ''; 
    };
    reader.readAsText(file, 'UTF-8');
  }
  reportSortBy = signal<'sold' | 'profit'>('sold');
  accountingRange = signal('month'); 
  accountingCustomStart = signal(''); 
  accountingCustomEnd = signal('');

// 🧠 採購總帳真實成本大腦 (進化版：精準過濾區間 + 幣別防呆洗淨)
  purchaseAverageCostMap = computed(() => {
     const map = new Map<string, { totalCost: number, totalQty: number, currency: string }>();
     
     // 1. 抓取目前報表選擇的日期區間
     const range = this.accountingRange(); 
     const now = new Date(); 
     let startDate: Date | null = null; let endDate: Date | null = null;
     
     if (range === 'today') startDate = new Date(now.setHours(0,0,0,0)); 
     else if (range === 'week') startDate = new Date(now.setDate(now.getDate() - now.getDay())); 
     else if (range === 'month') startDate = new Date(now.getFullYear(), now.getMonth(), 1); 
     else if (range === 'year') startDate = new Date(now.getFullYear(), 0, 1); 
     else if (range === 'custom') { 
         if (this.accountingCustomStart()) startDate = new Date(this.accountingCustomStart()); 
         if (this.accountingCustomEnd()) { endDate = new Date(this.accountingCustomEnd()); endDate.setHours(23,59,59,999); }
     }

     const allPurchases = this.store.purchases();
     if (!Array.isArray(allPurchases)) return map;

     // 2. 依照報表選擇的時間區間，精準篩選採購單 (完美解決歷史成本被未來進價干擾的問題！)
     const validPurchases = allPurchases.filter((p: any) => {
        if (!p) return false;
        const d = new Date(p.date || p.createdAt);
        if (startDate && d < startDate) return false;
        if (endDate && d > endDate) return false;
        return true;
     });

     validPurchases.forEach((p: any) => {
        // 🚀 關鍵除蟲：強制將買手端傳來的幣別「轉大寫並去除空白」！防止 "twd" 或 "TWD " 造成判斷失敗
        const safeCurrency = String(p.currency || '').trim().toUpperCase();
        
        // 🛡️ 終極防呆：如果沒選幣別，在「台灣」買的就是 TWD，否則預設 KRW
        const defaultCurrency = safeCurrency || (String(p.country).trim() === '台灣' ? 'TWD' : 'KRW');
        
        (p.items || []).forEach((item: any) => {
           const exactKey = `${item.productId}_${item.option || '單一規格'}`;
           const productKey = `${item.productId}_ALL`;
           
           if (!map.has(exactKey)) map.set(exactKey, { totalCost: 0, totalQty: 0, currency: defaultCurrency });
           if (!map.has(productKey)) map.set(productKey, { totalCost: 0, totalQty: 0, currency: defaultCurrency });
           
           const record = map.get(exactKey)!;
           const prodRecord = map.get(productKey)!;
           
           const qty = Number(item.quantity) || 1;
           const price = Number(item.price) || 0; 
           
           record.totalQty += qty;
           record.totalCost += (price * qty);
           record.currency = defaultCurrency; // 確保幣別標記正確

           prodRecord.totalQty += qty;
           prodRecord.totalCost += (price * qty);
           prodRecord.currency = defaultCurrency;
        });
     });
     
     return map;
  });

  accountingFilteredOrders = computed(() => {
    const orders = this.store.orders(); 
    const range = this.accountingRange(); 
    const now = new Date();
    let startDate: Date | null = null; let endDate: Date | null = null;
    
    if (range === 'today') startDate = new Date(now.setHours(0,0,0,0));
    else if (range === 'week') startDate = new Date(now.setHours(0,0,0,0) - ((now.getDay() || 7) - 1) * 24 * 60 * 60 * 1000);
    else if (range === 'month') startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    else if (range === 'year') startDate = new Date(now.getFullYear(), 0, 1);
    else if (range === 'custom' && this.accountingCustomStart()) { startDate = new Date(this.accountingCustomStart()); if (this.accountingCustomEnd()) endDate = new Date(this.accountingCustomEnd()); }

    return orders.filter((o: Order) => {
      const d = new Date(o.createdAt);
      if (startDate && d < startDate) return false;
      if (endDate) { const e = new Date(endDate); e.setHours(23,59,59,999); if (d > e) return false; }
      if (['cancelled', 'refunded'].includes(o.status)) return false;
      
      // 🛡️ 隱形結界：如果是員工的訂單，絕對不計入正式營收報表！
      const user = this.store.users().find(u => u.id === o.userId);
      if (user?.tier === 'employee') return false;

      return true;
    });
  });

  accountingStats = computed(() => {
    const filteredOrders = this.accountingFilteredOrders();
    // 🧠 營收雙幣別分流大腦
    let revenueTWD = 0; let revenueKRW = 0; 
    
    // 👇 新增：獨立記錄批發與零售營收 👇
    let revenueWholesaleTWD = 0; let revenueRetailTWD = 0;
    let revenueWholesaleKRW = 0; let revenueRetailKRW = 0;

    let cost = 0; let costTWD = 0; let costKRW = 0; let discounts = 0;
    let payReceived = 0; let payVerifying = 0; let payUnpaid = 0; let payRefund = 0; let payRefundedTotal = 0;
    
    // 🤝 合夥人分潤累加器
    let shareYichen = 0; let shareZiting = 0; let shareXiaoyun = 0; let shareCompany = 0;

    // 🎯 行銷成本累加器
    let promoTotal = 0; let bundleTotal = 0; let creditsTotal = 0;

    filteredOrders.forEach((o: Order) => {
      if (o.status === 'refund_needed') payRefund += o.finalTotal;
      else if (o.status === 'paid_verifying') payVerifying += o.finalTotal;
      else if (['payment_confirmed', 'shipped', 'completed', 'picked_up'].includes(o.status)) {
          if (o.paymentMethod === 'cod' && o.status !== 'completed') payUnpaid += o.finalTotal; else payReceived += o.finalTotal;
      } else if (['pending_payment', 'unpaid_alert'].includes(o.status)) {
          payUnpaid += o.finalTotal;
      }

      // 💡 統一邏輯：只要不是取消或退款，皆計入營收與成本計算！
      const isValidOrder = !['cancelled', 'refunded'].includes(o.status);
      
      if (isValidOrder) {
          if ((o.paymentMethod as string) === 'giveaway') return; // 👈 神級防呆：抽獎單不計入銷售成本

          // 👇 新增：找出下單的這個客人是不是批發客 👇
          const orderUser = this.store.users().find((u: User) => u.id === o.userId);
          const isWholesale = orderUser?.tier === 'wholesale';

          // 🌟 雙幣別營收分流
          const orderCurrency = (o as any).currency || 'TWD';
          if (orderCurrency === 'KRW') {
              revenueKRW += o.finalTotal;
              // 👇 依據客群分流 👇
              if (isWholesale) revenueWholesaleKRW += o.finalTotal;
              else revenueRetailKRW += o.finalTotal;
          } else {
              revenueTWD += o.finalTotal;
              // 👇 依據客群分流 👇
              if (isWholesale) revenueWholesaleTWD += o.finalTotal;
              else revenueRetailTWD += o.finalTotal;
          }

          let orderCost = 0;
          let totalRawProfit = 0; 

          // 🔥 統計行銷預算
          promoTotal += (o as any).promoDiscount || 0;
          
          // 💡 自動濾掉賣貨便/好賣家的 20 元物流開單預扣
          let platformSubsidy = (!isWholesale && (o.shippingMethod === 'myship' || o.shippingMethod === 'family')) ? 20 : 0;
          let pureBundle = (o.discount || 0) - platformSubsidy;
          bundleTotal += (pureBundle > 0 ? pureBundle : 0);
          
          creditsTotal += (o.usedCredits || 0);

          // 第一圈：精算這筆訂單的成本，與每項商品的「原始毛利」
          const itemsItems = o.items || [];
          const purchaseCostMap = this.purchaseAverageCostMap(); // 呼叫最新採購真實大腦

          const itemsData = itemsItems.map((i: CartItem) => {
              const p = this.store.products().find((x: Product) => x.id === i.productId);
              let shareMode = (p as any)?.shareMode || '親帶';

              const exactKey = `${i.productId}_${i.option || '單一規格'}`;
              const baseKey = `${i.productId}_單一規格`;
              const productKey = `${i.productId}_ALL`;

              // 💡 終極防呆匹配：1. 找精確規格 2. 找單一規格 3. 找商品總平均 (解決買手沒選規格的問題)
              const actualPurchase = purchaseCostMap.get(exactKey) || purchaseCostMap.get(baseKey) || purchaseCostMap.get(productKey);

              let finalItemCost = 0; // 當地幣別的「單件」成本
              let finalCurrency = 'TWD';
              let itemTwdTotalCost = 0; // 換算成台幣的「總」成本

              // --- 1. 抓取商品建檔的預設資料 (防呆備用) ---
              let locP = p?.localPrice || 0;
if (p && p.options) {
    let fOpt = p.options.find((opt: string) => opt.split('=')[0].trim() === i.option) || '';
    
    // 🛡️ 補上模糊比對防呆：如果精準比對找不到，有可能是後來加上了 (售完)
    if (!fOpt && p.options) {
        fOpt = p.options.find((opt: string) => opt.includes(i.option) || i.option.includes(opt.split('=')[0].trim())) || '';
    }

    if (fOpt.includes('=')) {
        const parts = fOpt.split('=');
        if (parts.length >= 4 && !isNaN(Number(parts[3]))) locP = Number(parts[3]);
    }
}
              let definedCurr = (p as any)?.localCurrency || '';
              const actualRate = p ? (Number(p.exchangeRate) || 1) : 1;
              if (!definedCurr) definedCurr = (actualRate === 1) ? 'TWD' : 'KRW';
              if (actualRate === 1) definedCurr = 'TWD';

              // --- 2. 決定採用「買手真實採購價」還是「商品預估價」 ---
              if (actualPurchase && actualPurchase.totalQty > 0 && actualPurchase.totalCost > 0) {
                  // 🎉 成功！無條件使用採購總帳中，買手輸入的真實平均單價！
                  finalItemCost = actualPurchase.totalCost / actualPurchase.totalQty;
                  finalCurrency = actualPurchase.currency;
              } else {
                  // ⚠️ 退回使用商品建檔預估資料 (可能尚未採購)
                  finalCurrency = definedCurr;
                  if (finalCurrency === 'TWD') finalItemCost = locP > 0 ? locP : (i.unitCost || 0);
                  else if (finalCurrency === 'KRW') finalItemCost = locP > 0 ? locP : ((i.unitCost || 0) * 43);
                  else finalItemCost = locP > 0 ? locP : 0;
              }

              // --- 3. 成本歸位與台幣真實淨利轉換 ---
              if (finalCurrency === 'KRW') {
                  costKRW += (finalItemCost * i.quantity);
                  itemTwdTotalCost = (finalItemCost / 43) * i.quantity; 
              } else if (finalCurrency === 'TWD') {
                  costTWD += (finalItemCost * i.quantity);
                  itemTwdTotalCost = finalItemCost * i.quantity;
              } else {
                  // 🇯🇵 🇨🇳 🇹🇭 🇺🇸 其他外幣：依內部真實底價匯率直接轉台幣成本
                  const realRate = p ? this.getRealExchangeRate(p) : 1;
                  costTWD += (finalItemCost * realRate * i.quantity);
                  itemTwdTotalCost = (finalItemCost * realRate) * i.quantity;
              }

              orderCost += itemTwdTotalCost;
              const rawItemProfit = (i.price * i.quantity) - itemTwdTotalCost;
              totalRawProfit += rawItemProfit;

              return { itemTwdTotalCost, shareMode, rawItemProfit };
          });

          cost += orderCost;
          discounts += o.discount + o.usedCredits;

          // 第二圈：計算真實淨利 (扣除折扣後)，並依商品貢獻比例拆分給合夥人
          const orderRealProfit = o.finalTotal - orderCost;
          
          itemsData.forEach(item => {
              const actualItemProfit = totalRawProfit !== 0 ? orderRealProfit * (item.rawItemProfit / totalRawProfit) : 0;
              
              if (item.shareMode === '親帶') {
                  shareYichen += actualItemProfit * 0.25;
                  shareZiting += actualItemProfit * 0.25;
                  shareXiaoyun += actualItemProfit * 0.25;
                  shareCompany += actualItemProfit * 0.25;
              } else {
                  shareZiting += actualItemProfit * 0.40;
                  shareXiaoyun += actualItemProfit * 0.40;
                  shareCompany += actualItemProfit * 0.20;
              }
          });
      }
    });

    const totalRevenueEstTWD = revenueTWD + (revenueKRW / 43);

    return { 
        revenue: totalRevenueEstTWD, 
        revenueTWD,                  
        revenueKRW,  
        // 👇 新增丟出變數給畫面顯示 👇
        revenueWholesaleTWD,
        revenueRetailTWD,
        revenueWholesaleKRW,
        revenueRetailKRW,
        // 👆 新增結束 👆                
        cost, 
        costTWD,                     // 🟢 拋出：台幣商品成本
        costKRW,                     // 🟢 拋出：韓幣商品成本
        profit: totalRevenueEstTWD - cost, 
        margin: totalRevenueEstTWD ? ((totalRevenueEstTWD - cost) / totalRevenueEstTWD) * 100 : 0, 
        discounts, count: filteredOrders.length, 
        maxOrder: filteredOrders.length > 0 ? Math.max(...filteredOrders.map(o=>o.finalTotal)) : 0, 
        minOrder: filteredOrders.length > 0 ? Math.min(...filteredOrders.map(o=>o.finalTotal)) : 0, 
        avgOrder: filteredOrders.length > 0 ? totalRevenueEstTWD / (filteredOrders.filter((o: Order) => o.status !== 'pending_payment').length || 1) : 0, 
        marketing: { promo: promoTotal, bundle: bundleTotal, credits: creditsTotal, total: promoTotal + bundleTotal + creditsTotal },
        payment: { total: payReceived + payVerifying + payUnpaid + payRefund, received: payReceived, verifying: payVerifying, unpaid: payUnpaid, refund: payRefund, refundedTotal: payRefundedTotal },
        shares: { yichen: shareYichen, ziting: shareZiting, xiaoyun: shareXiaoyun, company: shareCompany } 
    };
  });

  // 🧠 營業支出大腦：根據會計報表的區間，自動計算台幣與外幣的支出總額
  accountingExpenses = computed(() => {
     const range = this.accountingRange(); 
     const now = new Date(); 
     let startDate: Date | null = null; let endDate: Date | null = null;
     if (range === 'today') startDate = new Date(now.setHours(0,0,0,0)); 
     else if (range === 'week') startDate = new Date(now.setDate(now.getDate() - now.getDay())); 
     else if (range === 'month') startDate = new Date(now.getFullYear(), now.getMonth(), 1); 
     else if (range === 'year') startDate = new Date(now.getFullYear(), 0, 1); 
     else if (range === 'custom') { 
         if (this.accountingCustomStart()) startDate = new Date(this.accountingCustomStart()); 
         if (this.accountingCustomEnd()) { endDate = new Date(this.accountingCustomEnd()); endDate.setHours(23,59,59,999); }
     }

     const validExpenses = this.expenses().filter((e: any) => {
        if (e.category === '商品採購' || e.category === '儲值') return false; 
        const d = new Date(e.date);
        if (startDate && d < startDate) return false;
        if (endDate) { const ed = new Date(endDate); ed.setHours(23,59,59,999); if (d > ed) return false; }
        return true;
     });

     let expTWD = 0; let expKRW = 0; let expJPY = 0; let expUSD = 0; let expCNY = 0; let expTHB = 0;
     validExpenses.forEach((e: any) => { 
        if (e.currency === 'TWD') expTWD += e.amount;
        else if (e.currency === 'KRW') expKRW += e.amount;
        else if (e.currency === 'JPY') expJPY += e.amount;
        else if (e.currency === 'USD') expUSD += e.amount;
        else if (e.currency === 'CNY') expCNY += e.amount;
        else if (e.currency === 'THB') expTHB += e.amount;
        else expTWD += e.amount; 
     });

     const foreignToTWD = (expKRW / 43) + (expJPY * 0.22) + (expUSD * 32.0) + (expCNY * 4.5) + (expTHB * 0.9);
     return {
        twd: expTWD,
        krw: expKRW,
        totalTwdEst: expTWD + foreignToTWD
     };
  });

  productPerformance = computed(() => { 
    const orders = this.accountingFilteredOrders();
    const productMap = new Map<string, any>();
    
    orders.forEach(o => {
      o.items.forEach(item => {
          if (!productMap.has(item.productId)) {
            const p = this.store.products().find(x => x.id === item.productId);
            if(p) {
               productMap.set(item.productId, { product: p, sold: 0, revenue: 0, cost: 0, hasBulk: p.options.some(opt => opt.includes('=')) });
            } else {
               // 防呆：商品已刪除
               productMap.set(item.productId, { product: { id: item.productId, name: item.productName + ' (已刪除)', image: item.productImage }, sold: 0, revenue: 0, cost: 0, hasBulk: false });
            }
          }

          const stats = productMap.get(item.productId);
          if (stats) {
              stats.sold += item.quantity;
              stats.revenue += item.price * item.quantity; 

              // 🧠 計算成本：優先呼叫最新採購大腦，並支援無規格防呆
              const exactKey = `${item.productId}_${item.option || '單一規格'}`;
              const baseKey = `${item.productId}_單一規格`;
              const productKey = `${item.productId}_ALL`;
              const actualPurchase = this.purchaseAverageCostMap().get(exactKey) || 
                                     this.purchaseAverageCostMap().get(baseKey) || 
                                     this.purchaseAverageCostMap().get(productKey);

              if (actualPurchase && actualPurchase.totalQty > 0 && actualPurchase.totalCost > 0) {
                  // 🎉 成功！採用真實平均成本
                  const avgCost = actualPurchase.totalCost / actualPurchase.totalQty;
                  // 判斷幣別轉換台幣
                  if (actualPurchase.currency === 'KRW') {
                      stats.cost += (avgCost / 43) * item.quantity;
                  } else if (actualPurchase.currency === 'TWD') {
                      stats.cost += avgCost * item.quantity;
                  } else {
                      const pData = this.store.products().find((x:Product) => x.id === item.productId);
                      const realRate = pData ? this.getRealExchangeRate(pData) : 1;
                      stats.cost += (avgCost * realRate) * item.quantity;
                  }
              } else {
                  // 沒採購過，用預估公式墊著
                  let currentLocalPrice = stats.product.localPrice || 0;
let fullOption = stats.product.options?.find((opt: string) => opt.split('=')[0].trim() === item.option) || '';

// 🛡️ 補上模糊比對防呆：確保單品毛利排行也能抓到加了 (售完) 的成本
if (!fullOption && stats.product.options) {
    fullOption = stats.product.options.find((opt: string) => opt.includes(item.option) || item.option.includes(opt.split('=')[0].trim())) || '';
}

if (fullOption.includes('=')) {
    const parts = fullOption.split('=');
    if (parts.length >= 4) { currentLocalPrice = Number(parts[3]) || currentLocalPrice; }
}

                  if (currentLocalPrice > 0 || stats.product.localPrice) {
                  const rate = this.getRealExchangeRate(stats.product); 
                  stats.cost += (currentLocalPrice * rate) * item.quantity; // 💡 目前只算商品進價
                  // 💡 [未來擴充：國際運費與包材]
                  // const costMat = stats.product.costMaterial || 0;
                  // const weight = stats.product.weight || 0;
                  // const shipKg = stats.product.shippingCostPerKg || 200;
                  // stats.cost += ((currentLocalPrice * rate) + costMat + (weight * shipKg)) * item.quantity;                  } else {
                      stats.cost += (item.unitCost || 0) * item.quantity;
                  }
              }
          }
      });
    });

    return Array.from(productMap.values()).map(stats => {
      stats.profit = stats.revenue - stats.cost; 
      stats.margin = stats.revenue ? (stats.profit / stats.revenue) * 100 : 0; 
      return stats;
    });
  });

  topSellingProducts = computed(() => [...this.productPerformance()].sort((a, b) => b.sold - a.sold));
  topProfitProducts = computed(() => [...this.productPerformance()].sort((a, b) => b.profit - a.profit));

  dashboardMetrics = computed(() => { 
    const orders = this.store.orders(); 
    const today = new Date().toDateString(); 
    const thisMonth = new Date().getMonth(); 
    const thisYear = new Date().getFullYear(); // 跨年防呆
    let todayRev = 0; let monthSales = 0; let monthCost = 0; 
    
    orders.forEach((o: Order) => {
        const dStr = new Date(o.createdAt).toDateString();
        const dMonth = new Date(o.createdAt).getMonth();
        const dYear = new Date(o.createdAt).getFullYear();

        // 💡 統一邏輯：只要不是取消或退款，皆計入營業額！
        if(!['cancelled', 'refunded'].includes(o.status) && (o.paymentMethod as string) !== 'giveaway') {
          if (dStr === today) todayRev += o.finalTotal; 
          if (dMonth === thisMonth && dYear === thisYear) {
              monthSales += o.finalTotal; 
              (o.items || []).forEach((i: CartItem) => { 
                const p = this.store.products().find((x: Product) => x.id === i.productId); 
                
                // 🧠 接上最精準的「採購真實成本大腦」
                const key = `${i.productId}_${i.option || '單一規格'}`;
                const actualCost = this.store.averageActualCostMap().get(key);
                
                if (actualCost) {
                    monthCost += actualCost * i.quantity;
                } else if (p) {
                    let currentLocalPrice = p.localPrice || 0;
                    let fullOption = p.options?.find((opt: string) => opt.split('=')[0].trim() === i.option) || '';
                    // 🛡️ 模糊比對防呆：如果老闆後來加了 (售完)
                    if (!fullOption && p.options) {
                        fullOption = p.options.find((opt: string) => opt.includes(i.option) || i.option.includes(opt.split('=')[0].trim())) || '';
                    }
                    if (fullOption.includes('=')) {
                        const parts = fullOption.split('=');
                        if (parts.length >= 4 && !isNaN(Number(parts[3]))) currentLocalPrice = Number(parts[3]);
                    }
                    const rate = this.getRealExchangeRate(p); 
                    monthCost += (currentLocalPrice * rate) * i.quantity; // 💡 目前只算商品進價
                    // 💡 [未來擴充：國際運費與包材]
                    // const costMat = Number(p.costMaterial) || 0;
                    // const weight = Number(p.weight) || 0;
                    // const shipKg = Number(p.shippingCostPerKg) || 0; 
                    // monthCost += ((currentLocalPrice * rate) + costMat + (weight * shipKg)) * i.quantity;
                } else {
                    monthCost += (i.unitCost || 0) * i.quantity;
                }              
              }); 
          }
        } 
    }); 
    
    return { 
        todayRevenue: todayRev, monthSales, monthProfit: monthSales - monthCost, 
        toConfirm: orders.filter((o: Order) => ['pending_payment', 'unpaid_alert', 'paid_verifying'].includes(o.status)).length, 
        toShip: orders.filter((o: Order) => o.status === 'payment_confirmed').length, 
        unpaid: orders.filter((o: Order) => ['pending_payment', 'unpaid_alert'].includes(o.status)).length, 
        processing: orders.filter((o: Order) => o.status === 'refund_needed').length 
    }; 
  });

pendingCount = computed(() => this.dashboardMetrics().toConfirm);

// 🚨 叫貨與採購提醒紅點大腦
  hasPendingProcurements = computed(() => {
      return this.procurementList().some(item => item.procured < item.needed);
  });
  
  // 原本的：用來提醒老闆「採購總帳」有單據待核銷
  hasPendingPurchases = computed(() => {
      return this.purchaseList().some(p => p.status === 'pending_sync');
  });

  // 🌟 新增：專屬給「買手系統」用的紅點大腦！
  // 邏輯跟買手系統裡面一模一樣：只要有任何一個商品的 (需買數量 > 已買數量)，就亮紅點
  hasPendingBuyerTasks = computed(() => {
      // 這裡直接借用你剛剛寫好的超強 procurementList 大腦
      return this.procurementList().some(item => item.needed > item.procured);
  });

  // 📝 儲存訂單內部備註
  async saveOrderNote(o: Order, newNote: string) {
     try {
        await this.store.updateOrderStatus(o.id, o.status, { note: newNote });
        this.actionModalOrder.set({ ...o, note: newNote } as any); // 👈 加上 as any 繞過 TS 嚴格檢查
        alert('✅ 訂單內部備註已成功儲存！包貨時請務必留意！');
     } catch (e) {
        alert('❌ 儲存失敗，請檢查網路狀態。');
     }
  }

// 🚨 第二關：庫存告急預警大腦 (非預購、有上架、且庫存小於 5 的商品)
  lowStockAlerts = computed(() => {
     return this.activeProducts()
        .filter((p: Product) => !p.isPreorder && p.isListed && p.stock < 5)
        .sort((a: Product, b: Product) => a.stock - b.stock); // 庫存越少排越前面
  });

 // 🧠 核心升級：掃描全站真實訂單，算出每個商品的「真實總銷量」
  productSalesMap = computed(() => {
    const allOrders = this.store.orders().filter(o => o.status !== 'cancelled' && o.status !== 'refunded');
    const salesCount: Record<string, number> = {};
    allOrders.forEach(order => {
      // 🛡️ 加上 (order.items || []) 阻擋舊訂單的空值攻擊
      (order.items || []).forEach((item: any) => {
        if (!salesCount[item.productId]) salesCount[item.productId] = 0;
        salesCount[item.productId] += item.quantity;
      });
    });
    return salesCount;
  });

  // 🔥 修正：主控台熱銷排行改為使用剛算好的真實銷量大腦
  topProducts = computed(() => {
    const salesMap = this.productSalesMap();
    return [...this.activeProducts()]
      .map(p => ({
        ...p,
        soldCount: salesMap[p.id] || 0 
      }))
      .sort((a: any, b: any) => b.soldCount - a.soldCount)
      .slice(0, 5);
  });

  statsRange = signal('今日'); orderStart = signal(''); orderEnd = signal(''); orderSearch = signal('');  orderPageSize = signal<number | 'all'>(50); orderPage = signal(1); orderStatusTab = signal('all'); 
  actionModalOrder = signal<Order | null>(null); cancelConfirmState = signal(false);
  isSplittingOrder = signal(false); // 👈 新增：控制是否開啟拆單模式
  splitItemIndices = signal<Set<number>>(new Set()); // 👈 新增：記錄選中了哪些商品


  orderTabs = [ 
    { id: 'all', label: '全部' }, 
    { id: 'pending', label: '待付款' },   // 客人還沒匯款
    { id: 'verifying', label: '待對帳' }, // 客人給了後五碼，等老闆確認
    { id: 'shipping', label: '待出貨' },  // 老闆確認收到了，等待商品到貨寄出
    { id: 'arrived', label: '已到貨' }, // 貨已到，通知客人下單賣貨便
    { id: 'completed', label: '已完成' }, 
    { id: 'refund', label: '退款/取消' } 
  ];
  
  setOrderRange(range: string) { this.statsRange.set(range); this.orderStart.set(''); this.orderEnd.set(''); }

  // 1. 先過濾出符合「時間區間」與「搜尋關鍵字」的訂單母體
  baseFilteredOrders = computed(() => {
    let list = [...this.store.orders()]; 
    const q = this.orderSearch().toLowerCase(); const range = this.statsRange(); const now = new Date(); 
    if (range === '今日') list = list.filter((o: Order) => new Date(o.createdAt).toDateString() === now.toDateString()); 
    else if (range === '本週') { const s = new Date(now); s.setDate(now.getDate() - now.getDay()); s.setHours(0,0,0,0); list = list.filter((o: Order) => o.createdAt >= s.getTime()); } 
    else if (range === '本月') list = list.filter((o: Order) => new Date(o.createdAt).getMonth() === now.getMonth() && new Date(o.createdAt).getFullYear() === now.getFullYear()); 
    const os = this.orderStart(); const oe = this.orderEnd(); 
    if (os) list = list.filter((o: Order) => o.createdAt >= new Date(os).setHours(0,0,0,0)); 
    if (oe) list = list.filter((o: Order) => o.createdAt <= new Date(oe).setHours(23,59,59,999)); 
    if (q) list = list.filter((o: Order) => o.id.includes(q) || o.items.some((i: CartItem) => i.productName.toLowerCase().includes(q)) || this.getUserName(o.userId).toLowerCase().includes(q)); 
    return list.sort((a: any, b: any) => b.createdAt - a.createdAt); 
  });

  // 自動計算各狀態的數量 (讓上方表頭可以顯示數字)
  orderCounts = computed(() => {
     const list = this.baseFilteredOrders();
     return {
        all: list.length,
        // 待付款：包含尚未付款、逾期的訂單
        pending: list.filter((o: Order) => ['pending_payment', 'unpaid_alert'].includes(o.status)).length,
        // 待對帳：客人已回報後五碼，等你確認
        verifying: list.filter((o: Order) => o.status === 'paid_verifying').length,
        // 待出貨：你已確認收款 (也就是已對帳完畢)，或是貨到付款
        shipping: list.filter((o: Order) => o.status === 'payment_confirmed').length,
        // 已完成
        arrived: list.filter((o: Order) => o.status === 'arrived_notified').length, // 👈 新增這行計算數量
        // 已到貨
        completed: list.filter((o: Order) => ['shipped', 'picked_up', 'completed'].includes(o.status as any)).length,
        // 退款/取消
        refund: list.filter((o: Order) => ['refund_needed', 'refunded', 'cancelled'].includes(o.status)).length
     };
  });

  // 最終畫面顯示的訂單 (加上標籤狀態過濾)
  filteredOrders = computed(() => { 
    let list = this.baseFilteredOrders(); 
    const tab = this.orderStatusTab();
    
    if (tab === 'pending') {
      list = list.filter((o: Order) => ['pending_payment', 'unpaid_alert'].includes(o.status));
    } else if (tab === 'verifying') {
      list = list.filter((o: Order) => o.status === 'paid_verifying');
    } else if (tab === 'shipping') {
      list = list.filter((o: Order) => o.status === 'payment_confirmed');
    } else if (tab === 'arrived') {  // 👈 新增這三行判斷
      list = list.filter((o: Order) => o.status === 'arrived_notified');
    } else if (tab === 'completed') {
      list = list.filter((o: Order) => ['shipped', 'picked_up', 'completed'].includes(o.status as any));
    } else if (tab === 'refund') {
      list = list.filter((o: Order) => ['refund_needed', 'refunded', 'cancelled'].includes(o.status));
    }
    return list; 
  });
  
  paginatedOrders = computed(() => { 
    const list = this.filteredOrders(); const size = this.orderPageSize(); 
    if (size === 'all') return list; 
    const start = (this.orderPage() - 1) * size; 
    return list.slice(start, start + size); 
  });

  customerPageSize = signal<number | 'all'>(50); customerPage = signal(1); customerSearch = signal(''); 
  minSpendFilter = signal<number | null>(null); memberStart = signal(''); memberEnd = signal(''); 
  showUserModal = signal(false); editingUser = signal<User | null>(null); userForm: FormGroup;

  // ⚡️ 批次操作狀態
  selectedCustomerIds = signal<string[]>([]);
  showBulkCustomerModal = signal(false);
  bulkActionType = signal<'vip' | 'credits'>('credits');
  bulkCreditAmount = signal<number>(0);
  
  filteredUsers = computed(() => { 
    let list = [...this.store.users()]; 
    const q = this.customerSearch().toLowerCase(); const minSpend = this.minSpendFilter(); const start = this.memberStart(); const end = this.memberEnd(); 
    
    // 🛡️ 加上安全防呆：萬一有客人沒填名字，也不會導致搜尋當機
    if (q) list = list.filter((u: User) => (u.name || '').toLowerCase().includes(q) || (u.phone && u.phone.includes(q)) || u.id.toLowerCase().includes(q) || (u.memberNo && u.memberNo.includes(q))); 
    
    if (start || end) { list = list.filter(u => { if (!u.memberNo || u.memberNo.length < 9) return false; const noDatePart = u.memberNo.substring(1, 9); const startDate = start ? start.replace(/-/g, '') : null; const endDate = end ? end.replace(/-/g, '') : null; if (startDate && noDatePart < startDate) return false; if (endDate && noDatePart > endDate) return false; return true; }); } 
    
    if (minSpend !== null && minSpend > 0) {
       list = list.filter((u: User) => this.calculateUserTotalSpend(u.id) >= minSpend);
    }
    
    // 🌟 核心升級：強制將名單依照「會員編號 (註冊時間)」從最新排到最舊
    return list.sort((a, b) => {
       const aNo = a.memberNo || a.id;
       const bNo = b.memberNo || b.id;
       return bNo.localeCompare(aNo);
    }); 
  });
  
  paginatedUsers = computed(() => { 
    const list = this.filteredUsers(); const size = this.customerPageSize(); 
    if (size === 'all') return list; 
    const start = (this.customerPage() - 1) * size; 
    return list.slice(start, start + size); 
  });

  showProductModal = signal(false); editingProduct = signal<Product | null>(null); productForm: FormGroup;
  isQuickMode = signal(true); // ⚡️ 控制連線快閃模式的開關 
  
  // 🗑️ 垃圾桶系統大腦
  showTrashModal = signal(false);
  deletedProducts = computed(() => this.store.products().filter((p: any) => p.isDeleted));
  // 🟢 活著的商品大腦 (過濾掉垃圾桶裡的)
  activeProducts = computed(() => this.store.products().filter((p: any) => !p.isDeleted));

  openTrashModal() {
    const now = Date.now();
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
    // 打開垃圾桶時，自動徹底刪除超過 30 天的垃圾
    this.deletedProducts().forEach(async (p: any) => {
       if (p.deletedAt && (now - p.deletedAt > THIRTY_DAYS)) {
           try { await this.store.deleteProduct(p.id); } catch(e) {}
       }
    });
    this.showTrashModal.set(true);
  }

  async restoreProduct(p: any) {
    if(confirm(`確定要將「${p.name}」從垃圾桶救回來嗎？`)) {
       await this.store.updateProduct({ ...p, isDeleted: false, deletedAt: null, isListed: false } as any);
       alert('✅ 商品已成功復原！\n(系統已預設為「未上架」狀態，請您確認無誤後再手動上架)');
    }
  }

  async forceDeleteProduct(p: any) {
    if(confirm(`🚨 警告：徹底刪除將無法復原，且會導致包含此商品的歷史訂單報錯！\n您確定要永久抹除嗎？`)) {
       await this.store.deleteProduct(p.id);
    }
  }

  tempImages = signal<string[]>([]); formValues = signal<any>({}); categoryCodes = computed(() => this.store.settings().categoryCodes); 
  currentCategoryCode = signal(''); generatedSkuPreview = signal(''); settingsForm: FormGroup;

  // === 圖片拖曳排序相關邏輯 ===
  draggedImageIndex = signal<number | null>(null);

  onImageDragStart(index: number) {
    this.draggedImageIndex.set(index);
  }

  onImageDragOver(event: DragEvent) {
    event.preventDefault(); 
  }

  onImageDrop(event: DragEvent, dropIndex: number) {
    event.preventDefault();
    const dragIndex = this.draggedImageIndex();
    if (dragIndex === null || dragIndex === dropIndex) return;

    this.tempImages.update(images => {
      const newImages = [...images];
      const [draggedItem] = newImages.splice(dragIndex, 1);
      newImages.splice(dropIndex, 0, draggedItem);
      return newImages;
    });
    this.draggedImageIndex.set(null); 
  }
  
  constructor() {
    this.productForm = this.fb.group({ 
      name: ['', Validators.required], 
      purchaseUrl: [''], 
      category: [''], 
      subCategory: [''], 
      tagsStr: [''], 
      code: [''], 
      priceGeneral: [0], 
      priceVip: [0], 
      priceWholesale: [0],
      localCurrency: ['KRW'], // 👈 新增這行：預設幣別為韓幣
      localPrice: [0], 
      exchangeRate: [1], 
      weight: [0], 
      shippingCostPerKg: [0], 
      costMaterial: [0], 
      stock: [0], 
      optionsStr: [''], 
      note: [''], 
      isPreorder: [false], 
      isListed: [true], 
      isHidden: [false],
      bulkCount: [0], 
      bulkTotal: [0],
      shareMode: ['親帶'] // 👈 新增這行：預設為親帶
    });

// 👇 在這裡加上這段：啟動表單即時監聽大腦 👇
    this.productForm.valueChanges.subscribe(val => {
       this.formValues.set(val);
    });

    const s = this.store.settings();
    this.settingsForm = this.fb.group({ enableCash: [s.paymentMethods.cash], enableBank: [s.paymentMethods.bankTransfer], enableCod: [s.paymentMethods.cod], birthdayGiftGeneral: [s.birthdayGiftGeneral], birthdayGiftVip: [s.birthdayGiftVip], shipping: this.fb.group({ freeThreshold: [s.shipping.freeThreshold], methods: this.fb.group({ meetup: this.fb.group({ enabled: [s.shipping.methods.meetup.enabled], fee: [s.shipping.methods.meetup.fee] }), myship: this.fb.group({ enabled: [s.shipping.methods.myship.enabled], fee: [s.shipping.methods.myship.fee] }), family: this.fb.group({ enabled: [s.shipping.methods.family.enabled], fee: [s.shipping.methods.family.fee] }), delivery: this.fb.group({ enabled: [s.shipping.methods.delivery.enabled], fee: [s.shipping.methods.delivery.fee] }) }) }) });
    this.userForm = this.fb.group({ name: ['', Validators.required], phone: [''], birthday: [''], tier: ['general'], credits: [0], totalSpend: [0], note: [''] });

    // 👇 新增的支出與錢包表單初始化 (包在 constructor 裡面)
    this.expenseForm = this.fb.group({
      date: [new Date().toISOString().slice(0, 10), Validators.required],
      item: ['', Validators.required],
      category: [''],
      amount: ['', [Validators.required, Validators.min(1)]],
      currency: [''],
      payer: ['', Validators.required],
      note: [''],
      imageUrl: [''], // 👈 這裡用來存 Google Drive 回傳的照片網址
      isHistorical: [false] // 👈 新增純紀錄預設值
    });

    this.walletForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(1)]],
      note: ['']
    });

    this.addWalletForm = this.fb.group({
      name: ['', Validators.required],
      currency: ['JPY', Validators.required],
      symbol: ['¥', Validators.required],
      balance: [0, Validators.required]
    });

    this.giveawayForm = this.fb.group({
      targetOrderId: [''], // 👈 新增這行：目標訂單編號
      productId: ['', Validators.required],
      option: ['單一規格'],
      quantity: [1, [Validators.required, Validators.min(1)]],
      winnerName: ['', Validators.required],
      winnerPhone: [''],
      shippingAddress: [''],
      note: ['']
    });

    this.promoForm = this.fb.group({
      code: ['', Validators.required],
      type: ['amount'], // 👈 改成 amount (對應 HTML 裡的設定)
      value: [0, [Validators.required, Validators.min(1)]],
      minSpend: [0],
      usageLimit: [0],
      expiryDate: [''],
      active: [true] // 👈 把 isActive 改成 active
    });

    this.editPurchaseForm = this.fb.group({
       id: [''],
       date: [''],
       location: [''],
       currency: ['KRW'],
       localShipping: [0],
       totalLocalCost: [0],
       payer: [''],
       shareMode: ['親帶']
    });
  } // 👈 constructor 的唯一結束大括號

  calculateUserTotalSpend(userId: string): number {
    const validStatuses = ['payment_confirmed', 'pending_shipping', 'shipped', 'arrived_notified', 'picked_up', 'completed'];
    return this.store.orders()
      .filter((o: Order) => o.userId === userId && validStatuses.includes(o.status))
      .reduce((sum: number, o: Order) => sum + o.finalTotal, 0);
  }

// 💡 1. 客用預估 (維持你的 1/40 或表單手填匯率，用來抓定價緩衝)
  estimatedCost = computed(() => { 
    const v = this.formValues(); if (!v) return 0; 
    return (v.localPrice * v.exchangeRate); 
  });
  estimatedProfit = computed(() => (this.formValues()?.priceGeneral || 0) - this.estimatedCost()); 
  estimatedMargin = computed(() => this.formValues()?.priceGeneral ? (this.estimatedProfit() / this.formValues().priceGeneral) * 100 : 0);

  // 🧠 2. 真實底價預估 (強制用 1/43 算，給老闆看真實利潤與員工價參考)
  realEstimatedCost = computed(() => {
    const v = this.formValues(); if (!v) return 0; 
    // 💡 直接呼叫剛剛寫好的大腦，不再重複寫邏輯！
    return v.localPrice * this.getRealExchangeRate(v);
  });
  realEstimatedProfit = computed(() => (this.formValues()?.priceGeneral || 0) - this.realEstimatedCost());
  realEstimatedMargin = computed(() => this.formValues()?.priceGeneral ? (this.realEstimatedProfit() / this.formValues().priceGeneral) * 100 : 0);  
  
  navClass(tab: string) { return `w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all mb-1 ${this.activeTab() === tab ? 'bg-brand-900 text-white font-bold shadow-md' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`; } 
  getTabTitle() { const map: any = { dashboard: '主控台 Dashboard', orders: '訂單管理 Orders', products: '商品管理 Products', customers: '客戶管理 Customers', accounting: '銷售報表 Accounting', inventory: '庫存盤點 Inventory', purchases: '採購總帳 Purchases', settings: '商店設定 Settings', wallets: '資金帳戶 Wallets', expenses: '營業支出 Expenses' }; return map[this.activeTab()] || ''; }  
  // === 🧾 採購總帳專用邏輯 ===
  showReceiptModal = signal(false);
  viewReceiptImages = signal<string[]>([]);
  
// 🚀 核心升級：直接抓取資料庫裡的真實採購單，並依時間排序 (加上圖片格式除垢清洗)
  purchaseList = computed(() => {
    const purchases = this.store.purchases();
    // 終極防呆：確保資料庫回傳的絕對是陣列，並過濾掉可能的壞檔
    if (!Array.isArray(purchases)) return [];
    let list = [...purchases].filter(p => !!p);
    
    const start = this.purchaseStart();
    const end = this.purchaseEnd();
    if (start) list = list.filter((p: any) => new Date(p.date) >= new Date(start));
    if (end) list = list.filter((p: any) => new Date(p.date) <= new Date(end));

    return list.map((p: any) => {
        let validImages: string[] = [];
        
        // 🛡️ 洗淨買手系統傳來的各種奇葩格式
        if (Array.isArray(p.receiptImages)) {
            validImages = p.receiptImages.map((img: any) => {
                if (typeof img === 'string') return img;
                if (img && typeof img === 'object') return img.url || img.link || '';
                return '';
            }).filter((s: string) => s && typeof s === 'string' && s.includes('http'));
        } else if (typeof p.receiptImages === 'string' && p.receiptImages.trim() !== '') {
            try {
                const parsed = JSON.parse(p.receiptImages);
                if (Array.isArray(parsed)) {
                    validImages = parsed.map((s:any) => typeof s === 'object' ? (s.url || '') : String(s)).filter((s:string) => s.includes('http'));
                }
            } catch (e) {
                validImages = p.receiptImages.split(',').filter((s:string) => s.includes('http'));
            }
        } else if (p.receiptImage) {
            validImages = [typeof p.receiptImage === 'string' ? p.receiptImage : (p.receiptImage.url || '')];
        } else if (p.imageUrl) {
            validImages = [typeof p.imageUrl === 'string' ? p.imageUrl : (p.imageUrl.url || '')];
        }
        
        // 徹底清除陣列殘留的引號與括號
        validImages = validImages.map(s => String(s).replace(/['"\[\]]/g, '').trim());

        return { ...p, receiptImages: validImages };

    }).sort((a: any, b: any) => {
         const timeA = new Date(a?.createdAt || 0).getTime() || 0;
         const timeB = new Date(b?.createdAt || 0).getTime() || 0;
         return timeB - timeA;
    });
  });
  
  openReceipts(images: string[]) {
    this.viewReceiptImages.set(images || []);
    this.showReceiptModal.set(true);
  }

  async approvePurchase(p: any) {
    if(confirm(`⚠️ 確定核准這筆支出 (實際刷卡總額: ${p.totalLocalCost}) 並入帳嗎？\n\n系統將會同步：\n1. 從對應幣別的【資金帳戶】扣除餘額\n2. 在【營業支出】自動建立一筆採購紀錄`)) {
      const currency = p.country === '韓國' ? 'KRW' : 'TWD';
      const targetWallet = this.wallets().find((w:any) => w.currency === currency);
      
      if(targetWallet) { 
         await this.store.updateWalletBalance(targetWallet.id, targetWallet.balance - Number(p.totalLocalCost)); 
      }
      // 🔥 確保乾淨寫入，不帶 remainingBalance
      await this.store.addExpense({ id: 'EXP-' + Date.now(), date: new Date().toISOString().slice(0,10), item: `採購單核銷: ${p.location || p.id}`, category: '商品採購', amount: Number(p.totalLocalCost), currency: currency, payer: p.payer, note: `系統自動拋轉` });
      await this.store.updatePurchaseStatus(p.id, 'completed');
      alert('✅ 已成功核准入帳！資金帳戶與支出報表已同步更新。');
    }
  }

  // 👇👇👇 把步驟 4 的代碼貼在這裡 👇👇👇
  openEditPurchaseModal(p: any) {
     this.editPurchaseForm.patchValue({
        id: p.id,
        date: p.date || new Date().toISOString().slice(0, 10),
        location: p.location,
        currency: p.currency || 'KRW',
        localShipping: p.localShipping || 0,
        totalLocalCost: p.totalLocalCost || 0,
        payer: p.payer,
        shareMode: p.shareMode || '親帶'
     });
     this.showEditPurchaseModal.set(true);
  }

  closeEditPurchaseModal() {
     this.showEditPurchaseModal.set(false);
  }

  async submitEditPurchase() {
     if(this.editPurchaseForm.invalid) return;
     const val = this.editPurchaseForm.value;
     
     const original = this.store.purchases().find((x:any) => x.id === val.id);
     
     if(original) {
        const updated = {
           ...original,
           date: val.date,
           location: val.location,
           currency: val.currency,
           localShipping: Number(val.localShipping) || 0,
           totalLocalCost: Number(val.totalLocalCost) || 0,
           payer: val.payer,
           shareMode: val.shareMode
        };
        
        try {
           await (this.store as any).addPurchase(updated);
           alert('✅ 採購單資訊已成功更新！');
           this.closeEditPurchaseModal();
        } catch (e) {
           alert('❌ 更新失敗：' + e);
        }
     }
  }
  // 👆👆👆 新增結束 👆👆👆
  
  async deletePurchaseRecord(p: any) {
    if (confirm(`⚠️ 警告：確定要徹底刪除這筆採購單嗎？\n系統將會同步扣回商品對應的「已採購數量」，資料刪除後無法復原！`)) {
      await this.store.deletePurchase(p.id, p.items || []);
      alert('✅ 採購單已成功刪除，叫貨數量已退回！');
    }
  }

  // 📥 匯出：採購總帳 (新增結算匯出時間)
  exportPurchasesCSV() {
    const nowStr = new Date().toLocaleString('zh-TW', { hour12: false });
    const headers = ['結算匯出時間', '單據編號', '購買日期', '回報時間', '國家', '地點/網址', '購買品項', '預估商品總額', '單據運費', '結帳幣別', '實際刷卡金額', '付款人', '分潤模式', '狀態'];
    
    const rows = this.purchaseList().map(p => {
      const itemsStr = (p.items || []).map((i: any) => {
        const curr = i.currency === 'KRW' ? '₩' : (i.currency === 'TWD' ? 'NT$' : (i.currency || p.currency || '$'));
        return `• ${i.productName} [${i.option || '單一規格'}] x${i.quantity} (@ ${curr}${i.price || 0})`;
      }).join('\n');
      
      return [
        nowStr, `\t${p.id}`, p.date, new Date(p.createdAt).toLocaleString('zh-TW', { hour12: false }),
        p.country, p.location, itemsStr,
        p.estimatedLocalCost, p.localShipping,
        p.currency || 'TWD', p.totalLocalCost, 
        p.payer, p.shareMode, p.status === 'pending_sync' ? '待核銷' : '已核銷入帳'
      ];
    });

    this.downloadCSV(`採購總帳明細_${new Date().toISOString().slice(0,10)}`, headers, rows);
  }
  
  goToOrders(filter: string) { this.activeTab.set('orders'); this.orderStatusTab.set(filter); } 
  toNumber(val: any) { return Number(val); } 
  getUserName(id: string) { return this.store.users().find((u: User) => u.id === id)?.name || id; } 
  getThumb(o: Order) { return o.items[0]?.productImage; } 
  timeAgo(ts: number) { const mins = Math.floor((Date.now() - ts) / 60000); if(mins < 60) return `${mins} 分鐘前`; const hours = Math.floor(mins / 60); if(hours < 24) return `${hours} 小時前`; return `${Math.floor(hours/24)} 天前`; }
  
  formatMemberNo(u: User): string { 
    const no = u.memberNo || u.memberId;
    if (!no) return u.id; 
    if (no.includes('/')) return 'M' + no.replace(/\//g, ''); 
    return no; 
  }

  getPaymentStatusLabel(s: string, method?: string) { const map: any = { pending_payment: '未付款', paid_verifying: '對帳中', unpaid_alert: '逾期未付', refund_needed: '需退款', refunded: '已退款', payment_confirmed: method === 'cod' ? '待出貨 (未入帳)' : '已付款', pending_shipping: '待出貨', arrived_notified: method === 'cod' ? '已貨到通知 (未入帳)' : '已付款', shipped: method === 'cod' ? '已出貨 (未入帳)' : '已出貨', picked_up: method === 'cod' ? '已取貨 (未撥款)' : '已取貨', completed: '已完成 (已入帳)', cancelled: '🚫 已取消' }; return map[s] || s; } 
  getPaymentStatusClass(s: string) { if(s==='payment_confirmed') return 'bg-green-100 text-green-700'; if(s==='paid_verifying') return 'bg-yellow-100 text-yellow-700'; if(s==='pending_payment' || s==='unpaid_alert') return 'bg-red-50 text-red-500'; if(s==='refunded') return 'bg-gray-200 text-gray-500 line-through'; if(s==='cancelled') return 'bg-gray-200 text-gray-400 border border-gray-300'; if(s==='refund_needed') return 'bg-red-100 text-red-700 font-bold border border-red-200'; if(s==='arrived_notified') return 'bg-purple-100 text-purple-700 font-bold'; if(s==='picked_up') return 'bg-teal-100 text-teal-700 font-bold'; if(s==='completed') return 'bg-green-600 text-white font-bold'; return 'bg-gray-100 text-gray-500'; } 
  // 把原本的替換成這樣 (將 pending_shipping 改為 配單中(待包貨))
  getShippingStatusLabel(s: string) { const map: any = { payment_confirmed: '待出貨', pending_shipping: '配單中(待包貨)', shipped: '已出貨', arrived_notified: '已到貨', picked_up: '門市已取貨', completed: '已完成' }; return map[s] || '-'; }  
  // 把原本的替換成這樣 (加上 pending_shipping 的橘色標籤)
  getShippingStatusClass(s: string) { if(s==='pending_shipping') return 'bg-orange-100 text-orange-700 font-bold'; if(s==='shipped') return 'bg-blue-100 text-blue-700'; if(s==='arrived_notified') return 'bg-purple-100 text-purple-700 font-bold'; if(s==='picked_up') return 'bg-teal-100 text-teal-700 font-bold'; if(s==='completed') return 'bg-gray-800 text-white'; return 'text-gray-400'; }  
  getPaymentLabel(m: string) { const map: any = { cash: '現金付款', bank_transfer: '銀行轉帳', cod: '貨到付款', giveaway: '🎁 行銷抽獎' }; return map[m] || m; }
  getShippingLabel(m: string) { const map: any = { meetup: '面交自取', myship: '7-11 賣貨便', family: '全家好賣家', delivery: '宅配寄送' }; return map[m] || m; }
  
  openAction(e: Event, order: Order) { e.stopPropagation(); this.actionModalOrder.set(order); this.cancelConfirmState.set(false); } 
  closeActionModal() { 
     this.actionModalOrder.set(null); 
     this.isSplittingOrder.set(false); 
     this.splitItemIndices.set(new Set());
  } 

  // --- 彈窗內的詳細操作按鈕 (已加入自動發信) ---
  doConfirm(o: Order) { this.store.updateOrderStatus(o.id, 'payment_confirmed'); this.store.sendOrderNotification(o, 'payment_confirmed'); this.closeActionModal(); } 
  doAlert(o: Order) { this.store.updateOrderStatus(o.id, 'unpaid_alert'); this.store.sendOrderNotification(o, 'payment_reminder'); this.closeActionModal(); } 
  doRefundNeeded(o: Order) { this.store.updateOrderStatus(o.id, 'refund_needed'); this.orderStatusTab.set('refund'); this.store.sendOrderNotification(o, 'refund_needed'); this.closeActionModal(); } 
  doRefundDone(o: Order) { this.store.updateOrderStatus(o.id, 'refunded'); this.store.sendOrderNotification(o, 'refunded'); this.closeActionModal(); } 
  doShip(o: Order) { 
    // 👇 點擊詳細操作裡的出貨時，會自動帶入已經配對好的 CM 代碼讓你確認
    const code = prompt('請確認物流單號 / 交貨便代碼 (若無可直接按確認)', o.shippingLink || ''); 
    if (code !== null) { 
      this.store.updateOrderStatus(o.id, 'shipped', { shippingLink: code }); 
      this.store.sendOrderNotification(o, 'shipped', { shippingLink: code }); 
      this.closeActionModal(); 
    } 
  }  
  doMyshipPickup(o: Order) { this.store.updateOrderStatus(o.id, 'picked_up' as any); this.closeActionModal(); } 
  doCancel(o: Order) { 
    if(this.cancelConfirmState()) { 
      this.store.updateOrderStatus(o.id, 'cancelled'); 
      this.store.sendOrderNotification(o, 'cancelled'); // 🔥 觸發 GAS 發送信件與推播
      this.closeActionModal(); 
    } else { 
      this.cancelConfirmState.set(true); 
    } 
  }  doDeleteOrder(o: Order) { if(confirm(`⚠️ 警告：確定要徹底刪除訂單 #${o.id} 嗎？\n資料刪除後將無法復原，且系統會自動扣除該會員對應的累積消費金額！`)) { this.store.deleteOrder(o); this.closeActionModal(); } } 
  
  // --- 列表上的快捷操作按鈕 (也一併加入自動發信) ---
  quickConfirm(e: Event, o: Order) { e.stopPropagation(); this.store.updateOrderStatus(o.id, 'payment_confirmed'); this.store.sendOrderNotification(o, 'payment_confirmed'); } 
  quickShip(e: Event, o: Order) { 
    e.stopPropagation(); 
    this.store.updateOrderStatus(o.id, 'shipped'); 
    // 👇 出貨時，如果有綁定賣貨便代碼，就一併放在信件裡寄給客人
    this.store.sendOrderNotification(o, 'shipped', { shippingLink: o.shippingLink || '' }); 
  }
  quickRefundDone(e: Event, o: Order) { e.stopPropagation(); this.store.updateOrderStatus(o.id, 'refunded'); this.store.sendOrderNotification(o, 'refunded'); } 
  quickComplete(e: Event, o: Order) { e.stopPropagation(); this.store.updateOrderStatus(o.id, 'completed'); }

  updatePaymentLast5(o: Order, event: any) { 
    const val = event.target.value.trim(); 
    
    // 🔥 智慧邏輯：如果有填後五碼，且原本是「待付款」，就自動幫你切換到「待對帳 (paid_verifying)」！
    let newStatus = o.status;
    if (val && (o.status === 'pending_payment' || o.status === 'unpaid_alert')) {
      newStatus = 'paid_verifying';
    } else if (!val && o.status === 'paid_verifying') {
      // 如果你把後五碼清空，就自動退回待付款
      newStatus = 'pending_payment';
    }

    this.store.updateOrderStatus(o.id, newStatus, { paymentLast5: val }); 
    this.actionModalOrder.set({ ...o, status: newStatus, paymentLast5: val }); 
  }
  
  private downloadCSV(filename: string, headers: string[], rows: any[]) { const BOM = '\uFEFF'; const csvContent = [ headers.join(','), ...rows.map(row => row.map((cell: any) => `"${String(cell === null || cell === undefined ? '' : cell).replace(/"/g, '""')}"`).join(',')) ].join('\r\n'); const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.setAttribute('download', `${filename}.csv`); document.body.appendChild(link); link.click(); document.body.removeChild(link); } 
  exportOrdersCSV() { 
     // 👇 1. 表頭加上內部備註
     const headers = ['訂單編號', '下單日期', '客戶姓名', '付款方式', '匯款後五碼', '物流方式', '總金額', '訂單狀態', '交貨便代碼/物流單號', '商品內容 (含價格明細)', '內部備註']; 
     const payMap: any = { cash: '現金付款', bank_transfer: '銀行轉帳', cod: '貨到付款', giveaway: '🎁 抽獎' }; 
     const shipMap: any = { meetup: '面交自取', myship: '7-11 賣貨便', family: '全家好賣家', delivery: '宅配寄送' };

    const rows = this.filteredOrders().map((o: Order) => { 
      const u = this.store.users().find((user: User) => user.id === o.userId);
      
      // 將商品明細組裝為包含 (一般/VIP/實收) 的詳細格式
      const itemDetails = o.items.map((i: CartItem) => {
        const p = this.store.products().find((x: Product) => x.id === i.productId);
        let detailString = `• ${i.productName} (${i.option}) x${i.quantity}`;
        if (p) {
          detailString += ` [一般:$${p.priceGeneral} / VIP:$${p.priceVip} / 實收:$${i.price}]`;
        } else {
          detailString += ` [實收:$${i.price}]`;
        }
        
        // 👇 加上叫貨狀態
        const procStatus = this.getItemProcureStatus(i.productId, i.option);
        if (procStatus) {
          if (procStatus.procured >= procStatus.needed) {
            detailString += ` (✅已買齊)`;
          } else {
            detailString += ` (⚠️缺${procStatus.needed - procStatus.procured})`;
          }
        }
        return detailString;
      }).join('\n');

      return [ 
        `\t${o.id}`, 
        new Date(o.createdAt).toLocaleString('zh-TW', { hour12: false }), 
        this.getUserName(o.userId), 
        payMap[o.paymentMethod] || o.paymentMethod, 
        o.paymentLast5 ? `\t${o.paymentLast5}` : '', 
        shipMap[o.shippingMethod] || o.shippingMethod, 
        o.finalTotal, 
        this.getPaymentStatusLabel(o.status, o.paymentMethod), 
        o.shippingLink || '', 
        itemDetails,
        (o as any).note || '' // 👈 2. 印出我們存的內部備註 (用 as any 繞過檢查)
      ]; 
    });
    this.downloadCSV(`訂單報表_${new Date().toISOString().slice(0,10)}`, headers, rows); 
  }
  
  exportCustomersCSV() { 
     const nowStr = new Date().toLocaleString('zh-TW', { hour12: false });
     const headers = ['會員編碼', '結算匯出時間', '會員ID', '姓名', '電話', '等級', '累積消費', '購物金餘額', '生日']; 
     const tierMap: any = { 'v1': 'VIP 1', 'v2': 'VIP 2', 'v3': 'VIP 3', 'vip': 'VIP', 'wholesale': '批發', 'employee': '內部員工', 'general': '一般' };
     const rows = this.filteredUsers().map((u: User) => [ 
        `\t${this.formatMemberNo(u)}`, nowStr, `\t${u.id}`, u.name, `\t${u.phone || ''}`, tierMap[u.tier] || '一般', 
        this.calculateUserTotalSpend(u.id), u.credits, u.birthday || '' 
     ]); 
     this.downloadCSV(`會員名單_${new Date().toISOString().slice(0,10)}`, headers, rows); 
  }

exportInventoryCSV() { 
      const nowStr = new Date().toLocaleString('zh-TW', { hour12: false });
      const headers = ['SKU貨號', '結算匯出時間', '商品名稱', '分類', '次分類', '庫存數量', '狀態']; 
      const rows = this.activeProducts().map((p: Product) => [ 
        `\t${p.code}`, nowStr, p.name, p.category, p.subCategory || '', p.stock, p.stock <= 0 ? '缺貨' : (p.stock < 5 ? '低庫存' : '充足') 
      ]); 
      this.downloadCSV(`庫存盤點表_${new Date().toISOString().slice(0,10)}`, headers, rows); 
  }  

  // ==========================================
  // ☁️ Google Sheets 萬用發射器與各模組同步功能
  // ==========================================
  private readonly SHEETS_GAS_URL = 'https://script.google.com/macros/s/AKfycbwCBQjv_aHhgRQhyAnSkddhapYHiwgzkEBDxnxTgItJZsmku5uPRC0IYscHfo7mdCs2/exec';

  // 🚀 萬用智慧同步器 (支援覆蓋、更新、增量)
  private async pushToGoogleSheets(sheetName: string, rows: any[], mode: 'overwrite' | 'upsert' | 'append' = 'overwrite', silent: boolean = false) {
    if (rows.length === 0) return;
    
    if (!silent && !confirm(`⏳ 準備執行「${sheetName}」同步 (模式: ${mode})\n確定開始傳送？`)) return;
    
    try {
      const res = await fetch(this.SHEETS_GAS_URL, { 
        method: 'POST', 
        body: JSON.stringify({ sheetName, rows, mode }) 
      });
      const result = await res.json();
      if (!silent) {
         if (result.success) alert(`✅ 同步成功！`);
         else alert('❌ 同步失敗: ' + result.error);
      }
    } catch (e) { 
      if (!silent) alert('❌ 發生網路錯誤'); 
    }
  }

  syncOrdersToGoogleSheets() {
    const payMap: any = { cash: '現金付款', bank_transfer: '銀行轉帳', cod: '貨到付款', giveaway: '🎁 抽獎'}; 
    const shipMap: any = { meetup: '面交自取', myship: '7-11 賣貨便', family: '全家好賣家', delivery: '宅配寄送' }; 
    
    // 👇 1. 表頭加上內部備註
    const headers = ['訂單編號', '下單日期', '客戶姓名', '付款方式', '匯款後五碼', '物流方式', '總金額', '訂單狀態', '交貨便代碼/物流單號', '商品內容 (含價格明細)', '內部備註'];
    const dataRows = this.filteredOrders().map((o: Order) => {
      // 👇 在這裡組裝帶有叫貨狀態的明細
      const itemDetails = o.items.map((i: CartItem) => {
        let detailString = `• ${i.productName} (${i.option}) x${i.quantity}`;
        const procStatus = this.getItemProcureStatus(i.productId, i.option);
        if (procStatus) {
          if (procStatus.procured >= procStatus.needed) {
            detailString += ` (✅已買齊)`;
          } else {
            detailString += ` (⚠️缺${procStatus.needed - procStatus.procured})`;
          }
        }
        return detailString;
      }).join('\n');

      return [
        `'${o.id}`, new Date(o.createdAt).toLocaleString('zh-TW', { hour12: false }), this.getUserName(o.userId),
        payMap[o.paymentMethod] || o.paymentMethod, o.paymentLast5 ? `'${o.paymentLast5}` : '',
        shipMap[o.shippingMethod] || o.shippingMethod, o.finalTotal, this.getPaymentStatusLabel(o.status, o.paymentMethod),
        o.shippingLink || '', itemDetails, (o as any).note || '' // 👈 2. 加入內部備註
      ];
    });
    
    // 把表頭放在第一行送出
    this.pushToGoogleSheets('訂單管理', [headers, ...dataRows], 'overwrite');
  }

  syncProductsToGoogleSheets() {
    // 1. 表頭同步新增「購買網址」
    const headers = [ '匯率換算/40', '匯率換算/43', '常數150', '貨號(註記用)', '表頭說明範例(A)', '商品名稱(B)', '分類(C)', '次分類', '標籤(逗號分隔)', '售價(D)', 'VIP價(E)', '當地原價(F)', '匯率(G)', '重量(H)', '國際運費/kg(I)', '額外成本(J)', '任選數量(K)', '優惠總價(L)', '圖片網址(M)', '規格(N)', '庫存(O)', '是否預購(P)', '是否上架(Q)', '自訂貨號SKU(R)', '備註介紹(S)', '購買網址', '【參考】單件成本', '【參考】一般單件毛利', '【參考】優惠單件毛利', '【參考】已售出' ];
    const salesMap = this.productSalesMap();
    
    const dataRows = this.activeProducts().map((p: Product) => {
      const cost = (p.localPrice * this.getRealExchangeRate(p)); 
      const normalProfit = p.priceGeneral - cost; 
      const bulkProfit = (p.bulkDiscount?.count && p.bulkDiscount?.total) ? ((p.bulkDiscount.total / p.bulkDiscount.count) - cost).toFixed(0) : '無優惠'; 
      const realSoldCount = salesMap[p.id] || 0; 
      
      return [
        '', '', '', `'${p.code}`, '', p.name, p.category, p.subCategory || '', (p.tags || []).join(','), p.priceGeneral, p.priceVip,
        p.localPrice, p.exchangeRate, p.weight, p.shippingCostPerKg, p.costMaterial, p.bulkDiscount?.count || '', p.bulkDiscount?.total || '',
        (p.images && p.images.length > 0) ? p.images.join(',') : p.image, p.options.join(','), p.stock, p.isPreorder ? 'TRUE' : 'FALSE',
        p.isListed ? 'TRUE' : 'FALSE', '', p.note || '', (p as any).purchaseUrl || '', cost.toFixed(0), normalProfit.toFixed(0), bulkProfit, realSoldCount
      ];
    });
    this.pushToGoogleSheets('商品總表', [headers, ...dataRows], 'overwrite');
  }

  syncCustomersToGoogleSheets() {
    const nowStr = new Date().toLocaleString('zh-TW', { hour12: false });
    const headers = ['會員編碼', '結算匯出時間', '會員ID', '姓名', '電話', '等級', '累積消費', '購物金餘額', '生日'];
    const dataRows = this.filteredUsers().map((u: User) => [
      `'${this.formatMemberNo(u)}`, nowStr, `'${u.id}`, u.name, `'${u.phone || ''}`, u.tier === 'vip' ? 'VIP' : (u.tier === 'wholesale' ? '批發' : '一般'),
      this.calculateUserTotalSpend(u.id), u.credits, u.birthday || ''
    ]);
    this.pushToGoogleSheets('會員名單', [headers, ...dataRows], 'upsert');
  }

  syncInventoryToGoogleSheets() {
    const nowStr = new Date().toLocaleString('zh-TW', { hour12: false });
    const headers = ['SKU貨號', '結算匯出時間', '商品名稱', '分類', '次分類', '庫存數量', '狀態']; 
    const dataRows = this.activeProducts().map((p: Product) => [
      `'${p.code}`, nowStr, p.name, p.category, p.subCategory || '', p.stock, p.stock <= 0 ? '缺貨' : (p.stock < 5 ? '低庫存' : '充足')
    ]);
    this.pushToGoogleSheets('庫存盤點表', [headers, ...dataRows], 'upsert');
  }

  syncProcurementToGoogleSheets() {
    const headers = ['商品名稱', '規格', '訂單包含日期', '需叫貨數量', '已買到數量', '狀態'];
    const dataRows = this.procurementList().map(item => [
      item.name, item.option, `'${item.orderDatesStr}`, item.needed, item.procured,
      item.procured >= item.needed ? '✅ 已買齊' : '⚠️ 還缺 ' + (item.needed - item.procured)
    ]);
    const rangeLabel = this.procureRange() === 'all' ? '全部' : (this.procureRange() === 'today' ? '今日' : (this.procureRange() === 'yesterday' ? '昨日' : '自訂區間'));
    this.pushToGoogleSheets(`叫貨表_${rangeLabel}`, [headers, ...dataRows], 'overwrite');
  }
  exportToCSV() { 
    const range = this.accountingRange(); 
    const now = new Date(); 
    let startDate: Date | null = null; 
    if (range === 'today') startDate = new Date(now.setHours(0,0,0,0)); 
    else if (range === 'week') startDate = new Date(now.setDate(now.getDate() - now.getDay())); 
    else if (range === 'month') startDate = new Date(now.getFullYear(), now.getMonth(), 1); 
    else if (range === 'year') startDate = new Date(now.getFullYear(), 0, 1);
    
    let list = this.accountingFilteredOrders(); 
    const headers = ['訂單編號', '日期', '客群類型', '付款方式', '匯款後五碼', '商品內容 (含價格明細)', '總營收', '商品總成本', '預估利潤', '毛利率%', '藝辰分潤', '子婷分潤', '小芸分潤', '公司保留'];
    const payMap: any = { cash: '現金', bank_transfer: '轉帳', cod: '貨到付款' };

    const rows = list.map((o: Order) => { 
      // 🌟 判斷這張單是批發客還是一般客
      const orderUser = this.store.users().find((u: User) => u.id === o.userId);
      const customerType = orderUser?.tier === 'wholesale' ? '📦 批發客' : '🛒 一般零售';
      let costGeneralTotal = 0; 
      let totalRawProfit = 0;

      const itemsData = o.items.map((i: CartItem) => { 
        const p = this.store.products().find((x: Product) => x.id === i.productId); 
        let detailString = `• ${i.productName} (${i.option}) x${i.quantity}`;
        let costGen = 0; let currentPriceGeneral = 0; let currentPriceVip = 0;
        let shareMode = (p as any)?.shareMode || '親帶';

        if (p) { 
          let currentLocalPrice = p.localPrice || 0;
          currentPriceGeneral = p.priceGeneral || 0;
          currentPriceVip = p.priceVip || 0;

          let fullOption = p.options?.find((opt: string) => opt.split('=')[0].trim() === i.option) || '';
        // 🛡️ 模糊比對防呆：如果老闆後來在後台加上 (售完)，歷史訂單依然能對應到正確價格！
        if (!fullOption && p.options) {
            fullOption = p.options.find((opt: string) => opt.includes(i.option) || i.option.includes(opt.split('=')[0].trim())) || '';
        }

        if (fullOption.includes('=')) {
            const parts = fullOption.split('=');
            if (parts.length >= 2 && !isNaN(Number(parts[1]))) currentPriceGeneral = Number(parts[1]);
            if (parts.length >= 3 && !isNaN(Number(parts[2]))) currentPriceVip = Number(parts[2]);
            if (parts.length >= 4 && !isNaN(Number(parts[3]))) currentLocalPrice = Number(parts[3]);
        }
          const rate = this.getRealExchangeRate(p); const shipKg = p.shippingCostPerKg || 0; 
          
          // 🧠 呼叫新大腦 (支援無規格防呆)
          const exactKey = `${i.productId}_${i.option || '單一規格'}`;
          const baseKey = `${i.productId}_單一規格`;
          const productKey = `${i.productId}_ALL`;
          const actualPurchase = this.purchaseAverageCostMap().get(exactKey) || 
                                 this.purchaseAverageCostMap().get(baseKey) || 
                                 this.purchaseAverageCostMap().get(productKey);
          
          if (actualPurchase && actualPurchase.totalQty > 0 && actualPurchase.totalCost > 0) {
              const avgCost = actualPurchase.totalCost / actualPurchase.totalQty;
              // 換算回台幣
              if (actualPurchase.currency === 'KRW') {
                  costGen = avgCost / 43;
              } else if (actualPurchase.currency === 'TWD') {
                  costGen = avgCost;
              } else {
                  costGen = avgCost * rate;
              }
          } else {
              costGen = (currentLocalPrice > 0) ? (currentLocalPrice * rate) : (i.unitCost || 0);
          }
          // 💡 [未來擴充：國際運費與包材] costGen = (currentLocalPrice > 0) ? (currentLocalPrice * rate) + (p.costMaterial || 0) + ((p.weight || 0) * shipKg) : (i.unitCost || 0);
          
          detailString += ` [售價:$${currentPriceGeneral} / VIP:$${currentPriceVip} / 實收:$${i.price}]`;
        } else {
          costGen = i.unitCost || 0; detailString += ` [實收:$${i.price} (已下架)]`;
        }
        
        const itemCostTotal = costGen * i.quantity;
        costGeneralTotal += itemCostTotal;
        const rawProfit = (i.price * i.quantity) - itemCostTotal;
        totalRawProfit += rawProfit;

        return { detailString, rawProfit, shareMode };
      });

      const profit = o.finalTotal - costGeneralTotal; 
      const margin = o.finalTotal ? (profit / o.finalTotal * 100) : 0;
      
      // 計算單筆訂單的合夥人分潤
      let oYichen = 0; let oZiting = 0; let oXiaoyun = 0; let oCompany = 0;
      itemsData.forEach(item => {
         const actualItemProfit = totalRawProfit !== 0 ? profit * (item.rawProfit / totalRawProfit) : 0;
         if (item.shareMode === '親帶') {
            oYichen += actualItemProfit * 0.25; oZiting += actualItemProfit * 0.25; oXiaoyun += actualItemProfit * 0.25; oCompany += actualItemProfit * 0.25;
         } else {
            oZiting += actualItemProfit * 0.40; oXiaoyun += actualItemProfit * 0.40; oCompany += actualItemProfit * 0.20;
         }
      });

      return [ 
        `\t${o.id}`, new Date(o.createdAt).toLocaleDateString('zh-TW'), 
        customerType, // 👈 塞入客群類型
        payMap[o.paymentMethod] || o.paymentMethod, o.paymentLast5 ? `\t${o.paymentLast5}` : '', 
        itemsData.map(i => i.detailString).join('\n'), o.finalTotal, Math.round(costGeneralTotal), Math.round(profit), `${margin.toFixed(1)}%`,
        Math.round(oYichen), Math.round(oZiting), Math.round(oXiaoyun), Math.round(oCompany)
      ];
    }); 
    this.downloadCSV(`銷售報表_明細_${range}_${new Date().toISOString().slice(0,10)}`, headers, rows); 
  }

  async syncToGoogleSheets() {
    const range = this.accountingRange(); 
    const now = new Date(); 
    let startDate: Date | null = null; let endDate: Date | null = null;
    if (range === 'today') startDate = new Date(now.setHours(0,0,0,0)); 
    else if (range === 'week') startDate = new Date(now.setDate(now.getDate() - now.getDay())); 
    else if (range === 'month') startDate = new Date(now.getFullYear(), now.getMonth(), 1); 
    else if (range === 'year') startDate = new Date(now.getFullYear(), 0, 1); 
    else if (range === 'custom') {
      if (this.accountingCustomStart()) startDate = new Date(this.accountingCustomStart());
      if (this.accountingCustomEnd()) endDate = new Date(this.accountingCustomEnd());
    }
    
    let list = this.accountingFilteredOrders(); 
    const payMap: any = { cash: '現金', bank_transfer: '轉帳', cod: '貨到付款' };
    const headers = ['訂單編號', '結算日期', '客群類型', '付款方式', '匯款後五碼', '商品內容 (含價格明細)', '總營收', '商品總成本', '預估利潤', '毛利率%', '收款狀態', '藝辰分潤', '子婷分潤', '小芸分潤', '公司保留'];

    const payloadRows = list.map((o: Order) => { 
      // 🌟 判斷這張單是批發客還是一般客
      const orderUser = this.store.users().find((u: User) => u.id === o.userId);
      const customerType = orderUser?.tier === 'wholesale' ? '📦 批發客' : '🛒 一般零售';
      let costGeneralTotal = 0; let totalRawProfit = 0;
      
      const itemsData = o.items.map((i: CartItem) => { 
        const p = this.store.products().find((x: Product) => x.id === i.productId); 
        let detailString = `• ${i.productName} (${i.option}) x${i.quantity}`;
        let costGen = 0; let currentPriceGeneral = 0; let currentPriceVip = 0;
        let shareMode = (p as any)?.shareMode || '親帶';

        if (p) { 
          let currentLocalPrice = p.localPrice || 0; currentPriceGeneral = p.priceGeneral || 0; currentPriceVip = p.priceVip || 0;
          const fullOption = p.options?.find((opt: string) => opt.split('=')[0].trim() === i.option) || '';
          if (fullOption.includes('=')) {
              const parts = fullOption.split('=');
              if (parts.length >= 4) { currentPriceGeneral = Number(parts[1]) || currentPriceGeneral; currentPriceVip = Number(parts[2]) || currentPriceVip; currentLocalPrice = Number(parts[3]) || currentLocalPrice; }
          }
          const rate = this.getRealExchangeRate(p); const shipKg = p.shippingCostPerKg || 0; 
          
          // 🧠 呼叫新大腦 (支援無規格防呆)
          const exactKey = `${i.productId}_${i.option || '單一規格'}`;
          const baseKey = `${i.productId}_單一規格`;
          const productKey = `${i.productId}_ALL`;
          const actualPurchase = this.purchaseAverageCostMap().get(exactKey) || 
                                 this.purchaseAverageCostMap().get(baseKey) || 
                                 this.purchaseAverageCostMap().get(productKey);
          
          if (actualPurchase && actualPurchase.totalQty > 0 && actualPurchase.totalCost > 0) {
              const avgCost = actualPurchase.totalCost / actualPurchase.totalQty;
              // 換算回台幣
              if (actualPurchase.currency === 'KRW') {
                  costGen = avgCost / 43;
              } else if (actualPurchase.currency === 'TWD') {
                  costGen = avgCost;
              } else {
                  costGen = avgCost * rate;
              }
          } else {
              costGen = (currentLocalPrice > 0) ? (currentLocalPrice * rate) : (i.unitCost || 0);
          }
          // 💡 [未來擴充：國際運費與包材] costGen = (currentLocalPrice > 0) ? (currentLocalPrice * rate) + (p.costMaterial || 0) + ((p.weight || 0) * shipKg) : (i.unitCost || 0);

          detailString += ` [售價:$${currentPriceGeneral} / VIP:$${currentPriceVip} / 實收:$${i.price}]`;
        } else {
          costGen = i.unitCost || 0; detailString += ` [實收:$${i.price} (已下架)]`;
        }
        
        const itemCostTotal = costGen * i.quantity;
        costGeneralTotal += itemCostTotal;
        const rawProfit = (i.price * i.quantity) - itemCostTotal;
        totalRawProfit += rawProfit;

        return { detailString, rawProfit, shareMode };
      });

      const profit = o.finalTotal - costGeneralTotal; 
      const margin = o.finalTotal ? (profit / o.finalTotal * 100) : 0;
      
      let oYichen = 0; let oZiting = 0; let oXiaoyun = 0; let oCompany = 0;
      itemsData.forEach(item => {
         const actualItemProfit = totalRawProfit !== 0 ? profit * (item.rawProfit / totalRawProfit) : 0;
         if (item.shareMode === '親帶') {
            oYichen += actualItemProfit * 0.25; oZiting += actualItemProfit * 0.25; oXiaoyun += actualItemProfit * 0.25; oCompany += actualItemProfit * 0.25;
         } else {
            oZiting += actualItemProfit * 0.40; oXiaoyun += actualItemProfit * 0.40; oCompany += actualItemProfit * 0.20;
         }
      });

      return [ 
        `\t${o.id}`, new Date(o.createdAt).toLocaleDateString('zh-TW'), 
        customerType, // 👈 塞入客群類型
        payMap[o.paymentMethod] || o.paymentMethod, o.paymentLast5 ? `\t${o.paymentLast5}` : '', 
        itemsData.map(i => i.detailString).join('\n'), o.finalTotal, Math.round(costGeneralTotal), Math.round(profit), `${margin.toFixed(1)}%`,
        Math.round(oYichen), Math.round(oZiting), Math.round(oXiaoyun), Math.round(oCompany)
      ];
    }); 

    this.pushToGoogleSheets('營利報表', [headers, ...payloadRows], 'upsert');
  }

  // ☁️ 同步：採購總帳 (新增結算匯出時間)
  async syncPurchasesToGoogleSheets() {
    const nowStr = new Date().toLocaleString('zh-TW', { hour12: false });
    const list = this.purchaseList();
    const headers = ['結算匯出時間', '單據編號', '購買日期', '回報時間', '國家', '地點/網址', '購買品項', '預估商品總額', '單據運費', '結帳幣別', '實際刷卡金額', '付款人', '分潤模式', '狀態'];

    const payloadRows = list.map(p => {
      const itemsStr = (p.items || []).map((i: any) => {
        const curr = i.currency === 'KRW' ? '₩' : (i.currency === 'TWD' ? 'NT$' : (i.currency || p.currency || '$'));
        return `• ${i.productName} [${i.option || '單一規格'}] x${i.quantity} (@ ${curr}${i.price || 0})`;
      }).join('\n');

      return [
        nowStr, `'${p.id}`, p.date, new Date(p.createdAt).toLocaleString('zh-TW', { hour12: false }), p.country, p.location, itemsStr,
        p.estimatedLocalCost, p.localShipping, 
        p.currency || 'TWD', p.totalLocalCost, 
        p.payer, p.shareMode, p.status === 'pending_sync' ? '待核銷' : '已核銷入帳'
      ];
    });

    this.pushToGoogleSheets('採購總帳', [headers, ...payloadRows], 'overwrite');
  }

  exportProductsCSV() { 
     // 1. 表頭新增「購買網址」
     const headers = [ '匯率換算/40', '匯率換算/43', '常數150', '貨號(註記用)', '表頭說明範例(A)', '商品名稱(B)', '分類(C)', '次分類', '標籤(逗號分隔)', '售價(D)', 'VIP價(E)', '當地原價(F)', '匯率(G)', '重量(H)', '國際運費/kg(I)', '額外成本(J)', '任選數量(K)', '優惠總價(L)', '圖片網址(M)', '規格(N)', '庫存(O)', '是否預購(P)', '是否上架(Q)', '自訂貨號SKU(R)', '備註介紹(S)', '購買網址', '【參考】單件成本', '【參考】一般單件毛利', '【參考】優惠單件毛利', '【參考】已售出' ]; 
     const salesMap = this.productSalesMap();
     
     const rows = this.activeProducts().map((p: Product) => { 
        const cost = (p.localPrice * this.getRealExchangeRate(p)); 
        const normalProfit = p.priceGeneral - cost; 
        const bulkProfit = (p.bulkDiscount?.count && p.bulkDiscount?.total) ? ((p.bulkDiscount.total / p.bulkDiscount.count) - cost).toFixed(0) : '無優惠'; 
        const realSoldCount = salesMap[p.id] || 0; 
        
        return [ 
          '', '', '', `\t${p.code}`, '', p.name, p.category, p.subCategory || '', (p.tags || []).join(','), p.priceGeneral, p.priceVip, 
          p.localPrice, p.exchangeRate, p.weight, p.shippingCostPerKg, p.costMaterial, p.bulkDiscount?.count || '', p.bulkDiscount?.total || '', 
          (p.images && p.images.length > 0) ? p.images.join(',') : p.image, p.options.join(','), p.stock, p.isPreorder ? 'TRUE' : 'FALSE', p.isListed ? 'TRUE' : 'FALSE', 
          '', 
          p.note || '', (p as any).purchaseUrl || '', cost.toFixed(0), normalProfit.toFixed(0), bulkProfit, realSoldCount 
        ]; 
     }); 
     this.downloadCSV(`商品總表_對齊格式_${new Date().toISOString().slice(0,10)}`, headers, rows); 
  }

openProductForm() { 
    this.editingProduct.set(null); 
    this.productForm.reset(); 
    this.productForm.patchValue({ 
      purchaseUrl: '', 
      shareMode: '親帶', // 👈 新增預設值
      localCurrency: 'KRW', // 👈 新增這行
      exchangeRate: 1, priceWholesale: 0, shippingCostPerKg: 0, weight: 0, costMaterial: 0, isPreorder: false, isListed: true, isHidden: false, bulkCount: 0, bulkTotal: 0, subCategory: '', tagsStr: ''    }); 
    this.tempImages.set([]); this.currentCategoryCode.set(''); this.generatedSkuPreview.set(''); this.formValues.set(this.productForm.getRawValue()); this.showProductModal.set(true); 
  } 

  editProduct(p: Product) { 
    this.editingProduct.set(p); 
    this.productForm.patchValue({ 
      ...p, 
      purchaseUrl: (p as any).purchaseUrl || '', 
      shareMode: (p as any).shareMode || '親帶', // 👈 讀取舊資料防呆
      localCurrency: (p as any).localCurrency || 'KRW', // 👈 新增這行
      optionsStr: (p.options || []).join('\n'), 
      tagsStr: (p.tags || []).join(', '), subCategory: p.subCategory || '', exchangeRate: p.exchangeRate || 1, shippingCostPerKg: p.shippingCostPerKg || 0, weight: p.weight || 0, costMaterial: p.costMaterial || 0, priceWholesale: (p as any).priceWholesale || 0, isPreorder: p.isPreorder ?? false, isListed: p.isListed ?? true, isHidden: (p as any).isHidden ?? false, bulkCount: p.bulkDiscount?.count || 0, bulkTotal: p.bulkDiscount?.total || 0    }); 
    this.tempImages.set(p.images && p.images.length > 0 ? p.images : (p.image ? [p.image] : [])); this.generatedSkuPreview.set(p.code); this.formValues.set(this.productForm.getRawValue()); this.showProductModal.set(true); 
  }

  // 👇 快速切換商品上下架狀態 👇
  async toggleProductStatus(p: Product, event: Event) {
    event.stopPropagation(); 
    
    // 改為切換 isListed 的布林值 (true 變 false，false 變 true)
    const newIsListed = !p.isListed;
    const actionName = newIsListed ? '上架' : '下架';
    
    if (confirm(`確定要將「${p.name}」${actionName}嗎？`)) {
       try {
          await this.store.updateProduct({ ...p, isListed: newIsListed } as any);
       } catch(e) {
          alert(`❌ ${actionName}失敗，請檢查網路。`);
       }
    }
  }

  closeProductModal() { this.showProductModal.set(false); } 

  async deleteProduct(p: Product) {
    if(confirm(`⚠️ 確定要將商品「${p.name}」移至垃圾桶嗎？\n\n(商品將保留 30 天，不會影響過去的帳務與訂單紀錄，隨時可復原！)`)) {
        try {
            await this.store.updateProduct({ ...p, isDeleted: true, deletedAt: Date.now(), isListed: false } as any);
            this.closeProductModal(); 
            alert('✅ 已安全移至垃圾桶！');
        } catch(e) {
            alert('❌ 移至垃圾桶失敗，請檢查網路狀態！');
        }
    }
  }

  onCategoryChange() { const cat = this.productForm.get('category')?.value; if (cat && !this.editingProduct()) { const codeMap = this.categoryCodes(); const foundCode = codeMap[cat] || ''; this.currentCategoryCode.set(foundCode); this.updateSkuPreview(foundCode); } } 
  onCodeInput(e: any) { const val = e.target.value.toUpperCase(); this.currentCategoryCode.set(val); if (!this.editingProduct()) { this.updateSkuPreview(val); } } 
  updateSkuPreview(prefix: string) { if (prefix) { const sku = this.store.generateProductCode(prefix); this.generatedSkuPreview.set(sku); this.productForm.patchValue({ code: sku }); } }
addImageUrl(url: string) { 
    if(!url || !url.trim()) return; 

    // 🔥 核心升級：使用正則表達式，自動以「逗號」或「換行符號」切割字串，並清理空白
    const urls = url.split(/[,\n]+/).map(s => s.trim()).filter(s => s);

    let hasFlickrWarning = false;
    const validUrls: string[] = [];

    // 逐一檢查每一條網址
    urls.forEach(u => {
      // Flickr 防呆檢查
      if (u.includes('flickr.com/photos/') && !u.match(/\.(jpg|jpeg|png|gif|webp)$/i) && !u.includes('live.staticflickr.com')) { 
        hasFlickrWarning = true;
      } else if (u.startsWith('http')) {
        // 只要是 http 開頭的有效網址就加入
        validUrls.push(u);
      }
    });

    if (hasFlickrWarning) {
      alert('⚠️ 注意：您貼上的部分連結是 Flickr「網頁」網址，不是「圖片」連結，系統已自動為您過濾。\n\n請在圖片上按右鍵 -> 選擇「複製圖片位址」(Copy Image Address)。'); 
    }

    // 將所有合法網址一次性加入圖片陣列中
    if (validUrls.length > 0) {
      this.tempImages.update(l => [...l, ...validUrls]); 
    }
  }  
async handleFileSelect(event: any) { 
    const files = event.target.files; 
    if (!files || files.length === 0) return; 

    // 👇 替換成這段：不阻塞的浮動提示 👇
    if (files.length > 2) {
      if (typeof document !== 'undefined') {
         const div = document.createElement('div');
         div.className = 'fixed top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full shadow-2xl z-[120] text-sm font-bold animate-fade-in flex items-center gap-2';
         div.innerHTML = `<span>⏳</span> 準備上傳 ${files.length} 張圖片，請稍候...`;
         document.body.appendChild(div);
         // 3 秒後自動消失
         setTimeout(() => div.remove(), 3000);
      }
    }
    // 👆 替換到這裡 👆

    // 🛡️ 升級：你的專屬金鑰軍火庫！(已更新為最新的 5 把金鑰)
    const apiKeys = [
      '6929e9be7309132abb8e9e074f2f954d', 
      '5c25d90eba9c6f4f1f0569a904e09fb2', 
      '620a85a5745a8a56115f1c2ac9e302c2', 
      '71511b2b29eff40266767564de64d3d1', 
      'b66708e3427c58626bd31491b41e2c29'
    ];

    for (let i = 0; i < files.length; i++) { 
      const file = files[i]; 
      
      const formData = new FormData();
      formData.append('image', file);

      // 🎲 系統自動抽籤：隨機選取一把金鑰來上傳這張圖片 (完美分散流量)
      const randomKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];

      try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${randomKey}`, {
          method: 'POST',
          body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
          // 成功取得雲端短網址！直接塞進預覽圖庫裡
          const imageUrl = result.data.url;
          this.tempImages.update(l => [...l, imageUrl]); 
        } else {
          // 🔄 備援機制：如果這把鑰匙剛好撞到限制報錯，自動抓下一把鑰匙「再試一次」！
          console.warn(`⚠️ 金鑰 ${randomKey.substring(0,5)}... 失敗，自動切換備用金鑰！`);
          
          const backupKey = apiKeys[(apiKeys.indexOf(randomKey) + 1) % apiKeys.length];
          const res2 = await fetch(`https://api.imgbb.com/1/upload?key=${backupKey}`, {
            method: 'POST',
            body: formData
          });
          const res2Json = await res2.json();
          
          if(res2Json.success) {
            this.tempImages.update(l => [...l, res2Json.data.url]);
          } else {
            alert(`❌ 圖片 ${file.name} 備用上傳也失敗了，可能額度已滿或圖片格式不符！`);
          }
        }
      } catch (error) {
        console.error('上傳錯誤:', error);
        alert(`❌ 圖片 ${file.name} 上傳發生網路錯誤！`);
      }
    } 
    
    // 清空 input，這樣下次就算選同一張照片也能正常觸發上傳
    event.target.value = '';
  }
  removeImage(index: number) { this.tempImages.update(l => l.filter((_, i) => i !== index)); }
  
submitProduct() { 
     const val = this.productForm.value; 
     if (val.category) { const catName = val.category.trim(); this.store.addCategory(catName); if (this.currentCategoryCode()) { const newSettings = { ...this.store.settings() }; if (!newSettings.categoryCodes) newSettings.categoryCodes = {}; newSettings.categoryCodes[catName] = this.currentCategoryCode(); this.store.updateSettings(newSettings); } } 
     const finalImages = this.tempImages(); const mainImage = finalImages.length > 0 ? finalImages[0] : 'https://placehold.co/300x300?text=No+Image'; 
     const finalCode = this.editingProduct() ? val.code : (this.generatedSkuPreview() || val.code || this.store.generateNextProductCode()); 
     const bulkCount = Number(val.bulkCount) || 0; const bulkTotal = Number(val.bulkTotal) || 0; 
     
     const p: any = { 
         id: this.editingProduct()?.id || Date.now().toString(), 
         code: finalCode, 
         name: val.name, 
         purchaseUrl: val.purchaseUrl || '', 
         shareMode: val.shareMode, // 👈 儲存分潤模式
         localCurrency: val.localCurrency, // 👈 新增這行存進資料庫
         category: val.category, 
         subCategory: val.subCategory || '',
         tags: val.tagsStr ? val.tagsStr.split(/[,\n]+/).map((s: string) => s.trim()).filter((s: string) => s) : [],
         image: mainImage, images: finalImages, priceGeneral: val.priceGeneral, priceVip: val.priceVip, priceWholesale: val.priceWholesale || 0, localPrice: val.localPrice, stock: val.isPreorder ? 99999 : val.stock,         options: val.optionsStr ? val.optionsStr.split(/[,\n]+/).map((s: string) => s.trim()).filter((s: string) => s) : [], 
         note: val.note, exchangeRate: val.exchangeRate, costMaterial: val.costMaterial, weight: val.weight, shippingCostPerKg: val.shippingCostPerKg, priceType: 'normal', soldCount: this.editingProduct()?.soldCount || 0, country: 'Korea', allowPayment: { cash: true, bankTransfer: true, cod: true }, allowShipping: { meetup: true, myship: true, family: true, delivery: true }, isPreorder: val.isPreorder, isListed: val.isListed, isHidden: val.isHidden || false
     };        
     if (bulkCount > 1 && bulkTotal > 0) { p.bulkDiscount = { count: bulkCount, total: bulkTotal }; } else { p.bulkDiscount = null; } 
     
     if (this.editingProduct()) this.store.updateProduct(p); else this.store.addProduct(p); 
     this.closeProductModal(); 
  }
  
  editUser(u: User) { this.openUserModal(u); } 
  
  openUserModal(u: User) { 
     this.editingUser.set(u); 
     const calculatedTotal = this.calculateUserTotalSpend(u.id);
     this.userForm.patchValue({ ...u, totalSpend: calculatedTotal }); 
     this.showUserModal.set(true); 
  } 
  
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

  // ⚡️ 客戶批次勾選與操作邏輯 (位置精確防呆版)
  toggleUserSelection(id: string) {
    const curr = this.selectedCustomerIds();
    if (curr.includes(id)) this.selectedCustomerIds.set(curr.filter(x => x !== id));
    else this.selectedCustomerIds.set([...curr, id]);
  }

  toggleAllUsers(event: any) {
    // 🛡️ 加上 as HTMLInputElement 滿足 TS 嚴格型別檢查
    if ((event.target as HTMLInputElement).checked) {
      this.selectedCustomerIds.set(this.paginatedUsers().map(u => u.id));
    } else {
      this.selectedCustomerIds.set([]);
    }
  }

  openBulkCustomerModal() {
    if (this.selectedCustomerIds().length === 0) return alert('請先勾選客戶！');
    this.bulkActionType.set('credits');
    this.bulkCreditAmount.set(0);
    this.showBulkCustomerModal.set(true);
  }

  async submitBulkAction() {
    const ids = this.selectedCustomerIds();
    const action = this.bulkActionType();
    const amount = this.bulkCreditAmount();
    
    if (action === 'credits' && amount <= 0) return alert('請輸入大於 0 的購物金金額！');
    if (!confirm(`確定要對選取的 ${ids.length} 位客戶執行批次操作嗎？`)) return;

    const allUsers = this.store.users();
    let updatedCount = 0;

    for (const id of ids) {
      const user = allUsers.find(u => u.id === id);
      if (user) {
         let changes: any = {};
         if (action === 'vip') {
            changes.tier = 'vip';
         } else if (action === 'credits') {
            changes.credits = (user.credits || 0) + amount;
         }
         await this.store.updateUser({ ...user, ...changes });
         updatedCount++;
      }
    }
    
    alert(`✅ 成功更新 ${updatedCount} 位客戶資料！`);
    this.showBulkCustomerModal.set(false);
    this.selectedCustomerIds.set([]); // 清空勾選
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
      promoCodes: currentSettings.promoCodes, // 👈 加上這一行，保護折扣碼不被洗掉！
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

  // 🎥 魔法功能：判斷網址是不是直連影片
  isVideo(url: string | undefined): boolean {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    return lowerUrl.includes('.mp4') || lowerUrl.includes('.mov') || lowerUrl.includes('.webm');
  }

  // 🌐 判斷是否為外連平台影片 (YT, IG, FB)
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

  getYTVideoId(url: string): string {
    if (!url) return '';
    if (url.includes('watch?v=')) return url.split('v=')[1]?.split('&')[0] || '';
    if (url.includes('youtu.be/')) return url.split('youtu.be/')[1]?.split('?')[0] || '';
    if (url.includes('shorts/')) return url.split('shorts/')[1]?.split('?')[0] || '';
    return '';
  }

  getYTThumbnail(url: string): string {
    const vid = this.getYTVideoId(url);
    return vid ? `https://img.youtube.com/vi/${vid}/hqdefault.jpg` : '';
  }

  // 💡 自動抓取「目前表單選中的主分類」底下的所有次分類
  formSubCategories = computed(() => {
    const cat = this.formValues().category;
    if (!cat) return [];
    
    const productsInCat = this.store.products().filter((p: Product) => p.category === cat);
    const subs = productsInCat.map((p: any) => p.subCategory).filter((sub): sub is string => !!sub);
    return [...new Set(subs)];
  });

  // 📥 匯出叫貨總表 (支援日期過濾與顯示)
  exportProcurementCSV() {
     const headers = ['商品名稱', '規格', '訂單包含日期', '需叫貨數量', '已買到數量', '狀態']; 
     const rows = this.procurementList().map(item => {
        const status = item.procured >= item.needed ? '✅ 已買齊' : '⚠️ 還缺 ' + (item.needed - item.procured);
        return [
           item.name,
           item.option,
           `\t${item.orderDatesStr}`, // 加 \t 防止 Excel 把 03/15 變成日期格式
           item.needed,
           item.procured,
           status
        ];
     });
     const rangeLabel = this.procureRange() === 'all' ? '全部' : (this.procureRange() === 'today' ? '今日' : (this.procureRange() === 'yesterday' ? '昨日' : '自訂區間'));
     this.downloadCSV(`即時叫貨總表_${rangeLabel}_${new Date().toISOString().slice(0,10)}`, headers, rows);
  }

  // 🛡️ 轉換社群網址為安全的可播放嵌入碼
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
         let cleanFbUrl = url.split('?')[0];
         if (url.includes('v=')) {
            const params = new URLSearchParams(url.split('?')[1]);
            const v = params.get('v');
            if (v) cleanFbUrl = `${cleanFbUrl}?v=${v}`;
         }
         // FB 影片也移除 autoplay 和 mute
         embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(cleanFbUrl)}&show_text=false&width=auto`;
      }
    } catch(e) {}
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }
  
  // ==========================================
  // 👛 錢包餘額與支出管理連動邏輯
  // ==========================================
  openAddWalletModal() {
     // 確保所有欄位都被完整初始化，避免底層報錯
     this.addWalletForm.reset({ name: '', currency: '', symbol: '', balance: null });
     this.showAddWalletModal.set(true);
  }
  
  closeAddWalletModal() {
     this.showAddWalletModal.set(false);
  }
  
  async submitAddWallet() {
     const val = this.addWalletForm.value;
     
     // 聰明防呆：不依賴系統，手動檢查四個欄位是否有填寫
     if (!val.name || !val.currency || !val.symbol || val.balance === null) {
         return alert('⚠️ 欄位填寫不完整，請確認所有欄位都有輸入數值！');
     }
     
     try {
         const newWallet = { 
             id: 'w' + Date.now(), 
             name: val.name, 
             currency: String(val.currency).toUpperCase(), 
             symbol: val.symbol, 
             balance: Number(val.balance) || 0 
         };
         await this.store.addWallet(newWallet);
         alert(`✅ 成功新增帳戶：${val.name}`);
         this.closeAddWalletModal();
     } catch (e: any) {
         console.error(e);
         alert('❌ 新增失敗！請檢查 Firebase Rules 權限是否已開放\n錯誤原因：' + e.message);
     }
  }

  openWalletDetails(w: any) {
     this.detailsWallet.set(w);
     this.showWalletDetailsModal.set(true);
  }

  closeWalletDetails() {
     this.showWalletDetailsModal.set(false);
     this.detailsWallet.set(null);
  }

  // 👇 補回不小心被覆蓋掉的匯出 CSV 功能
  exportWalletDetailsCSV() {
     const w = this.detailsWallet();
     if (!w) return;
     const headers = ['交易編號', '日期', '類別', '項目說明', '操作人', '收支類型', '金額', '備註'];
     const rows = this.walletTransactions().map(t => {
        const type = t.amount < 0 ? '收入 (+)' : '支出 (-)';
        return [`\t${t.id}`, t.date, t.category, t.item, t.payer, type, Math.abs(t.amount), t.note || ''];
     });
     this.downloadCSV(`${w.name}_資金流水帳_${new Date().toISOString().slice(0,10)}`, headers, rows);
  }
  
  syncWalletDetailsToGoogleSheets() {
     const w = this.detailsWallet();
     if (!w) return;
     const headers = ['交易編號', '日期', '類別', '項目說明', '操作人', '收支類型', '金額', '備註'];
     const dataRows = this.walletTransactions().map(t => {
        const type = t.amount < 0 ? '收入 (+)' : '支出 (-)';
        return [`'${t.id}`, t.date, t.category, t.item, t.payer, type, Math.abs(t.amount), t.note || '-'];
     });
     this.pushToGoogleSheets(`${w.name}_流水帳`, [headers, ...dataRows], 'upsert');
  }

  openWalletModal(wallet: any, action: 'add' | 'deduct') {
    this.activeWallet.set(wallet);
    this.walletAction.set(action);
    this.walletForm.reset();
    this.showWalletModal.set(true);
  }

  closeWalletModal() {
    this.showWalletModal.set(false);
    this.activeWallet.set(null);
  }

  async submitWalletAction() {
    if (this.walletForm.invalid) return;
    const amount = Number(this.walletForm.value.amount);
    const note = this.walletForm.value.note || (this.walletAction() === 'add' ? '手動儲值' : '手動提領');
    const wallet = this.activeWallet();
    if (this.walletAction() === 'deduct' && amount > wallet.balance) {
      if (!confirm(`⚠️ 警告：欲扣款金額大於目前餘額，是否繼續扣到變負數？`)) return;
    }
    const newBalance = this.walletAction() === 'add' ? wallet.balance + amount : wallet.balance - amount;
    
    try {
        await this.store.updateWalletBalance(wallet.id, newBalance);
        // 🔥 確保乾淨寫入，把後面的 remainingBalance: newBalance 拿掉
        await this.store.addExpense({ id: 'TRX-' + Date.now(), date: new Date().toISOString().slice(0, 10), item: `資金帳戶調整 (${this.walletAction() === 'add' ? '儲值' : '扣款'})`, category: '儲值', amount: this.walletAction() === 'add' ? -amount : amount, currency: wallet.currency, payer: this.store.currentUser()?.name || '系統操作', note: note });
        alert(`✅ 已成功${this.walletAction() === 'add' ? '儲值' : '扣款'} ${wallet.symbol} ${amount}`);
        this.closeWalletModal();
    } catch (e: any) {
        console.error(e);
        alert('❌ 交易失敗，請檢查 Firebase 資料庫權限！\n錯誤原因：' + e.message);
    }
  }

  openExpenseModal() {
    this.editingExpense.set(null);
    this.isAddingNewExpCategory.set(false); // 👈 加上這行防呆
    this.expenseForm.reset({ date: new Date().toISOString().slice(0, 10), category: '', currency: '', payer: '', imageUrl: '', isHistorical: false });
    this.showExpenseModal.set(true);
  }

  editExpense(e: any) {
    this.editingExpense.set(e);
    this.isAddingNewExpCategory.set(false); // 👈 加上這行防呆
    this.expenseForm.patchValue(e);
    this.showExpenseModal.set(true);
  }

  closeExpenseModal() {
    this.showExpenseModal.set(false);
    this.editingExpense.set(null);
  }

  async deleteExpenseRecord(e: any) {
    const isHist = !!e.isHistorical;
    if(confirm(`⚠️ 確定要刪除這筆紀錄嗎？\n項目：${e.item}\n金額：${e.amount}\n\n${isHist ? '此為純紀錄，不會影響資金帳戶餘額。' : '系統將自動把這筆金額退回資金帳戶！'}`)) {
       
       if (!isHist) {
           const targetWallet = this.wallets().find((w:any) => w.currency === e.currency);
           if (targetWallet) {
               await this.store.updateWalletBalance(targetWallet.id, targetWallet.balance + Number(e.amount));
           }
       }
       await this.store.deleteExpense(e.id);
       alert(`✅ 紀錄已刪除！${isHist ? '' : '資金帳戶餘額已自動還原。'}`);
    }
  }

  // 👇 新增：上傳到 Google Drive 的專屬函式 (升級 Promise 版)
  // 👇 究極防彈版：強效壓縮 + 拔除強制中斷器 + 防呆裝甲
  async uploadExpenseImage(event: any) {
    const inputElement = event.target; // 🛡️ 提前保存元素！防止非同步操作後 event 遺失導致畫面卡死
    const file = inputElement.files[0];
    if (!file) return;
    
    this.isUploadingExpImage.set(true);
    this.cdr.markForCheck();

    // ⚠️ 這是你上傳收據用的 GAS 網址
    const DRIVE_GAS_URL = 'https://script.google.com/macros/s/AKfycbzytxzY1L85rbpkFUgRsQz0g1Djt_Z3hxzvrK8a__aXZ3DBJgOz43tZ6EGEDa_OEd3K-A/exec';

    try {
      // 1. 圖片壓縮引擎
      const base64Data: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const resultStr = e.target.result;
          if (typeof resultStr !== 'string') return reject('讀取失敗');
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 1000;
            let width = img.width; let height = img.height;
            if (width > height && width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
            else if (height > width && height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
            canvas.width = width; canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
            const base64 = dataUrl.split(',')[1];
            if (!base64) reject('壓縮失敗'); else resolve(base64);
          };
          img.onerror = () => reject('圖片轉換失敗');
          img.src = resultStr;
        };
        reader.onerror = () => reject('檔案讀取失敗');
        reader.readAsDataURL(file);
      });

      // 2. 抓取檔名
      let customFileName = this.expenseForm.get('item')?.value?.trim();
      if (!customFileName) customFileName = '未命名支出收據';
      const ext = file.name ? file.name.split('.').pop() : 'jpg';
      const finalFileName = `${customFileName}_${Date.now()}.${ext}`;

      // ✅ 3. 改用原生 FormData 傳輸 (與買手系統完全一致，速度最快且不卡網域)
      const formData = new FormData();
      formData.append('fileName', finalFileName);
      formData.append('mimeType', 'image/jpeg');
      formData.append('fileData', base64Data);

      // 4. 發送至 GAS (拔除手動 Headers，讓瀏覽器自動完美設定 Boundary)
      const response = await fetch(DRIVE_GAS_URL, {
        method: 'POST',
        body: formData
      });

      // 5. 接收與解析
      const rawText = await response.text();
      try {
         const result = JSON.parse(rawText);
         if (result.success) {
           this.expenseForm.patchValue({ imageUrl: result.url });
         } else {
           alert('❌ 上傳失敗：' + result.error);
         }
      } catch (jsonErr) {
         console.warn("Google 回傳非預期格式:", rawText);
         alert('⚠️ 照片已成功發送至 Google Drive！\n\n系統已為您解除鎖定，請直接點擊「確認記帳」送出即可。');
      }

    } catch(e: any) {
      console.error("照片壓縮/上傳發生錯誤：", e);
      alert('❌ 網路處理失敗：網路連線中斷，或圖片格式不符。');
    } finally {
      // 💯 無論如何必定執行，絕對不再卡死 UI
      this.isUploadingExpImage.set(false);
      inputElement.value = ''; // 🛡️ 使用提前保存好的 inputElement 就不會報錯
      this.cdr.markForCheck(); 
    }
  }

  async submitExpense() {
    if (this.expenseForm.invalid) return;
    const val = this.expenseForm.value;
    const expAmount = Number(val.amount);
    const isHistorical = !!val.isHistorical; // 👈 抓取是否為純紀錄
    
    try {
        const oldExp = this.editingExpense();
        
        if (oldExp) {
            // 🧠 智慧編輯邏輯：先把舊的錢退回舊錢包 (如果舊的不是純紀錄)
            if (!oldExp.isHistorical) {
                const oldWallet = this.wallets().find((w:any) => w.currency === oldExp.currency);
                if (oldWallet) await this.store.updateWalletBalance(oldWallet.id, oldWallet.balance + Number(oldExp.amount));
            }
            
            // 再從新錢包扣除新金額 (如果新的不是純紀錄)
            if (!isHistorical) {
                const newWallet = this.wallets().find((w:any) => w.currency === val.currency);
                if (newWallet) await this.store.updateWalletBalance(newWallet.id, newWallet.balance - expAmount);
            }

            const { remainingBalance, runningBalance, ...safeOldExp } = oldExp;
            await this.store.addExpense({ ...safeOldExp, ...val, amount: expAmount, isHistorical });
            alert(`✅ 支出紀錄已完美修正！`);
        } else {
            // 一般新增邏輯
            if (!isHistorical) {
                const targetWallet = this.wallets().find((w:any) => w.currency === val.currency);
                if (targetWallet) { 
                    await this.store.updateWalletBalance(targetWallet.id, targetWallet.balance - expAmount); 
                } else { 
                    alert(`⚠️ 系統找不到 ${val.currency} 的資金帳戶，無法自動扣款，但仍會記錄此筆支出。`); 
                }
            }
            
            await this.store.addExpense({ 
               id: 'EXP-' + Date.now(), 
               date: val.date, 
               item: val.item, 
               category: val.category, 
               amount: expAmount, 
               currency: val.currency, 
               payer: val.payer, 
               note: val.note || '', 
               imageUrl: val.imageUrl || '',
               isHistorical: isHistorical // 👈 存入資料庫
            });
            alert(`✅ 已成功記帳！\n${isHistorical ? '(📌 此為歷史補登/純紀錄，資金餘額未變動)' : `(💸 已扣除 ${val.currency} 錢包餘額)`}`);
        }
        this.closeExpenseModal();
    } catch (e: any) {
        console.error(e);
        alert('❌ 處理失敗，請檢查 Firebase 資料庫權限！\n錯誤原因：' + e.message);
    }
  }

  // ==========================================
  // 🎁 行銷抽獎與 0 元訂單模組
  // ==========================================
  openGiveawayModal() {
    this.giveawayForm.reset({ quantity: 1, option: '單一規格' });
    this.giveawaySelectedProduct.set(null);
    this.showGiveawayModal.set(true);
  }

  closeGiveawayModal() {
    this.showGiveawayModal.set(false);
  }

  onGiveawayProductChange(event: any) {
    const pid = event.target.value;
    const p = this.store.products().find((x: Product) => x.id === pid);
    this.giveawaySelectedProduct.set(p || null);
    if (p && p.options && p.options.length > 0) {
      this.giveawayForm.patchValue({ option: p.options[0].split('=')[0].trim() });
    } else {
      this.giveawayForm.patchValue({ option: '單一規格' });
    }
  }

  async submitGiveawayOrder() {
    if (this.giveawayForm.invalid) return;
    const val = this.giveawayForm.value;
    const p = this.giveawaySelectedProduct();
    if (!p) return alert('請選擇商品');

    if (p.stock !== 99999 && p.stock < val.quantity) {
      if (!confirm(`⚠️ 警告：該商品庫存不足 (剩餘 ${p.stock})，確定要繼續建單扣除嗎？`)) return;
    }

    // 1. 精算該商品成本 (轉移至營業支出用)
    let currentLocalPrice = p.localPrice || 0;
    const fullOption = p.options?.find((opt: string) => opt.split('=')[0].trim() === val.option) || '';
    if (fullOption.includes('=')) {
        const parts = fullOption.split('=');
        if (parts.length >= 4) { currentLocalPrice = Number(parts[3]) || currentLocalPrice; }
    }
    const rate = p.exchangeRate || 1; 
    const shipKg = p.shippingCostPerKg || 0; 
    const unitCost = (currentLocalPrice > 0) ? (currentLocalPrice * rate) : 0; // 💡 目前只算商品進價
// 💡 [未來擴充：國際運費與包材] const unitCost = (currentLocalPrice > 0) ? (currentLocalPrice * rate) + (p.costMaterial || 0) + ((p.weight || 0) * shipKg) : 0;
    const totalCost = unitCost * val.quantity;

    // 2. 準備要加入的贈品明細
    const newItem = {
      productId: p.id,
      productName: p.name,
      productImage: p.image,
      option: val.option,
      quantity: val.quantity,
      price: 0, // 售價 0 元
      unitCost: unitCost,
      isPreorder: p.isPreorder || false
    };

    // 3. 自動建立對應的營業支出
    const newExpense = {
      id: 'EXP-GW-' + Date.now(),
      date: new Date().toISOString().slice(0, 10),
      item: `行銷贈品: ${p.name} x${val.quantity}`,
      category: '行銷抽獎',
      amount: Math.round(totalCost),
      currency: 'TWD',
      payer: '公司吸收',
      note: `得獎者: ${val.winnerName} ${val.note ? '('+val.note+')' : ''}`
    };

    try {
      // 1. 扣庫存
      if (p.stock !== 99999) {
         this.store.updateProduct({ ...p, stock: p.stock - val.quantity });
      }
      
      const targetOrderId = val.targetOrderId?.trim();

      // 2. 判斷是要「併入舊單」還是「開新單」
      if (targetOrderId) {
         // 🔍 併入現有訂單
         const existingOrder = this.store.orders().find(o => o.id === targetOrderId);
         if (!existingOrder) {
            alert(`❌ 找不到訂單編號 #${targetOrderId}，請確認是否輸入正確！`);
            return;
         }
         
         const updatedItems = [...existingOrder.items, newItem];
         const newNote = (existingOrder as any).note ? `${(existingOrder as any).note}\n(系統: 已新增抽獎贈品)` : '(系統: 已新增抽獎贈品)';
         
         await this.store.updateOrderStatus(targetOrderId, existingOrder.status, { 
            items: updatedItems,
            note: newNote
         });
         
         // 3. 自動記帳：拋轉至營業支出
         await this.store.addExpense(newExpense as any);
         
         alert(`✅ 抽獎贈品已成功併入訂單 #${targetOrderId} 中！\n商品庫存已扣除 ${val.quantity} 件。\n成本 NT$ ${Math.round(totalCost)} 已認列至「營業支出」。`);
         
      } else {
         // 🆕 建立全新 0 元訂單 (維持原本邏輯)
         const newOrder: Order = {
           id: 'GW-' + Date.now(),
           userId: 'GIVEAWAY',
           userName: val.winnerName,
           userPhone: val.winnerPhone,
           userEmail: '',
           shippingName: val.winnerName,
           shippingPhone: val.winnerPhone,
           shippingAddress: val.shippingAddress,
           paymentMethod: 'giveaway' as any, 
           shippingMethod: 'delivery',
           subtotal: 0,
           shippingFee: 0,
           discount: 0,
           usedCredits: 0,
           finalTotal: 0,
           depositPaid: 0,
           balanceDue: 0,
           status: 'completed',
           createdAt: Date.now(),
           items: [newItem] // 👈 放入剛做好的贈品明細
         };

         const storeAny = this.store as any;
         if (typeof storeAny.addOrder === 'function') {
            storeAny.addOrder(newOrder);
         } else {
            try {
               const currentOrders = [...this.store.orders()];
               currentOrders.unshift(newOrder);
               storeAny.orders = () => currentOrders; 
            } catch(e) {
               console.warn('強制寫入陣列時遭遇保護', e);
            }
         }

         // 3. 自動記帳：拋轉至營業支出
         await this.store.addExpense(newExpense as any);

         alert(`✅ 全新抽獎單已成功建立！\n商品庫存已扣除 ${val.quantity} 件。\n成本 NT$ ${Math.round(totalCost)} 已認列至「營業支出」。`);
      }

      this.closeGiveawayModal();
    } catch(err: any) {
      alert('❌ 建立失敗: ' + (err?.message || err));
    }
     
  }
  // 🏆 終極大絕招：一鍵產出【終極會計結算總表】
  exportFinalMonthlyReport() {
     const stats = this.accountingStats(); const range = this.accountingRange(); const now = new Date(); 
     let startDate: Date | null = null; let endDate: Date | null = null;
     if (range === 'today') startDate = new Date(now.setHours(0,0,0,0)); 
     else if (range === 'week') startDate = new Date(now.setDate(now.getDate() - now.getDay())); 
     else if (range === 'month') startDate = new Date(now.getFullYear(), now.getMonth(), 1); 
     else if (range === 'year') startDate = new Date(now.getFullYear(), 0, 1); 
     else if (range === 'custom') { if (this.accountingCustomStart()) startDate = new Date(this.accountingCustomStart()); if (this.accountingCustomEnd()) endDate = new Date(this.accountingCustomEnd()); }

     const validExpenses = this.expenses().filter(e => {
        if (e.category === '商品採購' || e.category === '儲值') return false; 
        const d = new Date(e.date);
        if (startDate && d < startDate) return false;
        if (endDate) { const ed = new Date(endDate); ed.setHours(23,59,59,999); if (d > ed) return false; }
        return true;
     });

     // 🧠 財務長大腦：將不同幣別的營業支出獨立計算
     let expTWD = 0; let expKRW = 0; let expJPY = 0; let expUSD = 0; let expCNY = 0; let expTHB = 0;
     validExpenses.forEach(e => { 
        if (e.currency === 'TWD') expTWD += e.amount;
        else if (e.currency === 'KRW') expKRW += e.amount;
        else if (e.currency === 'JPY') expJPY += e.amount;
        else if (e.currency === 'USD') expUSD += e.amount;
        else if (e.currency === 'CNY') expCNY += e.amount;
        else if (e.currency === 'THB') expTHB += e.amount;
        else expTWD += e.amount; // 防呆
     });

     // 為了算出一個「參考用」的最終台幣淨利，我們將外幣依真實底價匯率換算回台幣
     const foreignToTWD = (expKRW / 43) + (expJPY * 0.22) + (expUSD * 32.0) + (expCNY * 4.5) + (expTHB * 0.9);
     const estimatedTotalOpExTWD = expTWD + foreignToTWD;

     const finalNet = stats.profit - estimatedTotalOpExTWD;
     const realCompanyShare = stats.shares.company - estimatedTotalOpExTWD;

     // 🏦 結算當下的各幣別「資金帳戶」總餘額
     const allWallets = this.wallets();
     const balanceTWD = allWallets.filter((w:any) => w.currency === 'TWD').reduce((sum, w) => sum + w.balance, 0);
     const balanceKRW = allWallets.filter((w:any) => w.currency === 'KRW').reduce((sum, w) => sum + w.balance, 0);

     const exportTime = now.toLocaleString('zh-TW', { hour12: false });
     const reportYear = now.getFullYear() + '年';
     const reportMonth = (now.getMonth() + 1) + '月';
     
     let rangeName = '';
     if (range === 'today') rangeName = `今日 (${now.toLocaleDateString('zh-TW')})`;
     else if (range === 'week') rangeName = '本週';
     else if (range === 'month') rangeName = `${now.getFullYear()}年${now.getMonth() + 1}月`;
     else if (range === 'year') rangeName = `${now.getFullYear()}年度`;
     else rangeName = `自訂 (${this.accountingCustomStart() || ''} ~ ${this.accountingCustomEnd() || ''})`;
     
     // 💡 計算最終淨現金流
     const netTWD = stats.revenueTWD - stats.costTWD - expTWD;
     const netKRW = stats.revenueKRW - stats.costKRW - expKRW;

     // 🔥 完美對齊的 25 欄表頭 (新增零售與批發拆解)
     const headers = [
        '結算匯出時間', '年份', '月份', '報表區間', 
        '台幣淨結算(TWD)', '韓幣淨結算(KRW)',
        '台幣總營收', '其中：台幣零售', '其中：台幣批發',  // 👈 新增這兩欄
        '韓幣總營收', '其中：韓幣零售', '其中：韓幣批發',  // 👈 新增這兩欄
        '商品成本(含外幣換算TWD)', '韓國商品成本(KRW)',
        '台幣營業支出', '韓幣營業支出', 
        '商品總毛利(估算TWD)', '外幣支出折合台幣估算', 
        '最終淨利潤(估算TWD)', 
        '合夥人：藝辰', '合夥人：子婷', '合夥人：小芸', '公司保留盈餘(估算TWD)',
        '目前台幣帳戶總餘額', '目前韓幣帳戶總餘額'
     ];
     
     const rowData = [
        exportTime, reportYear, reportMonth, rangeName,
        Math.round(netTWD), Math.round(netKRW),
        Math.round(stats.revenueTWD), Math.round(stats.revenueRetailTWD), Math.round(stats.revenueWholesaleTWD), // 👈 塞入新數據
        Math.round(stats.revenueKRW), Math.round(stats.revenueRetailKRW), Math.round(stats.revenueWholesaleKRW), // 👈 塞入新數據
        Math.round(stats.costTWD), Math.round(stats.costKRW),
        expTWD, expKRW, 
        Math.round(stats.profit), Math.round(foreignToTWD),
        Math.round(finalNet),
        Math.round(stats.shares.yichen), Math.round(stats.shares.ziting), Math.round(stats.shares.xiaoyun), Math.round(realCompanyShare),
        balanceTWD, balanceKRW
     ];

     this.downloadCSV(`終極會計總表_${range}_${now.toISOString().slice(0,10)}`, headers, [rowData]);
  }

  // ✂️ 開關拆單模式，並清空勾選紀錄
  toggleSplitMode() {
     this.isSplittingOrder.set(!this.isSplittingOrder());
     this.splitItemIndices.set(new Set<number>());
  }

  // ✂️ 智慧拆單邏輯：打勾切換
  toggleSplitItem(index: number) {
     const curr = new Set(this.splitItemIndices());
     if (curr.has(index)) curr.delete(index);
     else curr.add(index);
     this.splitItemIndices.set(curr);
  }

  // ✂️ 智慧拆單邏輯：確認拆分並拋轉後台
  async confirmSplitOrder(o: Order) {
     const indices = Array.from(this.splitItemIndices());
     if(indices.length === 0 || indices.length === o.items.length) return alert('請選擇部分商品來拆單！（不可全選或不選）');
     
     const newShippingFeeStr = prompt('📦 建立新訂單\n\n請輸入【拆分出來的新訂單】運費 (若免運請輸入 0)：', '0');
     if(newShippingFeeStr === null) return;
     const newShippingFee = parseInt(newShippingFeeStr, 10) || 0;

     // 1. 分出兩批商品
     const newItems = o.items.filter((_, i) => indices.includes(i));
     const remainItems = o.items.filter((_, i) => !indices.includes(i));

     // 2. 重新計算小計
     const newSubtotal = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
     const remainSubtotal = remainItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

     try {
         // 3. 呼叫現成的 createOrder，讓它自動發信給客人並產生新 ID
         const newOrderRes = await this.store.createOrder(
             { name: o.paymentName || o.userName, time: '', last5: o.paymentLast5 || '' },
             { name: o.shippingName, phone: o.shippingPhone, address: o.shippingAddress, store: o.shippingAddress },
             0, // 折抵金留在原單
             o.paymentMethod,
             o.shippingMethod,
             newShippingFee,
             newItems,
             0 // 多入優惠先保留在原單
         );

         if(newOrderRes) {
             // 4. 更新原訂單，扣除移走的金額
             const remainTotal = remainSubtotal + o.shippingFee - o.discount - o.usedCredits;
             const remainNote = (o as any).note ? `${(o as any).note}\n(已拆分部分商品至 #${newOrderRes.id})` : `(已拆分部分商品至 #${newOrderRes.id})`;
             
             await this.store.updateOrderStatus(o.id, o.status, {
                 items: remainItems,
                 subtotal: remainSubtotal,
                 finalTotal: Math.max(0, remainTotal),
                 balanceDue: Math.max(0, remainTotal - o.depositPaid),
                 note: remainNote
             });
             
             // 5. 新單備註標記來源
             await this.store.updateOrderStatus(newOrderRes.id, o.status, {
                 note: `(從訂單 #${o.id} 拆分出來)`
             });

             alert(`✅ 拆單成功！\n新訂單編號為：#${newOrderRes.id}\n系統已發送新訂單通知信給客戶！`);
             this.isSplittingOrder.set(false);
             this.closeActionModal();
         }
     } catch(e: any) {
         alert('❌ 拆單發生錯誤：' + e.message);
     }
  }

  exportMarketingCSV() {
     const list = this.accountingFilteredOrders().filter((o: Order) => o.discount > 0 || o.usedCredits > 0 || (o as any).promoDiscount > 0);
     const headers = ['訂單編號', '結算日期', '客戶姓名', '使用折扣碼', '折扣碼折抵', '多入組折抵', '購物金折抵', '本單行銷總折讓'];
     const rows = list.map((o: Order) => {
        const orderUser = this.store.users().find((u: User) => u.id === o.userId);
        const isWholesale = orderUser?.tier === 'wholesale';
        
        // 👇 加上 isWholesale 判斷
        let platformSubsidy = (!isWholesale && (o.shippingMethod === 'myship' || o.shippingMethod === 'family')) ? 20 : 0;
        let pureBundle = (o.discount || 0) - platformSubsidy; pureBundle = pureBundle > 0 ? pureBundle : 0;
        const promoAmt = (o as any).promoDiscount || 0; const creditAmt = o.usedCredits || 0; const total = pureBundle + promoAmt + creditAmt;
        return [ `\t${o.id}`, new Date(o.createdAt).toLocaleDateString('zh-TW'), this.getUserName(o.userId), (o as any).promoCode || '-', promoAmt, pureBundle, creditAmt, total ];
     });
     this.downloadCSV(`行銷預算折讓明細_${this.accountingRange()}_${new Date().toISOString().slice(0,10)}`, headers, rows);
  }

  syncMarketingToGoogleSheets() {
     const list = this.accountingFilteredOrders().filter((o: Order) => o.discount > 0 || o.usedCredits > 0 || (o as any).promoDiscount > 0);
     const headers = ['訂單編號', '結算日期', '客戶姓名', '使用折扣碼', '折扣碼折抵', '多入組折抵', '購物金折抵', '本單行銷總折讓'];
     const dataRows = list.map((o: Order) => {
        const orderUser = this.store.users().find((u: User) => u.id === o.userId);
        const isWholesale = orderUser?.tier === 'wholesale';
        
        // 👇 加上 isWholesale 判斷
        let platformSubsidy = (!isWholesale && (o.shippingMethod === 'myship' || o.shippingMethod === 'family')) ? 20 : 0;
        let pureBundle = (o.discount || 0) - platformSubsidy; pureBundle = pureBundle > 0 ? pureBundle : 0;
        const promoAmt = (o as any).promoDiscount || 0; const creditAmt = o.usedCredits || 0; const total = pureBundle + promoAmt + creditAmt;
        return [ `'${o.id}`, new Date(o.createdAt).toLocaleDateString('zh-TW'), this.getUserName(o.userId), (o as any).promoCode || '-', promoAmt, pureBundle, creditAmt, total ];
     });
     this.pushToGoogleSheets('行銷折讓', [headers, ...dataRows], 'overwrite');
  }

  exportExpensesCSV() {
     const headers = ['單據編號', '日期', '支出項目', '類別', '金額', '幣別', '結存餘額', '付款人', '備註'];
     const rows = this.filteredExpenses().map((e: any) => [ 
        `\t${e.id}`, e.date, e.item, e.category, e.amount, e.currency, e.runningBalance !== undefined ? e.runningBalance : '', e.payer, e.note || '-' 
     ]);
     this.downloadCSV(`營業支出明細_${new Date().toISOString().slice(0,10)}`, headers, rows);
  }

  syncExpensesToGoogleSheets() {
     const headers = ['單據編號', '日期', '支出項目', '類別', '金額', '幣別', '結存餘額', '付款人', '備註'];
     const dataRows = this.filteredExpenses().map((e: any) => [ 
        `'${e.id}`, e.date, e.item, e.category, e.amount, e.currency, e.runningBalance !== undefined ? e.runningBalance : '', e.payer, e.note || '-' 
     ]);
     this.pushToGoogleSheets('營業支出', [headers, ...dataRows], 'upsert');
  }

  forceRefresh() {
    window.location.reload(); // 強制重新整理整個網頁
  }

  // ☁️ 終極大絕招：一鍵同步【終極會計結算總表】至 Google Sheets
  async syncFinalMonthlyReportToGoogleSheets() {
     const stats = this.accountingStats(); const range = this.accountingRange(); const now = new Date(); 
     let startDate: Date | null = null; let endDate: Date | null = null;
     if (range === 'today') startDate = new Date(now.setHours(0,0,0,0)); 
     else if (range === 'week') startDate = new Date(now.setDate(now.getDate() - now.getDay())); 
     else if (range === 'month') startDate = new Date(now.getFullYear(), now.getMonth(), 1); 
     else if (range === 'year') startDate = new Date(now.getFullYear(), 0, 1); 
     else if (range === 'custom') { if (this.accountingCustomStart()) startDate = new Date(this.accountingCustomStart()); if (this.accountingCustomEnd()) endDate = new Date(this.accountingCustomEnd()); }

     const validExpenses = this.expenses().filter(e => {
        if (e.category === '商品採購' || e.category === '儲值') return false; 
        const d = new Date(e.date);
        if (startDate && d < startDate) return false;
        if (endDate) { const ed = new Date(endDate); ed.setHours(23,59,59,999); if (d > ed) return false; }
        return true;
     });

     // 🧠 財務長大腦：將不同幣別的營業支出獨立計算
     let expTWD = 0; let expKRW = 0; let expJPY = 0; let expUSD = 0; let expCNY = 0; let expTHB = 0;
     validExpenses.forEach(e => { 
        if (e.currency === 'TWD') expTWD += e.amount;
        else if (e.currency === 'KRW') expKRW += e.amount;
        else if (e.currency === 'JPY') expJPY += e.amount;
        else if (e.currency === 'USD') expUSD += e.amount;
        else if (e.currency === 'CNY') expCNY += e.amount;
        else if (e.currency === 'THB') expTHB += e.amount;
        else expTWD += e.amount; // 防呆
     });

     // 為了算出一個「參考用」的最終台幣淨利，我們將外幣依真實底價匯率換算回台幣
     const foreignToTWD = (expKRW / 43) + (expJPY * 0.22) + (expUSD * 32.0) + (expCNY * 4.5) + (expTHB * 0.9);
     const estimatedTotalOpExTWD = expTWD + foreignToTWD;

     const finalNet = stats.profit - estimatedTotalOpExTWD;
     const realCompanyShare = stats.shares.company - estimatedTotalOpExTWD;

     // 🏦 結算當下的各幣別「資金帳戶」總餘額
     const allWallets = this.wallets();
     const balanceTWD = allWallets.filter((w:any) => w.currency === 'TWD').reduce((sum, w) => sum + w.balance, 0);
     const balanceKRW = allWallets.filter((w:any) => w.currency === 'KRW').reduce((sum, w) => sum + w.balance, 0);

     const exportTime = now.toLocaleString('zh-TW', { hour12: false });
     const reportYear = now.getFullYear() + '年';
     const reportMonth = (now.getMonth() + 1) + '月';
     
     let rangeName = '';
     if (range === 'today') rangeName = `今日 (${now.toLocaleDateString('zh-TW')})`;
     else if (range === 'week') rangeName = '本週';
     else if (range === 'month') rangeName = `${now.getFullYear()}年${now.getMonth() + 1}月`;
     else if (range === 'year') rangeName = `${now.getFullYear()}年度`;
     else rangeName = `自訂 (${this.accountingCustomStart() || ''} ~ ${this.accountingCustomEnd() || ''})`;
     
     // 💡 計算最終淨現金流
     const netTWD = stats.revenueTWD - stats.costTWD - expTWD;
     const netKRW = stats.revenueKRW - stats.costKRW - expKRW;

     // 🔥 完美對齊的 25 欄表頭 (新增零售與批發拆解)
     const headers = [
        '結算匯出時間', '年份', '月份', '報表區間', 
        '台幣淨結算(TWD)', '韓幣淨結算(KRW)',
        '台幣總營收', '其中：台幣零售', '其中：台幣批發',  // 👈 新增這兩欄
        '韓幣總營收', '其中：韓幣零售', '其中：韓幣批發',  // 👈 新增這兩欄
        '商品成本(含外幣換算TWD)', '韓國商品成本(KRW)',
        '台幣營業支出', '韓幣營業支出', 
        '商品總毛利(估算TWD)', '外幣支出折合台幣估算', 
        '最終淨利潤(估算TWD)', 
        '合夥人：藝辰', '合夥人：子婷', '合夥人：小芸', '公司保留盈餘(估算TWD)',
        '目前台幣帳戶總餘額', '目前韓幣帳戶總餘額'
     ];
     
     const rowData = [
        exportTime, reportYear, reportMonth, rangeName,
        Math.round(netTWD), Math.round(netKRW),
        Math.round(stats.revenueTWD), Math.round(stats.revenueRetailTWD), Math.round(stats.revenueWholesaleTWD), // 👈 塞入新數據
        Math.round(stats.revenueKRW), Math.round(stats.revenueRetailKRW), Math.round(stats.revenueWholesaleKRW), // 👈 塞入新數據
        Math.round(stats.costTWD), Math.round(stats.costKRW),
        expTWD, expKRW, 
        Math.round(stats.profit), Math.round(foreignToTWD),
        Math.round(finalNet),
        Math.round(stats.shares.yichen), Math.round(stats.shares.ziting), Math.round(stats.shares.xiaoyun), Math.round(realCompanyShare),
        balanceTWD, balanceKRW
     ];
     
     // 💡 修正：因為是「新增(Append)」模式，所以不要把 headers 一起傳進去，只傳 rowData 即可！
     this.pushToGoogleSheets(`終極會計總表`, [rowData], 'append');
  }

  // 🤫 員工專屬隱形資料庫
  employeeOrders = computed(() => {
     const orders = this.store.orders();
     return orders.filter(o => {
        const user = this.store.users().find(u => u.id === o.userId);
        // 抓出員工，且排除取消/退款的單
        return user?.tier === 'employee' && !['cancelled', 'refunded'].includes(o.status);
     }).sort((a: any, b: any) => b.createdAt - a.createdAt);
  });

  exportEmployeeCSV() {
     // 🚀 修正 1：表頭補齊，增加「當地單價」與「原始幣別」
     const headers = ['購買日期', '品牌(分類)', '商品名稱', '規格', '購買者', '數量', '當地單價', '原始幣別', '台幣單價', '台幣總計', '付款方式', '訂單狀態'];
     const rows: any[] = [];
     
     this.employeeOrders().forEach((o: Order) => {
        o.items.forEach((i: any) => {
           const p = this.store.products().find((x: Product) => x.id === i.productId);

           // 🚀 修正 2：核心邏輯！解析這件商品的「原始韓幣成本」
           let localP = p?.localPrice || 0;
           if (p && p.options) {
               // 這裡處理 "名稱=售價=VIP=成本" 格式，抓出最後一格的數字
               const fOpt = p.options.find((opt: string) => opt.split('=')[0].trim() === i.option) || '';
               if (fOpt.includes('=')) {
                   const parts = fOpt.split('=');
                   if (parts.length >= 4) localP = Number(parts[3]) || localP;
               }
           }
           // 🚀 修正 3：自動判斷幣別 (如果有寫 localCurrency 就抓，沒有就看匯率)
           const localCurr = (p as any)?.localCurrency || ((p?.exchangeRate === 1) ? 'TWD' : 'KRW');

           rows.push([
              new Date(o.createdAt).toLocaleDateString('zh-TW'),
              p?.category || '未分類',
              i.productName,
              i.option || '單一規格',
              this.getUserName(o.userId),
              i.quantity,
              localP,         // 🆕 補上：當地單價 (讓你對 ₩35,000 用的)
              localCurr,      // 🆕 補上：原始幣別
              i.price,        // 這是原本的台幣單價
              i.price * i.quantity,
              this.getPaymentLabel(o.paymentMethod),
              this.getPaymentStatusLabel(o.status, o.paymentMethod)
           ]);
        });
     });

     if(rows.length === 0) return alert('目前沒有任何員工自購紀錄！');
     this.downloadCSV(`員工內部自購明細_${new Date().toISOString().slice(0,10)}`, headers, rows);
}

  syncEmployeeToGoogleSheets() {
      // 🚀 1. 更新表頭：加入「當地單價」與「原始幣別」這兩個欄位
      const headers = ['購買日期', '品牌(分類)', '商品名稱', '規格', '購買者', '數量', '當地單價', '原始幣別', '台幣單價', '台幣總計', '付款方式', '訂單狀態'];
      const dataRows: any[] = [];
      
      this.employeeOrders().forEach((o: Order) => {
        o.items.forEach((i: any) => {
            const p = this.store.products().find((x: Product) => x.id === i.productId);
            
            // 🧠 2. 解析該規格對應的當地原始進價（解決 ₩35,000 價差的關鍵）
            let localP = p?.localPrice || 0;
            if (p && p.options) {
                // 從 "名稱=售價=VIP=成本" 格式中抓出第 4 個位置的數字
                const fOpt = p.options.find((opt: string) => opt.split('=')[0].trim() === i.option) || '';
                if (fOpt.includes('=')) {
                    const parts = fOpt.split('=');
                    if (parts.length >= 4) localP = Number(parts[3]) || localP;
                }
            }
            
            // 🧠 3. 自動辨識幣別：有設定就抓設定，沒設定的話匯率為 1 即台幣，否則預設韓幣
            const localCurr = (p as any)?.localCurrency || ((p?.exchangeRate === 1) ? 'TWD' : 'KRW');

            // 🚀 4. 依照表頭順序推入資料
            dataRows.push([
               new Date(o.createdAt).toLocaleDateString('zh-TW'),
               p?.category || '未分類',
               i.productName,
               i.option || '單一規格',
               this.getUserName(o.userId),
               i.quantity,
               localP,         // 🆕 欄位 7：當地單價 (如 27000)
               localCurr,      // 🆕 欄位 8：原始幣別 (如 KRW)
               i.price,        // 欄位 9：台幣結算單價
               i.price * i.quantity,
               this.getPaymentLabel(o.paymentMethod),
               this.getPaymentStatusLabel(o.status, o.paymentMethod)
            ]);
        });
      });
      
      if(dataRows.length === 0) return alert('目前沒有任何員工自購紀錄！');
      
      // 🚀 5. 調用雲端發射器傳送到 Google Sheets
      this.pushToGoogleSheets('員工自購帳', [headers, ...dataRows]);
  }

  // ==========================================
  // 🚚 賣貨便一鍵配對神器邏輯
  // ==========================================
  showMyshipMatcherModal = signal(false);
  myshipImportList = signal<any[]>([]);

 // 1. 讀取賣貨便下載的 CSV (進階全自動配對版)
  handleMyshipImport(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const text = e.target.result;
      const rows = this.parseCSV(text); 

      const importData = [];
      // 預先抓出所有不是取消/退款的有效訂單
      const allOrders = this.store.orders().filter((o: Order) => !['cancelled', 'refunded'].includes(o.status));

      // 掃描每一行尋找 "CM" 開頭的單號
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const rowText = row.join(' '); // 把整行變成字串來找
        
        // 用正則表達式尋找交貨便代碼 (通常是 CM 加上 11 碼數字)
        const trackingMatch = rowText.match(/CM\d{11}/);
        
        if (trackingMatch) {
          const trackingNumber = trackingMatch[0];
          
          // 🤖 終極自動配對大腦：直接在這一行的文字裡，尋找有沒有符合的官網訂單號！
          let autoMatchedOrder = null;
          let autoSearchKey = '';
          
          for (const order of allOrders) {
             // 只要賣貨便的備註或回饋資訊裡，有完整的訂單號，或是末 6 碼，就直接抓出來配對！
             if (rowText.includes(order.id) || rowText.includes(order.id.slice(-6))) {
                autoMatchedOrder = order;
                autoSearchKey = order.id; // 自動帶入完整單號
                break; // 找到了就停止尋找，換下一筆賣貨便訂單
             }
          }

          importData.push({
            trackingNumber: trackingNumber,
            name: row[7] || row[2] || '未知收件人', 
            note: rowText.substring(0, 100) + '...', // 顯示部分內容當提示
            searchKey: autoSearchKey,       // 畫面上會自動填入找到的單號
            matchedOrder: autoMatchedOrder  // 畫面上會自動展開商品明細！
          });
        }
      }

      if (importData.length === 0) {
         alert('❌ 找不到任何交貨便代碼 (CM開頭)！請確認上傳的是賣貨便的訂單明細 CSV。');
      } else {
         this.myshipImportList.set(importData);
         this.showMyshipMatcherModal.set(true);
      }
      event.target.value = ''; // 清空 input
    };
    
    // 💡 提示：賣貨便下載的 CSV 通常是 Big5 編碼，如果匯入後中文變亂碼，可以把這裡的 'UTF-8' 改成 'Big5'
    reader.readAsText(file, 'UTF-8'); 
  }

  // 2. 當你在輸入框打字時，即時尋找官網訂單
  matchMyshipOrder(index: number, searchValue: string) {
    const list = [...this.myshipImportList()];
    list[index].searchKey = searchValue;

    const cleanSearch = searchValue.trim().toLowerCase();
    list[index].matchedOrder = null;

    if (cleanSearch.length >= 4) { // 輸入超過 4 個字才開始找，避免誤判
       const allOrders = this.store.orders();
       // 尋找訂單號碼有包含輸入字串的訂單 (支援末幾碼搜尋)
       const matched = allOrders.find((o: Order) => o.id.toLowerCase().includes(cleanSearch) && !['cancelled', 'refunded'].includes(o.status));
       if (matched) {
          list[index].matchedOrder = matched;
       }
    }
    this.myshipImportList.set(list);
  }

  // 計算已配對數量
  getMatchedCount() {
    return this.myshipImportList().filter(item => item.matchedOrder).length;
  }

  // 3. 確認送出！批次更新所有訂單 (修改為待包貨狀態)
  async submitMyshipMatch() {
    const list = this.myshipImportList();
    const matchedItems = list.filter(item => item.matchedOrder);

    if (!confirm(`💡 即將將這 ${matchedItems.length} 筆訂單轉為「配單中(待包貨)」，並綁定賣貨便代碼。\n確定執行嗎？`)) return;

    let successCount = 0;

    for (const item of matchedItems) {
       const order = item.matchedOrder;
       try {
          // 👇 狀態改為 pending_shipping (待包貨)，寫入單號，且「不發送」出貨通知信
          await this.store.updateOrderStatus(order.id, 'pending_shipping', { shippingLink: item.trackingNumber });
          successCount++;
       } catch (e) {
          console.error(`訂單 ${order.id} 更新失敗`, e);
       }
    }

    alert(`✅ 批次配對完成！\n成功更新 ${successCount} 筆訂單，請看著列表明細開始包貨囉！`);
    this.showMyshipMatcherModal.set(false);
    this.myshipImportList.set([]); 
  }
}