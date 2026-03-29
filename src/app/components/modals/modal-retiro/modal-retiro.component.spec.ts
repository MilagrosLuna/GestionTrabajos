import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MdbModalRef } from 'mdb-angular-ui-kit/modal';
import { ModalRetiroComponent } from './modal-retiro.component';
import { AlertsService } from 'src/app/servicesAndUtils/alerts.service';
import { ConfirmationService } from 'src/app/servicesAndUtils/confirmation.service';
import { FirebaseService } from 'src/app/servicesAndUtils/firebase.service';

describe('ModalRetiroComponent', () => {
  let component: ModalRetiroComponent;
  let fixture: ComponentFixture<ModalRetiroComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [ModalRetiroComponent],
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
            emitRetiroEvent: () => {},
          },
        },
        {
          provide: FirebaseService,
          useValue: {
            guardar: () => Promise.resolve({}),
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
    fixture = TestBed.createComponent(ModalRetiroComponent);
    component = fixture.componentInstance;
    component.saldo = 0;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
