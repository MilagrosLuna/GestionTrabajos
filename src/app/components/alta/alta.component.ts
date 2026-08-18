import { Component } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Observable } from 'rxjs';
import { Laburo } from 'src/app/clases/laburo';
import { Movimiento } from 'src/app/clases/movimiento';
import { AlertsService } from 'src/app/servicesAndUtils/alerts.service';
import { AuditoriaService } from 'src/app/servicesAndUtils/auditoria.service';
import { FirebaseService } from 'src/app/servicesAndUtils/firebase.service';
import { StorageService } from 'src/app/servicesAndUtils/storage.service';

export function noWhitespaceValidator(
  control: AbstractControl
): ValidationErrors | null {
  const value = (control.value ?? '').toString();
  return value.trim().length ? null : { whitespace: true };
}

export function fechaEntregaValidator(
  group: AbstractControl
): ValidationErrors | null {
  const fecha = group.get('fecha')?.value;
  const fechaEntrega = group.get('fechaEntrega')?.value;
  if (fecha && fechaEntrega && fechaEntrega < fecha) {
    return { fechaEntregaAnterior: true };
  }
  return null;
}

type AltaFormValue = {
  clienteName: string;
  esClienteAnonimo: boolean;
  cliente: string;
  fecha: string;
  fechaEntrega: string;
  trabajo: string;
  detalle: string;
  precio: number;
  sena: number;
  caja: string;
  cuenta: string;
};

@Component({
  selector: 'app-alta',
  templateUrl: './alta.component.html',
  styleUrls: ['./alta.component.scss'],
})
export class AltaComponent {
  form!: FormGroup;
  cuentas: any[] = [];
  clientes: any[] = [];
  filteredClientes: Observable<any[]> = new Observable<any[]>();
  mostrarCampoNuevaCuenta: boolean = false;
  url: File | null = null;
  showDropdown: boolean = false;
  clientesFiltered: any[] = [];
  selectedClienteInfo: string = '';
  isSubmitting: boolean = false;

  constructor(
    private firebase: FirebaseService,
    private alerts: AlertsService,
    private storageService: StorageService,
    private auditoria: AuditoriaService
  ) {}

  async ngOnInit(): Promise<void> {
    this.form = new FormGroup({
      clienteName: new FormControl('', [
        Validators.required,
        noWhitespaceValidator,
      ]),
      esClienteAnonimo: new FormControl(false),
      cliente: new FormControl('', [Validators.required]),
      fecha: new FormControl(this.getCurrentDate(), [Validators.required]),
      fechaEntrega: new FormControl(this.getFutureDate(), [
        Validators.required,
      ]),
      trabajo: new FormControl('', [
        Validators.required,
        noWhitespaceValidator,
      ]),
      detalle: new FormControl('', [
        Validators.required,
        noWhitespaceValidator,
      ]),
      precio: new FormControl('', [
        Validators.required,
        Validators.pattern(/^\d+(\.\d{1,2})?$/),
        Validators.min(0),
      ]),
      sena: new FormControl('', [
        Validators.required,
        Validators.pattern(/^\d+(\.\d{1,2})?$/),
        Validators.min(0),
      ]),
      caja: new FormControl('', [Validators.required]),
      cuenta: new FormControl(''),
      comprobante: new FormControl(''),
      nuevaCuenta: new FormControl(''),
    }, { validators: fechaEntregaValidator });

    this.form.controls['esClienteAnonimo'].valueChanges.subscribe((value) => {
      if (value) {
        this.form.controls['clienteName'].setValidators([
          Validators.required,
          noWhitespaceValidator,
        ]);
        this.form.controls['cliente'].clearValidators();
        this.form.controls['cliente'].setValue('');
        this.selectedClienteInfo = '';
        this.clientesFiltered = [];
      } else {
        this.form.controls['clienteName'].clearValidators();
        this.form.controls['clienteName'].setValue('');
        this.form.controls['cliente'].setValidators([Validators.required]);
        this.clientesFiltered = [];
      }

      this.form.controls['clienteName'].updateValueAndValidity();
      this.form.controls['cliente'].updateValueAndValidity();
    });

    if (!this.form.controls['esClienteAnonimo'].value) {
      this.form.controls['clienteName'].clearValidators();
      this.form.controls['clienteName'].updateValueAndValidity();
    }

    this.form.controls['caja'].valueChanges.subscribe((value) => {
      this.updateTransferValidators(value);
    });

    this.updateTransferValidators(this.form.controls['caja'].value);

    this.cuentas = await this.firebase.obtener('cuentas');
    this.clientes = await this.firebase.obtener('clientes');
  }

  private updateTransferValidators(caja: string): void {
    const cuentaControl = this.form.controls['cuenta'];
    const comprobanteControl = this.form.controls['comprobante'];

    if (caja === 'transferencia') {
      cuentaControl.setValidators([Validators.required]);
      comprobanteControl.setValidators([Validators.required]);
    } else {
      cuentaControl.clearValidators();
      comprobanteControl.clearValidators();
      cuentaControl.setValue('');
      comprobanteControl.setValue('');
      this.url = null;
    }

    cuentaControl.updateValueAndValidity();
    comprobanteControl.updateValueAndValidity();
  }

  async buscarCliente() {
    const nombre = (this.form.controls['clienteName'].value ?? '')
      .toString()
      .trim()
      .toLowerCase();

    if (nombre) {
      const clientesCoincidenAmbos = this.clientes.filter((cliente) => {
        const nombreCliente = (cliente.data.nombre ?? '').toLowerCase().trim();
        return nombreCliente.includes(nombre);
      });

      this.clientesFiltered = clientesCoincidenAmbos;

      if (this.clientesFiltered.length === 0) {
        this.alerts.showErrorMessage('No se encontraron resultados.');
      }
    } else {
      this.alerts.showErrorMessage(
        'Ingrese al menos una parte del nombre para buscar.'
      );
    }
  }

  selectCliente(cliente: any) {
    this.form.controls['cliente'].setValue(cliente.id);
    this.selectedClienteInfo = `N° ${cliente.data.clienteNumero} - ${cliente.data.nombre} - ${cliente.data.telefono} - ${cliente.data.email}`;
    this.clientesFiltered = [];
  }

  getCurrentDate(): string {
    const today = new Date();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${today.getFullYear()}-${month}-${day}`;
  }

  getFutureDate(): string {
    const future = new Date();
    future.setDate(future.getDate() + 4);
    const month = (future.getMonth() + 1).toString().padStart(2, '0');
    const day = future.getDate().toString().padStart(2, '0');
    return `${future.getFullYear()}-${month}-${day}`;
  }

  private toLocalDate(dateValue: string): Date {
    const [year, month, day] = dateValue.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  async agregarCuenta() {
    const nuevaCuenta = (this.form.controls['nuevaCuenta'].value ?? '')
      .toString()
      .trim();

    if (nuevaCuenta !== '') {
      const existeCuenta = this.cuentas.some(
        (c) =>
          (c.data?.nombre ?? '').trim().toLowerCase() ===
          nuevaCuenta.toLowerCase()
      );

      if (!existeCuenta) {
        try {
          await this.firebase.guardar({ nombre: nuevaCuenta }, 'cuentas');
          this.form.controls['nuevaCuenta'].setValue('');
          this.cuentas = await this.firebase.obtener('cuentas');
          this.mostrarCampoNuevaCuenta = false;
        } catch (err: any) {
          this.alerts.showErrorMessage(err?.message ?? 'No se pudo agregar la cuenta.');
        }
      } else {
        this.alerts.showErrorMessage('La cuenta ya existe');
      }
    } else {
      this.alerts.showErrorMessage('Complete los datos');
    }
  }

  async onSubmit() {
    if (this.isSubmitting) {
      return;
    }

    this.form.markAllAsTouched();
    this.form.updateValueAndValidity();

    if (!this.form.valid) {
      if (this.form.errors?.['fechaEntregaAnterior']) {
        this.alerts.showErrorMessage('La fecha de entrega no puede ser anterior a la fecha de inicio.');
      } else {
        this.alerts.showErrorMessage('Complete todos los datos');
      }
      return;
    }

    const formValue = this.getSanitizedFormValue();

    if (!formValue.esClienteAnonimo && !formValue.cliente) {
      this.alerts.showErrorMessage('Debe seleccionar un cliente.');
      return;
    }

    if (formValue.sena > formValue.precio) {
      this.alerts.showErrorMessage(
        'La seña no puede ser mayor que el precio total.'
      );
      return;
    }

    if (formValue.caja === 'transferencia') {
      if (!formValue.cuenta) {
        this.alerts.showErrorMessage('Debe seleccionar una cuenta.');
        return;
      }

      if (!this.url) {
        this.alerts.showErrorMessage('Debe cargar el comprobante.');
        return;
      }
    }

    try {
      this.isSubmitting = true;
      await this.cargar(formValue);
    } catch (error: any) {
      this.alerts.showErrorMessage(
        error?.message || 'Ocurrió un error al cargar el trabajo.'
      );
    } finally {
      this.isSubmitting = false;
    }
  }

  private getSanitizedFormValue(): AltaFormValue {
    const rawValue = this.form.getRawValue();

    return {
      clienteName: (rawValue.clienteName ?? '').toString().trim(),
      esClienteAnonimo: !!rawValue.esClienteAnonimo,
      cliente: (rawValue.cliente ?? '').toString().trim(),
      fecha: rawValue.fecha,
      fechaEntrega: rawValue.fechaEntrega,
      trabajo: (rawValue.trabajo ?? '').toString().trim(),
      detalle: (rawValue.detalle ?? '').toString().trim(),
      precio: Number(rawValue.precio) || 0,
      sena: Number(rawValue.sena) || 0,
      caja: (rawValue.caja ?? '').toString(),
      cuenta: (rawValue.cuenta ?? '').toString().trim(),
    };
  }

  async cargar(formValue: AltaFormValue) {
    const laburo = new Laburo();
    const precio = formValue.precio;
    const sena = formValue.sena;

    if (formValue.caja === 'transferencia') {
      if (!this.url) {
        this.alerts.showErrorMessage('Debe cargar el comprobante.');
        return;
      }

      laburo.comprobanteSena = await this.storageService.guardarFoto(
        this.url,
        'comprobantes'
      );
    }

    const nombreAnon = formValue.clienteName;
    let clienteTextoMovimiento = '';

    if (formValue.esClienteAnonimo === true) {
      if (!nombreAnon) {
        this.alerts.showErrorMessage('Ingresá el nombre del cliente anónimo.');
        return;
      }
      laburo.cliente = nombreAnon;
      clienteTextoMovimiento = nombreAnon;
    } else {
      laburo.clienteid = formValue.cliente;
      clienteTextoMovimiento = this.selectedClienteInfo;
    }

    laburo.fecha = this.toLocalDate(formValue.fecha);
    laburo.fechaEntrega = this.toLocalDate(formValue.fechaEntrega);
    laburo.trabajo = formValue.trabajo;
    laburo.detalle = formValue.detalle;
    laburo.precio = precio;
    laburo.sena = sena;
    laburo.cajaSena = formValue.caja;
    laburo.cuentaSena = formValue.cuenta;

    if (laburo.sena === laburo.precio) {
      if (laburo.cajaSena === 'efectivo') {
        laburo.pagoEfectivo = laburo.precio;
        laburo.cajaFinalEfectivo = laburo.cajaSena;
      } else {
        laburo.pago = laburo.precio;
        laburo.comprobantePago = laburo.comprobanteSena;
        laburo.cajaFinal = laburo.cajaSena;
        laburo.cuentaFinal = laburo.cuentaSena;
      }
      laburo.sena = 0;
      laburo.cajaSena = '';
      laburo.comprobanteSena = '';
      laburo.cuentaSena = '';
    }

    const contador = await this.firebase.incrementarContador('laburos');
    laburo.numero = contador;

    const laburoObj = JSON.parse(JSON.stringify(laburo));
    const id = await this.firebase.guardar(laburoObj, 'laburos');

    const senaDesc = sena > 0 && sena < precio ? ` – Seña: $${sena}` : '';
    await this.auditoria.registrar({
      accion: 'alta',
      entidad: 'laburo',
      entidadId: id.id,
      descripcion: `Creó trabajo N°${laburo.numero} – ${laburo.cliente || clienteTextoMovimiento}${senaDesc}`,
      datoNuevo: laburoObj,
    });

    if (sena > 0 && sena < precio) {
      await this.auditoria.registrar({
        accion: 'seña',
        entidad: 'laburo',
        entidadId: id.id,
        descripcion: `Seña de $${sena} en trabajo N°${laburo.numero} – ${formValue.caja}`,
        datoNuevo: {
          sena,
          cajaSena: formValue.caja,
          ...(formValue.cuenta ? { cuentaSena: formValue.cuenta } : {}),
        },
      });
    }

    const ahora = new Date();
    const movimiento = new Movimiento();
    movimiento.detalle =
      clienteTextoMovimiento +
      ', trabajo: ' +
      laburo.trabajo +
      ', detalle: ' +
      laburo.detalle +
      ', N° trabajo: ' +
      laburo.numero;
    movimiento.fecha = laburo.fecha;
    movimiento.idLaburo = id.id;
    movimiento.createdAt = ahora.toISOString();
    movimiento.tipo = 'credito';

    let monto = 0;
    if (laburo.cajaSena === 'efectivo') {
      monto += laburo.sena;
    } else if (laburo.cajaFinalEfectivo === 'efectivo') {
      monto += laburo.pagoEfectivo;
    }

    movimiento.monto = monto;

    if (movimiento.monto > 0) {
      const movimientoObj = JSON.parse(JSON.stringify(movimiento));
      await this.firebase.guardar(movimientoObj, 'movimientos');
    }

    this.form.reset({
      clienteName: '',
      esClienteAnonimo: false,
      cliente: '',
      fecha: this.getCurrentDate(),
      fechaEntrega: this.getFutureDate(),
      trabajo: '',
      detalle: '',
      precio: '',
      sena: '',
      caja: '',
      cuenta: '',
      comprobante: '',
      nuevaCuenta: '',
    });
    this.url = null;
    this.selectedClienteInfo = '';
    this.clientesFiltered = [];
    this.alerts.showSuccessMessage('', 'Trabajo cargado');
  }

  onSelectFile(event: any) {
    const file: File | null = event.target.files?.[0] ?? null;
    if (!file) return;

    try {
      this.storageService.validateFile(file);
    } catch (err: any) {
      this.alerts.showErrorMessage(err.message);
      event.target.value = '';
      return;
    }

    this.url = file;
    this.form.controls['comprobante'].setValue(file);
    this.form.controls['comprobante'].updateValueAndValidity();
  }
}
