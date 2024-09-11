import { Component, OnInit } from '@angular/core';
import { FirebaseService } from 'src/app/servicesAndUtils/firebase.service';
import { Router } from '@angular/router';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
(pdfMake as any).vfs = pdfFonts.pdfMake.vfs;

@Component({
  selector: 'app-listado-clientes',
  templateUrl: './listado-clientes.component.html',
  styleUrls: ['./listado-clientes.component.scss'],
})
export class ListadoClientesComponent implements OnInit {
  clientes: any[] = [];
  filteredClientes: any[] = [];
  searchTerm: string = '';
  loading: boolean = false;
  ultimoDoc: any = null;
  clientesPorPagina: number = 8;
  esAdmin: boolean = false;
  admins: any[] = [];
  allClientsLoaded: boolean = false;
  hasMoreClients: boolean = true; 

  constructor(private router: Router, private firebase: FirebaseService) {}

  async ngOnInit(): Promise<void> {
    this.loading = true;
    await this.verificar();
    await this.loadClientes();
    this.loading = false;
  }

  private async loadClientes(): Promise<void> {
    if (this.allClientsLoaded) return;

    const result = await this.firebase.obtenerConPaginacion(
      'clientes',
      'clienteNumero',
      this.clientesPorPagina,
      this.ultimoDoc
    );
    this.clientes = [...this.clientes, ...result.data];
    this.filteredClientes = this.clientes;
    this.ultimoDoc = result.ultimoDoc;
    this.allClientsLoaded = result.data.length === 0; // No more clients to load
    this.hasMoreClients = result.data.length >= this.clientesPorPagina; // Check if there are more clients
  }

  async verificar() {
    this.admins = await this.firebase.obtener('admins');
    let user = localStorage.getItem('logueado');
    this.esAdmin = this.admins.some((admin) => admin.data.id === user);
  }

  async loadMoreClientes() {
    await this.loadClientes();
  }

  async loadAllClientes() {
    this.loading = true;
    this.allClientsLoaded = true;
    this.clientes = await this.firebase.obtener('clientes');
    this.filteredClientes = this.clientes;
    this.loading = false;
  }

  search() {
    if (this.searchTerm) {
      this.filteredClientes = this.clientes.filter((cliente) =>
        Object.values(cliente).some(
          (value) =>
            value &&
            value
              .toString()
              .toLowerCase()
              .includes(this.searchTerm.toLowerCase())
        )
      );
    } else {
      this.filteredClientes = this.clientes;
    }
  }

  buscarLaburos(cliente: any) {
    this.router.navigate(['/home/filtro', cliente.id]);
  }

  modificar(laburo: any) {
    // Add implementation if needed
  }

  borrar(laburo: any) {
    // Add implementation if needed
  }
}
