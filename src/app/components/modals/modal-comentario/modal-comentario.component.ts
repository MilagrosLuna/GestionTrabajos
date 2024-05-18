import { Component, Input } from '@angular/core';
import { MdbModalRef } from 'mdb-angular-ui-kit/modal';
import { AlertsService } from 'src/app/servicesAndUtils/alerts.service';
import { ConfirmationService } from 'src/app/servicesAndUtils/confirmation.service';
import { FirebaseService } from 'src/app/servicesAndUtils/firebase.service';

@Component({
  selector: 'app-modal-comentario',
  templateUrl: './modal-comentario.component.html',
  styleUrls: ['./modal-comentario.component.scss'],
})
export class ModalComentarioComponent {
  @Input() laburo: any;

  laburoCopy: any;
  originalLaburo: any;
  cuentas: any[] = [];
  valorRestante: number = 0;

  constructor(
    public modalRef: MdbModalRef<ModalComentarioComponent>,
    private confirmationService: ConfirmationService,
    private firebase: FirebaseService,
    private alerts: AlertsService
  ) {}

  async ngOnInit(): Promise<void> {
    this.originalLaburo = JSON.parse(JSON.stringify(this.laburo));
    this.laburoCopy = JSON.parse(JSON.stringify(this.laburo));
    this.cuentas = await this.firebase.obtener('cuentas');
  }

 async confirmar() {
    if (this.laburoCopy.data.comentario !== '') {
      this.laburo = { ...this.laburoCopy };
      await this.firebase.modificar(this.laburo, 'laburos');
      this.confirmationService.setConfirmationState(true);
      this.confirmationService.emitAddComentarioEvent();
      this.modalRef.close();
    } else {
      this.alerts.showErrorMessage('Debe completar todos los datos');
    }
  }

  cancelar() {
    this.confirmationService.setConfirmationState(false);
    this.laburoCopy = JSON.parse(JSON.stringify(this.originalLaburo));
    this.modalRef.close();
  }
}
