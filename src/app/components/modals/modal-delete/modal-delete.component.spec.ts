import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MdbModalRef } from 'mdb-angular-ui-kit/modal';
import { ModalDeleteComponent } from './modal-delete.component';
import { ConfirmationService } from 'src/app/servicesAndUtils/confirmation.service';
import { FirebaseService } from 'src/app/servicesAndUtils/firebase.service';

describe('ModalDeleteComponent', () => {
  let component: ModalDeleteComponent;
  let fixture: ComponentFixture<ModalDeleteComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ModalDeleteComponent],
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
            emitDeleteEvent: () => {},
            setConfirmationState: () => {},
          },
        },
        {
          provide: FirebaseService,
          useValue: {
            guardar: () => Promise.resolve({}),
            borrar: () => Promise.resolve(true),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(ModalDeleteComponent);
    component = fixture.componentInstance;
    component.laburo = {
      id: '1',
      data: {
        cajaSena: '',
        sena: 0,
        cajaFinalEfectivo: '',
        pagoEfectivo: 0,
      },
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
