import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { environment } from 'src/environments/environment';

const firebaseConfigg = environment.firebaseConfig;

export const app = initializeApp(firebaseConfigg);
export const firestore = getFirestore(app);
export const storage = getStorage(app);

console.log(environment.envName);

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err));
