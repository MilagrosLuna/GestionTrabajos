import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MdbModalRef } from 'mdb-angular-ui-kit/modal';
import { ModalPagoComponent } from './modal-pago.component';
import { AlertsService } from 'src/app/servicesAndUtils/alerts.service';
import { AuditoriaService } from 'src/app/servicesAndUtils/auditoria.service';
import { ConfirmationService } from 'src/app/servicesAndUtils/confirmation.service';
import { FirebaseService } from 'src/app/servicesAndUtils/firebase.service';
import { StorageService } from 'src/app/servicesAndUtils/storage.service';

describe('ModalPagoComponent', () => {
  let component: ModalPagoComponent;
  let fixture: ComponentFixture<ModalPagoComponent>;

  function crearLaburo(overrides: any = {}) {
    return {
      id: '1',
      data: {
        precio: 100,
        sena: 0,
        pago: 0,
        pagoEfectivo: 0,
        ...overrides,
      },
    };
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [ModalPagoComponent],
      providers: [
        {
          provide: MdbModalRef,
          useValue: { close: () => {} },
        },
        {
          provide: ConfirmationService,
          useValue: {
            emitAddPagoEvent: () => {},
            setConfirmationState: () => {},
          },
        },
        {
          provide: FirebaseService,
          useValue: {
            obtener: () => Promise.resolve([]),
            modificar: () => Promise.resolve(true),
            guardar: () => Promise.resolve({}),
          },
        },
        {
          provide: AlertsService,
          useValue: { showErrorMessage: () => {} },
        },
        {
          provide: StorageService,
          useValue: { guardarFoto: () => Promise.resolve('url') },
        },
        {
          provide: AuditoriaService,
          useValue: { registrar: () => Promise.resolve() },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(ModalPagoComponent);
    component = fixture.componentInstance;
    component.laburo = crearLaburo();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('valorRestante', () => {
    it('es positivo cuando hay saldo pendiente', async () => {
      component.laburo = crearLaburo({ precio: 100, sena: 30, pago: 0, pagoEfectivo: 0 });
      await component.ngOnInit();
      expect(component.valorRestante).toBe(70);
    });

    it('es 0 cuando ya está pagado exactamente', async () => {
      component.laburo = crearLaburo({ precio: 100, sena: 100, pago: 0, pagoEfectivo: 0 });
      await component.ngOnInit();
      expect(component.valorRestante).toBe(0);
    });

    it('nunca es negativo aunque los pagos superen el precio', async () => {
      // Caso edge: seña + pagos > precio (datos inconsistentes en Firestore)
      component.laburo = crearLaburo({ precio: 100, sena: 60, pago: 50, pagoEfectivo: 0 });
      await component.ngOnInit();
      expect(component.valorRestante).toBeGreaterThanOrEqual(0);
      expect(component.valorRestante).toBe(0);
    });

    it('clamea a 0 con sena + pago + pagoEfectivo > precio', async () => {
      component.laburo = crearLaburo({ precio: 100, sena: 40, pago: 40, pagoEfectivo: 40 });
      await component.ngOnInit();
      expect(component.valorRestante).toBe(0);
    });

    it('calcula correctamente con pago mixto efectivo y transferencia', async () => {
      component.laburo = crearLaburo({ precio: 200, sena: 50, pago: 80, pagoEfectivo: 0 });
      await component.ngOnInit();
      expect(component.valorRestante).toBe(70);
    });
  });
});
