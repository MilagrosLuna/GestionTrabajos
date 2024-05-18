import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertsService } from 'src/app/servicesAndUtils/alerts.service';
import { AuthService } from 'src/app/servicesAndUtils/auth.service';
import { FirebaseService } from 'src/app/servicesAndUtils/firebase.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  form!: FormGroup;
  checkError: boolean = false;
  errorMessage: string = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private alerts: AlertsService,
    private firebase: FirebaseService
  ) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required]),
    });
  }
  goToRegister(): void {
    this.router.navigate(['/register']);
  }
  async verificarMails(user: any) {
    try {
      if (user.user.emailVerified) {
        const usuario = await this.firebase.obtenerDonde(
          'usuarios',
          'uid',
          user.user.uid
        );
        if (usuario.length > 0 && usuario[0].data.aprobado) {
          localStorage.setItem('logueado', user.user.uid);
          this.alerts.showSuccessMessageAndNavigate(
            ['/home/alta'],
            '¡Inicio de sesión exitoso!',
            'Bienvenido'
          );
        } else {
          await this.authService.logout();
          this.alerts.showErrorMessage('Tu cuenta aún no ha sido aprobada.');
        }
      } else {
        await this.authService.logout();
        this.alerts.showVerifyEmailMessage();
      }
    } catch (error: any) {
      this.alerts.showErrorMessage(error.text);
    }
  }
  goToReset() {
    this.router.navigate(['/reset']);
  }

  async onSubmit() {
    if (this.form.valid) {
      try {
        let user = await this.authService.login(this.form.value);
        await this.verificarMails(user);
      } catch (error: any) {
        this.checkError = true;
        switch (error.code) {
          case 'auth/invalid-email':
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/internal-error':
          case 'auth/too-many-requests':
          case 'auth/invalid-login-credentials':
          case 'auth/invalid-credential':
            this.errorMessage = `Credenciales inválidas`;
            break;
          default:
            this.errorMessage = error.message;
            break;
        }
        this.alerts.showErrorMessage(this.errorMessage);
      }
    } else {
      this.alerts.showErrorMessage('Error complete todos los datos!');
    }
  }
}
