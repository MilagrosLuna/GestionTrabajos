import { Component } from '@angular/core';
import { FirebaseService } from 'src/app/servicesAndUtils/firebase.service';
import { AlertsService } from 'src/app/servicesAndUtils/alerts.service';

@Component({
  selector: 'app-cuentas',
  templateUrl: './cuentas.component.html',
  styleUrls: ['./cuentas.component.scss'],
})
export class CuentasComponent {
  cuentas: any[] = [];
  cuentasfiltrasdas: any[] = [];
  searchTerm: string = '';
  cargandoAprobacion: string | null = null;
  eliminando: string | null = null;

  constructor(
    private firebase: FirebaseService,
    private alerts: AlertsService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.initializeData();
  }

  private async initializeData(): Promise<void> {
    const all = await this.firebase.obtener('usuarios');
    const activos = all.filter((c: any) => !c.data.eliminado);
    // Si hay duplicados por email, preferir el documento cuyo ID == uid (registro nuevo)
    const porEmail = new Map<string, any>();
    for (const c of activos) {
      const email = c.data.email;
      const existing = porEmail.get(email);
      if (!existing || c.id === c.data.uid) {
        porEmail.set(email, c);
      }
    }
    this.cuentas = Array.from(porEmail.values());
    this.cuentasfiltrasdas = [...this.cuentas];
  }

  async cambiarEstadoAprobacion(cuenta: any) {
    if (this.cargandoAprobacion === cuenta.id) return;
    this.cargandoAprobacion = cuenta.id;
    try {
      cuenta.data.aprobado = !cuenta.data.aprobado;
      await this.firebase.modificar(cuenta, 'usuarios');
      await this.initializeData();
    } catch {
      cuenta.data.aprobado = !cuenta.data.aprobado;
    } finally {
      this.cargandoAprobacion = null;
    }
  }

  async eliminarCuenta(cuenta: any) {
    const result = await this.alerts.showConfirmationMessage(
      'El usuario no podrá ingresar al sistema.',
      `¿Dar de baja la cuenta de ${cuenta.data.email}?`
    );
    if (!result.isConfirmed) return;

    this.eliminando = cuenta.id;
    try {
      cuenta.data.eliminado = true;
      cuenta.data.aprobado = false;
      await this.firebase.modificar(cuenta, 'usuarios');
      await this.initializeData();
      this.alerts.showSuccessMessage('', 'Cuenta dada de baja');
    } catch (err: any) {
      cuenta.data.eliminado = false;
      this.alerts.showErrorMessage(err?.message ?? 'Error al dar de baja la cuenta');
    } finally {
      this.eliminando = null;
    }
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
