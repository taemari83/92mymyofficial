import { inject } from '@angular/core';
import { Router, CanActivateFn, UrlTree } from '@angular/router';
import { StoreService } from '../services/store.service';

export const adminGuard: CanActivateFn = () => {
  const store = inject(StoreService);
  const router: Router = inject(Router);
  
  // 取得目前使用者狀態
  const user = store.currentUser();

  // 檢查邏輯：
  // 1. 必須有登入 (user 存在)
  // 2. 必須是管理員 (user.isAdmin === true)
  if (user && user.isAdmin) {
    return true; // 驗證通過，放行
  }

  // 驗證失敗：導向到會員登入頁
  return router.createUrlTree(['/member']);
};