import { Component, Input } from '@angular/core';
import { MdbModalRef } from 'mdb-angular-ui-kit/modal';
import { Movimiento } from 'src/app/clases/movimiento';
import { AlertsService } from 'src/app/servicesAndUtils/alerts.service';
import { AuditoriaService } from 'src/app/servicesAndUtils/auditoria.service';
import { ConfirmationService } from 'src/app/servicesAndUtils/confirmation.service';
import { FirebaseService } from 'src/app/servicesAndUtils/firebase.service';
import { StorageService } from 'src/app/servicesAndUtils/storage.service';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
})
export class ModalComponent {
  @Input() laburo: any;
  url: File | null = null;
  urlpago: File | null = null;
  laburoCopy: any;
  originalLaburo: any;
  cuentas: any[] = [];
  selectedCuentaId: string | undefined;

  constructor(
    public modalRef: MdbModalRef<ModalComponent>,
    private confirmationService: ConfirmationService,
    private firebase: FirebaseService,
    private alerts: AlertsService,
    private storageService: StorageService,
    private auditoria: AuditoriaService
  ) {}

  async ngOnInit(): Promise<void> {
    this.originalLaburo = JSON.parse(JSON.stringify(this.laburo));
    this.laburoCopy = JSON.parse(JSON.stringify(this.laburo));
    // fecha/fechaEntrega se guardan como Date -> quedan serializadas como ISO
    // completo (ej. "2026-08-11T03:00:00.000Z"). <input type="date"> solo
    // acepta "yyyy-MM-dd".
    this.laburoCopy.data.fecha = this.toDateInputValue(this.laburoCopy.data.fecha);
    this.laburoCopy.data.fechaEntrega = this.toDateInputValue(this.laburoCopy.data.fechaEntrega);
    this.cuentas = await this.firebase.obtener('cuentas');
    this.selectedCuentaId = this.laburoCopy?.data?.cuenta;
  }

  private toDateInputValue(value: any): string {
    if (!value) return '';
    let d: Date;
    if (value instanceof Date) {
      d = value;
    } else if (typeof value?.toDate === 'function') {
      d = value.toDate(); // Firestore Timestamp
    } else if (typeof value?.seconds === 'number') {
      d = new Date(value.seconds * 1000); // Timestamp serializado {seconds, nanoseconds}
    } else {
      d = new Date(value); // string (ISO o yyyy-MM-dd)
    }
    if (isNaN(d.getTime())) return '';
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  }

  private toLocalDate(dateValue: string): Date {
    const [year, month, day] = dateValue.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  async confirmar() {
    if (this.laburoCopy.data.cajaSena === 'transferencia') {
      if (!this.laburoCopy.data.cuentaSena) {
        this.alerts.showErrorMessage('Complete los datos, cuenta seña');
        return;
      }
      if (!this.url && !this.laburoCopy.data.comprobanteSena) {
        this.alerts.showErrorMessage('Complete los datos, comprobante seña');
        return;
      }
      if (this.url !== null) {
        let fotoUrl = await this.storageService.guardarFoto(
          this.url,
          'comprobantes'
        );
        this.laburoCopy.data.comprobanteSena = fotoUrl;
      } else if (this.laburoCopy.data.comprobanteSena) {
        // Si this.url es null pero ya existe un comprobanteSena, no lo sobrescribas
        this.laburoCopy.data.comprobanteSena =
          this.originalLaburo.data.comprobanteSena;
      }
    } else {
      this.laburoCopy.data.comprobanteSena = '';
    }

    if (this.laburoCopy.data.cajaFinal === 'transferencia') {
      if (!this.laburoCopy.data.cuentaFinal) {
        this.alerts.showErrorMessage('Complete los datos, cuenta pago');
        return;
      }
      if (!this.urlpago && !this.laburoCopy.data.comprobantePago) {
        this.alerts.showErrorMessage('Complete los datos, comprobante pago');
        return;
      }

      if (this.urlpago !== null) {
        let fotoUrl = await this.storageService.guardarFoto(
          this.urlpago,
          'comprobantes'
        );
        this.laburoCopy.data.comprobantePago = fotoUrl;
      } else if (this.laburoCopy.data.comprobantePago) {
        // Si this.urlpago es null pero ya existe un comprobantePago, no lo sobrescribas
        this.laburoCopy.data.comprobantePago =
          this.originalLaburo.data.comprobantePago;
      }
    } else {
      this.laburoCopy.data.comprobantePago = '';
    }

    if (this.laburoCopy.data.cajaFinalEfectivo === 'efectivo') {
      await this.checkValueMovimiento('pagoEfectivo');
    }
    if (this.laburoCopy.data.cajaSena === 'efectivo') {
      await this.checkValueMovimiento('sena');
    }

    const datoAnterior = this.originalLaburo.data;
    this.laburoCopy.data.fecha = this.toLocalDate(this.laburoCopy.data.fecha);
    this.laburoCopy.data.fechaEntrega = this.toLocalDate(this.laburoCopy.data.fechaEntrega);
    this.laburo = { ...this.laburoCopy };

    await this.firebase.modificar(this.laburo, 'laburos');

    await this.auditoria.registrar({
      accion: 'edicion',
      entidad: 'laburo',
      entidadId: this.laburo.id,
      descripcion: `Editó trabajo N°${this.laburo.data.numero} – ${this.laburo.data.cliente ?? this.laburo.data.clienteid}`,
      datoAnterior,
      datoNuevo: this.laburo.data,
    });

    this.confirmationService.setConfirmationState(true);
    this.modalRef.close();
  }

  async checkValueMovimiento(field: string) {
    let originalValue = this.originalLaburo.data[field];
    let newValue = this.laburoCopy.data[field];

    const ahora = new Date();
    if (newValue !== originalValue) {
      let diferencia = newValue - originalValue;
      let tipo = diferencia > 0 ? 'credito' : 'debito';

      let movimiento = new Movimiento();
      if (field == 'sena') {
        movimiento.detalle = `Modificación de una seña: ${originalValue} a ${newValue}, Laburo correspondiente: 
        ${this.laburoCopy.data.cliente}, trabajo: ${this.laburoCopy.data.trabajo}, detalle: ${this.laburoCopy.data.detalle}        
        `;
      } else {
        movimiento.detalle = `Modificación de un pago: ${originalValue} a ${newValue}, Laburo correspondiente: 
        ${this.laburoCopy.data.cliente}, trabajo: ${this.laburoCopy.data.trabajo}, detalle: ${this.laburoCopy.data.detalle}        
        `;
      }
      movimiento.idLaburo = this.laburoCopy.id;
      movimiento.tipo = tipo;
      movimiento.monto = Math.abs(diferencia);
      movimiento.fecha = new Date();
      movimiento.createdAt = ahora.toISOString();

      if (movimiento.monto > 0) {
        let movimientoObj = JSON.parse(JSON.stringify(movimiento));
        await this.firebase.guardar(movimientoObj, 'movimientos');
      }
    }
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

  onSelectFile(event: any, comprobante: string) {
    if (event.target.files && event.target.files[0]) {
      if (comprobante === 'seña') {
        this.url = event.target.files[0];
      } else {
        this.urlpago = event.target.files[0];
      }
    }
  }
}
