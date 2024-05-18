import { Component, NgZone } from '@angular/core';
import { EChartsOption } from 'echarts';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import * as echarts from 'echarts';
import { FirebaseService } from 'src/app/servicesAndUtils/firebase.service';
(pdfMake as any).vfs = pdfFonts.pdfMake.vfs;

@Component({
  selector: 'app-graficos',
  templateUrl: './graficos.component.html',
  styleUrls: ['./graficos.component.scss'],
})
export class GraficosComponent {
  chartOption1: EChartsOption = {};
  fechaInicio: string;
  fechaFin: string;
  loading: boolean = false;
  laburos: any[] = [];
  laburosCargados: any[] = [];

  laburos2: any[] = [
    {
      id: '6yXgICYfqlQiC1yAnhpP',
      data: {
        cajaFinal: '',
        cajaSena: 'transferencia',
        cliente: 'Milagros',
        comentario: '',
        cuentaFinal: '',
        cuentaNombreFinal: '',
        cuentaNombreSena: 'mili MP',
        cuentaSena: 'PfEwYV0cR606oglwcjO3',
        detalle: 'aaaaaa',
        fecha: '2023-12-11',
        fechaEntrega: '2023-12-16',
        pago: 0,
        precio: 89,
        sena: 200,
        trabajo: 'aaaaaa',
      },
    },
    {
      id: '6yXgICYfqlQiC1yAnhpP',
      data: {
        cajaFinal: '',
        cajaSena: 'transferencia',
        cliente: 'Milagros',
        comentario: '',
        cuentaFinal: '',
        cuentaNombreFinal: '',
        cuentaNombreSena: 'mili MP',
        cuentaSena: 'PfEwYV0cR606oglwcjO3',
        detalle: 'aaaaaa',
        fecha: '2023-12-11',
        fechaEntrega: '2023-12-16',
        pago: 0,
        precio: 10000,
        sena: 200,
        trabajo: 'aaaaaa',
      },
    },
    {
      id: '6yXgICYfqlQiC1yAnhpP',
      data: {
        cajaFinal: '',
        cajaSena: 'transferencia',
        cliente: 'Milagros',
        comentario: '',
        cuentaFinal: '',
        cuentaNombreFinal: '',
        cuentaNombreSena: 'mili MP',
        cuentaSena: 'PfEwYV0cR606oglwcjO3',
        detalle: 'aaaaaa',
        fecha: '2023-12-11',
        fechaEntrega: '2023-12-16',
        pago: 0,
        precio: 6500,
        sena: 200,
        trabajo: 'aaaaaa',
      },
    },
    {
      id: '6yXgICYfqlQiC1yAnhpP',
      data: {
        cajaFinal: '',
        cajaSena: 'transferencia',
        cliente: 'Milagros',
        comentario: '',
        cuentaFinal: '',
        cuentaNombreFinal: '',
        cuentaNombreSena: 'mili MP',
        cuentaSena: 'PfEwYV0cR606oglwcjO3',
        detalle: 'aaaaaa',
        fecha: '2023-12-11',
        fechaEntrega: '2023-12-16',
        pago: 0,
        precio: 7000,
        sena: 200,
        trabajo: 'aaaaaa',
      },
    },
    {
      id: '6yXgICYfqlQiC1yAnhpP',
      data: {
        cajaFinal: '',
        cajaSena: 'transferencia',
        cliente: 'Milagros',
        comentario: '',
        cuentaFinal: '',
        cuentaNombreFinal: '',
        cuentaNombreSena: 'mili MP',
        cuentaSena: 'PfEwYV0cR606oglwcjO3',
        detalle: 'aaaaaa',
        fecha: '2023-12-11',
        fechaEntrega: '2023-12-16',
        pago: 0,
        precio: 8000,
        sena: 200,
        trabajo: 'aaaaaa',
      },
    },
    {
      id: '6yXgICYfqlQiC1yAnhpP',
      data: {
        cajaFinal: '',
        cajaSena: 'transferencia',
        cliente: 'Milagros',
        comentario: '',
        cuentaFinal: '',
        cuentaNombreFinal: '',
        cuentaNombreSena: 'mili MP',
        cuentaSena: 'PfEwYV0cR606oglwcjO3',
        detalle: 'aaaaaa',
        fecha: '2023-12-11',
        fechaEntrega: '2023-12-16',
        pago: 0,
        precio: 1090,
        sena: 200,
        trabajo: 'aaaaaa',
      },
    },
    {
      id: '6yXgICYfqlQiC1yAnhpP',
      data: {
        cajaFinal: '',
        cajaSena: 'transferencia',
        cliente: 'Milagros',
        comentario: '',
        cuentaFinal: '',
        cuentaNombreFinal: '',
        cuentaNombreSena: 'mili MP',
        cuentaSena: 'PfEwYV0cR606oglwcjO3',
        detalle: 'aaaaaa',
        fecha: '2023-12-11',
        fechaEntrega: '2023-12-16',
        pago: 0,
        precio: 1040,
        sena: 200,
        trabajo: 'aaaaaa',
      },
    },
    {
      id: '6yXgICYfqlQiC1yAnhpP',
      data: {
        cajaFinal: '',
        cajaSena: 'transferencia',
        cliente: 'Milagros',
        comentario: '',
        cuentaFinal: '',
        cuentaNombreFinal: '',
        cuentaNombreSena: 'mili MP',
        cuentaSena: 'PfEwYV0cR606oglwcjO3',
        detalle: 'aaaaaa',
        fecha: '2023-12-11',
        fechaEntrega: '2023-12-16',
        pago: 0,
        precio: 31000,
        sena: 200,
        trabajo: 'aaaaaa',
      },
    },
    {
      id: '6yXgICYfqlQiC1yAnhpP',
      data: {
        cajaFinal: '',
        cajaSena: 'transferencia',
        cliente: 'Milagros',
        comentario: '',
        cuentaFinal: '',
        cuentaNombreFinal: '',
        cuentaNombreSena: 'mili MP',
        cuentaSena: 'PfEwYV0cR606oglwcjO3',
        detalle: 'aaaaaa',
        fecha: '2023-12-11',
        fechaEntrega: '2023-12-16',
        pago: 0,
        precio: 33000,
        sena: 200,
        trabajo: 'aaaaaa',
      },
    },

    {
      id: '6yXgICYfqlQiC1yAnhpP',
      data: {
        cajaFinal: '',
        cajaSena: 'transferencia',
        cliente: 'Milagros',
        comentario: '',
        cuentaFinal: '',
        cuentaNombreFinal: '',
        cuentaNombreSena: 'mili MP',
        cuentaSena: 'PfEwYV0cR606oglwcjO3',
        detalle: 'aaaaaa',
        fecha: '2023-12-11',
        fechaEntrega: '2023-12-16',
        pago: 0,
        precio: 11300,
        sena: 200,
        trabajo: 'aaaaaa',
      },
    },
    {
      id: '6yXgICYfqlQiC1yAnhpP',
      data: {
        cajaFinal: '',
        cajaSena: 'transferencia',
        cliente: 'Milagros',
        comentario: '',
        cuentaFinal: '',
        cuentaNombreFinal: '',
        cuentaNombreSena: 'mili MP',
        cuentaSena: 'PfEwYV0cR606oglwcjO3',
        detalle: 'aaaaaa',
        fecha: '2023-12-11',
        fechaEntrega: '2023-12-16',
        pago: 0,
        precio: 11000,
        sena: 200,
        trabajo: 'aaaaaa',
      },
    },
    {
      id: '6yXgICYfqlQiC1yAnhpP',
      data: {
        cajaFinal: '',
        cajaSena: 'transferencia',
        cliente: 'Milagros',
        comentario: '',
        cuentaFinal: '',
        cuentaNombreFinal: '',
        cuentaNombreSena: 'mili MP',
        cuentaSena: 'PfEwYV0cR606oglwcjO3',
        detalle: 'aaaaaa',
        fecha: '2023-12-11',
        fechaEntrega: '2023-12-16',
        pago: 0,
        precio: 6600,
        sena: 200,
        trabajo: 'aaaaaa',
      },
    },
    {
      id: '6yXgICYfqlQiC1yAnhpP',
      data: {
        cajaFinal: '',
        cajaSena: 'transferencia',
        cliente: 'Milagros',
        comentario: '',
        cuentaFinal: '',
        cuentaNombreFinal: '',
        cuentaNombreSena: 'mili MP',
        cuentaSena: 'PfEwYV0cR606oglwcjO3',
        detalle: 'aaaaaa',
        fecha: '2023-12-11',
        fechaEntrega: '2023-12-16',
        pago: 0,
        precio: 5000,
        sena: 200,
        trabajo: 'aaaaaa',
      },
    },
    {
      id: '6yXgICYfqlQiC1yAnhpP',
      data: {
        cajaFinal: '',
        cajaSena: 'transferencia',
        cliente: 'Milagros',
        comentario: '',
        cuentaFinal: '',
        cuentaNombreFinal: '',
        cuentaNombreSena: 'mili MP',
        cuentaSena: 'PfEwYV0cR606oglwcjO3',
        detalle: 'aaaaaa',
        fecha: '2023-12-11',
        fechaEntrega: '2023-12-16',
        pago: 0,
        precio: 3000,
        sena: 200,
        trabajo: 'aaaaaa',
      },
    },
    {
      id: '6yXgICYfqlQiC1yAnhpP',
      data: {
        cajaFinal: '',
        cajaSena: 'transferencia',
        cliente: 'Milagros',
        comentario: '',
        cuentaFinal: '',
        cuentaNombreFinal: '',
        cuentaNombreSena: 'mili MP',
        cuentaSena: 'PfEwYV0cR606oglwcjO3',
        detalle: 'aaaaaa',
        fecha: '2023-12-11',
        fechaEntrega: '2023-12-16',
        pago: 0,
        precio: 10200,
        sena: 200,
        trabajo: 'aaaaaa',
      },
    },

    // Agrega los demás elementos aquí...
  ];

  constructor(private firebase: FirebaseService, private zone: NgZone) {
    const hoy = new Date();
    const haceUnaSemana = new Date();
    haceUnaSemana.setDate(hoy.getDate() - 7);

    this.fechaFin = this.formatoFecha(hoy);
    this.fechaInicio = this.formatoFecha(haceUnaSemana);
  }
  formatoFecha(fecha: Date): string {
    const dia = String(fecha.getUTCDate()).padStart(2, '0');
    const mes = String(fecha.getUTCMonth() + 1).padStart(2, '0');
    const ano = fecha.getUTCFullYear();

    return `${ano}-${mes}-${dia}`;
  }

  async ngOnInit(): Promise<void> {
    this.loading = true;
    this.laburosCargados = await this.firebase.obtener('laburos');
    this.filtrarPorFecha().then(async () => {
      await this.createChart();

      this.zone.run(() => {
        this.loading = false;
      });
    });
  }

  exportPDF(id: string, titulo: string) {
    let chartElement = document.getElementById(id);
    let myChart: echarts.ECharts | undefined;
    if (chartElement) {
      myChart = echarts.getInstanceByDom(chartElement);
      if (myChart) {
        let base64 = myChart.getDataURL({
          type: 'png',
          pixelRatio: 2,
          backgroundColor: '#fff',
        });
        let a = 'Grafico:' + titulo;
        if (base64) {
          let docDefinition: {
            content: (string | { image: string; width: number })[];
            pageOrientation: 'landscape' | 'portrait';
          } = {
            content: [
              a,
              {
                image: base64,
                width: 750,
              },
            ],
            pageOrientation: 'landscape',
          };

          pdfMake.createPdf(docDefinition).download('grafico');
        }
      }
    }
  }

  base64ToBlob(base64: string, type: string): Blob {
    const binStr = atob(base64.split(',')[1]);
    const len = binStr.length;
    const arr = new Uint8Array(len);

    for (let i = 0; i < len; i++) {
      arr[i] = binStr.charCodeAt(i);
    }

    return new Blob([arr], { type: type });
  }

  // async cargar() {
  //   let laburos = await this.firebase.obtener('laburos');
  //   laburos.sort(
  //     (a, b) =>
  //       new Date(a.data.fecha).getTime() - new Date(b.data.fecha).getTime()
  //   );
  //   this.laburos = laburos;
  // }

  async createChart() {
    // Agrupa los trabajos por fecha y suma los precios
    const groupedByDate = this.laburos.reduce((groups, laburo) => {
      const fecha = this.formatoFecha(new Date(laburo.data.fecha));
      if (!groups[fecha]) {
        groups[fecha] = 0;
      }
      groups[fecha] += laburo.data.precio;
      return groups;
    }, {});

    // Crea los datos de la serie
    const seriesData: echarts.SeriesOption = {
      name: 'Ingresos: $',
      type: 'line',
      data: Object.values(groupedByDate),
    };

    // Crea los datos del eje x
    const xAxisData: string[] = Object.keys(groupedByDate);

    // Configura las opciones del gráfico
    this.chartOption1 = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      legend: {
        data: ['Ingresos'],
      },
      xAxis: {
        type: 'category',
        data: xAxisData,
      },
      yAxis: {
        type: 'value',
      },
      series: [seriesData],
    } as echarts.EChartsOption;
  }

  async filtrarPorFecha() {
    this.laburos = this.laburosCargados.filter((laburo) => {
      const fechaLaburo = new Date(laburo.data.fecha);
      return (
        fechaLaburo >= new Date(this.fechaInicio) &&
        fechaLaburo <= new Date(this.fechaFin)
      );
    });
    this.laburos.sort(
      (a, b) =>
        new Date(a.data.fecha).getTime() - new Date(b.data.fecha).getTime()
    );
    await this.createChart();
  }
}
