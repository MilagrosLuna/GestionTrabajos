import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';

export type AccionAuditoria =
  | 'alta'
  | 'edicion'
  | 'eliminacion'
  | 'pago'
  | 'seña'
  | 'retiro'
  | 'estado_presupuesto';

export type EntidadAuditoria = 'laburo' | 'presupuesto' | 'movimiento';

export interface EntradaAuditoria {
  timestamp: string;
  uid: string;
  nombreUsuario: string;
  accion: AccionAuditoria;
  entidad: EntidadAuditoria;
  entidadId: string;
  descripcion: string;
  datoAnterior?: any;
  datoNuevo?: any;
}

@Injectable({
  providedIn: 'root',
})
export class AuditoriaService {
  constructor(private firebase: FirebaseService) {}

  async registrar(
    entrada: Omit<EntradaAuditoria, 'timestamp' | 'uid' | 'nombreUsuario'>
  ): Promise<void> {
    try {
      const raw = sessionStorage.getItem('user');
      const user = raw ? JSON.parse(raw) : null;

      // Firestore rechaza campos con valor undefined — solo incluimos los que tienen valor
      const registro: Record<string, any> = {
        accion: entrada.accion,
        entidad: entrada.entidad,
        entidadId: entrada.entidadId,
        descripcion: entrada.descripcion,
        timestamp: new Date().toISOString(),
        uid: user?.uid ?? '',
        nombreUsuario: user?.displayName || user?.email || 'desconocido',
      };

      if (entrada.datoAnterior !== undefined && entrada.datoAnterior !== null) {
        registro['datoAnterior'] = JSON.parse(JSON.stringify(entrada.datoAnterior));
      }
      if (entrada.datoNuevo !== undefined && entrada.datoNuevo !== null) {
        registro['datoNuevo'] = JSON.parse(JSON.stringify(entrada.datoNuevo));
      }

      await this.firebase.guardar(registro, 'auditorias');
    } catch (err) {
      console.warn('[Auditoría] No se pudo registrar la entrada:', err);
    }
  }
}
