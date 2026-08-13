import { Component } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {
  EstadoPresupuesto,
  ItemPresupuesto,
  ModoDetallePresupuesto,
  Presupuesto,
} from 'src/app/clases/presupuesto';
import { AlertsService } from 'src/app/servicesAndUtils/alerts.service';
import { AuditoriaService } from 'src/app/servicesAndUtils/auditoria.service';
import { FirebaseService } from 'src/app/servicesAndUtils/firebase.service';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
(pdfMake as any).vfs = pdfFonts.pdfMake.vfs;
import { HttpClient } from '@angular/common/http';

function noWhitespaceValidator(control: AbstractControl): ValidationErrors | null {
  const value = (control.value ?? '').toString();
  return value.trim().length ? null : { whitespace: true };
}

const MONTO_VALIDATORS = [
  Validators.required,
  Validators.pattern(/^\d+(\.\d{1,2})?$/),
  Validators.min(0),
];

@Component({
  selector: 'app-presupuestos',
  templateUrl: './presupuestos.component.html',
  styleUrls: ['./presupuestos.component.scss'],
})
export class PresupuestosComponent {
  form!: FormGroup;
  presupuestos: any[] = [];
  ultimoDoc: any = null;
  hayMas: boolean = true;
  cambiandoEstado: string | null = null;

  clientes: any[] = [];
  clientesMap: { [id: string]: any } = {};
  clientesFiltered: any[] = [];
  selectedCliente: any = null;
  selectedClienteInfo: string = '';

  readonly ESTADOS: { value: EstadoPresupuesto; label: string; clase: string }[] = [
    { value: 'pendiente', label: 'Pendiente', clase: 'badge bg-warning text-dark' },
    { value: 'aprobado', label: 'Aprobado', clase: 'badge bg-success' },
    { value: 'rechazado', label: 'Rechazado', clase: 'badge bg-danger' },
    { value: 'convertido', label: 'Convertido a trabajo', clase: 'badge bg-primary' },
  ];

  constructor(
    private firebase: FirebaseService,
    private alerts: AlertsService,
    private http: HttpClient,
    private auditoria: AuditoriaService
  ) {}

  async ngOnInit(): Promise<void> {
    this.form = new FormGroup({
      esClienteAnonimo: new FormControl(false),
      clienteName: new FormControl(''),
      cliente: new FormControl('', [Validators.required]),
      fecha: new FormControl(this.getCurrentDate(), [Validators.required]),
      modoDetalle: new FormControl<ModoDetallePresupuesto>('simple'),
      detalle: new FormControl('', [Validators.required]),
      precio: new FormControl('', MONTO_VALIDATORS),
      items: new FormArray([]),
      comentarios: new FormControl(''),
    });

    this.form.controls['esClienteAnonimo'].valueChanges.subscribe((value) => {
      if (value) {
        this.form.controls['clienteName'].setValidators([
          Validators.required,
          noWhitespaceValidator,
        ]);
        this.form.controls['cliente'].clearValidators();
        this.form.controls['cliente'].setValue('');
        this.selectedCliente = null;
        this.selectedClienteInfo = '';
        this.clientesFiltered = [];
      } else {
        this.form.controls['clienteName'].clearValidators();
        this.form.controls['clienteName'].setValue('');
        this.form.controls['cliente'].setValidators([Validators.required]);
        this.clientesFiltered = [];
      }

      this.form.controls['clienteName'].updateValueAndValidity();
      this.form.controls['cliente'].updateValueAndValidity();
    });

    this.form.controls['modoDetalle'].valueChanges.subscribe((modo: ModoDetallePresupuesto) => {
      const detalleCtrl = this.form.controls['detalle'];
      const precioCtrl = this.form.controls['precio'];

      if (modo === 'items') {
        detalleCtrl.clearValidators();
        detalleCtrl.setValue('');
        precioCtrl.clearValidators();
        precioCtrl.setValue('');
        if (this.itemsArray.length === 0) {
          this.addItem();
        }
      } else {
        detalleCtrl.setValidators([Validators.required]);
        precioCtrl.setValidators(MONTO_VALIDATORS);
        this.itemsArray.clear();
        this.form.controls['comentarios'].setValue('');
      }

      detalleCtrl.updateValueAndValidity();
      precioCtrl.updateValueAndValidity();
    });

    this.clientes = await this.firebase.obtener('clientes');
    this.clientes.forEach((cliente) => {
      this.clientesMap[cliente.id] = cliente.data;
    });

    await this.loadPresupuestos();
  }

  get itemsArray(): FormArray {
    return this.form.controls['items'] as FormArray;
  }

  private crearItemFormGroup(): FormGroup {
    return new FormGroup({
      concepto: new FormControl('', [Validators.required, noWhitespaceValidator]),
      cantidad: new FormControl(1, [
        Validators.required,
        Validators.pattern(/^\d+(\.\d{1,2})?$/),
        Validators.min(0.01),
      ]),
      precioUnitario: new FormControl('', MONTO_VALIDATORS),
    });
  }

  addItem(): void {
    this.itemsArray.push(this.crearItemFormGroup());
  }

  removeItem(index: number): void {
    if (this.itemsArray.length > 1) {
      this.itemsArray.removeAt(index);
    }
  }

  getSubtotal(index: number): number {
    const group = this.itemsArray.at(index);
    const cantidad = Number(group.get('cantidad')?.value) || 0;
    const precioUnitario = Number(group.get('precioUnitario')?.value) || 0;
    return cantidad * precioUnitario;
  }

  getTotalItems(): number {
    return this.itemsArray.controls.reduce((total, group) => {
      const cantidad = Number(group.get('cantidad')?.value) || 0;
      const precioUnitario = Number(group.get('precioUnitario')?.value) || 0;
      return total + cantidad * precioUnitario;
    }, 0);
  }

  async loadPresupuestos(): Promise<void> {
    const result = await this.firebase.obtenerConPaginacion(
      'presupuestos',
      'numero',
      10,
      null
    );
    this.presupuestos = this.attachClienteInfo(result.data);
    this.ultimoDoc = result.ultimoDoc;
    this.hayMas = result.data.length === 10;
  }

  async cargarMas(): Promise<void> {
    if (!this.hayMas) return;
    const result = await this.firebase.obtenerConPaginacion(
      'presupuestos',
      'numero',
      10,
      this.ultimoDoc
    );
    this.presupuestos = [...this.presupuestos, ...this.attachClienteInfo(result.data)];
    this.ultimoDoc = result.ultimoDoc;
    this.hayMas = result.data.length === 10;
  }

  private attachClienteInfo(items: any[]): any[] {
    return items.map((item) => ({
      ...item,
      data: {
        ...item.data,
        clienteInfo: item.data.clienteid
          ? this.clientesMap[item.data.clienteid]
          : undefined,
      },
    }));
  }

  async buscarCliente() {
    const nombre = (this.form.controls['clienteName'].value ?? '')
      .toString()
      .trim()
      .toLowerCase();

    if (nombre) {
      this.clientesFiltered = this.clientes.filter((cliente) => {
        const nombreCliente = (cliente.data.nombre ?? '').toLowerCase().trim();
        return nombreCliente.includes(nombre);
      });

      if (this.clientesFiltered.length === 0) {
        this.alerts.showErrorMessage('No se encontraron resultados.');
      }
    } else {
      this.alerts.showErrorMessage(
        'Ingrese al menos una parte del nombre para buscar.'
      );
    }
  }

  selectCliente(cliente: any) {
    this.form.controls['cliente'].setValue(cliente.id);
    this.selectedCliente = cliente;
    this.selectedClienteInfo = `N° ${cliente.data.clienteNumero} - ${cliente.data.nombre} - ${cliente.data.telefono} - ${cliente.data.email}`;
    this.clientesFiltered = [];
  }

  getCurrentDate(): string {
    const today = new Date();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${today.getFullYear()}-${month}-${day}`;
  }

  getEstadoInfo(estado: EstadoPresupuesto | undefined) {
    return this.ESTADOS.find(e => e.value === (estado ?? 'pendiente')) ?? this.ESTADOS[0];
  }

  async cambiarEstado(p: any, nuevoEstado: EstadoPresupuesto): Promise<void> {
    if (this.cambiandoEstado === p.id) return;
    this.cambiandoEstado = p.id;
    const estadoAnterior = p.data.estado ?? 'pendiente';
    try {
      p.data.estado = nuevoEstado;
      await this.firebase.modificar(p, 'presupuestos');
      await this.auditoria.registrar({
        accion: 'estado_presupuesto',
        entidad: 'presupuesto',
        entidadId: p.id,
        descripcion: `Cambió estado de presupuesto N°${p.data.numero} – ${p.data.cliente}: "${estadoAnterior}" → "${nuevoEstado}"`,
        datoAnterior: { estado: estadoAnterior },
        datoNuevo: { estado: nuevoEstado },
      });
    } catch {
      this.alerts.showErrorMessage('No se pudo actualizar el estado.');
      p.data.estado = estadoAnterior;
    } finally {
      this.cambiandoEstado = null;
    }
  }

  async volverAGenerarPDF(p: any) {
    await this.createPDF(p.data);
  }

  async onSubmit(): Promise<void> {
    this.form.markAllAsTouched();
    this.form.updateValueAndValidity();

    if (!this.form.valid) {
      this.alerts.showErrorMessage('Debe completar todos los datos');
      return;
    }

    const esAnonimo = !!this.form.value.esClienteAnonimo;

    if (!esAnonimo && !this.form.value.cliente) {
      this.alerts.showErrorMessage('Debe seleccionar un cliente.');
      return;
    }

    const modo: ModoDetallePresupuesto = this.form.value.modoDetalle;

    if (modo === 'items' && this.itemsArray.length === 0) {
      this.alerts.showErrorMessage('Agregue al menos un ítem.');
      return;
    }

    let presupuesto = new Presupuesto();
    presupuesto.fecha = this.form.value.fecha;
    presupuesto.estado = 'pendiente';
    presupuesto.modoDetalle = modo;

    if (modo === 'items') {
      presupuesto.items = this.itemsArray.value.map((item: any) => ({
        concepto: (item.concepto ?? '').toString().trim(),
        cantidad: Number(item.cantidad) || 0,
        precioUnitario: Number(item.precioUnitario) || 0,
      }));
      presupuesto.precio = this.getTotalItems();
      presupuesto.detalle = '';
      presupuesto.comentarios = (this.form.value.comentarios ?? '').toString().trim();
    } else {
      presupuesto.detalle = this.form.value.detalle;
      presupuesto.precio = this.form.value.precio;
      presupuesto.items = [];
      presupuesto.comentarios = '';
    }

    if (esAnonimo) {
      presupuesto.cliente = (this.form.value.clienteName ?? '').toString().trim();
      presupuesto.clienteid = '';
    } else {
      presupuesto.clienteid = this.form.value.cliente;
      presupuesto.cliente = this.selectedCliente?.data?.nombre ?? '';
    }

    const contador = await this.firebase.incrementarContador('presupuestos');
    presupuesto.numero = contador;

    let presupuestoObj = JSON.parse(JSON.stringify(presupuesto));
    const docRef = await this.firebase.guardar(presupuestoObj, 'presupuestos');
    await this.auditoria.registrar({
      accion: 'alta',
      entidad: 'presupuesto',
      entidadId: docRef.id,
      descripcion: `Creó presupuesto N°${presupuesto.numero} – ${presupuesto.cliente}`,
      datoNuevo: presupuestoObj,
    });

    await this.createPDF({
      ...presupuestoObj,
      clienteInfo: esAnonimo ? undefined : this.selectedCliente?.data,
    });

    this.itemsArray.clear();
    this.form.reset({
      esClienteAnonimo: false,
      clienteName: '',
      cliente: '',
      fecha: this.getCurrentDate(),
      modoDetalle: 'simple',
      detalle: '',
      precio: '',
      comentarios: '',
    });
    this.selectedCliente = null;
    this.selectedClienteInfo = '';
    this.clientesFiltered = [];
    await this.loadPresupuestos();
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

  formatMoney(amount: number): string {
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

  private buildDetalleSimple(detalle: string): any {
    return {
      table: {
        widths: ['*'],
        body: [
          [
            {
              stack: [
                { text: 'DETALLE', style: 'label' },
                { text: detalle || 'Sin detalle', style: 'detailText', margin: [0, 4, 0, 0] },
              ],
              fillColor: '#F5F0E6',
              margin: [14, 12, 14, 12],
            },
          ],
        ],
      },
      layout: { hLineWidth: () => 0, vLineWidth: () => 0 },
      margin: [0, 0, 0, 18],
    };
  }

  private buildItemsTable(items: ItemPresupuesto[]): any {
    const body = [
      [
        { text: 'CONCEPTO', style: 'tableHeader' },
        { text: 'CANT.', style: 'tableHeader', alignment: 'right' },
        { text: 'P. UNITARIO', style: 'tableHeader', alignment: 'right' },
        { text: 'SUBTOTAL', style: 'tableHeader', alignment: 'right' },
      ],
      ...items.map((item) => [
        { text: item.concepto, style: 'tableCell' },
        { text: `${item.cantidad}`, style: 'tableCell', alignment: 'right' },
        { text: `$${this.formatMoney(item.precioUnitario)}`, style: 'tableCell', alignment: 'right' },
        {
          text: `$${this.formatMoney(item.cantidad * item.precioUnitario)}`,
          style: 'tableCell',
          bold: true,
          alignment: 'right',
        },
      ]),
    ];

    return {
      table: {
        widths: ['*', 'auto', 'auto', 'auto'],
        body,
      },
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

  async createPDF(presupuestoPdf: any) {
    const imagen = await this.convertImageToBase64('../assets/a.jpeg');
    const now = new Date();
    const fechaEmision = `${now.getDate().toString().padStart(2, '0')}/${(
      now.getMonth() + 1
    )
      .toString()
      .padStart(2, '0')}/${now.getFullYear()} a las ${now
      .getHours()
      .toString()
      .padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} hs`;

    const clienteInfo = presupuestoPdf.clienteInfo;
    const clienteNombre = clienteInfo?.nombre || presupuestoPdf.cliente || 'Consumidor final';
    const clienteTelefono = clienteInfo?.telefono || '—';
    const clienteEmail = clienteInfo?.email || '—';
    const clienteNumero = clienteInfo?.clienteNumero
      ? `N° de cliente: ${clienteInfo.clienteNumero}`
      : null;

    const fechaTexto = this.formatDisplayDate(presupuestoPdf.fecha);
    const modo: ModoDetallePresupuesto = presupuestoPdf.modoDetalle ?? 'simple';
    const tieneItems =
      modo === 'items' && Array.isArray(presupuestoPdf.items) && presupuestoPdf.items.length > 0;
    const comentarios = (presupuestoPdf.comentarios ?? '').toString().trim();

    const detalleContent = tieneItems
      ? this.buildItemsTable(presupuestoPdf.items)
      : this.buildDetalleSimple(presupuestoPdf.detalle);

    const pdfDefinition: any = {
      header: {
        image: imagen,
        width: 220,
        alignment: 'right',
        margin: [0, 10, 10, 0],
      },
      content: [
        {
          text: [
            { text: 'Presupuesto  ', style: 'docTitle' },
            { text: `N° ${presupuestoPdf.numero}`, style: 'docNumber' },
          ],
          margin: [0, 6, 0, 0],
        },
        { text: `Emitido el ${fechaEmision}`, style: 'metaText', margin: [0, 4, 0, 0] },
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
                { text: clienteNombre, style: 'value' },
                ...(clienteNumero ? [{ text: clienteNumero, style: 'subValue' }] : []),
              ],
            },
            {
              width: '*',
              stack: [
                { text: 'CONTACTO', style: 'label' },
                { text: clienteTelefono, style: 'value' },
                { text: clienteEmail, style: 'subValue' },
              ],
            },
            {
              width: 'auto',
              stack: [
                { text: 'FECHA', style: 'label', alignment: 'right' },
                { text: fechaTexto, style: 'value', alignment: 'right' },
              ],
            },
          ],
          columnGap: 16,
          margin: [0, 0, 0, 18],
        },
        detalleContent,
        ...(tieneItems && comentarios
          ? [
              { text: 'COMENTARIOS', style: 'label', margin: [0, 0, 0, 3] },
              { text: comentarios, style: 'subValue', margin: [0, 0, 0, 18] },
            ]
          : []),
        {
          stack: [
            { text: 'PRECIO TOTAL', style: 'label' },
            { text: `$${this.formatMoney(presupuestoPdf.precio)}`, style: 'priceValue' },
          ],
          margin: [0, 6, 0, 30],
        },
        {
          text:
            'Este presupuesto es una estimación y no constituye un comprobante fiscal. ' +
            'Los precios pueden variar según modificaciones en la especificación del trabajo.',
          style: 'terms',
        },
      ],
      styles: {
        docTitle: { fontSize: 22, bold: true, color: '#2d2d2d' },
        docNumber: { fontSize: 16, bold: true, color: '#C0392B' },
        metaText: { fontSize: 9, color: '#6b6b6b' },
        label: { fontSize: 8, bold: true, color: '#6b6b6b' },
        value: { fontSize: 12, bold: true, color: '#2d2d2d', margin: [0, 2, 0, 0] },
        subValue: { fontSize: 10, color: '#6b6b6b', margin: [0, 1, 0, 0] },
        detailText: { fontSize: 11, color: '#2d2d2d', lineHeight: 1.3, alignment: 'justify' },
        priceValue: { fontSize: 20, bold: true, color: '#2d2d2d', margin: [0, 2, 0, 0] },
        terms: { fontSize: 8, italics: true, color: '#6b6b6b', alignment: 'center' },
        tableHeader: { fontSize: 8, bold: true, color: '#6b6b6b' },
        tableCell: { fontSize: 10, color: '#2d2d2d' },
      },
      footer: {
        columns: [
          {
            text: 'Por consultas comunicarse al: 11 6942-8551 / 15-4084-3420 · artesgraficasphoenix@gmail.com',
            alignment: 'center',
            fontSize: 9,
            color: '#6b6b6b',
          },
        ],
        margin: [40, 10, 40, 0],
      },
    };

    const pdf = pdfMake.createPdf(pdfDefinition);
    pdf.download(`presupuesto_${presupuestoPdf.numero}`);
  }
}
