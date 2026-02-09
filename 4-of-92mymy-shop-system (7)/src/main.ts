import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { provideZoneChangeDetection } from '@angular/core';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth'; // 1. 補上這行 import
import { provideRouter } from '@angular/router';
import { environment } from './environments/environment';
import { routes } from './app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()), // 2. 補上這行提供者，這樣 Ah (Auth) 就找得到了！
    provideFirestore(() => getFirestore())
  ]
}).catch(err => console.error(err));
