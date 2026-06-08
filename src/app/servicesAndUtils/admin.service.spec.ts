import { TestBed } from '@angular/core/testing';
import { AdminService, ON_AUTH_STATE_CHANGED } from './admin.service';
import { FirebaseService } from './firebase.service';
import { Auth } from '@angular/fire/auth';

describe('AdminService', () => {
  let service: AdminService;
  let firebaseSpy: jasmine.SpyObj<FirebaseService>;
  let authCallback: (user: any) => Promise<void>;
  let fakeAuth: { currentUser: { uid: string } | null };

  beforeEach(() => {
    firebaseSpy = jasmine.createSpyObj<FirebaseService>('FirebaseService', ['obtener']);
    firebaseSpy.obtener.and.resolveTo([]);

    fakeAuth = { currentUser: null };

    TestBed.configureTestingModule({
      providers: [
        AdminService,
        { provide: FirebaseService, useValue: firebaseSpy },
        { provide: Auth, useValue: fakeAuth },
        {
          provide: ON_AUTH_STATE_CHANGED,
          useValue: (_auth: any, cb: any) => {
            authCallback = cb;
            return () => {};
          },
        },
      ],
    });

    service = TestBed.inject(AdminService);
  });

  it('crea la instancia', () => {
    expect(service).toBeTruthy();
  });

  it('getEsAdminSnapshot es false por defecto', () => {
    expect(service.getEsAdminSnapshot()).toBeFalse();
  });

  it('inicializar es no-op y no rompe', async () => {
    await expectAsync(service.inicializar()).toBeResolved();
  });

  it('cuando no hay usuario autenticado, esAdmin es false', async () => {
    fakeAuth.currentUser = null;
    await authCallback(null);
    expect(service.getEsAdminSnapshot()).toBeFalse();
  });

  it('detecta correctamente que el usuario es admin por campo data.id', async () => {
    fakeAuth.currentUser = { uid: 'uid-admin' };
    firebaseSpy.obtener.and.resolveTo([{ id: 'doc1', data: { id: 'uid-admin' } }]);
    await authCallback({ uid: 'uid-admin' });
    expect(service.getEsAdminSnapshot()).toBeTrue();
  });

  it('detecta correctamente que el usuario es admin por ID de documento', async () => {
    fakeAuth.currentUser = { uid: 'uid-admin' };
    firebaseSpy.obtener.and.resolveTo([{ id: 'uid-admin', data: {} }]);
    await authCallback({ uid: 'uid-admin' });
    expect(service.getEsAdminSnapshot()).toBeTrue();
  });

  it('detecta correctamente que el usuario NO es admin', async () => {
    fakeAuth.currentUser = { uid: 'uid-normal' };
    firebaseSpy.obtener.and.resolveTo([{ id: 'doc1', data: { id: 'uid-otro' } }]);
    await authCallback({ uid: 'uid-normal' });
    expect(service.getEsAdminSnapshot()).toBeFalse();
  });

  it('en caso de error al consultar admins, esAdmin queda false', async () => {
    fakeAuth.currentUser = { uid: 'uid-admin' };
    firebaseSpy.obtener.and.rejectWith(new Error('permiso denegado'));
    await authCallback({ uid: 'uid-admin' });
    expect(service.getEsAdminSnapshot()).toBeFalse();
  });

  it('reset limpia el estado', async () => {
    fakeAuth.currentUser = { uid: 'uid-admin' };
    firebaseSpy.obtener.and.resolveTo([{ id: 'doc1', data: { id: 'uid-admin' } }]);
    await authCallback({ uid: 'uid-admin' });
    expect(service.getEsAdminSnapshot()).toBeTrue();

    service.reset();
    expect(service.getEsAdminSnapshot()).toBeFalse();
  });

  it('race condition: no actualiza esAdmin si el usuario cambió durante el await', async () => {
    // El listener se invoca con uid-admin, pero auth.currentUser cambia a null
    // DURANTE el await de obtener('admins') (simula logout rápido)
    firebaseSpy.obtener.and.callFake(async () => {
      fakeAuth.currentUser = null; // Logout ocurrió durante el await
      return [{ id: 'uid-admin', data: {} }];
    });

    fakeAuth.currentUser = { uid: 'uid-admin' };
    await authCallback({ uid: 'uid-admin' });

    // No debe actualizar esAdmin$ porque currentUser cambió durante el await
    expect(service.getEsAdminSnapshot()).toBeFalse();
  });
});
