export type EstadoPresupuesto = 'pendiente' | 'aprobado' | 'rechazado' | 'convertido';

export class Presupuesto {
  fecha: Date = new Date();
  detalle: string = '';
  cliente: string = '';
  precio: number = 0;
  numero: number = 0;
  estado: EstadoPresupuesto = 'pendiente';
}
