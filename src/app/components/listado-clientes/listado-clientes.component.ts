import { Component, OnInit } from '@angular/core';
import { FirebaseService } from 'src/app/servicesAndUtils/firebase.service';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/servicesAndUtils/auth.service';

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

  constructor(
    private router: Router,
    private firebase: FirebaseService,
    private authService: AuthService
  ) {}

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
    this.ultimoDoc = result.ultimoDoc;
    this.allClientsLoaded = result.data.length === 0;
    this.hasMoreClients = result.data.length >= this.clientesPorPagina;
    this.search();
  }

  async verificar() {
    this.admins = await this.firebase.obtener('admins');
    const uid = this.authService.getCurrentUid();
    this.esAdmin = this.admins.some((admin) => admin.data.id === uid);
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

  modificar(laburo: any) {
    // Add implementation if needed
  }

  borrar(laburo: any) {
    // Add implementation if needed
  }
}
