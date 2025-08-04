import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../../servicesAndUtils/firebase.service';
import { Laburo } from '../../clases/laburo';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ViewChild } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';

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
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private firebaseService: FirebaseService) {}
  async ngOnInit(): Promise<void> {
    const clientes = await this.firebaseService.obtener('clientes');
    clientes.forEach((cliente: any) => {
      this.clientesMap[cliente.id] = cliente.data;
    });

    this.firebaseService.obtener('laburos').then((labus) => {
      const laburos = labus.map((item: any) => ({
        id: item.id,
        ...item.data,
        clienteInfo: this.clientesMap[item.data.clienteid] || {},
      }));

      // ORDENAR MANUALMENTE POR ESTADO Y FECHA (los más viejos primero)
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
          return estadoA === 'Falta' ? -1 : 1; // 'Falta' va primero
        }

        const fechaA = a.fecha ? new Date(a.fecha).getTime() : 0;
        const fechaB = b.fecha ? new Date(b.fecha).getTime() : 0;

        return fechaA - fechaB; // Más viejos primero
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

      setTimeout(() => {
        this.dataSource.sort = this.sort;
        this.sort.active = 'estado';
        this.sort.direction = 'asc';
        this.sort.sortChange.emit();
      });

      this.loading = false;
      console.log('Laburo data loaded:', this.dataSource.data);
    });
  }

  async borrarSeleccionados() {
    const seleccionados = this.selection.selected;

    if (seleccionados.length === 0) {
      alert('No hay elementos seleccionados para borrar.');
      return;
    }

    const confirmacion = confirm(
      `¿Querés borrar ${seleccionados.length} elementos? Se guardarán antes en "limpieza".`
    );
    if (!confirmacion) return;

    this.loading = true;

    for (const item of seleccionados) {
      try {
        // Guardar copia en colección "limpieza"
        await this.firebaseService.guardar(item, 'limpieza');

        // Borrar documento original en "laburos"
        await this.firebaseService.borrar(item, 'laburos');
      } catch (error) {
        console.error('Error al guardar o borrar:', error);
        alert('Hubo un error al procesar algunos documentos.');
        this.loading = false;
        return;
      }
    }

    this.loading = false;

    await this.ngOnInit();

    this.selection.clear();
    alert('Elementos guardados en "limpieza" y borrados correctamente.');
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.dataSource.data.forEach((row) => this.selection.select(row));
    }
  }
}
