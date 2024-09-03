import { Component } from '@angular/core';
import { FirebaseService } from 'src/app/servicesAndUtils/firebase.service';
import { ModalComponent } from '../modals/modal/modal.component';
import { MdbModalService } from 'mdb-angular-ui-kit/modal';
import { ConfirmationService } from 'src/app/servicesAndUtils/confirmation.service';
import { ModalDeleteComponent } from '../modals/modal-delete/modal-delete.component';
import { ModalPagoComponent } from '../modals/modal-pago/modal-pago.component';
import { ModalComentarioComponent } from '../modals/modal-comentario/modal-comentario.component';
import { ModalComprobanteComponent } from '../modals/modal-comprobante/modal-comprobante.component';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { Laburo } from 'src/app/clases/laburo';
(pdfMake as any).vfs = pdfFonts.pdfMake.vfs;

@Component({
  selector: 'app-listado',
  templateUrl: './listado.component.html',
  styleUrls: ['./listado.component.scss'],
})
export class ListadoComponent {
  laburos: any[] = [];
  cuentas: any[] = [];
  filteredLaburos: any[] = [];
  searchTerm: string = '';
  esAdmin: boolean = false;
  loading: boolean = false;
  admins: any[] = [];

  ultimoDoc: any = null;
  laburosPorPagina: number = 25;


  cuentasMap: { [id: string]: string } = {};
  OrderType = {
    Fecha: 'fecha',
    FechaVieja: 'fechavieja',
    FechaEntrega: 'fechaEntrega',
    FechaEntregaVieja: 'fechaEntregavieja',
    Cliente: 'cliente',
    Precio: 'precio',
    PrecioMayor: 'preciomayor',
    Trabajo: 'trabajo',
    Caja: 'Caja',
    Pagados: 'Pagados',
  };

  orderType: string = this.OrderType.Fecha;
  constructor(
    private firebase: FirebaseService,
    private modalService: MdbModalService,
    private confirmationService: ConfirmationService
  ) {}

  async ngOnInit(): Promise<void> {
    this.loading = true;
    await this.verificar();
    await this.initializeData();
    await this.subscribeToConfirmationEvents();
    this.sortLaburos();
    // console.log(this.filteredLaburos);
    this.loading = false;
  }

  private async initializeData(): Promise<void> {
    await this.loadCuentas();
    await this.loadLaburos();
  }

  private async reloasdData(): Promise<void> {
    this.loading = true;
    await this.loadLaburos();
    this.sortLaburos();
    this.loading = false;
  }

  private async loadCuentas(): Promise<void> {
    this.cuentas = await this.firebase.obtener('cuentas');
    this.cuentas.forEach((cuenta) => {
      this.cuentasMap[cuenta.id] = cuenta.data.nombre;
    });
  }

  private async loadLaburos(): Promise<void> {
    // this.laburos = await this.firebase.obtener('laburos');
    // this.filteredLaburos = this.laburos.map((laburo) =>
    //   this.transformLaburo(laburo)
    // );

    const result = await this.firebase.obtenerConPaginacion('laburos', 'fecha', this.laburosPorPagina, this.ultimoDoc);
    this.laburos = [...this.laburos, ...result.data];
    this.filteredLaburos = this.laburos.map((laburo) => this.transformLaburo(laburo));
    this.ultimoDoc = result.ultimoDoc;
    this.sortLaburos();

  }

  async loadMoreLaburos() {
    await this.loadLaburos();
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

  private async subscribeToConfirmationEvents(): Promise<void> {
    this.confirmationService.getConfirmationState().subscribe(async (state) => {
      if (state) {
        await this.reloasdData();
      }
    });

    this.confirmationService.getDeleteEvent().subscribe(async () => {
      await this.reloasdData();
    });

    this.confirmationService.getAddPagoEvent().subscribe(async () => {
      await this.reloasdData();
    });

    this.confirmationService.getAddComentarioEvent().subscribe(async () => {
      await this.reloasdData();
    });
  }

  async verificar() {
    this.admins = await this.firebase.obtener('admins');
    let user = localStorage.getItem('logueado');
    this.esAdmin = this.admins.some((admin) => admin.data.id === user);
  }

  getCuentaNameById(id: string): string {
    return this.cuentasMap[id] || '';
  }

  search() {
    if (this.searchTerm) {
      this.filteredLaburos = this.filteredLaburos.filter((laburo) =>
        Object.values(laburo.data).some(
          (value) =>
            value &&
            value
              .toString()
              .toLowerCase()
              .includes(this.searchTerm.toLowerCase())
        )
      );
    } else {
      this.filteredLaburos = this.laburos.map((laburo) =>
        this.transformLaburo(laburo)
      );
    }
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
    this.confirmationService.setConfirmationState(false);
    let pago = true;
    if (tipo == 1) {
      pago = false;
    }
    const modalRef = this.modalService.open(ModalComprobanteComponent, {
      data: { laburo, pago },
    });
  }

  sortLaburos() {
    const orderFunctions = {
      [this.OrderType.Fecha]: (a: any, b: any) =>
        new Date(b.data.fecha).getTime() - new Date(a.data.fecha).getTime(),
      [this.OrderType.FechaVieja]: (a: any, b: any) =>
        new Date(a.data.fecha).getTime() - new Date(b.data.fecha).getTime(),
      [this.OrderType.FechaEntrega]: (a: any, b: any) =>
        new Date(b.data.fechaEntrega).getTime() -
        new Date(a.data.fechaEntrega).getTime(),
      [this.OrderType.FechaEntregaVieja]: (a: any, b: any) =>
        new Date(a.data.fechaEntrega).getTime() -
        new Date(b.data.fechaEntrega).getTime(),
      [this.OrderType.Cliente]: (a: any, b: any) =>
        a.data.cliente && b.data.cliente
          ? a.data.cliente.localeCompare(b.data.cliente)
          : 0,
      [this.OrderType.Precio]: (a: any, b: any) =>
        a.data.precio - b.data.precio,
      [this.OrderType.PrecioMayor]: (a: any, b: any) =>
        b.data.precio - a.data.precio,
      [this.OrderType.Trabajo]: (a: any, b: any) =>
        a.data.trabajo && b.data.trabajo
          ? a.data.trabajo.localeCompare(b.data.trabajo)
          : 0,
      [this.OrderType.Caja]: (a: any, b: any) =>
        a.data.cajaSena && b.data.cajaSena
          ? a.data.cajaSena.localeCompare(b.data.cajaSena)
          : 0,
    };

    this.filteredLaburos.sort(
      orderFunctions[this.orderType] ||
        ((a: any, b: any) => a.data.cliente.localeCompare(b.data.cliente))
    );
  }

  async createPDF(laburo: any) {
    let laburoCopy = JSON.parse(JSON.stringify(laburo));
    let now = new Date();
    let fechaEmision = `${now.getDate()}/${
      now.getMonth() + 1
    }/${now.getFullYear()} a las ${now.getHours()}:${now.getMinutes()} hs`;
    if (!laburoCopy.data.numero) {
      laburoCopy.data.numero = 0;
    }
    if (!laburoCopy.data.comentario || laburoCopy.data.comentario==='') {
      laburoCopy.data.comentario = '---';
    }
    let pdfDefinition: any = {
      content: [
        {
          text: `Orden de impresión laburo N°: ${laburoCopy.data.numero}`,
          fontSize: 20,
          margin: [0, 5, 0, 0],
        },
        {
          text: `Fecha de emisión: ${fechaEmision}`,
          fontSize: 16,
          margin: [0, 5, 0, 0],
        },
        {
          text: `-------------------------------------------------------------------------------------------------------------------`,
          fontSize: 16,
          margin: [0, 10, 0, 0],
        },
        {
          text: `Cliente: ${laburoCopy.data.cliente} `,
          fontSize: 16,
          margin: [0, 8, 0, 0],
        },
        {
          text: `Trabajo: ${laburoCopy.data.trabajo}, ${laburoCopy.data.detalle} `,
          fontSize: 16,
          margin: [0, 8, 0, 0],
        },
        {
          text: `Fecha: ${laburoCopy.data.fecha}
          Fecha de Entrega: ${laburoCopy.data.fechaEntrega} `,
          fontSize: 16,
          margin: [0, 8, 0, 0],
        },
        {
          text: `Precio: $${laburoCopy.data.precio}
          Seña: $${laburoCopy.data.sena} `,
          fontSize: 16,
          margin: [0, 8, 0, 0],
        },
        {
          text: `Comentarios:  ${laburoCopy.data.comentario} `,
          fontSize: 16,
          margin: [0, 5, 0, 0],
        },
      ],
    };

    const pdf = pdfMake.createPdf(pdfDefinition);
    //pdf.download(`laburo_${laburo.data.numero}`);
    pdf.open();
  }
}
