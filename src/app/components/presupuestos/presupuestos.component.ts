import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { EstadoPresupuesto, Presupuesto } from 'src/app/clases/presupuesto';
import { AlertsService } from 'src/app/servicesAndUtils/alerts.service';
import { AuditoriaService } from 'src/app/servicesAndUtils/auditoria.service';
import { FirebaseService } from 'src/app/servicesAndUtils/firebase.service';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
(pdfMake as any).vfs = pdfFonts.pdfMake.vfs;
import { HttpClient } from '@angular/common/http';

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
      fecha: new FormControl(this.getCurrentDate(), [Validators.required]),
      detalle: new FormControl('', [Validators.required]),
      cliente: new FormControl('', [Validators.required]),
      precio: new FormControl('', [
        Validators.required,
        Validators.pattern(/^\d+(\.\d{1,2})?$/),
        Validators.min(0),
      ]),
    });

    await this.loadPresupuestos();
  }

  async loadPresupuestos(): Promise<void> {
    const result = await this.firebase.obtenerConPaginacion(
      'presupuestos',
      'numero',
      10,
      null
    );
    this.presupuestos = result.data;
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
    this.presupuestos = [...this.presupuestos, ...result.data];
    this.ultimoDoc = result.ultimoDoc;
    this.hayMas = result.data.length === 10;
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
    if (this.form.valid) {
      let presupuesto = new Presupuesto();
      presupuesto.detalle = this.form.value.detalle;
      presupuesto.cliente = this.form.value.cliente;
      presupuesto.fecha = this.form.value.fecha;
      presupuesto.precio = this.form.value.precio;
      presupuesto.estado = 'pendiente';

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
      await this.createPDF(presupuesto);
      this.form.reset({
        fecha: this.getCurrentDate(),
      });
      await this.loadPresupuestos();
    } else {
      this.alerts.showErrorMessage('Debe completar todos los datos');
    }
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

  async createPDF(presupuestoPdf: Presupuesto) {
    let imagen = await this.convertImageToBase64('../assets/a.jpeg');
    let now = new Date();
    let fechaEmision = `${now.getDate()}/${
      now.getMonth() + 1
    }/${now.getFullYear()} a las ${now.getHours()}:${now.getMinutes()} hs`;

    let pdfDefinition: any = {
      header: {
        image: imagen,
        width: 220,
        alignment: 'right',
        margin: [0, 10, 10, 0],
      },
      content: [
        {
          text: `Presupuesto `,
          fontSize: 16,
          margin: [0, 5, 0, 0],
        },
        {
          text: `N°: ${presupuestoPdf.numero} `,
          fontSize: 16,
          margin: [0, 5, 0, 0],
        },
        {
          text: `Cliente: ${presupuestoPdf.cliente}`,
          fontSize: 16,
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
          text: `Detalle:`,
          fontSize: 16,
          margin: [0, 10, 0, 0],
        },
        {
          text: `${presupuestoPdf.detalle}`,
          fontSize: 16,
          margin: [20, 5, 0, 0],
          alignment: 'justify',
        },
        {
          text: `Precio: $${presupuestoPdf.precio}`,
          fontSize: 16,
          bold: true,
          margin: [0, 10, 0, 0],
        },
      ],
      footer: [
        {
          text: `Por consultas comunicarse al: 11 6942-8551 / 15-4084-3420`,
          alignment: 'center',
          fontSize: 18,
        },
      ],
    };

    const pdf = pdfMake.createPdf(pdfDefinition);
    pdf.download(`presupuesto_${presupuestoPdf.numero}`);
  }
}
