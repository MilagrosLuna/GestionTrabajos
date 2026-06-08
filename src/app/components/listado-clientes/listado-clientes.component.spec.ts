import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { ListadoClientesComponent } from './listado-clientes.component';
import { FirebaseService } from 'src/app/servicesAndUtils/firebase.service';
import { AdminService } from 'src/app/servicesAndUtils/admin.service';

describe('ListadoClientesComponent', () => {
  let component: ListadoClientesComponent;
  let fixture: ComponentFixture<ListadoClientesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule, RouterTestingModule],
      declarations: [ListadoClientesComponent],
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
          provide: AdminService,
          useValue: {
            getEsAdmin: () => of(false),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(ListadoClientesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
