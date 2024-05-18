import { Component } from '@angular/core';
import { MdbModalService } from 'mdb-angular-ui-kit/modal';
import { Laburo } from 'src/app/clases/laburo';
import { ConfirmationService } from 'src/app/servicesAndUtils/confirmation.service';
import { FirebaseService } from 'src/app/servicesAndUtils/firebase.service';
import { ModalRetiroComponent } from '../modals/modal-retiro/modal-retiro.component';
import { AlertsService } from 'src/app/servicesAndUtils/alerts.service';

@Component({
  selector: 'app-caja',
  templateUrl: './caja.component.html',
  styleUrls: ['./caja.component.scss'],
})
export class CajaComponent {
  movimientos: any[] = [];
  esAdmin: boolean = false;
  loading: boolean = false;
  saldo: number = 0;

  constructor(
    private firebase: FirebaseService,
    private modalService: MdbModalService,

    private alerts: AlertsService,
    private confirmationService: ConfirmationService
  ) {}

  async ngOnInit(): Promise<void> {
    this.loading = true;
    await this.initializeData();

    await this.subscribeToConfirmationEvents();
    this.loading = false;
  }

  private async initializeData(): Promise<void> {
    await this.loadMovimientos();
    this.calculateSaldo();
  }

  // private async loadMovimientos(): Promise<void> {
  //   this.movimientos = await this.firebase.obtener('movimientos');
  // }

  private async loadMovimientos(): Promise<void> {
    this.movimientos = (await this.firebase.obtener('movimientos')).sort(
      (a, b) => {
        const dateA = new Date(a.data.fecha);
        const dateB = new Date(b.data.fecha);
        return dateB.getTime() - dateA.getTime();
      }
    );
    console.log(this.movimientos);
  }

  private calculateSaldo(): void {
    this.saldo = this.movimientos.reduce((total, movimiento) => {
      return movimiento.data.tipo === 'credito'
        ? total + movimiento.data.monto
        : total - movimiento.data.monto;
    }, 0);
  }

  private async subscribeToConfirmationEvents(): Promise<void> {
    this.confirmationService.getRetiroEvent().subscribe(async () => {
      await this.initializeData();
    });
  }

  retirarDinero() {
    if (this.saldo > 0) {
      let saldo = this.saldo;
      this.confirmationService.setConfirmationState(false);

      const modalRef = this.modalService.open(ModalRetiroComponent, {
        data: { saldo },
      });
    } else {
      this.alerts.showErrorMessage(
        'No hay suficiente saldo en la caja para realizar un retiro.'
      );
    }
  }
}
