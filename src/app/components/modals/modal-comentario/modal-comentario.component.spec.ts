import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MdbModalRef } from 'mdb-angular-ui-kit/modal';
import { ModalComentarioComponent } from './modal-comentario.component';
import { AlertsService } from 'src/app/servicesAndUtils/alerts.service';
import { ConfirmationService } from 'src/app/servicesAndUtils/confirmation.service';
import { FirebaseService } from 'src/app/servicesAndUtils/firebase.service';

describe('ModalComentarioComponent', () => {
  let component: ModalComentarioComponent;
  let fixture: ComponentFixture<ModalComentarioComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [ModalComentarioComponent],
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
            setConfirmationState: () => {},
            emitAddComentarioEvent: () => {},
          },
        },
        {
          provide: FirebaseService,
          useValue: {
            obtener: () => Promise.resolve([]),
            modificar: () => Promise.resolve(true),
          },
        },
        {
          provide: AlertsService,
          useValue: {
            showErrorMessage: () => {},
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(ModalComentarioComponent);
    component = fixture.componentInstance;
    component.laburo = {
      id: '1',
      data: {
        comentario: '',
      },
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
