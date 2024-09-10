import { Component, ViewChild } from '@angular/core';
import { FirebaseService } from 'src/app/servicesAndUtils/firebase.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AlertsService } from 'src/app/servicesAndUtils/alerts.service';
import { Cliente } from 'src/app/clases/cliente';
import { StorageService } from 'src/app/servicesAndUtils/storage.service';
@Component({
  selector: 'app-altacliente',
  templateUrl: './altacliente.component.html',
  styleUrls: ['./altacliente.component.scss'],
})
export class AltaClienteComponent {
  form!: FormGroup;

  constructor(
    private firebase: FirebaseService,
    private alerts: AlertsService,
    private storageService: StorageService
  ) {}

  async ngOnInit(): Promise<void> {
    this.form = new FormGroup({
      clienteNombre: new FormControl('', [Validators.required]),
      clienteApellido: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email]),
      telefono: new FormControl('', [Validators.required]),
      gremio: new FormControl(false),
    });
  }

  async onSubmit() {
    if (this.form.valid) {
      try {
        await this.cargarCliente();
        this.alerts.showSuccessMessage('Cliente cargado correctamente', '');
        this.form.reset();
      } catch (error: any) {
        this.alerts.showErrorMessage('Error al cargar el cliente: ' + error);
      }
    } else {
      this.alerts.showErrorMessage('Complete todos los campos.');
    }
  }

  async cargarCliente() {
    const contadorSnap = await this.firebase.obtenrUno(
      'contadores',
      'clientes'
    );
    let contador = contadorSnap?.data['contador'];

    contador++;

    await this.firebase.modificar(
      { id: 'clientes', data: { contador: contador } },
      'contadores'
    );

    const nuevoCliente = new Cliente(
      contador,
      this.form.value.clienteNombre,
      this.form.value.clienteApellido,
      this.form.value.email,
      this.form.value.telefono,
      this.form.value.gremio
    );

    let clienteObj = JSON.parse(JSON.stringify(nuevoCliente));

    await this.firebase.guardar(clienteObj, 'clientes');

    this.form.reset({});

    this.alerts.showSuccessMessage('', 'Cliente cargado');
  }
}
