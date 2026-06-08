 import { Injectable } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
} from '@angular/fire/auth';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  user$ = new BehaviorSubject<boolean>(false);
  private unsubAprobacion: (() => void) | null = null;

  constructor(
    private auth: Auth,
    private router: Router,
    private firebase: FirebaseService
  ) {
    this.migrarSesionLegacy();
    this.user$.next(this.isUserAuthenticatedSnapshot());

    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.user$.next(true);
        sessionStorage.setItem(
          'user',
          JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName ?? '',
          })
        );
        this.iniciarEscuchaAprobacion(user.uid);
      } else {
        this.user$.next(false);
        sessionStorage.removeItem('user');
      }
    });
  }

  private migrarSesionLegacy(): void {
    const legacyLogueado = localStorage.getItem('logueado');
    const legacyUser = localStorage.getItem('user');
    if (legacyLogueado) {
      sessionStorage.setItem('logueado', legacyLogueado);
      localStorage.removeItem('logueado');
    }
    if (legacyUser) {
      sessionStorage.setItem('user', legacyUser);
      localStorage.removeItem('user');
    }
  }

  private getStoredUser():
    | { uid: string; email?: string | null; displayName?: string }
    | null {
    const rawUser = sessionStorage.getItem('user');

    if (!rawUser) {
      return null;
    }

    try {
      const storedUser = JSON.parse(rawUser);
      return storedUser?.uid ? storedUser : null;
    } catch {
      sessionStorage.removeItem('user');
      return null;
    }
  }

  isUserAuthenticated(): Observable<boolean> {
    return this.user$.asObservable();
  }

  isUserAuthenticatedSnapshot(): boolean {
    return !!this.auth.currentUser || !!this.getStoredUser();
  }

  getCurrentUid(): string | null {
    return this.auth.currentUser?.uid ?? this.getStoredUser()?.uid ?? null;
  }

  async register({ email, password, username, name }: any) {
    const userCredential = await createUserWithEmailAndPassword(
      this.auth,
      email,
      password
    );
    const user = userCredential.user;
    const displayName = username || name || '';

    try {
      await updateProfile(user, { displayName });
      await sendEmailVerification(user);

      const userCopy = {
        email: user.email,
        aprobado: false,
        uid: user.uid,
        nombre: displayName,
      };

      await this.firebase.guardarConId(userCopy, 'usuarios', user.uid);

      return user;
    } finally {
      await signOut(this.auth);
      this.user$.next(false);
    }
  }

  async resetPassword(email: string) {
    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error) {
      throw error;
    }
  }

  async login({ email, password }: any) {
    const userCredential = await signInWithEmailAndPassword(
      this.auth,
      email,
      password
    );
    this.user$.next(true);
    return userCredential;
  }

  iniciarEscuchaAprobacion(uid: string): void {
    this.unsubAprobacion?.();
    this.unsubAprobacion = this.firebase.escucharDocumento('usuarios', uid, (data) => {
      if (data && data['aprobado'] === false && this.user$.value) {
        this.logout();
      }
    });
  }

  private detenerEscuchaAprobacion(): void {
    this.unsubAprobacion?.();
    this.unsubAprobacion = null;
  }

  async logout() {
    this.detenerEscuchaAprobacion();
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('logueado');
    await signOut(this.auth);
    this.user$.next(false);
    await this.router.navigate(['/login']);
  }
}
