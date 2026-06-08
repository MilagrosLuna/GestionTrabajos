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

  private readonly MAX_ATTEMPTS = 5;
  private readonly WINDOW_MS = 15 * 60 * 1000;
  private readonly RATE_KEY = 'login_failed_attempts';

  private isRateLimited(): boolean {
    const now = Date.now();
    const raw = sessionStorage.getItem(this.RATE_KEY);
    const attempts: number[] = raw ? JSON.parse(raw) : [];
    const recent = attempts.filter((t) => now - t < this.WINDOW_MS);
    if (recent.length >= this.MAX_ATTEMPTS) {
      const oldest = Math.min(...recent);
      const waitMs = this.WINDOW_MS - (now - oldest);
      const waitMin = Math.ceil(waitMs / 60000);
      this.alerts.showErrorMessage(`Demasiados intentos fallidos. Intentá de nuevo en ${waitMin} minuto${waitMin !== 1 ? 's' : ''}.`);
      return true;
    }
    return false;
  }

  private recordFailedAttempt(): void {
    const now = Date.now();
    const raw = sessionStorage.getItem(this.RATE_KEY);
    const attempts: number[] = raw ? JSON.parse(raw) : [];
    const recent = attempts.filter((t) => now - t < this.WINDOW_MS);
    recent.push(now);
    sessionStorage.setItem(this.RATE_KEY, JSON.stringify(recent));
  }

  private clearRateLimit(): void {
    sessionStorage.removeItem(this.RATE_KEY);
  }

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
        let usuarios = await this.firebase.obtenerDonde(
          'usuarios',
          'uid',
          user.user.uid
        );

        // Documento huérfano: existe en Firebase Auth pero no en Firestore.
        if (usuarios.length === 0) {
          await this.firebase.guardarConId(
            {
              email: user.user.email,
              aprobado: false,
              uid: user.user.uid,
              nombre: user.user.displayName || '',
            },
            'usuarios',
            user.user.uid
          );
          usuarios = await this.firebase.obtenerDonde('usuarios', 'uid', user.user.uid);
        }

        if (usuarios.length > 0) {
          const docUsuario = usuarios[0];

          // Si el ID del documento no coincide con el UID, las reglas de Firestore fallan.
          // isApproved() busca get(/usuarios/{uid}) por ID de documento, no por campo.
          // Migrar al ID correcto para que las reglas funcionen.
          if (docUsuario.id !== user.user.uid) {
            await this.firebase.guardarConId(docUsuario.data, 'usuarios', user.user.uid);
            // Refetch para leer el documento recién creado con el ID correcto
            const migrated = await this.firebase.obtenerUno('usuarios', user.user.uid);
            if (migrated) usuarios = [migrated];
          }

          if (docUsuario.data.aprobado) {
            sessionStorage.setItem('logueado', user.user.uid);
            this.authService.iniciarEscuchaAprobacion(user.user.uid);
            this.alerts.showSuccessMessageAndNavigate(
              ['/home/alta'],
              '¡Inicio de sesión exitoso!',
              'Bienvenido'
            );
          } else {
            await this.authService.logout();
            this.alerts.showErrorMessage('Tu cuenta aún no ha sido aprobada.');
          }
        }
      } else {
        await this.authService.logout();
        this.alerts.showVerifyEmailMessage();
      }
    } catch (error: any) {
      this.alerts.showErrorMessage(error?.message || 'No se pudo validar la cuenta.');
    }
  }

  goToReset() {
    this.router.navigate(['/reset']);
  }

  async onSubmit() {
    if (this.isRateLimited()) return;
    if (this.form.valid) {
      try {
        let user = await this.authService.login(this.form.value);
        this.clearRateLimit();
        await this.verificarMails(user);
      } catch (error: any) {
        this.recordFailedAttempt();
        this.checkError = true;
        switch (error.code) {
          case 'auth/invalid-email':
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/internal-error':
          case 'auth/too-many-requests':
          case 'auth/invalid-login-credentials':
          case 'auth/invalid-credential':
            this.errorMessage = 'Credenciales inválidas';
            break;
          default:
            this.errorMessage = error.message;
            break;
        }
        this.alerts.showErrorMessage(this.errorMessage);
      }
    } else {
      this.alerts.showErrorMessage('Error: complete todos los datos.');
    }
  }
}
