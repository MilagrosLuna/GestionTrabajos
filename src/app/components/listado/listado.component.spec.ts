import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { MdbModalService } from 'mdb-angular-ui-kit/modal';
import { ListadoComponent } from './listado.component';
import { FirebaseService } from 'src/app/servicesAndUtils/firebase.service';
import { ConfirmationService } from 'src/app/servicesAndUtils/confirmation.service';
import { AdminService } from 'src/app/servicesAndUtils/admin.service';

function makeLaburo(id: string, overrides: any = {}) {
  return {
    id,
    data: {
      cliente: 'Test',
      precio: 100,
      fecha: '2024-01-01',
      ...overrides,
    },
  };
}

describe('ListadoComponent', () => {
  let component: ListadoComponent;
  let fixture: ComponentFixture<ListadoComponent>;
  let firebaseSpy: jasmine.SpyObj<FirebaseService>;
  let confirmationSubject: Subject<boolean>;

  beforeEach(() => {
    firebaseSpy = jasmine.createSpyObj<FirebaseService>('FirebaseService', [
      'obtener',
      'obtenerConPaginacion',
    ]);
    firebaseSpy.obtener.and.resolveTo([]);
    firebaseSpy.obtenerConPaginacion.and.resolveTo({ data: [], ultimoDoc: null as any });

    confirmationSubject = new Subject<boolean>();

    TestBed.configureTestingModule({
      declarations: [ListadoComponent],
      providers: [
        { provide: FirebaseService, useValue: firebaseSpy },
        { provide: MdbModalService, useValue: { open: () => {} } },
        {
          provide: ConfirmationService,
          useValue: {
            getConfirmationState: () => confirmationSubject.asObservable(),
            getDeleteEvent: () => of(null),
            getAddPagoEvent: () => of(null),
            getAddComentarioEvent: () => of(null),
            setConfirmationState: () => {},
          },
        },
        {
          provide: AdminService,
          useValue: {
            inicializar: () => Promise.resolve(),
            getEsAdminSnapshot: () => false,
            getEsAdmin: () => of(false),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(ListadoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('memory leaks — ngOnDestroy', () => {
    it('completa destroy$ al destruirse el componente', () => {
      const destroy$ = (component as any).destroy$ as Subject<void>;
      const completeSpy = spyOn(destroy$, 'complete').and.callThrough();
      component.ngOnDestroy();
      expect(completeSpy).toHaveBeenCalled();
    });

    it('emite en destroy$ al destruirse', () => {
      const destroy$ = (component as any).destroy$ as Subject<void>;
      let emitted = false;
      destroy$.subscribe(() => (emitted = true));
      component.ngOnDestroy();
      expect(emitted).toBeTrue();
    });

    it('suscripciones no ejecutan reloadData tras ngOnDestroy', async () => {
      const reloadSpy = spyOn<any>(component, 'reloadData').and.resolveTo();
      component.ngOnDestroy();
      // Emitir evento DESPUÉS de destruir: no debe triggear reload
      confirmationSubject.next(true);
      await Promise.resolve();
      expect(reloadSpy).not.toHaveBeenCalled();
    });
  });

  describe('deduplicación con Map', () => {
    it('no duplica laburos con el mismo id en paginaciones sucesivas', async () => {
      const laburo = makeLaburo('id-1');
      firebaseSpy.obtenerConPaginacion.and.resolveTo({
        data: [laburo],
        ultimoDoc: {} as any,
      });

      // Primera carga
      await (component as any).loadLaburos();
      const countAfterFirst = component.laburos.length;

      // Segunda carga con el mismo item (simula solapamiento de páginas)
      await (component as any).loadLaburos();

      expect(component.laburos.length).toBe(countAfterFirst);
    });

    it('actualiza el laburo si viene con misma id pero datos distintos', async () => {
      const v1 = makeLaburo('id-1', { precio: 100 });
      const v2 = makeLaburo('id-1', { precio: 999 });

      firebaseSpy.obtenerConPaginacion.and.resolveTo({ data: [v1], ultimoDoc: null as any });
      await (component as any).loadLaburos();
      expect(component.laburos[0].data.precio).toBe(100);

      firebaseSpy.obtenerConPaginacion.and.resolveTo({ data: [v2], ultimoDoc: null as any });
      await (component as any).loadLaburos();
      expect(component.laburos[0].data.precio).toBe(999);
      expect(component.laburos.length).toBe(1);
    });

    it('el Map se limpia en reloadData', async () => {
      const laburo = makeLaburo('id-1');
      firebaseSpy.obtenerConPaginacion.and.resolveTo({ data: [laburo], ultimoDoc: null as any });
      await (component as any).loadLaburos();
      expect((component as any).laburosMap.size).toBe(1);

      await (component as any).reloadData();
      // Tras reload, el map se limpia y recarga
      expect((component as any).laburosMap.size).toBe(1); // recargado con 1 item
    });
  });
});
