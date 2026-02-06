import { Routes } from '@angular/router';
import { ShopFrontComponent } from './components/shop-front.component';
import { CartComponent } from './components/cart.component';
import { MemberAreaComponent } from './components/member-area.component';
import { AdminPanelComponent } from './components/admin-panel.component';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', component: ShopFrontComponent },
  { path: 'cart', component: CartComponent },
  { path: 'member', component: MemberAreaComponent },
  { 
    path: 'admin', 
    component: AdminPanelComponent,
    canActivate: [adminGuard] // 啟用守衛保護
  },
  { path: '**', redirectTo: '' }
];