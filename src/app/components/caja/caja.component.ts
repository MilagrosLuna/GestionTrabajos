import { Component, OnDestroy } from '@angular/core';
import { MdbModalService } from 'mdb-angular-ui-kit/modal';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
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
export class CajaComponent implements OnDestroy {
  private destroy$ = new Subject<void>();
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async initializeData(): Promise<void> {
    await this.loadMovimientos();
    this.calculateSaldo();
  }

  private async loadMovimientos(): Promise<void> {
    this.movimientos = (await this.firebase.obtener('movimientos')).sort(
      (a, b) => {
        const dateA = new Date(a.data.createdAt ?? a.data.fecha);
        const dateB = new Date(b.data.createdAt ?? b.data.fecha);
        return dateB.getTime() - dateA.getTime();
      }
    );
  }

  private calculateSaldo(): void {
    this.saldo = this.movimientos.reduce((total, movimiento) => {
      return movimiento.data.tipo === 'credito'
        ? total + movimiento.data.monto
        : total - movimiento.data.monto;
    }, 0);
  }

  private async subscribeToConfirmationEvents(): Promise<void> {
    this.confirmationService.getRetiroEvent()
      .pipe(takeUntil(this.destroy$))
      .subscribe(async () => {
        await this.initializeData();
      });

    // Un trabajo eliminado, editado o con un pago nuevo puede generar/modificar
    // movimientos en efectivo: sin esto, la Caja quedaba desactualizada hasta
    // que se recargaba la página manualmente.
    this.confirmationService.getDeleteEvent()
      .pipe(takeUntil(this.destroy$))
      .subscribe(async () => {
        await this.initializeData();
      });

    this.confirmationService.getAddPagoEvent()
      .pipe(takeUntil(this.destroy$))
      .subscribe(async () => {
        await this.initializeData();
      });

    this.confirmationService.getConfirmationState()
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (state) => {
        if (state) {
          await this.initializeData();
        }
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
