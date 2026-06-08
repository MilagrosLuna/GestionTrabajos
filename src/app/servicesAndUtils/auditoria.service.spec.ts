import { TestBed } from '@angular/core/testing';
import { AuditoriaService } from './auditoria.service';
import { FirebaseService } from './firebase.service';

describe('AuditoriaService', () => {
  let service: AuditoriaService;
  let firebaseSpy: jasmine.SpyObj<FirebaseService>;

  beforeEach(() => {
    firebaseSpy = jasmine.createSpyObj<FirebaseService>('FirebaseService', ['guardar']);
    firebaseSpy.guardar.and.resolveTo({ id: 'audit-1' } as any);

    TestBed.configureTestingModule({
      providers: [
        AuditoriaService,
        { provide: FirebaseService, useValue: firebaseSpy },
      ],
    });

    service = TestBed.inject(AuditoriaService);
  });

  it('crea la instancia', () => {
    expect(service).toBeTruthy();
  });

  it('registrar guarda en colección auditorias', async () => {
    await service.registrar({
      accion: 'eliminacion',
      entidad: 'laburo',
      entidadId: 'abc123',
      descripcion: 'Test',
    });
    expect(firebaseSpy.guardar).toHaveBeenCalledWith(
      jasmine.objectContaining({
        accion: 'eliminacion',
        entidad: 'laburo',
        entidadId: 'abc123',
        descripcion: 'Test',
      }),
      'auditorias'
    );
  });

  it('registrar incluye timestamp en ISO', async () => {
    await service.registrar({
      accion: 'pago',
      entidad: 'laburo',
      entidadId: 'x',
      descripcion: 'y',
    });
    const args = firebaseSpy.guardar.calls.mostRecent().args[0];
    expect(args['timestamp']).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('NO incluye datoAnterior si no se pasa (evita error Firestore con undefined)', async () => {
    await service.registrar({
      accion: 'pago',
      entidad: 'laburo',
      entidadId: 'x',
      descripcion: 'pago sin dato anterior',
    });
    const args = firebaseSpy.guardar.calls.mostRecent().args[0];
    expect('datoAnterior' in args).toBeFalse();
  });

  it('SÍ incluye datoAnterior cuando se provee', async () => {
    await service.registrar({
      accion: 'edicion',
      entidad: 'laburo',
      entidadId: 'x',
      descripcion: 'edicion',
      datoAnterior: { precio: 100 },
    });
    const args = firebaseSpy.guardar.calls.mostRecent().args[0];
    expect(args['datoAnterior']).toEqual({ precio: 100 });
  });

  it('SÍ incluye datoNuevo cuando se provee', async () => {
    await service.registrar({
      accion: 'pago',
      entidad: 'laburo',
      entidadId: 'x',
      descripcion: 'pago',
      datoNuevo: { pago: 500 },
    });
    const args = firebaseSpy.guardar.calls.mostRecent().args[0];
    expect(args['datoNuevo']).toEqual({ pago: 500 });
  });

  it('no lanza si firebase.guardar falla', async () => {
    firebaseSpy.guardar.and.rejectWith(new Error('network error'));
    await expectAsync(
      service.registrar({
        accion: 'alta',
        entidad: 'laburo',
        entidadId: 'z',
        descripcion: 'test',
      })
    ).toBeResolved();
  });
});
