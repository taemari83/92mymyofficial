import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { provideZoneChangeDetection } from '@angular/core';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth'; // 1. 新增這行：匯入驗證模組
import { provideRouter } from '@angular/router';
import { environment } from './environments/environment';
import { routes } from './app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    // 初始化 Firebase
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    // 2. 新增這行：提供驗證服務 (這就是原本缺少的 Ah !)
    provideAuth(() => getAuth()), 
    // 提供資料庫服務
    provideFirestore(() => getFirestore())
  ]
}).catch(err => console.error(err));
