import { Component, Input } from '@angular/core';
import { MdbModalRef } from 'mdb-angular-ui-kit/modal';
import { Movimiento } from 'src/app/clases/movimiento';
import { AuditoriaService } from 'src/app/servicesAndUtils/auditoria.service';
import { ConfirmationService } from 'src/app/servicesAndUtils/confirmation.service';
import { FirebaseService } from 'src/app/servicesAndUtils/firebase.service';

@Component({
  selector: 'app-modal-delete',
  templateUrl: './modal-delete.component.html',
  styleUrls: ['./modal-delete.component.scss'],
})
export class ModalDeleteComponent {
  @Input() laburo: any;

  constructor(
    public modalRef: MdbModalRef<ModalDeleteComponent>,
    private confirmationService: ConfirmationService,
    private firebase: FirebaseService,
    private auditoria: AuditoriaService
  ) {}

  async confirmar() {
    const snapshot = JSON.parse(JSON.stringify(this.laburo));

    await this.firebase.guardar(this.laburo, 'laburosArchivo');
    await this.firebase.borrar(this.laburo, 'laburos');

    const ahora = new Date();
    let movimiento = new Movimiento();
    movimiento.detalle = 'ajuste x laburo eliminado';
    movimiento.idLaburo = this.laburo.id;
    movimiento.tipo = 'debito';
    movimiento.fecha = new Date();
    movimiento.createdAt = ahora.toISOString();

    let monto = 0;
    if (this.laburo.data.cajaSena === 'efectivo') {
      monto = monto + this.laburo.data.sena;
    }
    if (this.laburo.data.cajaFinalEfectivo === 'efectivo') {
      monto = monto + this.laburo.data.pagoEfectivo;
    }
    movimiento.monto = monto;

    if (movimiento.monto > 0) {
      let movimientoObj = JSON.parse(JSON.stringify(movimiento));
      await this.firebase.guardar(movimientoObj, 'movimientos');
    }

    await this.auditoria.registrar({
      accion: 'eliminacion',
      entidad: 'laburo',
      entidadId: this.laburo.id,
      descripcion: `Eliminó trabajo N°${snapshot.data.numero} – ${snapshot.data.cliente || snapshot.data.clienteInfo?.nombre || snapshot.data.clienteid}`,
      datoAnterior: snapshot.data,
    });

    this.confirmationService.emitDeleteEvent();
    this.confirmationService.setConfirmationState(true);
    this.modalRef.close();
  }

  cancelar() {
    this.confirmationService.setConfirmationState(false);
    this.modalRef.close();
  }
}
