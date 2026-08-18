import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CajaComponent } from './caja.component';
import { FirebaseService } from 'src/app/servicesAndUtils/firebase.service';
import { AlertsService } from 'src/app/servicesAndUtils/alerts.service';
import { ConfirmationService } from 'src/app/servicesAndUtils/confirmation.service';
import { MdbModalService } from 'mdb-angular-ui-kit/modal';

describe('CajaComponent', () => {
  let component: CajaComponent;
  let fixture: ComponentFixture<CajaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CajaComponent],
      providers: [
        {
          provide: FirebaseService,
          useValue: {
            obtener: () => Promise.resolve([]),
          },
        },
        {
          provide: MdbModalService,
          useValue: {
            open: () => {},
          },
        },
        {
          provide: AlertsService,
          useValue: {
            showErrorMessage: () => {},
          },
        },
        {
          provide: ConfirmationService,
          useValue: {
            getRetiroEvent: () => of(null),
            getDeleteEvent: () => of(null),
            getAddPagoEvent: () => of(null),
            getConfirmationState: () => of(false),
            setConfirmationState: () => {},
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(CajaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
