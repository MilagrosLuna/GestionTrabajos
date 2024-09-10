export class Cliente {
  clienteNumero: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;

  gremio: boolean;

  constructor(
    clienteNumero: number,
    nombre: string,
    apellido: string,
    email: string,
    telefono: string,

    gremio: boolean
  ) {
    this.clienteNumero = clienteNumero;
    this.nombre = nombre;
    this.apellido = apellido;
    this.email = email;
    this.telefono = telefono;

    this.gremio = gremio;
  }
}
