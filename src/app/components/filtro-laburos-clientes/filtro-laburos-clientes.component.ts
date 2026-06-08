import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FirebaseService } from 'src/app/servicesAndUtils/firebase.service';
import { ModalComprobanteComponent } from '../modals/modal-comprobante/modal-comprobante.component';
import { MdbModalService } from 'mdb-angular-ui-kit/modal';
import { ConfirmationService } from 'src/app/servicesAndUtils/confirmation.service';
import { ModalComponent } from '../modals/modal/modal.component';
import { ModalDeleteComponent } from '../modals/modal-delete/modal-delete.component';
import { ModalPagoComponent } from '../modals/modal-pago/modal-pago.component';
import { ModalComentarioComponent } from '../modals/modal-comentario/modal-comentario.component';
import { AdminService } from 'src/app/servicesAndUtils/admin.service';

@Component({
  selector: 'app-filtro-laburos-clientes',
  templateUrl: './filtro-laburos-clientes.component.html',
  styleUrls: ['./filtro-laburos-clientes.component.scss'],
})
export class FiltroLaburosClientesComponent implements OnInit {
  id: string | null = null;
  laburos: any[] = [];
  filteredLaburos: any[] = [];
  cuentas: any[] = [];
  loading: boolean = true;
  esAdmin: boolean = false;
  cuentasMap: { [id: string]: string } = {};
  cliente: any = null;

  constructor(
    private route: ActivatedRoute,
    private firebase: FirebaseService,
    private modalService: MdbModalService,
    private confirmationService: ConfirmationService,
    private adminService: AdminService
  ) {}

  async ngOnInit(): Promise<void> {
    this.adminService.getEsAdmin().subscribe((esAdmin) => {
      this.esAdmin = esAdmin;
    });
    await this.subscribeToConfirmationEvents();
    this.route.params.subscribe(async (params) => {
      this.id = params['id'];
      if (this.id != null) {
        try {
          this.laburos = await this.firebase.getWhere(
            'laburos',
            'clienteid',
            this.id
          );
          this.cliente = await this.firebase.obtenerUno('clientes', this.id);
          this.cuentas = await this.firebase.obtener('cuentas');
          this.cuentas.forEach((cuenta) => {
            this.cuentasMap[cuenta.id] = cuenta.data.nombre;
          });
          this.filteredLaburos = this.laburos.map((laburo) =>
            this.transformLaburo(laburo)
          );
        } catch {
          // silently ignore load errors — loading=false still runs in finally
        } finally {
          this.loading = false;
        }
      }
    });
  }

  private transformLaburo(laburo: any): any {
    return {
      ...laburo,
      data: {
        ...laburo.data,
        cuentaNombreSena: this.getCuentaNameById(laburo.data.cuentaSena),
        cuentaNombreFinal: this.getCuentaNameById(laburo.data.cuentaFinal),
      },
    };
  }

  getCuentaNameById(id: string): string {
    return this.cuentasMap[id] || '';
  }

  private async reloadData(): Promise<void> {
    this.loading = true;
    if (this.id != null) {
      try {
        this.laburos = await this.firebase.getWhere(
          'laburos',
          'clienteid',
          this.id
        );
        this.filteredLaburos = this.laburos.map((laburo) =>
          this.transformLaburo(laburo)
        );
      } catch {
        // silently ignore reload errors
      } finally {
        this.loading = false;
      }
    }
  }

  private async subscribeToConfirmationEvents(): Promise<void> {
    this.confirmationService.getConfirmationState().subscribe(async (state) => {
      if (state) {
        await this.reloadData();
      }
    });

    this.confirmationService.getDeleteEvent().subscribe(async () => {
      await this.reloadData();
    });

    this.confirmationService.getAddPagoEvent().subscribe(async () => {
      await this.reloadData();
    });

    this.confirmationService.getAddComentarioEvent().subscribe(async () => {
      await this.reloadData();
    });
  }


  modificar(laburo: any) {
    this.confirmationService.setConfirmationState(false);
    const modalRef = this.modalService.open(ModalComponent, {
      data: { laburo },
    });
  }

  borrar(laburo: any) {
    this.confirmationService.setConfirmationState(false);
    const modalRef = this.modalService.open(ModalDeleteComponent, {
      data: { laburo },
    });
  }

  agregarPago(laburo: any) {
    this.confirmationService.setConfirmationState(false);
    const modalRef = this.modalService.open(ModalPagoComponent, {
      data: { laburo },
    });
  }

  agregarComentario(laburo: any) {
    this.confirmationService.setConfirmationState(false);
    const modalRef = this.modalService.open(ModalComentarioComponent, {
      data: { laburo },
    });
  }

  mostrarComprobante(laburo: any, tipo: number) {
    let pago = true;
    if (tipo == 1) {
      pago = false;
    }
    const modalRef = this.modalService.open(ModalComprobanteComponent, {
      data: { laburo, pago },
    });
  }
}
