import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MdbModalRef } from 'mdb-angular-ui-kit/modal';
import { ModalPagoComponent } from './modal-pago.component';
import { AlertsService } from 'src/app/servicesAndUtils/alerts.service';
import { ConfirmationService } from 'src/app/servicesAndUtils/confirmation.service';
import { FirebaseService } from 'src/app/servicesAndUtils/firebase.service';
import { StorageService } from 'src/app/servicesAndUtils/storage.service';

describe('ModalPagoComponent', () => {
  let component: ModalPagoComponent;
  let fixture: ComponentFixture<ModalPagoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [ModalPagoComponent],
      providers: [
        {
          provide: MdbModalRef,
          useValue: {
            close: () => {},
          },
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
          useValue: {
            showErrorMessage: () => {},
          },
        },
        {
          provide: StorageService,
          useValue: {
            guardarFoto: () => Promise.resolve('url'),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(ModalPagoComponent);
    component = fixture.componentInstance;
    component.laburo = {
      id: '1',
      data: {
        precio: 100,
        sena: 0,
        pago: 0,
        pagoEfectivo: 0,
      },
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
