import { Inject, Injectable, InjectionToken } from '@angular/core';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { BehaviorSubject, Observable } from 'rxjs';
import { FirebaseService } from './firebase.service';

export type OnAuthStateChangedFn = typeof onAuthStateChanged;

export const ON_AUTH_STATE_CHANGED = new InjectionToken<OnAuthStateChangedFn>(
  'onAuthStateChanged',
  { providedIn: 'root', factory: () => onAuthStateChanged }
);

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private esAdmin$ = new BehaviorSubject<boolean>(false);

  constructor(
    private firebase: FirebaseService,
    private auth: Auth,
    @Inject(ON_AUTH_STATE_CHANGED) listenAuthState: OnAuthStateChangedFn
  ) {
    // Fires only after Firebase has a confirmed auth token — safe to query Firestore here.
    listenAuthState(this.auth, async (user) => {
      if (!user) {
        this.esAdmin$.next(false);
        return;
      }
      try {
        const admins = await this.firebase.obtener('admins');
        // Verificar que el usuario sigue siendo el mismo después del await (evita race condition en logout/login rápido)
        if (this.auth.currentUser?.uid !== user.uid) return;
        const esAdmin = admins.some(
          (a: any) => a.id === user.uid || a.data?.id === user.uid
        );
        this.esAdmin$.next(esAdmin);
      } catch {
        this.esAdmin$.next(false);
      }
    });
  }

  // Kept for backwards compatibility — the BehaviorSubject is already populated
  // by onAuthStateChanged, so callers don't need to await this.
  async inicializar(): Promise<void> {
    // no-op: initialization is automatic
  }

  getEsAdmin(): Observable<boolean> {
    return this.esAdmin$.asObservable();
  }

  getEsAdminSnapshot(): boolean {
    return this.esAdmin$.value;
  }

  reset(): void {
    this.esAdmin$.next(false);
  }
}
