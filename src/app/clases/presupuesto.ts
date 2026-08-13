export type EstadoPresupuesto = 'pendiente' | 'aprobado' | 'rechazado' | 'convertido';
export type ModoDetallePresupuesto = 'simple' | 'items';

export interface ItemPresupuesto {
  concepto: string;
  cantidad: number;
  precioUnitario: number;
}

export class Presupuesto {
  fecha: Date = new Date();
  detalle: string = '';
  cliente: string = '';
  clienteid: string = '';
  precio: number = 0;
  numero: number = 0;
  estado: EstadoPresupuesto = 'pendiente';
  modoDetalle: ModoDetallePresupuesto = 'simple';
  items: ItemPresupuesto[] = [];
  comentarios: string = '';
}
