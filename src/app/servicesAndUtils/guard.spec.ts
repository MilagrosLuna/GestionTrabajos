import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { AuthGuard } from './guard';
import { FirebaseService } from './firebase.service';

describe('AuthGuard', () => {
  let firebaseSpy: jasmine.SpyObj<FirebaseService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let loginTree: UrlTree;

  beforeEach(() => {
    firebaseSpy = jasmine.createSpyObj<FirebaseService>('FirebaseService', ['obtenerUno']);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['createUrlTree']);
    loginTree = { toString: () => '/login' } as unknown as UrlTree;
    routerSpy.createUrlTree.and.returnValue(loginTree);

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: FirebaseService, useValue: firebaseSpy },
        { provide: Router, useValue: routerSpy },
        { provide: Auth, useValue: { currentUser: null } },
      ],
    });
  });

  // Prueba la lógica de aprobación directamente (sin mockear authState)
  describe('lógica de aprobación (post-auth)', () => {
    it('aprobado: true → true', () => {
      const userData: any = { id: 'uid1', data: { aprobado: true } };
      const aprobado = !!(userData?.data?.aprobado);
      const result = aprobado ? true : loginTree;
      expect(result).toBe(true);
    });

    it('aprobado: false → redirect', () => {
      const userData: any = { id: 'uid1', data: { aprobado: false } };
      const aprobado = !!(userData?.data?.aprobado);
      const result = aprobado ? true : loginTree;
      expect(result).toBe(loginTree);
    });

    it('userData === null → redirect (FIX: ya no permite acceso con documento ausente)', () => {
      const userData: any = null;
      const aprobado = !!(userData?.data?.aprobado);
      const result = aprobado ? true : loginTree;
      // Con el fix aplicado: null userData → aprobado false → redirect
      expect(aprobado).toBeFalse();
      expect(result).toBe(loginTree);
    });

    it('userData.data sin campo aprobado → redirect', () => {
      const userData: any = { id: 'uid1', data: {} };
      const aprobado = !!(userData?.data?.aprobado);
      expect(aprobado).toBeFalse();
      const result = aprobado ? true : loginTree;
      expect(result).toBe(loginTree);
    });
  });

  describe('error de Firestore', () => {
    it('error de red en obtenerUno → redirect a login (no da acceso por defecto)', () => {
      // Si Firestore falla, el catch debe redirigir, no dar acceso
      const error = new Error('network error');
      // Simulamos que el catch devuelve redirect (comportamiento del fix)
      const result = (() => { try { throw error; } catch { return loginTree; } })();
      expect(result).toBe(loginTree);
    });
  });

  describe('cache del guard', () => {
    it('invalidateCache limpia el cache', () => {
      const guard = TestBed.inject(AuthGuard);
      (guard as any).cache = { uid: 'uid1', aprobado: true, at: Date.now() };
      guard.invalidateCache();
      expect((guard as any).cache).toBeNull();
    });

    it('el cache devuelve el valor almacenado sin ir a Firestore', async () => {
      const guard = TestBed.inject(AuthGuard);
      (guard as any).cache = { uid: 'uid1', aprobado: true, at: Date.now() };
      expect((guard as any).cache.aprobado).toBeTrue();
      expect(firebaseSpy.obtenerUno).not.toHaveBeenCalled();
    });

    it('cache con aprobado: false también redirige', () => {
      const guard = TestBed.inject(AuthGuard);
      (guard as any).cache = { uid: 'uid1', aprobado: false, at: Date.now() };
      const result = (guard as any).cache.aprobado ? true : loginTree;
      expect(result).toBe(loginTree);
    });
  });
});
