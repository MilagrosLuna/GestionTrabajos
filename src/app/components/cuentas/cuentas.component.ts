import { Component } from '@angular/core';
import { FirebaseService } from 'src/app/servicesAndUtils/firebase.service';

@Component({
  selector: 'app-cuentas',
  templateUrl: './cuentas.component.html',
  styleUrls: ['./cuentas.component.scss'],
})
export class CuentasComponent {
  cuentas: any[] = [];
  cuentasfiltrasdas: any[] = [];
  searchTerm: string = '';
  constructor(private firebase: FirebaseService) {}

  async ngOnInit(): Promise<void> {
    await this.initializeData();
  }

  private async initializeData(): Promise<void> {
    this.cuentas = await this.firebase.obtener('usuarios');
    this.cuentasfiltrasdas = [...this.cuentas];
    console.log(this.cuentas);
  }

  async cambiarEstadoAprobacion(cuenta: any) {
    cuenta.data.aprobado = !cuenta.data.aprobado;
    await this.firebase.modificar(cuenta, 'usuarios');
    await this.initializeData();
  }
  
  search() {
    if (this.searchTerm) {
      this.cuentasfiltrasdas = this.cuentas.filter((cuenta) =>
        Object.values(cuenta.data).some(
          (value) =>
            (value &&
              value
                .toString()
                .toLowerCase()
                .includes(this.searchTerm.toLowerCase())) ||
            ('aprobado'.includes(this.searchTerm.toLowerCase()) &&
              cuenta.data.aprobado) ||
            ('rechazado'.includes(this.searchTerm.toLowerCase()) &&
              !cuenta.data.aprobado)
        )
      );
    } else {
      this.cuentasfiltrasdas = this.cuentas;
    }
  }
}
