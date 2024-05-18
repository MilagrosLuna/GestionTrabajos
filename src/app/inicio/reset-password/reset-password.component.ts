import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertsService } from 'src/app/servicesAndUtils/alerts.service';
import { AuthService } from 'src/app/servicesAndUtils/auth.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent {
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
    });
  }
  goBack(): void {
    this.router.navigate(['/login']);
  }
  async onSubmit() {
    if (this.form.valid) {
      let email = this.form.controls['email'].value;
      try {
        await this.authService.resetPassword(email);
        this.alerts.showSuccessMessageAndNavigate(
          ['/login'],
          'siga los pasos para restablecer la contraseña',
          'Email enviado'
        );
      } catch (error: any) {
        this.alerts.showErrorMessage(error.code);
      }
    } else {
      this.alerts.showErrorMessage('Error complete todos los datos!');
    }
  }
}
