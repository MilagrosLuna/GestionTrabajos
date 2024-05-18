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
    const user = this.auth.currentUser;
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    this.user$.next(!!user || !!storedUser);

    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.user$.next(true);

        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');

        if (!storedUser) {
          localStorage.setItem('user', JSON.stringify(user));
        }
      } else {
        this.user$.next(false);
        this.router.navigate(['/login']);
        localStorage.removeItem('user');
      }
    });
  }

  isUserAuthenticated(): Observable<boolean> {
    return this.user$.asObservable();
  }

  isUserAuthenticated2(): boolean {
    const user = this.auth.currentUser;
    return !!user;
  }

  async register({ email, password, username }: any) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      const user = userCredential.user;
      await updateProfile(user, { displayName: username });
      await sendEmailVerification(user);
      let userCopy = {
        email: user.email,
        aprobado: false,
        uid: user.uid,
      };
      await this.firebase.guardar(userCopy, 'usuarios');

      signOut(this.auth).then(() => {
        this.user$.next(false);
      });
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
    const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
    this.user$.next(true);
    return userCredential;
  }

  async logout() {
    this.router.navigate(['/login']);
    await signOut(this.auth);
    this.user$.next(false);
  }
}
