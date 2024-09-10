export class Laburo {
  clienteid: string = '';
  cliente: string = '';
  fecha: Date = new Date();
  fechaEntrega: Date = new Date();
  trabajo: string = '';
  detalle: string = '';
  comentario: string = '';
  numero: number = 0;

  precio: number = 0;

  sena: number = 0;
  pago: number = 0;
  pagoEfectivo: number = 0;

  cajaSena: string = '';
  cajaFinal: string = '';
  cajaFinalEfectivo: string = '';

  cuentaFinal: string = '';
  cuentaSena: string = '';

  comprobanteSena: string = '';
  comprobantePago: string = '';
  guardar(laburo: Laburo) {}
}
