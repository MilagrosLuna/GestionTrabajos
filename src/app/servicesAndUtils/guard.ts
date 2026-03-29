import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  Router,
} from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {
    const firebaseOk = this.authService.isUserAuthenticatedSnapshot();
    const localOk = !!localStorage.getItem('logueado');

    if (firebaseOk && localOk) {
      return true;
    }

    return this.router.createUrlTree(['/login']);
  }
}
