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

  constructor(private firebase: FirebaseService, private zone: NgZone) {
    const hoy = new Date();
    const haceUnaSemana = new Date();
    haceUnaSemana.setDate(hoy.getDate() - 7);

    this.fechaFin = this.formatoFecha(hoy);
    this.fechaInicio = this.formatoFecha(haceUnaSemana);
  }

  formatoFecha(fecha: Date): string {
    const ano = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
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

  async createChart() {
    const groupedByDate = this.laburos.reduce((groups, laburo) => {
      const fecha = this.formatoFecha(new Date(laburo.data.fecha));
      if (!groups[fecha]) {
        groups[fecha] = 0;
      }
      groups[fecha] += laburo.data.precio;
      return groups;
    }, {});

    const seriesData: echarts.SeriesOption = {
      name: 'Ingresos',
      type: 'line',
      data: Object.values(groupedByDate),
    };

    const xAxisData: string[] = Object.keys(groupedByDate);

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
    if (this.fechaInicio > this.fechaFin) {
      return;
    }
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
