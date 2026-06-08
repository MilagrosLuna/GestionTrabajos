import { Component, OnInit } from '@angular/core';
import { FirebaseService } from 'src/app/servicesAndUtils/firebase.service';
import { Router } from '@angular/router';
import { AdminService } from 'src/app/servicesAndUtils/admin.service';

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
  allClientsLoaded: boolean = false;
  hasMoreClients: boolean = true;

  constructor(
    private router: Router,
    private firebase: FirebaseService,
    private adminService: AdminService
  ) {}

  async ngOnInit(): Promise<void> {
    this.loading = true;
    this.adminService.getEsAdmin().subscribe((esAdmin) => {
      this.esAdmin = esAdmin;
    });
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
    this.ultimoDoc = result.ultimoDoc;
    this.allClientsLoaded = result.data.length === 0;
    this.hasMoreClients = result.data.length >= this.clientesPorPagina;
    this.search();
  }

  async loadMoreClientes() {
    await this.loadClientes();
  }

  async loadAllClientes() {
    this.loading = true;
    this.allClientsLoaded = true;
    this.hasMoreClients = false;
    this.clientes = await this.firebase.obtener('clientes');
    this.search();
    this.loading = false;
  }

  search() {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      this.filteredClientes = [...this.clientes];
      return;
    }

    this.filteredClientes = this.clientes.filter((cliente) => {
      const clienteValues = Object.values(cliente.data || {})
        .filter(Boolean)
        .map((value: any) => value.toString().toLowerCase())
        .join(' ');

      return clienteValues.includes(term);
    });
  }

  buscarLaburos(cliente: any) {
    this.router.navigate(['/home/filtro', cliente.id]);
  }
}
