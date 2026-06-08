import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../../servicesAndUtils/firebase.service';
import { Laburo } from '../../clases/laburo';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ViewChild } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { AlertsService } from '../../servicesAndUtils/alerts.service';
import { AuditoriaService } from '../../servicesAndUtils/auditoria.service';

@Component({
  selector: 'app-tabla-laburo',
  templateUrl: './tabla-laburo.component.html',
  styleUrls: ['./tabla-laburo.component.scss'],
})
export class TablaLaburoComponent implements OnInit {
  displayedColumns: string[] = [
    'select',
    'numero',
    'estado',
    'faltaPagar',
    'cliente',

    'fecha',
    'trabajo',
    'detalle',
    'precio',
    'sena',
    'cajaSena',
    'cuentaNombreSena',
    'pagoEfectivo',
    'cajaFinalEfectivo',
    'pago',
    'cajaFinal',
    'cuentaNombreFinal',
  ];
  laburos: Laburo[] = [];
  loading = true;
  dataSource = new MatTableDataSource<any>();
  clientesMap: { [id: string]: any } = {};
  selection = new SelectionModel<any>(true, []);
  filtroEstado: 'todos' | 'falta' | 'pagado' = 'todos';
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private firebaseService: FirebaseService,
    private alerts: AlertsService,
    private auditoria: AuditoriaService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  private async loadData(): Promise<void> {
    this.loading = true;
    const clientes = await this.firebaseService.obtener('clientes');
    clientes.forEach((cliente: any) => {
      this.clientesMap[cliente.id] = cliente.data;
    });

    const labus = await this.firebaseService.obtener('laburos');
    const laburos = labus.map((item: any) => ({
      id: item.id,
      ...item.data,
      clienteInfo: this.clientesMap[item.data.clienteid] || {},
    }));

    laburos.sort((a, b) => {
      const totalPagadoA =
        (Number(a.sena) || 0) +
        (Number(a.pago) || 0) +
        (Number(a.pagoEfectivo) || 0);
      const totalPagadoB =
        (Number(b.sena) || 0) +
        (Number(b.pago) || 0) +
        (Number(b.pagoEfectivo) || 0);

      const precioA = Number(a.precio) || 0;
      const precioB = Number(b.precio) || 0;

      const estadoA = totalPagadoA >= precioA ? 'Pagado' : 'Falta';
      const estadoB = totalPagadoB >= precioB ? 'Pagado' : 'Falta';

      if (estadoA !== estadoB) {
        return estadoA === 'Falta' ? -1 : 1;
      }

      const fechaA = a.fecha ? new Date(a.fecha).getTime() : 0;
      const fechaB = b.fecha ? new Date(b.fecha).getTime() : 0;

      return fechaA - fechaB;
    });

    this.dataSource.data = laburos;

    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'cliente':
          return item.cliente || '';
        case 'clienteInfo':
          return (
            (item.clienteInfo?.nombre || '') +
            (item.clienteInfo?.apellido || '')
          );
        case 'fecha':
          return item.fecha ? new Date(item.fecha) : 0;
        case 'fechaEntrega':
          return item.fechaEntrega ? new Date(item.fechaEntrega) : 0;
        case 'precio':
          return Number(item.precio) || 0;
        case 'estado':
          const totalPagado =
            (Number(item.sena) || 0) +
            (Number(item.pago) || 0) +
            (Number(item.pagoEfectivo) || 0);
          const totalPrecio = Number(item.precio) || 0;
          return totalPagado >= totalPrecio ? 'Pagado' : 'Falta';
        default:
          return item[property];
      }
    };

    this.dataSource.filterPredicate = (data: any, filter: string) => {
      if (filter === 'todos') return true;
      const totalPagado = (Number(data.sena) || 0) + (Number(data.pago) || 0) + (Number(data.pagoEfectivo) || 0);
      const esPagado = totalPagado >= (Number(data.precio) || 0);
      return filter === 'pagado' ? esPagado : !esPagado;
    };

    this.dataSource.filter = this.filtroEstado;

    setTimeout(() => {
      this.dataSource.sort = this.sort;
      this.sort.active = 'estado';
      this.sort.direction = 'asc';
      this.sort.sortChange.emit();
    });

    this.loading = false;
  }

  setFiltro(filtro: 'todos' | 'falta' | 'pagado') {
    this.filtroEstado = filtro;
    this.dataSource.filter = filtro;
    this.selection.clear();
  }

  get itemsFiltrados(): any[] {
    return this.dataSource.filteredData;
  }

  private esPagado(item: any): boolean {
    const total = (Number(item.sena) || 0) + (Number(item.pago) || 0) + (Number(item.pagoEfectivo) || 0);
    return total >= (Number(item.precio) || 0);
  }

  get countFalta(): number {
    return this.dataSource.data.filter(i => !this.esPagado(i)).length;
  }

  get countPagado(): number {
    return this.dataSource.data.filter(i => this.esPagado(i)).length;
  }

  async borrarSeleccionados() {
    const seleccionados = this.selection.selected;

    if (seleccionados.length === 0) {
      this.alerts.showErrorMessage('No hay elementos seleccionados para borrar.');
      return;
    }

    const result = await this.alerts.showConfirmationMessage(
      `Se guardarán antes en "limpieza" y luego se eliminarán.`,
      `¿Borrar ${seleccionados.length} elemento${seleccionados.length > 1 ? 's' : ''}?`
    );
    if (!result.isConfirmed) return;

    this.loading = true;

    for (const item of seleccionados) {
      try {
        // clienteInfo is derived data — strip it before saving to Firestore
        const { clienteInfo, ...itemData } = item;
        const cleanData = JSON.parse(JSON.stringify(itemData));
        await this.firebaseService.guardar(cleanData, 'laburosArchivo');
        await this.firebaseService.borrar(item, 'laburos');
        await this.auditoria.registrar({
          accion: 'eliminacion',
          entidad: 'laburo',
          entidadId: item.id,
          descripcion: `Eliminó trabajo N°${item.numero} – ${item.cliente || ''} (limpieza masiva)`,
          datoAnterior: cleanData,
        });
      } catch (error) {
        this.alerts.showErrorMessage('Hubo un error al procesar algunos documentos.');
        this.loading = false;
        return;
      }
    }

    this.selection.clear();
    await this.loadData();
    this.alerts.showSuccessMessage('', 'Elementos eliminados correctamente');
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.itemsFiltrados.length;
    return numSelected === numRows && numRows > 0;
  }

  masterToggle() {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.selection.clear();
      this.itemsFiltrados.forEach((row) => this.selection.select(row));
    }
  }
}
