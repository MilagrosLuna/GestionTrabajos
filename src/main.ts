import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { environment } from 'src/environments/environment';

const firebaseConfigg = environment.firebaseConfig;

export const SERVICE_ID = 'service_phoenix';
export const TEMPLATE_ID = 'template_lbtq95w';
export const USER_ID = 'c27M8Q4FXi0vsbfvL';
// Initialize Firebase
export const app = initializeApp(firebaseConfigg);
export const firestore = getFirestore(app);
export const storage = getStorage(app);

console.log(environment.envName);

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err));
