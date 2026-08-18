import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { MdbModalRef } from 'mdb-angular-ui-kit/modal';
import { ModalComponent } from './modal.component';
import { AlertsService } from 'src/app/servicesAndUtils/alerts.service';
import { AuditoriaService } from 'src/app/servicesAndUtils/auditoria.service';
import { ConfirmationService } from 'src/app/servicesAndUtils/confirmation.service';
import { FirebaseService } from 'src/app/servicesAndUtils/firebase.service';
import { StorageService } from 'src/app/servicesAndUtils/storage.service';

describe('ModalComponent', () => {
  let component: ModalComponent;
  let fixture: ComponentFixture<ModalComponent>;
  let firebaseSpy: jasmine.SpyObj<FirebaseService>;
  let auditoriaSpy: jasmine.SpyObj<AuditoriaService>;

  const clientesMock = [
    { id: 'c1', data: { nombre: 'Ana Lopez', clienteNumero: 1, telefono: '111' } },
    { id: 'c2', data: { nombre: 'Ana Torres', clienteNumero: 2, telefono: '222' } },
  ];

  const baseLaburoData = {
    cliente: '',
    clienteid: '',
    fecha: '',
    fechaEntrega: '',
    trabajo: '',
    detalle: '',
    precio: 0,
    sena: 0,
    cajaSena: '',
    cuentaSena: '',
    pago: 0,
    pagoEfectivo: 0,
    cajaFinal: '',
    cuentaFinal: '',
    cajaFinalEfectivo: '',
    comentario: '',
  };

  beforeEach(() => {
    firebaseSpy = jasmine.createSpyObj('FirebaseService', [
      'obtener',
      'modificar',
      'guardar',
    ]);
    firebaseSpy.obtener.and.callFake((ruta: string) => {
      if (ruta === 'clientes') {
        return Promise.resolve(clientesMock);
      }
      return Promise.resolve([]);
    });
    firebaseSpy.modificar.and.returnValue(Promise.resolve(true));
    firebaseSpy.guardar.and.returnValue(Promise.resolve({} as any));

    auditoriaSpy = jasmine.createSpyObj('AuditoriaService', ['registrar']);
    auditoriaSpy.registrar.and.returnValue(Promise.resolve());

    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [ModalComponent],
      providers: [
        {
          provide: MdbModalRef,
          useValue: { close: () => {} },
        },
        {
          provide: ConfirmationService,
          useValue: { setConfirmationState: () => {} },
        },
        { provide: FirebaseService, useValue: firebaseSpy },
        {
          provide: AlertsService,
          useValue: { showErrorMessage: () => {} },
        },
        {
          provide: StorageService,
          useValue: { guardarFoto: () => Promise.resolve('url') },
        },
        { provide: AuditoriaService, useValue: auditoriaSpy },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(ModalComponent);
    component = fixture.componentInstance;
  });

  async function initWith(dataOverrides: any = {}): Promise<void> {
    component.laburo = {
      id: '1',
      data: { ...baseLaburoData, ...dataOverrides },
    };
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('should create', async () => {
    await initWith();
    expect(component).toBeTruthy();
  });

  describe('nombre de cliente', () => {
    it('muestra el input editable cuando el trabajo es de un cliente anónimo', async () => {
      await initWith({ cliente: 'Juan Perez', clienteid: '' });

      const input = fixture.debugElement.query(By.css('[data-test="cliente-input"]'));
      const readonly = fixture.debugElement.query(By.css('[data-test="cliente-readonly"]'));

      expect(input).withContext('input editable de cliente anónimo').toBeTruthy();
      expect(input.nativeElement.value).toBe('Juan Perez');
      expect(readonly).withContext('no debe mostrarse el campo de solo lectura').toBeFalsy();
    });

    it('muestra el nombre real del cliente registrado en modo solo lectura, en vez de un campo vacío', async () => {
      await initWith({
        cliente: '',
        clienteid: 'c1',
        clienteInfo: { nombre: 'Cliente Registrado', clienteNumero: 9 },
      });

      const readonly = fixture.debugElement.query(By.css('[data-test="cliente-readonly"]'));
      const input = fixture.debugElement.query(By.css('[data-test="cliente-input"]'));

      expect(readonly).withContext('campo de solo lectura con el nombre del cliente').toBeTruthy();
      expect(readonly.nativeElement.value).toBe('Cliente Registrado');
      expect(readonly.nativeElement.readOnly).toBeTrue();
      expect(input).withContext('no debe mostrarse el input editable').toBeFalsy();
    });

    it('permite cambiar el cliente registrado buscando otro y seleccionándolo', async () => {
      await initWith({
        cliente: '',
        clienteid: 'c1',
        clienteInfo: { nombre: 'Ana Lopez', clienteNumero: 1 },
      });

      // Los clientes no se cargan hasta que se pide cambiar de cliente
      expect(firebaseSpy.obtener).not.toHaveBeenCalledWith('clientes');

      const boton = fixture.debugElement.query(By.css('[data-test="cambiar-cliente-btn"]'));
      boton.nativeElement.click();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(firebaseSpy.obtener).toHaveBeenCalledWith('clientes');

      component.busquedaCliente = 'ana t';
      component.buscarClienteEdit();
      fixture.detectChanges();

      expect(component.clientesFiltered.length).toBe(1);
      expect(component.clientesFiltered[0].id).toBe('c2');

      component.seleccionarCliente(clientesMock[1]);
      fixture.detectChanges();

      expect(component.laburoCopy.data.clienteid).toBe('c2');
      expect(component.clienteInfo.nombre).toBe('Ana Torres');
      expect(component.mostrarBusquedaCliente).toBeFalse();

      const readonly = fixture.debugElement.query(By.css('[data-test="cliente-readonly"]'));
      expect(readonly.nativeElement.value).toBe('Ana Torres');
    });
  });

  describe('guardado sin contaminar el documento', () => {
    it('no reenvía a Firestore los campos calculados (clienteInfo, cuentaNombreSena, cuentaNombreFinal)', async () => {
      await initWith({
        clienteid: 'c1',
        clienteInfo: { nombre: 'Cliente Registrado' },
        cuentaNombreSena: 'Banco X',
        cuentaNombreFinal: 'Banco Y',
        trabajo: 'Tarjetas',
        detalle: 'Detalle',
        precio: 100,
      });

      expect(component.laburoCopy.data.clienteInfo).toBeUndefined();
      expect(component.laburoCopy.data.cuentaNombreSena).toBeUndefined();
      expect(component.laburoCopy.data.cuentaNombreFinal).toBeUndefined();

      await component.confirmar();

      expect(firebaseSpy.modificar).toHaveBeenCalled();
      const [laburoGuardado] = firebaseSpy.modificar.calls.mostRecent().args;
      expect(laburoGuardado.data.clienteInfo).toBeUndefined();
      expect(laburoGuardado.data.cuentaNombreSena).toBeUndefined();
      expect(laburoGuardado.data.cuentaNombreFinal).toBeUndefined();
    });

    it('usa el nombre del cliente registrado (no vacío) en la descripción de auditoría', async () => {
      await initWith({
        clienteid: 'c1',
        clienteInfo: { nombre: 'Cliente Registrado' },
        trabajo: 'Tarjetas',
        detalle: 'Detalle',
        precio: 100,
      });

      await component.confirmar();

      const [registro] = auditoriaSpy.registrar.calls.mostRecent().args;
      expect(registro.descripcion).toContain('Cliente Registrado');
      expect(registro.descripcion).not.toMatch(/–\s*$/);
    });
  });

  describe('Pago final efectivo', () => {
    it('permanece visible aunque se edite el monto a 0, para no perder el campo mientras se corrige', async () => {
      await initWith({ pagoEfectivo: 500, cajaFinalEfectivo: 'efectivo' });

      let bloque = fixture.debugElement.query(By.css('[data-test="pago-efectivo-block"]'));
      expect(bloque).withContext('visible inicialmente porque el trabajo ya tenía pago en efectivo').toBeTruthy();

      component.laburoCopy.data.pagoEfectivo = 0;
      fixture.detectChanges();

      bloque = fixture.debugElement.query(By.css('[data-test="pago-efectivo-block"]'));
      expect(bloque)
        .withContext('el campo no debe desaparecer mientras se edita el valor a 0')
        .toBeTruthy();
    });

    it('no se muestra si el trabajo nunca tuvo un pago final en efectivo', async () => {
      await initWith({ pagoEfectivo: 0, cajaFinalEfectivo: '' });

      const bloque = fixture.debugElement.query(By.css('[data-test="pago-efectivo-block"]'));
      expect(bloque).toBeFalsy();
    });
  });
});
