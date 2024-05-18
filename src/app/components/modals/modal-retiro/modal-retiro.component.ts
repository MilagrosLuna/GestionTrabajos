import { Component, Input } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MdbModalRef } from 'mdb-angular-ui-kit/modal';
import { Movimiento } from 'src/app/clases/movimiento';
import { AlertsService } from 'src/app/servicesAndUtils/alerts.service';
import { ConfirmationService } from 'src/app/servicesAndUtils/confirmation.service';
import { FirebaseService } from 'src/app/servicesAndUtils/firebase.service';
@Component({
  selector: 'app-modal-retiro',
  templateUrl: './modal-retiro.component.html',
  styleUrls: ['./modal-retiro.component.scss'],
})
export class ModalRetiroComponent {
  form!: FormGroup;
  @Input() saldo: any;
  constructor(
    public modalRef: MdbModalRef<ModalRetiroComponent>,
    private confirmationService: ConfirmationService,
    private firebase: FirebaseService,
    private alerts: AlertsService
  ) {}

  async ngOnInit(): Promise<void> {
    this.form = new FormGroup({
      fecha: new FormControl(this.getCurrentDate(), [Validators.required]),
      detalle: new FormControl('', [Validators.required]),
      monto: new FormControl('', [
        Validators.required,
        Validators.pattern(/^\d+(\.\d{1,2})?$/),
        Validators.min(0),
      ]),
    });
  }

  getCurrentDate(): string {
    const today = new Date();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${today.getFullYear()}-${month}-${day}`;
  }

  async retirarDinero(): Promise<void> {
    if (this.form.valid) {
      let movimiento = new Movimiento();
      movimiento.detalle = this.form.value.detalle;
      movimiento.idLaburo = '';
      movimiento.tipo = 'debito';
      movimiento.monto = this.form.value.monto;
      movimiento.fecha = this.form.value.fecha;

      if (movimiento.monto > this.saldo) {
        this.alerts.showErrorMessage(
          'El monto del retiro no puede ser mayor que el saldo actual.'
        );
        return;
      }

      console.log(movimiento);
      if (movimiento.monto > 0) {
        let movimientoObj = JSON.parse(JSON.stringify(movimiento));
        await this.firebase.guardar(movimientoObj, 'movimientos');
      }
      this.confirmationService.setConfirmationState(true);
      this.confirmationService.emitRetiroEvent();
      this.modalRef.close();
    } else {
      this.alerts.showErrorMessage('Debe completar todos los datos');
    }
  }

  cancelar() {
    this.confirmationService.setConfirmationState(false);
    this.modalRef.close();
  }
}
