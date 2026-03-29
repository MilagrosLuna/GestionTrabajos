import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MdbModalService } from 'mdb-angular-ui-kit/modal';
import { ListadoComponent } from './listado.component';
import { FirebaseService } from 'src/app/servicesAndUtils/firebase.service';
import { ConfirmationService } from 'src/app/servicesAndUtils/confirmation.service';
import { AuthService } from 'src/app/servicesAndUtils/auth.service';

describe('ListadoComponent', () => {
  let component: ListadoComponent;
  let fixture: ComponentFixture<ListadoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ListadoComponent],
      providers: [
        {
          provide: FirebaseService,
          useValue: {
            obtener: () => Promise.resolve([]),
            obtenerConPaginacion: () =>
              Promise.resolve({ data: [], ultimoDoc: null }),
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
    fixture = TestBed.createComponent(ListadoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
