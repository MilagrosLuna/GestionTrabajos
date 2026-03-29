import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { PresupuestosComponent } from './presupuestos.component';
import { FirebaseService } from 'src/app/servicesAndUtils/firebase.service';
import { AlertsService } from 'src/app/servicesAndUtils/alerts.service';

describe('PresupuestosComponent', () => {
  let component: PresupuestosComponent;
  let fixture: ComponentFixture<PresupuestosComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, HttpClientTestingModule],
      declarations: [PresupuestosComponent],
      providers: [
        {
          provide: FirebaseService,
          useValue: {
            obtener: () => Promise.resolve([]),
            obtenrUno: () => Promise.resolve({ data: { contador: 0 } }),
            modificar: () => Promise.resolve(true),
            guardar: () => Promise.resolve({ id: '1' }),
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
    fixture = TestBed.createComponent(PresupuestosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
