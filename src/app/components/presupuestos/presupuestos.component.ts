import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Presupuesto } from 'src/app/clases/presupuesto';
import { AlertsService } from 'src/app/servicesAndUtils/alerts.service';
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
  constructor(
    private firebase: FirebaseService,
    private alerts: AlertsService,
    private http: HttpClient
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
  }

  getCurrentDate(): string {
    const today = new Date();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${today.getFullYear()}-${month}-${day}`;
  }

  async onSubmit(): Promise<void> {
    if (this.form.valid) {
      let presupuesto = new Presupuesto();
      presupuesto.detalle = this.form.value.detalle;
      presupuesto.cliente = this.form.value.cliente;
      presupuesto.fecha = this.form.value.fecha;
      presupuesto.precio = this.form.value.precio;
      console.log(presupuesto);

      const contadorSnap = await this.firebase.obtenrUno(
        'contadores',
        'presupuestos'
      );
      let contador = contadorSnap?.data['contador'];

      contador++;

      await this.firebase.modificar(
        { id: 'presupuestos', data: { contador: contador } },
        'contadores'
      );

      presupuesto.numero = contador;

      let presupuestoObj = JSON.parse(JSON.stringify(presupuesto));
      await this.firebase.guardar(presupuestoObj, 'presupuestos');
      // console.log(presupuesto);
      await this.createPDF(presupuesto);
      this.form.reset({
        fecha: this.getCurrentDate(),});
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
      // watermark: {
      //   text: 'Clinica online Milagros Luna',
      //   color: 'blue',
      //   opacity: 0.1,
      //   bold: true,
      //   italics: false,
      // },
      // a tuple of four values `[left, top, right, bottom]`
      header: {
        image: imagen,
        width: 220,
        alignment: 'right',
        margin: [0, 10, 10, 0],
      },
      content: [
        // {
        //   image: imagen,
        //   width: 220,
        //   alignment: 'right',
        // },
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
      // a tuple of four values `[left, top, right, bottom]`
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
