import { Component, Input, OnInit } from '@angular/core';
import { MdbModalRef } from 'mdb-angular-ui-kit/modal';
import { FirebaseService } from 'src/app/servicesAndUtils/firebase.service';

const LABELS: Record<string, string> = {
  cliente: 'Cliente',
  trabajo: 'Trabajo',
  detalle: 'Detalle',
  precio: 'Precio',
  fecha: 'Fecha',
  fechaEntrega: 'Fecha de Entrega',
  sena: 'Seña',
  cajaSena: 'Caja Seña',
  cuentaSena: 'Cuenta Seña',
  pago: 'Pago Final',
  cajaFinal: 'Caja Final',
  cuentaFinal: 'Cuenta Final',
  pagoEfectivo: 'Pago Efectivo',
  cajaFinalEfectivo: 'Caja Final Efectivo',
  comentario: 'Comentario',
  numero: 'N° Trabajo',
};

export interface CambioField {
  campo: string;
  antes: string;
  despues: string;
}

export interface EntradaHistorial {
  timestamp: string;
  nombreUsuario: string;
  accion: string;
  descripcion: string;
  cambios: CambioField[];
}

@Component({
  selector: 'app-modal-historial',
  templateUrl: './modal-historial.component.html',
  styleUrls: ['./modal-historial.component.scss'],
})
export class ModalHistorialComponent implements OnInit {
  @Input() laburo: any;

  entradas: EntradaHistorial[] = [];
  loading = true;

  constructor(
    public modalRef: MdbModalRef<ModalHistorialComponent>,
    private firebase: FirebaseService
  ) {}

  async ngOnInit(): Promise<void> {
    const docs = await this.firebase.obtenerDondeOrdenado(
      'auditorias',
      'entidadId',
      this.laburo.id,
      'timestamp',
      'asc'
    );

    this.entradas = docs.map((d: any) => ({
      timestamp: d.data.timestamp,
      nombreUsuario: d.data.nombreUsuario || 'desconocido',
      accion: d.data.accion,
      descripcion: d.data.descripcion,
      cambios: this.calcularCambios(d.data.datoAnterior, d.data.datoNuevo),
    }));

    this.loading = false;
  }

  private calcularCambios(antes: any, despues: any): CambioField[] {
    if (!antes || !despues) return [];
    const campos = new Set([...Object.keys(antes), ...Object.keys(despues)]);
    const cambios: CambioField[] = [];

    for (const campo of campos) {
      const v1 = this.stringify(antes[campo]);
      const v2 = this.stringify(despues[campo]);
      if (v1 !== v2 && LABELS[campo]) {
        cambios.push({ campo: LABELS[campo] ?? campo, antes: v1, despues: v2 });
      }
    }
    return cambios;
  }

  private stringify(val: any): string {
    if (val === undefined || val === null) return '—';
    if (typeof val === 'object' && val.seconds !== undefined) {
      return new Date(val.seconds * 1000).toLocaleDateString('es-AR');
    }
    if (val instanceof Date) return val.toLocaleDateString('es-AR');
    return String(val);
  }

  formatFecha(iso: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  badgeClass(accion: string): string {
    const map: Record<string, string> = {
      alta: 'badge-alta',
      edicion: 'badge-edicion',
      eliminacion: 'badge-eliminacion',
      pago: 'badge-pago',
      retiro: 'badge-retiro',
      estado_presupuesto: 'badge-estado',
    };
    return map[accion] ?? 'bg-secondary';
  }

  accionLabel(accion: string): string {
    const map: Record<string, string> = {
      alta: 'Alta',
      edicion: 'Edición',
      eliminacion: 'Eliminación',
      pago: 'Pago',
      retiro: 'Retiro',
      estado_presupuesto: 'Estado',
    };
    return map[accion] ?? accion;
  }

  cerrar() {
    this.modalRef.close();
  }
}
