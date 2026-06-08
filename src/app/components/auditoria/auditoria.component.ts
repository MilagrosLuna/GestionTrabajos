import { Component, OnInit } from '@angular/core';
import { FirebaseService } from 'src/app/servicesAndUtils/firebase.service';
import { AdminService } from 'src/app/servicesAndUtils/admin.service';
import { Router } from '@angular/router';
import { AccionAuditoria, EntidadAuditoria } from 'src/app/servicesAndUtils/auditoria.service';

@Component({
  selector: 'app-auditoria',
  templateUrl: './auditoria.component.html',
  styleUrls: ['./auditoria.component.scss'],
})
export class AuditoriaComponent implements OnInit {
  entradas: any[] = [];
  loading = false;
  ultimoDoc: any = null;
  hayMas = true;
  readonly POR_PAGINA = 20;

  filtroAccion: AccionAuditoria | '' = '';
  filtroEntidad: EntidadAuditoria | '' = '';
  busqueda = '';
  expandedId: string | null = null;

  readonly ACCIONES: { value: AccionAuditoria | ''; label: string }[] = [
    { value: '', label: 'Todas las acciones' },
    { value: 'alta', label: 'Alta' },
    { value: 'edicion', label: 'Edición' },
    { value: 'eliminacion', label: 'Eliminación' },
    { value: 'pago', label: 'Pago' },
    { value: 'seña', label: 'Seña' },
    { value: 'retiro', label: 'Retiro' },
    { value: 'estado_presupuesto', label: 'Estado presupuesto' },
  ];

  readonly ENTIDADES: { value: EntidadAuditoria | ''; label: string }[] = [
    { value: '', label: 'Todas las entidades' },
    { value: 'laburo', label: 'Trabajo' },
    { value: 'presupuesto', label: 'Presupuesto' },
    { value: 'movimiento', label: 'Movimiento' },
  ];

  private readonly FIELD_LABELS: Record<string, string> = {
    precio: 'Precio',
    sena: 'Seña',
    pago: 'Pago (transf.)',
    pagoEfectivo: 'Pago (efectivo)',
    cajaSena: 'Caja seña',
    cajaFinal: 'Caja final',
    cajaFinalEfectivo: 'Caja final (efec.)',
    cuentaSena: 'Cuenta seña',
    cuentaFinal: 'Cuenta final',
    comprobanteSena: 'Comprobante seña',
    comprobantePago: 'Comprobante pago',
    cliente: 'Cliente',
    clienteid: 'ID cliente',
    trabajo: 'Trabajo',
    detalle: 'Detalle',
    comentario: 'Comentario',
    fecha: 'Fecha',
    fechaEntrega: 'Fecha entrega',
    numero: 'N° trabajo',
    monto: 'Monto',
    tipo: 'Tipo',
    estado: 'Estado',
    aprobado: 'Aprobado',
    nombre: 'Nombre',
    email: 'Email',
  };

  constructor(
    private firebase: FirebaseService,
    private adminService: AdminService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    await this.adminService.inicializar();
    if (!this.adminService.getEsAdminSnapshot()) {
      this.router.navigate(['/home/alta']);
      return;
    }
    await this.cargar();
  }

  async cargar(): Promise<void> {
    this.loading = true;
    this.entradas = [];
    this.ultimoDoc = null;
    this.hayMas = true;
    this.expandedId = null;
    await this.cargarMas();
    this.loading = false;
  }

  async cargarMas(): Promise<void> {
    if (!this.hayMas) return;
    const result = await this.firebase.obtenerConPaginacion(
      'auditorias',
      'timestamp',
      this.POR_PAGINA,
      this.ultimoDoc
    );
    this.entradas = [...this.entradas, ...result.data];
    this.ultimoDoc = result.ultimoDoc;
    this.hayMas = result.data.length === this.POR_PAGINA;
  }

  get entradasFiltradas(): any[] {
    return this.entradas.filter((e) => {
      const d = e.data;
      const coincideAccion = !this.filtroAccion || d.accion === this.filtroAccion;
      const coincideEntidad = !this.filtroEntidad || d.entidad === this.filtroEntidad;
      const termino = this.busqueda.toLowerCase();
      const coincideBusqueda =
        !termino ||
        (d.descripcion ?? '').toLowerCase().includes(termino) ||
        (d.nombreUsuario ?? '').toLowerCase().includes(termino) ||
        (d.entidadId ?? '').toLowerCase().includes(termino);
      return coincideAccion && coincideEntidad && coincideBusqueda;
    });
  }

  toggleDetalle(id: string): void {
    this.expandedId = this.expandedId === id ? null : id;
  }

  tieneDetalle(entry: any): boolean {
    return !!entry.data.datoAnterior || !!entry.data.datoNuevo;
  }

  getCampos(obj: any): { label: string; valor: string }[] {
    if (!obj || typeof obj !== 'object') return [];
    return Object.entries(obj)
      .filter(([, v]) => v !== null && v !== undefined && v !== '' && v !== 0 && v !== false)
      .map(([k, v]) => ({
        label: this.FIELD_LABELS[k] ?? k,
        valor: this.formatVal(v),
      }));
  }

  getCambios(anterior: any, nuevo: any): { label: string; antes: string; despues: string }[] {
    const keys = new Set([
      ...Object.keys(anterior ?? {}),
      ...Object.keys(nuevo ?? {}),
    ]);
    const result: { label: string; antes: string; despues: string }[] = [];
    for (const k of keys) {
      const aStr = this.formatVal((anterior ?? {})[k]);
      const nStr = this.formatVal((nuevo ?? {})[k]);
      if (aStr === nStr) continue;
      result.push({ label: this.FIELD_LABELS[k] ?? k, antes: aStr, despues: nStr });
    }
    return result;
  }

  formatVal(v: any): string {
    if (v === null || v === undefined || v === '') return '–';
    if (typeof v === 'boolean') return v ? 'Sí' : 'No';
    if (typeof v === 'number') return v === 0 ? '–' : `$${v.toLocaleString('es-AR')}`;
    const str = String(v);
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
      try { return new Date(str).toLocaleDateString('es-AR'); } catch { return str; }
    }
    return str.length > 70 ? str.slice(0, 70) + '…' : str;
  }

  badgeAccion(accion: string): string {
    const mapa: Record<string, string> = {
      alta: 'badge bg-success',
      edicion: 'badge bg-primary',
      eliminacion: 'badge bg-danger',
      pago: 'badge bg-info text-dark',
      seña: 'badge bg-warning text-dark',
      retiro: 'badge bg-secondary',
      estado_presupuesto: 'badge bg-light text-dark border',
    };
    return mapa[accion] ?? 'badge bg-secondary';
  }

  labelAccion(accion: string): string {
    const mapa: Record<string, string> = {
      alta: 'Alta',
      edicion: 'Edición',
      eliminacion: 'Eliminación',
      pago: 'Pago',
      seña: 'Seña',
      retiro: 'Retiro',
      estado_presupuesto: 'Estado',
    };
    return mapa[accion] ?? accion;
  }

  formatTimestamp(ts: string): string {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
