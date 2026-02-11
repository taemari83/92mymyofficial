import { Routes } from '@angular/router';
import { ShopFrontComponent } from './components/shop-front.component';
import { CartComponent } from './components/cart.component';         // 👈 修正：對應 cart.component.ts
import { MemberAreaComponent } from './components/member-area.component';
import { AdminPanelComponent } from './components/admin-panel.component'; // 👈 修正：對應 admin-panel.component.ts

export const routes: Routes = [
  { path: '', component: ShopFrontComponent },           // 首頁
  { path: 'checkout', component: CartComponent },        // 🛒 結帳頁 (對應 CartComponent)
  { path: 'member', component: MemberAreaComponent },    // 會員中心
  { path: 'admin', component: AdminPanelComponent },     // 後台 (對應 AdminPanelComponent)
  { path: '**', redirectTo: '' }                         // 亂打網址回首頁
];