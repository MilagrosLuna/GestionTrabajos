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

  constructor(
    private auth: Auth,
    private router: Router,
    private firebase: FirebaseService
  ) {
    this.user$.next(this.isUserAuthenticatedSnapshot());

    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.user$.next(true);
        localStorage.setItem(
          'user',
          JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName ?? '',
          })
        );
      } else {
        this.user$.next(false);
        localStorage.removeItem('user');
      }
    });
  }

  private getStoredUser():
    | { uid: string; email?: string | null; displayName?: string }
    | null {
    const rawUser = localStorage.getItem('user');

    if (!rawUser) {
      return null;
    }

    try {
      const storedUser = JSON.parse(rawUser);
      return storedUser?.uid ? storedUser : null;
    } catch {
      localStorage.removeItem('user');
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
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      const user = userCredential.user;
      const displayName = username || name || '';

      await updateProfile(user, { displayName });
      await sendEmailVerification(user);

      const userCopy = {
        email: user.email,
        aprobado: false,
        uid: user.uid,
        nombre: displayName,
      };

      await this.firebase.guardar(userCopy, 'usuarios');
      await signOut(this.auth);
      this.user$.next(false);

      return user;
    } catch (error) {
      throw error;
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

  async logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('logueado');
    await signOut(this.auth);
    this.user$.next(false);
    await this.router.navigate(['/login']);
  }
}
