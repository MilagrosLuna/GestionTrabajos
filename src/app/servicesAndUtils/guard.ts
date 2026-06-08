import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  Router,
} from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { firstValueFrom } from 'rxjs';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  private cache: { uid: string; aprobado: boolean; at: number } | null = null;
  private readonly CACHE_MS = 60_000;

  constructor(
    private auth: Auth,
    private firebase: FirebaseService,
    private router: Router
  ) {}

  async canActivate(
    _route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot
  ): Promise<boolean | UrlTree> {
    // Wait for Firebase Auth to initialize — handles both fresh login and page refresh.
    // authState emits once Firebase has confirmed the auth state (not just checked sync cache).
    const user = await firstValueFrom(authState(this.auth));

    if (!user) {
      return this.router.createUrlTree(['/login']);
    }

    const uid = user.uid;
    const now = Date.now();

    if (this.cache?.uid === uid && now - this.cache.at < this.CACHE_MS) {
      return this.cache.aprobado ? true : this.router.createUrlTree(['/login']);
    }

    try {
      const userData = await this.firebase.obtenerUno('usuarios', uid);
      const aprobado = !!userData?.data?.['aprobado'];
      this.cache = { uid, aprobado, at: now };
      return aprobado ? true : this.router.createUrlTree(['/login']);
    } catch {
      return this.router.createUrlTree(['/login']);
    }
  }

  invalidateCache() {
    this.cache = null;
  }
}
