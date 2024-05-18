import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import Swal, { SweetAlertResult } from 'sweetalert2';

@Injectable({
  providedIn: 'root',
})
export class AlertsService {
  constructor(public router: Router) {}

  public showSuccessMessageAndNavigate(
    route: string[],
    message: string,
    title: string
  ) {
    Swal.fire({
      icon: 'success',
      title: title,
      text: message,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
    });
    this.router.navigate(route);
  }

  public showSuccessMessage(message: string, title: string) {
    Swal.fire({
      icon: 'success',
      title: title,
      text: message,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
    });
  }

  public showErrorMessageAndNavigate(
    route: string[],
    message: string,
    title: string
  ) {
    Swal.fire({
      icon: 'error',
      title: title,
      text: message,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 4000,
    });
    this.router.navigate(route);
  }

  public showConfirmationMessage(
    message: string,
    title: string
  ): Promise<SweetAlertResult<any>> {
    return Swal.fire({
      title: title,
      text: message,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'No',
    });
  }

  public showVerifyEmailMessage() {
    Swal.fire({
      icon: 'warning',
      title: 'Verifique su email',
      text: 'Por favor, verifique su correo electrónico para continuar.',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
    });
  }

  public showErrorMessage(errorMessage: string) {
    Swal.fire({
      icon: 'error',
      title: 'Hubo un problema',
      text: errorMessage,
      toast: true,
      position: 'top-end',

      showConfirmButton: false,
      timer: 3000,
    });
  }
}
