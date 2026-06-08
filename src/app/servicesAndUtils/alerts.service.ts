import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import Swal, { SweetAlertResult } from 'sweetalert2';

const TOAST_DEFAULTS = {
  toast: true,
  position: 'top-end' as const,
  showConfirmButton: false,
  timer: 3200,
  timerProgressBar: true,
  customClass: { popup: 'ph-toast' },
};

@Injectable({
  providedIn: 'root',
})
export class AlertsService {
  constructor(public router: Router) {}

  public showSuccessMessageAndNavigate(route: string[], message: string, title: string) {
    Swal.fire({ ...TOAST_DEFAULTS, icon: 'success', title, text: message });
    this.router.navigate(route);
  }

  public showSuccessMessage(message: string, title: string) {
    Swal.fire({ ...TOAST_DEFAULTS, icon: 'success', title, text: message });
  }

  public showErrorMessageAndNavigate(route: string[], message: string, title: string) {
    Swal.fire({ ...TOAST_DEFAULTS, icon: 'error', title, text: message, timer: 4000 });
    this.router.navigate(route);
  }

  public showConfirmationMessage(message: string, title: string): Promise<SweetAlertResult<any>> {
    return Swal.fire({
      title,
      text: message,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#C9A84C',
      cancelButtonColor: '#6b6b6b',
      customClass: {
        popup: 'ph-confirm-popup',
        confirmButton: 'ph-btn-confirm',
        cancelButton: 'ph-btn-cancel',
      },
      reverseButtons: true,
    });
  }

  public showVerifyEmailMessage() {
    Swal.fire({
      ...TOAST_DEFAULTS,
      icon: 'warning',
      title: 'Verificá tu email',
      text: 'Revisá tu correo electrónico para activar la cuenta.',
    });
  }

  public showErrorMessage(errorMessage: string) {
    Swal.fire({
      ...TOAST_DEFAULTS,
      icon: 'error',
      title: 'Hubo un problema',
      text: errorMessage,
      timer: 4000,
    });
  }
}
