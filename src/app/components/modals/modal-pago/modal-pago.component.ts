import { Component, Input } from '@angular/core';
import { MdbModalRef } from 'mdb-angular-ui-kit/modal';
import { Movimiento } from 'src/app/clases/movimiento';
import { AlertsService } from 'src/app/servicesAndUtils/alerts.service';
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

  constructor(
    public modalRef: MdbModalRef<ModalPagoComponent>,
    private confirmationService: ConfirmationService,
    private firebase: FirebaseService,
    private alerts: AlertsService,
    private storageService: StorageService
  ) {}

  async ngOnInit(): Promise<void> {
    this.originalLaburo = JSON.parse(JSON.stringify(this.laburo));
    this.laburoCopy = JSON.parse(JSON.stringify(this.laburo));
    this.cuentas = await this.firebase.obtener('cuentas');
    this.valorRestante = this.laburoCopy.data.precio - this.laburo.data.sena;
  }

  onSelectFile(event: any) {
    if (event.target.files && event.target.files[0]) {
      this.url = event.target.files[0];
      this.laburoCopy.data.comprobantePago = this.url;
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
      if (!this.laburoCopy.data.comprobantePago) {
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
        console.log(fotoUrl);
      }
    }

    if (errorMessage) {
      this.alerts.showErrorMessage(errorMessage);
      return;
    }
    this.laburo = { ...this.laburoCopy };
    this.confirmationService.emitAddPagoEvent();

    let bool = await this.firebase.modificar(this.laburo, 'laburos');

    if (bool) {
      let movimiento = new Movimiento();
      movimiento.detalle =
        this.laburo.data.cliente +
        ', trabajo: ' +
        this.laburo.data.trabajo +
        ', detalle: ' +
        this.laburo.data.detalle +
        ', N° trabajo: ' +
        this.laburo.data.numero;
      movimiento.fecha = this.laburo.data.fecha;
      movimiento.idLaburo = this.laburo.id;
      movimiento.tipo = 'credito';

      if (this.laburo.data.cajaFinalEfectivo == 'efectivo') {
        movimiento.monto = this.laburo.data.pagoEfectivo;
      }

      if (movimiento.monto > 0) {
        let movimientoObj = JSON.parse(JSON.stringify(movimiento));
        await this.firebase.guardar(movimientoObj, 'movimientos');
      }
    }

    this.confirmationService.setConfirmationState(true);
    this.modalRef.close();

    console.log(this.laburoCopy);
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
