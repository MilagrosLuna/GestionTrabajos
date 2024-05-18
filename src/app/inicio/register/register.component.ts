import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertsService } from 'src/app/servicesAndUtils/alerts.service';
import { AuthService } from 'src/app/servicesAndUtils/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  form!: FormGroup;
  checkError: boolean = false;
  errorMessage: string = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private alerts: AlertsService
  ) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required]),
      name: new FormControl('', [Validators.required]),
    });
  }
  goToLogin(): void {
    this.router.navigate(['/login']);
  }
  async onSubmit() {
    if (this.form.valid) {
      try {
        let user = await this.authService.register(this.form.value);
        this.alerts.showSuccessMessageAndNavigate(
          ['/login'],
          'Bienvenido a nuestro portal',
          '¡Registro exitoso!'
        );
      } catch (error: any) {
        this.checkError = true;
        switch (error.code) {
          case 'auth/email-already-in-use':
            this.errorMessage =
              'Ya se encuentra un usuario registrado con ese email';
            break;
          default:
            this.errorMessage = 'Hubo un problema al registrar!';
            break;
        }
        this.alerts.showErrorMessage(this.errorMessage);
      }
    } else {
      this.alerts.showErrorMessage('Error complete todos los datos!');
    }
  }
}
