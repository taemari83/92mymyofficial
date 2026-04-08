import { Routes } from '@angular/router';
import { ShopFrontComponent } from './components/shop-front.component';
import { CartComponent } from './components/cart.component';
import { MemberAreaComponent } from './components/member-area.component';
import { AdminPanelComponent } from './components/admin-panel.component';
// 👇 1. 引入剛剛建好的買手表單組件
import { BuyerFormComponent } from './components/buyer-form.component'; 
// 👇 2. 引入新增的條款組件 👇
import { PrivacyComponent } from './components/privacy.component';
import { TermsComponent } from './components/terms.component';


export const routes: Routes = [
  { path: '', component: ShopFrontComponent },
  { path: 'checkout', component: CartComponent }, // 👈 保留你原本的 checkout 路由
  { path: 'member', component: MemberAreaComponent },
  { path: 'admin', component: AdminPanelComponent },
  { path: 'cart', component: CartComponent },
  // 👇 設定隱藏路徑 (買手只要輸入 網址/buyer 就可以直接打開手機版表單)
  { path: 'buyer', component: BuyerFormComponent }, 
  
  // 👇 3. 新增這兩個網址路由 👇
  { path: 'privacy', component: PrivacyComponent },
  { path: 'terms', component: TermsComponent },
  
  { path: '**', redirectTo: '' }
];