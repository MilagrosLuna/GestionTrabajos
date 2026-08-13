import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { environment } from 'src/environments/environment';

const firebaseConfigg = environment.firebaseConfig;

export const app = initializeApp(firebaseConfigg);
// zone.js (usado por Angular para change detection) parchea fetch/XHR/timers
// globalmente, y eso puede interferir con la deteccion automatica de
// transporte de Firestore (experimentalAutoDetectLongPolling), dejando
// escrituras/listeners colgados para siempre sin error. Forzar long-polling
// se salta esa deteccion y evita el problema.
export const firestore = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
export const storage = getStorage(app);

console.log(environment.envName);

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err));
