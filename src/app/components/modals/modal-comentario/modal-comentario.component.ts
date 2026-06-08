import { Component, Input } from '@angular/core';
import { MdbModalRef } from 'mdb-angular-ui-kit/modal';
import { AlertsService } from 'src/app/servicesAndUtils/alerts.service';
import { AuditoriaService } from 'src/app/servicesAndUtils/auditoria.service';
import { ConfirmationService } from 'src/app/servicesAndUtils/confirmation.service';
import { FirebaseService } from 'src/app/servicesAndUtils/firebase.service';

const MAX_COMMENT_LENGTH = 500;

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
    private alerts: AlertsService,
    private auditoria: AuditoriaService
  ) {}

  async ngOnInit(): Promise<void> {
    this.originalLaburo = JSON.parse(JSON.stringify(this.laburo));
    this.laburoCopy = JSON.parse(JSON.stringify(this.laburo));
    this.cuentas = await this.firebase.obtener('cuentas');
  }

  private sanitize(text: string): string {
    // Usar textContent para escapar HTML correctamente en lugar de regex parcial
    const el = document.createElement('div');
    el.textContent = text.trim();
    return el.innerHTML.slice(0, MAX_COMMENT_LENGTH);
  }

  async confirmar() {
    const raw: string = this.laburoCopy.data.comentario ?? '';
    const comentario = this.sanitize(raw);

    if (comentario === '') {
      this.alerts.showErrorMessage('Debe completar todos los datos');
      return;
    }

    this.laburoCopy.data.comentario = comentario;
    this.laburo = { ...this.laburoCopy };
    await this.firebase.modificar(this.laburo, 'laburos');
    await this.auditoria.registrar({
      accion: 'edicion',
      entidad: 'laburo',
      entidadId: this.laburo.id,
      descripcion: `Agregó comentario en trabajo N°${this.laburo.data.numero} – ${this.laburo.data.cliente ?? this.laburo.data.clienteid}`,
      datoAnterior: { comentario: this.originalLaburo.data.comentario ?? '' },
      datoNuevo: { comentario: this.laburo.data.comentario },
    });
    this.confirmationService.setConfirmationState(true);
    this.confirmationService.emitAddComentarioEvent();
    this.modalRef.close();
  }

  cancelar() {
    this.confirmationService.setConfirmationState(false);
    this.laburoCopy = JSON.parse(JSON.stringify(this.originalLaburo));
    this.modalRef.close();
  }
}
