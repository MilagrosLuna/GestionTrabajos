import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { AltaComponent } from './alta.component';
import { FirebaseService } from 'src/app/servicesAndUtils/firebase.service';
import { AlertsService } from 'src/app/servicesAndUtils/alerts.service';
import { StorageService } from 'src/app/servicesAndUtils/storage.service';

describe('AltaComponent', () => {
  let component: AltaComponent;
  let fixture: ComponentFixture<AltaComponent>;
  let firebaseSpy: jasmine.SpyObj<FirebaseService>;
  let alertsSpy: jasmine.SpyObj<AlertsService>;
  let storageSpy: jasmine.SpyObj<StorageService>;

  beforeEach(() => {
    firebaseSpy = jasmine.createSpyObj<FirebaseService>('FirebaseService', [
      'obtener',
      'guardar',
      'incrementarContador',
    ]);
    alertsSpy = jasmine.createSpyObj<AlertsService>('AlertsService', [
      'showErrorMessage',
      'showSuccessMessage',
    ]);
    storageSpy = jasmine.createSpyObj<StorageService>('StorageService', [
      'guardarFoto',
    ]);

    firebaseSpy.obtener.and.resolveTo([]);
    firebaseSpy.guardar.and.resolveTo({ id: '1' } as any);
    firebaseSpy.incrementarContador.and.resolveTo(1);
    storageSpy.guardarFoto.and.resolveTo('url');

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [AltaComponent],
      providers: [
        { provide: FirebaseService, useValue: firebaseSpy },
        { provide: AlertsService, useValue: alertsSpy },
        { provide: StorageService, useValue: storageSpy },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(AltaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function completarFormularioValido() {
    component.form.patchValue({
      clienteName: 'Juan',
      esClienteAnonimo: false,
      cliente: 'cliente-1',
      fecha: '2026-03-29',
      fechaEntrega: '2026-04-02',
      trabajo: 'Tarjetas',
      detalle: 'Impresion full color',
      precio: 100,
      sena: 0,
      caja: 'efectivo',
      cuenta: '',
      comprobante: '',
      nuevaCuenta: '',
    });
    component.selectedClienteInfo = 'Cliente 1';
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('no debe guardar si trabajo y detalle tienen solo espacios', async () => {
    component.form.patchValue({
      clienteName: 'Juan',
      esClienteAnonimo: false,
      cliente: 'cliente-1',
      fecha: '2026-03-29',
      fechaEntrega: '2026-04-02',
      trabajo: '   ',
      detalle: '   ',
      precio: 100,
      sena: 0,
      caja: 'efectivo',
    });

    await component.onSubmit();

    expect(alertsSpy.showErrorMessage).toHaveBeenCalled();
    expect(firebaseSpy.incrementarContador).not.toHaveBeenCalled();
    expect(firebaseSpy.guardar).not.toHaveBeenCalled();
  });

  it('debe ignorar el segundo submit mientras el primero sigue en curso', async () => {
    completarFormularioValido();

    let resolverContador!: (value: number) => void;
    firebaseSpy.incrementarContador.and.returnValue(
      new Promise<number>((resolve) => {
        resolverContador = resolve;
      })
    );

    const primerSubmit = component.onSubmit();
    const segundoSubmit = component.onSubmit();

    expect(firebaseSpy.incrementarContador).toHaveBeenCalledTimes(1);

    resolverContador(1);
    await Promise.all([primerSubmit, segundoSubmit]);

    expect(firebaseSpy.guardar).toHaveBeenCalledTimes(1);
    expect(alertsSpy.showSuccessMessage).toHaveBeenCalled();
  });

  it('debe permitir guardar si hay cliente seleccionado aunque clienteName este vacio', async () => {
    component.form.patchValue({
      clienteName: '',
      esClienteAnonimo: false,
      cliente: 'cliente-1',
      fecha: '2026-03-29',
      fechaEntrega: '2026-04-02',
      trabajo: 'Tarjetas',
      detalle: 'Impresion full color',
      precio: 100,
      sena: 0,
      caja: 'efectivo',
    });
    component.selectedClienteInfo = 'Cliente 1';

    await component.onSubmit();

    expect(alertsSpy.showErrorMessage).not.toHaveBeenCalledWith(
      'Complete todos los datos'
    );
    expect(firebaseSpy.incrementarContador).toHaveBeenCalled();
    expect(firebaseSpy.guardar).toHaveBeenCalled();
  });
});
