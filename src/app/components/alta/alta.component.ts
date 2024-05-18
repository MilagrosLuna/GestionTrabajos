import { Component, ViewChild } from '@angular/core';
import { FirebaseService } from 'src/app/servicesAndUtils/firebase.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AlertsService } from 'src/app/servicesAndUtils/alerts.service';
import { Laburo } from 'src/app/clases/laburo';
import { StorageService } from 'src/app/servicesAndUtils/storage.service';
import { Movimiento } from 'src/app/clases/movimiento';
@Component({
  selector: 'app-alta',
  templateUrl: './alta.component.html',
  styleUrls: ['./alta.component.scss'],
})
export class AltaComponent {
  form!: FormGroup;
  cuentas: any[] = [];
  mostrarCampoNuevaCuenta: boolean = false;
  url!: File;
  constructor(
    private firebase: FirebaseService,
    private alerts: AlertsService,
    private storageService: StorageService
  ) {}

  async ngOnInit(): Promise<void> {
    this.form = new FormGroup({
      cliente: new FormControl('', [Validators.required]),
      fecha: new FormControl(this.getCurrentDate(), [Validators.required]),
      fechaEntrega: new FormControl(this.getFutureDate(), [
        Validators.required,
      ]),
      trabajo: new FormControl('', [Validators.required]),
      detalle: new FormControl('', [Validators.required]),
      precio: new FormControl('', [
        Validators.required,
        Validators.pattern(/^\d+(\.\d{1,2})?$/),
        Validators.min(0),
      ]),
      seña: new FormControl('', [
        Validators.required,
        Validators.pattern(/^\d+(\.\d{1,2})?$/),
        Validators.min(0),
      ]),

      caja: new FormControl('', [Validators.required]),
      cuenta: new FormControl('', [Validators.required]),
      comprobante: new FormControl('', [Validators.required]),
      nuevaCuenta: new FormControl(''),
    });

    this.cuentas = await this.firebase.obtener('cuentas');
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

  async agregarCuenta() {
    const nuevaCuenta = this.form.controls['nuevaCuenta'].value.trim();
    if (nuevaCuenta !== '') {
      const existeCuenta = this.cuentas.some((c) => c.nombre === nuevaCuenta);
      if (!existeCuenta) {
        await this.firebase.guardar({ nombre: nuevaCuenta }, 'cuentas');
        this.form.controls['nuevaCuenta'].setValue('');
        this.cuentas = await this.firebase.obtener('cuentas');
        this.mostrarCampoNuevaCuenta = false;
      } else {
        this.alerts.showErrorMessage('La cuenta ya existe');
      }
    } else {
      this.alerts.showErrorMessage('complete los datos');
    }
  }

  async onSubmit() {
    if (this.form.value.caja == 'efectivo') {
      if (
        this.form.controls['cliente'].valid &&
        this.form.controls['fecha'].valid &&
        this.form.controls['fechaEntrega'].valid &&
        this.form.controls['trabajo'].valid &&
        this.form.controls['detalle'].valid &&
        this.form.controls['precio'].valid &&
        this.form.controls['seña'].valid &&
        this.form.controls['caja'].valid
      ) {
        try {
          await this.cargar();
        } catch (error: any) {
          this.alerts.showErrorMessage(error);
        }
      } else {
        this.alerts.showErrorMessage('Error complete todos los datos!');
      }
    } else if (this.form.valid) {
      try {
        await this.cargar();
      } catch (error: any) {
        this.alerts.showErrorMessage(error);
      }
    } else {
      this.alerts.showErrorMessage('Error complete todos los datos!');
    }
  }
  async cargar() {
    let laburo = new Laburo();
    if (this.form.value.caja === 'transferencia') {
      let fotoUrl = await this.storageService.guardarFoto(
        this.url,
        'comprobantes'
      );
      laburo.comprobanteSena = fotoUrl;
    }
    laburo.cliente = this.form.value.cliente;
    laburo.fecha = this.form.value.fecha;
    laburo.fechaEntrega = this.form.value.fechaEntrega;
    laburo.trabajo = this.form.value.trabajo;
    laburo.detalle = this.form.value.detalle;
    laburo.precio = this.form.value.precio;
    laburo.sena = this.form.value.seña;
    laburo.cajaSena = this.form.value.caja;
    laburo.cuentaSena = this.form.value.cuenta;
    if (laburo.sena == laburo.precio) {
      console.log('laburo=seña');
      if (laburo.cajaSena == 'efectivo') {
     
        laburo.pagoEfectivo = laburo.precio;
        laburo.cajaFinalEfectivo = laburo.cajaSena;  
         console.log('efectivo');
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

    const contadorSnap = await this.firebase.obtenrUno('contadores', 'laburos');
    let contador = contadorSnap?.data['contador'];

    contador++;

    await this.firebase.modificar(
      { id: 'laburos', data: { contador: contador } },
      'contadores'
    );

    laburo.numero = contador;

    let laburoObj = JSON.parse(JSON.stringify(laburo));

    let id = await this.firebase.guardar(laburoObj, 'laburos');

    let movimiento = new Movimiento();
    movimiento.detalle =
      laburo.cliente +
      ', trabajo: ' +
      laburo.trabajo +
      ', detalle: ' +
      laburo.detalle +
      ', N° trabajo: ' +
      laburo.numero;
    movimiento.fecha = laburo.fecha;
    movimiento.idLaburo = id.id;
    movimiento.tipo = 'credito';
    let monto = 0;
    if (laburo.cajaSena == 'efectivo') {
      monto += laburo.sena;
    } else if (laburo.cajaFinalEfectivo == 'efectivo') {
      monto += laburo.pagoEfectivo;
    }

    movimiento.monto = monto;

    if (movimiento.monto > 0) {
      let movimientoObj = JSON.parse(JSON.stringify(movimiento));
      await this.firebase.guardar(movimientoObj, 'movimientos');
    }

    this.form.reset({
      fecha: this.getCurrentDate(),
      fechaEntrega: this.getFutureDate(),
    });
    this.alerts.showSuccessMessage('', 'Trabajo cargado');
  }

  onSelectFile(event: any) {
    if (event.target.files && event.target.files[0]) {
      this.url = event.target.files[0];
    }
  }
}
