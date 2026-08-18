import { Component, Input } from '@angular/core';
import { MdbModalRef } from 'mdb-angular-ui-kit/modal';
import { Movimiento } from 'src/app/clases/movimiento';
import { AlertsService } from 'src/app/servicesAndUtils/alerts.service';
import { AuditoriaService } from 'src/app/servicesAndUtils/auditoria.service';
import { ConfirmationService } from 'src/app/servicesAndUtils/confirmation.service';
import { FirebaseService } from 'src/app/servicesAndUtils/firebase.service';
import { StorageService } from 'src/app/servicesAndUtils/storage.service';

@Component({
  selector: 'app-modal-pago',
  templateUrl: './modal-pago.component.html',
  styleUrls: ['./modal-pago.component.scss'],
})
export class ModalPagoComponent {
  @Input() laburo: any;
  url!: File;
  laburoCopy: any;
  originalLaburo: any;
  cuentas: any[] = [];
  valorRestante: number = 0;
  transferencia: boolean = false;
  efectivo: boolean = false;
  clienteInfo: any = null;

  constructor(
    public modalRef: MdbModalRef<ModalPagoComponent>,
    private confirmationService: ConfirmationService,
    private firebase: FirebaseService,
    private alerts: AlertsService,
    private storageService: StorageService,
    private auditoria: AuditoriaService
  ) {}

  async ngOnInit(): Promise<void> {
    this.originalLaburo = JSON.parse(JSON.stringify(this.laburo));
    this.laburoCopy = JSON.parse(JSON.stringify(this.laburo));

    // clienteInfo/cuentaNombreSena/cuentaNombreFinal son campos calculados por
    // ListadoComponent solo para mostrar en las tarjetas: no existen en el
    // documento de Firestore y no deben volver a guardarse (ver confirmar()).
    this.clienteInfo = this.laburoCopy.data.clienteInfo ?? null;
    delete this.laburoCopy.data.clienteInfo;
    delete this.laburoCopy.data.cuentaNombreSena;
    delete this.laburoCopy.data.cuentaNombreFinal;
    delete this.originalLaburo.data.clienteInfo;
    delete this.originalLaburo.data.cuentaNombreSena;
    delete this.originalLaburo.data.cuentaNombreFinal;

    this.cuentas = await this.firebase.obtener('cuentas');
    const precio = this.laburoCopy.data.precio || 0;
    const sena = this.laburoCopy.data.sena || 0;
    const pagoExistente = this.laburoCopy.data.pago || 0;
    const pagoEfectivoExistente = this.laburoCopy.data.pagoEfectivo || 0;
    this.valorRestante = Math.max(precio - sena - pagoExistente - pagoEfectivoExistente, 0);
  }

  onSelectFile(event: any) {
    if (event.target.files && event.target.files[0]) {
      this.url = event.target.files[0];
    }
  }

  async confirmar() {
    let errorMessage = '';

    if (this.efectivo && this.transferencia) {
      if (
        this.laburoCopy.data.pago + this.laburoCopy.data.pagoEfectivo !==
        this.valorRestante
      ) {
        errorMessage = 'Ambos deben completar el valor restante';
      } else if (
        this.laburoCopy.data.pago === 0 ||
        this.laburoCopy.data.pagoEfectivo === 0
      ) {
        errorMessage = 'Debe dividir el valor entre efectivo y transferencia';
      }
      this.laburoCopy.data.cajaFinalEfectivo = 'efectivo';
    }

    if (this.efectivo && !this.transferencia) {
      if (this.laburoCopy.data.pagoEfectivo !== this.valorRestante) {
        errorMessage = 'Debe completar el valor restante';
      }
      this.laburoCopy.data.cajaFinalEfectivo = 'efectivo';
    }

    if (this.transferencia) {
      if (this.laburoCopy.data.pago !== this.valorRestante && !this.efectivo) {
        errorMessage = 'Debe completar el valor restante';
      }
      if (!this.laburoCopy.data.comprobantePago && !this.url) {
        errorMessage = 'Debe cargar el comprobante';
      }
      if (!this.laburoCopy.data.cuentaFinal) {
        errorMessage = 'Debe seleccionar una cuenta';
      }

      if (!errorMessage) {
        this.laburoCopy.data.cajaFinal = 'transferencia';
        let fotoUrl = await this.storageService.guardarFoto(
          this.url,
          'comprobantes'
        );
        this.laburoCopy.data.comprobantePago = fotoUrl;
      }
    }

    if (errorMessage) {
      this.alerts.showErrorMessage(errorMessage);
      return;
    }
    this.laburo = { ...this.laburoCopy };

    let bool = await this.firebase.modificar(this.laburo, 'laburos');

    const ahora = new Date();
    if (bool) {
      let movimiento = new Movimiento();
      movimiento.detalle =
        (this.laburo.data.cliente || this.clienteInfo?.nombre || this.laburo.data.clienteid) +
        ', trabajo: ' +
        this.laburo.data.trabajo +
        ', detalle: ' +
        this.laburo.data.detalle +
        ', N° trabajo: ' +
        this.laburo.data.numero;
      movimiento.fecha = this.laburo.data.fecha;
      movimiento.idLaburo = this.laburo.id;
      movimiento.tipo = 'credito';

      movimiento.createdAt = ahora.toISOString();

      if (this.laburo.data.cajaFinalEfectivo == 'efectivo') {
        movimiento.monto = this.laburo.data.pagoEfectivo;
      }

      if (movimiento.monto > 0) {
        let movimientoObj = JSON.parse(JSON.stringify(movimiento));
        await this.firebase.guardar(movimientoObj, 'movimientos');
      }
    }

    const senaPrevia = this.originalLaburo.data.sena || 0;
    const senaDesc = senaPrevia > 0 ? ` (seña previa: $${senaPrevia})` : '';
    await this.auditoria.registrar({
      accion: 'pago',
      entidad: 'laburo',
      entidadId: this.laburo.id,
      descripcion: `Pago final en trabajo N°${this.laburo.data.numero} – ${this.laburo.data.cliente || this.clienteInfo?.nombre || this.laburo.data.clienteid} – $${this.valorRestante}${senaDesc}`,
      datoAnterior: {
        sena: this.originalLaburo.data.sena,
        pago: this.originalLaburo.data.pago,
        pagoEfectivo: this.originalLaburo.data.pagoEfectivo,
        cajaFinal: this.originalLaburo.data.cajaFinal,
        cajaFinalEfectivo: this.originalLaburo.data.cajaFinalEfectivo,
        cuentaFinal: this.originalLaburo.data.cuentaFinal,
        comprobantePago: this.originalLaburo.data.comprobantePago,
      },
      datoNuevo: {
        sena: this.laburo.data.sena,
        pago: this.laburo.data.pago,
        pagoEfectivo: this.laburo.data.pagoEfectivo,
        cajaFinal: this.laburo.data.cajaFinal,
        cajaFinalEfectivo: this.laburo.data.cajaFinalEfectivo,
        cuentaFinal: this.laburo.data.cuentaFinal,
        comprobantePago: this.laburo.data.comprobantePago,
      },
    });

    this.confirmationService.emitAddPagoEvent();
    this.confirmationService.setConfirmationState(true);
    this.modalRef.close();
  }

  cancelar() {
    this.confirmationService.setConfirmationState(false);
    this.laburoCopy = JSON.parse(JSON.stringify(this.originalLaburo));
    this.modalRef.close();
  }

  checkValue(field: string) {
    if (this.laburoCopy.data[field] < 0) {
      this.laburoCopy.data[field] = 0;
    }
  }
}
