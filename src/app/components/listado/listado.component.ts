import { Component, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FirebaseService } from 'src/app/servicesAndUtils/firebase.service';
import { AdminService } from 'src/app/servicesAndUtils/admin.service';
import { ModalComponent } from '../modals/modal/modal.component';
import { MdbModalService } from 'mdb-angular-ui-kit/modal';
import { ConfirmationService } from 'src/app/servicesAndUtils/confirmation.service';
import { ModalDeleteComponent } from '../modals/modal-delete/modal-delete.component';
import { ModalPagoComponent } from '../modals/modal-pago/modal-pago.component';
import { ModalComentarioComponent } from '../modals/modal-comentario/modal-comentario.component';
import { ModalComprobanteComponent } from '../modals/modal-comprobante/modal-comprobante.component';
import { ModalHistorialComponent } from '../modals/modal-historial/modal-historial.component';
import { HttpClient } from '@angular/common/http';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { Laburo } from 'src/app/clases/laburo';
(pdfMake as any).vfs = pdfFonts.pdfMake.vfs;

@Component({
  selector: 'app-listado',
  templateUrl: './listado.component.html',
  styleUrls: ['./listado.component.scss'],
})
export class ListadoComponent implements OnDestroy {
  private destroy$ = new Subject<void>();
  laburos: any[] = [];
  private laburosMap = new Map<string, any>();
  cuentas: any[] = [];
  filteredLaburos: any[] = [];
  searchTerm: string = '';
  esAdmin: boolean = false;
  loading: boolean = false;
  ultimoDoc: any = null;
  laburosPorPagina: number = 25;
  clientesMap: { [id: string]: any } = {};
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
  filtroEstado: 'todos' | 'pendiente' | 'con-sena' | 'pagado' = 'todos';
  constructor(
    private firebase: FirebaseService,
    private adminService: AdminService,
    private modalService: MdbModalService,
    private confirmationService: ConfirmationService,
    private http: HttpClient
  ) {}

  async ngOnInit(): Promise<void> {
    this.loading = true;
    await this.adminService.inicializar();
    this.esAdmin = this.adminService.getEsAdminSnapshot();
    await this.initializeData();
    await this.subscribeToConfirmationEvents();
    this.sortLaburos();
    this.loading = false;
  }

  private async initializeData(): Promise<void> {
    await this.loadCuentas();
    await this.loadClientes();
    await this.loadLaburos();
  }

  private async reloadData(): Promise<void> {
    this.loading = true;
    this.laburos = [];
    this.laburosMap.clear();
    this.filteredLaburos = [];
    this.ultimoDoc = null;
    await this.loadLaburos();
    this.sortLaburos();
    this.loading = false;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async loadCuentas(): Promise<void> {
    this.cuentas = await this.firebase.obtener('cuentas');
    this.cuentas.forEach((cuenta) => {
      this.cuentasMap[cuenta.id] = cuenta.data.nombre;
    });
  }

  private async loadClientes(): Promise<void> {
    const clientes = await this.firebase.obtener('clientes');
    clientes.forEach((cliente: any) => {
      this.clientesMap[cliente.id] = cliente.data;
    });
  }

  private async loadLaburos(): Promise<void> {
    const result = await this.firebase.obtenerConPaginacion(
      'laburos',
      'fecha',
      this.laburosPorPagina,
      this.ultimoDoc
    );

    // Map garantiza unicidad y toma siempre la versión más reciente del documento
    result.data.forEach((laburo: any) => {
      this.laburosMap.set(laburo.id, laburo);
    });
    this.laburos = Array.from(this.laburosMap.values());

    this.filteredLaburos = this.laburos.map((laburo) =>
      this.transformLaburo(laburo)
    );
    this.ultimoDoc = result.ultimoDoc;
    this.search();
    this.sortLaburos();
  }

  async loadMoreLaburos() {
    await this.loadLaburos();
  }

  private transformLaburo(laburo: any): any {
    const clienteData = this.clientesMap[laburo.data.clienteid] || {};
    return {
      ...laburo,
      data: {
        ...laburo.data,
        cuentaNombreSena: this.getCuentaNameById(laburo.data.cuentaSena),
        cuentaNombreFinal: this.getCuentaNameById(laburo.data.cuentaFinal),
        clienteInfo: clienteData,
      },
    };
  }

  private async subscribeToConfirmationEvents(): Promise<void> {
    this.confirmationService.getConfirmationState()
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (state) => {
        if (state) {
          await this.reloadData();
        }
      });

    this.confirmationService.getDeleteEvent()
      .pipe(takeUntil(this.destroy$))
      .subscribe(async () => {
        await this.reloadData();
      });

    this.confirmationService.getAddPagoEvent()
      .pipe(takeUntil(this.destroy$))
      .subscribe(async () => {
        await this.reloadData();
      });

    this.confirmationService.getAddComentarioEvent()
      .pipe(takeUntil(this.destroy$))
      .subscribe(async () => {
        await this.reloadData();
      });
  }

  verHistorial(laburo: any) {
    this.modalService.open(ModalHistorialComponent, { data: { laburo } });
  }

  getCuentaNameById(id: string): string {
    return this.cuentasMap[id] || '';
  }

  getClienteSearchText(clienteInfo: any): string {
    if (!clienteInfo) return '';

    return [
      clienteInfo.nombre,
      clienteInfo.email,
      clienteInfo.telefono,
      clienteInfo.clienteNumero,
      clienteInfo.gremio,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  }

  private formatMoney(amount: number): string {
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number(amount) || 0);
  }

  private formatDisplayDate(dateValue: unknown): string {
    if (!dateValue) {
      return 'No informada';
    }

    if (typeof dateValue === 'string') {
      const match = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})/);

      if (match) {
        const [, year, month, day] = match;
        return `${day}/${month}/${year}`;
      }
    }

    const rawDate = dateValue as
      | Date
      | { toDate?: () => Date; seconds?: number }
      | string
      | number;

    let parsedDate: Date;

    if (rawDate instanceof Date) {
      parsedDate = rawDate;
    } else if (typeof rawDate === 'object' && typeof rawDate?.toDate === 'function') {
      parsedDate = rawDate.toDate();
    } else if (typeof rawDate === 'object' && typeof rawDate?.seconds === 'number') {
      parsedDate = new Date(rawDate.seconds * 1000);
    } else if (typeof rawDate === 'string' || typeof rawDate === 'number') {
      parsedDate = new Date(rawDate);
    } else {
      return String(dateValue);
    }

    if (Number.isNaN(parsedDate.getTime())) {
      return String(dateValue);
    }

    const [year, month, day] = parsedDate.toISOString().slice(0, 10).split('-');
    return `${day}/${month}/${year}`;
  }

  private getMetodoPagoLabel(caja: string): string {
    if (caja === 'efectivo') {
      return 'Efectivo';
    }

    if (caja === 'transferencia') {
      return 'Transferencia';
    }

    return 'No informado';
  }

  private getCuentaDetalle(cuentaId?: string, cuentaNombre?: string): string {
    return (
      cuentaNombre ||
      (cuentaId ? this.getCuentaNameById(cuentaId) : '') ||
      cuentaId ||
      'No informada'
    );
  }

  private buildPagosFilas(
    data: any
  ): { concepto: string; monto: number; metodo: string; cuenta: string }[] {
    const filas: { concepto: string; monto: number; metodo: string; cuenta: string }[] = [];

    const agregar = (
      concepto: string,
      monto: number,
      caja: string,
      cuentaId?: string,
      cuentaNombre?: string
    ) => {
      if (!monto) return;
      filas.push({
        concepto,
        monto,
        metodo: this.getMetodoPagoLabel(caja),
        cuenta: caja === 'transferencia' ? this.getCuentaDetalle(cuentaId, cuentaNombre) : '—',
      });
    };

    agregar('Seña', data.sena || 0, data.cajaSena, data.cuentaSena, data.cuentaNombreSena);
    agregar(
      'Pago final',
      data.pago || 0,
      data.cajaFinal || 'transferencia',
      data.cuentaFinal,
      data.cuentaNombreFinal
    );
    agregar('Pago final', data.pagoEfectivo || 0, data.cajaFinalEfectivo || 'efectivo');

    return filas;
  }

  private buildPagosTable(
    filas: { concepto: string; monto: number; metodo: string; cuenta: string }[]
  ): any {
    const body = [
      [
        { text: 'CONCEPTO', style: 'tableHeader' },
        { text: 'MÉTODO', style: 'tableHeader' },
        { text: 'CUENTA', style: 'tableHeader' },
        { text: 'MONTO', style: 'tableHeader', alignment: 'right' },
      ],
      ...filas.map((f) => [
        { text: f.concepto, style: 'tableCell' },
        { text: f.metodo, style: 'tableCell' },
        { text: f.cuenta, style: 'tableCell' },
        { text: `$${this.formatMoney(f.monto)}`, style: 'tableCell', bold: true, alignment: 'right' },
      ]),
    ];

    return {
      table: { widths: ['*', 'auto', 'auto', 'auto'], body },
      layout: {
        hLineWidth: (i: number, node: any) =>
          i === 0 || i === 1 || i === node.table.body.length ? 1 : 0.5,
        vLineWidth: () => 0,
        hLineColor: () => '#E6E1D3',
        paddingLeft: (i: number) => (i === 0 ? 0 : 8),
        paddingRight: () => 0,
        paddingTop: () => 5,
        paddingBottom: () => 5,
      },
      margin: [0, 0, 0, 18],
    };
  }

  convertImageToBase64(imagen: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.http.get(imagen, { responseType: 'blob' }).subscribe((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result;
          resolve(base64data as string);
        };
        reader.onerror = () => {
          reject('Error al leer la imagen');
        };
        reader.readAsDataURL(blob);
      }, reject);
    });
  }

  search() {
    let result = this.laburos.map((laburo) => this.transformLaburo(laburo));

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter((laburo) => {
        const dataValues = Object.values(laburo.data || {})
          .filter(Boolean)
          .map((v: any) => v.toString().toLowerCase())
          .join(' ');
        const clienteValues = this.getClienteSearchText(laburo.data?.clienteInfo);
        return dataValues.includes(term) || clienteValues.includes(term);
      });
    }

    if (this.filtroEstado !== 'todos') {
      result = result.filter((l) => this.getEstadoPago(l) === this.filtroEstado);
    }

    this.filteredLaburos = result;
    this.sortLaburos();
  }

  filtrar(estado: 'todos' | 'pendiente' | 'con-sena' | 'pagado') {
    this.filtroEstado = estado;
    this.search();
  }

  getEstadoPago(laburo: any): 'pendiente' | 'con-sena' | 'pagado' {
    const d = laburo.data;
    if (d.pago > 0 || d.pagoEfectivo > 0) return 'pagado';
    if (d.sena > 0) return 'con-sena';
    return 'pendiente';
  }

  countEstado(estado: string): number {
    if (estado === 'todos') return this.laburos.length;
    return this.laburos.filter((l) => this.getEstadoPago(l) === estado).length;
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
    const imagen = await this.convertImageToBase64('../assets/a.jpeg');
    let laburoCopy = JSON.parse(JSON.stringify(laburo));
    let now = new Date();
    let fechaEmision = `${now.getDate().toString().padStart(2, '0')}/${(
      now.getMonth() + 1
    )
      .toString()
      .padStart(2, '0')}/${now.getFullYear()} a las ${now
      .getHours()
      .toString()
      .padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')} hs`;

    if (!laburoCopy.data.numero) {
      laburoCopy.data.numero = 0;
    }

    if (laburoCopy.data.clienteid && laburoCopy.data.clienteInfo?.nombre) {
      laburoCopy.data.cliente = laburoCopy.data.clienteInfo.nombre;
    }

    const clienteInfo = laburoCopy.data.clienteInfo;
    const clienteContacto = [clienteInfo?.telefono, clienteInfo?.email]
      .filter(Boolean)
      .join('  \u00b7  ');

    const precioTotal = laburoCopy.data.precio || 0;
    const senia = laburoCopy.data.sena || 0;
    const pagoTransferencia = laburoCopy.data.pago || 0;
    const pagoEfectivo = laburoCopy.data.pagoEfectivo || 0;
    const totalAbonado = senia + pagoTransferencia + pagoEfectivo;
    const saldoPendiente = Math.max(precioTotal - totalAbonado, 0);
    const pagado = saldoPendiente <= 0;

    const filasPago = this.buildPagosFilas(laburoCopy.data);
    const fechaLaburoTexto = this.formatDisplayDate(laburoCopy.data.fecha);
    const fechaEntregaTexto = this.formatDisplayDate(
      laburoCopy.data.fechaEntrega
    );
    const comentario = (laburoCopy.data.comentario ?? '').toString().trim();

    const buildCopyFlag = (etiqueta: string): any => ({
      columns: [
        {
          width: 'auto',
          table: {
            body: [
              [
                {
                  text: etiqueta,
                  color: '#fff',
                  fillColor: '#C0392B',
                  bold: true,
                  fontSize: 8,
                  margin: [8, 3, 8, 3],
                },
              ],
            ],
          },
          layout: { hLineWidth: () => 0, vLineWidth: () => 0 },
        },
      ],
      margin: [0, 4, 0, 8],
    });

    const generarContenido = (etiquetaCopia: string) => [
      buildCopyFlag(etiquetaCopia),
      {
        text: [
          { text: 'Orden de impresi\u00f3n  ', style: 'docTitle' },
          { text: `N\u00b0 ${laburoCopy.data.numero}`, style: 'docNumber' },
        ],
      },
      { text: `Emitida el ${fechaEmision}`, style: 'metaText', margin: [0, 4, 0, 0] },
      {
        canvas: [
          { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.4, lineColor: '#C0392B' },
        ],
        margin: [0, 12, 0, 16],
      },
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: 'CLIENTE', style: 'label' },
              { text: laburoCopy.data.cliente || 'Consumidor final', style: 'value' },
              ...(clienteContacto ? [{ text: clienteContacto, style: 'subValue' }] : []),
            ],
          },
          {
            width: 'auto',
            stack: [
              { text: 'FECHA', style: 'label', alignment: 'right' },
              { text: fechaLaburoTexto, style: 'value', alignment: 'right' },
            ],
          },
          {
            width: 'auto',
            stack: [
              { text: 'ENTREGA', style: 'label', alignment: 'right' },
              { text: fechaEntregaTexto, style: 'value', alignment: 'right' },
            ],
          },
        ],
        columnGap: 16,
        margin: [0, 0, 0, 18],
      },
      {
        table: {
          widths: ['*'],
          body: [
            [
              {
                stack: [
                  { text: 'TRABAJO', style: 'label' },
                  {
                    text: laburoCopy.data.trabajo || 'Sin especificar',
                    style: 'jobTitle',
                    margin: [0, 3, 0, 0],
                  },
                  ...(laburoCopy.data.detalle
                    ? [{ text: laburoCopy.data.detalle, style: 'detailText', margin: [0, 3, 0, 0] }]
                    : []),
                ],
                fillColor: '#F5F0E6',
                margin: [14, 12, 14, 12],
              },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0,
          vLineWidth: (i: number) => (i === 0 ? 3 : 0),
          vLineColor: () => '#C9A84C',
        },
        margin: [0, 0, 0, 18],
      },
      ...(filasPago.length
        ? [
            { text: 'DETALLE DE PAGOS', style: 'label', margin: [0, 0, 0, 6] },
            this.buildPagosTable(filasPago),
          ]
        : []),
      ...(comentario
        ? [
            { text: 'COMENTARIOS', style: 'label', margin: [0, 0, 0, 3] },
            { text: comentario, style: 'subValue', margin: [0, 0, 0, 12] },
          ]
        : []),
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: 'PRECIO TOTAL', style: 'label' },
              { text: `$${this.formatMoney(precioTotal)}`, style: 'priceValue' },
              {
                text: `Total abonado: $${this.formatMoney(totalAbonado)}`,
                style: 'subValue',
                margin: [0, 2, 0, 0],
              },
            ],
          },
          {
            width: 'auto',
            table: {
              body: [
                [
                  {
                    text: pagado
                      ? 'PAGADO EN SU TOTALIDAD'
                      : `SALDO PENDIENTE: $${this.formatMoney(saldoPendiente)}`,
                    color: pagado ? '#1E7E44' : '#fff',
                    fillColor: pagado ? '#E1F0E5' : '#C0392B',
                    bold: true,
                    fontSize: 10,
                    margin: [10, 8, 10, 8],
                  },
                ],
              ],
            },
            layout: { hLineWidth: () => 0, vLineWidth: () => 0 },
          },
        ],
        margin: [0, 6, 0, 30],
      },
      {
        text: [
          'Las se\u00f1as no se reembolsar\u00e1n en caso de desistimiento del pedido si el trabajo ya est\u00e1 en proceso de impresi\u00f3n o armado.\n',
          'Las fechas de entrega son estimadas y pueden variar seg\u00fan la carga de trabajo u otros factores externos.',
        ],
        style: 'terms',
      },
    ];

    const pdfDefinition: any = {
      header: {
        image: imagen,
        width: 220,
        alignment: 'right',
        margin: [0, 10, 10, 0],
      },
      content: [
        ...generarContenido('CLIENTE'),
        { text: '', pageBreak: 'after' },
        ...generarContenido('TALLER'),
        { text: '', pageBreak: 'after' },
        ...generarContenido('ARCHIVO'),
      ],
      styles: {
        docTitle: { fontSize: 22, bold: true, color: '#2d2d2d' },
        docNumber: { fontSize: 16, bold: true, color: '#C0392B' },
        metaText: { fontSize: 9, color: '#6b6b6b' },
        label: { fontSize: 8, bold: true, color: '#6b6b6b' },
        value: { fontSize: 12, bold: true, color: '#2d2d2d', margin: [0, 2, 0, 0] },
        subValue: { fontSize: 10, color: '#6b6b6b', margin: [0, 1, 0, 0] },
        jobTitle: { fontSize: 13, bold: true, color: '#2d2d2d' },
        detailText: { fontSize: 11, color: '#2d2d2d', lineHeight: 1.3, alignment: 'justify' },
        priceValue: { fontSize: 20, bold: true, color: '#2d2d2d', margin: [0, 2, 0, 0] },
        terms: { fontSize: 8, italics: true, color: '#6b6b6b', alignment: 'center', margin: [0, 10, 0, 0] },
        tableHeader: { fontSize: 8, bold: true, color: '#6b6b6b' },
        tableCell: { fontSize: 10, color: '#2d2d2d' },
      },
      footer: {
        columns: [
          {
            text: 'Por consultas comunicarse al: 11 6942-8551 / 15-4084-3420 \u00b7 artesgraficasphoenix@gmail.com',
            alignment: 'center',
            fontSize: 9,
            color: '#6b6b6b',
          },
        ],
        margin: [40, 10, 40, 0],
      },
    };

    const pdf = pdfMake.createPdf(pdfDefinition);
    pdf.open();
  }
}
