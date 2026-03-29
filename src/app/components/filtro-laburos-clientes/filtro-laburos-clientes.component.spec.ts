import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { MdbModalService } from 'mdb-angular-ui-kit/modal';
import { FiltroLaburosClientesComponent } from './filtro-laburos-clientes.component';
import { FirebaseService } from 'src/app/servicesAndUtils/firebase.service';
import { ConfirmationService } from 'src/app/servicesAndUtils/confirmation.service';
import { AuthService } from 'src/app/servicesAndUtils/auth.service';

describe('FiltroLaburosClientesComponent', () => {
  let component: FiltroLaburosClientesComponent;
  let fixture: ComponentFixture<FiltroLaburosClientesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FiltroLaburosClientesComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ id: '1' }),
          },
        },
        {
          provide: FirebaseService,
          useValue: {
            getWhere: () => Promise.resolve([]),
            obtenerUno: () => Promise.resolve(null),
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
          provide: ConfirmationService,
          useValue: {
            getConfirmationState: () => of(false),
            getDeleteEvent: () => of(null),
            getAddPagoEvent: () => of(null),
            getAddComentarioEvent: () => of(null),
            setConfirmationState: () => {},
          },
        },
        {
          provide: AuthService,
          useValue: {
            getCurrentUid: () => 'admin-1',
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(FiltroLaburosClientesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
